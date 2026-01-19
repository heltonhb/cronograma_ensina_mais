// js/services/ai.js

/**
 * AI Service - Smart Sales Forecast
 * Usa Regressão Linear Ponderada para prever a probabilidade de conversão
 * com base na tendência recente e fatores de sazonalidade (dia da semana).
 */

/**
 * Calcula a previsão de conversão.
 * @param {Object} currentFeatures - Contexto de hoje { diaSemana: 0-6, leadsContatados, visitasRealizadas }
 * @param {Object} historicalLogs - Dicionário de logs { "YYYY-MM-DD": { ...Data } }
 */
export const predictConversion = (currentFeatures, historicalLogs) => {
    const logs = Object.entries(historicalLogs || {});

    // 1. Prepara o Dataset (X: Índice do Dia, Y: Taxa de Conversão %)
    // Filtramos apenas dias com Visitas > 0 para não distorcer a taxa de conversão
    const dataset = logs
        .map(([date, data], index) => {
            const visitas = parseInt(data.visitas || data.visitas_realizadas || 0);
            const matriculas = parseInt(data.matriculas || 0);
            const taxa = visitas > 0 ? (matriculas / visitas) * 100 : 0;
            return {
                index, // Cronológico
                date,
                visitas,
                matriculas,
                taxa,
                weight: 1 + (index * 0.1) // Peso maior para dias mais recentes (Linear Time Decay invertido)
            };
        })
        .filter(d => d.visitas > 0); // Só aprende com dias que tiveram oportunidade de venda

    // 2. Fallback para poucos dados (< 3 pontos de dados reais)
    if (dataset.length < 3) {
        return {
            probability: 15,
            explanation: "Calibrando IA... (Complete ao menos 3 dias com visitas para gerar previsões)"
        };
    }

    // 3. Regressão Linear Ponderada (Weighted Least Squares - Simplificada)
    // Queremos encontrar a linha: y = ax + b (Tendência)
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, totalWeight = 0;

    dataset.slice(-30).forEach(point => { // Olha apenas os últimos 30 dias com dados
        const w = point.weight;
        sumX += point.index * w;
        sumY += point.taxa * w;
        sumXY += point.index * point.taxa * w;
        sumXX += point.index * point.index * w;
        totalWeight += w;
    });

    const slope = (totalWeight * sumXY - sumX * sumY) / (totalWeight * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / totalWeight;

    // 4. Previsão para Hoje (Próximo índice)
    const nextIndex = logs.length;
    let predictedRate = (slope * nextIndex) + intercept;

    // Limites de sanidade (ninguém converte -10% nem 200%)
    predictedRate = Math.max(5, Math.min(predictedRate, 95));

    // 5. Ajuste de Contexto (Dia da Semana)
    // Se o user vende melhor nas terças, e hoje é terça, dá um boost.
    const todayStats = getDayOfWeekStats(logs, currentFeatures.diaSemana);
    let seasonalityFactor = 0;

    if (todayStats.average > 0) {
        // Se a média desse dia da semana for 20% melhor que a média geral, aplica boost
        // Mas com cuidado para não oscilar demais
        const diff = todayStats.average - predictedRate;
        seasonalityFactor = diff * 0.3; // Aplica 30% da diferença como ajuste
    }

    let finalProbability = Math.round(predictedRate + seasonalityFactor);

    // 6. Boost por esforço AGORA (Realtime)
    if (currentFeatures.visitasRealizadas > todayStats.avgVisits) {
        finalProbability += 5; // Bônus por estar acima da média de volume do dia
    }

    // Trava final
    finalProbability = Math.max(5, Math.min(finalProbability, 95));

    // 7. Explicação Gerativa
    let explanation = `Tendência identificada: ${slope > 0 ? "📈 Crescimento" : "📉 Estável"}.`;

    if (slope > 0.5) explanation = "Sua conversão vem subindo consistentemente!";
    else if (slope < -0.5) explanation = "Atenção: Sua conversão caiu nos últimos dias.";

    if (seasonalityFactor > 5) explanation += " Terças costumam ser ótimas para você!";
    if (currentFeatures.visitasRealizadas > 3) explanation += " Alto volume de visitas hoje potencializa o resultado.";

    return {
        probability: finalProbability,
        explanation: explanation,
        trend: slope
    };
};

// --- Helpers ---

const getDayOfWeekStats = (logs, dayOfWeek) => {
    // logs é o array de entradas [date, data]
    const sameDays = logs.filter(([date]) => {
        // Tenta contornar problema de fuso horário criando data com hora fixa
        const d = new Date(date + "T12:00:00");
        return d.getDay() === dayOfWeek;
    });

    if (sameDays.length === 0) return { average: 0, avgVisits: 0 };

    let totalRate = 0;
    let totalVisits = 0;

    sameDays.forEach(([, data]) => {
        const v = parseInt(data.visitas || 0);
        const m = parseInt(data.matriculas || 0);
        if (v > 0) totalRate += (m / v) * 100;
        totalVisits += v;
    });

    return {
        average: totalRate / sameDays.length,
        avgVisits: totalVisits / sameDays.length
    };
};

export const loadModel = async () => true;

export const getAiSuggestion = (probability) => {
    if (probability < 30) return "O dia está difícil. Foque em volume de prospecção para compensar.";
    if (probability < 60) return "Mantenha a consistência. Revise seus scripts de quebra de objeção.";
    if (probability < 80) return "Ótimo momento! Seja mais agressivo no fechamento.";
    return "🔥🔥 Dia de Ouro! Aproveite a maré alta para tentar bater recordes.";
};

export const explain = () => "IA v2.0: Regressão Linear Ponderada + Sazonalidade Semanal.";

/**
 * Lead Scoring System
 * Avalia o potencial do lead com base em dados observáveis.
 * @param {Object} activity - A atividade (Card) que representa o lead
 * @returns {Object} { score: number, color: string, label: string }
 */
export const calculateLeadScore = (activity) => {
    let score = 0;

    // 1. Engajamento (Interações)
    score += (activity.leads_contatados || 0) * 5; // +5 por contato
    score += (activity.visitas_realizadas || 0) * 20; // +20 por visita
    score += (activity.agendamentos_feitos || 0) * 15; // +15 por agendamento

    // 2. Análise Semântica Básica (Nome e Descrição)
    const text = ((activity.nome || '') + ' ' + (activity.descricao || '')).toLowerCase();

    const hotKeywords = ['fechamento', 'interessado', 'urgente', 'pagamento', 'contrato', 'visita', 'reunião'];
    const warmKeywords = ['duvida', 'conhecer', 'preço', 'valor', 'cotação'];
    const coldKeywords = ['desligou', 'sem interesse', 'caixa postal', 'ocupado'];

    hotKeywords.forEach(w => { if (text.includes(w)) score += 15; });
    warmKeywords.forEach(w => { if (text.includes(w)) score += 5; });
    coldKeywords.forEach(w => { if (text.includes(w)) score -= 10; });

    // 3. Status
    if (activity.status === 'em_andamento') score += 10;
    if (activity.status === 'concluido') score += 50;

    // Normalização (0 a 100)
    score = Math.max(0, Math.min(score, 100));

    // Classificação Visual
    let color = '#94a3b8'; // Cinza (Cold)
    let label = 'Frio';

    if (score >= 80) {
        color = '#22c55e'; // Verde (Hot)
        label = '🔥🔥 Quente';
    } else if (score >= 50) {
        color = '#f59e0b'; // Laranja (Warm)
        label = 'Morno';
    }

    return { score, color, label };
};