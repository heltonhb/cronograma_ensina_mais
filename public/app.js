// app.js (Topo do arquivo)

import { showToast } from './js/components/Toast.js';

import { startNotificationService } from './js/services/notifications.js';

// ✅ CORRETO: writeBatch mora no "firestore"
import { getFirestore, writeBatch, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";


import {
    initReports,
    setReportType,
    generateAdvancedReportDoc,
    toggleReportSort,
    generateMonthlyFunnel,
    renderEvolutionChart
} from './js/modules/reports.js';

import {
    initScripts,
    selectPhase,
    openPhaseModal, savePhase, deletePhase,
    openScriptModal, saveScript, deleteScript,
    copyScriptToClipboard
} from './js/modules/scripts.js';

import { initDailyLog, renderDailyLogForm, saveDailyLog, updateTodaysLeadsMetric } from './js/modules/dailyLog.js';
import {
    initSchedule,
    toggleEditMode,
    deleteActivity,
    duplicateActivity,
    toggleActivityStatus,
    applyTemplate,          // <--- Vírgula adicionada aqui
    openActivityModal,      // <--- Vírgula adicionada aqui
    saveActivity,           // <--- Vírgula adicionada aqui
    updateDurationDisplay,  // O último não precisa, mas pode ter
    setKanbanState // <--- ADICIONE ISTO NA IMPORTAÇÃO
} from './js/modules/scheduler.js';

// ... resto dos imports ...
import { getStore, setStore, initStoreData, resetStore } from './js/core/store.js';

// No topo do app.js
import { renderGamificationWidget, checkDailyStreak, processActivityXP, processDailyLogXP, ensureMonthlyReset } from './js/services/gamification.js';
import { updateGamificationRules, resetMatriculadorProfile } from './js/services/gamification.js';
// ...



// Dentro da função initDashboard:
const initDashboard = () => {
    updateDashboardMetrics();
    renderTodayActivities();
    createPerformanceChart();
    updateTodaysLeadsMetric();

    // NOVO: Renderiza o jogo
    renderGamificationWidget();
};

// ... outros códigos ...

// --- STATE MANAGEMENT (SUBSTITUIÇÃO) ---
// Em vez de 'let appData = {}', usamos um Proxy.
// O Proxy intercepta qualquer leitura ou escrita em 'appData'.

const appData = new Proxy({}, {
    // Quando alguém pede 'appData.algumaCoisa'
    get: (target, prop) => {
        return getStore()[prop];
    },
    // Quando alguém faz 'appData.algumaCoisa = valor'
    set: (target, prop, value) => {
        setStore({ [prop]: value });
        return true;
    }
});

// Removemos a constante initialState daqui, pois ela já vive no store.js

import {
    timeToMinutes,
    calculateDuration,
    formatDuration,
    generateUniqueId,
    getStatusText,
    calculateConversionRate,
    downloadObjectAsJson,
    escapeHtml
} from './js/core/utils.js';

// app.js (Adicione junto com os outros imports)
import {
    generateWeeklyExecutiveReport,
    generateTimeROIReport,
    generateInsights,
    getSalesMetrics,
    calculateConversion
} from './js/services/analytics.js';

import { generateSalesForecast } from './js/services/forecast.js'; // Ajuste o caminho se salvou em outro lugar
import { renderKanbanBoard, renderScheduleGrid } from './js/components/ScheduleGrid.js';
// Importe as novas funções

// Adicione junto aos outros componentes
import { renderTemplatesList } from './js/components/TemplatesList.js';
import {
    fetchFullUserData,
    saveCoreData,
    saveDailyLogEntry,
    saveScheduleHistoryEntry,
    fetchAtomicActivities,
    saveActivityAtomic // <--- ADICIONE ESTA LINHA AQUI
} from './js/services/firestore.js';

// 1. Adicione este import no topo do ficheiro (junto aos outros imports)
import { loginUser, registerUser, logoutUser, initAuthObserver } from './js/services/auth.js';
// ---------------- OFFLINE ---------------- //
import { addAtividade, updateAtividade, deleteAtividade as deleteLocal, getAtividades } from './js/db.js';
import { queueChange } from './js/offline.js';
//import { auth, db } from './firebase-config.js'; // Importa auth e db diretamente
import { setFirebaseRefs } from './js/offline.js';
// ----------------------------------------- //
// ---------------- IA ---------------- //
import { loadModel, predictConversion, explain } from './js/services/ai.js';
// ------------------------------------ //
import { auth, db, firebaseFunctions } from './firebase-config.js';

// Logo após todas as linhas de import no app.js
setFirebaseRefs(auth, db);

// --------------------------------------------------
// REGISTRO DO SERVICE WORKER com cache-busting
// --------------------------------------------------
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js?v=' + Date.now())  // << cache-burst
            .then(registration => {
                console.log('ServiceWorker registrado com sucesso. Escopo: ', registration.scope);
            })
            .catch(err => {
                console.log('Falha no registro do ServiceWorker: ', err);
            });
    });
}
// --------------------------------------------------
// --- FIM: REGISTRO DO SERVICE WORKER ---

// --- INÍCIO DO ARQUIVO APP.JS (VERSÃO CORRIGIDA E COM NOTIFICAÇÕES) ---
import { initErrorHandler } from './js/core/errorHandler.js';
import { renderModals } from './js/components/Modals.js';
import { Router } from './js/core/router.js';

