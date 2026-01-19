// js/modules/scripts.js
import { getStore, setStore } from '../core/store.js';
import { saveCoreData } from '../services/firestore.js';
import { showToast } from '../components/Toast.js';
import { openWhatsAppChat } from '../services/whatsapp.js';


// --- Função Centralizada de Salvamento ---
// Isso evita repetir a lógica de persistência em cada função
const persistScriptsData = async (newPhases, activePhaseIndex = null) => {
    const { currentUser, activeScriptPhase } = getStore();
    
    // 1. Define qual fase será a ativa (a nova ou mantém a atual)
    const phaseToSave = activePhaseIndex !== null ? activePhaseIndex : activeScriptPhase;

    // 2. Atualiza Store Local (Atualiza a tela imediatamente)
    setStore({ 
        script_phases: newPhases,
        activeScriptPhase: phaseToSave
    });

    // 3. Persistência na Nuvem
    if (!currentUser) {
        console.warn("⚠️ Usuário não identificado. As alterações serão perdidas ao recarregar.");
        showToast("Erro: Usuário não logado. Dados não salvos na nuvem.", "error");
        return;
    }

    try {
        console.log("☁️ Salvando scripts na nuvem...");
        
        // Salvamos o objeto completo relacionado a scripts para garantir integridade
        await saveCoreData(currentUser.uid, { 
            script_phases: newPhases,
            activeScriptPhase: phaseToSave
        });
        
        console.log("✅ Scripts sincronizados com sucesso.");
    } catch (error) {
        console.error("❌ Erro ao salvar scripts:", error);
        showToast("Erro ao salvar na nuvem. Verifique sua conexão.", "error");
        throw error; // Re-lança para interromper fluxos se necessário
    }
};

// --- Inicialização e Renderização ---

