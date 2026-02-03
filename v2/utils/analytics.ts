import { DailyLog } from "../types/dailyLog";

export interface MonthlyStats {
    leads: number;
    leads_negativados?: number;
    calls: number;
    visits: number;
    sales: number;
    conversion?: number;
}

export interface StatsResult {
    mean: number;
    sd: number;
    total: number;
}

export interface AggregatedStats {
    leads: StatsResult;
    calls: StatsResult;
    visits: StatsResult;
    sales: StatsResult;
    conversion: StatsResult;
}

export const getSmartSixMonthData = (dailyLogs: DailyLog[]): Record<string, MonthlyStats> => {
    const monthlyData: Record<string, MonthlyStats> = {};

    // 1. Cutoff: 6 months ago (first day of that month)
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 5);
    cutoffDate.setDate(1);
    cutoffDate.setHours(0, 0, 0, 0);

    dailyLogs.forEach((log) => {
        // Assume log has a 'date' property (YYYY-MM-DD)
        const dateKey = log.date;
        if (!dateKey) return;

        const logDate = new Date(dateKey + 'T00:00:00');
        if (isNaN(logDate.getTime()) || logDate < cutoffDate) return;

        const monthKey = dateKey.substring(0, 7); // "YYYY-MM"

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { leads: 0, leads_negativados: 0, calls: 0, visits: 0, sales: 0 };
        }

        monthlyData[monthKey].leads += Number(log.leads_novos || 0);
        monthlyData[monthKey].leads_negativados = (monthlyData[monthKey].leads_negativados || 0) + Number(log.leads_negativados || 0);
        monthlyData[monthKey].sales += Number(log.matriculas || 0);

        // visitas_realizadas is legacy/fallback, but not in strict DailyLog type. 
        // Keeping cast if needed or safely removing if confident. 
        // For now, let's trust 'visitas' is the standard field per types/dailyLog.ts
        monthlyData[monthKey].visits += Number(log.visitas || 0);

        const mCalls = Number(log.ligacoes || 0);
        const aCalls = Number(log.leads_contatados || 0);
        monthlyData[monthKey].calls += Math.max(mCalls, aCalls);
    });

    return monthlyData;
};

export const calculateBasicStats = (values: number[]): StatsResult => {
    const n = values.length;
    if (n === 0) return { mean: 0, sd: 0, total: 0 };

    // 1. Total
    const total = values.reduce((a, b) => a + b, 0);

    // 2. Mean
    const mean = total / n;

    // 3. Standard Deviation
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const sd = Math.sqrt(variance);

    return { mean, sd, total };
};

export const calculateAggregatedStats = (monthlyData: Record<string, MonthlyStats>): AggregatedStats => {
    const months = Object.values(monthlyData);

    if (months.length === 0) {
        const empty = { mean: 0, sd: 0, total: 0 };
        return { leads: empty, calls: empty, visits: empty, sales: empty, conversion: empty };
    }

    const arrays = {
        leads: months.map(m => m.leads),
        calls: months.map(m => m.calls),
        visits: months.map(m => m.visits),
        sales: months.map(m => m.sales),
        conversion: months.map(m => m.leads > 0 ? (m.sales / m.leads) * 100 : 0)
    };

    return {
        leads: calculateBasicStats(arrays.leads),
        calls: calculateBasicStats(arrays.calls),
        visits: calculateBasicStats(arrays.visits),
        sales: calculateBasicStats(arrays.sales),
        conversion: calculateBasicStats(arrays.conversion)
    };
};
