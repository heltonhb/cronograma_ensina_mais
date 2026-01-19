// js/services/gamification.js
import { getStore, setStore } from '../core/store.js';
import { saveCoreData } from './firestore.js';
import { showToast } from '../components/Toast.js';

// --- CONFIGURAÇÃO ---

// Patentes de Carreira (Acumulativo Eterno)
const CAREER_RANKS = [
    { level: 1, title: "Matriculador Iniciante", minXP: 0 },
    { level: 2, title: "Matriculador Júnior", minXP: 2000 },
    { level: 3, title: "Matriculador Pleno", minXP: 5000 },
    { level: 4, title: "Matriculador Sênior", minXP: 10000 },
    { level: 5, title: "Especialista em Matrículas", minXP: 25000 },
    { level: 6, title: "Mestre das Matrículas", minXP: 50000 },
    { level: 7, title: "Lenda da Educação", minXP: 100000 }
];

// Tiers Mensais (Reseta todo mês) - O Desafio do Mês
const MONTHLY_TIERS = [
    { name: "Bronze", minXP: 0, color: "#cd7f32" },
    { name: "Prata", minXP: 1500, color: "#c0c0c0" },   // Ex: ~3 matrículas
    { name: "Ouro", minXP: 4000, color: "#ffd700" },    // Ex: ~8 matrículas
    { name: "Diamante", minXP: 8000, color: "#b9f2ff" }, // Ex: ~16 matrículas
    { name: "Black", minXP: 15000, color: "#333333" }   // Meta agressiva
];

// --- LÓGICA ---

export const ensureMonthlyReset = async () => {
    const { gamification, currentUser } = getStore();
    if (!currentUser || !gamification) return;

    const today = new Date();
    const currentMonthKey = today.toISOString().slice(0, 7); // "YYYY-MM"

    if (gamification.currentMonthKey !== currentMonthKey) {
        console.log("📅 Detectada virada de mês. Resetando pontuação mensal...");

        const newState = {
            ...gamification,
            monthlyXP: 0,
            monthlyTier: "Bronze",
            currentMonthKey: currentMonthKey
        };

        setStore({ gamification: newState });

        try {
            await saveCoreData(currentUser.uid, { gamification: newState });
            showToast("📅 Novo mês iniciado! Ranking mensal resetado.", "info");
            return true;
        } catch (error) {
            console.error("Erro ao salvar reset mensal:", error);
        }
    }
    return false;
};

export const addXP = async (amount, reason = "") => {
    const { gamification, currentUser } = getStore();
    if (!currentUser) return;

    let state = { ...gamification };

    // 1. Verifica Virada de Mês (Reset)
    const today = new Date();
    const currentMonthKey = today.toISOString().slice(0, 7); // "YYYY-MM"

    if (state.currentMonthKey !== currentMonthKey) {
        // Virou o mês! Reseta o progresso mensal, mantém carreira
        state.monthlyXP = 0;
        state.monthlyTier = "Bronze";
        state.currentMonthKey = currentMonthKey;
        showToast("📅 Novo mês, nova meta! Ranking mensal resetado.", "info");
    }

    // 2. Adiciona XP (Carreira e Mensal)
    state.xp += amount;
    state.monthlyXP += amount;

    // 3. Verifica Level Up (Carreira)
    const newRank = CAREER_RANKS.slice().reverse().find(r => state.xp >= r.minXP);
    if (newRank && newRank.level > state.level) {
        state.level = newRank.level;
        state.title = newRank.title;
        showToast(`🎉 LEVEL UP! Você agora é ${state.title}!`, 'success');
        // Tocar som aqui se quiser
    }

    // 4. Verifica Tier Mensal
    const newTier = MONTHLY_TIERS.slice().reverse().find(t => state.monthlyXP >= t.minXP);
    if (newTier && newTier.name !== state.monthlyTier) {
        state.monthlyTier = newTier.name;
        showToast(`🚀 INCRÍVEL! Você atingiu o Rank Mensal ${newTier.name.toUpperCase()}!`, 'success');
    }

    // 5. Salva e Atualiza
    setStore({ gamification: state });
    console.log(`🎮 XP: +${amount} | Mensal: ${state.monthlyXP} (${state.monthlyTier})`);

    try {
        await saveCoreData(currentUser.uid, { gamification: state });
        // Se tiver o widget na tela, atualiza ele
        renderGamificationWidget();
    } catch (error) {
        console.error("Erro ao salvar gamificação:", error);
    }
};

