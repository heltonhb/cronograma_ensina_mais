
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from '../types/activity';
import { useAuth } from '../contexts/AuthContext';
import { openWhatsAppChat } from '../services/whatsappService';
import { calculateLeadScore, predictActivityDefaults } from '../services/aiService';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    activity?: Activity | null; // If null, creating new
}

export default function ActivityModal({ isOpen, onClose, activity }: ActivityModalProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState<Partial<Activity>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activity) {
            setFormData({ ...activity });
        } else {
            // Smart Defaults based on time of day
            const currentHour = new Date().getHours();
            const defaults = predictActivityDefaults(currentHour);

            // Calculate default time string (current hour + :00)
            const startStr = `${String(currentHour).padStart(2, '0')}:00`;
            const endHour = currentHour + 1;
            const endStr = `${String(endHour).padStart(2, '0')}:00`;

            setFormData({
                nome: defaults.nome,
                horario_inicio: startStr,
                horario_fim: endStr,
                status: 'nao_iniciado',
                cor: '#4285f4',
                icone: '📋',
                categoria: defaults.categoria,
                prioridade: defaults.prioridade,
                tipo: 'Obrigatória',
                meta_leads: defaults.meta_leads || 0,
                meta_visitas: defaults.meta_visitas || 0
            });
        }
    }, [activity, isOpen]);

    // Removed early return to allow AnimatePresence to work
    // if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert("Erro: Você precisa estar logado para salvar atividades.");
            console.error("Auth Error: No user found in context.");
            return;
        }

        setLoading(true);

        try {
            const id = formData.id || Date.now(); // Simple ID gen if new
            const finalActivity = {
                ...formData,
                id,
                updatedAt: new Date().toISOString()
            };

            console.log(`Saving activity ${id} for user ${user.uid}...`);
            // Save to Firestore (Atomic)
            await setDoc(doc(db, 'userData', user.uid, 'activities', String(id)), finalActivity, { merge: true });
            console.log("Activity saved successfully!");

            setLoading(false);
            onClose();
        } catch (error) {
            console.error("Error saving activity:", error);
            alert(`Erro ao salvar atividade: ${error}`);
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !formData.id) return;
        if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

        try {
            await deleteDoc(doc(db, 'userData', user.uid, 'activities', String(formData.id)));
            onClose();
        } catch (error) {
            console.error("Error deleting activity:", error);
        }
    }

    const handleDuplicate = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const newId = Date.now();
            const duplicatedActivity = {
                ...formData,
                id: newId,
                nome: `${formData.nome} (Cópia)`,
                updatedAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'userData', user.uid, 'activities', String(newId)), duplicatedActivity);
            setLoading(false);
            onClose();
            // Optional: Show toast success
        } catch (error) {
            console.error("Error duplicating activity:", error);
            alert(`Erro ao duplicar atividade: ${error}`);
            setLoading(false);
        }
    };

    const handleChange = (field: keyof Activity, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                {activity ? 'Editar Atividade' : 'Nova Atividade'}
                            </h2>
                            {activity && (
                                <div className="flex items-center gap-2">
                                    {/* Lead Score */}
                                    {(() => {
                                        const { score, color, label } = calculateLeadScore(formData as Activity);
                                        return (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-xs font-bold" style={{ color: color }}>
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                                                {label}
                                            </div>
                                        );
                                    })()}

                                    {/* WhatsApp */}

                                </div>
                            )}
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Atividade</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                    value={formData.nome || ''}
                                    onChange={(e) => handleChange('nome', e.target.value)}
                                />
                            </div>

                            {/* Horários */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Início</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                        value={formData.horario_inicio || ''}
                                        onChange={(e) => handleChange('horario_inicio', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fim</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                        value={formData.horario_fim || ''}
                                        onChange={(e) => handleChange('horario_fim', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Categoria e Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                        value={formData.categoria || 'Geral'}
                                        onChange={(e) => handleChange('categoria', e.target.value)}
                                    >
                                        <option value="Preparação">Preparação</option>
                                        <option value="Prospecção">Prospecção</option>
                                        <option value="Follow-up">Follow-up</option>
                                        <option value="Atendimento">Atendimento</option>
                                        <option value="Conversão">Conversão</option>
                                        <option value="Reativação">Reativação</option>
                                        <option value="Finalização">Finalização</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                        value={formData.status || 'nao_iniciado'}
                                        onChange={(e) => handleChange('status', e.target.value)}
                                    >
                                        <option value="nao_iniciado">Não Iniciado</option>
                                        <option value="em_andamento">Em Andamento</option>
                                        <option value="pausado">Pausado</option>
                                        <option value="concluido">Concluído</option>
                                        <option value="cancelado">Cancelado</option>
                                    </select>
                                </div>
                            </div>

                            {/* Metas (Se aplicável) */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Meta Leads</label>
                                    <input type="number" className="w-full p-1 text-sm rounded border" value={formData.meta_leads || 0} onChange={e => handleChange('meta_leads', parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Meta Visitas</label>
                                    <input type="number" className="w-full p-1 text-sm rounded border" value={formData.meta_visitas || 0} onChange={e => handleChange('meta_visitas', parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Leads Contatados</label>
                                    <input type="number" className="w-full p-1 text-sm rounded border" value={formData.leads_contatados || 0} onChange={e => handleChange('leads_contatados', parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Visitas Feitas</label>
                                    <input type="number" className="w-full p-1 text-sm rounded border" value={formData.visitas_realizadas || 0} onChange={e => handleChange('visitas_realizadas', parseInt(e.target.value))} />
                                </div>
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                    rows={3}
                                    value={formData.descricao || ''}
                                    onChange={(e) => handleChange('descricao', e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t dark:border-zinc-700">
                                {activity && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mr-auto"
                                    >
                                        Excluir
                                    </button>
                                )}

                                {activity && (
                                    <button
                                        type="button"
                                        onClick={handleDuplicate}
                                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg mr-2"
                                        title="Duplicar Atividade"
                                    >
                                        ❐ Duplicar
                                    </button>
                                )}

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
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
