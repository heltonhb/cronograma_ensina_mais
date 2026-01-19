import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DailyLog } from '../types/dailyLog';

import { Activity } from '../types/activity';

interface DailyLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    todayActivities?: Activity[];
    todayMetrics?: {
        completed: number;
        total: number;
    };
}

export default function DailyLogModal({ isOpen, onClose, todayActivities = [], todayMetrics }: DailyLogModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Local Date YYYY-MM-DD
    const now = new Date();
    // Adjust for timezone offset properly or use string manipulation
    const offset = now.getTimezoneOffset() * 60000;
    const today = new Date(now.getTime() - offset).toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    const [formData, setFormData] = useState<Partial<DailyLog>>({
        leads_novos: 0,
        leads_contatados: 0,
        agendamentos: 0,
        visitas: 0,
        matriculas: 0
    });

    // Reset date when opening
    useEffect(() => {
        if (isOpen) {
            setSelectedDate(today);
            // formData loading is handled by the next useEffect
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && user && selectedDate) {
            loadLogForDate(selectedDate);
        }
    }, [isOpen, user, selectedDate]);

    const loadLogForDate = async (dateKey: string) => {
        if (!user) return;
        setLoading(true);

        try {
            const docRef = doc(db, 'userData', user.uid, 'dailyLogs', dateKey);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setFormData(docSnap.data() as DailyLog);
            } else {
                setFormData({
                    leads_novos: 0,
                    leads_contatados: 0,
                    agendamentos: 0,
                    visitas: 0,
                    matriculas: 0
                });
            }
        } catch (error) {
            console.error("Error loading daily log:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof DailyLog, value: string) => {
        const numValue = parseInt(value) || 0;
        setFormData(prev => ({ ...prev, [field]: numValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // Calculate productivity stats unconditionally (snapshot of current state)
            const productivity_stats = todayActivities.reduce((acc, curr) => {
                const duration = curr.duracao || 0;
                if (curr.status === 'concluido' && curr.categoria) {
                    acc[curr.categoria] = (acc[curr.categoria] || 0) + duration;
                }
                return acc;
            }, {} as { [key: string]: number });

            const additionalData = {
                activities_completed: todayMetrics?.completed || 0,
                activities_total: todayMetrics?.total || 0,
                productivity_stats
            };

            await setDoc(doc(db, 'userData', user.uid, 'dailyLogs', selectedDate), {
                ...formData,
                ...additionalData,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            onClose();
        } catch (error) {
            console.error("Error saving daily log:", error);
            alert("Erro ao salvar dados.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 m-4"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                Acompanhamento Diário
                            </h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">&times;</button>
                        </div>

                        {/* Summary Always Visible if activities exist */}
                        {todayActivities.length > 0 && (
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">Resumo (Atividades Atuais)</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Atividades Concluídas:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{todayMetrics?.completed || 0} de {todayMetrics?.total || 0}</span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    *Estes dados serão salvos para o dia <strong>{selectedDate}</strong>.
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Date Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data do Registro</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Leads Novos</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                        value={formData.leads_novos}
                                        onChange={(e) => handleChange('leads_novos', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Leads Contatados</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                        value={formData.leads_contatados}
                                        onChange={(e) => handleChange('leads_contatados', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agendamentos</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                        value={formData.agendamentos}
                                        onChange={(e) => handleChange('agendamentos', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visitas</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                        value={formData.visitas}
                                        onChange={(e) => handleChange('visitas', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Matrículas</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white text-lg font-bold text-center"
                                    value={formData.matriculas}
                                    onChange={(e) => handleChange('matriculas', e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t dark:border-zinc-700">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 font-medium"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Dados'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
