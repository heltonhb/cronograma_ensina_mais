// js/modules/scheduler.js
import { getStore, setStore } from '../core/store.js';
// ADICIONE ESTE IMPORT:
import { saveActivityAtomic, updateActivityStatusAtomic } from '../services/firestore.js'; // Importe a função nova
import { auth } from '../../firebase-config.js'; // Para pegar o UID do usuário
import { generateUniqueId, calculateDuration, formatDuration } from '../core/utils.js';
import { renderScheduleGrid } from '../components/ScheduleGrid.js';
import { addAtividade, updateAtividade, deleteAtividade } from '../db.js';
import { queueChange } from '../offline.js';
import { predictConversion, calculateLeadScore } from '../services/ai.js';
import { showToast } from '../components/Toast.js';
import { addXP, processActivityXP, processDailyLogXP } from '../services/gamification.js';
// No topo do scheduler.js, junto com os outros imports:
import { updateDashboardMetrics } from './dashboard.js'; // Ajuste o caminho se necessário

// Variáveis locais
let isEditMode = false;
let draggedElement = null;
let isKanbanView = false; // <--- ADICIONE ESTA VARIÁVEL


// 1. POPULATE SELECTOR
const populateTemplateSelector = () => {
    const selector = document.getElementById('template-selector');
    if (!selector) return;
    selector.innerHTML = '<option value="">Aplicar Template</option>';
    const { templates, custom_templates } = getStore();

    if (templates?.length) {
        templates.forEach(t => {
            const opt = document.createElement('option');
            opt.value = `std-${t.id}`;
            opt.textContent = t.nome;
            selector.appendChild(opt);
        });
    }
    if (custom_templates?.length) {
        custom_templates.forEach(t => {
            const opt = document.createElement('option');
            opt.value = `cst-${t.id}`;
            opt.textContent = `[Meu] ${t.nome}`;
            selector.appendChild(opt);
        });
    }
};

// 2. APPLY TEMPLATE
export const applyTemplate = async (idStr, isCustomStr) => {
    const id = parseInt(idStr);
    const isCustom = isCustomStr === 'true' || isCustomStr === true;
    const { templates, custom_templates } = getStore();

    const templateSource = isCustom ? custom_templates : templates;
    const template = templateSource.find(t => t.id === id);

    if (!template) return console.error("Template não encontrado");

    if (window.confirm(`Substituir cronograma pelo template "${template.nome}"?`)) {
        let currentActivities = [];
        const newActivities = template.atividades.map(a => {
            const newActivity = {
                ...a,
                id: generateUniqueId(currentActivities),
                status: 'nao_iniciado',
                leads_contatados: 0, visitas_realizadas: 0, agendamentos_feitos: 0,
                observacoes: '',
                duracao: calculateDuration(a.horario_inicio, a.horario_fim)
            };
            currentActivities.push(newActivity);
            return newActivity;
        });

        setStore({ blocos_atividades: newActivities, activeTemplateName: template.nome });
        renderScheduleBlocks();
        showToast(`Template "${template.nome}" aplicado!`);
    }
};

// 3. INIT SCHEDULE
// 3. INIT SCHEDULE (Versão Corrigida)
export const initSchedule = () => {
    const { activeTemplateName } = getStore();
    const display = document.getElementById('active-template-display');
    if (display) {
        display.textContent = activeTemplateName ? `Template Ativo: ${activeTemplateName}` : '';
        display.classList.toggle('hidden', !activeTemplateName);
    }

    populateTemplateSelector();
    renderFilterButtons();

    // --- LÓGICA DE DECISÃO DE VISUALIZAÇÃO ---
    if (isKanbanView) {
        // Se a "memória" diz que é Kanban, renderiza Kanban
        renderKanbanBoard();

        // Garante que o botão no app.js fique com estilo ativo (opcional, mas bom para UX)
        const btn = document.getElementById('kanban-mode-btn');
        if (btn) {
            btn.classList.add('active');
            btn.textContent = '📋 Lista';
        }
    } else {
        // Senão, renderiza a lista padrão
        renderScheduleBlocks();
    }
    // ------------------------------------------

    initDragAndDrop();
};

