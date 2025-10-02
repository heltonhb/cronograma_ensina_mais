// --- INÍCIO DO ARQUIVO APP.JS (VERSÃO CORRIGIDA E COM NOTIFICAÇÕES) ---

document.addEventListener('DOMContentLoaded', () => {

    let currentUser = null; // Variável para guardar o usuário logado

    // Elementos da UI
    const authContainer = document.getElementById('auth-container');
    const loginForm = document.getElementById('login-form');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const mainContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');
    const authError = document.getElementById('auth-error');

    // --- LÓGICA DE AUTENTICAÇÃO ---

    firebase.onAuthStateChanged(auth, user => {
        if (user) {
            // Usuário está logado
            currentUser = user;
            authContainer.classList.add('hidden');
            mainContent.style.display = 'block';
            sidebar.style.display = 'flex';
            
            console.log("Usuário logado:", currentUser.uid);
            //showToast('Bem-vindo(a) de volta! 🎉', 'success');
            loadDataFromFirestore(); 
            
        } else {
            // Usuário está deslogado
            currentUser = null;
            authContainer.classList.remove('hidden');
            mainContent.style.display = 'none';
            sidebar.style.display = 'none';
        }
    });

    // Evento de Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        firebase.signInWithEmailAndPassword(auth, email, password)
            .catch(error => {
                console.error("Erro de login:", error);
                authError.textContent = "Email ou senha inválidos.";
            });
    });

    // Evento de Cadastro
    signupBtn.addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        firebase.createUserWithEmailAndPassword(auth, email, password)
            .catch(error => {
                console.error("Erro de cadastro:", error);
                authError.textContent = "Erro ao cadastrar. Verifique o email ou a senha (mínimo 6 caracteres).";
            });
    });

    // Evento de Logout
    logoutBtn.addEventListener('click', () => {
        firebase.signOut(auth);
    });


    // --- STATE MANAGEMENT ---
    let appData = {};
    const initialState = {
        activeTemplateName: "Cronograma Personalizado",
        scheduleStatusFilter: 'all',
        reportSource: 'cronograma',
        activeScriptPhase: 0,
         // ADIÇÃO 1: Lista de colaboradores disponíveis
    colaboradores: ["Daniele", "Helton", "Edsandra"],
        dailyLogs: {},
        scheduleHistory: {},
        blocos_atividades: [
            { id: 1, nome: "Organização e Planejamento", horario_inicio: "09:00", horario_fim: "09:30", descricao: "Café & CRM, análise de tarefas, revisão de leads", cor: "#4285f4", icone: "📋", status: "concluido", leads_contatados: 0, visitas_realizadas: 0, agendamentos_feitos: 0, meta_leads: 0, meta_visitas: 0, observacoes: "CRM atualizado, 5 novos leads identificados", categoria: "Preparação", prioridade: "Alta", tipo: "Obrigatória", duracao: 30, participantes: ["Daniele"]},
            { id: 2, nome: "Contato com Leads Quentes", horario_inicio: "09:30", horario_fim: "11:00", descricao: "Ataque aos novos leads, follow-up de visitas recentes", cor: "#ea4335", icone: "📞", status: "concluido", leads_contatados: 6, visitas_realizadas: 0, agendamentos_feitos: 3, meta_leads: 8, meta_visitas: 0, observacoes: "3 visitas agendadas para próxima semana", categoria: "Prospecção", prioridade: "Alta", tipo: "Obrigatória", duracao: 90 , participantes: ["Daniele"]},
            { id: 3, nome: "Relacionamento e Nutrição", horario_inicio: "11:00", horario_fim: "12:00", descricao: "Follow-up de leads antigos, atualização do sistema", cor: "#fbbc04", icone: "💬", status: "concluido", leads_contatados: 4, visitas_realizadas: 0, agendamentos_feitos: 0, meta_leads: 5, meta_visitas: 0, observacoes: "2 leads interessados em robótica", categoria: "Follow-up", prioridade: "Média", tipo: "Flexível", duracao: 60 , participantes: ["Daniele"]},
            { id: 4, nome: "Intervalo para Almoço", horario_inicio: "12:00", horario_fim: "13:00", descricao: "Descanso essencial para recarregar as energias", cor: "#34a853", icone: "🍽️", status: "concluido", leads_contatados: 0, visitas_realizadas: 0, agendamentos_feitos: 0, meta_leads: 0, meta_visitas: 0, observacoes: "", categoria: "Descanso", prioridade: "Baixa", tipo: "Obrigatória", duracao: 60 , participantes: ["Daniele"]},
            { id: 5, nome: "Atendimento Receptivo", horario_inicio: "13:00", horario_fim: "14:00", descricao: "Portas abertas, atendimento telefone/WhatsApp, suporte alunos", cor: "#ff6b35", icone: "📱", status: "em_andamento", leads_contatados: 2, visitas_realizadas: 0, agendamentos_feitos: 1, meta_leads: 3, meta_visitas: 0, observacoes: "2 ligações recebidas, 1 agendamento feito", categoria: "Atendimento", prioridade: "Média", tipo: "Flexível", duracao: 60 , participantes: ["Daniele"]},
            { id: 6, nome: "Encantamento (Visitas)", horario_inicio: "14:00", horario_fim: "16:30", descricao: "Visitas agendadas, tour temático, fechamento consultivo", cor: "#ea4335", icone: "🏫", status: "em_andamento", leads_contatados: 0, visitas_realizadas: 2, agendamentos_feitos: 0, meta_leads: 0, meta_visitas: 3, observacoes: "1 matrícula fechada, 1 pensando até segunda", categoria: "Conversão", prioridade: "Alta", tipo: "Obrigatória", duracao: 150 , participantes: ["Daniele"]},
            { id: 7, nome: "Reativação e Oportunidades", horario_inicio: "16:30", horario_fim: "17:30", descricao: "Leads esquecidos, busca por indicações", cor: "#7209b7", icone: "🎯", status: "nao_iniciado", leads_contatados: 0, visitas_realizadas: 0, agendamentos_feitos: 0, meta_leads: 4, meta_visitas: 0, observacoes: "", categoria: "Reativação", prioridade: "Média", tipo: "Opcional", duracao: 60 , participantes: ["Daniele"]},
            { id: 8, nome: "Fechamento e Planejamento", horario_inicio: "17:30", horario_fim: "18:00", descricao: "Atualização CRM, organização, planejamento dia seguinte", cor: "#2a9d8f", icone: "✅", status: "nao_iniciado", leads_contatados: 0, visitas_realizadas: 0, agendamentos_feitos: 0, meta_leads: 0, meta_visitas: 0, observacoes: "", categoria: "Finalização", prioridade: "Alta", tipo: "Obrigatória", duracao: 30 , participantes: ["Daniele"]}
        ],
        templates: [ { id: 1, nome: "Dia Prospecção Intensiva", descricao: "Foco total em novos leads e follow-up", atividades: [ { nome: "Organização", horario_inicio: "09:00", horario_fim: "09:30", categoria: "Preparação", icone: "📋", cor: "#4285f4" }, { nome: "Prospecção Ativa", horario_inicio: "09:30", horario_fim: "11:30", categoria: "Prospecção", icone: "📞", cor: "#ea4335" }, { nome: "Follow-up Intensivo", horario_inicio: "11:30", horario_fim: "12:00", categoria: "Follow-up", icone: "💬", cor: "#fbbc04" }, { nome: "Almoço", horario_inicio: "12:00", horario_fim: "13:00", categoria: "Descanso", icone: "🍽️", cor: "#34a853" }, { nome: "Mais Prospecção", horario_inicio: "13:00", horario_fim: "15:00", categoria: "Prospecção", icone: "📞", cor: "#ea4335" }, { nome: "Reativação", horario_inicio: "15:00", horario_fim: "17:00", categoria: "Reativação", icone: "🎯", cor: "#7209b7" }, { nome: "Fechamento", horario_inicio: "17:00", horario_fim: "18:00", categoria: "Finalização", icone: "✅", cor: "#2a9d8f" } ]}, { id: 2, nome: "Dia de Visitas", descricao: "Prioridade para visitas agendadas e conversão", atividades: [ { nome: "Preparação", horario_inicio: "09:00", horario_fim: "09:30", categoria: "Preparação", icone: "📋", cor: "#4285f4" }, { nome: "Contatos Matinais", horario_inicio: "09:30", horario_fim: "10:30", categoria: "Prospecção", icone: "📞", cor: "#ea4335" }, { nome: "Visita 1", horario_inicio: "10:30", horario_fim: "12:00", categoria: "Conversão", icone: "🏫", cor: "#ea4335" }, { nome: "Almoço", horario_inicio: "12:00", horario_fim: "13:00", categoria: "Descanso", icone: "🍽️", cor: "#34a853" }, { nome: "Visita 2", horario_inicio: "13:00", horario_fim: "14:30", categoria: "Conversão", icone: "🏫", cor: "#ea4335" }, { nome: "Visita 3", horario_inicio: "14:30", horario_fim: "16:00", categoria: "Conversão", icone: "🏫", cor: "#ea4335" }, { nome: "Follow-up Visitas", horario_inicio: "16:00", horario_fim: "17:30", categoria: "Follow-up", icone: "💬", cor: "#fbbc04" }, { nome: "Planejamento", horario_inicio: "17:30", horario_fim: "18:00", categoria: "Finalização", icone: "✅", cor: "#2a9d8f" } ]}, { id: 3, nome: "Dia Follow-up", descricao: "Nutrição de leads existentes e reativação", atividades: [ { nome: "Organização", horario_inicio: "09:00", horario_fim: "09:30", categoria: "Preparação", icone: "📋", cor: "#4285f4" }, { nome: "Follow-up Leads Quentes", horario_inicio: "09:30", horario_fim: "11:00", categoria: "Follow-up", icone: "💬", cor: "#fbbc04" }, { nome: "Follow-up Leads Mornos", horario_inicio: "11:00", horario_fim: "12:00", categoria: "Follow-up", icone: "💬", cor: "#fbbc04" }, { nome: "Almoço", horario_inicio: "12:00", horario_fim: "13:00", categoria: "Descanso", icone: "🍽️", cor: "#34a853" }, { nome: "Reativação", horario_inicio: "13:00", horario_fim: "15:00", categoria: "Reativação", icone: "🎯", cor: "#7209b7" }, { nome: "Busca Indicações", horario_inicio: "15:00", horario_fim: "16:30", categoria: "Prospecção", icone: "👥", cor: "#ff6b35" }, { nome: "Organização CRM", horario_inicio: "16:30", horario_fim: "17:30", categoria: "Finalização", icone: "📊", cor: "#2a9d8f" }, { nome: "Planejamento", horario_inicio: "17:30", horario_fim: "18:00", categoria: "Finalização", icone: "✅", cor: "#2a9d8f" } ]} ],
        custom_templates: [],
        script_phases: [ { phase: "Fase 1: Abertura e Conexão", objective: "Capturar a atenção e criar rapport.", scripts: [{ id: 1, title: "Script de Abertura", content: `"Olá, [Nome], aqui é [Seu Nome] da [Escola]. Vi seu interesse e, em apenas 2 minutos, quero te mostrar como podemos [resolver a dor/gerar o ganho]. Você tem esses 2 minutos agora?"`, type: 'geral' }] }, { phase: "Fase 2: Diagnóstico", objective: "Entender a necessidade real e identificar os decisores.", scripts: [ { id: 2, title: "Diagnóstico de Dor (Apoio Escolar)", content: `"O que mais te preocupa hoje no desempenho do(a) [Nome do Filho(a)] em [matemática/português]? Foi alguma nota específica ou a percepção de que ele(a) está desmotivado(a)?"`, type: 'dor' }, { id: 3, title: "Diagnóstico de Ganho (Tecnologia)", content: `"Que ótimo o seu interesse por [programação]! O que te levou a buscar um curso como este para o(a) [Nome do Filho(a)]? Você pensa mais no desenvolvimento do raciocínio lógico ou em prepará-lo(a) para o futuro?"`, type: 'ganho' }, { id: 4, title: "Identificação de Decisor", content: `"Entendi perfeitamente sua necessidade, [Nome]. Uma decisão como esta, que impacta o futuro do(a) [Filho(a)], geralmente é algo que a família analisa em conjunto. Além de você, alguém mais participa desse decisão? (esposo(a) por exemplo.)"`, type: 'geral'} ] }, { phase: "Fase 3: Apresentação da Solução", objective: "Conectar os benefícios da escola à dor/desejo identificado.", scripts: [ { id: 5, title: "Abordagem Geral", content: `"Com base no que você me contou sobre [dor/desejo], nosso método foi desenhado para resolver exatamente isso. Deixe-me explicar como..."`, type: 'geral' }, { id: 6, title: "Exemplo para Apoio Escolar", content: `"O resultado que os pais como você mais comemoram não é só a nota, mas ver o filho voltar a acreditar que é capaz."`, type: 'dor' }, ] }, { phase: "Fase 4: Agendamento da Visita", objective: "Trazer o cliente para a escola, gerando compromisso.", scripts: [ { id: 7, title: "Convite para Apoio Escolar", content: `"Com base no que conversamos, o ideal é trazer seu/sua filho(a) para uma aula experimental gratuita. Assim, poderemos avaliar juntos se nossa proposta faz sentido para vocês."`, type: 'dor' }, { id: 8, title: "Confirmação do Agendamento", content: `"Perfeito, agendado! Vou te enviar nosso endereço. Peço que separe cerca de uma hora para a visita e traga todas as suas dúvidas. Da minha parte, vou preparar tudo para recebê-los. Combinado?"`, type: 'geral' } ] }, { phase: "Fase 5: A Visita à Escola", objective: "Conectar a metodologia e o espaço físico aos objetivos do cliente.", scripts: [ { id: 9, title: "Durante o Tour", content: `"Lembra que você me disse que sua maior dificuldade é [dificuldade específica]? Pois bem, esta sala foi desenhada para isso. Veja [característica], isso permite que ele(a) tenha [benefício que resolve a dor]."`, type: 'geral' } ] }, { phase: "Fase 6: Preparação para Fechamento", objective: "Validar o valor da solução antes de apresentar o preço.", scripts: [ { id: 10, title: "Perguntas de Validação", content: `"[Nome], já vou te passar os valores, mas antes preciso fazer algumas perguntas:\n1) Ficou alguma dúvida sobre a metodologia, os horários ou o material?\n2) Em não havendo dúvidas, o que você mais gostou no que viu até agora?\n3) A metodologia está 100% aprovada?\n4) A disponibilidade de horário está ok?\n5) De zero a dez, qual nota você daria para o seu interesse em nosso curso?\n6) Se chegarmos a um valor que se encaixe no seu orçamento, você realizaria a matrícula hoje?"`, type: 'geral' } ] }, { phase: "Fase 7: Contorno de Objeções", objective: "Neutralizar barreiras com foco no valor e em soluções.", scripts: [ { id: 11, title: "Objeção: 'Vou pensar.'", content: `"Claro. Só para eu ter certeza: ficou alguma dúvida sobre como nosso método vai ajudar? Geralmente, quando um pai me diz 'preciso pensar', ou é sobre o investimento ou sobre a logística. Qual desses é mais sensível para você?"`, type: 'geral' }, { id: 12, title: "Objeção: 'Está caro.'", content: `"Eu entendo. Nosso foco não é ser o mais barato, mas o que entrega mais resultado. Se pensarmos no custo de uma dificuldade contínua em [matemática], este investimento na base se torna a decisão mais econômica. Faz sentido?"`, type: 'geral' } ] }, { phase: "Fase 8: Apresentação Financeira", objective: "Conduzir à decisão com uma oferta clara e ancorada em valor.", scripts: [ { id: 13, title: "Sequência de Apresentação", content: `<strong>1) Apresentar valor padrão:</strong>\n"[Nome], nosso programa completo fica em X. Este valor se encaixa no seu orçamento?"\n\n<strong>2) Se houver objeção:</strong>\n"Entendo. Para clientes com decisão imediata, conseguimos oferecer uma condição especial. Se me der uma resposta hoje, consigo melhorar essa proposta."\n\n<strong>3) Apresentar oferta protagonista:</strong>\n"Nossa oferta especial, válida apenas hoje, é de Y."`, type: 'geral' } ] }, { phase: "Fase 9: Fechamento e Pós-Venda", objective: "Conduzir à ação final e capitalizar sobre a satisfação do cliente.", scripts: [ { id: 14, title: "Fechamento", content: `"Com base em tudo que conversamos, faz sentido darmos o próximo passo e garantir a vaga do(a) [Nome do Filho(a)]? O processo de matrícula é bem simples. Podemos prosseguir?"`, type: 'ganho' }, { id: 15, title: "Pós-Matrí­cula (Indicações)", content: `"Que alegria ver a evolução do [Nome do Filho(a)]! Aproveitando, você se lembraria de algum amigo que também se beneficiaria do nosso método? Como agradecimento, se a sua indicação se matricular, oferecemos [bônus]."`, type: 'geral' } ] } ],
        icones_disponiveis: ["📋", "📞", "💬", "🍽️", "📱", "🏫", "🎯", "✅", "🔍", "👥", "📚", "📊", "💼", "⏰", "📧", "📝", "💡", "🎮", "🏆", "📈"],
        cores_disponiveis: ["#4285f4", "#ea4335", "#fbbc04", "#34a853", "#ff6b35", "#7209b7", "#f72585", "#2a9d8f", "#e76f51", "#264653", "#FF5733", "#33FF57"]
    };

    // Salvar snapshots automáticos a cada mudança significativa
    const autoSaveSnapshot = () => {
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toLocaleTimeString();
        
        if (!appData.autoSnapshots) appData.autoSnapshots = {};
        if (!appData.autoSnapshots[today]) appData.autoSnapshots[today] = [];
        
        appData.autoSnapshots[today].push({
            timestamp: currentTime,
            activities: JSON.parse(JSON.stringify(appData.blocos_atividades))
        });
    };

    


    // --- FUNÇÕES DE DADOS (COM ORDEM CORRIGIDA) ---

    const saveDataToFirestore = async () => {
        if (!currentUser) return;
        const dataToSave = { ...appData };
        try {
            const userDocRef = firebase.doc(db, 'userData', currentUser.uid);
            await firebase.setDoc(userDocRef, dataToSave, { merge: true });
            console.log("Dados salvos no Firestore!");
        } catch (error) {
            console.error("Erro ao salvar dados:", error);
            showToast("Houve um erro ao salvar suas alterações.", 'error');
        }
    };
    
    const loadDataFromFirestore = async () => {
        if (!currentUser) return;
        const userDocRef = firebase.doc(db, 'userData', currentUser.uid);
        try {
            const snap = await firebase.getDoc(userDocRef);
            if (snap.exists()) {
                const savedData = snap.data();
                appData = { ...initialState, ...savedData };
                console.log("Dados carregados do Firestore!");
            } else {
                appData = JSON.parse(JSON.stringify(initialState));
                console.log("Nenhum dado encontrado, usando estado inicial.");
                await saveDataToFirestore(); // Salva o estado inicial para o novo usuário
            }
            if (appData.blocos_atividades && Array.isArray(appData.blocos_atividades)) {
                // --- MODIFICADO ---
                // Reseta o status de notificação para todas as atividades ao carregar os dados
                appData.blocos_atividades.forEach(a => a.notificationSent = false);
                appData.blocos_atividades = validateActivityData(appData.blocos_atividades);
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            showToast("Erro ao carregar seus dados.", 'error');
            appData = JSON.parse(JSON.stringify(initialState));
        }
        
        // ** PONTO CRÍTICO: Inicia a aplicação APÓS os dados serem carregados **
        initApp();
        showToast('Bem-vindo(a) de volta! 🎉', 'success');    
    };


    let activePage = 'dashboard';
    let isEditMode = false;
    let charts = {};
    let confirmationCallback = null;
    let reportCategoryFilter = 'all';
    let reportSortConfig = { key: 'horario_inicio', direction: 'asc' };
    let activeReportType = 'summary';

    const getEl = (id) => document.getElementById(id);
    const query = (selector) => document.querySelector(selector);
    const queryAll = (selector) => document.querySelectorAll(selector);

    const showToast = (message, type = 'info', icon = '') => {
        const container = getEl('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        const iconSpan = document.createElement('span');
        iconSpan.textContent = icon;
        const msgSpan = document.createElement('span');
        msgSpan.textContent = ` ${message}`;
        toast.appendChild(iconSpan);
        toast.appendChild(msgSpan);
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    const showConfirmation = (title, message, callback) => {
        getEl('confirmation-title').textContent = title;
        getEl('confirmation-message').textContent = message;
        confirmationCallback = callback;
        openModal('confirmation-modal');
    };
    
    const openModal = (modalId) => {
        const modal = getEl(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }
    };

    const closeModal = (modalId) => {
        const modal = getEl(modalId);
        if (modal) modal.classList.add('hidden');
    };

    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    const calculateDuration = (startTime, endTime) => timeToMinutes(endTime) - timeToMinutes(startTime);

    const formatDuration = (minutes) => {
        if (isNaN(minutes) || minutes < 0) return "Inválido";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'min' : ''}`.trim() || "0min";
    };

    const getStatusText = (status) => ({
        'concluido': 'Concluído', 'em_andamento': 'Em Andamento', 'nao_iniciado': 'Não Iniciado',
        'pausado': 'Pausado', 'cancelado': 'Cancelado'
    })[status] || status;

    const calculateConversionRate = (numerator, denominator) => {
        if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
            return 0;
        }
        return Math.round((numerator / denominator) * 100);
    };
    
    const renderEmptyState = (container, message, title) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'empty-state';
        const h3 = document.createElement('h3');
        h3.textContent = title;
        const p = document.createElement('p');
        p.textContent = message;
        wrapper.appendChild(h3);
        wrapper.appendChild(p);
        container.replaceChildren(wrapper);
    };

    const updateClock = () => {
        const clockElement = getEl('current-time');
        if (!clockElement) return;
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        clockElement.replaceChildren();
        const timeNode = document.createTextNode(timeString);
        const br = document.createElement('br');
        const small = document.createElement('small');
        small.textContent = dateString;
        clockElement.appendChild(timeNode);
        clockElement.appendChild(br);
        clockElement.appendChild(small);
    };

    // --- NOVO ---
    // Função para mostrar a notificação no desktop
    const showDesktopNotification = (activity) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return; // Retorna se o navegador não suporta notificações ou a permissão não foi dada.
        }

        const notification = new Notification(`Atividade Próxima: ${activity.nome}`, {
            body: `Sua atividade começa às ${activity.horario_inicio}.`,
            // Você pode usar um ícone genérico ou o ícone da própria atividade
            icon: 'https://cdn-icons-png.flaticon.com/512/942/942801.png'
        });
    };

    // --- NOVO ---
    // Função para verificar atividades que estão para começar
    const checkUpcomingActivities = () => {
        const now = new Date();
        const fiveMinutesInMs = 5 * 60 * 1000;
        const checkWindowInMs = 30 * 1000; // Janela de verificação para não perder a notificação (30s)

        if (!appData.blocos_atividades) return;

        appData.blocos_atividades.forEach(activity => {
            // Pula se a notificação já foi enviada, ou se a atividade já foi concluída/cancelada
            if (activity.notificationSent || activity.status === 'concluido' || activity.status === 'cancelado') {
                return;
            }

            const [hours, minutes] = activity.horario_inicio.split(':').map(Number);
            const activityStartTime = new Date();
            activityStartTime.setHours(hours, minutes, 0, 0);

            // Se o horário da atividade já passou hoje, ignora
            if (activityStartTime < now) {
                return;
            }

            const timeDifference = activityStartTime.getTime() - now.getTime();

            // Verifica se a atividade começa dentro da janela de 5 minutos
            if (timeDifference > 0 && timeDifference <= fiveMinutesInMs && timeDifference > (fiveMinutesInMs - checkWindowInMs)) {
                console.log(`Enviando notificação para: ${activity.nome}`);
                showDesktopNotification(activity);
                activity.notificationSent = true; // Marca como notificado para não repetir
            }
        });
    };
    
    const navigateTo = (pageId) => {
        activePage = pageId;
        queryAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === pageId));
        queryAll('.page').forEach(p => p.classList.toggle('active', p.id === pageId));
        
        const pageInitializer = {
            'dashboard': initDashboard,
            'cronograma': initSchedule,
            'templates': initTemplates,
            'leads': initDailyLog,
            'scripts': initScripts,
            'relatorios': initReports,
        }[pageId];
        
        if (pageInitializer) pageInitializer();
    };

    // Primeiro, crie esta pequena função auxiliar em algum lugar perto das outras funções de ajuda
const renderParticipantAvatars = (participants) => {
    if (!participants || participants.length === 0) return '';
    
    const colors = ['#e67e22', '#3498db', '#9b59b6', '#2ecc71', '#f1c40f'];
    return `
        <div class="participants-container">
            ${participants.map((p, index) => `
                <div class="participant-avatar" style="background-color: ${colors[index % colors.length]}" title="${p}">
                    ${p.charAt(0).toUpperCase()}
                </div>
            `).join('')}
        </div>
    `;
};

    const initDashboard = () => {
        updateDashboardMetrics();
        renderTodayActivities();
        createPerformanceChart();
    };
    
    const generateUniqueId = (existingItems) => {
        let newId;
        do {
            newId = Math.floor(Date.now() + Math.random() * 10000);
        } while (existingItems.some(item => item.id === newId));
        return newId;
    };

    const updateDashboardMetrics = () => {
        const activities = appData.blocos_atividades;
        getEl('completed-activities').textContent = activities.filter(a => a.status === 'concluido').length;
        getEl('contacted-leads').textContent = activities.reduce((sum, a) => sum + (a.leads_contatados || 0), 0);
        getEl('visits-conducted').textContent = activities.reduce((sum, a) => sum + (a.visitas_realizadas || 0), 0);
        
        const totalMetas = activities.reduce((sum, a) => sum + (a.meta_leads || 0) + (a.meta_visitas || 0), 0);
        const totalRealizados = activities.reduce((sum, a) => sum + (a.leads_contatados || 0) + (a.visitas_realizadas || 0), 0);
        getEl('efficiency-rate').textContent = totalMetas > 0 ? `${Math.round((totalRealizados / totalMetas) * 100)}%` : '0%';
    };

    const renderTodayActivities = () => {
        const container = getEl('today-activities');
        const sortedActivities = [...appData.blocos_atividades].sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio));
        
        if (sortedActivities.length === 0) {
            renderEmptyState(container, 'Nenhuma atividade agendada para hoje.', 'Dia Livre!');
            return;
        }

        const fragment = document.createDocumentFragment();
        sortedActivities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.style.borderLeftColor = activity.cor;

            const iconDiv = document.createElement('div');
            iconDiv.className = 'activity-item__icon';
            iconDiv.textContent = activity.icone;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'activity-item__content';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'activity-item__name';
            nameDiv.textContent = activity.nome;
            const timeDiv = document.createElement('div');
            timeDiv.className = 'activity-item__time';
            timeDiv.textContent = `${activity.horario_inicio} - ${activity.horario_fim}`;
            contentDiv.appendChild(nameDiv);
            contentDiv.appendChild(timeDiv);

            const statusDiv = document.createElement('div');
            statusDiv.className = `activity-item__status status-${activity.status}`;
            statusDiv.textContent = getStatusText(activity.status);

            item.appendChild(iconDiv);
            item.appendChild(contentDiv);
            item.appendChild(statusDiv);
            fragment.appendChild(item);
        });
        container.replaceChildren(fragment);
    };

    const createPerformanceChart = () => {
        const ctx = getEl('performance-chart')?.getContext('2d');
        if (!ctx) return;

        const labels = ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'Ontem', 'Hoje'];
        const data = labels.map(() => Math.floor(Math.random() * 50) + 50); // Mock data
        
        if (charts.performance) charts.performance.destroy();
        charts.performance = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{
                label: 'Taxa de Conclusão (%)', data, borderColor: 'var(--color-brand)',
                backgroundColor: 'rgba(var(--color-brand-500-rgb), 0.1)', fill: true, tension: 0.4
            }]},
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }},
                scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' }}}
            }
        });
    };
    
    const initSchedule = () => {
        renderActiveTemplateDisplay();
        renderFilterButtons();
        renderScheduleBlocks();
        renderTimelineView();
        populateTemplateSelector();
    };
    
    const toggleEditMode = (enable) => {
        isEditMode = enable;
        getEl('edit-mode-btn').classList.toggle('hidden', enable);
        getEl('view-mode-btn').classList.toggle('hidden', !enable);
        getEl('schedule-grid').classList.toggle('edit-mode-active', enable);
        queryAll('.schedule-block').forEach(b => b.classList.toggle('edit-mode', enable));
        showToast(`Modo de ${enable ? 'edição ativado ✏️' : 'visualização ativado 👁️'}`, 'info');
    };

    const getFilteredActivities = () => {
        const { blocos_atividades, scheduleStatusFilter } = appData;
        if (scheduleStatusFilter === 'all') {
            return blocos_atividades;
        }
        return blocos_atividades.filter(a => a.status === scheduleStatusFilter);
    };
    
    const renderScheduleBlocks = () => {
        const container = getEl('schedule-grid');
        const activitiesToRender = getFilteredActivities();
        const sortedActivities = [...activitiesToRender].sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio));
        
        if (sortedActivities.length === 0) {
            renderEmptyState(container, 'Nenhuma atividade encontrada com o filtro selecionado.', 'Sem Atividades');
            return;
        }
        
        container.innerHTML = sortedActivities.map(activity => {
            const metaLeads = (activity.meta_leads || 0) > 0 ? `${activity.leads_contatados || 0}/${activity.meta_leads}` : (activity.leads_contatados || 0);
            const metaVisits = (activity.meta_visitas || 0) > 0 ? `${activity.visitas_realizadas || 0}/${activity.meta_visitas}` : (activity.visitas_realizadas || 0);
            
            return `
            <div class="schedule-block" draggable="${isEditMode}" data-id="${activity.id}" style="border-left-color: ${activity.cor};">
                <div class="schedule-block__header">
                    <h3 class="schedule-block__title">
                        <span class="schedule-block__icon">${activity.icone}</span>
                        <span class="editable" data-field="nome">${activity.nome}</span>
                    </h3>
                    <div class="schedule-block__actions">
                        <button class="schedule-block__action" data-action="edit-activity" data-id="${activity.id}" title="Editar">✏️</button>
                        <button class="schedule-block__action" data-action="duplicate-activity" data-id="${activity.id}" title="Duplicar">🔄</button>
                        <button class="schedule-block__action" data-action="delete-activity" data-id="${activity.id}" title="Excluir">🗑️</button>
                    </div>
                </div>
                <div class="schedule-block__time">
                    <span class="editable" data-field="horario_inicio">${activity.horario_inicio}</span> - 
                    <span class="editable" data-field="horario_fim">${activity.horario_fim}</span>
                </div>
                <p class="schedule-block__description editable" data-field="descricao">${activity.descricao || 'Sem descrição.'}</p>
                ${renderParticipantAvatars(activity.participantes)}
                <div class="schedule-block__metrics">
                    <div class="metric-item"><div class="metric-item__value">${metaLeads}</div><div class="metric-item__label">Leads</div></div>
                    <div class="metric-item"><div class="metric-item__value">${metaVisits}</div><div class="metric-item__label">Visitas</div></div>
                </div>
                <div class="activity-item__status status-${activity.status}" data-action="toggle-status" data-id="${activity.id}" style="cursor: pointer;" title="Clique para alterar status">${getStatusText(activity.status)}</div>
            </div>`;
        }).join('');
        
        updateScheduleEditMode();
    };

    const renderTimelineView = () => {
        const container = getEl('timeline-activities');
        const activitiesToRender = getFilteredActivities();
        container.innerHTML = '';
        
        let visualMatrix = Array.from({ length: 5 }, () => Array(11 * 60).fill(false)); 

        activitiesToRender
            .sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio))
            .forEach(activity => {
                const start = Math.max(0, timeToMinutes(activity.horario_inicio) - 480);
                const end = Math.min(11 * 60, timeToMinutes(activity.horario_fim) - 480);
                let lane = 0;
                
                while (lane < visualMatrix.length) {
                    if (!visualMatrix[lane].slice(start, end).some(v => v)) break;
                    lane++;
                }
                if (lane === visualMatrix.length) lane = 0; 
                
                for (let i = start; i < end; i++) visualMatrix[lane][i] = true;

                const left = (start / (11 * 60)) * 100;
                const width = ((end - start) / (11 * 60)) * 100;

                const el = document.createElement('div');
                el.className = 'timeline-activity';
                el.dataset.id = activity.id;
                el.style.cssText = `border-color: ${activity.cor}; background-color: ${activity.cor}20; left: ${left}%; width: ${width}%; top: ${lane * 36 + 5}px;`;
                const iconDiv = document.createElement('div');
                iconDiv.className = 'timeline-activity__icon';
                iconDiv.textContent = activity.icone;
                const nameDiv = document.createElement('div');
                nameDiv.className = 'timeline-activity__name';
                nameDiv.textContent = activity.nome;
                el.appendChild(iconDiv);
                el.appendChild(nameDiv);
                container.appendChild(el);
            });
    };
    
    const updateScheduleEditMode = () => {
        queryAll('.schedule-block').forEach(b => b.classList.toggle('edit-mode', isEditMode));
    };

    const renderActiveTemplateDisplay = () => {
        const display = getEl('active-template-display');
        if (appData.activeTemplateName) {
            display.textContent = `Template Ativo: ${appData.activeTemplateName}`;
            display.classList.remove('hidden');
        } else {
            display.classList.add('hidden');
        }
    };
    
    const renderFilterButtons = () => {
        const { scheduleStatusFilter } = appData;
        queryAll('.filter-buttons .btn').forEach(btn => {
            const isActive = btn.dataset.status === scheduleStatusFilter;
            btn.classList.toggle('active', isActive);
            btn.classList.toggle('btn--primary', isActive);
            btn.classList.toggle('btn--secondary', !isActive);
        });
    };

    const openActivityModal = (activity = null) => {
        const form = getEl('activity-form');
        form.reset();
        
        getEl('activity-modal-title').textContent = activity ? 'Editar Atividade' : 'Nova Atividade';
        getEl('activity-id').value = activity?.id || '';
        
        if (activity) {
            getEl('activity-name').value = activity.nome || '';
            getEl('activity-start').value = activity.horario_inicio || '';
            getEl('activity-end').value = activity.horario_fim || '';
            getEl('activity-description').value = activity.descricao || '';
            getEl('activity-category').value = activity.categoria || '';
            getEl('activity-priority').value = activity.prioridade || '';
            getEl('activity-type').value = activity.tipo || '';
            getEl('activity-status').value = activity.status || 'nao_iniciado';
            getEl('activity-meta-leads').value = activity.meta_leads || 0;
            getEl('activity-meta-visits').value = activity.meta_visitas || 0;
            getEl('activity-contacted-leads').value = activity.leads_contatados || 0;
            getEl('activity-realized-visits').value = activity.visitas_realizadas || 0;
            getEl('activity-schedules-made').value = activity.agendamentos_feitos || 0;
            getEl('activity-observations').value = activity.observacoes || '';
        } else {
            const lastActivity = [...appData.blocos_atividades].sort((a,b) => b.horario_fim.localeCompare(a.horario_fim))[0];
            if (lastActivity) {
                getEl('activity-start').value = lastActivity.horario_fim;
                const [h, m] = lastActivity.horario_fim.split(':').map(Number);
                const endDate = new Date(0, 0, 0, h, m + 60);
                getEl('activity-end').value = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
            }
        }
        
        renderIconSelector(activity?.icone || appData.icones_disponiveis[0]);
        renderColorSelector(activity?.cor || appData.cores_disponiveis[0]);
        updateDurationDisplay();


    // NOVO CÓDIGO - Adicione no final da função, antes de openModal('activity-modal');
    const participantsContainer = getEl('activity-participants-list');
    participantsContainer.innerHTML = ''; // Limpa a lista antes de recriar
    appData.colaboradores.forEach(colaborador => {
        const isChecked = activity?.participantes?.includes(colaborador) ? 'checked' : '';
        participantsContainer.innerHTML += `
            <div class="checkbox-wrapper">
                <input type="checkbox" id="part-${colaborador}" name="participant" value="${colaborador}" ${isChecked}>
                <label for="part-${colaborador}">${colaborador}</label>
            </div>
        `;
    });
    // FIM DO NOVO CÓDIGO

        getEl('activity-duplicate').style.display = activity ? 'inline-flex' : 'none';
        
        openModal('activity-modal');
    };
    
    const saveActivity = () => {
        const id = getEl('activity-id').value ? parseInt(getEl('activity-id').value) : null;
        const startTime = getEl('activity-start').value;
        const endTime = getEl('activity-end').value;
        
        const newStatus = getEl('activity-status').value;


    // NOVO CÓDIGO - Adicione junto com as outras coletas de dados do formulário
    const participantesSelecionados = Array.from(queryAll('input[name="participant"]:checked'))
                                             .map(checkbox => checkbox.value);
    // FIM DO NOVO CÓDIGO
        
        const activityData = {
            nome: getEl('activity-name').value,
            horario_inicio: startTime, horario_fim: endTime,
            descricao: getEl('activity-description').value,
            categoria: getEl('activity-category').value,
            prioridade: getEl('activity-priority').value,
            tipo: getEl('activity-type').value,
            status: newStatus,
            meta_leads: parseInt(getEl('activity-meta-leads').value) || 0,
            meta_visitas: parseInt(getEl('activity-meta-visits').value) || 0,
            leads_contatados: parseInt(getEl('activity-contacted-leads').value) || 0,
            visitas_realizadas: parseInt(getEl('activity-realized-visits').value) || 0,
            agendamentos_feitos: parseInt(getEl('activity-schedules-made').value) || 0,
            observacoes: getEl('activity-observations').value,
            participantes: participantesSelecionados,
            icone: query('.icon-option.selected')?.dataset.icon,
            cor: query('.color-option.selected')?.dataset.color,
            duracao: calculateDuration(startTime, endTime)
        };
        
        if (id !== null) {
            const index = appData.blocos_atividades.findIndex(a => a.id === id);
            if (index > -1) {
                const oldActivity = appData.blocos_atividades[index];
                const oldStatus = oldActivity.status;

                // **LÓGICA PARA CONTAR INTERRUPÇÕES**
                if (oldStatus === 'em_andamento' && newStatus === 'pausado') {
                    activityData.interruption_count = (oldActivity.interruption_count || 0) + 1;
                }

                appData.blocos_atividades[index] = { ...oldActivity, ...activityData };
                showToast('Atividade atualizada! ✅', 'success');
            }
        } else {
            activityData.id = generateUniqueId(appData.blocos_atividades);
            activityData.interruption_count = 0; // Inicializa contador para novas atividades
            appData.blocos_atividades.push(activityData);
            appData.activeTemplateName = "Cronograma Personalizado";
            showToast('Atividade criada! ➕', 'success');
        }

        saveAndRerender();
        closeModal('activity-modal');
    };
    
   const deleteActivity = (id) => {
        const numericId = parseInt(id, 10);
        const activity = appData.blocos_atividades.find(a => a.id === numericId);
        if (!activity) return;
        showConfirmation('Excluir Atividade', `Tem certeza que deseja excluir "${activity.nome}"?`, () => {
            const block = query(`.schedule-block[data-id="${id}"]`);
            if (block) {
                block.classList.add('item-remove');
                block.addEventListener('animationend', () => {
                    appData.blocos_atividades = appData.blocos_atividades.filter(a => a.id !== numericId);
                    appData.activeTemplateName = "Cronograma Personalizado";
                    saveAndRerender();
                });
            } else {
                appData.blocos_atividades = appData.blocos_atividades.filter(a => a.id !== numericId);
                appData.activeTemplateName = "Cronograma Personalizado";
                saveAndRerender();
            }
            showToast('Atividade excluída! 🗑️', 'success');
        });
    };

    const duplicateActivity = (id) => {
        const numericId = parseInt(id, 10);
        const original = appData.blocos_atividades.find(a => a.id === numericId);
        if (!original) return;
        const newActivity = { ...original, id: generateUniqueId(appData.blocos_atividades), nome: `${original.nome} (Cópia)` };
        appData.blocos_atividades.push(newActivity);
        appData.activeTemplateName = "Cronograma Personalizado";
        saveAndRerender();
        showToast('Atividade duplicada! 📄', 'success');
    };

    const toggleActivityStatus = (id) => {
        const numericId = parseInt(id, 10);
        const activity = appData.blocos_atividades.find(a => a.id === numericId);
        if (!activity) {
            console.error('Activity not found for toggle status:', id);
            return;
        }

        const oldStatus = activity.status;
        const statuses = ['nao_iniciado', 'em_andamento', 'concluido'];
        const currentIndex = statuses.indexOf(oldStatus);
        const newStatus = statuses[(currentIndex + 1) % statuses.length];
        activity.status = newStatus;

        // **LÓGICA DE COLETA DE DADOS**
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (newStatus === 'em_andamento' && oldStatus === 'nao_iniciado') {
            activity.real_horario_inicio = currentTime;
        } else if (newStatus === 'concluido') {
            // Se o usuário pular o status "em andamento", assumimos que começou no horário planejado
            if (!activity.real_horario_inicio) {
                activity.real_horario_inicio = activity.horario_inicio;
            }
            activity.real_horario_fim = currentTime;
        }
        // FIM DA LÓGICA

        saveAndRerender();
        showToast(`Status alterado para: ${getStatusText(activity.status)}`, 'info');
    };

    const renderIconSelector = (selectedIcon) => {
        const container = getEl('icon-selector');
        const frag = document.createDocumentFragment();
        appData.icones_disponiveis.forEach(icon => {
            const div = document.createElement('div');
            div.className = `icon-option ${icon === selectedIcon ? 'selected' : ''}`;
            div.dataset.icon = icon;
            div.textContent = icon;
            frag.appendChild(div);
        });
        container.replaceChildren(frag);
    };

    const renderColorSelector = (selectedColor) => {
        const container = getEl('color-selector');
        const frag = document.createDocumentFragment();
        appData.cores_disponiveis.forEach(color => {
            const div = document.createElement('div');
            div.className = `color-option ${color === selectedColor ? 'selected' : ''}`;
            div.dataset.color = color;
            div.style.backgroundColor = color;
            frag.appendChild(div);
        });
        container.replaceChildren(frag);
    };

    const updateDurationDisplay = () => {
        const start = getEl('activity-start').value;
        const end = getEl('activity-end').value;
        const durationInput = getEl('activity-duration');
        if (start && end) {
            durationInput.value = formatDuration(calculateDuration(start, end));
        } else {
            durationInput.value = '';
        }
    };
    
    const initTemplates = () => {
        renderTemplates();
        renderCustomTemplates();
    };

    const createTemplateCard = (template, isCustom) => `
        <div class="template-card">
            <div class="template-card__header">
                <h3 class="template-card__name">${template.nome}</h3>
                <div class="template-card__actions">
                    <button class="template-card__action" data-action="apply-template" data-id="${template.id}" data-custom="${isCustom}" title="Aplicar">✅</button>
                    ${isCustom ? `<button class="template-card__action" data-action="delete-template" data-id="${template.id}" title="Excluir">🗑️</button>` : ''}
                </div>
            </div>
            <p class="template-card__description">${template.descricao}</p>
            <div class="template-card__activities">${template.atividades.length} atividades</div>
        </div>
    `;

    const renderTemplates = () => {
        const grid = getEl('templates-grid');
        const frag = document.createDocumentFragment();
        appData.templates.forEach(t => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = createTemplateCard(t, false);
            frag.appendChild(wrapper.firstElementChild);
        });
        grid.replaceChildren(frag);
    };

    const renderCustomTemplates = () => {
        const container = getEl('custom-templates-grid');
        if (!appData.custom_templates || appData.custom_templates.length === 0) {
            renderEmptyState(container, 'Salve o cronograma atual como um template para reutilizá-lo.', 'Nenhum Template Personalizado');
            return;
        }
        const frag = document.createDocumentFragment();
        appData.custom_templates.forEach(t => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = createTemplateCard(t, true);
            frag.appendChild(wrapper.firstElementChild);
        });
        container.replaceChildren(frag);
    };
    
    const populateTemplateSelector = () => {
        const selector = getEl('template-selector');
        selector.replaceChildren();
        const first = document.createElement('option');
        first.value = '';
        first.textContent = 'Aplicar Template';
        selector.appendChild(first);
        appData.templates.forEach(t => {
            const opt = document.createElement('option');
            opt.value = `std-${t.id}`;
            opt.textContent = t.nome;
            selector.appendChild(opt);
        });
        if (appData.custom_templates) {
            appData.custom_templates.forEach(t => {
                const opt = document.createElement('option');
                opt.value = `cst-${t.id}`;
                opt.textContent = `[Meu] ${t.nome}`;
                selector.appendChild(opt);
            });
        }
    };

    const applyTemplate = (idStr, isCustomStr) => {
        const id = parseInt(idStr);
        const isCustom = isCustomStr === 'true';
        const templateSource = isCustom ? appData.custom_templates : appData.templates;
        const template = templateSource.find(t => t.id === id);
        showConfirmation('Aplicar Template', `Isso substituirá o cronograma atual pelo template "${template.nome}". Deseja continuar?`, () => {
            let currentActivities = [];
            appData.blocos_atividades = template.atividades.map(a => {
                const newActivity = {
                    ...a, id: generateUniqueId(currentActivities), status: 'nao_iniciado',
                    leads_contatados: 0, visitas_realizadas: 0, agendamentos_feitos: 0, observacoes: '',
                    duracao: calculateDuration(a.horario_inicio, a.horario_fim)
                };
                currentActivities.push(newActivity);
                return newActivity;
            });
            appData.activeTemplateName = template.nome;
            saveDataToFirestore();
            navigateTo('cronograma');
            showToast(`Template "${template.nome}" aplicado!`, 'success');
        });
    };
    
    const saveCurrentAsTemplate = () => {
        const name = getEl('template-name').value;
        const desc = getEl('template-description').value;
        if (!name) { showToast('O nome do template é obrigatório.', 'error'); return; }
        
        const newTemplate = {
            id: Date.now(),
            nome: name,
            descricao: desc,
            atividades: appData.blocos_atividades.map(({id, status, ...rest}) => rest)
        };
        
        if (!appData.custom_templates) appData.custom_templates = [];
        appData.custom_templates.push(newTemplate);
        saveDataToFirestore();
        initTemplates();
        closeModal('template-modal');
        showToast('Template salvo com sucesso!', 'success');
    };
    
    const deleteTemplate = (idStr) => {
        const id = parseInt(idStr);
        const template = appData.custom_templates.find(t => t.id === id);
        showConfirmation('Excluir Template', `Tem certeza que deseja excluir "${template.nome}"?`, () => {
            appData.custom_templates = appData.custom_templates.filter(t => t.id !== id);
            saveDataToFirestore();
            initTemplates();
            showToast('Template excluído!', 'success');
        });
    };

    const initDailyLog = () => {
        const dateInput = getEl('daily-log-date');
        dateInput.value = new Date().toISOString().split('T')[0];
        renderDailyLogForm(dateInput.value);
    };

    const renderDailyLogForm = (dateString) => {
        const logData = appData.dailyLogs[dateString] || {
            leads_novos: 0, ligacoes: 0, agendamentos: 0,
            visitas: 0, matriculas: 0,leads_negativados: 0, observacoes: ''
        };
        
        Object.keys(logData).forEach(key => {
            const el = getEl(`log-${key}`);
            if (el) el.value = logData[key];
        });
    };
    
    const saveDailyLog = (dateString) => {
        const newLogData = {
            leads_novos: parseInt(getEl('log-leads_novos').value) || 0,
            ligacoes: parseInt(getEl('log-ligacoes').value) || 0,
            agendamentos: parseInt(getEl('log-agendamentos').value) || 0,
            visitas: parseInt(getEl('log-visitas').value) || 0,
            matriculas: parseInt(getEl('log-matriculas').value) || 0,
             leads_negativados: parseInt(getEl('log-leads_negativados').value) || 0,
            observacoes: getEl('log-observacoes').value,
        };
        
        appData.dailyLogs[dateString] = newLogData;
        saveDataToFirestore();
        showToast('Acompanhamento do dia salvo com sucesso!', 'success');
    };

    const initScripts = () => {
        const navContainer = getEl('scripts-nav');
        const contentContainer = getEl('scripts-content');

        if (!appData.script_phases || appData.script_phases.length === 0) {
            renderEmptyState(contentContainer, 'Adicione uma nova fase para começar a criar seus scripts.', 'Sem Fases de Venda');
            navContainer.innerHTML = '';
            return;
        }

        const navList = document.createElement('ul');
        appData.script_phases.forEach((phaseData, index) => {
            const li = document.createElement('li');
            const isActive = index === appData.activeScriptPhase;
            const a = document.createElement('a');
            a.href = '#';
            a.className = `scripts-nav-item ${isActive ? 'active' : ''}`;
            a.dataset.action = 'select-phase';
            a.dataset.phaseIndex = String(index);
            a.textContent = phaseData.phase;
            li.appendChild(a);
            navList.appendChild(li);
        });
        navContainer.replaceChildren(navList);

        renderScriptContent(appData.activeScriptPhase);
    };

    const renderScriptContent = (phaseIndex) => {
        const contentContainer = getEl('scripts-content');
        if (phaseIndex === undefined || phaseIndex >= appData.script_phases.length || phaseIndex < 0) {
            appData.activeScriptPhase = 0;
            phaseIndex = 0;
        }

        const data = appData.script_phases[phaseIndex];
        if (!data) {
            initScripts();
            return;
        }
        
        let contentHTML = `
            <div class="page-header" style="margin-bottom: var(--space-12); align-items: flex-start;">
                <div>
                    <h2>${String(data.phase)}</h2>
                    <p class="phase-objective">${String(data.objective)}</p>
                </div>
                <div class="template-card__actions">
                    <button class="template-card__action" data-action="edit-phase" data-phase-index="${phaseIndex}" title="Editar Fase">✏️</button>
                    <button class="template-card__action" data-action="delete-phase" data-phase-index="${phaseIndex}" title="Excluir Fase">🗑️</button>
                </div>
            </div>`;
        
        if (data.scripts && data.scripts.length > 0) {
            data.scripts.forEach(script => {
                const safeContent = (script.content || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
                contentHTML += `
                    <div class="script-card">
                        <div class="script-card__header" style="display: flex; justify-content: space-between; align-items: center;">
                            <span>${script.title}</span>
                             <div class="template-card__actions">
                                <button class="template-card__action" data-action="edit-script" data-phase-index="${phaseIndex}" data-script-id="${script.id}" title="Editar Script">✏️</button>
                                <button class="template-card__action" data-action="delete-script" data-phase-index="${phaseIndex}" data-script-id="${script.id}" title="Excluir Script">🗑️</button>
                            </div>
                        </div>
                        <div class="script-card__body script-card__body--${script.type}">
                            <button class="btn btn--sm btn--secondary script-card__copy-btn" data-action="copy-script">Copiar</button>
                            <pre>${safeContent}</pre>
                        </div>
                    </div>
                `;
            });
        } else {
            contentHTML += '<p>Nenhum script nesta fase ainda. Adicione um!</p>';
        }

        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn--secondary';
        addBtn.style.marginTop = 'var(--space-16)';
        addBtn.dataset.action = 'add-script';
        addBtn.dataset.phaseIndex = String(phaseIndex);
        addBtn.textContent = '➕ Adicionar Novo Script';
        const wrap = document.createElement('div');
        wrap.innerHTML = contentHTML;
        contentContainer.replaceChildren(...Array.from(wrap.childNodes), addBtn);
    };

    const openPhaseModal = (phaseIndex = null) => {
        const form = getEl('phase-form');
        form.reset();
        const isEditing = phaseIndex !== null;

        getEl('phase-modal-title').textContent = isEditing ? 'Editar Fase' : 'Nova Fase';
        getEl('phase-index').value = isEditing ? phaseIndex : '';
        
        if (isEditing) {
            const phase = appData.script_phases[phaseIndex];
            getEl('phase-name').value = phase.phase;
            getEl('phase-objective').value = phase.objective;
        }
        
        openModal('phase-modal');
    };

    const savePhase = () => {
        const phaseIndex = getEl('phase-index').value;
        const phaseName = getEl('phase-name').value;
        const phaseObjective = getEl('phase-objective').value;

        if (phaseIndex !== '') {
            appData.script_phases[phaseIndex].phase = phaseName;
            appData.script_phases[phaseIndex].objective = phaseObjective;
            showToast('Fase atualizada com sucesso!', 'success');
        } else {
            const newPhase = {
                phase: phaseName,
                objective: phaseObjective,
                scripts: []
            };
            appData.script_phases.push(newPhase);
            appData.activeScriptPhase = appData.script_phases.length - 1;
            showToast('Fase criada com sucesso!', 'success');
        }
        saveAndRerender();
        closeModal('phase-modal');
    };
    
    const deletePhase = (phaseIndex) => {
        const phase = appData.script_phases[phaseIndex];
        showConfirmation('Excluir Fase', `Tem certeza que deseja excluir a fase "${phase.phase}" e todos os seus scripts?`, () => {
            appData.script_phases.splice(phaseIndex, 1);
            if (appData.activeScriptPhase >= phaseIndex) {
                appData.activeScriptPhase = Math.max(0, appData.activeScriptPhase - 1);
            }
            saveAndRerender();
            showToast('Fase excluída!', 'success');
        });
    };
    
    const openScriptModal = (phaseIndex, scriptId = null) => {
        const form = getEl('script-form');
        form.reset();
        const isEditing = scriptId !== null;

        getEl('script-modal-title').textContent = isEditing ? 'Editar Script' : 'Novo Script';
        getEl('script-phase-index').value = phaseIndex;
        getEl('script-id').value = isEditing ? scriptId : '';

        if(isEditing) {
            const script = appData.script_phases[phaseIndex].scripts.find(s => s.id == scriptId);
            getEl('script-title').value = script.title;
            getEl('script-content').value = script.content;
            getEl('script-type').value = script.type;
        }
        
        openModal('script-modal');
    };

    const saveScript = () => {
        const phaseIndex = parseInt(getEl('script-phase-index').value);
        const scriptIdStr = getEl('script-id').value;
        const scriptId = scriptIdStr ? parseInt(scriptIdStr) : null;
        
        const scriptData = {
            title: getEl('script-title').value,
            content: getEl('script-content').value,
            type: getEl('script-type').value
        };

        if (scriptId) {
            const scriptIndex = appData.script_phases[phaseIndex].scripts.findIndex(s => s.id === scriptId);
            appData.script_phases[phaseIndex].scripts[scriptIndex] = { ...appData.script_phases[phaseIndex].scripts[scriptIndex], ...scriptData };
             showToast('Script atualizado!', 'success');
        } else {
            scriptData.id = Date.now();
            if (!appData.script_phases[phaseIndex].scripts) {
                appData.script_phases[phaseIndex].scripts = [];
            }
            appData.script_phases[phaseIndex].scripts.push(scriptData);
            showToast('Script adicionado!', 'success');
        }

        saveAndRerender();
        closeModal('script-modal');
    };
    
    const deleteScript = (phaseIndex, scriptId) => {
        const script = appData.script_phases[phaseIndex].scripts.find(s => s.id == scriptId);
        showConfirmation('Excluir Script', `Tem certeza que deseja excluir o script "${script.title}"?`, () => {
            appData.script_phases[phaseIndex].scripts = appData.script_phases[phaseIndex].scripts.filter(s => s.id != scriptId);
            saveAndRerender();
            showToast('Script excluído!', 'success');
        });
    };
    
    const exportData = () => {
        try {
            const dataStr = JSON.stringify(appData);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const today = new Date().toISOString().split('T')[0];
            link.download = `dados_ensinamais_${today}.json`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('Dados exportados com sucesso!', 'success');
        } catch (error) {
            console.error('Falha ao exportar dados:', error);
            showToast('Ocorreu um erro ao exportar os dados.', 'error');
        }
    };

    const downloadObjectAsJson = (exportObj, exportName) => {
        try {
            const dataStr = JSON.stringify(exportObj, null, 2); 
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = exportName;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Falha ao criar arquivo para download:', error);
            showToast('Ocorreu um erro ao gerar o arquivo.', 'error');
        }
    };
    
    // FUNÇÃO RESTAURADA
    const archiveDaySchedule = () => {
        const todayKey = new Date().toISOString().split('T')[0];

        const confirmationMessage = appData.scheduleHistory && appData.scheduleHistory[todayKey]
            ? `Você já salvou o cronograma de hoje. Deseja substituir pelo estado atual?`
            : `Isso salvará o estado final do cronograma de hoje para o histórico. Deseja continuar?`;

        showConfirmation('Arquivar Cronograma do Dia', confirmationMessage, () => {
            if (appData.blocos_atividades.length === 0) {
                showToast('Não há atividades no cronograma para salvar.', 'warning');
                return;
            }

            const activitiesSnapshot = JSON.parse(JSON.stringify(appData.blocos_atividades));
            
            if (!appData.scheduleHistory) {
                appData.scheduleHistory = {};
            }

            // 1. Salva no localStorage
            appData.scheduleHistory[todayKey] = activitiesSnapshot;
            saveDataToFirestore();
            
            // 2. Inicia o download do arquivo externo
            downloadObjectAsJson(activitiesSnapshot, `cronograma-${todayKey}.json`);

            showToast('Cronograma arquivado e download iniciado! 📥', 'success');
        });
    };

    const importData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.blocos_atividades) {
                    showConfirmation('Importar Dados', 'Isso substituirá TODOS os seus dados atuais. Deseja continuar?', () => {
                        appData = { ...initialState, ...importedData };

                        if (appData.blocos_atividades && Array.isArray(appData.blocos_atividades)) {
                            let currentActivities = [];
                            appData.blocos_atividades = appData.blocos_atividades.map(a => {
                                const newActivity = {
                                    ...a,
                                    id: generateUniqueId(currentActivities),
                                    ...validateActivityData([a])[0]
                                };
                                currentActivities.push(newActivity);
                                return newActivity;
                            });
                        }
                        
                        saveDataToFirestore();
                        saveAndRerender(true);
                        showToast('Dados importados com sucesso!', 'success');
                    });
                } else {
                    showToast('Arquivo inválido ou corrompido.', 'error');
                }
            } catch (error) {
                console.error('Falha ao importar dados:', error);
                showToast('Ocorreu um erro ao ler o arquivo.', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const validateActivityData = (activities) => {
        return activities.map(activity => ({
            ...activity,
            id: activity.id || Math.floor(Date.now() + Math.random() * 1000),
            status: activity.status || 'nao_iniciado',
            leads_contatados: Number(activity.leads_contatados) || 0,
            visitas_realizadas: Number(activity.visitas_realizadas) || 0,
            agendamentos_feitos: Number(activity.agendamentos_feitos) || 0,
            meta_leads: Number(activity.meta_leads) || 0,
            meta_visitas: Number(activity.meta_visitas) || 0,
            observacoes: activity.observacoes || '',
            duracao: activity.duracao || calculateDuration(activity.horario_inicio, activity.horario_fim),
            real_horario_inicio: activity.real_horario_inicio || null,
            real_horario_fim: activity.real_horario_fim || null,
            interruption_count: activity.interruption_count || 0,
        }));
    };
    
    // --- FUNÇÕES DO SISTEMA DE INSIGHTS AUTOMÁTICOS ---

    /**
     * Analisa os dados históricos de atividades e gera insights acionáveis.
     * @param {Array} activities - Um array de objetos de atividade do histórico.
     * @returns {Array} Um array de objetos de insight.
     */
    const generateInsights = (activities) => {
        const insights = [];
        // Requer uma quantidade mínima de dados para gerar insights relevantes.
        if (!activities || activities.length < 10) {
            return [];
        }

        const MIN_ACTIVITY_COUNT = 3; // Mínimo de ocorrências de uma atividade para ser analisada.
        const LOW_COMPLETION_THRESHOLD = 0.6; // Limite para considerar uma taxa de conclusão baixa (60%).

        // --- Insight 1: Produtividade Manhã vs. Tarde ---
        let morningCompleted = 0;
        let afternoonCompleted = 0;
        activities.filter(a => a.status === 'concluido').forEach(a => {
            const startHour = parseInt(a.horario_inicio.split(':')[0]);
            if (startHour < 12) {
                morningCompleted++;
            } else {
                afternoonCompleted++;
            }
        });

        if (morningCompleted > afternoonCompleted * 1.25) {
            insights.push({
                type: 'productivity',
                icon: '☀️',
                message: 'Sua produtividade (atividades concluídas) parece ser maior no período da manhã.',
                action: 'Considere agendar suas tarefas mais críticas para antes do meio-dia.'
            });
        } else if (afternoonCompleted > morningCompleted * 1.25) {
            insights.push({
                type: 'productivity',
                icon: '🌙',
                message: 'Sua produtividade (atividades concluídas) parece ser maior no período da tarde.',
                action: 'Aproveite seu pico de energia para as tarefas mais difíceis após o almoço.'
            });
        }

        // --- Insight 2: Atividades com Baixa Taxa de Conclusão ---
        const activityStats = activities.reduce((acc, a) => {
            acc[a.nome] = acc[a.nome] || { total: 0, completed: 0 };
            acc[a.nome].total++;
            if (a.status === 'concluido') {
                acc[a.nome].completed++;
            }
            return acc;
        }, {});

        const lowCompletionActivities = Object.entries(activityStats)
            .filter(([, stats]) => stats.total >= MIN_ACTIVITY_COUNT && (stats.completed / stats.total) < LOW_COMPLETION_THRESHOLD)
            .map(([name]) => name);

        if (lowCompletionActivities.length > 0) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                message: `As seguintes atividades têm uma baixa taxa de conclusão: ${lowCompletionActivities.slice(0, 2).join(', ')}.`,
                action: 'Revise a duração, complexidade ou prioridade dessas tarefas.'
            });
        }

        // --- Insight 3: Dia Mais Produtivo da Semana ---
        const dayStats = { 0: {t:0, c:0}, 1: {t:0, c:0}, 2: {t:0, c:0}, 3: {t:0, c:0}, 4: {t:0, c:0}, 5: {t:0, c:0}, 6: {t:0, c:0} };
        const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        activities.forEach(a => {
            // Adicionar T12:00:00 evita problemas de fuso horário que podem mover a data para o dia anterior.
            const day = new Date(a.date + 'T12:00:00').getDay();
            dayStats[day].t++;
            if (a.status === 'concluido') dayStats[day].c++;
        });

        let bestDay = { day: -1, rate: -1 };
        // Analisa de Segunda a Sexta (índices 1 a 5)
        for (let i = 1; i <= 5; i++) {
            if (dayStats[i].t > 0) {
                const rate = dayStats[i].c / dayStats[i].t;
                if (rate > bestDay.rate) {
                    bestDay = { day: i, rate };
                }
            }
        }

        // Só exibe o insight se houver um dia claramente melhor e com bom desempenho.
        if (bestDay.day !== -1 && bestDay.rate > 0.75) {
            insights.push({
                type: 'success',
                icon: '🏆',
                message: `Seu dia mais produtivo da semana é ${weekDays[bestDay.day]}, com uma taxa de conclusão de ${Math.round(bestDay.rate * 100)}%.`,
                action: 'Analise o que torna este dia especial e tente replicar em outros dias.'
            });
        }

        // --- Insight 4: Foco em Categorias Chave (Ex: Prospecção) ---
        const categoryDurations = activities.reduce((acc, a) => {
            if(a.status === 'concluido') {
                acc[a.categoria] = (acc[a.categoria] || 0) + (a.duracao || 0);
            }
            return acc;
        }, {});
        const totalDuration = Object.values(categoryDurations).reduce((sum, d) => sum + d, 0);
        const prospectingDuration = categoryDurations['Prospecção'] || 0;
        
        // Alerta se menos de 15% do tempo produtivo foi gasto em prospecção.
        if (totalDuration > 0 && (prospectingDuration / totalDuration) < 0.15) {
             insights.push({
                type: 'info',
                icon: '📞',
                message: `Você investiu menos de 15% do seu tempo produtivo em prospecção.`,
                action: 'Para gerar mais leads, considere dedicar blocos de tempo maiores para esta atividade.'
            });
        }

        return insights;
    };

    /**
     * Renderiza os insights gerados no container HTML apropriado.
     * @param {Array} insights - O array de insights retornado por generateInsights.
     */
    const renderInsights = (insights) => {
        const container = getEl('insights-container');
        const card = getEl('insights-card');

        if (!insights || insights.length === 0) {
            card.classList.add('hidden');
            return;
        }

        card.classList.remove('hidden');
        const frag = document.createDocumentFragment();
        insights.forEach(insight => {
            const item = document.createElement('div');
            item.className = `insight-item insight-item--${insight.type}`;
            const iconDiv = document.createElement('div');
            iconDiv.className = 'insight-item__icon';
            iconDiv.textContent = insight.icon;
            const contentDiv = document.createElement('div');
            contentDiv.className = 'insight-item__content';
            const msg = document.createElement('p');
            msg.className = 'insight-item__message';
            msg.textContent = insight.message;
            const act = document.createElement('p');
            act.className = 'insight-item__action';
            act.textContent = insight.action;
            contentDiv.appendChild(msg);
            contentDiv.appendChild(act);
            item.appendChild(iconDiv);
            item.appendChild(contentDiv);
            frag.appendChild(item);
        });
        container.replaceChildren(frag);
    };

// --- FUNÇÕES DE RELATÓRIOS AVANÇADOS ---

    const generateWeeklyExecutiveReport = (historicalData, dailyLogs, startDate, endDate) => {
        const dateRangeKeys = Object.keys(historicalData).filter(date => {
            const d = new Date(date + 'T12:00:00');
            return d >= startDate && d <= endDate;
        });

        if (dateRangeKeys.length === 0) return null;

        const activities = dateRangeKeys.flatMap(date => historicalData[date]);
        const logs = Object.entries(dailyLogs)
            .filter(([date]) => dateRangeKeys.includes(date))
            .map(([, log]) => log);

        // 1. Resumo de Performance vs. Metas
        const totalMetasLeads = activities.reduce((sum, a) => sum + (a.meta_leads || 0), 0);
        const totalLeadsContatados = activities.reduce((sum, a) => sum + (a.leads_contatados || 0), 0);
        const totalMetasVisitas = activities.reduce((sum, a) => sum + (a.meta_visitas || 0), 0);
        const totalVisitasRealizadas = activities.reduce((sum, a) => sum + (a.visitas_realizadas || 0), 0);
        const totalMatriculas = logs.reduce((sum, log) => sum + (log.matriculas || 0), 0);
        const taxaConclusao = Math.round((activities.filter(a => a.status === 'concluido').length / activities.length) * 100) || 0;

        // 2. Top 3 Conquistas e Desafios
        const dayStats = dateRangeKeys.reduce((acc, date) => {
            const completed = historicalData[date].filter(a => a.status === 'concluido').length;
            acc.push({ date, completed });
            return acc;
        }, []);
        const bestDay = dayStats.sort((a, b) => b.completed - a.completed)[0];

        const activityStats = activities.reduce((acc, a) => {
            acc[a.nome] = acc[a.nome] || { total: 0, completed: 0 };
            acc[a.nome].total++;
            if (a.status === 'concluido') acc[a.nome].completed++;
            return acc;
        }, {});
        const challengingActivities = Object.entries(activityStats)
            .filter(([, stats]) => stats.total > 2 && (stats.completed / stats.total) < 0.5)
            .map(([name]) => name);

        // 3. Montagem do Relatório
        let report = `
# Relatório Executivo Semanal
**Período:** ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}

---

### **Resumo de Performance**
- **Taxa de Conclusão de Atividades:** ${taxaConclusao}%
- **Leads Contatados:** ${totalLeadsContatados} / ${totalMetasLeads} (Meta)
- **Visitas Realizadas:** ${totalVisitasRealizadas} / ${totalMetasVisitas} (Meta)
- **Matrículas Realizadas:** ${totalMatriculas}

---

### **Top 3 Conquistas da Semana**
1.  **Maior Produtividade:** O dia mais produtivo foi ${new Date(bestDay.date + 'T12:00:00').toLocaleDateString('pt-BR', {weekday: 'long'})}, com ${bestDay.completed} atividades concluídas.
2.  **Foco Principal:** A categoria com mais tempo investido foi "${Object.entries(activities.reduce((acc, a) => { acc[a.categoria] = (acc[a.categoria] || 0) + (a.duracao || 0); return acc; }, {})).sort(([,a],[,b]) => b-a)[0][0]}".
3.  **Resultado Chave:** Alcançamos um total de ${totalMatriculas} novas matrículas.

### **Top 3 Desafios da Semana**
1.  **Atividades de Baixa Conclusão:** ${challengingActivities.length > 0 ? `As atividades "${challengingActivities.slice(0, 2).join(', ')}" apresentaram dificuldade.` : 'Nenhuma atividade com baixa conclusão recorrente.'}
2.  **Meta de Leads:** ${totalLeadsContatados < totalMetasLeads ? `A meta de contatos com leads não foi atingida (${totalMetasLeads - totalLeadsContatados} a menos).` : 'A meta de contatos com leads foi superada!'}
3.  **Meta de Visitas:** ${totalVisitasRealizadas < totalMetasVisitas ? `A meta de visitas não foi atingida (${totalMetasVisitas - totalVisitasRealizadas} a menos).` : 'A meta de visitas foi superada!'}

---

### **Recomendações para a Próxima Semana**
- ${challengingActivities.length > 0 ? `**Revisar Planejamento:** Analise por que as atividades "${challengingActivities[0]}" não estão sendo concluídas. Elas precisam de mais tempo ou de uma abordagem diferente?` : ''}
- **Otimizar Prospecção:** Avalie os horários e scripts utilizados para os contatos com leads para melhorar a taxa de agendamento.
- **Foco em Conversão:** Mantenha o foco nas atividades de "Conversão" e "Follow-up" para garantir que as visitas agendadas se transformem em matrículas.
`;
        return report;
    };

    const generateTimeROIReport = (historicalData, dailyLogs, startDate, endDate, periodDays) => {
        const dateRangeKeys = Object.keys(historicalData).filter(date => {
            const d = new Date(date + 'T12:00:00');
            return d >= startDate && d <= endDate;
        });

        if (dateRangeKeys.length === 0) return null;

        const activities = dateRangeKeys.flatMap(date => historicalData[date].filter(a => a.status === 'concluido'));
        const totalMatriculas = Object.entries(dailyLogs)
            .filter(([date]) => dateRangeKeys.includes(date))
            .reduce((sum, [, log]) => sum + (log.matriculas || 0), 0);

        // 1. ROI de Tempo por Matrícula
        const totalTimeInvested = activities.reduce((sum, a) => sum + (a.duracao || 0), 0);
        const timePerMatricula = totalMatriculas > 0 ? Math.round(totalTimeInvested / totalMatriculas) : 0;

        // 2. Atividades com Melhor Retorno
        const categoryMetrics = activities.reduce((acc, a) => {
            acc[a.categoria] = acc[a.categoria] || { time: 0, leads: 0, schedules: 0, visits: 0 };
            acc[a.categoria].time += a.duracao || 0;
            acc[a.categoria].leads += a.leads_contatados || 0;
            acc[a.categoria].schedules += a.agendamentos_feitos || 0;
            acc[a.categoria].visits += a.visitas_realizadas || 0;
            return acc;
        }, {});

        const leadsPerHourProspecting = ((categoryMetrics['Prospecção']?.leads || 0) / (categoryMetrics['Prospecção']?.time / 60 || 1)).toFixed(1);
        const schedulesPerHourFollowUp = ((categoryMetrics['Follow-up']?.schedules || 0) / (categoryMetrics['Follow-up']?.time / 60 || 1)).toFixed(1);

        // 3. Montagem do Relatório
        let report = `
# Análise de Retorno sobre Investimento (ROI) de Tempo
**Período:** ${periodDays} dias (${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')})

---

### **Custo de Tempo por Matrícula**
- **Tempo Total Investido (Atividades Concluídas):** ${formatDuration(totalTimeInvested)}
- **Total de Matrículas no Período:** ${totalMatriculas}
- **Custo de Tempo por Matrícula:** **${formatDuration(timePerMatricula)}** por matrícula.

---

### **Atividades com Melhor Retorno**
- **Prospecção:**
    - Tempo Investido: ${formatDuration(categoryMetrics['Prospecção']?.time || 0)}
    - Leads por Hora: **${leadsPerHourProspecting}**
- **Follow-up:**
    - Tempo Investido: ${formatDuration(categoryMetrics['Follow-up']?.time || 0)}
    - Agendamentos por Hora: **${schedulesPerHourFollowUp}**
- **Conversão (Visitas):**
    - Tempo Investido: ${formatDuration(categoryMetrics['Conversão']?.time || 0)}
    - Visitas Realizadas: ${categoryMetrics['Conversão']?.visits || 0}

---

### **Sugestões de Realocação de Tempo**
- **Análise do Custo:** O custo de ${formatDuration(timePerMatricula)} por matrícula está dentro da sua expectativa? Se estiver muito alto, revise as etapas do funil que consomem mais tempo.
- **Otimizar Prospecção:** Com ${leadsPerHourProspecting} leads por hora, avalie se é possível aumentar o tempo dedicado a esta categoria para encher o topo do funil, caso seja um gargalo.
- **Revisar Follow-up:** Se o número de agendamentos por hora for baixo, considere testar novos scripts ou a frequência dos contatos de follow-up.
`;
        return report;
    };
    
    const generateAdvancedReport = (reportType) => {
        const historicalData = appData.scheduleHistory || {};
        const dailyLogs = appData.dailyLogs || {};
        let reportContent = '';
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (reportType === 'weekly') {
            const daysToAnalyze = 7;
            const startDate = new Date();
            startDate.setDate(today.getDate() - (daysToAnalyze - 1));
            startDate.setHours(0,0,0,0);
            
            reportContent = generateWeeklyExecutiveReport(historicalData, dailyLogs, startDate, today);
            if(reportContent) downloadTextFile(reportContent, `Relatorio_Executivo_Semanal_${todayStr}.md`);
        } else if (reportType === 'roi') {
            const daysToAnalyze = parseInt(getEl('period-select').value);
            const startDate = new Date();
            startDate.setDate(today.getDate() - (daysToAnalyze - 1));
            startDate.setHours(0,0,0,0);

            reportContent = generateTimeROIReport(historicalData, dailyLogs, startDate, today, daysToAnalyze);
            if(reportContent) downloadTextFile(reportContent, `Analise_ROI_de_Tempo_${todayStr}.md`);
        }
        
        if(reportContent) {
            showToast('Seu relatório está sendo baixado!', 'success');
        } else {
            showToast('Não há dados suficientes para gerar este relatório.', 'warning');
        }
    };

    const initReports = () => {
        const { reportSource } = appData;
        const efficiencyCard = getEl('efficiency-metrics-card');
        
        queryAll('.report-source-toggle .btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.source === reportSource);
        });

        if (reportSource === 'cronograma') {
            getEl('activity-details-card').classList.remove('hidden');
            getEl('conversion-rates-card').classList.add('hidden');
            efficiencyCard.style.display = 'block';
            activeReportType = 'summary'; // Reseta para a visão padrão ao carregar
            reportCategoryFilter = 'all'; 
            renderCronogramaReport();
        } else {
            getEl('activity-details-card').classList.add('hidden');
            getEl('conversion-rates-card').classList.remove('hidden');
            efficiencyCard.style.display = 'none';
            renderAcompanhamentoReport();
        }
        updateTodaysLeadsMetric();
    };
      
    const updateTodaysLeadsMetric = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysLog = appData.dailyLogs[todayStr];
        const newLeadsToday = todaysLog ? todaysLog.leads_novos : 0;
        getEl('report-summary-5-value').textContent = newLeadsToday;
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO DE RELATÓRIO ---

    const renderEfficiencyReport = (activities) => {
        const container = getEl('efficiency-metrics-content');
        const cardHeader = container.previousElementSibling.querySelector('h3');
        cardHeader.textContent = 'Análise de Eficiência e Padrões';

        if (!container) return;

        const completedActivities = activities.filter(a => a.status === 'concluido' && a.real_horario_inicio && a.real_horario_fim);

        if (completedActivities.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'Não há dados de atividades concluídas com registro de tempo para gerar este relatório. Use o sistema normalmente para coletar dados.';
            container.replaceChildren(p);
            return;
        }
        
        // --- PARTE 1: CÁLCULOS DE MÉTRICAS ---
        const categoryMetrics = {};
        const productivityByHour = {};
        const performanceByDay = { 0:{t:0,c:0}, 1:{t:0,c:0}, 2:{t:0,c:0}, 3:{t:0,c:0}, 4:{t:0,c:0}, 5:{t:0,c:0}, 6:{t:0,c:0} };
        const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const leadActivityTypes = ['Prospecção', 'Follow-up', 'Reativação'];
        let totalLeadTime = 0;
        let totalLeadsContacted = 0;
        const conversionByPeriod = {
            Manhã: { leads: 0, appointments: 0 },
            Tarde: { leads: 0, appointments: 0 },
        };

        activities.forEach(a => {
            const day = new Date(a.date + 'T00:00:00').getDay();
            performanceByDay[day].t++;
            if (a.status === 'concluido') performanceByDay[day].c++;
        });

        completedActivities.forEach(a => {
            const category = a.categoria;
            // Inicializa a métrica da categoria se não existir
            if (!categoryMetrics[category]) {
                categoryMetrics[category] = {
                    count: 0, totalActualDuration: 0, totalDelta: 0,
                    totalMetaLeads: 0, totalLeadsAchieved: 0,
                    totalMetaVisits: 0, totalVisitsAchieved: 0,
                    totalInterruptions: 0,
                };
            }
            const metrics = categoryMetrics[category];
            const actualDuration = calculateDuration(a.real_horario_inicio, a.real_horario_fim);

            // Acumula métricas por categoria
            metrics.count++;
            metrics.totalActualDuration += actualDuration;
            metrics.totalDelta += actualDuration - (a.duracao || 0);
            metrics.totalMetaLeads += a.meta_leads || 0;
            metrics.totalLeadsAchieved += a.leads_contatados || 0;
            metrics.totalMetaVisits += a.meta_visitas || 0;
            metrics.totalVisitsAchieved += a.visitas_realizadas || 0;
            metrics.totalInterruptions += a.interruption_count || 0;

            // Acumula métricas de qualidade globais
            if (leadActivityTypes.includes(category)) {
                totalLeadTime += actualDuration;
                totalLeadsContacted += a.leads_contatados || 0;
            }

            const hour = parseInt(a.real_horario_inicio.split(':')[0]);
            const period = (hour < 12) ? 'Manhã' : 'Tarde';
            conversionByPeriod[period].leads += a.leads_contatados || 0;
            conversionByPeriod[period].appointments += a.agendamentos_feitos || 0;

            if (!productivityByHour[category]) productivityByHour[category] = {};
            productivityByHour[category][hour] = (productivityByHour[category][hour] || 0) + 1;
        });

        const lateActivitiesCount = {};
        completedActivities.forEach(a => {
            if (timeToMinutes(a.real_horario_fim) > timeToMinutes(a.horario_fim)) {
                lateActivitiesCount[a.nome] = (lateActivitiesCount[a.nome] || 0) + 1;
            }
        });
        const sortedLateActivities = Object.entries(lateActivitiesCount).sort(([,a],[,b]) => b-a).slice(0, 3);
        
        // --- PARTE 2: CÁLCULO DOS DESTAQUES DE PADRÕES ---
        let bestDayByRate = { day: 'N/A', rate: -1 };
        let bestDayByVolume = { day: 'N/A', count: -1 };
        for(let i=1; i < 7; i++){ // Ignora Domingo
            if(performanceByDay[i].t > 0){
                const rate = Math.round((performanceByDay[i].c / performanceByDay[i].t) * 100);
                if(rate >= bestDayByRate.rate) bestDayByRate = { day: weekDays[i], rate: rate };
            }
            if(performanceByDay[i].c > bestDayByVolume.count) bestDayByVolume = { day: weekDays[i], count: performanceByDay[i].c };
        }

        const peakHoursByCategory = {};
        for (const category in productivityByHour) {
            const hours = productivityByHour[category];
            if(Object.keys(hours).length > 0){
                const peakHour = Object.keys(hours).reduce((a, b) => hours[a] > hours[b] ? a : b);
                peakHoursByCategory[category] = `${peakHour.padStart(2,'0')}:00`;
            }
        }
        
        const leadsPerHour = totalLeadTime > 0 ? (totalLeadsContacted / (totalLeadTime / 60)).toFixed(1) : '0.0';
        const morningConversion = calculateConversionRate(conversionByPeriod.Manhã.appointments, conversionByPeriod.Manhã.leads);
        const afternoonConversion = calculateConversionRate(conversionByPeriod.Tarde.appointments, conversionByPeriod.Tarde.leads);

        // --- PARTE 3: RENDERIZAÇÃO DO HTML ---
        let tableHTML = `
            <div class="table-container" style="margin-bottom: var(--space-24);">
                <table class="activity-detail-table">
                    <thead>
                        <tr>
                            <th>Categoria</th>
                            <th>Tempo Médio Real</th>
                            <th>Precisão do Planej. (Δ)</th>
                            <th>Média Interrupções</th>
                            <th>Taxa Sucesso Leads</th>
                            <th>Taxa Sucesso Visitas</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const category in categoryMetrics) {
            const data = categoryMetrics[category];
            const avgDuration = data.count > 0 ? Math.round(data.totalActualDuration / data.count) : 0;
            const avgDelta = data.count > 0 ? Math.round(data.totalDelta / data.count) : 0;
            const avgInterruptions = data.count > 0 ? (data.totalInterruptions / data.count).toFixed(1) : '0.0';
            const leadSuccessRate = data.totalMetaLeads > 0 ? `${Math.round((data.totalLeadsAchieved / data.totalMetaLeads) * 100)}%` : '--';
            const visitSuccessRate = data.totalMetaVisits > 0 ? `${Math.round((data.totalVisitsAchieved / data.totalMetaVisits) * 100)}%` : '--';
            tableHTML += `
                <tr>
                    <td>${category}</td>
                    <td>${formatDuration(avgDuration)}</td>
                    <td style="color: ${avgDelta > 5 ? 'var(--color-error)' : (avgDelta < -5 ? 'var(--color-success)' : 'inherit')}; font-weight: 500;">
                        ${avgDelta >= 0 ? '+' : ''}${formatDuration(avgDelta)}
                    </td>
                    <td>${avgInterruptions}</td>
                    <td>${leadSuccessRate}</td>
                    <td>${visitSuccessRate}</td>
                </tr>
            `;
        }
        tableHTML += `</tbody></table></div>`;

        let patternsHTML = `
            <div class="pattern-analysis">
                <div class="pattern-analysis__summary">
                    <div class="summary-item">
                        <span class="summary-item__label">Leads por Hora (Atividades Foco)</span>
                        <span class="summary-item__value">${leadsPerHour}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item__label">Taxa Agendamento (Manhã)</span>
                        <span class="summary-item__value">${morningConversion}%</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item__label">Taxa Agendamento (Tarde)</span>
                        <span class="summary-item__value">${afternoonConversion}%</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item__label">Melhor Dia (Taxa de Conclusão)</span>
                        <span class="summary-item__value">${bestDayByRate.day} (${bestDayByRate.rate}%)</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item__label">Dia Mais Produtivo (Volume)</span>
                        <span class="summary-item__value">${bestDayByVolume.day} (${bestDayByVolume.count} ativ.)</span>
                    </div>
                </div>
                <div class="pattern-analysis__details">
                    <div>
                        <h5>Horários de Pico (Início)</h5>
                        <ul>${Object.entries(peakHoursByCategory).map(([cat, hour]) => `<li><strong>${cat}:</strong> ${hour}</li>`).join('')}</ul>
                    </div>
                    <div>
                        <h5>Atividades que Mais Atrasam</h5>
                        ${sortedLateActivities.length > 0 ? `<ul>${sortedLateActivities.map(([name, count]) => `<li>${name} (${count}x)</li>`).join('')}</ul>` : '<p>Nenhuma atividade atrasou.</p>'}
                    </div>
                </div>
            </div>`;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = tableHTML + patternsHTML;
        container.replaceChildren(...Array.from(wrapper.childNodes));
    };


    const renderSummaryReportView = (activities) => {
        getEl('report-chart-title').textContent = 'Distribuição de Tempo por Categoria';
        getEl('activity-details-card').classList.remove('hidden');

        const categoryCounts = activities.reduce((acc, a) => {
            acc[a.categoria] = (acc[a.categoria] || 0) + (a.duracao || 0);
            return acc;
        }, {});
        
        const chartData = {
            labels: Object.keys(categoryCounts),
            datasets: [{
                data: Object.values(categoryCounts),
                backgroundColor: Object.keys(categoryCounts).map(cat => (activities.find(a => a.categoria === cat) || {}).cor || '#CCC')
            }]
        };

        const chartOptions = { 
            responsive: true, maintainAspectRatio: false,
            onClick: (event, elements, chart) => {
                if (elements.length > 0) {
                    const category = chart.data.labels[elements[0].index];
                    reportCategoryFilter = (reportCategoryFilter === category) ? 'all' : category;
                    renderActivityDetailTable(activities);
                }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.chart.getDatasetMeta(0).total;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${formatDuration(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        };
        renderMainReportChart('doughnut', chartData, chartOptions);
        renderActivityDetailTable(activities);
        renderEfficiencyReport(activities); // **CHAMADA DA FUNÇÃO DE EFICIÊNCIA**
    };

    const renderTrendsReportView = (historicalData, days) => {
        getEl('report-chart-title').textContent = `Tendências nos Últimos ${days} Dias`;
        getEl('activity-details-card').classList.add('hidden');

        const labels = [];
        const dateMap = new Map();
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            labels.unshift(d.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}));
            dateMap.set(dateStr, { completed: 0, leads: 0 });
        }
        
        Object.keys(historicalData).forEach(date => {
            if (dateMap.has(date)) {
                const dayData = dateMap.get(date);
                dayData.completed = historicalData[date].filter(a => a.status === 'concluido').length;
                dayData.leads = historicalData[date].reduce((sum, a) => sum + (a.leads_contatados || 0), 0);
            }
        });

        const completedData = Array.from(dateMap.values()).map(d => d.completed);
        const leadsData = Array.from(dateMap.values()).map(d => d.leads);

        renderMainReportChart('bar', {
            labels,
            datasets: [
                {
                    label: 'Atividades Concluídas', data: completedData,
                    backgroundColor: 'rgba(66, 133, 244, 0.7)', yAxisID: 'y'
                },
                {
                    label: 'Leads Contatados', data: leadsData,
                    borderColor: '#ea4335', backgroundColor: '#ea4335',
                    type: 'line', tension: 0.3, yAxisID: 'y1'
                }
            ]
        }, {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Nº de Atividades' } },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Nº de Leads' }, grid: { drawOnChartArea: false } }
            }
        });
    };

    const renderProductivityHeatmapView = (activities) => {
        getEl('report-chart-title').textContent = 'Mapa de Produtividade (Atividades Concluídas)';
        getEl('activity-details-card').classList.add('hidden');
        if(charts.mainReport) charts.mainReport.destroy();

        const container = getEl('report-main-chart').parentElement;
        const heatmapData = Array.from({ length: 7 }, () => Array(24).fill(0));
        let maxCount = 0;

        activities.filter(a => a.status === 'concluido').forEach(a => {
            if (!a.date || !a.horario_inicio) return;
            const dayOfWeek = new Date(a.date + 'T00:00:00').getDay();
            const hour = parseInt(a.horario_inicio.split(':')[0]);
            if (heatmapData[dayOfWeek] && heatmapData[dayOfWeek][hour] !== undefined) {
                heatmapData[dayOfWeek][hour]++;
                if (heatmapData[dayOfWeek][hour] > maxCount) {
                    maxCount = heatmapData[dayOfWeek][hour];
                }
            }
        });

        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        let tableHTML = '<div class="table-container"><table class="activity-detail-table" style="text-align: center;"><thead><tr><th>Dia</th>';
        for(let h = 8; h < 19; h++) tableHTML += `<th>${h}h</th>`;
        tableHTML += '</tr></thead><tbody>';

        for (let d = 1; d < 7; d++) { // Começa em 1 (Segunda) e termina em 6 (Sábado)
            tableHTML += `<tr><td><strong>${weekDays[d]}</strong></td>`;
            for (let h = 8; h < 19; h++) {
                const count = heatmapData[d][h];
                const opacity = maxCount > 0 ? (count / maxCount) : 0;
                const color = count > 0 ? `rgba(66, 133, 244, ${opacity})` : 'transparent';
                tableHTML += `<td style="background-color: ${color};" title="${count} atividades concluídas">${count > 0 ? count : ''}</td>`;
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</tbody></table></div>';
        const canvasHidden = Object.assign(document.createElement('canvas'), { id: 'report-main-chart' });
        canvasHidden.style.display = 'none';
        const wrap = document.createElement('div');
        wrap.innerHTML = tableHTML;
        container.replaceChildren(canvasHidden, ...Array.from(wrap.childNodes));
    };

    // --- FUNÇÃO CONTROLADORA PRINCIPAL ---

    const renderCronogramaReport = () => {
        queryAll('.report-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.reportType === activeReportType);
        });

        const days = parseInt(getEl('period-select').value);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        const historicalData = appData.scheduleHistory || {};
        const filteredDates = Object.keys(historicalData).filter(date => {
            const logDate = new Date(date + 'T00:00:00');
            return logDate >= startDate && logDate <= endDate;
        });
        
        const activities = filteredDates.flatMap(date => 
            historicalData[date].map(activity => ({...activity, date}))
        );

        if (activities.length === 0) {
            getEl('report-summary-1-value').textContent = 'N/A';
            getEl('report-summary-1-label').textContent = 'Sem Dados Históricos';
            ['2', '3', '4', '5'].forEach(i => {
                getEl(`report-summary-${i}-value`).textContent = '...';
                getEl(`report-summary-${i}-label`).textContent = 'Aguardando dados...';
            });
            getEl('activity-details-card').classList.add('hidden');
            const infoP = document.createElement('p');
            infoP.textContent = 'Salve o estado de um dia na página "Cronograma" para começar a coletar dados históricos.';
            getEl('efficiency-metrics-content').replaceChildren(infoP);
            getEl('insights-card').classList.add('hidden'); // Garante que o card de insights fique oculto
            if(charts.mainReport) charts.mainReport.destroy();
            const container = getEl('report-main-chart').parentElement;
            const canvas = Object.assign(document.createElement('canvas'), { id: 'report-main-chart' });
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            const p = document.createElement('p');
            p.textContent = 'Nenhum dado histórico encontrado para o período. Use o botão "Finalizar Dia" na página Cronograma para salvar seus dados.';
            empty.appendChild(p);
            container.replaceChildren(canvas, empty);
            return;
        }

        const totalAtividades = activities.length;
        const concluidas = activities.filter(a => a.status === 'concluido').length;
        const taxaConclusao = totalAtividades > 0 ? Math.round((concluidas / totalAtividades) * 100) : 0;
        const minutosProdutivos = activities.filter(a => a.status === 'concluido' && a.categoria !== 'Descanso').reduce((sum, a) => sum + (a.duracao || 0), 0);
        const tempoProdutivoFormatado = formatDuration(minutosProdutivos);
        const totalMetasLeads = activities.reduce((sum, a) => sum + (a.meta_leads || 0), 0);
        const totalLeadsContatados = activities.reduce((sum, a) => sum + (a.leads_contatados || 0), 0);
        const atingimentoMetaLeads = totalMetasLeads > 0 ? Math.round((totalLeadsContatados / totalMetasLeads) * 100) : 0;
        const atividadesProspeccao = activities.filter(a => a.categoria === 'Prospecção');
        const leadsDaProspeccao = atividadesProspeccao.reduce((sum, a) => sum + (a.leads_contatados || 0), 0);
        const minutosProspeccao = atividadesProspeccao.reduce((sum, a) => sum + (a.duracao || 0), 0);
        const horasProspeccao = minutosProspeccao / 60;
        const eficienciaProspeccao = horasProspeccao > 0 ? (leadsDaProspeccao / horasProspeccao).toFixed(1) : '0.0';
        
        getEl('report-summary-1-value').textContent = totalAtividades;
        getEl('report-summary-1-label').textContent = `Atividades (${days} dias)`;
        getEl('report-summary-2-value').textContent = `${taxaConclusao}%`;
        getEl('report-summary-2-label').textContent = 'Taxa de Conclusão Média';
        getEl('report-summary-3-value').textContent = tempoProdutivoFormatado;
        getEl('report-summary-3-label').textContent = 'Tempo Produtivo Total';
        getEl('report-summary-4-value').textContent = `${atingimentoMetaLeads}%`;
        getEl('report-summary-4-label').textContent = 'Meta de Leads Atingida';
        getEl('report-summary-5-value').textContent = eficienciaProspeccao;
        getEl('report-summary-5-label').textContent = 'Leads / Hora (Prospecção)';
        
        const parent1 = getEl('report-main-chart').parentElement;
        parent1.replaceChildren(Object.assign(document.createElement('canvas'), { id: 'report-main-chart' }));
        
        getEl('report-summary-5-label').textContent = 'Leads / Hora (Prospecção)';
        
        
        // --- INÍCIO DA INTEGRAÇÃO DO SISTEMA DE INSIGHTS ---
        const insights = generateInsights(activities);
        renderInsights(insights);
        // --- FIM DA INTEGRAÇÃO DO SISTEMA DE INSIGHTS ---
        
        const parent2 = getEl('report-main-chart').parentElement;
        parent2.replaceChildren(Object.assign(document.createElement('canvas'), { id: 'report-main-chart' }));

        switch(activeReportType) {
            case 'summary':
                renderSummaryReportView(activities);
                break;
            case 'trends':
                renderTrendsReportView(historicalData, days);
                break;
            case 'efficiency':
                renderProductivityHeatmapView(activities);
                break;
            default:
                renderSummaryReportView(activities);
        }
    };
      
   const renderActivityDetailTable = (activities) => {
        const tbody = getEl('activity-details-tbody');
        const title = getEl('activity-details-title');

        if (!activities || activities.length === 0) {
            title.textContent = `Detalhamento de Atividades`;
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 7;
            td.style.textAlign = 'center';
            td.textContent = 'Nenhuma atividade no período selecionado. Salve o dia em "Cronograma" para criar o histórico.';
            tr.appendChild(td);
            tbody.replaceChildren(tr);
            return;
        }

        // --- INÍCIO DA CORREÇÃO ---
        // 1. Usa um Map para garantir que apenas a versão mais recente de cada atividade (pelo ID) seja mantida.
        // Como as atividades são processadas em ordem cronológica, a última entrada para um ID sempre será a mais recente.
        const activityMap = new Map();
        activities.forEach(activity => {
            activityMap.set(activity.id, activity);
        });
        const latestActivities = Array.from(activityMap.values());
        // --- FIM DA CORREÇÃO ---

        const filteredActivities = latestActivities.filter(a => reportCategoryFilter === 'all' || a.categoria === reportCategoryFilter);
        title.textContent = `Detalhamento de Atividades ${reportCategoryFilter !== 'all' ? `(${reportCategoryFilter})` : ''}`;

        const { key, direction } = reportSortConfig;
        filteredActivities.sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        queryAll('th[data-action="sort-report-table"]').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
            if (th.dataset.sortBy === key) {
                th.classList.add(direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
            }
        });

        if (filteredActivities.length === 0) {
            const tr2 = document.createElement('tr');
            const td2 = document.createElement('td');
            td2.colSpan = 7;
            td2.style.textAlign = 'center';
            td2.textContent = `Nenhuma atividade encontrada para a categoria "${reportCategoryFilter}".`;
            tr2.appendChild(td2);
            tbody.replaceChildren(tr2);
            return;
        }
        
        // 2. Renderiza a tabela usando a lista de atividades já filtrada e corrigida.
        const fragRows = document.createDocumentFragment();
        filteredActivities.forEach(a => {
            const tr = document.createElement('tr');
            const tdNome = document.createElement('td'); tdNome.textContent = a.nome; tr.appendChild(tdNome);
            const tdCat = document.createElement('td'); tdCat.textContent = a.categoria; tr.appendChild(tdCat);
            const tdHora = document.createElement('td'); tdHora.textContent = `${a.horario_inicio} - ${a.horario_fim}`; tr.appendChild(tdHora);
            const tdStatus = document.createElement('td'); const span = document.createElement('span'); span.className = `activity-item__status status-${a.status}`; span.textContent = getStatusText(a.status); tdStatus.appendChild(span); tr.appendChild(tdStatus);
            const tdPrio = document.createElement('td'); tdPrio.textContent = a.prioridade || 'N/A'; tr.appendChild(tdPrio);
            const tdLeads = document.createElement('td'); tdLeads.textContent = `${a.leads_contatados || 0}/${a.meta_leads || 0}`; tr.appendChild(tdLeads);
            const tdVisitas = document.createElement('td'); tdVisitas.textContent = `${a.visitas_realizadas || 0}/${a.meta_visitas || 0}`; tr.appendChild(tdVisitas);
            fragRows.appendChild(tr);
        });
        tbody.replaceChildren(fragRows);
    };

    const renderAcompanhamentoReport = () => {
        const days = parseInt(getEl('period-select').value);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        const dateKeys = Object.keys(appData.dailyLogs).filter(date => {
            const logDate = new Date(date + 'T00:00:00');
            return logDate >= startDate && logDate <= endDate;
        }).sort();

        const reportData = dateKeys.map(date => ({ date, ...appData.dailyLogs[date] }));

        const totals = reportData.reduce((acc, log) => {
            acc.ligacoes += log.ligacoes || 0;
            acc.visitas += log.visitas || 0;
            acc.matriculas += log.matriculas || 0;
            acc.leads_novos += log.leads_novos || 0;
            acc.agendamentos += log.agendamentos || 0;
            acc.leads_negativados += log.leads_negativados || 0; // <-- ADICIONE ESTA LINHA
            return acc;
            }, { ligacoes: 0, visitas: 0, matriculas: 0, leads_novos: 0, agendamentos: 0, leads_negativados: 0 });

       // E substitua por este, que agora usa um contêiner e adiciona o novo card:
 const summaryContainer = query('.report-summary'); // Use query('.report-summary') para selecionar pela classe

    summaryContainer.className = 'report-summary report-summary--6-items'; // Classe para 6 itens
    summaryContainer.innerHTML = `
        <div class="summary-card">
            <h3 id="report-summary-1-value">${totals.leads_novos}</h3>
            <p id="report-summary-1-label">Total de Leads Novos</p>
        </div>
        <div class="summary-card">
            <h3 id="report-summary-2-value">${totals.ligacoes}</h3>
            <p id="report-summary-2-label">Total de Ligações</p>
        </div>
        <div class="summary-card">
            <h3 id="report-summary-3-value">${totals.visitas}</h3>
            <p id="report-summary-3-label">Total de Visitas</p>
        </div>
        <div class="summary-card">
            <h3 id="report-summary-4-value">${totals.matriculas}</h3>
            <p id="report-summary-4-label">Total de Matrículas</p>
        </div>
        <div class="summary-card">
            <h3 id="report-summary-6-value" style="color: var(--color-error);">${totals.leads_negativados}</h3>
            <p id="report-summary-6-label">Total de Leads Negativados</p>
        </div>
            <div class="summary-card">
            <h3 id="report-summary-5-value">0</h3>
            <p id="report-summary-5-label">Leads Novos (Hoje)</p>
        </div>
    `;

        const conversionGrid = getEl('conversion-rates-grid');
        conversionGrid.innerHTML = `
            <div class="summary-card"><h3>${calculateConversionRate(totals.ligacoes, totals.leads_novos)}%</h3><p>Leads ➔ Ligações</p></div>
            <div class="summary-card"><h3>${calculateConversionRate(totals.agendamentos, totals.ligacoes)}%</h3><p>Ligações ➔ Agendamentos</p></div>
            <div class="summary-card"><h3>${calculateConversionRate(totals.visitas, totals.agendamentos)}%</h3><p>Agendamentos ➔ Visitas</p></div>
            <div class="summary-card"><h3>${calculateConversionRate(totals.matriculas, totals.visitas)}%</h3><p>Visitas ➔ Matrículas</p></div>
        `;

        getEl('report-chart-title').textContent = `Atividades e Leads nos Últimos ${days} Dias`;
        
        const chartData = {
            labels: reportData.map(d => new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})),
            datasets: [
                { label: 'Leads Novos', data: reportData.map(d => d.leads_novos), borderColor: '#ea4335', backgroundColor: '#ea4335', type: 'line', fill: false, tension: 0.4, yAxisID: 'y', },
                { label: 'Leads Negativados', data: reportData.map(d => d.leads_negativados), borderColor: '#808080', backgroundColor: '#808080', type: 'line', fill: false, tension: 0.4, yAxisID: 'y', borderDash: [5, 5] },
                { label: 'Ligações', data: reportData.map(d => d.ligacoes), borderColor: '#4285f4', backgroundColor: '#4285f4', type: 'line', fill: false, tension: 0.4, yAxisID: 'y', },
                { label: 'Agendamentos', data: reportData.map(d => d.agendamentos), borderColor: '#7209b7', backgroundColor: '#7209b7', type: 'line', fill: false, tension: 0.4, yAxisID: 'y', },
                { label: 'Visitas', data: reportData.map(d => d.visitas), borderColor: '#34a853', backgroundColor: '#34a853', type: 'line', fill: false, tension: 0.4, yAxisID: 'y', },
                { label: 'Matrículas', data: reportData.map(d => d.matriculas), borderColor: '#fbbc04', backgroundColor: '#fbbc04', type: 'line', fill: false, tension: 0.4, yAxisID: 'y', }
            ]
        };

        const chartOptions = { 
            responsive: true, maintainAspectRatio: false, 
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Quantidade' } } },
            plugins: { tooltip: { mode: 'index', intersect: false } }
        };
        
        renderMainReportChart('line', chartData, chartOptions);
    };

    const renderMainReportChart = (type, data, options) => {
        const ctx = getEl('report-main-chart')?.getContext('2d');
        if (!ctx) return;
        if (charts.mainReport) charts.mainReport.destroy();
        charts.mainReport = new Chart(ctx, { type, data, options });
    };

    let draggedElement = null;
    const initDragAndDrop = () => {
        const container = getEl('schedule-grid');
        container.addEventListener('dragstart', e => {
            if (!isEditMode || !e.target.classList.contains('schedule-block')) return;
            draggedElement = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        });
        
        container.addEventListener('dragend', e => {
            if (!draggedElement) return;
            draggedElement.classList.remove('dragging');
            queryAll('.drag-placeholder').forEach(p => p.remove());
            draggedElement = null;
        });
        
        container.addEventListener('dragover', e => {
            e.preventDefault();
            if (!draggedElement) return;
            const afterElement = [...container.querySelectorAll('.schedule-block:not(.dragging)')].reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = e.clientY - box.top - box.height / 2;
                return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
            }, { offset: Number.NEGATIVE_INFINITY }).element;
            
            queryAll('.drag-placeholder').forEach(p => p.remove());
            const placeholder = document.createElement('div');
            placeholder.className = 'drag-placeholder';
            if (afterElement == null) {
                container.appendChild(placeholder);
            } else {
                container.insertBefore(placeholder, afterElement);
            }
        });
        
        container.addEventListener('drop', e => {
            e.preventDefault();
            if (!draggedElement) return;
            const placeholder = query('.drag-placeholder');
            if (!placeholder) return;
            
            const draggedId = parseInt(draggedElement.dataset.id);
            const draggedIndex = appData.blocos_atividades.findIndex(a => a.id === draggedId);
            const [draggedActivity] = appData.blocos_atividades.splice(draggedIndex, 1);
            
            const children = [...container.children];
            const newIndex = children.indexOf(placeholder);

            appData.blocos_atividades.splice(newIndex, 0, draggedActivity);
            appData.activeTemplateName = "Cronograma Personalizado";
            saveAndRerender();
            showToast('Cronograma reordenado!', 'success');
        });
    };
    
    const globalClickHandler = (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        e.preventDefault();
        const { action, id, custom, status, source, phaseIndex, scriptId, reportType, sortBy } = target.dataset;
        
        const actions = {
            'add-activity': () => openActivityModal(),
            'edit-activity': () => openActivityModal(appData.blocos_atividades.find(a => a.id == id)),
            'delete-activity': () => deleteActivity(id),
            'duplicate-activity': () => duplicateActivity(id),
            'toggle-status': () => toggleActivityStatus(id),
            'filter-status': () => { appData.scheduleStatusFilter = status; saveDataToFirestore(); initSchedule(); },
            'set-report-source': () => { appData.reportSource = source; saveDataToFirestore(); initReports(); },
            'set-report-type': () => {
                activeReportType = reportType;
                renderCronogramaReport();
            },
            'export-weekly-report': () => generateAdvancedReport('weekly'),
            'export-roi-report': () => generateAdvancedReport('roi'),
            'close-modal': () => closeModal(target.closest('.modal').id),
            'save-current-template': () => openModal('template-modal'),
            'finish-day': () => archiveDaySchedule(),
            'apply-template': () => applyTemplate(id, custom),
            'delete-template': () => deleteTemplate(id),
            'reset-data': () => {
                showConfirmation('Limpar Dados', 'Isso irá apagar TODAS as atividades, templates e acompanhamentos, e restaurar os dados iniciais. Esta ação é irreversível.', () => {
                    localStorage.removeItem('appDataEnsinaMais');
                    loadDataFromFirestore();
                    //initApp();
                    showToast('Dados restaurados para o padrão!', 'success');
                });
            },
            'copy-script': () => {
                const pre = target.nextElementSibling;
                if(pre && pre.tagName === 'PRE') {
                    navigator.clipboard.writeText(pre.innerText)
                        .then(() => showToast('Script copiado! 📋', 'success'))
                        .catch(err => showToast('Falha ao copiar.', 'error'));
                }
            },
            'select-phase': () => {
                appData.activeScriptPhase = parseInt(phaseIndex);
                saveDataToFirestore();
                initScripts();
            },
            'add-phase': () => openPhaseModal(),
            'edit-phase': () => openPhaseModal(parseInt(phaseIndex)),
            'delete-phase': () => deletePhase(parseInt(phaseIndex)),
            'add-script': () => openScriptModal(parseInt(phaseIndex)),
            'edit-script': () => openScriptModal(parseInt(phaseIndex), parseInt(scriptId)),
            'delete-script': () => deleteScript(parseInt(phaseIndex), parseInt(scriptId)),
            'export-data': exportData,
            'trigger-import': () => getEl('import-file-input').click(),
            'sort-report-table': () => {
                const newSortKey = sortBy;
                if (reportSortConfig.key === newSortKey) {
                    reportSortConfig.direction = reportSortConfig.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    reportSortConfig.key = newSortKey;
                    reportSortConfig.direction = 'asc';
                }
                renderCronogramaReport();
            },
        };
        
        if (actions[action]) {
            actions[action]();
        }
    };

    const initEventListeners = () => {
        document.body.addEventListener('click', globalClickHandler);
    
        getEl('sidebar').addEventListener('click', e => {
            const link = e.target.closest('.nav-link');
            if (link) {
                e.preventDefault();
                navigateTo(link.dataset.page);
                // Fecha a sidebar em telas pequenas após a navegação
                if (window.matchMedia('(max-width: 768px)').matches) {
                    const sidebar = getEl('sidebar');
                    sidebar.classList.remove('open');
                    console.log('Sidebar fechada após navegação em mobile');
                }
            }
        });
        
        getEl('activity-form').addEventListener('submit', e => { e.preventDefault(); saveActivity(); });
        getEl('daily-log-form').addEventListener('submit', e => { e.preventDefault(); saveDailyLog(getEl('daily-log-date').value); });
        getEl('template-form').addEventListener('submit', e => { e.preventDefault(); saveCurrentAsTemplate(); });
        getEl('script-form').addEventListener('submit', e => { e.preventDefault(); saveScript(); });
        getEl('phase-form').addEventListener('submit', e => { e.preventDefault(); savePhase(); });
        getEl('confirmation-confirm').addEventListener('click', () => { if (confirmationCallback) confirmationCallback(); closeModal('confirmation-modal'); });
        
        getEl('edit-mode-btn').addEventListener('click', () => toggleEditMode(true));
        getEl('view-mode-btn').addEventListener('click', () => toggleEditMode(false));
        getEl('sidebar-toggle').addEventListener('click', () => getEl('sidebar').classList.toggle('open'));
        const mobileFab = getEl('mobile-menu-fab');
        if (mobileFab) {
            console.log('Mobile FAB encontrado:', mobileFab);
            mobileFab.addEventListener('click', () => {
                console.log('Mobile FAB clicado');
                getEl('sidebar').classList.toggle('open');
            });
            
            // DEBUG: For\u00e7a visibilidade para teste
            setTimeout(() => {
                const currentWidth = window.innerWidth;
                console.log('Largura da tela:', currentWidth);
                if (currentWidth <= 768) {
                    mobileFab.classList.add('debug');
                    console.log('FAB for\u00e7ado a aparecer em tela mobile');
                }
            }, 1000);
        } else {
            console.error('Mobile FAB n\u00e3o encontrado!');
        }
        getEl('daily-log-date').addEventListener('change', e => renderDailyLogForm(e.target.value));
        getEl('period-select').addEventListener('change', initReports);
        getEl('template-selector').addEventListener('change', e => {
            if (!e.target.value) return;
            const [type, id] = e.target.value.split('-');
            applyTemplate(id, type === 'cst' ? 'true' : 'false');
            e.target.value = '';
        });
        
        getEl('import-file-input').addEventListener('change', importData);

        getEl('activity-modal').addEventListener('click', e => {
            const iconOption = e.target.closest('.icon-option');
            if (iconOption) { queryAll('.icon-option').forEach(opt => opt.classList.remove('selected')); iconOption.classList.add('selected'); }
            const colorOption = e.target.closest('.color-option');
            if (colorOption) { queryAll('.color-option').forEach(opt => opt.classList.remove('selected')); colorOption.classList.add('selected'); }
        });
        
        getEl('activity-start').addEventListener('change', updateDurationDisplay);
        getEl('activity-end').addEventListener('change', updateDurationDisplay);
        
        initDragAndDrop();
    };
    
    const saveAndRerender = (forceReinitEventListeners = false) => {
        saveDataToFirestore();
        
        if (forceReinitEventListeners) {
            document.body.removeEventListener('click', globalClickHandler);
            initEventListeners();
        }
        
        const initializers = {
            'dashboard': initDashboard,
            'cronograma': initSchedule,
            'templates': initTemplates,
            'leads': initDailyLog,
            'scripts': initScripts,
            'relatorios': initReports,
        };
        if (initializers[activePage]) {
            initializers[activePage]();
        }
    };

    const initApp = () => {
        // --- MODIFICADO ---
        // Adiciona a lógica para pedir permissão de notificação
        if ('Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        showToast('Notificações ativadas! ✅', 'success');
                    }
                });
            }
        }

        navigateTo('dashboard');

        // --- MODIFICADO ---
        // Inicia o relógio e a verificação de atividades imediatamente e depois a cada 30s
        updateClock();
        checkUpcomingActivities();
        setInterval(() => {
            updateClock();
            checkUpcomingActivities(); // Verifica atividades futuras a cada 30 segundos
        }, 1000 * 30);
    };
    
   // loadDataFromFirestore();
    initEventListeners();
    //initApp();
    
