// js/components/ScheduleGrid.js
import { el } from '../utils/dom.js';
import { escapeHtml } from '../core/utils.js';

// Função auxiliar para formatar métricas (ex: "5/10")
const formatMetric = (current, meta) => (meta > 0 ? `${current}/${meta}` : current);

// Função auxiliar para renderizar status
const getStatusText = (status) => ({
    'concluido': 'Concluído', 'em_andamento': 'Em Andamento',
    'nao_iniciado': 'Não Iniciado', 'pausado': 'Pausado', 'cancelado': 'Cancelado'
})[status] || status;

/**
 * Renderiza um único cartão de atividade.
 */
const renderCard = (activity, isEditMode) => {
    // Preparação de dados
    const metaLeads = formatMetric(activity.leads_contatados || 0, activity.meta_leads || 0);
    const metaVisits = formatMetric(activity.visitas_realizadas || 0, activity.meta_visitas || 0);

    // Constrói o cartão usando o helper 'el'
    return el('div', {
        className: `schedule-block ${isEditMode ? 'edit-mode' : ''}`,
        draggable: isEditMode, // Só arrasta se estiver editando
        dataset: { id: activity.id },
        style: { borderLeftColor: activity.cor }
    },
        // Cabeçalho
        el('div', { className: 'schedule-block__header' },
            el('h3', { className: 'schedule-block__title' },
                el('span', { className: 'schedule-block__icon' }, activity.icone),
                el('span', { className: 'editable', dataset: { field: 'nome' } }, activity.nome)
            ),
            el('div', { className: 'schedule-block__actions' },
                el('button', { className: 'schedule-block__action', title: 'Editar', dataset: { action: 'edit-activity', id: activity.id } }, '✏️'),
                el('button', { className: 'schedule-block__action', title: 'Duplicar', dataset: { action: 'duplicate-activity', id: activity.id } }, '🔄'),
                el('button', { className: 'schedule-block__action', title: 'Excluir', dataset: { action: 'delete-activity', id: activity.id } }, '🗑️')
            )
        ),
        // Horário
        el('div', { className: 'schedule-block__time' },
            el('span', { className: 'editable', dataset: { field: 'horario_inicio' } }, activity.horario_inicio),
            ' - ',
            el('span', { className: 'editable', dataset: { field: 'horario_fim' } }, activity.horario_fim)
        ),
        // Descrição
        el('p', { className: 'schedule-block__description editable', dataset: { field: 'descricao' } }, activity.descricao || 'Sem descrição.'),

        // Métricas
        el('div', { className: 'schedule-block__metrics' },
            el('div', { className: 'metric-item' },
                el('div', { className: 'metric-item__value' }, metaLeads),
                el('div', { className: 'metric-item__label' }, 'Leads')
            ),
            el('div', { className: 'metric-item' },
                el('div', { className: 'metric-item__value' }, metaVisits),
                el('div', { className: 'metric-item__label' }, 'Visitas')
            )
        ),
        // Status Button
        el('div', {
            className: `activity-item__status status-${activity.status}`,
            title: 'Clique para alterar status',
            style: { cursor: 'pointer' },
            dataset: { action: 'toggle-status', id: activity.id }
        }, getStatusText(activity.status))
    );
};

/**
 * Função principal para renderizar a Grid.
 * @param {HTMLElement} container - Onde renderizar.
 * @param {Array} activities - Lista de atividades.
 * @param {boolean} isEditMode - Estado de edição.
 */
export const renderScheduleGrid = (container, activities, isEditMode) => {
    // 1. Limpa o container
    container.innerHTML = '';

    // 2. Proteção contra dados vazios
    if (!activities || activities.length === 0) {
        container.appendChild(el('div', { className: 'empty-state' },
            el('h3', {}, 'Sem Atividades'),
            el('p', {}, 'Nenhuma atividade encontrada com o filtro selecionado.')
        ));
        return;
    }

    // 3. Ordenação Segura
    const sorted = [...activities].sort((a, b) =>
        (a.horario_inicio || "00:00").localeCompare(b.horario_inicio || "00:00")
    );

    // 4. PERFORMANCE: DocumentFragment
    // Cria todos os elementos na memória antes de jogar no DOM
    const fragment = document.createDocumentFragment();

    sorted.forEach(act => {
        fragment.appendChild(renderCard(act, isEditMode));
    });

    // 5. Inserção única no DOM (apenas 1 reflow)
    container.appendChild(fragment);
};

// --- NOVO: Lógica do Kanban ---

/**
 * Renderiza o quadro Kanban substituindo a visualização de lista/grid
 */