// --- RENDERIZAÇÃO DA LISTA (VERSÃO BLINDADA) ---
export const renderScheduleBlocks = () => {
    const container = document.getElementById('schedule-grid');
    if (!container) return;

    // Garante que a classe de grid esteja correta (remove a do Kanban)
    container.classList.remove('kanban-board');
    container.classList.add('schedule-grid');

    const { blocos_atividades, scheduleStatusFilter } = getStore();

    let activities = Array.isArray(blocos_atividades) ? blocos_atividades : [];

    // 1. Aplica o Filtro de Status (Todos, Em Andamento, etc)
    if (scheduleStatusFilter !== 'all') {
        activities = activities.filter(a => a.status === scheduleStatusFilter);
    }

    // 2. FILTRO DE SEGURANÇA MÁXIMA (IGUAL AO KANBAN)
    // Remove impiedosamente qualquer atividade lixo
    activities = activities.filter(a => {
        // Verifica se existe o objeto
        if (!a) return false;

        // Verifica ID e Nome
        if (!a.id || !a.nome || a.nome === 'undefined' || a.nome.trim() === '') return false;

        // Verifica Horário (deve ser string válida e não o placeholder)
        if (!a.horario_inicio || typeof a.horario_inicio !== 'string' || a.horario_inicio === '--:--') return false;

        return true;
    });

    // 3. Renderiza usando o componente visual
    renderScheduleGrid(container, activities, isEditMode);
};
const renderFilterButtons = () => {
    const { scheduleStatusFilter } = getStore();
    document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
        const isActive = btn.dataset.status === scheduleStatusFilter;
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('btn--primary', isActive);
        btn.classList.toggle('btn--secondary', !isActive);
    });
};

// --- ACTIONS ---
export const toggleEditMode = (enable) => {
    isEditMode = enable;
    document.getElementById('edit-mode-btn').classList.toggle('hidden', enable);
    document.getElementById('view-mode-btn').classList.toggle('hidden', !enable);
    document.getElementById('schedule-grid').classList.toggle('edit-mode-active', enable);
    renderScheduleBlocks();
};

export const deleteActivity = async (id) => {
    const numericId = parseInt(id, 10);
    const { blocos_atividades } = getStore();
    const newActivities = blocos_atividades.filter(a => a.id !== numericId);

    setStore({ blocos_atividades: newActivities }); // UI Update Instantâneo

    try {
        await deleteAtividade(numericId);
        await queueChange('delete', { id: numericId });
    } catch (e) { console.error(e); }

    renderScheduleBlocks();
};

export const duplicateActivity = async (id) => {
    const numericId = parseInt(id, 10);
    const { blocos_atividades } = getStore();
    const original = blocos_atividades.find(a => a.id === numericId);
    if (!original) return;

    const newActivity = {
        ...original,
        id: generateUniqueId(blocos_atividades),
        nome: `${original.nome} (Cópia)`
    };

    const newList = [...blocos_atividades, newActivity];
    setStore({ blocos_atividades: newList });

    try {
        await addAtividade(newActivity);
        await queueChange('create', newActivity);
    } catch (e) { console.error(e); }

    renderScheduleBlocks();
};

// ✅ Adicionado 'export' e corrigido o acesso aos dados (getStore/auth)
export const toggleActivityStatus = async (id) => {
    // 1. Pega os dados corretamente do Store (appData não existe aqui)
    const { blocos_atividades } = getStore();
    const activity = blocos_atividades.find(a => a.id == id);

    if (!activity) return;

    // Lógica de rotação de status
    const statusMap = { 'nao_iniciado': 'em_andamento', 'em_andamento': 'concluido', 'concluido': 'nao_iniciado' };
    const nextStatus = statusMap[activity.status] || 'nao_iniciado';

    // 2. Atualiza Local
    activity.status = nextStatus;

    // 3. Atualiza Remoto (Atômico)
    // Usa auth.currentUser (importado lá em cima) em vez de variável global
    if (auth.currentUser) {
        updateActivityStatusAtomic(auth.currentUser.uid, activity.id, nextStatus);
    }

    // 4. Renderiza apenas a tela
    initSchedule();

    updateDashboardMetrics(); // ⚠️ Comentei pois essa função não está importada neste arquivo
};

