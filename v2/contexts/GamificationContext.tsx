'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from './ToastContext';

// --- CONFIGURAÇÃO (Ported from legacy) ---

export const CAREER_RANKS = [
    { level: 1, title: "Matriculador Iniciante", minXP: 0 },
    { level: 2, title: "Matriculador Júnior", minXP: 2000 },
    { level: 3, title: "Matriculador Pleno", minXP: 5000 },
    { level: 4, title: "Matriculador Sênior", minXP: 10000 },
    { level: 5, title: "Especialista em Matrículas", minXP: 25000 },
    { level: 6, title: "Mestre das Matrículas", minXP: 50000 },
    { level: 7, title: "Lenda da Educação", minXP: 100000 }
];

export const MONTHLY_TIERS = [
    { name: "Bronze", minXP: 0, color: "#cd7f32" },
    { name: "Prata", minXP: 1500, color: "#c0c0c0" },
    { name: "Ouro", minXP: 4000, color: "#ffd700" },
    { name: "Diamante", minXP: 8000, color: "#b9f2ff" },
    { name: "Black", minXP: 15000, color: "#333333" }
];

export const DEFAULT_RULES = {
    xp_lead: 10, xp_call: 5, xp_schedule: 50, xp_visit: 100,
    xp_sale: 500, xp_task_sales: 25, xp_task_admin: 15
};

interface GamificationState {
    xp: number;
    level: number;
    title: string;
    monthlyXP: number;
    monthlyTier: string;
    currentMonthKey: string;
    streak: number;
    lastActionDate: string | null;
    rules: typeof DEFAULT_RULES;
    adminPassword?: string;
}

const INITIAL_STATE: GamificationState = {
    xp: 0,
    level: 1,
    title: "Matriculador Iniciante",
    monthlyXP: 0,
    monthlyTier: "Bronze",
    currentMonthKey: new Date().toISOString().slice(0, 7),
    streak: 0,
    lastActionDate: null,
    rules: DEFAULT_RULES,
    adminPassword: 'admin'
};

interface GamificationContextType {
    state: GamificationState;
    levelProgress: number;
    monthlyProgress: number;
    awardXP: (amount: number, reason?: string) => Promise<void>;
    checkStreak: () => Promise<void>;
    updateRules: (newRules: Partial<typeof DEFAULT_RULES>, newPassword?: string) => Promise<void>;
    resetMatriculadorProfile: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [state, setState] = useState<GamificationState>(INITIAL_STATE);
    const [loading, setLoading] = useState(true);

