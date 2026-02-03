'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from '../types/activity';
import { generateDailyPlanSuggestion, DailyPlanSuggestion } from '../services/aiService';

interface SmartPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    yesterdayActivities: Activity[];
    todayActivities: Activity[];
    onConfirmPlan: (activities: Activity[]) => void;
}

export default function SmartPlannerModal({ isOpen, onClose, yesterdayActivities, todayActivities, onConfirmPlan }: SmartPlannerModalProps) {
    const [suggestion, setSuggestion] = useState<DailyPlanSuggestion | null>(null);
    const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && yesterdayActivities.length > 0) {
            setIsLoading(true);
            const fetchSuggestion = async () => {
                try {
                    const result = await generateDailyPlanSuggestion(yesterdayActivities);

                    // Deduplicate: Filter out activities that already exist today (by name and start time)
                    const existingKeys = new Set(todayActivities.map(a => `${a.nome}-${a.horario_inicio}`));
                    result.activities = result.activities.filter(a => !existingKeys.has(`${a.nome}-${a.horario_inicio}`));

                    if (result.activities.length === 0) {
                        setSuggestion({ activities: [], summary: "Todas as atividades sugeridas já foram adicionadas para hoje!" });
                    } else {
                        setSuggestion(result);
                        // Select all by default
                        const allIds = new Set(result.activities.map(a => String(a.id)));
                        setSelectedActivities(allIds);
                    }
                } catch (error) {
                    console.error("Error generating plan:", error);
                    setSuggestion({ activities: [], summary: "Erro ao gerar sugestões. Tente novamente." });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSuggestion();
        } else if (isOpen) {
            setSuggestion({ activities: [], summary: "Não encontramos atividades de ontem para basear o planejamento." });
        }
    }, [isOpen, yesterdayActivities]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedActivities);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedActivities(newSet);
    };

    const handleConfirm = () => {
        if (!suggestion) return;
        const finalActivities = suggestion.activities.filter(a => selectedActivities.has(String(a.id)));
        onConfirmPlan(finalActivities);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white shrink-0">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        ✨ Agendamento Inteligente
                    </h2>
                    <p className="opacity-90 mt-1">
                        Preparei uma sugestão para hoje baseada na sua performance de ontem.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p>Analisando histórico e definindo metas...</p>
                        </div>
                    ) : suggestion ? (
                        <>
                            <div className={`p-4 rounded-lg mb-6 border ${suggestion.activities.length === 0 ? 'bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'}`}>
                                <p className={`${suggestion.activities.length === 0 ? 'text-yellow-800 dark:text-yellow-200' : 'text-blue-800 dark:text-blue-200'} text-sm font-medium`}>
                                    💡 {suggestion.summary}
                                </p>
                            </div>

                            {suggestion.activities.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 px-2">
                                        <span>Atividade Sugerida</span>
                                        <span>Meta Ajustada</span>
                                    </div>
                                    {suggestion.activities.map((act) => (
                                        <div
                                            key={String(act.id)}
                                            onClick={() => toggleSelection(String(act.id))}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group
                                                ${selectedActivities.has(String(act.id))
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                                                    : 'border-gray-200 dark:border-zinc-800 opacity-60 grayscale'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border 
                                                    ${selectedActivities.has(String(act.id)) ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-400'}
                                                `}>
                                                    {selectedActivities.has(String(act.id)) && '✓'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-200">{act.nome}</h4>
                                                    <div className="text-xs text-gray-500 flex gap-2">
                                                        <span>⏰ {act.horario_inicio}</span>
                                                        <span style={{ color: act.cor }}>● {act.icone}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                {act.meta_leads ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                            {act.meta_leads} leads
                                                        </span>
                                                        {act.meta_leads > (yesterdayActivities.find(y => y.nome === act.nome)?.meta_leads || 0) && (
                                                            <span className="text-[10px] text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                                                                📈 Meta Aumentada
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="text-4xl mb-3">✅</div>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                                        Parece que seu cronograma de hoje já está alinhado com o que faríamos. Parabéns!
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            Nenhuma sugestão disponível. Tente criar atividades manualmente.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3 bg-gray-50 dark:bg-zinc-950">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg font-medium">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedActivities.size === 0 || isLoading}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all"
                    >
                        Confirmar ({selectedActivities.size})
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
