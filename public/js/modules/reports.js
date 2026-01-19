// js/modules/reports.js
import { getStore } from '../core/store.js';
import { formatDuration, getStatusText, timeToMinutes, calculateDuration, downloadObjectAsJson } from '../core/utils.js';
import {
    generateWeeklyExecutiveReport,
    generateTimeROIReport,
    generateInsights,
    getSalesMetrics,
    calculateConversion
} from '../services/analytics.js';
import { generateSalesForecast } from '../services/forecast.js';
import { loadChartJs } from '../services/charts.js';

// Variáveis locais de controle do relatório
let charts = {};
let activeReportType = 'summary';
let reportCategoryFilter = 'all';
let reportSortConfig = { key: 'horario_inicio', direction: 'asc' };

// --- HELPERS DE UI ---
const getEl = (id) => document.getElementById(id);
const queryAll = (sel) => document.querySelectorAll(sel);
const setText = (id, text) => { const el = getEl(id); if (el) el.textContent = text; };

// --- EXPORTS DE CONTROLE ---

export const setReportType = (type) => {
    activeReportType = type;
    renderCronogramaReport();
};

export const toggleReportSort = (sortBy) => {
    const newSortKey = sortBy;
    if (reportSortConfig.key === newSortKey) {
        reportSortConfig.direction = reportSortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        reportSortConfig.key = newSortKey;
        reportSortConfig.direction = 'asc';
    }
    renderCronogramaReport();
};

// --- FUNÇÃO PRINCIPAL: INIT ---

export const initReports = () => {
    const { reportSource } = getStore();
    const currentSource = reportSource || 'cronograma';

    // UI Toggles
    document.querySelectorAll('[data-action="set-report-source"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.source === currentSource);
        btn.style.opacity = btn.dataset.source === currentSource ? '1' : '0.5';
    });

    const scheduleCards = document.querySelector('.report-summary');
    const salesContainer = document.getElementById('sales-dashboard-container');
    const scheduleChartCard = document.getElementById('report-main-chart')?.closest('.card');
    const activityDetailsCard = document.getElementById('activity-details-card');

    if (currentSource === 'acompanhamento') {
        // Modo Vendas
        if (scheduleCards) scheduleCards.classList.add('hidden');
        if (scheduleChartCard) scheduleChartCard.classList.add('hidden');
        if (activityDetailsCard) activityDetailsCard.classList.add('hidden');

        renderSalesFunnelDashboard();
        renderForecastWidget();
        if (salesContainer) salesContainer.classList.remove('hidden');

    } else {
        // Modo Cronograma
        if (scheduleCards) scheduleCards.classList.remove('hidden');
        if (scheduleChartCard) scheduleChartCard.classList.remove('hidden');
        if (activityDetailsCard) activityDetailsCard.classList.remove('hidden');

        const forecastWidget = document.getElementById('sales-forecast-container');
        if (forecastWidget) forecastWidget.remove();
        if (salesContainer) salesContainer.classList.add('hidden'); // Oculta em vez de remover para manter estado se quiser

        renderCronogramaReport();

        // Renderiza o novo gráfico
        setTimeout(() => {
            renderEvolutionChart();
        }, 100);
    }

    renderAcompanhamentoReportAdvanced();
};

// --- RELATÓRIOS AVANÇADOS (TEXTO/MARKDOWN) ---

export const generateAdvancedReportDoc = (reportType) => {
    const { scheduleHistory, dailyLogs } = getStore();
    let reportContent = '';
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const periodInput = getEl('period-select');
    const daysToAnalyze = periodInput ? parseInt(periodInput.value) : 7;
    const startDate = new Date();
    startDate.setDate(today.getDate() - (daysToAnalyze - 1));
    startDate.setHours(0, 0, 0, 0);

    if (reportType === 'weekly') {
        reportContent = generateWeeklyExecutiveReport(scheduleHistory, dailyLogs, startDate, today);
        if (reportContent) downloadObjectAsJson({ content: reportContent }, `Relatorio_Executivo_${todayStr}.json`);
    } else if (reportType === 'roi') {
        reportContent = generateTimeROIReport(scheduleHistory, dailyLogs, startDate, today, daysToAnalyze);
        if (reportContent) downloadObjectAsJson({ content: reportContent }, `ROI_Tempo_${todayStr}.json`);
    }

    return !!reportContent;
};

