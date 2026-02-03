import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { DailyLog } from '../types/dailyLog';

export function useDailyLog() {
    const { user, loading: authLoading } = useAuth();
    const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
    const [yesterdayLog, setYesterdayLog] = useState<DailyLog | null>(null);
    const [yesterdayActivities, setYesterdayActivities] = useState<any[]>([]);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonthStats, setCurrentMonthStats] = useState({ sales: 0, revenue: 0 });

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setTodayLog(null);
            setYesterdayLog(null);
            setYesterdayActivities([]);
            setHistoryData([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayKey = `${year}-${month}-${day}`;

        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(now.getDate() - 1);
        const yYear = yesterdayDate.getFullYear();
        const yMonth = String(yesterdayDate.getMonth() + 1).padStart(2, '0');
        const yDay = String(yesterdayDate.getDate()).padStart(2, '0');
        const yesterdayKey = `${yYear}-${yMonth}-${yDay}`;

        // 1. Subscribe to Today's Log
        const dailyLogRef = doc(db, 'userData', user.uid, 'dailyLogs', todayKey);
        const unsubscribeDailyLog = onSnapshot(dailyLogRef, (docSnap) => {
            if (docSnap.exists()) {
                setTodayLog(docSnap.data() as DailyLog);
            } else {
                setTodayLog(null);
            }
        }, (error) => console.error("Error fetching daily log:", error));

        // 2. Fetch Yesterday's Log
        const yesterdayLogRef = doc(db, 'userData', user.uid, 'dailyLogs', yesterdayKey);
        getDoc(yesterdayLogRef).then(snap => {
            if (snap.exists()) {
                setYesterdayLog(snap.data() as DailyLog);
            } else {
                setYesterdayLog(null);
            }
        }).catch(err => console.error("Error fetching yesterday log:", err));

        // 2.5 Fetch Yesterday Activities Snapshot
        const historyRef = doc(db, 'userData', user.uid, 'scheduleHistory', yesterdayKey);
        getDoc(historyRef).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                if (Array.isArray(data.activities)) {
                    setYesterdayActivities(data.activities);
                } else {
                    setYesterdayActivities([]);
                }
            } else {
                setYesterdayActivities([]);
            }
        }).catch(err => console.error("Error fetching yesterday activities:", err));

        // 3. Fetch History (Last 7 Days)
        const fetchHistory = async () => {
            const dates: string[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dayStr = String(d.getDate()).padStart(2, '0');
                dates.push(`${y}-${m}-${dayStr}`);
            }

            try {
                // 3a. History (Last 7 Days)
                const promises = dates.map(async (dateKey) => {
                    const snap = await getDoc(doc(db, 'userData', user.uid, 'dailyLogs', dateKey));
                    if (snap.exists()) {
                        const data = snap.data() as DailyLog;
                        const [_, mm, dd] = dateKey.split('-');
                        return {
                            date: `${dd}/${mm}`,
                            leads_novos: Number(data.leads_novos) || 0,
                            leads_negativados: Number(data.leads_negativados) || 0,
                            ligacoes: (Number(data.leads_contatados) || 0) + (Number(data.ligacoes) || 0),
                            agendamentos: Number(data.agendamentos) || 0,
                            visitas: Number(data.visitas) || 0,
                            matriculas: Number(data.matriculas) || 0
                        };
                    }
                    const [_, mm, dd] = dateKey.split('-');
                    return { date: `${dd}/${mm}`, leads_novos: 0, leads_negativados: 0, ligacoes: 0, agendamentos: 0, visitas: 0, matriculas: 0 };
                });

                const results = await Promise.all(promises);
                setHistoryData(results);

                // 3b. Current Month Totals (Naive approach: iterate 1..Today)
                // For a more robust app, we should use a Firestore Query with documentId() range, 
                // but let's stick to getDoc loop for simplicity if day count is small (max 31 reads) 
                // OR better: just Query the collection.
                // Let's use getDocs with Query for optimization.
                const { getDocs, query, collection, where, documentId } = await import('firebase/firestore');

                const startOfMonth = `${year}-${month}-01`;
                const endOfMonth = `${year}-${month}-31`; // Approx

                const q = query(
                    collection(db, 'userData', user.uid, 'dailyLogs'),
                    where(documentId(), '>=', startOfMonth),
                    where(documentId(), '<=', endOfMonth)
                );

                const querySnapshot = await getDocs(q);
                let totalSales = 0;
                let totalRevenue = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data() as DailyLog;
                    totalSales += Number(data.matriculas || 0);
                    totalRevenue += Number(data.vendas_valor || 0);
                });

                setCurrentMonthStats({ sales: totalSales, revenue: totalRevenue });

            } catch (e) {
                console.error("Error fetching history/month stats", e);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        return () => {
            unsubscribeDailyLog();
        };
    }, [user, authLoading]);

    return { todayLog, yesterdayLog, yesterdayActivities, historyData, loading, currentMonthStats };
}
