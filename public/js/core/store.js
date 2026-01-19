// js/core/store.js

const initialState = {
    activeTemplateName: "Cronograma Personalizado",
    scheduleStatusFilter: 'all',
    reportSource: 'cronograma',
    activeScriptPhase: 0,
    colaboradores: ["Daniele", "Helton", "Edsandra"],
    dailyLogs: {},
    scheduleHistory: {},
    blocos_atividades: [
        // ... (seus dados de exemplo mantidos) ...
        { id: 1, nome: "Organização e Planejamento", horario_inicio: "09:00", horario_fim: "09:30", descricao: "Café & CRM, análise de tarefas, revisão de leads", cor: "#4285f4", icone: "📋", status: "concluido", leads_contatados: 0, visitas_realizadas: 0, agendamentos_feitos: 0, meta_leads: 0, meta_visitas: 0, observacoes: "CRM atualizado, 5 novos leads identificados", categoria: "Preparação", prioridade: "Alta", tipo: "Obrigatória", duracao: 30, participantes: ["Daniele"]},
        { id: 2, nome: "Contato com Leads Quentes", horario_inicio: "09:30", horario_fim: "11:00", descricao: "Ataque aos novos leads, follow-up de visitas recentes", cor: "#ea4335", icone: "📞", status: "concluido", leads_contatados: 6, visitas_realizadas: 0, agendamentos_feitos: 3, meta_leads: 8, meta_visitas: 0, observacoes: "3 visitas agendadas para próxima semana", categoria: "Prospecção", prioridade: "Alta", tipo: "Obrigatória", duracao: 90 , participantes: ["Daniele"]},
        { id: 3, nome: "Relacionamento e Nutrição", horario_inicio: "11:00", horario_fim: "12:00", descricao: "Follow-up de leads antigos, atualização do sistema", cor: "#fbbc04", icone: "💬", status: "concluido", leads_contatados: 4, visitas_realizadas: 0, agendamentos_feitos: 0, meta_leads: 5, meta_visitas: 0, observacoes: "2 leads interessados em robótica", categoria: "Follow-up", prioridade: "Média", tipo: "Flexível", duracao: 60 , participantes: ["Daniele"]},
        { id: 4, nome: "Intervalo para Almoço", horario_inicio: "12:00", horario_fim: "13:00", descricao: "Descanso essencial para recarregar as energias", cor: "#34a853", icone: "🍽️", status: "concluido", leads_contatados: 0, visitas_realizadas: 0, agendamentos_feitos: 0, meta_leads: 0, meta_visitas: 0, observacoes: "", categoria: "Descanso", prioridade: "Baixa", tipo: "Obrigatória", duracao: 60 , participantes: ["Daniele"]},
        { id: 5, nome: "Atendimento Receptivo", horario_inicio: "13:00", horario_fim: "14:00", descricao: "Portas abertas, atendimento telefone/WhatsApp, suporte alunos", cor: "#ff6b35", icone: "📱", status: "em_andamento", leads_contatados: 2, visitas_realizadas: 0, agendamentos_feitos: 1, meta_leads: 3, meta_visitas: 0, observacoes: "2 ligações recebidas, 1 agendamento feito", categoria: "Atendimento", prioridade: "Média", tipo: "Flexível", duracao: 60 , participantes: ["Daniele"]},
        { id: 6, nome: "Encantamento (Visitas)", horario_inicio: "14:00", horario_fim: "16:30", descricao: "Visitas agendadas, tour temático, fechamento consultivo", cor: "#ea4335", icone: "🏫", status: "em_andamento", leads_contatados: 0, visitas_realizadas: 2, agendamentos_feitos: 0, meta_leads: 0, meta_visitas: 3, observacoes: "1 matrícula fechada, 1 pensando até segunda", categoria: "Conversão", prioridade: "Alta", tipo: "Obrigatória", duracao: 150 , participantes: ["Daniele"]},
        { id: 7, nome: "Reativação e Oportunidades", horario_inicio: "16:30", horario_fim: "17:30", descricao: "Leads esquecidos, busca por indicações", cor: "#7209b7", icone: "🎯", status: "nao_iniciado", leads_contatados: 0, visitas_realizadas: 0, agendamentos_feitos: 0, meta_leads: 4, meta_visitas: 0, observacoes: "", categoria: "Reativação", prioridade: "Média", tipo: "Opcional", duracao: 60 , participantes: ["Daniele"]},
        { id: 8, nome: "Fechamento e Planejamento", horario_inicio: "17:30", horario_fim: "18:00", descricao: "Atualização CRM, organização, planejamento dia seguinte", cor: "#2a9d8f", icone: "✅", status: "nao_iniciado", leads_contatados: 0, visitas_realizadas: 0, agendamentos_feitos: 0, meta_leads: 0, meta_visitas: 0, observacoes: "", categoria: "Finalização", prioridade: "Alta", tipo: "Obrigatória", duracao: 30 , participantes: ["Daniele"]}
    ],
    templates: [], // Simplificado para brevidade, mantenha os seus se tiver
    custom_templates: [],
    script_phases: [
        // ... (seus scripts mantidos) ...
        { phase: "Fase 1: Abertura e Conexão", objective: "Capturar a atenção e criar rapport.", scripts: [{ id: 1, title: "Script de Abertura", content: `"Olá, [Nome], aqui é [Seu Nome] da [Escola]. Vi seu interesse e, em apenas 2 minutos, quero te mostrar como podemos [resolver a dor/gerar o ganho]. Você tem esses 2 minutos agora?"`, type: 'geral' }] }
        // ... (adicione o resto dos scripts aqui se precisar restaurar backup) ...
    ],
    icones_disponiveis: ["📋", "📞", "💬", "🍽️", "📱", "🏫", "🎯", "✅", "🔍", "👥", "📚", "📊", "💼", "⏰", "📧", "📝", "💡", "🎮", "🏆", "📈"],
    cores_disponiveis: ["#4285f4", "#ea4335", "#fbbc04", "#34a853", "#ff6b35", "#7209b7", "#f72585", "#2a9d8f", "#e76f51", "#264653", "#FF5733", "#33FF57"],
    
    // --- CAMPOS DE CONTROLE ---
    lastActiveDate: null,
    autoSnapshots: {},

    // --- BLOCO DE GAMIFICAÇÃO ---
    gamification: {
        // CARREIRA (Nunca zera)
        xp: 0,
        level: 1,
        title: "Matriculador Iniciante",
        
        // MENSAL (Zera todo mês)
        monthlyXP: 0,
        currentMonthKey: new Date().toISOString().slice(0, 7), 
        monthlyTier: "Bronze", 
        
        // EXTRAS
        streak: 0,
        lastActionDate: null,
        achievements: [], // <--- VÍRGULA ADICIONADA AQUI
        adminPassword: "admin", // Senha padrão inicial

        // REGRAS (ADMIN)
        rules: {
            xp_lead: 10,
            xp_call: 5,
            xp_schedule: 50,
            xp_visit: 100,
            xp_sale: 500,
            xp_task_sales: 25,
            xp_task_admin: 15
        }

    }, // <--- FECHA GAMIFICAÇÃO AQUI

    // USUÁRIO NA RAIZ (FORA DA GAMIFICAÇÃO)
    currentUser: null
};

// 2. Estado Reativo
let state = JSON.parse(JSON.stringify(initialState));
const listeners = [];

// 3. Getters e Setters
export const getStore = () => state;

export const setStore = (newState) => {
    state = { ...state, ...newState };
    listeners.forEach(l => l(state));
};

// Helper para inicializar dados vindos do Firebase
export const initStoreData = (cloudData) => {
    // 1. Preservamos o usuário que JÁ ESTÁ no estado
    const activeUser = state.currentUser;

    // 2. Mesclamos: Estado Inicial + Dados da Nuvem
    state = { ...initialState, ...cloudData };

    // 3. Restauramos o usuário logado
    if (activeUser) {
        state.currentUser = activeUser;
    }
    
    console.log("💾 Store inicializada. User:", !!state.currentUser);
};

export const resetStore = () => {
    state = JSON.parse(JSON.stringify(initialState));
};

export const subscribe = (listener) => listeners.push(listener);