// --- DRAG AND DROP ---
const initDragAndDrop = () => {
    const container = document.getElementById('schedule-grid');
    if (!container) return;

    container.addEventListener('dragstart', e => {
        if (!container.classList.contains('edit-mode-active') || !e.target.classList.contains('schedule-block')) return;
        draggedElement = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    });

    container.addEventListener('dragend', e => {
        if (!draggedElement) return;
        draggedElement.classList.remove('dragging');
        document.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
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

        document.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
        const placeholder = document.createElement('div');
        placeholder.className = 'drag-placeholder';
        if (afterElement == null) container.appendChild(placeholder);
        else container.insertBefore(placeholder, afterElement);
    });

    // Drop Logic
    container.addEventListener('drop', async e => {
        e.preventDefault();
        if (!draggedElement) return;
        const placeholder = document.querySelector('.drag-placeholder');
        if (!placeholder) return;

        const { blocos_atividades } = getStore();
        const newList = [...blocos_atividades];
        const draggedId = parseInt(draggedElement.dataset.id);
        const draggedIndex = newList.findIndex(a => a.id === draggedId);
        if (draggedIndex === -1) return;

        const [draggedActivity] = newList.splice(draggedIndex, 1);
        const children = [...container.children];
        const placeholderIndex = children.indexOf(placeholder);
        const newIndex = placeholderIndex === 0 ? 0 :
            (children[placeholderIndex - 1].classList.contains('schedule-block')
                ? placeholderIndex : placeholderIndex - 1);

        newList.splice(newIndex, 0, draggedActivity);
        newList.forEach((act, i) => { act.orderIndex = i; act.updatedAt = Date.now(); });

        setStore({ blocos_atividades: newList, activeTemplateName: "Cronograma Personalizado" });

        try {
            await Promise.all(newList.map(act => updateAtividade(act.id, act)));
            await queueChange('reorder_schedule', { activities: newList.map(({ id, orderIndex }) => ({ id, orderIndex })) });
        } catch (err) { console.error(err); }

        document.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
        draggedElement.classList.remove('dragging');
        draggedElement = null;

        renderScheduleBlocks();
    });
};

// --- MODAL HELPERS ---
const renderIconSelector = (selectedIcon) => {
    const container = document.getElementById('icon-selector');
    if (!container) return;
    const { icones_disponiveis } = getStore();
    const frag = document.createDocumentFragment();

    icones_disponiveis.forEach(icon => {
        const div = document.createElement('div');
        div.className = `icon-option ${icon === selectedIcon ? 'selected' : ''}`;
        div.dataset.icon = icon;
        div.textContent = icon;
        frag.appendChild(div);
    });
    container.replaceChildren(frag);
};

const renderColorSelector = (selectedColor) => {
    const container = document.getElementById('color-selector');
    if (!container) return;
    const { cores_disponiveis } = getStore();
    const frag = document.createDocumentFragment();

    cores_disponiveis.forEach(color => {
        const div = document.createElement('div');
        div.className = `color-option ${color === selectedColor ? 'selected' : ''}`;
        div.dataset.color = color;
        div.style.backgroundColor = color;
        frag.appendChild(div);
    });
    container.replaceChildren(frag);
};

export const updateDurationDisplay = () => {
    const start = document.getElementById('activity-start').value;
    const end = document.getElementById('activity-end').value;
    const durationInput = document.getElementById('activity-duration');
    if (start && end && durationInput) durationInput.value = formatDuration(calculateDuration(start, end));
};