export const initScripts = () => {
    const navContainer = document.getElementById('scripts-nav');
    const contentContainer = document.getElementById('scripts-content');
    if (!navContainer || !contentContainer) return;

    const { script_phases, activeScriptPhase } = getStore();

    if (!script_phases || script_phases.length === 0) {
        contentContainer.innerHTML = `
            <div class="empty-state">
                <h3>Sem Fases de Venda</h3>
                <p>Adicione uma nova fase para começar a criar seus scripts.</p>
                <button class="btn btn--primary" id="btn-init-phase">Criar Primeira Fase</button>
            </div>`;
        
        const initBtn = document.getElementById('btn-init-phase');
        if(initBtn) initBtn.onclick = () => openPhaseModal();
        
        navContainer.innerHTML = '';
        return;
    }

    // Renderiza Navegação
    const navList = document.createElement('ul');
    script_phases.forEach((phaseData, index) => {
        const li = document.createElement('li');
        const isActive = index === activeScriptPhase;
        
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

    // Renderiza Conteúdo
    renderScriptContent(activeScriptPhase);
};

const renderScriptContent = (phaseIndex) => {
    const contentContainer = document.getElementById('scripts-content');
    const { script_phases } = getStore();
    
    // Proteção de índice
    if (phaseIndex === undefined || phaseIndex >= script_phases.length || phaseIndex < 0) {
        phaseIndex = 0;
    }

    const data = script_phases[phaseIndex];
    if (!data) return; 

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
            // Sanitização básica para exibição
          // ... dentro do forEach ...
            const safeContent = (script.content || '')
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
                
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
                        <pre>${safeContent}</pre>
                        
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <button class="btn btn--sm btn--secondary script-card__copy-btn" data-action="copy-script">
                                📋 Copiar
                            </button>

                            <button class="btn btn--sm btn--whatsapp" 
                                    data-action="send-whatsapp" 
                                    data-content="${encodeURIComponent(script.content)}">
                                📱 Enviar no Zap
                            </button>
                        </div>
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

    const wrapper = document.createElement('div');
    wrapper.innerHTML = contentHTML;
    contentContainer.replaceChildren(...Array.from(wrapper.childNodes), addBtn);
};

// --- Ações ---

export const selectPhase = (indexStr) => {
    const index = parseInt(indexStr);
    const { script_phases } = getStore();
    
    // Apenas muda a visualização e salva a preferência
    persistScriptsData(script_phases, index);
    
    // Re-renderiza a UI imediatamente para percepção de velocidade
    initScripts(); 
};

export const openPhaseModal = (phaseIndex = null) => {
    const form = document.getElementById('phase-form');
    if (!form) return;
    form.reset();
    
    const isEditing = phaseIndex !== null;
    const { script_phases } = getStore();

    document.getElementById('phase-modal-title').textContent = isEditing ? 'Editar Fase' : 'Nova Fase';
    document.getElementById('phase-index').value = isEditing ? phaseIndex : '';
    
    if (isEditing) {
        const phase = script_phases[phaseIndex];
        if (phase) {
            document.getElementById('phase-name').value = phase.phase;
            document.getElementById('phase-objective').value = phase.objective;
        }
    }
    
    const modal = document.getElementById('phase-modal');
    if(modal) modal.classList.remove('hidden');
};

export const savePhase = async () => {
    const phaseIndexStr = document.getElementById('phase-index').value;
    const phaseName = document.getElementById('phase-name').value;
    const phaseObjective = document.getElementById('phase-objective').value;

    const { script_phases } = getStore();
    // Clona para não mutar o estado diretamente antes da hora
    const newPhases = JSON.parse(JSON.stringify(script_phases || []));

    let newActiveIndex = getStore().activeScriptPhase;

    if (phaseIndexStr !== '') {
        // Editar
        const idx = parseInt(phaseIndexStr);
        newPhases[idx] = { ...newPhases[idx], phase: phaseName, objective: phaseObjective };
    } else {
        // Criar
        newPhases.push({
            phase: phaseName,
            objective: phaseObjective,
            scripts: []
        });
        newActiveIndex = newPhases.length - 1; // Muda para a nova fase criada
    }

    // Fecha modal antes do await para UI ser fluida
    document.getElementById('phase-modal').classList.add('hidden');

    await persistScriptsData(newPhases, newActiveIndex);
    showToast(phaseIndexStr !== '' ? 'Fase atualizada!' : 'Fase criada!');
    
    initScripts();
};

export const deletePhase = async (phaseIndex) => {
    const idx = parseInt(phaseIndex);
    const { script_phases, activeScriptPhase } = getStore();
    const phase = script_phases[idx];

    if (window.confirm(`Excluir a fase "${phase.phase}" e todos os seus scripts?`)) {
        const newPhases = script_phases.filter((_, i) => i !== idx);
        
        let newActive = activeScriptPhase;
        if (newActive >= idx) newActive = Math.max(0, newActive - 1);

        await persistScriptsData(newPhases, newActive);
        showToast('Fase excluída.');
        initScripts();
    }
};

export const openScriptModal = (phaseIndex, scriptId = null) => {
    const form = document.getElementById('script-form');
    if(!form) return;
    form.reset();
    
    const isEditing = scriptId !== null;
    const { script_phases } = getStore();

    document.getElementById('script-modal-title').textContent = isEditing ? 'Editar Script' : 'Novo Script';
    document.getElementById('script-phase-index').value = phaseIndex;
    document.getElementById('script-id').value = isEditing ? scriptId : '';

    if(isEditing) {
        const phase = script_phases[phaseIndex];
        const script = phase.scripts.find(s => s.id == scriptId);
        if (script) {
            document.getElementById('script-title').value = script.title;
            document.getElementById('script-content').value = script.content;
            document.getElementById('script-type').value = script.type;
        }
    }
    
    const modal = document.getElementById('script-modal');
    if(modal) modal.classList.remove('hidden');
};

export const saveScript = async () => {
    const phaseIndex = parseInt(document.getElementById('script-phase-index').value);
    const scriptIdStr = document.getElementById('script-id').value;
    const scriptId = (scriptIdStr !== null && scriptIdStr !== '') ? parseInt(scriptIdStr, 10) : null;
    
    const scriptData = {
        title: document.getElementById('script-title').value,
        content: document.getElementById('script-content').value,
        type: document.getElementById('script-type').value
    };

    const { script_phases } = getStore();
    // Clone profundo para segurança
    const newPhases = JSON.parse(JSON.stringify(script_phases)); 
    const currentPhase = newPhases[phaseIndex];

    if (scriptId !== null) {
        // Editar
        const scriptIndex = currentPhase.scripts.findIndex(s => s.id === scriptId);
        if (scriptIndex > -1) {
            currentPhase.scripts[scriptIndex] = { ...currentPhase.scripts[scriptIndex], ...scriptData };
        }
    } else {
        // Criar
        scriptData.id = Date.now();
        if (!currentPhase.scripts) currentPhase.scripts = [];
        currentPhase.scripts.push(scriptData);
    }

    // Fecha modal
    document.getElementById('script-modal').classList.add('hidden');

    // Salva
    await persistScriptsData(newPhases);
    showToast(scriptId !== null ? 'Script atualizado!' : 'Script adicionado!');

    initScripts(); 
};

export const deleteScript = async (phaseIndex, scriptId) => {
    const { script_phases } = getStore();
    const idx = parseInt(phaseIndex);
    const sId = parseInt(scriptId);

    const newPhases = JSON.parse(JSON.stringify(script_phases));
    const currentPhase = newPhases[idx];
    const script = currentPhase.scripts.find(s => s.id === sId);

    if (window.confirm(`Excluir o script "${script.title}"?`)) {
        currentPhase.scripts = currentPhase.scripts.filter(s => s.id !== sId);
        
        await persistScriptsData(newPhases);
        showToast('Script excluído.');
        initScripts();
    }
};

export const copyScriptToClipboard = (btnElement) => {
    const pre = btnElement.nextElementSibling;
    if(pre && pre.tagName === 'PRE') {
        navigator.clipboard.writeText(pre.innerText)
            .then(() => showToast('Copiado!', 'success'))
            .catch(() => showToast('Erro ao copiar.', 'error'));
    }
};

// --- AQUI ESTÁ A FUNÇÃO QUE FALTAVA ---
export const sendScriptToWhatsApp = (btnElement) => {
    const content = decodeURIComponent(btnElement.dataset.content);
    const phone = prompt("WhatsApp do cliente (DDD+Num):");
    if (phone) {
        openWhatsAppChat(phone, content);
    }
};