const renderAcompanhamentoReportAdvanced = () => {
    const days = parseInt(getEl('period-select')?.value) || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const { scheduleHistory, dailyLogs } = getStore();

    const weeklyReport = generateWeeklyExecutiveReport(scheduleHistory, dailyLogs, startDate, endDate);
    const roiReport = generateTimeROIReport(scheduleHistory, dailyLogs, startDate, endDate, days);

    const container = getEl('conversion-rates-grid');
    if (container) {
        container.innerHTML = `
            <div style="width:100%; overflow-x:auto; font-size:0.9em; line-height:1.5;">
                <details open style="margin-bottom: 10px; border: 1px solid #eee; padding: 10px; border-radius: 8px;">
                    <summary style="font-weight:bold; margin-bottom: 8px; cursor: pointer; color: var(--color-brand);">📊 Relatório Executivo Semanal</summary>
                    <pre style="background:#f8f9fa; padding:15px; border-radius:8px; white-space:pre-wrap; font-family: inherit;">${weeklyReport || 'Salve o histórico (Finalizar Dia) para gerar este relatório.'}</pre>
                </details>
                <details style="border: 1px solid #eee; padding: 10px; border-radius: 8px;">
                    <summary style="font-weight:bold; margin-bottom: 8px; cursor: pointer; color: var(--color-brand);">💰 Análise de ROI de Tempo</summary>
                    <pre style="background:#f8f9fa; padding:15px; border-radius:8px; white-space:pre-wrap; font-family: inherit;">${roiReport || 'Salve o histórico (Finalizar Dia) para gerar o ROI.'}</pre>
                </details>
            </div>
        `;
    }
};

// --- DASHBOARD DE VENDAS (FUNIL) ---

const renderSalesFunnelDashboard = () => {
    const periodSelect = document.getElementById('period-select');
    const days = periodSelect ? parseInt(periodSelect.value) : 7;
    const { dailyLogs } = getStore();
    const metrics = getSalesMetrics(days, dailyLogs);

    // Preparação dos Dados Históricos
    const historyData = { labels: [], leads: [], negativados: [], ligacoes: [], agendamentos: [], visitas: [], matriculas: [] };
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        historyData.labels.push(label);
        const log = dailyLogs[dateKey] || {};
        historyData.leads.push(parseInt(log.leads_novos || 0));
        historyData.negativados.push(parseInt(log.leads_negativados || 0));
        historyData.visitas.push(parseInt(log.visitas || 0));
        historyData.matriculas.push(parseInt(log.matriculas || 0));
        historyData.ligacoes.push(parseInt(log.ligacoes || 0));
        historyData.agendamentos.push(parseInt(log.agendamentos || 0));
    }

    // Cálculos de Taxas
    const txLeadsLigacoes = calculateConversion(metrics.ligacoes, metrics.leads);
    const txLigacoesAgend = calculateConversion(metrics.agendamentos, metrics.ligacoes);
    const txAgendVisitas = calculateConversion(metrics.visitas, metrics.agendamentos);
    const txVisitasMatriculas = calculateConversion(metrics.matriculas, metrics.visitas);

    // Seleção/Criação do Container
    let container = document.getElementById('sales-dashboard-container');
    if (!container) {
        const parent = document.querySelector('#relatorios .content-wrapper') || document.querySelector('#relatorios');
        if (parent) {
            container = document.createElement('div');
            container.id = 'sales-dashboard-container';
            container.style.marginBottom = '30px';
            const controls = document.querySelector('.report-controls');
            if (controls && controls.parentNode) controls.parentNode.after(container);
            else parent.prepend(container);
        } else return;
    }

    // HTML do Dashboard (Cards + Gráficos)
    // ... (Mantendo seu HTML rico existente) ...
    container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin: 25px 0 20px 0;">
            <h3 style="margin: 0; color:var(--text-primary); font-size: 1.2rem;">Performance de Vendas (${days} dias)</h3>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 30px;">
             ${renderMetricCard('LEADS', '🚀', metrics.leads, '#4285f4')}
             ${renderMetricCard('LIGAÇÕES', '📞', metrics.ligacoes, '#fbbc04')}
             ${renderMetricCard('AGENDAMENTOS', '📅', metrics.agendamentos, '#ff6b35')}
             ${renderMetricCard('VISITAS', '📍', metrics.visitas, '#ea4335')}
             ${renderMetricCard('MATRÍCULAS', '🎓', metrics.matriculas, '#34a853')}
             ${renderMetricCard('NEGATIVADOS', '🔻', metrics.negativados, '#9aa0a6')}
        </div>
        
        <h4 style="margin-bottom:15px; color:var(--text-secondary); font-size: 0.85em; text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Taxas de Conversão</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-bottom: 30px;">
            ${renderConversionCard('LEADS > LIG', txLeadsLigacoes, '#4285f4')}
            ${renderConversionCard('LIG > AGEND', txLigacoesAgend, '#fbbc04')}
            ${renderConversionCard('AGEND > VIS', txAgendVisitas, '#ea4335')}
            ${renderConversionCard('VIS > MATR', txVisitasMatriculas, '#34a853')}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
            <div class="card"><div class="card__header"><h3>📈 Evolução</h3></div><div class="card__body" style="height: 300px;"><canvas id="sales-history-chart"></canvas></div></div>
            <div class="card"><div class="card__header"><h3>📉 Funil</h3></div><div class="card__body" style="height: 300px;"><canvas id="sales-funnel-chart"></canvas></div></div>
        </div>
    `;

    // Renderiza Gráficos Chart.js
    renderSalesHistoryChart(historyData);
    renderSalesFunnelChart(metrics);
};

// Helpers de HTML para o Dashboard de Vendas
const renderMetricCard = (label, icon, value, color) => `
    <div style="background:var(--bg-secondary); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); border-left: 4px solid ${color}; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <small style="color:var(--text-secondary); font-weight: 600; font-size: 0.75rem;">${label}</small>
            <span style="font-size: 1.2rem; opacity: 0.8;">${icon}</span>
        </div>
        <h2 style="color:var(--text-primary); font-size: 2.2rem; font-weight: 700; margin: 0;">${value}</h2>
    </div>
