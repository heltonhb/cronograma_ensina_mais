'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { deduplicateActivities } from '../utils/deduplicateActivities';
import { DailyLog } from '../types/dailyLog';
import FunnelChart from './charts/FunnelChart';
import PerformanceChart from './PerformanceChart';
import DonutChart from './charts/DonutChart';
import CompletionChart from './charts/CompletionChart';
import MonthlyPerformanceChart from './charts/MonthlyPerformanceChart';
import { getSmartSixMonthData, calculateAggregatedStats, MonthlyStats, AggregatedStats } from '../utils/analytics';
import { downloadJson } from '../utils/export';
import { fetchFullBackup, restoreBackup, BackupData } from '../utils/backup';


interface ReportsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReportsModal({ isOpen, onClose }: ReportsModalProps) {
    const { user } = useAuth();
    const [period, setPeriod] = useState(30); // 7, 15, 30
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [allLogs, setAllLogs] = useState<DailyLog[]>([]); // 6 months cache
    const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyStats>>({});
    const [statsKPI, setStatsKPI] = useState<AggregatedStats | null>(null);

    const handleDeduplicate = async () => {
        if (!user) return;
        if (!confirm('Isso irá remover atividades com mesmo nome e horário, mantendo apenas a mais recente. Deseja continuar?')) return;

        setLoading(true);
        try {
            const result = await deduplicateActivities(user.uid);
            if (result.count > 0) {
                alert(`Sucesso! ${result.count} duplicatas foram removidas. A página será recarregada.`);
                window.location.reload();
            } else {
                alert("Nenhuma duplicata exata encontrada com os critérios atuais (Nome + Horário).");
            }
        } catch (error) {
            console.error("Error deduplicating:", error);
            alert("Erro ao remover duplicatas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && user) {
            fetchAllData();
        }
    }, [isOpen, user]);

