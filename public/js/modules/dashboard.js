// js/modules/dashboard.js
import { getStore } from '../core/store.js';
import { updateTodaysLeadsMetric } from './dailyLog.js';
import { renderGamificationWidget } from '../services/gamification.js';
import { loadChartJs } from '../services/charts.js';

let charts = {};

// Helper para acesso seguro ao DOM
const getEl = (id) => document.getElementById(id);

export const initDashboard = () => {
    updateDashboardMetrics();
    renderTodayActivities();
    createPerformanceChart();
    updateTodaysLeadsMetric();

    // Renderiza o jogo (se existir)
    if (typeof renderGamificationWidget === 'function') {
        renderGamificationWidget();
    }
};

// =========================================================
// ATUALIZAÇÃO DO DASHBOARD (Métricas de Ontem)
// =========================================================
export const updateDashboardMetrics = () => {
    // 1. Seletores (Referências aos elementos HTML)
    const elLabel = getEl('dashboard-date-label');
    const elAtividades = getEl('dash-atividades');
    const elProgress = getEl('dash-progress-fill');

    // Cards de Métricas
    const elLeadsNovos = getEl('dash-leads-novos');
    const elLeadsContatados = getEl('dash-leads');
    const elAgendamentos = getEl('total-agendamentos');
    const elVisitas = getEl('dash-visitas');
    const elMatriculas = getEl('dash-matriculas');

    if (!elLabel) return;

    // 2. DEFINIÇÃO DA DATA (Ontem)
    const getLocalKey = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = getLocalKey(yesterday);

    // 3. RECUPERAÇÃO DE DADOS (Do Store)
    const { scheduleHistory, dailyLogs } = getStore();
    const histActivities = (scheduleHistory && scheduleHistory[yesterdayKey]) || [];
    const histLog = (dailyLogs && dailyLogs[yesterdayKey]) || {};

    // 4. CÁLCULO DAS MÉTRICAS

    // A) Progresso das Atividades
    const totalTasks = histActivities.length;
    const tasksDone = histActivities.filter(a => a.status === 'concluido').length;
    const percent = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

    // B) Funil de Vendas (Dados do Daily Log de ontem)
    const leadsNovosCount = parseInt(histLog.leads_novos || 0);

    // Leads Contatados (Maior valor entre manual e automático)
    const leadsManual = parseInt(histLog.ligacoes || 0);
    const leadsAuto = parseInt(histLog.leads_contatados || 0);
    const leadsContactedCount = Math.max(leadsManual, leadsAuto);

    // --- NOVO CÁLCULO: Agendamentos ---
    // Tenta pegar do Log Diário OU soma das atividades individuais de ontem
    const agendamentosLog = parseInt(histLog.agendamentos || 0);
    const agendamentosActivities = histActivities.reduce((acc, curr) => acc + (parseInt(curr.agendamentos_feitos) || 0), 0);
    // Usa o maior valor encontrado para garantir precisão
    const agendamentosCount = Math.max(agendamentosLog, agendamentosActivities);

    // Visitas e Matrículas
    const visitasCount = parseInt(histLog.visitas || histLog.visitas_realizadas || 0);
    const matriculasCount = parseInt(histLog.matriculas || 0);

    // 5. ATUALIZAÇÃO DA TELA
    elLabel.innerHTML = `🏁 Resultado de Ontem <small style="font-weight:400; color:#666">(${yesterday.toLocaleDateString('pt-BR')})</small>`;

    const animateValue = (element, value) => {
        if (element) element.textContent = value;
    };

    // Barra de Progresso e Texto
    animateValue(elAtividades, `${tasksDone}/${totalTasks}`);
    if (elProgress) elProgress.style.width = `${percent}%`;

    // Cards Coloridos
    animateValue(elLeadsNovos, leadsNovosCount);
    animateValue(elLeadsContatados, leadsContactedCount);
    animateValue(elAgendamentos, agendamentosCount);
    animateValue(elVisitas, visitasCount);
    animateValue(elMatriculas, matriculasCount);
};

