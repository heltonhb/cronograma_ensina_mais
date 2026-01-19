// js/services/forecast.js

/**
 * Calcula a projeção de vendas para os próximos dias baseada no histórico.
 * @param {Object} dailyLogs - O objeto appData.dailyLogs
 * @param {number} daysToProject - Quantos dias no futuro queremos prever (padrão: 7)
 * @returns {Object} Dados da previsão
 */
export const generateSalesForecast = (dailyLogs, daysToProject = 7) => {
    // 1. Extrair e ordenar dados históricos (últimos 30 dias para base sólida)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const logs = Object.entries(dailyLogs)
        .filter(([date]) => new Date(date) >= thirtyDaysAgo)
        .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
        .map(([, data]) => data);

    if (logs.length < 5) {
        return { error: "Dados insuficientes. É necessário pelo menos 5 dias de histórico." };
    }

    // 2. Calcular Médias (Com peso maior para a última semana)
    const calculateWeightedAvg = (metric) => {
        let sum = 0;
        let weightSum = 0;
        logs.forEach((log, index) => {
            const weight = index + 1; // Dias mais recentes têm peso maior
            sum += (parseInt(log[metric] || 0) * weight);
            weightSum += weight;
        });
        return sum / weightSum;
    };

    const avgLeads = calculateWeightedAvg('leads_novos');
    const avgVisitas = calculateWeightedAvg('visitas');
    const avgMatriculas = calculateWeightedAvg('matriculas');

    // 3. Calcular Taxas de Conversão do Funil (Geral do período)
    const totalLeads = logs.reduce((acc, l) => acc + (parseInt(l.leads_novos)||0), 0);
    const totalVisitas = logs.reduce((acc, l) => acc + (parseInt(l.visitas)||0), 0);
    const totalMatriculas = logs.reduce((acc, l) => acc + (parseInt(l.matriculas)||0), 0);

    const conversionLeadToVisit = totalLeads > 0 ? totalVisitas / totalLeads : 0;
    const conversionVisitToSale = totalVisitas > 0 ? totalMatriculas / totalVisitas : 0;
    const conversionGlobal = totalLeads > 0 ? totalMatriculas / totalLeads : 0;

    // 4. Gerar Projeção
    const projectedLeads = Math.round(avgLeads * daysToProject);
    // A projeção de matrículas considera a tendência de matrículas E o volume de leads entrando
    const projectedMatriculasTrend = avgMatriculas * daysToProject;
    const projectedMatriculasFunnel = projectedLeads * conversionGlobal; 
    
    // Média entre a tendência histórica e a matemática do funil (para suavizar)
    const finalMatriculaProjection = Math.round((projectedMatriculasTrend + projectedMatriculasFunnel) / 2);

    return {
        period: daysToProject,
        averages: {
            leads: avgLeads.toFixed(1),
            matriculas: avgMatriculas.toFixed(1)
        },
        rates: {
            leadToVisit: (conversionLeadToVisit * 100).toFixed(1),
            visitToSale: (conversionVisitToSale * 100).toFixed(1),
            global: (conversionGlobal * 100).toFixed(1)
        },
        projection: {
            leads: projectedLeads,
            matriculas: finalMatriculaProjection,
            visitas: Math.round(avgVisitas * daysToProject)
        },
        trend: avgMatriculas > (totalMatriculas / logs.length) ? 'up' : 'down' // Comparando média ponderada com média simples
    };
};