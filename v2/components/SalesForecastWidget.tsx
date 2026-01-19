'use client';

import React, { useEffect, useState } from 'react';
import { predictConversion, getAiSuggestion, AiPrediction, predictMonthlySales, SalesProjection } from '../services/aiService';
import { useSchedule } from '../hooks/useSchedule';
import { AnimateNumber, FadeIn, ScaleIn } from './MotionWrapper';

export default function SalesForecastWidget() {
    const { historyData, metrics, currentMonthStats } = useSchedule();
    const [prediction, setPrediction] = useState<AiPrediction | null>(null);
    const [monthlyProjection, setMonthlyProjection] = useState<SalesProjection | null>(null);

    useEffect(() => {
        if (historyData.length > 0) {
            // Convert array to object for the service { "YYYY-MM-DD": data }
            // Note: historyData comes as array from hook, we need a way to map it back or just use valid logic.
            // But the service expects specific structure. 
            // In v2 hook, historyData is array of { date: 'DD/MM', leads, visitas, matriculas }.
            // We need to approximate or adapt.
            // Let's create a mock object keyed by index for the service since the dates are just keys.

            // Reconstruct proper Date keys (YYYY-MM-DD) for seasonality logic.
            // historyData is 7 days: [Today-6, ..., Today]
            const today = new Date();
            const historyObj = historyData.reduce((acc: any, item: any, idx: number) => {
                const d = new Date();
                const daysAgo = 6 - idx; // Index 0 is 6 days ago, Index 6 is 0 days ago
                d.setDate(today.getDate() - daysAgo);

                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dayStr = String(d.getDate()).padStart(2, '0');
                const dateKey = `${y}-${m}-${dayStr}`;

                acc[dateKey] = item;
                return acc;
            }, {});

            const currentContext = {
                diaSemana: new Date().getDay(),
                visitasRealizadas: metrics.visitas
            };

            const result = predictConversion(currentContext, historyObj);
            setPrediction(result);

            if (currentMonthStats) {
                const projection = predictMonthlySales(currentMonthStats.sales, historyData);
                setMonthlyProjection(projection);
            }
        }
    }, [historyData, metrics]);

    if (!prediction) return null;

    return (
        <FadeIn className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 text-white shadow-lg mb-6 relative overflow-hidden" delay={0.2}>
            <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🔮</div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-indigo-100">Previsão de Vendas (IA)</h3>
                        <p className="text-sm text-indigo-300">Baseado no seu histórico recente</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-xs font-bold">
                        BETA
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Gauge */}
                    <div className="relative w-24 h-24 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="50%" cy="50%" r="40"
                                stroke="currentColor" strokeWidth="8"
                                fill="transparent" className="text-indigo-950"
                            />
                            <circle
                                cx="50%" cy="50%" r="40"
                                stroke="currentColor" strokeWidth="8"
                                fill="transparent" className="text-cyan-400 transition-all duration-1000 ease-out"
                                strokeDasharray="251.2"
                                strokeDashoffset={251.2 - (251.2 * prediction.probability) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-bold"><AnimateNumber value={prediction.probability} />%</span>
                            <span className="text-[10px] text-indigo-300">PROB.</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <div className="mb-2 text-sm font-medium">
                            {prediction.explanation}
                        </div>
                        <ScaleIn delay={0.5} className="text-xs text-cyan-300 bg-cyan-950/30 p-2 rounded border border-cyan-500/20">
                            💡 {getAiSuggestion(prediction.probability)}
                        </ScaleIn>
                    </div>
                </div>
            </div>

            {/* Monthly Projection Section */}
            {monthlyProjection && (
                <div className="mt-6 pt-4 border-t border-indigo-800/50">
                    <div className="flex justify-between items-end mb-2">
                        <h4 className="text-sm font-semibold text-indigo-200">Projeção Mensal</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${monthlyProjection.onTrack ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {monthlyProjection.onTrack ? 'No Caminho' : 'Abaixo da Meta'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <div className="text-3xl font-bold"><AnimateNumber value={monthlyProjection.projected} /></div>
                            <div className="text-[10px] text-indigo-400 uppercase tracking-wider">Matrículas Previstas</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-semibold text-indigo-300"><AnimateNumber value={monthlyProjection.current} /></div>
                            <div className="text-[10px] text-indigo-400 uppercase tracking-wider">Atuais</div>
                        </div>
                    </div>

                    <div className="bg-indigo-950/50 rounded-lg p-3 text-xs text-indigo-200 border border-indigo-800/30 flex items-start gap-2">
                        <span>{monthlyProjection.message.includes('🚀') ? '🚀' : monthlyProjection.message.includes('⚠️') ? '⚠️' : '📈'}</span>
                        <span>{monthlyProjection.message}</span>
                    </div>
                </div>
            )}
        </FadeIn>
    );
}