// =========================================================
// RENDERIZAÇÃO DAS ATIVIDADES DE ONTEM
// =========================================================
export const renderTodayActivities = () => {
    const container = document.getElementById('today-activities-list');
    if (!container) return;

    // 1. CALCULA A DATA DE ONTEM (Formato YYYY-MM-DD)
    const date = new Date();
    date.setDate(date.getDate() - 1); // Subtrai 1 dia

    // Ajuste seguro para fuso horário local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const yesterdayKey = `${year}-${month}-${day}`;
    const dateFormatted = date.toLocaleDateString('pt-BR'); // Para exibir no texto

    // 2. TENTA MUDAR O TÍTULO DA SEÇÃO (Visual)
    // Procura o título H3 logo antes da lista para avisar que é de Ontem
    const sectionTitle = container.previousElementSibling;
    if (sectionTitle && sectionTitle.tagName === 'H3') {
        sectionTitle.innerHTML = `Atividades do dia anterior <span style="font-size:0.7em; opacity:0.6; font-weight:400">(${dateFormatted})</span>`;
    }

    // 3. BUSCA OS DADOS NO HISTÓRICO
    // Se não tiver histórico de ontem, usa array vazio []
    const { scheduleHistory } = getStore();
    const history = scheduleHistory || {};
    let atividades = history[yesterdayKey];

    container.innerHTML = '';

    // 4. CENÁRIO: SEM DADOS
    if (!atividades || atividades.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; color: #94a3b8;">
                <span style="font-size: 2.5rem; display:block; margin-bottom:10px; opacity:0.5;">📅</span>
                <p style="margin:0; font-weight:500;">Nada gravado ontem.</p>
                <small style="font-size:0.8rem;">O histórico é salvo ao finalizar o dia.</small>
            </div>`;
        return;
    }

    // 5. ORDENAÇÃO E RENDERIZAÇÃO (Mantendo o visual novo)
    atividades.sort((a, b) => (a.horario_inicio || '').localeCompare(b.horario_inicio || ''));

    atividades.forEach(atv => {
        const inicio = atv.horario_inicio || '--:--';
        const fim = atv.horario_fim || '--:--';
        const nome = atv.nome || '(Sem nome)';
        const categoria = atv.categoria || 'Geral';
        const status = atv.status || 'nao_iniciado';

        // Formata o status para ficar bonito (Remove underline)
        const statusTexto = status.replace('_', ' ');

        const item = document.createElement('div');
        item.className = 'activity-list-item'; // Usa o CSS novo que criamos

        // Estrutura HTML compatível com o CSS moderno
        item.innerHTML = `
            <div class="activity-time-box">
                <span class="at-start">${inicio}</span>
                <span class="at-end">${fim}</span>
            </div>
            
            <div class="activity-info-box">
                <div class="at-name">${nome}</div>
                <div class="at-meta">
                    <span class="at-cat">${categoria}</span>
                </div>
            </div>

            <div class="activity-status-box">
                <span class="at-status ${status}">${statusTexto}</span>
            </div>
        `;
        container.appendChild(item);
    });
};

export const createPerformanceChart = async () => {
    const ctx = getEl('performance-chart')?.getContext('2d');
    if (!ctx) return;

    const labels = ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'Ontem', 'Hoje'];
    const data = labels.map(() => Math.floor(Math.random() * 50) + 50); // Mock data

    try {
        const Chart = await loadChartJs();
        if (charts.performance) charts.performance.destroy();

        charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels, datasets: [{
                    label: 'Taxa de Conclusão (%)', data, borderColor: 'var(--color-brand)',
                    backgroundColor: 'rgba(var(--color-brand-500-rgb), 0.1)', fill: true, tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
            }
        });
    } catch (e) { console.warn("Chart.js loading failed or cancelled", e); }
};