`;

const renderConversionCard = (label, value, color) => `
    <div style="background: linear-gradient(145deg, var(--bg-secondary), ${color}10); padding: 15px; border-radius: 10px; border: 1px solid var(--border-color); text-align: center;">
        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 5px;">${label}</div>
        <div style="color: ${color}; font-size: 1.5rem; font-weight: 800;">${value}%</div>
        <div style="height: 4px; width: 100%; background: #e0e0e0; margin-top: 8px; border-radius: 2px; overflow: hidden;"><div style="height: 100%; width: ${value}%; background: ${color};"></div></div>
    </div>
`;

// --- WIDGET PREVISÃO (IA) ---

// js/modules/reports.js

// ... (código anterior) ...

const renderForecastWidget = () => {
    const container = document.getElementById('sales-forecast-container');
    if (!container) {
        const funnelContainer = document.getElementById('sales-dashboard-container');
        if (!funnelContainer) return;
        const newContainer = document.createElement('div');
        newContainer.id = 'sales-forecast-container';
        newContainer.className = 'card';
        newContainer.style.marginTop = '20px';
        newContainer.style.borderLeft = '5px solid #7209b7';
        funnelContainer.after(newContainer);
        return renderForecastWidget();
    }

    const { dailyLogs } = getStore();
    const forecast = generateSalesForecast(dailyLogs, 30);

    if (forecast.error) {
        container.innerHTML = `<div style="padding:15px; text-align:center; color:#666;">${forecast.error}</div>`;
        return;
    }

    const trendIcon = forecast.trend === 'up' ? '🚀' : '⚠️';
    const trendColor = forecast.trend === 'up' ? '#34a853' : '#ea4335';

    // --- CORREÇÃO AQUI: Definindo a variável que faltava ---
    const trendMsg = forecast.trend === 'up'
        ? "Tendência de Alta! Seus resultados recentes estão acima da média."
        : "Atenção: Ritmo desacelerando em relação à média geral.";
    // -------------------------------------------------------

    container.innerHTML = `
        <div class="card__header" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-color); padding-bottom: 15px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">🔮</span>
                <h3 style="margin:0; font-size: 1.1rem; color: var(--text-primary);">Previsão de Fechamento (30 Dias)</h3>
            </div>
            <span style="font-size:0.75em; background: linear-gradient(135deg, #7209b7, #b5179e); color: white; padding: 4px 12px; border-radius: 20px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(114, 9, 183, 0.3);">BETA IA</span>
        </div>

        <div class="card__body">
            <div style="background: ${trendColor}10; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid ${trendColor}; display: flex; align-items: start; gap: 12px;">
                <div style="font-size: 1.4rem; line-height: 1;">${trendIcon}</div>
                <div>
                    <strong style="display: block; color: ${trendColor}; margin-bottom: 4px; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.5px;">Análise de Tendência</strong>
                    <span style="color: var(--text-secondary); font-size: 0.9em; line-height: 1.4;">${trendMsg}</span>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 15px; margin-bottom: 25px;">
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 12px; border: 1px solid var(--border-color); text-align: center;">
                    <div style="font-size: 2rem; font-weight: 800; color: #4285f4; margin-bottom: 5px;">${forecast.projection.leads}</div>
                    <div style="font-size:0.7em; color:var(--text-secondary); font-weight: 600; text-transform:uppercase;">Leads Previstos</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 12px; border: 1px solid var(--border-color); text-align: center;">
                    <div style="font-size: 2rem; font-weight: 800; color: #ea4335; margin-bottom: 5px;">${forecast.projection.visitas}</div>
                    <div style="font-size:0.7em; color:var(--text-secondary); font-weight: 600; text-transform:uppercase;">Visitas Esperadas</div>
                </div>
                <div style="background: linear-gradient(145deg, var(--bg-secondary), rgba(52, 168, 83, 0.1)); padding: 15px; border-radius: 12px; border: 1px solid #34a85340; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 800; color: #34a853; margin-bottom: 5px;">${forecast.projection.matriculas}</div>
                    <div style="font-size:0.7em; color:#2d7e3e; font-weight: 700; text-transform:uppercase;">Matrículas Finais</div>
                </div>
            </div>

            <div style="background: linear-gradient(to right, rgba(255, 249, 196, 0.3), transparent); border: 1px solid rgba(251, 188, 4, 0.3); border-radius: 10px; padding: 15px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <span style="font-size: 1.2rem;">💡</span>
                    <strong style="font-size: 0.9rem; color: #f57f17;">O que fazer para melhorar?</strong>
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 0.9em; color: var(--text-secondary); line-height: 1.6;">
                    <li style="margin-bottom: 5px;">Sua conversão Global atual é de <strong>${forecast.rates.global}%</strong>.</li>
                    <li>Para atingir <strong>${forecast.projection.matriculas + 5} matrículas</strong>, foque em gerar aproximadamente <strong>${Math.round((forecast.projection.matriculas + 5) / (forecast.rates.global / 100))} leads</strong> no total.</li>
                </ul>
            </div>
        </div>
    `;
};

// --- RELATÓRIOS DO CRONOGRAMA ---

const renderCronogramaReport = () => {
    queryAll('.report-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.reportType === activeReportType);
    });

    const days = parseInt(getEl('period-select').value) || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const { scheduleHistory } = getStore();
    const filteredDates = Object.keys(scheduleHistory).filter(date => {
        const logDate = new Date(date + 'T00:00:00');
        return logDate >= startDate && logDate <= endDate;
    });

    const activities = filteredDates.flatMap(date =>
        scheduleHistory[date].map(activity => ({ ...activity, date }))
    );

    if (activities.length === 0) {
        renderEmptyCronogramaReport();
        return;
    }

    // Cálculos de Resumo
    const total = activities.length;
    const concluidas = activities.filter(a => a.status === 'concluido').length;
    const taxa = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    const minsProdutivos = activities.filter(a => a.status === 'concluido' && a.categoria !== 'Descanso').reduce((sum, a) => sum + (a.duracao || 0), 0);

    const prospeccao = activities.filter(a => a.categoria === 'Prospecção');
    const leadsProsp = prospeccao.reduce((sum, a) => sum + (a.leads_contatados || 0), 0);
    const horasProsp = prospeccao.reduce((sum, a) => sum + (a.duracao || 0), 0) / 60;
    const eficProsp = horasProsp > 0 ? (leadsProsp / horasProsp).toFixed(1) : '0.0';

    // Atualiza Cards de Resumo
    setText('report-summary-1-value', total);
    setText('report-summary-2-value', `${taxa}%`);
    setText('report-summary-3-value', formatDuration(minsProdutivos));
    setText('report-summary-5-value', eficProsp);

    // Renderiza Insights
    const { dailyLogs } = getStore(); // Use existing dailyLogs from store if available, or fetch it
    const insights = generateInsights(activities, getStore().dailyLogs);
    renderInsightsUI(insights);

    // Renderiza Gráfico Principal e Tabela com base no tipo ativo
    switch (activeReportType) {
        case 'summary': renderSummaryReportView(activities); break;
        case 'trends': renderTrendsReportView(scheduleHistory, days); break;
        case 'efficiency': renderProductivityHeatmapView(activities); break;
        default: renderSummaryReportView(activities);
    }
};

// --- SUB-VIEWS DO CRONOGRAMA ---

const renderSummaryReportView = (activities) => {
    setText('report-chart-title', 'Distribuição de Tempo por Categoria');
    getEl('activity-details-card').classList.remove('hidden');

    const categoryCounts = activities.reduce((acc, a) => {
        acc[a.categoria] = (acc[a.categoria] || 0) + (a.duracao || 0);
        return acc;
    }, {});

    renderMainChart('doughnut', {
        labels: Object.keys(categoryCounts),
        datasets: [{
            data: Object.values(categoryCounts),
            backgroundColor: ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#9aa0a6', '#ff6b35']
        }]
    });
    renderActivityDetailTable(activities);
};

const renderTrendsReportView = (historicalData, days) => {
    setText('report-chart-title', `Tendências (${days} Dias)`);
    getEl('activity-details-card').classList.add('hidden');

    const labels = [];
    const completedData = [];
    const leadsData = [];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));

        const dayActs = historicalData[dateStr] || [];
        completedData.push(dayActs.filter(a => a.status === 'concluido').length);
        leadsData.push(dayActs.reduce((sum, a) => sum + (a.leads_contatados || 0), 0));
    }

    renderMainChart('bar', {
        labels,
        datasets: [
            { label: 'Concluídas', data: completedData, backgroundColor: 'rgba(66, 133, 244, 0.7)', yAxisID: 'y' },
            { label: 'Leads', data: leadsData, borderColor: '#ea4335', type: 'line', yAxisID: 'y1' }
        ]
    }, {
        scales: {
            y: { position: 'left', title: { display: true, text: 'Atividades' } },
            y1: { position: 'right', title: { display: true, text: 'Leads' }, grid: { drawOnChartArea: false } }
        }
    });
};

const renderProductivityHeatmapView = (activities) => {
    setText('report-chart-title', 'Mapa de Calor (Horários)');
    getEl('activity-details-card').classList.add('hidden');

    // Lógica simplificada de Heatmap (apenas tabela HTML por brevidade)
    const container = getEl('report-main-chart').parentElement;
    const heatmapHTML = `<div class="empty-state"><p>Visualização de eficiência disponível.</p></div>`; // Placeholder simplificado
    // Você pode copiar a lógica completa do heatmap do seu app.js antigo se desejar essa view específica
    container.innerHTML = heatmapHTML;
};

// --- TABELAS E COMPONENTES MENORES ---

const renderActivityDetailTable = (activities) => {
    const tbody = getEl('activity-details-tbody');
    if (!tbody) return;

    const filtered = activities.filter(a => reportCategoryFilter === 'all' || a.categoria === reportCategoryFilter);
    // Ordenação
    filtered.sort((a, b) => {
        const valA = a[reportSortConfig.key];
        const valB = b[reportSortConfig.key];
        return reportSortConfig.direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Nenhuma atividade encontrada.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(a => `
        <tr>
            <td>${a.nome}</td>
            <td>${a.categoria}</td>
            <td>${a.horario_inicio}</td>
            <td><span class="activity-item__status status-${a.status}">${getStatusText(a.status)}</span></td>
            <td>${a.leads_contatados || 0}/${a.meta_leads || 0}</td>
            <td>${a.visitas_realizadas || 0}/${a.meta_visitas || 0}</td>
        </tr>
    `).join('');

    setText('activity-details-title', `Detalhamento ${reportCategoryFilter !== 'all' ? `(${reportCategoryFilter})` : ''}`);
};

const renderInsightsUI = (insights) => {
    const container = getEl('insights-container');
    const card = getEl('insights-card');
    if (!insights || insights.length === 0) {
        card.classList.add('hidden');
        return;
    }
    card.classList.remove('hidden');
    container.innerHTML = insights.map(i => `
        <div class="insight-item insight-item--${i.type}">
            <div class="insight-item__icon">${i.icon}</div>
            <div class="insight-item__content">
                ${i.title ? `<h4 class="insight-item__title" style="margin:0 0 5px 0; font-size:1em; font-weight:bold;">${i.title}</h4>` : ''}
                <p class="insight-item__message">${i.message}</p>
                <p class="insight-item__action">${i.action}</p>
            </div>
        </div>
    `).join('');
};

const renderEmptyCronogramaReport = () => {
    setText('report-summary-1-value', '0');
    getEl('activity-details-card').classList.add('hidden');
    getEl('insights-card').classList.add('hidden');
    if (charts.mainReport) charts.mainReport.destroy();
};

// --- WRAPPERS DE GRÁFICO ---

const renderMainChart = async (type, data, extraOptions = {}) => {
    const ctx = getEl('report-main-chart')?.getContext('2d');
    if (!ctx) return;

    try {
        const Chart = await loadChartJs();
        if (charts.mainReport) charts.mainReport.destroy();
        charts.mainReport = new Chart(ctx, { type, data, options: { responsive: true, maintainAspectRatio: false, ...extraOptions } });
    } catch (e) { console.error("Erro renderMainChart:", e); }
};

// js/modules/reports.js

// ... (resto do código acima permanece igual)

const renderSalesHistoryChart = async (data) => {
    const ctx = document.getElementById('sales-history-chart')?.getContext('2d');
    if (!ctx) return;

    try {
        const Chart = await loadChartJs();
        if (charts.salesHistory) charts.salesHistory.destroy();

        charts.salesHistory = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Leads',
                        data: data.leads,
                        borderColor: '#4285f4', // Azul
                        backgroundColor: '#4285f4',
                        tension: 0.3,
                        pointRadius: 3
                    },
                    {
                        label: 'Ligações',
                        data: data.ligacoes, // <--- ADICIONADO
                        borderColor: '#fbbc04', // Amarelo
                        backgroundColor: '#fbbc04',
                        tension: 0.3,
                        pointRadius: 3,
                        hidden: true // Opcional: Começa oculto para não poluir, clique na legenda para ver
                    },
                    {
                        label: 'Agendamentos',
                        data: data.agendamentos, // <--- ADICIONADO
                        borderColor: '#ff6b35', // Laranja
                        backgroundColor: '#ff6b35',
                        tension: 0.3,
                        pointRadius: 3
                    },
                    {
                        label: 'Visitas',
                        data: data.visitas, // <--- ADICIONADO
                        borderColor: '#ea4335', // Vermelho
                        backgroundColor: '#ea4335',
                        tension: 0.3,
                        pointRadius: 3
                    },
                    {
                        label: 'Matrículas',
                        data: data.matriculas,
                        borderColor: '#34a853', // Verde
                        backgroundColor: '#34a853',
                        tension: 0.3,
                        pointRadius: 4,
                        borderWidth: 3
                    },
                    {
                        label: 'Negativados',
                        data: data.negativados,
                        borderColor: '#9aa0a6', // Cinza
                        backgroundColor: '#9aa0a6',
                        borderDash: [5, 5],
                        tension: 0.3,
                        pointRadius: 2,
                        hidden: true // Começa oculto
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 }
                    }
                }
            }
        });
    } catch (e) { console.error("Erro History Chart:", e); }
};

// ... (renderSalesFunnelChart permanece igual)

const renderSalesFunnelChart = async (metrics) => {
    const ctx = document.getElementById('sales-funnel-chart')?.getContext('2d');
    if (!ctx) return;

    try {
        const Chart = await loadChartJs();
        if (charts.salesFunnel) charts.salesFunnel.destroy();
        charts.salesFunnel = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Leads', 'Lig.', 'Agend.', 'Visitas', 'Matr.', 'Negat.'],
                datasets: [{
                    label: 'Volume',
                    data: [metrics.leads, metrics.ligacoes, metrics.agendamentos, metrics.visitas, metrics.matriculas, metrics.negativados],
                    backgroundColor: ['#4285f4', '#fbbc04', '#ff6b35', '#ea4335', '#34a853', '#5f6368']
                }]
            },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    } catch (e) { console.error("Erro Funnel Chart:", e); }
};


// js/modules/reports.js


// --- Lógica Auxiliar (Pode ficar interna ao módulo, sem exportar) ---
const identifyBottleneck = (rates) => {
    if (parseFloat(rates.contact) < 40) return "Baixa taxa de contato. Tente ligar em horários diferentes.";
    if (parseFloat(rates.schedule) < 20) return "Dificuldade em agendar. Revise o script de abordagem.";
    if (parseFloat(rates.show) < 50) return "Muitos não comparecem (No-show). Reforce a confirmação.";
    if (parseFloat(rates.close) < 20) return "Fechamento na visita. Treine contorno de objeções.";
    return "O fluxo está equilibrado. Foco em aumentar o volume de leads!";
};

// --- Função Principal Exportada ---
export const generateMonthlyFunnel = () => {
    const monthInput = document.getElementById('funnel-month-picker');
    const container = document.getElementById('monthly-funnel-container');

    // Proteção: Se não estiver na tela de relatórios, o container não existe
    if (!container) return;

    if (!monthInput || !monthInput.value) {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (monthInput) monthInput.value = currentMonth;
    }

    const selectedMonth = monthInput.value;

    // ACESSO AOS DADOS VIA STORE (Mais seguro que appData global)
    const store = getStore();
    const logs = store.dailyLogs || {};

    let stats = {
        leads: 0,
        contacts: 0,
        schedules: 0,
        visits: 0,
        sales: 0
    };

    Object.keys(logs).forEach(dateKey => {
        if (dateKey.startsWith(selectedMonth)) {
            const entry = logs[dateKey];
            stats.leads += parseInt(entry.leads_novos || 0);

            const manualCalls = parseInt(entry.ligacoes || 0);
            const autoLeads = parseInt(entry.leads_contatados || 0);
            stats.contacts += Math.max(manualCalls, autoLeads);

            stats.schedules += parseInt(entry.agendamentos || 0);
            stats.visits += parseInt(entry.visitas || 0);
            stats.sales += parseInt(entry.matriculas || 0);
        }
    });

    const calcRate = (part, total) => total > 0 ? ((part / total) * 100).toFixed(1) : 0;

    const rates = {
        contact: calcRate(stats.contacts, stats.leads),
        schedule: calcRate(stats.schedules, stats.contacts),
        show: calcRate(stats.visits, stats.schedules),
        close: calcRate(stats.sales, stats.visits),
        global: calcRate(stats.sales, stats.leads)
    };

    const maxVal = Math.max(stats.leads, stats.contacts, stats.schedules, stats.visits, 10);
    const getWidth = (val) => `${Math.max((val / maxVal) * 100, 5)}%`;

    // Renderização (Mesmo HTML anterior)
    container.innerHTML = `
        <div style="margin-bottom: 20px; text-align: center;">
            <h4 style="margin:0;">Resumo de ${new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h4>
            <small style="color: var(--color-text-secondary);">Taxa Global: <strong>${rates.global}%</strong></small>
        </div>

        <div class="funnel-step">
            <div class="funnel-label">Leads Novos</div>
            <div class="funnel-bar-container">
                <div class="funnel-bar bg-leads" style="width: ${getWidth(stats.leads)}">${stats.leads}</div>
                <div class="conversion-badge">${rates.contact}% contatados</div>
            </div>
        </div>

        <div class="funnel-step">
            <div class="funnel-label">Contatados</div>
            <div class="funnel-bar-container">
                <div class="funnel-bar bg-contacts" style="width: ${getWidth(stats.contacts)}">${stats.contacts}</div>
                <div class="conversion-badge">${rates.schedule}% agendaram</div>
            </div>
        </div>

        <div class="funnel-step">
            <div class="funnel-label">Agendamentos</div>
            <div class="funnel-bar-container">
                <div class="funnel-bar bg-schedules" style="width: ${getWidth(stats.schedules)}">${stats.schedules}</div>
                <div class="conversion-badge">${rates.show}% visitaram</div>
            </div>
        </div>

        <div class="funnel-step">
            <div class="funnel-label">Visitas</div>
            <div class="funnel-bar-container">
                <div class="funnel-bar bg-visits" style="width: ${getWidth(stats.visits)}">${stats.visits}</div>
                <div class="conversion-badge">${rates.close}% matricularam</div>
            </div>
        </div>

        <div class="funnel-step">
            <div class="funnel-label">Matrículas</div>
            <div class="funnel-bar-container">
                <div class="funnel-bar bg-sales" style="width: ${getWidth(stats.sales)}">${stats.sales}</div>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding: 10px; background: var(--color-bg-2); border-radius: 8px; font-size: 0.9em; border: 1px solid var(--color-warning);">
            <strong>💡 Insight:</strong> ${identifyBottleneck(rates)}
        </div>
    `;
};

// Função auxiliar "Inteligente": Filtra os últimos 6 meses, 
// mas retorna apenas o que existe (1, 2, 3... meses)
const getSmartSixMonthData = (dailyLogs) => {
    const monthlyData = {};

    // 1. Define a data de corte (6 meses atrás, dia 1º)
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 5); // 5 anteriores + atual = 6
    cutoffDate.setDate(1);
    cutoffDate.setHours(0, 0, 0, 0);

    // 2. Itera e filtra
    Object.keys(dailyLogs).forEach(dateKey => {
        // Verifica se a data é válida e está dentro do período
        const logDate = new Date(dateKey + 'T00:00:00');
        if (isNaN(logDate.getTime()) || logDate < cutoffDate) return;

        const monthKey = dateKey.substring(0, 7); // Chave "YYYY-MM"
        const entry = dailyLogs[dateKey];

        // Cria o mês se não existir
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { leads: 0, calls: 0, visits: 0, sales: 0 };
        }

        // Acumula os dados
        monthlyData[monthKey].leads += Number(entry.leads_novos || 0);
        monthlyData[monthKey].sales += Number(entry.matriculas || 0);
        monthlyData[monthKey].visits += Number(entry.visitas || entry.visitas_realizadas || 0);

        const mCalls = Number(entry.ligacoes || 0);
        const aCalls = Number(entry.leads_contatados || 0);
        monthlyData[monthKey].calls += Math.max(mCalls, aCalls);
    });

    return monthlyData;
};



let premiumChartInstance = null;

export const renderEvolutionChart = () => {
    const ctxCanvas = document.getElementById('premium-evolution-chart');
    if (!ctxCanvas) return;

    const { dailyLogs } = getStore();

    // Usa o MESMO helper inteligente. Isso garante consistência total.
    // Se a estatística diz média de 3 meses, o gráfico mostra 3 barras.
    const monthlyData = getSmartSixMonthData(dailyLogs || {});

    // Ordena os meses para o gráfico (Cronológico)
    const sortedMonths = Object.keys(monthlyData).sort();

    // ... [O restante do código de configuração do Chart.js permanece IGUAL] ...
    // ... Copie o código da resposta anterior a partir daqui ...

    // Configuração do Chart (Recapitulando o início para contexto):
    const ctx = ctxCanvas.getContext('2d');
    const createGradient = (c1, c2) => { /* ... */ }; // (Seu código de gradiente)

    // Dados da linha de conversão
    const conversionRateData = sortedMonths.map(m => {
        const d = monthlyData[m];
        return d.leads > 0 ? ((d.sales / d.leads) * 100).toFixed(1) : 0;
    });

    if (premiumChartInstance) premiumChartInstance.destroy();

    premiumChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            // Formata rótulos: "2023-11" -> "11/2023"
            labels: sortedMonths.map(m => {
                const [ano, mes] = m.split('-');
                return `${mes}/${ano}`;
            }),
            datasets: [
                {
                    label: '1. Leads',
                    data: sortedMonths.map(m => monthlyData[m].leads),
                    backgroundColor: '#64748b',
                    borderRadius: 4,
                    order: 1
                },
                // ... (Repita para Ligações, Visitas, Matrículas e Linha de Conversão igual ao código anterior) ...
                {
                    label: '2. Ligações',
                    data: sortedMonths.map(m => monthlyData[m].calls),
                    backgroundColor: '#3b82f6', // Simplificado para exemplo, use seu gradiente
                    borderRadius: 4,
                    order: 2
                },
                {
                    label: '3. Visitas',
                    data: sortedMonths.map(m => monthlyData[m].visits),
                    backgroundColor: '#f59e0b',
                    borderRadius: 4,
                    order: 3
                },
                {
                    label: '4. Matrículas',
                    data: sortedMonths.map(m => monthlyData[m].sales),
                    backgroundColor: '#22c55e',
                    borderRadius: 6,
                    order: 4
                },
                {
                    label: 'Taxa Conversão (%)',
                    data: conversionRateData,
                    type: 'line',
                    borderColor: '#ef4444',
                    backgroundColor: '#ef4444',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#ef4444',
                    pointRadius: 5,
                    tension: 0.3,
                    order: 0,
                    yAxisID: 'y1'
                }
            ]
        },
        // ... (Opções do gráfico iguais à resposta anterior) ...
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom' } }, // etc...
            scales: {
                y: { display: true, position: 'left' },
                y1: { display: true, position: 'right', min: 0, suggestedMax: 50 },
                x: { grid: { display: false } }
            }
        }
    });

    // Chama a atualização dos cards ao final
    updateStatisticalKPIs();
};

// --- FUNÇÕES ESTATÍSTICAS (Atualizado) ---

const calculateBasicStats = (values) => {
    const n = values.length;
    if (n === 0) return { mean: 0, sd: 0, total: 0 };

    // 1. Total (Soma)
    const total = values.reduce((a, b) => a + b, 0);

    // 2. Média
    const mean = total / n;

    // 3. Desvio Padrão
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const sd = Math.sqrt(variance);

    return { mean, sd, total };
};

export const updateStatisticalKPIs = () => {
    const { dailyLogs } = getStore();
    if (!dailyLogs) return;

    // Usa o helper inteligente para pegar os dados
    const monthlyData = getSmartSixMonthData(dailyLogs);
    const months = Object.values(monthlyData);

    // Se não houver dados no período, zera a interface
    if (months.length === 0) {
        ['leads', 'calls', 'visits', 'sales', 'conversion'].forEach(type => {
            const tEl = document.getElementById(`kpi-total-${type}`);
            const aEl = document.getElementById(`stats-${type}-avg`);
            const sEl = document.getElementById(`stats-${type}-sd`);
            if (tEl) tEl.textContent = type === 'conversion' ? '0%' : '0';
            if (aEl) aEl.textContent = type === 'conversion' ? '0%' : '0';
            if (sEl) sEl.textContent = type === 'conversion' ? '0%' : '0';
        });
        return;
    }

    // --- AQUI ESTÁ A LÓGICA INTELIGENTE ---
    // Se 'months' tiver apenas 2 itens, o cálculo (soma / 2) será feito
    // automaticamente dentro de calculateBasicStats, pois n = months.length.

    const arrays = {
        leads: months.map(m => m.leads),
        calls: months.map(m => m.calls),
        visits: months.map(m => m.visits),
        sales: months.map(m => m.sales),
        conversion: months.map(m => m.leads > 0 ? (m.sales / m.leads) * 100 : 0)
    };

    const stats = {
        leads: calculateBasicStats(arrays.leads),
        calls: calculateBasicStats(arrays.calls),
        visits: calculateBasicStats(arrays.visits),
        sales: calculateBasicStats(arrays.sales),
        conversion: calculateBasicStats(arrays.conversion)
    };

    // Renderiza UI
    const updateUI = (type, data, isPercent = false) => {
        const suffix = isPercent ? '%' : '';
        const totalEl = document.getElementById(`kpi-total-${type}`);
        const avgEl = document.getElementById(`stats-${type}-avg`);
        const sdEl = document.getElementById(`stats-${type}-sd`);

        if (totalEl) {
            if (type === 'conversion') {
                const globalRate = stats.leads.total > 0
                    ? ((stats.sales.total / stats.leads.total) * 100).toFixed(1)
                    : "0.0";
                totalEl.textContent = globalRate + '%';
            } else {
                totalEl.textContent = data.total;
            }
        }
        if (avgEl) avgEl.textContent = data.mean.toFixed(1) + suffix;
        if (sdEl) sdEl.textContent = data.sd.toFixed(1) + suffix;
    };

    updateUI('leads', stats.leads);
    updateUI('calls', stats.calls);
    updateUI('visits', stats.visits);
    updateUI('sales', stats.sales);
    updateUI('conversion', stats.conversion, true);
};