    // Local filter when period changes
    useEffect(() => {
        if (allLogs.length > 0) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - period);
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const filtered = allLogs.filter(l => (l as any).date >= startStr && (l as any).date <= endStr);
            setLogs(filtered);
        }
    }, [period, allLogs]);

    const fetchAllData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch 6 months roughly (180 days)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 180);
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const logsRef = collection(db, 'userData', user.uid, 'dailyLogs');
            const q = query(logsRef);
            const snapshot = await getDocs(q);

            const logsWithDate = snapshot.docs
                .map(d => ({ ...d.data() as DailyLog, date: d.id }))
                .filter(l => l.date >= startStr && l.date <= endStr)
                .sort((a, b) => a.date.localeCompare(b.date));

            setAllLogs(logsWithDate);

            // Calculate Monthly Stats immediately
            const mData = getSmartSixMonthData(logsWithDate);
            setMonthlyData(mData);
            setStatsKPI(calculateAggregatedStats(mData));

        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Aggregations ---
    const metrics = logs.reduce((acc, log) => {
        const agend = Number(log.agendamentos) || 0;
        const lig = Math.max(Number(log.ligacoes) || 0, Number(log.leads_contatados) || 0); // Handle legacy
        const leads = Number(log.leads_novos) || 0;
        const visitas = Number(log.visitas) || 0;
        const mat = Number(log.matriculas) || 0;

        return {
            leads: acc.leads + leads,
            ligacoes: acc.ligacoes + lig,
            agendamentos: acc.agendamentos + agend,
            visitas: acc.visitas + visitas,
            matriculas: acc.matriculas + mat
        };
    }, { leads: 0, ligacoes: 0, agendamentos: 0, visitas: 0, matriculas: 0 });

    // --- Schedule Metrics Aggregation ---
    const categoryStats = logs.reduce((acc, log) => {
        const stats = log.productivity_stats || {};
        Object.entries(stats).forEach(([cat, min]) => {
            acc[cat] = (acc[cat] || 0) + (Number(min) || 0);
        });
        return acc;
    }, {} as { [key: string]: number });

    const categoryData = Object.entries(categoryStats).map(([name, value]) => ({ name, value }));

    const completionData = logs.map(log => {
        const [y, m, d] = (log as any).date.split('-');
        return {
            date: `${d}/${m}`,
            concluidas: Number(log.activities_completed) || 0,
            total: Number(log.activities_total) || 0
        };
    });

    // --- Conversions ---
    const calcRate = (part: number, total: number) => total > 0 ? Math.round((part / total) * 100) : 0;

    const rates = {
        leadsToContact: calcRate(metrics.ligacoes, metrics.leads),
        contactToSchedule: calcRate(metrics.agendamentos, metrics.ligacoes),
        scheduleToVisit: calcRate(metrics.visitas, metrics.agendamentos),
        visitToEnroll: calcRate(metrics.matriculas, metrics.visitas),
        global: calcRate(metrics.matriculas, metrics.leads)
    };

    // --- Chart Data Preparation ---

    // Funnel Data
    const funnelData = [
        { label: 'Leads', value: metrics.leads, fill: '#3B82F6', stage: 'leads' },
        { label: 'Contatos', value: metrics.ligacoes, fill: '#8884d8', stage: 'contacts' },
        { label: 'Agend.', value: metrics.agendamentos, fill: '#EF4444', stage: 'schedules' },
        { label: 'Visitas', value: metrics.visitas, fill: '#22c55e', stage: 'visits' },
        { label: 'Matrí.', value: metrics.matriculas, fill: '#F59E0B', stage: 'sales' },
    ];

    // Evolution Data (Daily)
    const evolutionData = logs.map(log => {
        const [y, m, d] = (log as any).date.split('-');
        return {
            date: `${d}/${m}`,
            leads_novos: Number(log.leads_novos) || 0,
            leads_negativados: Number(log.leads_negativados) || 0,
            ligacoes: Math.max(Number(log.ligacoes) || 0, Number(log.leads_contatados) || 0),
            agendamentos: Number(log.agendamentos) || 0,
            visitas: Number(log.visitas) || 0,
            matriculas: Number(log.matriculas) || 0
        };
    });



    const handleExportBackup = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await fetchFullBackup(user.uid);
            downloadJson(data, `backup_completo_${new Date().toISOString().split('T')[0]}`);
        } catch (error) {
            console.error("Erro ao exportar backup:", error);
            alert("Erro ao criar backup. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !event.target.files || !event.target.files[0]) return;

        const file = event.target.files[0];
        if (!confirm(`Tem certeza que deseja restaurar o backup "${file.name}"? Isso irá sobrescrever/mesclar dados existentes.`)) {
            event.target.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                setLoading(true);
                const json = e.target?.result as string;
                const data = JSON.parse(json) as BackupData;

                await restoreBackup(user.uid, data);

                alert("Backup restaurado com sucesso! A página será recarregada.");
                window.location.reload();
            } catch (error) {
                console.error("Erro ao importar backup:", error);
                alert("Erro ao restaurar backup. Verifique se o arquivo é válido.");
            } finally {
                setLoading(false);
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };



    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">Relatórios de Performance</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Análise detalhada do seu funil de vendas</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 hidden sm:flex">
                            {[7, 15, 30].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setPeriod(d)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${period === d ? 'bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                >
                                    {d} Dias
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Fechar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div id="reports-content" className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-950">

                    {/* Top Metrics Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        <MetricCard label="Leads Novos" value={metrics.leads} color="blue" icon="👥" />
                        <MetricCard label="Contatados" value={metrics.ligacoes} color="indigo" icon="📞" />
                        <MetricCard label="Agendamentos" value={metrics.agendamentos} color="red" icon="📅" />
                        <MetricCard label="Visitas" value={metrics.visitas} color="green" icon="📍" />
                        <MetricCard label="Matrículas" value={metrics.matriculas} color="amber" icon="🎓" />
                    </div>

                    {/* Main Charts Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                        {/* Left: Funnel Chart */}
                        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 dark:text-gray-200">Funil de Conversão</h3>
                            <FunnelChart data={funnelData} />

                            <div className="mt-4 space-y-3">
                                <ConversionRow label="Leads → Contato" rate={rates.leadsToContact} color="text-indigo-500" />
                                <ConversionRow label="Contato → Agend." rate={rates.contactToSchedule} color="text-red-500" />
                                <ConversionRow label="Agend. → Visita" rate={rates.scheduleToVisit} color="text-green-500" />
                                <ConversionRow label="Visita → Matrícula" rate={rates.visitToEnroll} color="text-amber-500" />
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase">Conversão Global</div>
                                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{rates.global}%</div>
                                <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">De Leads para Matrículas</div>
                            </div>
                        </div>

                        {/* Right: Evolution Chart */}
                        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col">
                            <h3 className="text-lg font-bold mb-4 dark:text-gray-200">Evolução Diária</h3>
                            <div className="flex-1 min-h-[300px]">
                                <PerformanceChart data={evolutionData} />
                            </div>
                            <div className="mt-4 p-4 border-t border-gray-100 dark:border-zinc-800 text-sm text-gray-500">
                                <p>Este gráfico mostra a tendência diária das suas métricas no período selecionado. Use-o para identificar dias de pico ou baixa produtividade.</p>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Reports Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 dark:text-gray-200">Distribuição de Tempo (Cronograma)</h3>
                            <DonutChart data={categoryData} />
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 dark:text-gray-200">Taxa de Conclusão de Atividades</h3>
                            <CompletionChart data={completionData} />
                        </div>
                    </div>

                    {/* Monthly Consolidation Section */}
                    {Object.keys(monthlyData).length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-4 dark:text-gray-200 flex items-center gap-2">
                                📅 Consolidação Mensal
                                <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full">Últimos 6 Meses</span>
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Chart */}
                                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4">Evolução e Conversão</h4>
                                    <MonthlyPerformanceChart
                                        data={Object.keys(monthlyData).sort().map(k => {
                                            const d = monthlyData[k];
                                            const [y, m] = k.split('-');
                                            return {
                                                name: `${m}/${y}`,
                                                leads: d.leads,
                                                leads_negativados: d.leads_negativados || 0,
                                                calls: d.calls,
                                                visits: d.visits,
                                                sales: d.sales,
                                                conversion: d.leads > 0 ? Number(((d.sales / d.leads) * 100).toFixed(1)) : 0
                                            };
                                        })}
                                    />
                                </div>

                                {/* KPI Table */}
                                <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4">Estatísticas do Período</h4>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-zinc-800/50">
                                                <tr>
                                                    <th className="px-3 py-2 rounded-l-lg">Métrica</th>
                                                    <th className="px-3 py-2 text-right">Total</th>
                                                    <th className="px-3 py-2 text-right">Média</th>
                                                    <th className="px-3 py-2 rounded-r-lg text-right">Desvio</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                                {statsKPI && (
                                                    <>
                                                        <StatRow label="Leads" data={statsKPI.leads} />
                                                        <StatRow label="Ligações" data={statsKPI.calls} />
                                                        <StatRow label="Visitas" data={statsKPI.visits} />
                                                        <StatRow label="Matrículas" data={statsKPI.sales} />
                                                        <StatRow label="Conversão" data={statsKPI.conversion} isPercent />
                                                    </>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-4 text-xs text-gray-400 italic">
                                        * Média e Desvio Padrão calculados sobre os meses disponíveis.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="px-4 py-2 border-t border-gray-200 dark:border-zinc-800 flex flex-wrap justify-between items-center gap-2">
                    <button
                        onClick={handleDeduplicate}
                        disabled={loading}
                        className="text-amber-600 hover:text-amber-700 text-xs flex items-center gap-1"
                    >
                        ⚠️ Remover Duplicatas
                    </button>


                    <input
                        type="file"
                        id="import-backup"
                        className="hidden"
                        accept=".json"
                        onChange={handleImportBackup}
                    />

                    {/* Updated Buttons */}
                    <div className="flex flex-wrap gap-2 justify-end flex-1">
                        <label
                            htmlFor="import-backup"
                            className={`px-3 py-1.5 text-xs border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-500 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer flex items-center gap-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            📥 Restaurar
                        </label>

                        <button
                            onClick={handleExportBackup}
                            disabled={loading}
                            className="px-3 py-1.5 text-xs border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-1"
                        >
                            💾 Backup
                        </button>

                        <button
                            onClick={() => {
                                const printContent = document.getElementById('reports-content');
                                if (printContent) {
                                    const printWindow = window.open('', '', 'height=600,width=800');
                                    if (printWindow) {
                                        printWindow.document.write('<html><head><title>Relatório</title>');
                                        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
                                        styles.forEach(node => {
                                            printWindow.document.write(node.outerHTML);
                                        });
                                        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
                                        printWindow.document.write('</head><body class="bg-white">');
                                        printWindow.document.write(printContent.outerHTML);
                                        printWindow.document.write('</body></html>');
                                        printWindow.document.close();
                                        printWindow.focus();
                                        setTimeout(() => {
                                            printWindow.print();
                                            printWindow.close();
                                        }, 1000);
                                    }
                                }
                            }}
                            className="px-3 py-1.5 text-xs border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-1"
                        >
                            🖨️ Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helpers
const MetricCard = ({ label, value, color, icon }: any) => {
    const theme: any = {
        blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-800' },
        indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-800' },
        cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-100 dark:border-cyan-800' },
        green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-800' },
        red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-100 dark:border-red-800' },
    };

    const t = theme[color] || theme.blue;

    return (
        <div className={`relative p-5 rounded-2xl border ${t.border} ${t.bg} transition-all duration-200 hover:scale-[1.02] hover:shadow-md`}>
            <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${t.text} opacity-90`}>{label}</span>
                <span className="text-2xl filter drop-shadow-sm">{icon}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">{value}</span>
            </div>
        </div>
    );
};

const ConversionRow = ({ label, rate, color }: any) => (
    <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div style={{ width: `${rate}%` }} className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}></div>
            </div>
            <span className={`font-bold ${color}`}>{rate}%</span>
        </div>
    </div>
);

const StatRow = ({ label, data, isPercent = false }: { label: string, data: any, isPercent?: boolean }) => (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition-colors">
        <td className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300">{label}</td>
        <td className="px-3 py-3 text-right font-bold text-gray-900 dark:text-white">
            {isPercent ? `${data?.total?.toFixed(1) || 0}%` : (data?.total || 0)}
        </td>
        <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-400">
            {data?.mean?.toFixed(1) || 0}{isPercent ? '%' : ''}
        </td>
        <td className="px-3 py-3 text-right text-gray-500 dark:text-gray-500">
            ±{data?.sd?.toFixed(1) || 0}{isPercent ? '%' : ''}
        </td>
    </tr>
);
