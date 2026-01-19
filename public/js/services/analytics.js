// js/services/analytics.js
import { formatDuration } from '../core/utils.js';

// --- Relatório Executivo Semanal ---
export const generateWeeklyExecutiveReport = (historicalData, dailyLogs, startDate, endDate) => {
    const dateRangeKeys = Object.keys(historicalData).filter(date => {
        const d = new Date(date + 'T12:00:00');
        return d >= startDate && d <= endDate;
    });

    if (dateRangeKeys.length === 0) return null;

    const activities = dateRangeKeys.flatMap(date => historicalData[date]);
    const logs = Object.entries(dailyLogs)
        .filter(([date]) => dateRangeKeys.includes(date))
        .map(([, log]) => log);

    // 1. Resumo de Performance
    const totalMetasLeads = activities.reduce((sum, a) => sum + (a.meta_leads || 0), 0);
    const totalLeadsContatados = activities.reduce((sum, a) => sum + (a.leads_contatados || 0), 0);
    const totalMetasVisitas = activities.reduce((sum, a) => sum + (a.meta_visitas || 0), 0);
    const totalVisitasRealizadas = activities.reduce((sum, a) => sum + (a.visitas_realizadas || 0), 0);
    const totalMatriculas = logs.reduce((sum, log) => sum + (log.matriculas || 0), 0);
    const taxaConclusao = Math.round((activities.filter(a => a.status === 'concluido').length / activities.length) * 100) || 0;

    // 2. Top 3 Conquistas
    const dayStats = dateRangeKeys.reduce((acc, date) => {
        const completed = historicalData[date].filter(a => a.status === 'concluido').length;
        acc.push({ date, completed });
        return acc;
    }, []);
    // Ordenação segura
    dayStats.sort((a, b) => b.completed - a.completed);
    const bestDay = dayStats[0] || { date: startDate.toISOString().split('T')[0], completed: 0 };

    const activityStats = activities.reduce((acc, a) => {
        acc[a.nome] = acc[a.nome] || { total: 0, completed: 0 };
        acc[a.nome].total++;
        if (a.status === 'concluido') acc[a.nome].completed++;
        return acc;
    }, {});

    // Identificar categoria principal
    const categoryDurations = activities.reduce((acc, a) => {
        acc[a.categoria] = (acc[a.categoria] || 0) + (a.duracao || 0);
        return acc;
    }, {});
    const topCategory = Object.entries(categoryDurations).sort(([, a], [, b]) => b - a)[0]?.[0] || 'Geral';

    const challengingActivities = Object.entries(activityStats)
        .filter(([, stats]) => stats.total > 2 && (stats.completed / stats.total) < 0.5)
        .map(([name]) => name);

    return `
# Relatório Executivo Semanal
**Período:** ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}

---

### **Resumo de Performance**
- **Taxa de Conclusão de Atividades:** ${taxaConclusao}%
- **Leads Contatados:** ${totalLeadsContatados} / ${totalMetasLeads} (Meta)
- **Visitas Realizadas:** ${totalVisitasRealizadas} / ${totalMetasVisitas} (Meta)
- **Matrículas Realizadas:** ${totalMatriculas}

---

### **Top 3 Conquistas da Semana**
1.  **Maior Produtividade:** O dia mais produtivo foi ${new Date(bestDay.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}, com ${bestDay.completed} atividades concluídas.
2.  **Foco Principal:** A categoria com mais tempo investido foi "${topCategory}".
3.  **Resultado Chave:** Alcançamos um total de ${totalMatriculas} novas matrículas.

### **Top 3 Desafios da Semana**
1.  **Atividades de Baixa Conclusão:** ${challengingActivities.length > 0 ? `As atividades "${challengingActivities.slice(0, 2).join(', ')}" apresentaram dificuldade.` : 'Nenhuma atividade com baixa conclusão recorrente.'}
2.  **Meta de Leads:** ${totalLeadsContatados < totalMetasLeads ? `A meta de contatos com leads não foi atingida (${totalMetasLeads - totalLeadsContatados} a menos).` : 'A meta de contatos com leads foi superada!'}
3.  **Meta de Visitas:** ${totalVisitasRealizadas < totalMetasVisitas ? `A meta de visitas não foi atingida (${totalMetasVisitas - totalVisitasRealizadas} a menos).` : 'A meta de visitas foi superada!'}
`;
};

