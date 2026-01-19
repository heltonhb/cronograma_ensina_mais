'use client';

import React, { useState } from 'react';
import { useGamification, MONTHLY_TIERS } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import GamificationAdminModal from './GamificationAdminModal';

export default function GamificationWidget() {
    const { user } = useAuth();
    const { state, levelProgress, monthlyProgress } = useGamification();
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

    const firstName = user?.displayName?.split(' ')[0] || 'Usuário';

    // Tier Info
    const tierColor = MONTHLY_TIERS.find(t => t.name === state.monthlyTier)?.color || '#cd7f32';

    // Calculate Next Month Tier info for display
    const currentTierIdx = MONTHLY_TIERS.findIndex(t => t.name === state.monthlyTier);
    const nextTier = MONTHLY_TIERS[currentTierIdx + 1];
    const xpToNext = nextTier ? nextTier.minXP - state.monthlyXP : 0;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 mb-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-xl font-bold">
                        {firstName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">{firstName}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{state.title}</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full text-xs font-bold">
                                Nv. {state.level}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAdminModalOpen(true)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Configurar Regras"
                    >
                        ⚙️
                    </button>

                    <div className={`flex flex-col items-center bg-orange-50 dark:bg-orange-950/20 px-3 py-2 rounded-lg border border-orange-100 dark:border-orange-900/30 ${state.streak > 2 ? 'animate-pulse' : ''}`} title={`${state.streak} dias seguidos`}>
                        <span className="text-2xl">🔥</span>
                        <div className="flex flex-col items-center leading-none">
                            <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">{state.streak}</span>
                            <span className="text-[10px] text-orange-400 uppercase font-bold">Dias</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="space-y-5">
                {/* Monthly Rank Section */}
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ranking Mensal</span>
                        <span className="text-sm font-bold px-2 py-0.5 rounded border" style={{ color: tierColor, borderColor: tierColor, backgroundColor: `${tierColor}1a` }}>
                            {state.monthlyTier.toUpperCase()}
                        </span>
                    </div>

                    <div className="flex justify-between items-end mb-2">
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-gray-800 dark:text-white">{state.monthlyXP}</span>
                            <span className="text-xs text-gray-500 font-bold">XP</span>
                        </div>
                        <span className="text-xs text-gray-400">
                            {xpToNext > 0 ? `Faltam ${xpToNext} para ${nextTier?.name}` : 'Topo alcançado!'}
                        </span>
                    </div>

                    <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                            style={{
                                width: `${monthlyProgress}%`,
                                background: `linear-gradient(90deg, ${tierColor}, ${tierColor}dd)`
                            }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </div>

                {/* Career Progress Mini (Optional) */}
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">Progresso Geral (Nível {state.level})</span>
                        <span className="text-xs text-gray-400">{levelProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${levelProgress}%` }}></div>
                    </div>
                </div>

            </div>

            <GamificationAdminModal
                isOpen={isAdminModalOpen}
                onClose={() => setIsAdminModalOpen(false)}
            />
        </div>
    );
}