// --- MODAL ACTIONS ---
export const openActivityModal = (activity = null) => {
    const form = document.getElementById('activity-form');
    if (!form) return;
    form.reset();

    const store = getStore();
    const { blocos_atividades, icones_disponiveis, cores_disponiveis, colaboradores } = store;

    document.getElementById('activity-modal-title').textContent = activity ? 'Editar Atividade' : 'Nova Atividade';
    document.getElementById('activity-id').value = activity?.id || '';

    if (activity) {
        document.getElementById('activity-name').value = activity.nome || '';
        document.getElementById('activity-start').value = activity.horario_inicio || '';
        document.getElementById('activity-end').value = activity.horario_fim || '';
        document.getElementById('activity-description').value = activity.descricao || '';
        document.getElementById('activity-category').value = activity.categoria || '';
        document.getElementById('activity-priority').value = activity.prioridade || '';
        document.getElementById('activity-type').value = activity.tipo || '';
        document.getElementById('activity-status').value = activity.status || 'nao_iniciado';
        document.getElementById('activity-meta-leads').value = activity.meta_leads || 0;
        document.getElementById('activity-meta-visits').value = activity.meta_visitas || 0;
        document.getElementById('activity-contacted-leads').value = activity.leads_contatados || 0;
        document.getElementById('activity-realized-visits').value = activity.visitas_realizadas || 0;
        document.getElementById('activity-schedules-made').value = activity.agendamentos_feitos || 0;
        document.getElementById('activity-observations').value = activity.observacoes || '';
    } else {
        const last = [...blocos_atividades].filter(a => a?.horario_fim).sort((a, b) => b.horario_fim.localeCompare(a.horario_fim))[0];
        if (last) {
            document.getElementById('activity-start').value = last.horario_fim;
            const [h, m] = last.horario_fim.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) {
                const end = new Date(0, 0, 0, h, m + 60);
                document.getElementById('activity-end').value = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
            }
        }
    }

    renderIconSelector(activity?.icone || icones_disponiveis[0]);
    renderColorSelector(activity?.cor || cores_disponiveis[0]);
    updateDurationDisplay();

    // Participantes
    const pContainer = document.getElementById('activity-participants-list');
    if (pContainer && colaboradores) {
        pContainer.innerHTML = colaboradores.map(c =>
            `<div class="checkbox-wrapper">
                <input type="checkbox" id="part-${c}" name="participant" value="${c}" ${activity?.participantes?.includes(c) ? 'checked' : ''}>
                <label for="part-${c}">${c}</label>
            </div>`
        ).join('');
    }

    // Botão IA
    const modalFooter = document.getElementById('activity-modal').querySelector('.modal__footer');
    modalFooter.querySelectorAll('button.btn--secondary').forEach(b => {
        if (b.textContent.includes('Prever') || b.textContent.includes('Calcular')) b.remove();
    });
    const predictBtn = document.createElement('button');
    predictBtn.type = 'button';
    predictBtn.className = 'btn btn--secondary';
    predictBtn.style.marginTop = '10px';
    predictBtn.style.width = '100%';
    predictBtn.textContent = '🔮 Calcular Probabilidade Real';
    predictBtn.onclick = async () => {
        const features = {
            leadsContatados: parseInt(document.getElementById('activity-contacted-leads').value) || 0,
            visitasRealizadas: parseInt(document.getElementById('activity-realized-visits').value) || 0,
            followUps: parseInt(document.getElementById('activity-schedules-made').value) || 0,
            horario: parseInt(document.getElementById('activity-start').value.split(':')[0]),
            diaSemana: new Date().getDay()
        };
        const prediction = predictConversion(features, store.dailyLogs);
        showToast(`Chance: ${prediction.probability}% – ${prediction.explanation}`, 'info');
    };
    modalFooter.prepend(predictBtn);

    document.getElementById('activity-duplicate').style.display = activity ? 'inline-flex' : 'none';
    document.getElementById('activity-modal').classList.remove('hidden');
};

