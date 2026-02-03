'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface PerformanceChartProps {
    data: {
        date: string;
        leads_novos: number;
        leads_negativados?: number;
        ligacoes: number;
        agendamentos: number;
        visitas: number;
        matriculas: number;
    }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-lg border border-gray-100 dark:border-zinc-700">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs" style={{ color: entry.color }}>
                            {entry.name}: <span className="font-semibold">{entry.value}</span>
                        </p>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function PerformanceChart({ data }: PerformanceChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados suficientes para o gráfico.</div>;
    }

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 30,
                    }}
                >
                    <defs>
                        <linearGradient id="colorLeadsNovos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLeadsNegativados" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#71717a" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D946EF" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#D946EF" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorAgendamentos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        tickLine={false}
                        axisLine={false}
                    />

                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                        formatter={(value) => <span className="text-gray-700 dark:text-gray-300">{value}</span>}
                    />
                    <Area
                        type="monotone"
                        dataKey="leads_novos"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorLeadsNovos)"
                        name="Leads Novos"
                    />
                    <Area
                        type="monotone"
                        dataKey="ligacoes"
                        stroke="#D946EF"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorLeads)"
                        name="Leads Contatados"
                    />
                    <Area
                        type="monotone"
                        dataKey="agendamentos"
                        stroke="#EF4444"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorAgendamentos)"
                        name="Agendamentos"
                    />
                    <Area
                        type="monotone"
                        dataKey="visitas"
                        stroke="#22C55E"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorVisitas)"
                        name="Visitas"
                    />
                    <Area
                        type="monotone"
                        dataKey="leads_negativados"
                        stroke="#71717a"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorLeadsNegativados)"
                        name="Leads Negativados"
                    />
                    <Area
                        type="monotone"
                        dataKey="matriculas"
                        stroke="#F59E0B"
                        fill="none"
                        fillOpacity={0}
                        strokeWidth={4}
                        name="Matrículas"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
