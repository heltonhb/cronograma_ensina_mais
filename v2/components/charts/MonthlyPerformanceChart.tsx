'use client';

import React from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface MonthlyPerformanceChartProps {
    data: {
        name: string; // Month name (e.g., "Jan/24")
        leads: number;
        leads_negativados?: number;
        calls: number;
        visits: number;
        sales: number;
        conversion: number; // Percentage
    }[];
}

export default function MonthlyPerformanceChart({ data }: MonthlyPerformanceChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados mensais disponíveis.</div>;
    }

    return (
        <div className="w-full h-[400px] overflow-x-auto">
            <div className="min-w-[600px] h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{
                            top: 30,
                            right: 30,
                            bottom: 40,
                            left: 10,
                        }}
                    >
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                        <XAxis
                            dataKey="name"
                            scale="point"
                            padding={{ left: 30, right: 30 }}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="#8884d8"
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#ef4444"
                            unit="%"
                            tick={{ fontSize: 12, fill: '#ef4444' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
                                            <div className="space-y-1">
                                                {payload.map((entry: any, index: number) => (
                                                    <p key={index} className="text-xs font-medium" style={{ color: entry.color }}>
                                                        {entry.name}: {entry.value}{entry.unit}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span className="text-gray-700 dark:text-gray-300">{value}</span>}
                        />

                        <Bar yAxisId="left" dataKey="leads" name="Leads" fill="#94a3b8" barSize={10} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="leads_negativados" name="Leads Neg." fill="#71717a" barSize={10} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="calls" name="Ligações" fill="#3b82f6" barSize={10} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="visits" name="Visitas" fill="#f59e0b" barSize={10} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="sales" name="Matrículas" fill="#22c55e" barSize={10} radius={[4, 4, 0, 0]} />

                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="conversion"
                            name="Taxa Conversão"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={{ r: 4, stroke: '#ef4444', fill: '#fff', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