export const saveActivity = async () => {
    const idInput = document.getElementById('activity-id').value;
    const id = idInput ? parseInt(idInput) : null;
    const startTime = document.getElementById('activity-start').value;
    const endTime = document.getElementById('activity-end').value;

    const participantes = Array.from(document.querySelectorAll('input[name="participant"]:checked')).map(c => c.value);

    // 1. Monta o Objeto da Atividade
    const activityData = {
        nome: document.getElementById('activity-name').value,
        horario_inicio: startTime,
        horario_fim: endTime,
        descricao: document.getElementById('activity-description').value,
        categoria: document.getElementById('activity-category').value,
        prioridade: document.getElementById('activity-priority').value,
        tipo: document.getElementById('activity-type').value,
        status: document.getElementById('activity-status').value,
        meta_leads: parseInt(document.getElementById('activity-meta-leads').value) || 0,
        meta_visitas: parseInt(document.getElementById('activity-meta-visits').value) || 0,
        leads_contatados: parseInt(document.getElementById('activity-contacted-leads').value) || 0,
        visitas_realizadas: parseInt(document.getElementById('activity-realized-visits').value) || 0,
        agendamentos_feitos: parseInt(document.getElementById('activity-schedules-made').value) || 0,
        observacoes: document.getElementById('activity-observations').value,
        participantes,
        icone: document.querySelector('.icon-option.selected')?.dataset.icon || '📋',
        cor: document.querySelector('.color-option.selected')?.dataset.color || '#4285f4',
        duracao: calculateDuration(startTime, endTime),
        updatedAt: new Date().toISOString() // Data ISO é melhor para o Firestore
    };

    const { blocos_atividades } = getStore();
    let newList = [...blocos_atividades];
    let finalActivity = null;

    // 2. Atualiza o Estado Local (Store) para Feedback Imediato
    if (id !== null) {
        // EDIÇÃO
        const index = newList.findIndex(a => a.id === id);
        if (index > -1) {
            // Preserva contagem de interrupções se existir
            if (newList[index].status === 'em_andamento' && activityData.status === 'pausado') {
                activityData.interruption_count = (newList[index].interruption_count || 0) + 1;
            }
            finalActivity = { ...newList[index], ...activityData, id };
            newList[index] = finalActivity;
        }
    } else {
        // CRIAÇÃO
        activityData.id = generateUniqueId(blocos_atividades); // Gera ID numérico
        activityData.interruption_count = 0;
        finalActivity = activityData;
        newList.push(finalActivity);
    }

    if (!finalActivity) return; // Erro de segurança

    // Salva no Store e fecha modal
    setStore({ blocos_atividades: newList });
    if (!id) setStore({ activeTemplateName: "Cronograma Personalizado" });

    document.getElementById('activity-modal').classList.add('hidden');
    renderScheduleBlocks(); // Atualiza UI
    showToast(id ? 'Atividade atualizada!' : 'Atividade criada!');

    // 3. PERSISTÊNCIA (HÍBRIDA: LOCAL + NUVEM ATÔMICA)

    // A) Salva no IndexedDB (Offline Backup)
    try {
        if (id) {
            await updateAtividade(finalActivity.id, finalActivity);
        } else {
            await addAtividade(finalActivity);
        }
    } catch (e) {
        console.warn("Erro ao salvar no cache local:", e);
    }

    // B) Salva na Nuvem (Atômico)
    const currentUser = auth.currentUser;
    if (currentUser) {
        try {
            await saveActivityAtomic(currentUser.uid, finalActivity);
            console.log("Salvo na nuvem via método atômico!");
        } catch (error) {
            console.error("Erro ao salvar na nuvem:", error);
            showToast("Salvo apenas localmente (Erro de Rede)", "warning");
            // Aqui você pode manter o queueChange antigo como fallback se quiser
            await queueChange(id ? 'update' : 'create', finalActivity);
        }
    } else {
        console.log("Usuário offline/não logado. Enfileirando...");
        await queueChange(id ? 'update' : 'create', finalActivity);
    }
};

