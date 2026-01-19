import { useMemo } from 'react';
import { Activity } from '../types/activity';
import { DailyLog } from '../types/dailyLog';

interface UseMetricsProps {
    activities: Activity[];
    todayLog: DailyLog | null;
    yesterdayLog: DailyLog | null;
    yesterdayActivitiesSnapshot: Activity[];
}

export function useMetrics({ activities, todayLog, yesterdayLog, yesterdayActivitiesSnapshot }: UseMetricsProps) {
    // Derived state

    // helpers
    const isToday = (dateString?: string) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    const isYesterday = (dateString?: string) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return d.getDate() === yesterday.getDate() &&
            d.getMonth() === yesterday.getMonth() &&
            d.getFullYear() === yesterday.getFullYear();
    };

    const calculateYesterdayMetrics = (log: DailyLog | null, acts: Activity[]) => {
        const l = log || {} as Partial<DailyLog>;
        const total = acts.length;
        const completed = acts.filter(a => a.status === 'concluido').length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            completed,
            total,
            percentage,
            leads_novos: Number(l.leads_novos) || 0,
            leads_contatados: Math.max(Number(l.ligacoes) || 0, Number(l.leads_contatados) || 0),
            agendamentos: Number(l.agendamentos) || 0,
            visitas: Number(l.visitas) || 0,
            matriculas: Number(l.matriculas) || 0
        };
    };

    // Transformation: Daily Reset for "Today's" View
    // Memoize the list transformation
    const todayActivities = useMemo(() => {
        return activities.map(a => {
            if (a.status === 'concluido' && a.updatedAt && !isToday(a.updatedAt)) {
                return { ...a, status: 'nao_iniciado' } as Activity;
            }
            return a;
        });
    }, [activities]);

    // Memoize the Orphaned + Yesterday logic
    const finalYesterdayActivities = useMemo(() => {
        // 1. Identify "Orphaned" activities: Completed yesterday but still in main list
        const orphanedYesterdayActivities = activities.filter(a =>
            a.status === 'concluido' && a.updatedAt && isYesterday(a.updatedAt)
        );

        // 2. Merge with loaded History
        const combinedYesterday = [...yesterdayActivitiesSnapshot];
        orphanedYesterdayActivities.forEach(orphan => {
            if (!combinedYesterday.some(y => String(y.id) === String(orphan.id))) {
                combinedYesterday.push(orphan);
            }
        });
        return combinedYesterday;
    }, [activities, yesterdayActivitiesSnapshot]);

    // Memoize final Metrics calculation
    const metrics = useMemo(() => {
        const total = todayActivities.length;
        const completed = todayActivities.filter(a => a.status === 'concluido').length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const log = todayLog || {} as Partial<DailyLog>;

        return {
            completed,
            total,
            percentage,
            leads_novos: Number(log.leads_novos) || 0,
            leads_contatados: Math.max(Number(log.ligacoes) || 0, Number(log.leads_contatados) || 0),
            agendamentos: Number(log.agendamentos) || 0,
            visitas: Number(log.visitas) || 0,
            matriculas: Number(log.matriculas) || 0,
            yesterday: calculateYesterdayMetrics(yesterdayLog, finalYesterdayActivities)
        };
    }, [todayActivities, todayLog, yesterdayLog, finalYesterdayActivities]);

    return { metrics, todayActivities, yesterdayActivities: finalYesterdayActivities };
}

