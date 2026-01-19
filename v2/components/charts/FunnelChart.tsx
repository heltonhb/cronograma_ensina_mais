'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface FunnelChartProps {
    data: {
        stage: string;
        value: number;
        fill: string;
        label: string;
    }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
                <p className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function FunnelChart({ data }: FunnelChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados para o funil.</div>;
    }

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{
                        top: 5,
                        right: 30,
                        left: 40,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" strokeOpacity={0.5} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="label"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={(props: any) => <CustomTooltip {...props} />}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