// Substitua a função renderKanbanBoard atual por esta versão corrigida:

// Substitua a função renderKanbanBoard por esta versão BLINDADA:

export const renderKanbanBoard = () => {
    const container = document.getElementById('schedule-grid');
    if (!container) return;

    // 1. Limpeza e Preparação Visual
    container.innerHTML = '';
    container.className = 'kanban-board';
    container.classList.remove('schedule-grid');

    // 2. Definição das Colunas
    const columns = [
        { id: 'nao_iniciado', label: 'A Fazer' },
        { id: 'em_andamento', label: 'Em Andamento' },
        { id: 'pausado', label: 'Aguardando' },
        { id: 'concluido', label: 'Concluído' },
        { id: 'cancelado', label: 'Cancelado' }
    ];

    // 3. Obtém dados brutos
    const { blocos_atividades } = getStore();
    let activities = Array.isArray(blocos_atividades) ? blocos_atividades : [];

    // =================================================================
    // 🛡️ FILTRO DE SEGURANÇA MÁXIMA (O MESMO DA LISTA)
    // =================================================================
    activities = activities.filter(a => {
        // Verifica se o objeto existe
        if (!a) return false;

        // Verifica se tem ID válido
        if (!a.id) return false;

        // Verifica se o NOME é válido e não é a palavra "undefined"
        if (!a.nome || a.nome === 'undefined' || String(a.nome).trim() === '') return false;

        // Verifica se tem HORÁRIO e não é o placeholder "--:--"
        if (!a.horario_inicio || a.horario_inicio === 'undefined' || a.horario_inicio === '--:--') return false;

        return true;
    });
    // =================================================================

    // 4. Renderização das Colunas
    columns.forEach(col => {
        const colActivities = activities.filter(a => {
            const statusReal = a.status || 'nao_iniciado';
            return statusReal === col.id;
        });

        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.dataset.status = col.id;

        colEl.innerHTML = `
            <div class="kanban-column-header">
                <span>${col.label}</span>
                <span class="kanban-count">${colActivities.length}</span>
            </div>
            <div class="kanban-column-body" id="col-body-${col.id}"></div>
        `;

        const bodyEl = colEl.querySelector('.kanban-column-body');

        // Listeners de Drop
        bodyEl.addEventListener('dragover', handleKanbanDragOver); // Verifique se essas funções existem no final do seu arquivo
        bodyEl.addEventListener('dragleave', handleKanbanDragLeave);
        bodyEl.addEventListener('drop', handleKanbanDrop);

        // Renderiza os Cards
        colActivities.forEach(act => {
            const card = createKanbanCard(act); // Verifique se createKanbanCard está no arquivo
            bodyEl.appendChild(card);
        });

        container.appendChild(colEl);
    });
};

// Substitua a função createKanbanCard existente por esta:

const createKanbanCard = (activity) => {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.id = activity.id;
    card.dataset.status = activity.status; // Importante para saber onde ele está

    // Define qual o próximo status lógico (para o botão de avançar)
    const statusOrder = ['nao_iniciado', 'em_andamento', 'concluido'];
    const currentIdx = statusOrder.indexOf(activity.status);
    const isFinal = currentIdx === statusOrder.length - 1;
    const nextStatus = isFinal ? null : statusOrder[currentIdx + 1];

    // Ícone do botão: Setinha para direita (ou Check se for concluir)
    const btnIcon = nextStatus === 'concluido' ? '✅' : '➡️';

    // AI Score Calculation
    const { score, color: scoreColor, label: scoreLabel } = calculateLeadScore(activity);

    card.innerHTML = `
        ${nextStatus ? `<button class="mobile-move-btn" title="Mover para ${nextStatus.replace('_', ' ')}">${btnIcon}</button>` : ''}
        
        <div style="position: absolute; top: -5px; right: -5px; background: ${scoreColor}; color: white; font-size: 0.6em; padding: 2px 6px; border-radius: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            ${score}
        </div>

        <div class="k-card-header">
            <span>${activity.horario_inicio || '--:--'}</span>
            <span style="background:${activity.cor || '#ccc'}; width:8px; height:8px; border-radius:50%; display:inline-block;"></span>
        </div>
        <div class="k-card-title">${activity.nome}</div>
        <div class="k-card-footer">
            <span>${activity.categoria || 'Geral'}</span>
            <span title="Duração">${activity.duracao || 0}m</span>
        </div>
    `;

    // Listeners do Card (Drag & Drop Desktop)
    card.addEventListener('dragstart', handleKanbanDragStart);
    card.addEventListener('dragend', handleKanbanDragEnd);

    // Listener do Clique no Card (Abrir Edição)
    card.addEventListener('click', (e) => {
        // Se clicou no botão mobile, NÃO abre o modal, executa a ação de mover
        if (e.target.closest('.mobile-move-btn')) {
            e.stopPropagation(); // Impede abrir o modal
            moveCardMobile(activity.id, nextStatus); // Função nova abaixo
        } else {
            openActivityModal(activity);
        }
    });

    return card;
};