// --- Relatório ROI de Tempo ---
export const generateTimeROIReport = (historicalData, dailyLogs, startDate, endDate, periodDays) => {
    const dateRangeKeys = Object.keys(historicalData).filter(date => {
        const d = new Date(date + 'T12:00:00');
        return d >= startDate && d <= endDate;
    });

    if (dateRangeKeys.length === 0) return null;

    const activities = dateRangeKeys.flatMap(date => historicalData[date].filter(a => a.status === 'concluido'));
    const totalMatriculas = Object.entries(dailyLogs)
        .filter(([date]) => dateRangeKeys.includes(date))
        .reduce((sum, [, log]) => sum + (log.matriculas || 0), 0);

    const totalTimeInvested = activities.reduce((sum, a) => sum + (a.duracao || 0), 0);
    const timePerMatricula = totalMatriculas > 0 ? Math.round(totalTimeInvested / totalMatriculas) : 0;

    const categoryMetrics = activities.reduce((acc, a) => {
        acc[a.categoria] = acc[a.categoria] || { time: 0, leads: 0, schedules: 0, visits: 0 };
        acc[a.categoria].time += a.duracao || 0;
        acc[a.categoria].leads += a.leads_contatados || 0;
        acc[a.categoria].schedules += a.agendamentos_feitos || 0;
        acc[a.categoria].visits += a.visitas_realizadas || 0;
        return acc;
    }, {});

    const leadsPerHourProspecting = ((categoryMetrics['Prospecção']?.leads || 0) / (categoryMetrics['Prospecção']?.time / 60 || 1)).toFixed(1);
    const schedulesPerHourFollowUp = ((categoryMetrics['Follow-up']?.schedules || 0) / (categoryMetrics['Follow-up']?.time / 60 || 1)).toFixed(1);

    return `
# Análise de Retorno sobre Investimento (ROI) de Tempo
**Período:** ${periodDays} dias (${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')})

---

### **Custo de Tempo por Matrícula**
- **Tempo Total Investido (Atividades Concluídas):** ${formatDuration(totalTimeInvested)}
- **Total de Matrículas no Período:** ${totalMatriculas}
- **Custo de Tempo por Matrícula:** **${formatDuration(timePerMatricula)}** por matrícula.

---

### **Atividades com Melhor Retorno**
- **Prospecção:**
    - Tempo Investido: ${formatDuration(categoryMetrics['Prospecção']?.time || 0)}
    - Leads por Hora: **${leadsPerHourProspecting}**
- **Follow-up:**
    - Tempo Investido: ${formatDuration(categoryMetrics['Follow-up']?.time || 0)}
    - Agendamentos por Hora: **${schedulesPerHourFollowUp}**
- **Conversão (Visitas):**
    - Tempo Investido: ${formatDuration(categoryMetrics['Conversão']?.time || 0)}
    - Visitas Realizadas: ${categoryMetrics['Conversão']?.visits || 0}
`;
};

// --- Geração de Insights ---
// js/services/analytics.js

