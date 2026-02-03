'use client';

import React, { useEffect, useState } from 'react';
import { getCoachInsights, CoachInsight } from '../services/aiService';
import { useSchedule } from '../hooks/useSchedule';
import { FadeIn, ScaleIn } from './MotionWrapper';

export default function CoachWidget() {
    const { historyData } = useSchedule();
    const [insights, setInsights] = useState<CoachInsight[]>([]);

    useEffect(() => {
        // historyData is the array of logs. 
        // We pass it directly to the service.
        if (historyData) {
            const results = getCoachInsights(historyData);
            setInsights(results);
        }
    }, [historyData]);

    if (insights.length === 0) return null;

    return (
        <FadeIn className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-zinc-800 mb-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-2xl">
                    🧢
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Avaliação de Resultados</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Análise de performance diária</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {insights.map((insight, index) => (
                    <ScaleIn key={index} delay={index * 0.1} className={`
                        p-4 rounded-lg border flex flex-col gap-1
                        ${insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30' :
                            insight.type === 'praise' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30' :
                                'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30'}
                    `}>
                        <div className="flex justify-between items-start">
                            <span className={`text-xs font-bold uppercase tracking-wider mb-1
                                ${insight.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                    insight.type === 'praise' ? 'text-green-600 dark:text-green-400' :
                                        'text-blue-600 dark:text-blue-400'}
                             `}>
                                {insight.type === 'warning' ? '⚠️ Atenção' : insight.type === 'praise' ? '🎉 Parabéns' : '💡 Dica'}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {insight.message}
                        </p>
                        {insight.metric && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {insight.metric}
                            </p>
                        )}
                    </ScaleIn>
                ))}
            </div>
        </FadeIn>
    );
}