const moveCardMobile = async (id, newStatus) => {
    if (!id || !newStatus) return;

    const { blocos_atividades } = getStore();
    const index = blocos_atividades.findIndex(a => a.id === parseInt(id));

    if (index > -1) {
        const activity = { ...blocos_atividades[index] };
        activity.status = newStatus;

        // Gamificação
        if (newStatus === 'concluido') {
            if (typeof processActivityXP === 'function') processActivityXP(activity);
            showToast('Tarefa Concluída! 🎉', 'success');
        }

        // Atualiza Store e Banco
        const newList = [...blocos_atividades];
        newList[index] = activity;
        setStore({ blocos_atividades: newList });

        try {
            await updateAtividade(activity.id, activity);
            await queueChange('update', { id: activity.id, status: newStatus });
        } catch (err) { console.error(err); }

        // Redesenha o Kanban
        renderKanbanBoard();
    }
};

// --- HANDLERS DO KANBAN ---

let kanbanDraggedItem = null;

function handleKanbanDragStart(e) {
    kanbanDraggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
    setTimeout(() => this.classList.add('dragging'), 0);
}

function handleKanbanDragEnd(e) {
    this.classList.remove('dragging');
    kanbanDraggedItem = null;
    document.querySelectorAll('.kanban-column-body').forEach(col => col.classList.remove('drag-over'));
}

function handleKanbanDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleKanbanDragLeave(e) {
    this.classList.remove('drag-over');
}

// A FUNÇÃO PRINCIPAL DE DROP E PONTOS
async function handleKanbanDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const activityId = parseInt(e.dataTransfer.getData('text/plain'));
    const newStatus = this.parentElement.dataset.status; // Pega status da coluna pai

    if (!activityId || !newStatus) return;

    const { blocos_atividades } = getStore();
    const activityIndex = blocos_atividades.findIndex(a => a.id === activityId);

    if (activityIndex > -1) {
        const activity = { ...blocos_atividades[activityIndex] };

        // Se status for igual, ignora
        if (activity.status === newStatus) return;

        // Atualiza status
        activity.status = newStatus;

        // --- GAMIFICAÇÃO (PONTOS) ---
        if (newStatus === 'concluido') {
            processActivityXP(activity); // <--- Chama a função importada
            showToast('Tarefa Concluída! +XP', 'success');
        }
        // ---------------------------

        // Salva no Store
        const newList = [...blocos_atividades];
        newList[activityIndex] = activity;
        setStore({ blocos_atividades: newList });

        // Salva no Banco
        try {
            await updateAtividade(activity.id, activity);
            await queueChange('update', { id: activity.id, status: newStatus });
        } catch (err) { console.error(err); }

        // Redesenha
        renderKanbanBoard();
    }
}
// Função para controlar a visualização externamente
export const setKanbanState = (isActive) => {
    isKanbanView = isActive;
};