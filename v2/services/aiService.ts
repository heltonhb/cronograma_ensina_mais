import { Activity } from '../types/activity';

/**
 * AI Service - Smart Sales Forecast
 * Ported from v1/js/services/ai.js
 */

export interface AiPrediction {
    probability: number;
    explanation: string;
    trend: number;
}

export interface LeadScore {
    score: number;
    color: string;
    label: string;
}

export interface SalesProjection {
    current: number;
    projected: number;
    gap: number;
    velocity: number;
    message: string;
    onTrack: boolean;
}

export const predictMonthlySales = (
    currentSales: number,
    historyLast7Days: { matriculas: number; date: string }[]
): SalesProjection => {
    // 1. Calculate Velocity (Sales/Week)
    // Filter last 7 days data
    const totalLast7Days = historyLast7Days.reduce((acc, curr) => acc + (Number(curr.matriculas) || 0), 0);
    const dailyVelocity = totalLast7Days / 7; // Averaged over 7 days regardless of activity

    // 2. Time Remaining
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = Math.max(0, endOfMonth.getDate() - now.getDate());

    // 3. Projection
    const projectedAdditional = dailyVelocity * daysRemaining;
    const projectedTotal = Math.round(currentSales + projectedAdditional);

    // 4. Analysis
    // Assume a dynamic goal? For now, let's just project. 
    // Or compare with a "breakeven" or "growth" baseline. 
    // Let's assume a healthy velocity is > 0.5 sales/day (15/month).

    return {
        current: currentSales,
        projected: projectedTotal,
        gap: Math.round(projectedAdditional),
        velocity: Number(dailyVelocity.toFixed(2)),
        message: dailyVelocity > 0.8
            ? "🚀 Ritmo acelerado! Você vai quebrar recordes."
            : dailyVelocity > 0.4
                ? "📈 Ritmo constante. Mantenha o foco."
                : "⚠️ Atenção: Ritmo baixo. Aumente a prospecção.",
        onTrack: dailyVelocity > 0.5
    };
};

export const predictConversion = (
    currentFeatures: { diaSemana: number; visitasRealizadas: number },
    historicalLogs: Record<string, { visitas?: number | string; matriculas?: number | string; visitas_realizadas?: number | string }>
): AiPrediction => {
    const logs = Object.entries(historicalLogs || {});

    // 1. Prepare Dataset
    const dataset = logs
        .map(([date, data], index) => {
            const visitas = Number(data.visitas || data.visitas_realizadas || 0);
            const matriculas = Number(data.matriculas || 0);
            const taxa = visitas > 0 ? (matriculas / visitas) * 100 : 0;
            return {
                index,
                date,
                visitas,
                matriculas,
                taxa,
                weight: 1 + (index * 0.1) // Linear Time Decay
            };
        })
        .filter(d => d.visitas > 0);

    // 2. Fallback
    if (dataset.length < 3) {
        return {
            probability: 15,
            explanation: "Calibrando IA... (Complete ao menos 3 dias com visitas para gerar previsões)",
            trend: 0
        };
    }

    // 3. Weighted Linear Regression
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, totalWeight = 0;

    dataset.slice(-30).forEach(point => {
        const w = point.weight;
        sumX += point.index * w;
        sumY += point.taxa * w;
        sumXY += point.index * point.taxa * w;
        sumXX += point.index * point.index * w;
        totalWeight += w;
    });

    const denominator = (totalWeight * sumXX - sumX * sumX);
    if (denominator === 0) return { probability: 15, explanation: "Dados insuficientes para cálculo de tendência.", trend: 0 };

    const slope = (totalWeight * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / totalWeight;

    // 4. Prediction for Today
    const nextIndex = logs.length;
    let predictedRate = (slope * nextIndex) + intercept;

    // Sanity checks
    predictedRate = Math.max(5, Math.min(predictedRate, 95));

    // 5. Seasonality Adjustment
    const todayStats = getDayOfWeekStats(logs, currentFeatures.diaSemana);
    let seasonalityFactor = 0;

    if (todayStats.average > 0) {
        const diff = todayStats.average - predictedRate;
        seasonalityFactor = diff * 0.3;
    }

    let finalProbability = Math.round(predictedRate + seasonalityFactor);

    // 6. Realtime Context Boost
    if (currentFeatures.visitasRealizadas > todayStats.avgVisits) {
        finalProbability += 5;
    }

    finalProbability = Math.max(5, Math.min(finalProbability, 95));

    // 7. Explanation
    let explanation = `Tendência: ${slope > 0 ? "📈 Crescimento" : "📉 Estável"}.`;
    if (slope > 0.5) explanation = "Sua conversão vem subindo consistentemente!";
    else if (slope < -0.5) explanation = "Atenção: Sua conversão caiu nos últimos dias.";

    if (seasonalityFactor > 5) explanation += " Hoje costuma ser um bom dia para você!";
    if (currentFeatures.visitasRealizadas > 3) explanation += " Alto volume de visitas potencializa o resultado.";

    return {
        probability: finalProbability,
        explanation,
        trend: slope
    };
};

// Helper
const getDayOfWeekStats = (logs: [string, { visitas?: number | string; matriculas?: number | string }][], dayOfWeek: number) => {
    const sameDays = logs.filter(([date]) => {
        const d = new Date(date + "T12:00:00");
        return d.getDay() === dayOfWeek;
    });

    if (sameDays.length === 0) return { average: 0, avgVisits: 0 };

    let totalRate = 0;
    let totalVisits = 0;

    sameDays.forEach(([, data]) => {
        const v = Number(data.visitas || 0);
        const m = Number(data.matriculas || 0);
        if (v > 0) totalRate += (m / v) * 100;
        totalVisits += v;
    });

    return {
        average: totalRate / sameDays.length,
        avgVisits: totalVisits / sameDays.length
    };
};

export const getAiSuggestion = (probability: number) => {
    if (probability < 30) return "O dia está difícil. Foque em volume de prospecção.";
    if (probability < 60) return "Mantenha a consistência. Revise seus scripts.";
    if (probability < 80) return "Ótimo momento! Seja mais agressivo no fechamento.";
    return "🔥🔥 Dia de Ouro! Aproveite a maré alta!";
};

/**
 * Lead Scoring System
 */
export const calculateLeadScore = (activity: Activity): LeadScore => {
    let score = 0;

    // 1. Engagement
    score += (activity.leads_contatados || 0) * 5;
    score += (activity.visitas_realizadas || 0) * 20;
    // Note: Activity type definition might need 'agendamentos_feitos' if used in v1. 
    // Assuming standard fields from v2. If not, ignore.

    // 2. Semantic Analysis
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

    score = Math.max(0, Math.min(score, 100));

    let color = '#94a3b8'; // Cold (Gray)
    let label = 'Frio';

    if (score >= 80) {
        color = '#22c55e'; // Hot (Green)
        label = '🔥🔥 Quente';
    } else if (score >= 50) {
        color = '#f59e0b'; // Warm (Orange)
        label = 'Morno';
    }

    return { score, color, label };
};