    // Load State
    useEffect(() => {
        if (!user) {
            setState(INITIAL_STATE);
            setLoading(false);
            return;
        }

        const docRef = doc(db, 'userData', user.uid, 'gamification', 'stats');
        const unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                setState(snap.data() as GamificationState);
            } else {
                // Initialize if not exists
                setDoc(docRef, INITIAL_STATE).catch(err => console.error("Error init gamification:", err));
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Derived Progress Calculations
    const currentRank = CAREER_RANKS.find(r => r.level === state.level) || CAREER_RANKS[0];
    const nextRank = CAREER_RANKS.find(r => r.level === state.level + 1);

    let levelProgress = 100;
    if (nextRank) {
        const xpInLevel = state.xp - currentRank.minXP;
        const levelSpan = nextRank.minXP - currentRank.minXP;
        levelProgress = Math.min(100, Math.floor((xpInLevel / levelSpan) * 100));
    }

    const currentTierIdx = MONTHLY_TIERS.findIndex(t => t.name === state.monthlyTier);
    const nextTier = MONTHLY_TIERS[currentTierIdx + 1];

    let monthlyProgress = 100;
    if (nextTier) {
        const currentTierInfo = MONTHLY_TIERS[currentTierIdx];
        const xpInTier = state.monthlyXP - currentTierInfo.minXP;
        const tierSpan = nextTier.minXP - currentTierInfo.minXP;
        monthlyProgress = Math.min(100, Math.floor((xpInTier / tierSpan) * 100));
    }

    // Logic Actions
    const saveState = async (newState: GamificationState) => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'userData', user.uid, 'gamification', 'stats'), newState);
        } catch (error) {
            console.error("Error saving gamification state:", error);
        }
    };

    const awardXP = async (amount: number, reason: string = "") => {
        if (!user) return;

        const newState = { ...state };
        const today = new Date();
        const currentMonthKey = today.toISOString().slice(0, 7);

        // 1. Reset Monthly if needed
        if (newState.currentMonthKey !== currentMonthKey) {
            newState.monthlyXP = 0;
            newState.monthlyTier = "Bronze";
            newState.currentMonthKey = currentMonthKey;
            showToast("📅 Novo mês! Ranking mensal resetado.", 'info');
        }

        // 2. Add XP
        newState.xp += amount;
        newState.monthlyXP += amount;

        // 3. Level Up check
        const newRank = [...CAREER_RANKS].reverse().find(r => newState.xp >= r.minXP);
        if (newRank && newRank.level > newState.level) {
            newState.level = newRank.level;
            newState.title = newRank.title;
            showToast(`🎉 LEVEL UP! Você agora é ${newState.title}!`, 'success');
        }

        // 4. Monthly Tier check
        const newTier = [...MONTHLY_TIERS].reverse().find(t => newState.monthlyXP >= t.minXP);
        if (newTier && newTier.name !== newState.monthlyTier) {
            newState.monthlyTier = newTier.name;
            showToast(`🚀 Rank Mensal: ${newTier.name.toUpperCase()}!`, 'success');
        }

        // Optimistic update
        setState(newState);
        await saveState(newState);

        if (reason) {
            console.log(`XP Awarded: ${amount} for ${reason}`);
            // Could show toast for every XP gain, but might be spammy using standard toast. 
            // Maybe a specialized XP toast later.
            showToast(`+${amount} XP: ${reason}`, 'success');
        }
    };

    const checkStreak = async () => {
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        if (state.lastActionDate === today) return;

        let newStreak = state.streak;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (state.lastActionDate === yesterdayStr) {
            newStreak++;
            showToast(`🔥 Ofensiva! ${newStreak} dias seguidos!`, 'warning');
        } else if (state.lastActionDate && state.lastActionDate < yesterdayStr) {
            if (newStreak > 0) showToast(`😢 Ofensiva perdida.`, 'info');
            newStreak = 1; // Reset to 1 (today is day 1)
        } else {
            newStreak = 1; // First day ever or after reset
        }

        const newState = { ...state, streak: newStreak, lastActionDate: today };

        setState(newState);
        await saveState(newState);
    };

    const updateRules = async (newRules: Partial<typeof DEFAULT_RULES>, newPassword?: string) => {
        if (!user) return;

        const newState = {
            ...state,
            rules: { ...state.rules, ...newRules },
            adminPassword: newPassword ? newPassword : state.adminPassword
        };

        setState(newState);
        await saveState(newState);
        showToast("Configurações atualizadas com sucesso!", "success");
    };

    const resetMatriculadorProfile = async () => {
        if (!user) return;

        const newState: GamificationState = {
            ...state,
            xp: 0,
            level: 1,
            title: "Matriculador Iniciante",
            monthlyXP: 0,
            monthlyTier: "Bronze",
            streak: 0,
            lastActionDate: null,
            // Keep rules and password
            rules: state.rules,
            adminPassword: state.adminPassword
        };

        setState(newState);
        await saveState(newState);
        showToast("Perfil do matriculador resetado com sucesso.", "warning");
    };

    return (
        <GamificationContext.Provider value={{ state, levelProgress, monthlyProgress, awardXP, checkStreak, updateRules, resetMatriculadorProfile }}>
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
}
