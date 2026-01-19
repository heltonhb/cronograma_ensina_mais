'use client';

import React, { useState, useEffect } from 'react';
import { useGamification, DEFAULT_RULES } from '../contexts/GamificationContext';

interface GamificationAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GamificationAdminModal({ isOpen, onClose }: GamificationAdminModalProps) {
    const { state, updateRules, resetMatriculadorProfile } = useGamification();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    // Local state for form
    const [rules, setRules] = useState(state.rules || DEFAULT_RULES);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            setIsAuthenticated(false);
            setPasswordInput('');
            setRules(state.rules || DEFAULT_RULES);
            setNewPassword('');
        }
    }, [isOpen, state.rules]);

    if (!isOpen) return null;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const currentPassword = state.adminPassword || 'admin';
        if (passwordInput === currentPassword) {
            setIsAuthenticated(true);
        } else {
            alert("Senha incorreta!");
        }
    };

    const handleSave = async () => {
        await updateRules(rules, newPassword || undefined);
        onClose();
    };

    const handleReset = async () => {
        if (confirm("ATENÇÃO: Isso vai zerar todo o progresso (XP, Nível, Ofensiva).\n\nUse isso apenas ao trocar de funcionário.\n\nTem certeza absoluta?")) {
            await resetMatriculadorProfile();
            onClose();
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-8 w-full max-w-sm relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl">&times;</button>

                    <h2 className="text-xl font-bold mb-4 dark:text-white text-center">Acesso Administrativo</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha de Admin</label>
                            <input
                                type="password"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                                placeholder="Padrão: admin"
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                            Acessar
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl z-10"
                >
                    &times;
                </button>

                <div className="flex items-center gap-2 mb-6">
                    <span className="text-2xl">⚙️</span>
                    <h2 className="text-2xl font-bold dark:text-white">Configurar Gamificação</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* XP Rules */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-zinc-700">Regras de XP</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 items-center gap-2">
                                <label className="text-sm text-gray-600 dark:text-gray-400">XP por Visita</label>
                                <input type="number" className="p-1 border rounded dark:bg-zinc-800 dark:border-zinc-700" value={rules.xp_visit} onChange={e => setRules({ ...rules, xp_visit: parseInt(e.target.value) })} />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <label className="text-sm text-gray-600 dark:text-gray-400">XP por Matrícula</label>
                                <input type="number" className="p-1 border rounded dark:bg-zinc-800 dark:border-zinc-700" value={rules.xp_sale} onChange={e => setRules({ ...rules, xp_sale: parseInt(e.target.value) })} />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <label className="text-sm text-gray-600 dark:text-gray-400">XP por Agendamento</label>
                                <input type="number" className="p-1 border rounded dark:bg-zinc-800 dark:border-zinc-700" value={rules.xp_schedule} onChange={e => setRules({ ...rules, xp_schedule: parseInt(e.target.value) })} />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <label className="text-sm text-gray-600 dark:text-gray-400">XP por Lead</label>
                                <input type="number" className="p-1 border rounded dark:bg-zinc-800 dark:border-zinc-700" value={rules.xp_lead} onChange={e => setRules({ ...rules, xp_lead: parseInt(e.target.value) })} />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <label className="text-sm text-gray-600 dark:text-gray-400">XP por Ligação</label>
                                <input type="number" className="p-1 border rounded dark:bg-zinc-800 dark:border-zinc-700" value={rules.xp_call} onChange={e => setRules({ ...rules, xp_call: parseInt(e.target.value) })} />
                            </div>

                            <hr className="my-2 dark:border-zinc-800" />

                            <div className="grid grid-cols-2 items-center gap-2">
                                <label className="text-sm text-gray-600 dark:text-gray-400">XP Tarefa Vendas</label>
                                <input type="number" className="p-1 border rounded dark:bg-zinc-800 dark:border-zinc-700" value={rules.xp_task_sales} onChange={e => setRules({ ...rules, xp_task_sales: parseInt(e.target.value) })} />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <label className="text-sm text-gray-600 dark:text-gray-400">XP Tarefa Admin</label>
                                <input type="number" className="p-1 border rounded dark:bg-zinc-800 dark:border-zinc-700" value={rules.xp_task_admin} onChange={e => setRules({ ...rules, xp_task_admin: parseInt(e.target.value) })} />
                            </div>
                        </div>
                    </div>

                    {/* Admin Settings */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-zinc-700">Segurança & Reset</h3>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alterar Senha de Admin</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Deixe vazio para manter a atual"
                            />
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                            <h4 className="font-bold text-red-800 dark:text-red-400 text-sm mb-2">Zona de Perigo</h4>
                            <p className="text-xs text-red-600 dark:text-red-300 mb-3">
                                Zerar o perfil remove todo o XP e níveis acumulados. Use apenas quando um novo funcionário assumir o sistema.
                            </p>
                            <button
                                onClick={handleReset}
                                className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 rounded border border-red-200 dark:border-red-800 text-sm font-medium transition-colors"
                            >
                                ⚠️ Resetar Perfil do Matriculador
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
}
