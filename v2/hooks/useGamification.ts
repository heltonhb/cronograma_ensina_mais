import { useGamification as useContextGamification, CAREER_RANKS, MONTHLY_TIERS } from '../contexts/GamificationContext';

// Re-export constants
export { CAREER_RANKS, MONTHLY_TIERS };

export function useGamification() {
    const { state, awardXP, levelProgress, monthlyProgress } = useContextGamification();

    return {
        gamification: state, // Alias 'state' to 'gamification' for compatibility
        loading: false, // Context handles loading, usually ready by the time hook is used
        addXP: awardXP, // Alias 'awardXP' to 'addXP'
        levelProgress,
        monthlyProgress,
        CAREER_RANKS,
        MONTHLY_TIERS
    };
}