export const generateInsights = (activities, dailyLogs = {}) => {
    const insights = [];
    if (!activities || activities.length < 5) return [];

    const MIN_ACTIVITY_COUNT = 3;
    const LOW_COMPLETION_THRESHOLD = 0.6;

    // --- 1. Insight de Produtividade (Manhã vs Tarde) ---
    let morningCompleted = 0;
    let afternoonCompleted = 0;

    activities.filter(a => a.status === 'concluido').forEach(a => {
        if (!a.horario_inicio || typeof a.horario_inicio !== 'string') return;
        const startHour = parseInt(a.horario_inicio.split(':')[0]);
        if (startHour < 12) morningCompleted++;
        else afternoonCompleted++;
    });

    if (morningCompleted > afternoonCompleted * 1.25) {
        insights.push({
            type: 'productivity',
            icon: '☀️',
            title: 'Pico de Produtividade',
            message: 'Sua produtividade parece ser maior de manhã.',
            action: 'Agende tarefas críticas antes do almoço.'
        });
    } else if (afternoonCompleted > morningCompleted * 1.25) {
        insights.push({
            type: 'productivity',
            icon: '🌙',
            title: 'Pico de Produtividade',
            message: 'Sua produtividade parece ser maior à tarde.',
            action: 'Use a tarde para tarefas difíceis.'
        });
    }

    // --- 2. Insight de Gargalo (Baixa Conclusão) ---
    const activityStats = activities.reduce((acc, a) => {
        const nome = a.nome || 'Sem Nome';
        acc[nome] = acc[nome] || { total: 0, completed: 0 };
        acc[nome].total++;
        if (a.status === 'concluido') acc[nome].completed++;
        return acc;
    }, {});

    const lowCompletionActivities = Object.entries(activityStats)
        .filter(([, stats]) => stats.total >= MIN_ACTIVITY_COUNT && (stats.completed / stats.total) < LOW_COMPLETION_THRESHOLD)
        .map(([name]) => name);

    if (lowCompletionActivities.length > 0) {
        insights.push({
            type: 'warning',
            icon: '⚠️',
            title: 'Gargalo Identificado',
            message: `Baixa conclusão em: ${lowCompletionActivities.slice(0, 2).join(', ')}.`,
            action: 'Revise duração ou prioridade.'
        });
    }

    // --- 3. Insight de Distribuição (Pouca Prospecção) ---
    const categoryDurations = activities.reduce((acc, a) => {
        if (a.status === 'concluido') acc[a.categoria] = (acc[a.categoria] || 0) + (a.duracao || 0);
        return acc;
    }, {});
    const totalDuration = Object.values(categoryDurations).reduce((sum, d) => sum + d, 0);
    const prospectingDuration = categoryDurations['Prospecção'] || 0;

    if (totalDuration > 0 && (prospectingDuration / totalDuration) < 0.15) {
        insights.push({
            type: 'info',
            icon: '📞',
            title: 'Foco em Prospecção',
            message: `Menos de 15% do tempo em prospecção.`,
            action: 'Considere dedicar blocos maiores para gerar leads.'
        });
    }

    // --- 4. DATA-DRIVEN INSIGHTS (Novo: Requer dailyLogs) ---
    const logs = Object.entries(dailyLogs);
    if (logs.length > 10) {
        // A) Melhor Dia da Semana para Vendas
        const salesByDay = [0, 0, 0, 0, 0, 0, 0]; // Dom-Sab
        const countsByDay = [0, 0, 0, 0, 0, 0, 0];

        logs.forEach(([date, data]) => {
            const day = new Date(date + "T12:00:00").getDay();
            const sales = parseInt(data.matriculas || 0);
            if (sales > 0) {
                salesByDay[day] += sales;
                countsByDay[day]++;
            }
        });

        const avgSalesByDay = salesByDay.map((total, i) => countsByDay[i] ? total / countsByDay[i] : 0);
        const bestDayIndex = avgSalesByDay.indexOf(Math.max(...avgSalesByDay));
        const bestDayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][bestDayIndex];

        if (avgSalesByDay[bestDayIndex] > 0) {
            insights.unshift({ // Coloca no topo
                type: 'success',
                icon: '📅',
                title: 'Melhor Dia para Vendas',
                message: `Você vende ${(avgSalesByDay[bestDayIndex] * 100).toFixed(0)}% melhor nas ${bestDayName}s!`,
                action: 'Foque seus fechamentos neste dia.'
            });
        }
    }

    return insights;
};
// --- Métricas de Vendas (Corrigido para receber dailyLogs) ---
export const getSalesMetrics = (days, dailyLogs) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(new Date().getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const logs = dailyLogs || {};
    let totals = { leads: 0, negativados: 0, ligacoes: 0, agendamentos: 0, visitas: 0, matriculas: 0 };

    Object.keys(logs).forEach(dateStr => {
        const logDate = new Date(dateStr + 'T12:00:00');
        if (logDate >= startDate && logDate <= endDate) {
            const log = logs[dateStr];
            totals.leads += parseInt(log.leads_novos || 0);
            totals.negativados += parseInt(log.leads_negativados || 0);
            totals.ligacoes += parseInt(log.ligacoes || 0);
            totals.agendamentos += parseInt(log.agendamentos || 0);
            totals.visitas += parseInt(log.visitas || 0);
            totals.matriculas += parseInt(log.matriculas || 0);
        }
    });

    return totals;
};

// Helper simples para cálculo de porcentagem (se não estiver no utils)
export const calculateConversion = (part, total) => {
    if (!total || total === 0) return 0;
    return Math.round((part / total) * 100);
};