// --- INÍCIO: FUNCIONALIDADES PARA DISPOSITIVOS MÓVEIS ---

    // Função para ativar/desativar o botão do modo compacto
    const toggleCompactModeButton = () => {
       
    };
    
 


   // Substitua a função antiga por esta versão melhorada
const initSwipeNavigation = () => {
    const pageOrder = ['dashboard', 'cronograma', 'templates', 'leads', 'scripts', 'relatorios', 'configuracoes'];
    const mainContentEl = query('.main-content');

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isScrolling = false; // Flag para controlar se é um scroll vertical

    mainContentEl.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        isScrolling = false; // Reseta a flag a cada novo toque
    }, { passive: true });

    mainContentEl.addEventListener('touchmove', e => {
        // Se já determinamos que é um scroll, não fazemos mais nada
        if (isScrolling) return;

        const currentX = e.changedTouches[0].screenX;
        const currentY = e.changedTouches[0].screenY;
        const deltaX = Math.abs(touchStartX - currentX);
        const deltaY = Math.abs(touchStartY - currentY);

        // Se o movimento vertical for significativamente maior que o horizontal,
        // marcamos como scroll e não interferimos mais.
        if (deltaY > deltaX + 5) { // O +5 adiciona uma pequena tolerância
            isScrolling = true;
        }
    }, { passive: true });

    mainContentEl.addEventListener('touchend', e => {
        // Se foi um scroll, não fazemos a navegação
        if (isScrolling) return;

        touchEndX = e.changedTouches[0].screenX;
        const deltaX = touchEndX - touchStartX;

        // Verifica se o deslocamento horizontal foi suficiente para ser um swipe
        if (Math.abs(deltaX) < 60) { // Aumentei um pouco o mínimo para evitar toques acidentais
            return;
        }

        const currentIndex = pageOrder.indexOf(activePage);

        if (deltaX < 0 && currentIndex < pageOrder.length - 1) { // Swipe para a Esquerda
            navigateTo(pageOrder[currentIndex + 1]);
        } else if (deltaX > 0 && currentIndex > 0) { // Swipe para a Direita
            navigateTo(pageOrder[currentIndex - 1]);
        }
    }, { passive: true });
};

    // Adiciona o listener para o botão de modo compacto
    const compactModeBtn = getEl('compact-mode-btn');
    if (compactModeBtn) {
        compactModeBtn.addEventListener('click', () => {
            const grid = getEl('schedule-grid');
            grid.classList.toggle('schedule-grid--compact');
            
            const isCompact = grid.classList.contains('schedule-grid--compact');
            compactModeBtn.textContent = isCompact ? '🖼️ Modo Padrão' : '📄 Modo Compacto';
            showToast(isCompact ? 'Modo compacto ativado.' : 'Modo padrão ativado.', 'info');
        });
    }

    // Inicializa a navegação por swipe
    initSwipeNavigation();
    
    // Detector de mudança de tamanho para ajustar mobile
    const handleResize = () => {
        const isMobile = window.innerWidth <= 768;
        const mobileFab = getEl('mobile-menu-fab');
        const sidebar = getEl('sidebar');
        
        console.log('Resize detectado - Mobile:', isMobile, 'Largura:', window.innerWidth);
        
        if (isMobile) {
            if (mobileFab) {
                mobileFab.style.display = 'flex';
                console.log('FAB exibido para mobile');
            }
        } else {
            if (sidebar) {
                sidebar.classList.remove('open');
                console.log('Sidebar fechada em desktop');
            }
            if (mobileFab) {
                mobileFab.style.display = 'none';
                console.log('FAB ocultado em desktop');
            }
        }
    };
    
    // Executa imediatamente e adiciona listener
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Debug: Verifica periodicamente o estado do FAB
    setInterval(() => {
        const mobileFab = getEl('mobile-menu-fab');
        const sidebar = getEl('sidebar');
        const isMobile = window.innerWidth <= 768;
        
        if (mobileFab && isMobile) {
            const computedStyle = window.getComputedStyle(mobileFab);
            const isVisible = computedStyle.display !== 'none';
            console.log('Status FAB:', {
                exists: !!mobileFab,
                isMobile,
                windowWidth: window.innerWidth,
                computedDisplay: computedStyle.display,
                visible: isVisible,
                sidebarOpen: sidebar?.classList.contains('open')
            });
        }
    }, 5000); // Verifica a cada 5 segundos
    
    // Fecha sidebar ao clicar fora dela em mobile
    document.addEventListener('click', (e) => {
        const sidebar = getEl('sidebar');
        const mobileFab = getEl('mobile-menu-fab');
        const sidebarToggle = getEl('sidebar-toggle');
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile && sidebar && sidebar.classList.contains('open')) {
            // Se clicou fora da sidebar, do FAB e do toggle button
            if (!sidebar.contains(e.target) && 
                e.target !== mobileFab && 
                e.target !== sidebarToggle &&
                !sidebarToggle?.contains(e.target)) {
                sidebar.classList.remove('open');
                console.log('Sidebar fechada por clique externo');
            }
        }
    });

// --- FIM: FUNCIONALIDADES PARA DISPOSITIVOS MÓVEIS ---

});

// --- FIM DO ARQUIVO APP.JS ---S