export const checkDailyStreak = async () => {
    // ... (Mantenha sua função de streak original aqui, ela está ótima) ...
    // Vou copiar a versão anterior para garantir que você tenha o arquivo completo:

    const { gamification, currentUser } = getStore();
    if (!currentUser) return;

    const today = new Date().toISOString().split('T')[0];
    const lastDate = gamification.lastActionDate;

    if (lastDate === today) return;

    let newStreak = gamification.streak;

    if (lastDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
            newStreak++;
            showToast(`🔥 Ofensiva! ${newStreak} dias seguidos!`, 'warning');
        } else {
            if (newStreak > 0) showToast(`😢 Ofensiva perdida.`, 'info');
            newStreak = 1;
        }
    } else {
        newStreak = 1;
    }

    const newState = { ...gamification, streak: newStreak, lastActionDate: today };
    setStore({ gamification: newState });
    await saveCoreData(currentUser.uid, { gamification: newState });
    renderGamificationWidget();
};

// --- RENDERIZAÇÃO VISUAL (HUD) ---

// ... (código anterior da função) ...

export const renderGamificationWidget = () => {
    const container = document.getElementById('gamification-widget');
    if (!container) return;

    const { gamification, currentUser } = getStore();
    const { monthlyXP, monthlyTier, xp, title, level, streak } = gamification;

    // ... (cálculos de progresso anteriores mantidos iguais) ...
    // Vou repetir apenas as variáveis necessárias para o HTML abaixo funcionar
    const firstName = currentUser?.displayName?.split(' ')[0] || 'Matriculador';

    // ... (cálculos de nextTier, monthlyProgress, tierColor mantidos) ...
    // Recalcule ou mantenha os cálculos que já estavam na função
    const currentTierIdx = MONTHLY_TIERS.findIndex(t => t.name === monthlyTier);
    const nextTier = MONTHLY_TIERS[currentTierIdx + 1];
    let monthlyProgress = 100;
    let nextTierLabel = "Máximo Atingido";
    let xpToNext = 0;

    if (nextTier) {
        const prevTierXP = MONTHLY_TIERS[currentTierIdx].minXP;
        const tierSpan = nextTier.minXP - prevTierXP;
        const xpInTier = monthlyXP - prevTierXP;
        monthlyProgress = Math.min(100, Math.floor((xpInTier / tierSpan) * 100));
        nextTierLabel = `Próx: ${nextTier.name}`;
        xpToNext = nextTier.minXP - monthlyXP;
    }
    const tierColor = MONTHLY_TIERS.find(t => t.name === monthlyTier)?.color || '#cd7f32';


    // --- AQUI ESTÁ A ALTERAÇÃO NO HTML ---
    container.innerHTML = `
        <div class="gamification-card">
            
            <div class="game-header">
                <div class="user-info">
                    <div class="user-avatar-game">${firstName.charAt(0)}</div>
                    <div>
                        <h3 class="user-name">${firstName}</h3>
                        <span class="user-rank">${title} <span class="level-badge">Nv. ${level}</span></span>
                    </div>
                </div>
                
                <div style="display:flex; gap:10px; align-items:center;">
                    
                    <button class="btn-icon-admin" data-action="open-gamification-admin" title="Configurar Regras">⚙️</button>
                    
                    <div class="streak-container ${streak > 2 ? 'on-fire' : ''}" title="${streak} dias seguidos batendo meta diária">
                        <span class="streak-flame">🔥</span>
                        <div class="streak-data">
                            <span class="streak-number">${streak}</span>
                            <span class="streak-label">DIAS</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="game-body">
                <div class="tier-header">
                    <span class="tier-title">RANKING MENSAL</span>
                    <span class="tier-current" style="color: ${tierColor}; border-color: ${tierColor}">
                        ${monthlyTier.toUpperCase()}
                    </span>
                </div>

                <div class="xp-stats">
                    <span class="xp-current"><strong>${monthlyXP}</strong> XP</span>
                    <span class="xp-next">${xpToNext > 0 ? 'Faltam ' + xpToNext : 'Topo alcançado!'}</span>
                </div>

                <div class="progress-track">
                    <div class="progress-fill" style="width: ${monthlyProgress}%; background: linear-gradient(90deg, ${tierColor}, ${adjustColor(tierColor, 40)});">
                        <div class="progress-glare"></div>
                    </div>
                </div>
                
                <div class="next-tier-label">
                    <span>${monthlyTier}</span>
                    <span>${nextTierLabel}</span>
                </div>
            </div>
        </div>
    `;
};

// ... (função adjustColor mantida no final) ...

// Helper para clarear cor (para o gradiente)
function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

// --- MODO ADMINISTRADOR ---

