import { useActivities } from './useActivities';
import { useDailyLog } from './useDailyLog';
import { useMetrics } from './useMetrics';

export function useSchedule() {
    // 1. Manage Activities (Firestore Subscription)
    const {
        activities: rawActivities,
        loading: activitiesLoading,
        updateActivityStatus,
        deleteActivity,
        addActivity
    } = useActivities();

    // 2. Manage Daily Logs & History
    const {
        todayLog,
        yesterdayLog,
        yesterdayActivities: yesterdaySnapshot,
        historyData,
        loading: logsLoading,
        currentMonthStats
    } = useDailyLog();

    // 3. Calculate Metrics & Transformations (Pure Logic)
    const {
        metrics,
        todayActivities,
        yesterdayActivities
    } = useMetrics({
        activities: rawActivities,
        todayLog,
        yesterdayLog,
        yesterdayActivitiesSnapshot: yesterdaySnapshot
    });

    const loading = activitiesLoading || logsLoading;

    return {
        rawActivities,       // RAW list for snapshots/Modals
        activities: todayActivities, // The transformed "Today" list
        yesterdayActivities,         // The combined Yesterday list
        metrics,
        loading,
        historyData,
        updateActivityStatus,
        deleteActivity,
        addActivity,
        currentMonthStats
    };
}