document.addEventListener('DOMContentLoaded', () => {

    initErrorHandler();
    renderModals();


    const getEl = (id) => document.getElementById(id);
    const query = (selector) => document.querySelector(selector);
    const queryAll = (selector) => document.querySelectorAll(selector);

    const card = document.getElementById('activity-details-card');
    if (card) card.classList.add('mode-cronograma');


    // --- INSIRA AQUI A NOVA FUNÇÃO ---
    // Função auxiliar para gerar hash (SHA-256)
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

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


    // 1. Função que inicia o processo (chamada pelo botão da engrenagem)
    const startAdminAuth = () => {
        // Limpa o campo e foca nele
        const input = getEl('admin-login-input');
        if (input) input.value = '';

        openModal('admin-login-modal');

        // Pequeno delay para focar no input automaticamente
        setTimeout(() => { if (input) input.focus(); }, 100);
    };

    // 2. Função que abre as configurações (só chamada se a senha estiver certa)
    const openConfigModal = () => {
        const gamification = appData.gamification || {};
        const rules = gamification.rules || {
            xp_lead: 10, xp_call: 5, xp_schedule: 50, xp_visit: 100,
            xp_sale: 500, xp_task_sales: 25, xp_task_admin: 15
        };

        // Preenche os campos do modal grande
        const setVal = (id, val) => { if (getEl(id)) getEl(id).value = val; };

        setVal('rule-xp-lead', rules.xp_lead);
        setVal('rule-xp-call', rules.xp_call);
        setVal('rule-xp-schedule', rules.xp_schedule);
        setVal('rule-xp-visit', rules.xp_visit);
        setVal('rule-xp-sale', rules.xp_sale);
        setVal('rule-xp-task-sales', rules.xp_task_sales);
        setVal('rule-xp-task-admin', rules.xp_task_admin);

        // Mostra a senha atual no campo de alteração (para não esquecer)
        setVal('admin-password-input', gamification.adminPassword || "admin");

        openModal('admin-gamification-modal');
    };


    // 2. Inicializa o observador de autenticação
    initAuthObserver({
        onLogin: (user) => {
            currentUser = user;
            document.body.classList.remove('logged-out');
            document.body.classList.add('logged-in');

            if (authContainer) authContainer.classList.add('hidden');

            console.log("Usuário logado:", currentUser.uid);
            loadDataFromFirestore();
            setStore({ currentUser: user }); // Guarda o usuário no Cofre Global
        },


        onLogout: () => {
            currentUser = null;
            document.body.classList.remove('logged-in');
            document.body.classList.add('logged-out');

            if (authContainer) authContainer.classList.remove('hidden');
        }
    });

    // 3. Evento de Login simplificado
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        loginUser(email, password)
            .catch(error => {
                console.error("Erro de login:", error);
                authError.textContent = "Email ou senha inválidos.";
            });
    });

    // 4. Evento de Cadastro simplificado
    signupBtn.addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        registerUser(email, password)
            .catch(error => {
                console.error("Erro de cadastro:", error);
                authError.textContent = "Erro ao cadastrar. Verifique (min 6 chars).";
            });
    });

    // 5. Evento de Logout simplificado
    logoutBtn.addEventListener('click', () => {
        logoutUser().catch(err => console.error("Erro ao sair", err));
    });
    /* ---------- helpers que faltavam ---------- */
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    const setSmall = (id, text) => {
        const small = document.querySelector(`#${id} + p, #${id} ~ p`);
        if (small) small.textContent = text;
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

    // --- FUNÇÕES DE DADOS (COM ORDEM CORRIGIDA) ---
    // Nova versão no app.js
    // Nova versão no app.js
    const saveDataToFirestore = async () => {
        if (!currentUser) return;

        try {
            // O serviço saveCoreData já remove logs e historico internamente,
            // mas passamos appData direto.
            await saveCoreData(currentUser.uid, appData);
            console.log("Dados principais salvos!");

            // Nota: Logs e Histórico agora são salvos sob demanda nas funções específicas abaixo,
            // não precisamos iterar sobre todos eles aqui, economizando escritas.

        } catch (error) {
            console.error("Erro ao salvar:", error);
            showToast("Erro ao sincronizar com a nuvem.", 'error');
        }
    };

    const saveActivityToFirestore = async (activity) => {
        /*if (!currentUser) return;
        
        try {
            // Salva a atividade no documento principal
            const userDocRef = firebaseFunctions.doc(db, 'userData', currentUser.uid);
            const currentData = (await firebaseFunctions.getDoc(userDocRef)).data() || {};
            
            const activities = currentData.blocos_atividades || [];
            const index = activities.findIndex(a => a.id === activity.id);
            
            if (index >= 0) {
                activities[index] = activity;
            } else {
                activities.push(activity);
            }
            
            await firebaseFunctions.setDoc(userDocRef, { blocos_atividades: activities }, { merge: true });
            console.log("Atividade salva com sucesso!");
            
        } catch (error) {
            console.error("Erro ao salvar atividade:", error);
            showToast("Erro ao salvar atividade.", 'error');
        }*/
        console.warn("saveActivityToFirestore está desativada (isso é o esperado)");
        return; // Retorna imediatamente
    };

    // ==================================================================
    // FUNÇÃO: loadDataFromFirestore (Refatorada)
    // ==================================================================
    const loadDataFromFirestore = async () => {
        // 1. Verificação de segurança: Se não tem user, para tudo.
        if (!currentUser) return;

        // Referência para feedback visual (opcional, se tiver loader)
        console.log("Iniciando carregamento de dados...");

        try {
            // ----------------------------------------------------------------
            // PASSO A: Carregar dados da Nuvem (usando o novo serviço modular)
            // ----------------------------------------------------------------
            // 1. Carrega dados do perfil (Gamification, Configs, Logs, Histórico)
            const data = await fetchFullUserData(currentUser.uid);

            if (data.exists) {
                console.log("Dados encontrados na nuvem via serviço modular.");

                // 2. Carrega as Atividades da NOVA Sub-coleção (Busca Atômica)
                // Nota: O import já foi feito no topo do arquivo
                const atomicActivities = await fetchAtomicActivities(currentUser.uid);

                // 3. Monta o Objeto Completo (Store)
                const fullData = {
                    ...data.core, // Perfil, configurações, gamification

                    // LÓGICA DE MIGRAÇÃO:
                    // Se tiver atividades na sub-coleção (novo modelo), usa elas.
                    // Se não (usuário antigo que ainda não migrou), tenta pegar do antigo array no 'core'.
                    blocos_atividades: atomicActivities.length > 0 ? atomicActivities : (data.core.blocos_atividades || []),

                    dailyLogs: data.dailyLogs || {},
                    scheduleHistory: data.scheduleHistory || {}
                };

                // INICIALIZA O STORE COM TUDO DE UMA VEZ
                initStoreData(fullData);

                // 🔥 TRAVA DE SEGURANÇA: Reinjeta o usuário no Store
                setStore({ currentUser: currentUser });

                // 🔥 NOVO: Verifica virada de mês antes de carregar o modelo
                await ensureMonthlyReset();


                await loadModel();
            } else {
                // ... (código existente para novo usuário)
                console.log("Novo usuário. Usando estado inicial do Store.");
                // O Store já nasce com o initialState, então só salvamos ele no banco
                await saveDataToFirestore();
            }

            // ----------------------------------------------------------------
            // PASSO B: Validação e Limpeza de Dados em Memória
            // ----------------------------------------------------------------
            if (appData.blocos_atividades && Array.isArray(appData.blocos_atividades)) {
                // Reseta notificações para não disparar alertas antigos ao recarregar a página
                appData.blocos_atividades.forEach(a => a.notificationSent = false);

                // Garante que todos os campos obrigatórios existam (ex: IDs, cores)
                appData.blocos_atividades = validateActivityData(appData.blocos_atividades);
            }

            // ----------------------------------------------------------------
            // PASSO C: Merge Offline (Sincronização com IndexedDB)
            // ----------------------------------------------------------------
            // Busca dados que podem ter sido salvos offline enquanto estava sem internet
            try {
                const localActivities = await getAtividades(); // Função do db.js

                let hasLocalUpdates = false;

                localActivities.forEach(loc => {
                    const cloudIdx = appData.blocos_atividades.findIndex(a => a.id === loc.id);

                    // Se a atividade local não existe na nuvem, adiciona
                    if (cloudIdx === -1) {
                        appData.blocos_atividades.push(loc);
                        hasLocalUpdates = true;
                    }
                    // Se existe, vence a que tiver o 'updatedAt' mais recente
                    else if (loc.updatedAt > (appData.blocos_atividades[cloudIdx].updatedAt || 0)) {
                        appData.blocos_atividades[cloudIdx] = loc;
                        hasLocalUpdates = true;
                    }
                });

                // Se houve merge de dados locais mais novos, sincroniza de volta para o Firestore
                if (hasLocalUpdates) {
                    console.log("Sincronizando dados locais mais recentes para a nuvem...");
                    await saveCoreData(currentUser.uid, appData);
                }

            } catch (dbError) {
                console.warn("Erro ao acessar IndexedDB (modo offline pode estar indisponível):", dbError);
            }

            // ----------------------------------------------------------------
            // PASSO D: Lógica de "Novo Dia" (Reset com Auto-Arquivamento)
            // ----------------------------------------------------------------
            const todayKey = new Date().toISOString().split('T')[0];

            if (appData.lastActiveDate !== todayKey) {
                console.log("📅 Novo dia detectado!");

                // 1. ANTES DE RESETAR: Salva o histórico do dia anterior automaticamente
                // Se existia uma data ativa anterior e atividades nela
                if (appData.lastActiveDate && appData.blocos_atividades && appData.blocos_atividades.length > 0) {
                    console.log(`💾 Arquivando automaticamente o dia ${appData.lastActiveDate}...`);

                    if (!appData.scheduleHistory) appData.scheduleHistory = {};

                    // Cria um snapshot de como estava o dia antes de resetar
                    const snapshotOntem = JSON.parse(JSON.stringify(appData.blocos_atividades)).map(a => ({
                        ...a,
                        date: appData.lastActiveDate
                    }));

                    appData.scheduleHistory[appData.lastActiveDate] = snapshotOntem;

                    // Tenta salvar o histórico na nuvem imediatamente (subcoleção)
                    saveScheduleHistoryEntry(currentUser.uid, appData.lastActiveDate, snapshotOntem).catch(console.error);
                }

                // 2. AGORA SIM: Reseta os status para começar o dia novo limpo
                if (appData.blocos_atividades) {
                    appData.blocos_atividades.forEach(activity => {
                        activity.status = 'nao_iniciado';
                        activity.leads_contatados = 0;
                        activity.visitas_realizadas = 0;
                        activity.agendamentos_feitos = 0;
                        activity.observacoes = "";
                        activity.real_horario_inicio = null;
                        activity.real_horario_fim = null;
                        activity.notificationSent = false;
                    });
                }

                // 3. Atualiza a data e salva o Core
                appData.lastActiveDate = todayKey;
                await saveDataToFirestore();

                showToast("🌞 Bom dia! Histórico de ontem salvo e cronograma resetado.", "info");
            }

            // PASSO EXTRA: SANEAMENTO FINAL (A Vacina contra Undefined)
            // ================================================================
            // Antes de iniciar o app, garantimos que nenhum lixo do Offline/Merge
            // tenha sobrevivido. Removemos impiedosamente.
            if (appData.blocos_atividades && Array.isArray(appData.blocos_atividades)) {
                const countBefore = appData.blocos_atividades.length;

                appData.blocos_atividades = appData.blocos_atividades.filter(a => {
                    // Regras estritas para uma atividade existir
                    const temId = a.id && typeof a.id === 'number';
                    const temNome = a.nome && a.nome !== 'undefined' && String(a.nome).trim() !== '';
                    const temHorario = a.horario_inicio && a.horario_inicio !== 'undefined' && a.horario_inicio !== '--:--';

                    return temId && temNome && temHorario;
                });

                const countAfter = appData.blocos_atividades.length;

                // Se limpamos algo, salvamos imediatamente para corrigir o cache local e a nuvem
                if (countBefore !== countAfter) {
                    console.log(`🧹 Limpeza Automática no Login: ${countBefore - countAfter} itens removidos.`);
                    saveDataToFirestore(); // Salva a versão limpa na Nuvem
                    // Tenta atualizar o cache local se a função estiver disponível
                    if (typeof window.saveAndRerender === 'function') window.saveAndRerender();
                }
            }
            // ================================================================

            // ----------------------------------------------------------------
            // PASSO E: Inicialização da UI
            // ----------------------------------------------------------------
            // Só inicia o app visualmente depois de ter certeza que os dados estão carregados
            initApp();

            // 🔥 GAMIFICAÇÃO: Verifica Ofensiva
            checkDailyStreak();
            showToast('Bem-vindo(a) de volta! 🎉', 'success');

        } catch (error) {
            console.error("Erro CRÍTICO ao carregar dados:", error);

            // Tratamento específico de erros
            if (error.message && error.message.includes("permissions")) {
                showToast("Atenção: Permissões do Firestore bloqueadas.", "error");
            } else {
                showToast("Erro ao carregar dados. Verifique sua conexão.", "error");
            }

            // Em caso de falha total na nuvem, tenta iniciar com o que tem local (fallback)
            // initApp(); // Opcional: descomente se quiser forçar o app a abrir mesmo com erro
        }

        // Garante que a estrutura de gamificação exista, mesmo em usuários antigos
        if (!appData.gamification) {
            console.log("🎮 Inicializando gamificação para usuário existente...");
            appData.gamification = {
                xp: 0, level: 1, title: "Matriculador Iniciante",
                monthlyXP: 0, currentMonthKey: new Date().toISOString().slice(0, 7), monthlyTier: "Bronze",
                streak: 0, lastActionDate: null, achievements: []
            };
        }
    };


    let activePage = 'dashboard';
    let isEditMode = false;
    let charts = {};
    let confirmationCallback = null;
    let reportCategoryFilter = 'all';
    let reportSortConfig = { key: 'horario_inicio', direction: 'asc' };
    let activeReportType = 'summary';




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
        renderTodayActivities();  // agora é segura
        createPerformanceChart();
        updateTodaysLeadsMetric();
        // Renderiza o jogo (se existir)
        if (typeof renderGamificationWidget === 'function') {
            renderGamificationWidget();
        }
    };


    // =========================================================
    // ATUALIZAÇÃO DO DASHBOARD (Métricas de Ontem)
    // =========================================================
    const updateDashboardMetrics = () => {
        // 1. Seletores (Referências aos elementos HTML)
        const elLabel = getEl('dashboard-date-label');
        const elAtividades = getEl('dash-atividades');
        const elProgress = getEl('dash-progress-fill');

        // Cards de Métricas
        const elLeadsNovos = getEl('dash-leads-novos');
        const elLeadsContatados = getEl('dash-leads');
        const elAgendamentos = getEl('total-agendamentos'); // <--- NOVO: O card Teal que criamos
        const elVisitas = getEl('dash-visitas');
        const elMatriculas = getEl('dash-matriculas');

        if (!elLabel) return;

        // 2. DEFINIÇÃO DA DATA (Ontem)
        const getLocalKey = (dateObj) => {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayKey = getLocalKey(yesterday);

        // 3. RECUPERAÇÃO DE DADOS (Do Store)
        const histActivities = (appData.scheduleHistory && appData.scheduleHistory[yesterdayKey]) || [];
        const histLog = (appData.dailyLogs && appData.dailyLogs[yesterdayKey]) || {};

        // 4. CÁLCULO DAS MÉTRICAS

        // A) Progresso das Atividades
        const totalTasks = histActivities.length;
        const tasksDone = histActivities.filter(a => a.status === 'concluido').length;
        const percent = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

        // B) Funil de Vendas (Dados do Daily Log de ontem)
        const leadsNovosCount = parseInt(histLog.leads_novos || 0);

        // Leads Contatados (Maior valor entre manual e automático)
        const leadsManual = parseInt(histLog.ligacoes || 0);
        const leadsAuto = parseInt(histLog.leads_contatados || 0);
        const leadsContactedCount = Math.max(leadsManual, leadsAuto);

        // --- NOVO CÁLCULO: Agendamentos ---
        // Tenta pegar do Log Diário OU soma das atividades individuais de ontem
        const agendamentosLog = parseInt(histLog.agendamentos || 0);
        const agendamentosActivities = histActivities.reduce((acc, curr) => acc + (parseInt(curr.agendamentos_feitos) || 0), 0);
        // Usa o maior valor encontrado para garantir precisão
        const agendamentosCount = Math.max(agendamentosLog, agendamentosActivities);

        // Visitas e Matrículas
        const visitasCount = parseInt(histLog.visitas || histLog.visitas_realizadas || 0);
        const matriculasCount = parseInt(histLog.matriculas || 0);

        // 5. ATUALIZAÇÃO DA TELA
        elLabel.innerHTML = `🏁 Resultado de Ontem <small style="font-weight:400; color:#666">(${yesterday.toLocaleDateString('pt-BR')})</small>`;

        const animateValue = (element, value) => {
            if (element) {
                element.textContent = value;
                element.classList.remove('skeleton'); // Remove efeito de loading
            }
        };

        // Barra de Progresso e Texto
        animateValue(elAtividades, `${tasksDone}/${totalTasks}`);
        if (elProgress) elProgress.style.width = `${percent}%`;

        // Cards Coloridos
        animateValue(elLeadsNovos, leadsNovosCount);
        animateValue(elLeadsContatados, leadsContactedCount);
        animateValue(elAgendamentos, agendamentosCount); // <--- Atualiza o novo card
        animateValue(elVisitas, visitasCount);
        animateValue(elMatriculas, matriculasCount);
    };

    // No arquivo app.js

    // =========================================================
    // FUNÇÃO ALTERADA: Renderiza Atividades de ONTEM (Histórico)
    // =========================================================
    const renderTodayActivities = () => {
        const container = document.getElementById('today-activities-list');
        if (!container) return;

        // 1. CALCULA A DATA DE ONTEM (Formato YYYY-MM-DD)
        const date = new Date();
        date.setDate(date.getDate() - 1); // Subtrai 1 dia

        // Ajuste seguro para fuso horário local
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const yesterdayKey = `${year}-${month}-${day}`;
        const dateFormatted = date.toLocaleDateString('pt-BR'); // Para exibir no texto

        // 2. TENTA MUDAR O TÍTULO DA SEÇÃO (Visual)
        // Procura o título H3 logo antes da lista para avisar que é de Ontem
        const sectionTitle = container.previousElementSibling;
        if (sectionTitle && sectionTitle.tagName === 'H3') {
            sectionTitle.innerHTML = `Atividades do dia anerior <span style="font-size:0.7em; opacity:0.6; font-weight:400">(${dateFormatted})</span>`;
        }

        // 3. BUSCA OS DADOS NO HISTÓRICO
        // Se não tiver histórico de ontem, usa array vazio []
        const history = appData.scheduleHistory || {};
        let atividades = history[yesterdayKey];

        container.innerHTML = '';

        // 4. CENÁRIO: SEM DADOS
        if (!atividades || atividades.length === 0) {
            container.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; color: #94a3b8;">
                <span style="font-size: 2.5rem; display:block; margin-bottom:10px; opacity:0.5;">📅</span>
                <p style="margin:0; font-weight:500;">Nada gravado ontem.</p>
                <small style="font-size:0.8rem;">O histórico é salvo ao finalizar o dia.</small>
            </div>`;
            return;
        }

        // 5. ORDENAÇÃO E RENDERIZAÇÃO (Mantendo o visual novo)
        atividades.sort((a, b) => (a.horario_inicio || '').localeCompare(b.horario_inicio || ''));

        atividades.forEach(atv => {
            const inicio = atv.horario_inicio || '--:--';
            const fim = atv.horario_fim || '--:--';
            const nome = escapeHtml(atv.nome) || '(Sem nome)';
            const categoria = escapeHtml(atv.categoria) || 'Geral';
            const status = atv.status || 'nao_iniciado';

            // Formata o status para ficar bonito (Remove underline)
            const statusTexto = status.replace('_', ' ');

            const item = document.createElement('div');
            item.className = 'activity-list-item'; // Usa o CSS novo que criamos

            // Estrutura HTML compatível com o CSS moderno
            item.innerHTML = `
            <div class="activity-time-box">
                <span class="at-start">${inicio}</span>
                <span class="at-end">${fim}</span>
            </div>
            
            <div class="activity-info-box">
                <div class="at-name">${nome}</div>
                <div class="at-meta">
                    <span class="at-cat">${categoria}</span>
                </div>
            </div>

            <div class="activity-status-box">
                <span class="at-status ${status}">${statusTexto}</span>
            </div>
        `;
            container.appendChild(item);
        });
    };

    const createPerformanceChart = () => {
        const ctx = getEl('performance-chart')?.getContext('2d');
        if (!ctx) return;

        const labels = ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'Ontem', 'Hoje'];
        const data = labels.map(() => Math.floor(Math.random() * 50) + 50); // Mock data

        if (charts.performance) charts.performance.destroy();
        charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels, datasets: [{
                    label: 'Taxa de Conclusão (%)', data, borderColor: 'var(--color-brand)',
                    backgroundColor: 'rgba(var(--color-brand-500-rgb), 0.1)', fill: true, tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
            }
        });
    };




    const getFilteredActivities = () => {
        // --- PROTEÇÃO: Garante que é um array, senão usa array vazio []
        const activities = Array.isArray(appData.blocos_atividades) ? appData.blocos_atividades : [];
        const { scheduleStatusFilter } = appData;

        if (scheduleStatusFilter === 'all') {
            return activities;
        }
        return activities.filter(a => a.status === scheduleStatusFilter);
    };

    // No app.js


















    const initTemplates = () => {
        renderTemplates();
        renderCustomTemplates();
    };


    // No app.js

    const renderTemplates = () => {
        const grid = document.getElementById('templates-grid');
        if (!grid) return;

        // Usa o novo componente seguro
        renderTemplatesList(
            grid,
            appData.templates,
            false, // isCustom = false
            'Nenhum template padrão encontrado.'
        );
    };

    const renderCustomTemplates = () => {
        const container = document.getElementById('custom-templates-grid');
        if (!container) return;

        // Usa o novo componente seguro
        renderTemplatesList(
            container,
            appData.custom_templates,
            true, // isCustom = true
            'Salve o cronograma atual como um template para reutilizá-lo.'
        );
    };





    const saveCurrentAsTemplate = () => {
        const name = getEl('template-name').value;
        const desc = getEl('template-description').value;
        if (!name) { showToast('O nome do template é obrigatório.', 'error'); return; }

        const newTemplate = {
            id: Date.now(),
            nome: name,
            descricao: desc,
            atividades: appData.blocos_atividades.map(({ id, status, ...rest }) => rest)
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



    // ==================================================================
    // FUNÇÃO: archiveDaySchedule ("Finalizar Dia")
    // Salva o histórico do cronograma e gera backup
    // ==================================================================
    const archiveDaySchedule = () => {
        // Pega a data de hoje (AAAA-MM-DD)
        const todayKey = new Date().toISOString().split('T')[0];

        // Cria um snapshot (cópia profunda) das atividades atuais
        // Adiciona a propriedade 'date' em cada atividade para facilitar relatórios futuros
        const activitiesSnapshot = JSON.parse(JSON.stringify(appData.blocos_atividades)).map(a => ({
            ...a,
            date: todayKey
        }));

        // Verifica se já existe histórico para hoje para ajustar a mensagem
        const confirmationMessage = appData.scheduleHistory && appData.scheduleHistory[todayKey]
            ? `Você já salvou o cronograma de hoje. Deseja substituir pelo estado atual?`
            : `Isso salvará o estado final do cronograma de hoje para o histórico. Deseja continuar?`;

        showConfirmation('Arquivar Cronograma do Dia', confirmationMessage, async () => {
            if (!currentUser) return;

            if (appData.blocos_atividades.length === 0) {
                showToast('Não há atividades no cronograma para salvar.', 'warning');
                return;
            }

            if (!appData.scheduleHistory) {
                appData.scheduleHistory = {};
            }

            // 1. Salva localmente (estado da aplicação)
            appData.scheduleHistory[todayKey] = activitiesSnapshot;

            try {
                // 2. Salva na nuvem usando o SERVIÇO MODULAR
                // Isso salva apenas na subcoleção 'scheduleHistory', sem reescrever o doc inteiro
                await saveScheduleHistoryEntry(currentUser.uid, todayKey, activitiesSnapshot);

                // 3. Gera o arquivo JSON para download (Backup local físico)
                downloadObjectAsJson(activitiesSnapshot, `cronograma-${todayKey}.json`);

                showToast('Cronograma arquivado e download iniciado! 📥', 'success');

            } catch (error) {
                console.error("Erro ao salvar histórico de cronograma:", error);
                showToast('Erro ao salvar o histórico na nuvem.', 'error');
            }
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






    const updateSummaryCards = () => {
        const days = parseInt(getEl('period-select')?.value) || 7;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (days - 1));

        // Filtra dados históricos
        const historicalData = appData.scheduleHistory || {};
        const filteredDates = Object.keys(historicalData).filter(date => {
            const logDate = new Date(date + 'T00:00:00');
            return logDate >= startDate && logDate <= endDate;
        });

        const activities = filteredDates.flatMap(date => historicalData[date]);

        // Dados do log diário
        const hoje = new Date().toISOString().split('T')[0];
        const log = appData.dailyLogs[hoje] || {};
        const visitas = log.visitas || 0;
        const matriculas = log.matriculas || 0;

        // Métricas
        const totalAtividades = activities.length;
        const concluidas = activities.filter(a => a.status === 'concluido').length;
        const taxaConclusao = totalAtividades > 0 ? Math.round((concluidas / totalAtividades) * 100) : 0;

        const minutosProdutivos = activities
            .filter(a => a.status === 'concluido' && a.categoria !== 'Descanso')
            .reduce((sum, a) => sum + (a.duracao || 0), 0);
        const tempoInvestido = formatDuration(minutosProdutivos);

        // Atualiza DOM com verificação de segurança
        if (getEl('report-activities-count')) {
            setText('report-activities-count', totalAtividades);
            setSmall('report-activities-count', `Atividades Totais (${days} dias)`);
        }

        if (getEl('report-completion-rate')) {
            setText('report-completion-rate', taxaConclusao + '%');
        }

        if (getEl('report-productive-time')) {
            setText('report-productive-time', tempoInvestido);
        }

        if (getEl('report-leads-goal')) {
            const conv = visitas > 0 ? Math.round((matriculas / visitas) * 100) : 0;
            setText('report-leads-goal', matriculas);
            setSmall('report-leads-goal', `Matrículas Hoje (Conv: ${conv}%)`);
        }
    };








    // app.js





    // Usa a versão avançada que já funciona perfeitamente
    const renderAcompanhamentoReport = () => {
        if (typeof window.renderAcompanhamentoReportAdvanced === 'function') {
            window.renderAcompanhamentoReportAdvanced();
        }
    };
    // --- FUNÇÕES DE RENDERIZAÇÃO DE RELATÓRIO ---







    const renderMainReportChart = (type, data, options) => {
        const ctx = getEl('report-main-chart')?.getContext('2d');
        if (!ctx) return;
        if (charts.mainReport) charts.mainReport.destroy();
        charts.mainReport = new Chart(ctx, { type, data, options });
    };

    let draggedElement = null;


    // --------------------------------------------------
    //  SWIPE CARDS MOBILE-ONLY  (novo bloco)
    // --------------------------------------------------
    const SWIPE_THRESHOLD = 80;   // px
    const SWIPE_VELOCITY = 0.3;  // px/ms

    function initSwipeCards() {
        // só ativa em telas pequenas
        if (window.innerWidth > 768) return;
        const cards = document.querySelectorAll('.schedule-block');
        cards.forEach(card => {
            let startX = 0, startY = 0, startT = 0, currentX = 0;

            card.addEventListener('touchstart', e => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startT = Date.now();
                card.classList.add('dragging');
            }, { passive: true });

            card.addEventListener('touchmove', e => {
                currentX = e.touches[0].clientX - startX;
                card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.1}deg)`;
            }, { passive: true });

            card.addEventListener('touchend', e => {
                const deltaT = Date.now() - startT;
                const velocity = Math.abs(currentX) / deltaT;
                card.classList.remove('dragging');

                if (Math.abs(currentX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY) {
                    const direction = currentX > 0 ? 'right' : 'left';
                    onSwipe(card, direction);
                } else {
                    card.style.transform = '';
                }
            });
        });
    }

    function onSwipe(cardEl, dir) {
        const id = cardEl.dataset.id;
        const next = dir === 'right' ? 'concluido' : 'cancelado';

        cardEl.classList.add(dir === 'right' ? 'slideOutRight' : 'slideOutLeft');

        const activity = appData.blocos_atividades.find(a => a.id == id);
        if (activity) {
            activity.status = next;
            saveAndRerender();
            showToast(dir === 'right' ? 'Concluído 🎉' : 'Cancelado ❌', 'info');
        }

        cardEl.addEventListener('animationend', () => cardEl.remove(), { once: true });
    }
    // --------------------------------------------------

    const globalClickHandler = (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return; // <-- ADICIONE ESTA LINHA
        // Se o clique for no botão de login ou cadastro, não previne o default para permitir o submit do formulário.
        // O formulário de login tem seu próprio event listener com preventDefault.
        if (target && (target.id === 'login-btn' || target.id === 'signup-btn')) {
            // Permite que o evento de submit do formulário seja disparado
        } else if (target) {
            e.preventDefault();
        }
        const { action, id, custom, status, source, phaseIndex, scriptId, reportType, sortBy } = target.dataset;

        const actions = {
            'add-activity': () => openActivityModal(),
            'open-gamification-admin': startAdminAuth,
            'edit-activity': () => {
                // Busca a atividade usando o getter do Store via Proxy ou getStore() direto se importar
                // Como appData é um Proxy para getStore(), isso funciona:
                const activity = appData.blocos_atividades.find(a => a.id == id);
                openActivityModal(activity);
            },
            'delete-activity': () => deleteActivity(id),
            'duplicate-activity': () => duplicateActivity(id),
            'toggle-status': () => toggleActivityStatus(id),
            'filter-status': () => { appData.scheduleStatusFilter = status; saveDataToFirestore(); initSchedule(); },

            // Adicione esta linha dentro do objeto actions:
            'update-charts': () => {
                showToast('Atualizando dados...', 'info');
                renderEvolutionChart();
            },

            'set-report-source': () => {
                // 1. Atualiza o estado
                appData.reportSource = source;

                // 2. Salva e chama o módulo especializado
                saveDataToFirestore();

                // Chama a função principal do reports.js que gerencia a troca de telas
                initReports();
            },
            'set-report-type': () => setReportType(reportType),
            'export-weekly-report': () => {
                const success = generateAdvancedReportDoc('weekly');
                if (success) showToast('Relatório baixado!', 'success');
                else showToast('Dados insuficientes.', 'warning');
            },
            'export-roi-report': () => {
                const success = generateAdvancedReportDoc('roi');
                if (success) showToast('Relatório baixado!', 'success');
                else showToast('Dados insuficientes.', 'warning');
            },
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
                if (pre && pre.tagName === 'PRE') {
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
            'select-phase': () => selectPhase(phaseIndex),

            'add-phase': () => openPhaseModal(),
            'edit-phase': () => openPhaseModal(parseInt(phaseIndex)),
            'delete-phase': () => deletePhase(phaseIndex),

            'add-script': () => openScriptModal(parseInt(phaseIndex)),
            'edit-script': () => openScriptModal(parseInt(phaseIndex), parseInt(scriptId)),
            'delete-script': () => deleteScript(phaseIndex, scriptId),

            'copy-script': () => copyScriptToClipboard(target), // Passamos o botão alvo
            'export-data': exportData,
            'trigger-import': () => getEl('import-file-input').click(),
            'sort-report-table': () => toggleReportSort(sortBy),


        };

        if (actions[action]) {
            actions[action]();
        }
    };

    const initEventListeners = () => {
        // --- 1. Eventos Globais (Delegation para botões com data-action) ---
        document.body.addEventListener('click', globalClickHandler);

        // --- 2. Navegação (Sidebar) ---
        // --- 2. Navegação (Sidebar) ---
        // SUBSTITUÍDO PELO ROUTER
        // Inicializa o roteador
        const router = new Router();

        // Configura o callback de navegação
        router.onRoute((pageId) => {
            navigateTo(pageId);

            // Fecha a sidebar em mobile
            const sidebar = getEl('sidebar');
            if (sidebar && window.matchMedia('(max-width: 768px)').matches) {
                sidebar.classList.remove('open');
            }
        });

        router.init();

        const sidebarToggle = getEl('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => getEl('sidebar').classList.toggle('open'));
        }

        // 2. Listener do Botão de Funil
        const btnFunnel = document.getElementById('btn-generate-funnel');
        if (btnFunnel) {
            btnFunnel.addEventListener('click', generateMonthlyFunnel);
        }



        // --- 3. Formulários (Funções locais do app.js por enquanto) ---
        // --- 3. Formulários (Funções locais do app.js por enquanto) ---
        const formHandlers = {
            'activity-form': saveActivity,

            // --- ALTERAÇÃO AQUI: Lógica de XP para o Acompanhamento ---
            'daily-log-form': () => {
                // 1. Pega o log ANTIGO antes de salvar (para saber a diferença)
                const todayKey = new Date().toISOString().split('T')[0];
                const oldLog = (appData.dailyLogs && appData.dailyLogs[todayKey]) ? { ...appData.dailyLogs[todayKey] } : {};

                // 2. Salva o novo log (Função original)
                saveDailyLog();

                // 3. Pega o log NOVO que acabou de ser salvo no appData
                const newLog = appData.dailyLogs[todayKey];

                // 4. Calcula e aplica o XP (se a função existir)
                if (typeof processDailyLogXP === 'function') {
                    processDailyLogXP(newLog, oldLog);
                }
            },
            // -----------------------------------------------------------

            'template-form': saveCurrentAsTemplate,
            'script-form': saveScript,
            'phase-form': savePhase
        };

        Object.entries(formHandlers).forEach(([id, handler]) => {
            const form = getEl(id);
            if (form) {
                form.addEventListener('submit', e => {
                    e.preventDefault();
                    handler();
                });
            }
        });

        // --- 4. Funcionalidades do Cronograma (Importadas do Scheduler.js) ---
        const editBtn = getEl('edit-mode-btn');
        if (editBtn) editBtn.addEventListener('click', () => toggleEditMode(true));

        const viewBtn = getEl('view-mode-btn');
        if (viewBtn) viewBtn.addEventListener('click', () => toggleEditMode(false));

        // Seletor de Template (Correção aplicada aqui)
        const templateSelector = getEl('template-selector');
        if (templateSelector) {
            templateSelector.addEventListener('change', e => {
                if (!e.target.value) return;
                const [type, id] = e.target.value.split('-');

                // Chama a função importada passando ID e booleano para custom
                applyTemplate(id, type === 'cst');

                e.target.value = ''; // Reseta o select
            });
        }

        // --- 5. UI de Modais e Confirmação ---
        const confirmBtn = getEl('confirmation-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (confirmationCallback) confirmationCallback();
                closeModal('confirmation-modal');
            });
        }

        // Seleção de Ícone/Cor no Modal de Atividade
        const activityModal = getEl('activity-modal');
        if (activityModal) {
            activityModal.addEventListener('click', e => {
                const iconOption = e.target.closest('.icon-option');
                if (iconOption) {
                    queryAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
                    iconOption.classList.add('selected');
                }
                const colorOption = e.target.closest('.color-option');
                if (colorOption) {
                    queryAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                    colorOption.classList.add('selected');
                }
            });
        }

        // Atualização automática da duração ao mudar horário

        ['activity-start', 'activity-end'].forEach(id => {
            const el = getEl(id);
            if (el) el.addEventListener('change', updateDurationDisplay); // Usa a importada
        });

        // --- 6. Relatórios e Logs Diários ---
        const dateLogInput = getEl('daily-log-date');
        if (dateLogInput) {
            dateLogInput.addEventListener('change', e => renderDailyLogForm(e.target.value));
        }

        const periodSelect = getEl('period-select');
        if (periodSelect) {
            periodSelect.addEventListener('change', initReports);
        }

        const importInput = getEl('import-file-input');
        if (importInput) {
            importInput.addEventListener('change', importData);
        }

        // --- 7. Mobile FAB (Menu Flutuante) ---
        const mobileFab = getEl('mobile-menu-fab');
        if (mobileFab) {
            mobileFab.addEventListener('click', () => {
                const sb = getEl('sidebar');
                if (sb) sb.classList.toggle('open');
            });
        }

        const kanbanBtn = getEl('kanban-mode-btn');
        if (kanbanBtn) {
            kanbanBtn.addEventListener('click', () => {
                kanbanBtn.classList.toggle('active');

                if (kanbanBtn.classList.contains('active')) {
                    // Ativando Kanban
                    kanbanBtn.textContent = '📋 Lista';
                    appData.scheduleStatusFilter = 'all';

                    // Avisa a "memória" que agora é Kanban
                    setKanbanState(true); // <--- O SEGREDO ESTÁ AQUI

                    renderKanbanBoard();
                } else {
                    // Voltando para Lista
                    kanbanBtn.textContent = '📊 Kanban';

                    // Avisa a "memória" que agora é Lista
                    setKanbanState(false); // <--- O SEGREDO ESTÁ AQUI

                    const grid = document.getElementById('schedule-grid');
                    if (grid) {
                        grid.classList.remove('kanban-board');
                        grid.classList.add('schedule-grid');
                    }

                    initSchedule();
                }
            });
        }

        const adminForm = getEl('admin-gamification-form');
        if (adminForm) {
            adminForm.addEventListener('submit', (e) => {
                e.preventDefault();

                // 1. Coleta as Regras (Igual antes)
                const newRules = {
                    xp_lead: parseInt(getEl('rule-xp-lead').value) || 0,
                    // ... outros campos de XP ...
                    xp_task_admin: parseInt(getEl('rule-xp-task-admin').value) || 0,
                };

                // 2. Coleta a Nova Senha
                const newPassword = getEl('admin-password-input').value.trim();

                if (!newPassword) {
                    showToast("A senha não pode ser vazia.", "error");
                    return;
                }

                // 3. Atualiza tudo via serviço (Precisamos ajustar o serviço abaixo)
                // Vamos passar a senha junto para a função updateGamificationRules
                updateGamificationRules(newRules, newPassword);

                closeModal('admin-gamification-modal');
                showToast('Regras e senha atualizadas!', 'success');
            });
        }
        // --- NOVO: BOTÃO DE RESETAR FUNCIONÁRIO ---
        const btnReset = getEl('btn-reset-matriculador');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                resetMatriculadorProfile();
                closeModal('admin-gamification-modal');
            });
        }


        // Dentro de initEventListeners...

        const loginAdminForm = getEl('admin-login-form');
        if (loginAdminForm) {
            loginAdminForm.addEventListener('submit', async (e) => { // Note o async aqui
                e.preventDefault();

                const inputRaw = getEl('admin-login-input').value;
                const gamification = appData.gamification || {};

                // ATENÇÃO: Se for o primeiro acesso e não tiver hash, usa o hash padrão de "admin"
                // Hash de "admin" = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
                const storedHash = gamification.adminPasswordHash || "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

                const inputHash = await sha256(inputRaw);

                if (inputHash === storedHash) {
                    // SUCESSO!
                    closeModal('admin-login-modal');
                    openConfigModal();
                } else {
                    // ERRO
                    showToast("Acesso negado.", "error");
                    const inputEl = getEl('admin-login-input');
                    if (inputEl) {
                        inputEl.value = '';
                        inputEl.focus();
                    }
                }
            });
        }
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

        // Router will handle initial navigation
        // navigateTo('dashboard');

        updateClock();
        setInterval(updateClock, 30000); // O relógio visual pode ficar aqui ou num componente UI

        // --- SERVIÇO DE BACKGROUND ---
        startNotificationService();
        // Variável para guardar o evento de instalação
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            // Previne o Chrome de mostrar a barra automaticamente logo de cara
            e.preventDefault();
            // Guarda o evento para usar depois
            deferredPrompt = e;

            // Mostra um botão de instalar que você tenha criado no HTML (ex: id="install-btn")
            const installBtn = document.getElementById('install-btn');
            if (installBtn) {
                installBtn.classList.remove('hidden');
                installBtn.addEventListener('click', () => {
                    // Mostra o prompt nativo
                    deferredPrompt.prompt();
                    // Espera a escolha do usuário
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('Usuário aceitou instalar');
                        }
                        deferredPrompt = null;
                        installBtn.classList.add('hidden');
                    });
                });
            }
        });

        // No final do app.js ou initApp
        window.appData = appData; // Torna o estado acessível para o módulo
        window.saveAndRerender = saveAndRerender; // Torna o salvamento acessível
    };

    //loadDataFromFirestore();
    //initEventListeners();
    //initApp();
    // =========================================================
    // CORREÇÃO DA SESSÃO DE RELATÓRIOS
    // =========================================================




    // Correção do swipe (variável deltaX duplicada)
    const initSwipeNavigation = () => {
        const pageOrder = ['dashboard', 'cronograma', 'templates', 'leads', 'scripts', 'relatorios', 'configuracoes'];
        const mainContentEl = query('.main-content');

        let touchStartX = 0;
        let isScrolling = false;

        mainContentEl.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
            isScrolling = false;
        }, { passive: true });

        mainContentEl.addEventListener('touchmove', e => {
            if (isScrolling) return;
            const deltaY = Math.abs(e.changedTouches[0].screenY - e.changedTouches[0].screenY);
            const deltaX = Math.abs(touchStartX - e.changedTouches[0].screenX);
            if (deltaY > deltaX + 10) isScrolling = true;
        }, { passive: true });

        mainContentEl.addEventListener('touchend', e => {
            if (isScrolling) return;

            const touchEndX = e.changedTouches[0].screenX;
            const deltaX = touchEndX - touchStartX;
            const currentIndex = pageOrder.indexOf(activePage);

            if (Math.abs(deltaX) < 60) return;

            if (deltaX < -60 && currentIndex < pageOrder.length - 1) {
                navigateTo(pageOrder[currentIndex + 1]);
            } else if (deltaX > 60 && currentIndex > 0) {
                navigateTo(pageOrder[currentIndex - 1]);
            }
        }, { passive: true });
    };

    // --- SCRIPT DE MIGRAÇÃO (Cole no final do app.js) ---

    window.migrateDataToSubCollection = async () => {
        // 1. Pega o usuário do Store global (já que currentUser é local no app.js)
        const store = window.appData;
        const user = store ? store.currentUser : null;

        if (!user || !user.uid) {
            return console.error("❌ Erro: Usuário não logado. Faça login antes de migrar.");
        }

        console.log("🚀 Iniciando migração para:", user.uid);

        // 2. Pega as atividades antigas do Store
        const oldActivities = store.blocos_atividades || [];

        if (oldActivities.length === 0) {
            return console.log("⚠️ Nada para migrar. O array de atividades está vazio.");
        }

        // 3. Prepara o lote de gravação (Batch)
        // Nota: 'db' é importado do firebase-config.js no seu app.js, então ele existe no escopo
        const batch = writeBatch(db);
        let count = 0;

        oldActivities.forEach(act => {
            // Garante que o ID seja string
            const actId = String(act.id);

            // Cria referência na NOVA sub-coleção: userData -> uid -> activities -> id
            const ref = doc(db, 'userData', user.uid, 'activities', actId);

            // Adiciona ao lote
            batch.set(ref, act);
            count++;
        });

        // 4. Envia tudo para o Firestore
        try {
            await batch.commit();
            console.log(`✅ SUCESSO! ${count} atividades migradas.`);
            alert(`Sucesso! ${count} atividades foram movidas para a nova estrutura.`);
        } catch (error) {
            console.error("❌ Erro durante a migração:", error);
            alert("Erro ao migrar. Veja o console (F12) para detalhes.");
        }
    };


    // Inicializações finais (na ordem correta)
    loadDataFromFirestore();
    initEventListeners();
    //initSwipeNavigation();
    //initApp();

});


// --- FIM DO ARQUIVO APP.JS ---