export const renderKanbanBoard = () => {
    const container = document.getElementById('schedule-grid'); // Reutilizamos o container principal
    if (!container) return;

    // Limpa o container e aplica classe de layout
    container.innerHTML = '';
    container.className = 'kanban-board'; // Troca a classe de grid para board

    // Definição das colunas e seus mapeamentos de status
    const columns = [
        { id: 'nao_iniciado', label: 'A Fazer' },
        { id: 'em_andamento', label: 'Em Andamento' },
        { id: 'pausado', label: 'Aguardando' },
        { id: 'concluido', label: 'Concluído' },
        { id: 'cancelado', label: 'Cancelado' }
    ];

    // Pega as atividades do estado global
    // (Ajuste conforme seu appData é acessado, aqui assumo acesso global ou import)
    const activities = window.appData?.blocos_atividades || [];
    // ^ Nota: Se appData não for global, passe como argumento para a função

    columns.forEach(col => {
        // Filtra atividades desta coluna
        const colActivities = activities.filter(a => a.status === col.id);

        // Cria estrutura HTML da coluna
        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.dataset.status = col.id; // Importante para o Drop saber o status novo

        colEl.innerHTML = `
            <div class="kanban-column-header">
                <span>${col.label}</span>
                <span class="kanban-count">${colActivities.length}</span>
            </div>
            <div class="kanban-column-body" id="col-body-${col.id}">
                </div>
        `;

        const bodyEl = colEl.querySelector('.kanban-column-body');

        // Adiciona Event Listeners para a ÁREA DE DROP (A coluna)
        bodyEl.addEventListener('dragover', handleDragOver);
        bodyEl.addEventListener('dragleave', handleDragLeave);
        bodyEl.addEventListener('drop', handleDrop);

        // Cria os cards
        colActivities.forEach(act => {
            const card = createKanbanCard(act);
            bodyEl.appendChild(card);
        });

        container.appendChild(colEl);
    });
};

// Cria o elemento HTML de um card individual
const createKanbanCard = (activity) => {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true; // Habilita arrastar nativo do HTML5
    card.dataset.id = activity.id;

    // Conteúdo Visual do Card
    card.innerHTML = `
        <div class="k-card-header">
            <span>${activity.horario_inicio || '--:--'}</span>
            <span style="background:${activity.cor || '#ccc'}; width:8px; height:8px; border-radius:50%; display:inline-block;"></span>
        </div>
        <div class="k-card-title">${escapeHtml(activity.nome)}</div>
        <div class="k-card-footer">
            <span>${escapeHtml(activity.categoria) || 'Geral'}</span>
            <span title="Duração">${activity.duracao || 0}m</span>
        </div>
    `;

    // Event Listeners para o CARD (Arrastar)
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    // (Opcional) Clique para editar - reutiliza sua função existente
    card.addEventListener('click', (e) => {
        // Evita abrir modal se estivermos terminando um arrasto
        if (card.classList.contains('was-dragged')) return;

        // Supondo que você exportou openActivityModal do scheduler.js ou app.js
        if (typeof window.openActivityModal === 'function') {
            window.openActivityModal(activity);
        }
    });

    return card;
};

// --- Drag and Drop Handlers ---

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);

    // Pequeno delay para a classe visual aplicar (opacidade)
    setTimeout(() => this.classList.add('dragging'), 0);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    this.classList.add('was-dragged'); // Flag para evitar clique acidental
    setTimeout(() => this.classList.remove('was-dragged'), 500);
    draggedItem = null;

    // Remove destaques de todas as colunas
    document.querySelectorAll('.kanban-column-body').forEach(col => {
        col.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault(); // Necessário para permitir o Drop
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

async function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const activityId = e.dataTransfer.getData('text/plain');
    // A coluna pai tem o data-status
    const newStatus = this.parentElement.dataset.status;

    if (!activityId || !newStatus) return;

    // Atualiza o estado global
    // Supondo que appData.blocos_atividades seja acessível
    const activityIndex = window.appData.blocos_atividades.findIndex(a => a.id == activityId);

    if (activityIndex > -1) {
        const activity = window.appData.blocos_atividades[activityIndex];

        // Se o status for o mesmo, não faz nada
        if (activity.status === newStatus) return;

        // Atualiza status
        activity.status = newStatus;

        // Lógica extra (Gamificação/Feedback)
        if (newStatus === 'concluido') {
            // Toca som ou mostra toast se quiser
            // showToast('Tarefa concluída! +XP', 'success');
        }

        // Salva no Firebase e Re-renderiza
        // Assumindo que você tem acesso a saveAndRerender() ou similar
        if (typeof window.saveAndRerender === 'function') {
            window.saveAndRerender();
        } else {
            // Fallback se não tiver a função global exposta
            console.warn("Função de salvamento global não encontrada. Atualizando apenas visualmente.");
            renderKanbanBoard();
        }
    }
}