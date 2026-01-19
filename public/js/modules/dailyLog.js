// js/modules/dailyLog.js
import { getStore, setStore } from '../core/store.js';
import { saveDailyLogEntry } from '../services/firestore.js';
import { showToast } from '../components/Toast.js';
import { addXP } from '../services/gamification.js'; // <--- Importe a gamificação

// --- Inicialização ---
export const initDailyLog = () => {
    const dateInput = document.getElementById('daily-log-date');
    if (dateInput) {
        // Define data de hoje se estiver vazio
        if (!dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        renderDailyLogForm(dateInput.value);
    }
};

// --- Renderização ---
export const renderDailyLogForm = (dateString) => {
    const { dailyLogs } = getStore();
    
    // Pega dados do dia ou usa zeros
    const logData = dailyLogs[dateString] || {
        leads_novos: 0, 
        ligacoes: 0, 
        agendamentos: 0,
        visitas: 0, 
        matriculas: 0,
        leads_negativados: 0, 
        observacoes: ''
    };
    
    // Preenche os campos
    Object.keys(logData).forEach(key => {
        const el = document.getElementById(`log-${key}`);
        if (el) el.value = logData[key];
    });
};

// --- Nova Função (Movida do app.js) ---
export const updateTodaysLeadsMetric = () => {
    const el = document.getElementById('today-leads-count');
    if (!el) return;

    const { dailyLogs } = getStore();
    const hoje = new Date().toISOString().split('T')[0];
    
    // Pega do log diário salvo no Store
    const log = dailyLogs[hoje] || {};
    const leadsHoje = log.leads_novos || 0;

    el.textContent = leadsHoje;
};

// --- AÇÃO DE SALVAR COM GAMIFICAÇÃO ---
export const saveDailyLog = async () => {
    const dateString = document.getElementById('daily-log-date').value;
    const { currentUser, dailyLogs } = getStore();

    if (!currentUser) return showToast("Erro: Usuário não identificado.", "error");

    // Helper para pegar valor numérico
    const getValue = (id) => parseInt(document.getElementById(id)?.value) || 0;

    // 1. Pega os valores novos do formulário
    const newLogData = {
        leads_novos: getValue('log-leads_novos'),
        ligacoes: getValue('log-ligacoes'),
        agendamentos: getValue('log-agendamentos'),
        visitas: getValue('log-visitas'),
        matriculas: getValue('log-matriculas'),
        leads_negativados: getValue('log-leads_negativados'),
        observacoes: document.getElementById('log-observacoes')?.value || '',
        updatedAt: Date.now()
    };

    // 2. Pega os valores antigos do Store (para comparar)
    const oldLogData = dailyLogs[dateString] || {};

    // 3. CALCULA O XP GANHO (Gamificação)
    // Só roda se for a data de hoje (para evitar farmar XP editando passado)
    const hoje = new Date().toISOString().split('T')[0];
    
    if (dateString === hoje) {
        // --- NOVO: Pega as regras do Store ---
        const { rules } = getStore().gamification; 
        
        let xpGained = 0;
        let reasons = [];

        // Leads
        const leadsDiff = newLogData.leads_novos - (oldLogData.leads_novos || 0);
        if (leadsDiff > 0) {
            xpGained += leadsDiff * rules.xp_lead; // <--- Usa a regra
            reasons.push(`${leadsDiff} Lead(s)`);
        }

        // Ligações
        const callsDiff = newLogData.ligacoes - (oldLogData.ligacoes || 0);
        if (callsDiff > 0) {
            xpGained += callsDiff * rules.xp_call; // <--- Usa a regra
        }

        // Agendamentos
        const scheduleDiff = newLogData.agendamentos - (oldLogData.agendamentos || 0);
        if (scheduleDiff > 0) {
            xpGained += scheduleDiff * rules.xp_schedule; // <--- Usa a regra
            reasons.push(`${scheduleDiff} Agendamento(s)`);
        }
        
        // Visitas (Se tiver campo no form, adicione lógica similar usando rules.xp_visit)

        // Matrículas
        const salesDiff = newLogData.matriculas - (oldLogData.matriculas || 0);
        if (salesDiff > 0) {
            xpGained += salesDiff * rules.xp_sale; // <--- Usa a regra
            reasons.push(`${salesDiff} MATRÍCULA(S)! 🚀`);
        }   
        // Aplica o XP se houve ganho
        if (xpGained > 0) {
            addXP(xpGained, reasons.join(', '));
        }
    }

    // 4. Atualiza Store Local
    const updatedLogs = { ...dailyLogs, [dateString]: newLogData };
    setStore({ dailyLogs: updatedLogs });

    // 5. Atualiza UI e Salva na Nuvem
    updateTodaysLeadsMetric();
    showToast('Dados salvos com sucesso!', 'success');

    try {
        await saveDailyLogEntry(currentUser.uid, dateString, newLogData);
        // console.log('☁️ Sincronizado.');
    } catch (error) {
        console.warn("Falha ao salvar log na nuvem:", error);
    }
};