export const updateGamificationRules = async (newRules, newPassword) => { // <--- ADICIONE newPassword AQUI
    const { gamification, currentUser } = getStore();
    if (!currentUser) return;

    // Mescla regras E senha (se fornecida)
    const newState = {
        ...gamification,
        rules: { ...gamification.rules, ...newRules },
        // Se newPassword vier vazio (usuário não digitou nada), mantém a senha antiga
        adminPassword: newPassword ? newPassword : gamification.adminPassword
    };

    setStore({ gamification: newState });

    try {
        await saveCoreData(currentUser.uid, { gamification: newState });
        console.log("Regras e Senha Atualizadas.");
    } catch (e) {
        console.error("Erro ao salvar regras:", e);
    }
};

// 2. Resetar Matriculador (Troca de Funcionário)
export const resetMatriculadorProfile = async () => {
    const { gamification, currentUser } = getStore();
    if (!currentUser) return;

    if (!confirm("⚠️ PERIGO: Isso vai zerar Nível, XP, Ofensiva e Conquistas.\n\nUse apenas para TROCA DE FUNCIONÁRIO.\n\nDeseja continuar?")) {
        return;
    }

    const resetState = {
        ...gamification,
        xp: 0,
        level: 1,
        title: "Matriculador Iniciante",
        monthlyXP: 0,
        monthlyTier: "Bronze",
        streak: 0,
        lastActionDate: null,
        achievements: []
        // NOTA: Não resetamos 'rules', mantemos as regras da escola.
    };

    setStore({ gamification: resetState });
    await saveCoreData(currentUser.uid, { gamification: resetState });

    // Atualiza visual
    const { renderGamificationWidget } = await import('./gamification.js'); // Auto-import ou chame direto se estiver no mesmo arquivo
    renderGamificationWidget();

    alert("Perfil resetado com sucesso. Bem-vindo, novo matriculador!");
};

// --- PROCESSADORES DE XP (FALTANDO NO SEU ARQUIVO) ---

// Regras padrão (fallback caso o banco esteja vazio)
const DEFAULT_RULES = {
    xp_lead: 10, xp_call: 5, xp_schedule: 50, xp_visit: 100,
    xp_sale: 500, xp_task_sales: 25, xp_task_admin: 15
};

// 1. Processar XP de Atividade Concluída (Para o Kanban)
export const processActivityXP = (activity) => {
    const { gamification } = getStore();
    // Usa as regras salvas ou o padrão
    const rules = gamification?.rules || DEFAULT_RULES;

    let xpEarned = 0;

    // Categorias que valem como "Vendas"
    const salesCategories = ['Prospecção', 'Follow-up', 'Atendimento', 'Conversão', 'Reativação'];

    // Verifica se a regra existe, senão usa o padrão, garantindo que seja número
    const valSales = parseInt(rules.xp_task_sales ?? DEFAULT_RULES.xp_task_sales);
    const valAdmin = parseInt(rules.xp_task_admin ?? DEFAULT_RULES.xp_task_admin);

    if (salesCategories.includes(activity.categoria)) {
        xpEarned = valSales;
    } else {
        xpEarned = valAdmin;
    }

    if (xpEarned > 0) {
        addXP(xpEarned, `Atividade: ${activity.categoria}`);
    }
};

// 2. Processar XP do Acompanhamento Diário (Para o Log)
export const processDailyLogXP = (newLog, oldLog = {}) => {
    const { gamification } = getStore();
    const rules = gamification?.rules || DEFAULT_RULES;

    let totalXP = 0;
    const reasons = [];

    // Função auxiliar para calcular diferença
    const calcDelta = (field, ruleKey, label) => {
        const newVal = parseInt(newLog[field] || 0);
        const oldVal = parseInt(oldLog[field] || 0);
        const diff = newVal - oldVal;

        // Garante que pegamos o valor da regra corretamente
        const ruleValue = parseInt(rules[ruleKey] ?? DEFAULT_RULES[ruleKey]);

        if (diff > 0 && ruleValue > 0) {
            const points = diff * ruleValue;
            totalXP += points;
            reasons.push(`${diff} ${label}`);
        }
    };

    // Calcula XP apenas para o que AUMENTOU
    calcDelta('leads_novos', 'xp_lead', 'Leads');
    calcDelta('ligacoes', 'xp_call', 'Ligações');
    calcDelta('agendamentos', 'xp_schedule', 'Agendamentos');
    calcDelta('visitas', 'xp_visit', 'Visitas');
    calcDelta('matriculas', 'xp_sale', 'Matrículas');

    if (totalXP > 0) {
        addXP(totalXP, `Metas: ${reasons.join(', ')}`);
    }
};