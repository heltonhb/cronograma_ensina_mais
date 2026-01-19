
export const renderModals = () => {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'dynamic-modals-container';

    modalContainer.innerHTML = `
    <!-- AUTH MODAL -->
    <div id="auth-container" class="modal">
        <div class="modal__container modal--small">
            <div class="modal__header">
                <h2>Bem-vindo(a)</h2>
            </div>
            <div class="modal__body">
                <form id="login-form">
                    <div class="form-group">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" id="email" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="password" class="form-label">Senha</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <div class="modal__footer" style="border-top: none; padding-top: 0;">
                        <button type="button" id="signup-btn" class="btn btn--secondary">Cadastrar</button>
                        <button type="submit" id="login-btn" class="btn btn--primary">Entrar</button>
                    </div>
                    <p id="auth-error" style="color: var(--color-error); font-size: var(--font-size-sm); text-align: center; margin-top: 1rem;"></p>
                </form>
            </div>
        </div>
    </div>

    <!-- ACTIVITY MODAL -->
    <div id="activity-modal" class="modal hidden">
        <div class="modal__backdrop"></div>
        <div class="modal__container">
            <div class="modal__header">
                <h2 id="activity-modal-title">Nova Atividade</h2>
                <button class="modal__close" data-action="close-modal">&times;</button>
            </div>
            <form id="activity-form" class="modal__body">
                <input type="hidden" id="activity-id">
                <div class="form-group">
                    <label for="activity-name" class="form-label">Nome da Atividade</label>
                    <input type="text" id="activity-name" class="form-control" required>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Início</label><input type="time" id="activity-start" class="form-control" required></div>
                    <div class="form-group"><label class="form-label">Fim</label><input type="time" id="activity-end" class="form-control" required></div>
                </div>
                 <div class="form-group"><label class="form-label">Duração</label><input type="text" id="activity-duration" class="form-control" disabled></div>
                <div class="form-group"><label class="form-label">Descrição</label><textarea id="activity-description" class="form-control" rows="2"></textarea></div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Categoria</label>
                        <select id="activity-category" class="form-control" required>
                            <option value="Preparação">Preparação</option>
                            <option value="Prospecção">Prospecção</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Atendimento">Atendimento</option>
                            <option value="Conversão">Conversão</option>
                            <option value="Reativação">Reativação</option>
                            <option value="Finalização">Finalização</option>
                            <option value="Descanso">Descanso</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Prioridade</label>
                        <select id="activity-priority" class="form-control"><option value="Alta">Alta</option><option value="Média">Média</option><option value="Baixa">Baixa</option></select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group"><label class="form-label">Tipo</label><select id="activity-type" class="form-control"><option value="Obrigatória">Obrigatória</option><option value="Flexível">Flexível</option></select></div>
                    <div class="form-group"><label class="form-label">Status</label><select id="activity-status" class="form-control"><option value="nao_iniciado">Não Iniciado</option><option value="em_andamento">Em Andamento</option><option value="concluido">Concluído</option><option value="pausado">Pausado</option><option value="cancelado">Cancelado</option></select></div>
                </div>

                <div class="form-group"><label class="form-label">Observações</label><textarea id="activity-observations" class="form-control" rows="2"></textarea></div>
                <div class="form-group"><label class="form-label">Participantes</label><div id="activity-participants-list" class="participants-checkbox-group"></div></div>

                <input type="hidden" id="activity-meta-leads" value="0"><input type="hidden" id="activity-meta-visits" value="0">
                <input type="hidden" id="activity-contacted-leads" value="0"><input type="hidden" id="activity-realized-visits" value="0">
                <input type="hidden" id="activity-schedules-made" value="0">
                
                <div class="form-group">
                    <label class="form-label">Ícone e Cor</label>
                    <div class="form-row"><div id="icon-selector" class="icon-selector"></div><div id="color-selector" class="color-selector"></div></div>
                </div>
                <div class="modal__footer">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button>
                    <button type="button" class="btn btn--secondary" id="activity-duplicate" style="display: none;">Duplicar</button>
                    <button type="submit" class="btn btn--primary">Salvar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- TEMPLATE MODAL -->
    <div id="template-modal" class="modal hidden">
        <div class="modal__backdrop"></div>
        <div class="modal__container">
            <div class="modal__header"><h2>Salvar Template</h2><button class="modal__close" data-action="close-modal">&times;</button></div>
            <form id="template-form" class="modal__body">
                <div class="form-group"><label class="form-label">Nome</label><input type="text" id="template-name" class="form-control" required></div>
                <div class="form-group"><label class="form-label">Descrição</label><textarea id="template-description" class="form-control" rows="3"></textarea></div>
                <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn--primary">Salvar</button></div>
            </form>
        </div>
    </div>
    
    <!-- SCRIPT MODAL -->
    <div id="script-modal" class="modal hidden">
        <div class="modal__backdrop"></div>
        <div class="modal__container">
            <div class="modal__header">
                <h2 id="script-modal-title">Novo Script</h2>
                <button class="modal__close" data-action="close-modal">&times;</button>
            </div>
            <form id="script-form" class="modal__body">
                <input type="hidden" id="script-phase-index"><input type="hidden" id="script-id">
                <div class="form-group"><label class="form-label">Título</label><input type="text" id="script-title" class="form-control" required></div>
                <div class="form-group"><label class="form-label">Conteúdo</label><textarea id="script-content" class="form-control" rows="6" required></textarea></div>
                <div class="form-group"><label class="form-label">Tipo</label><select id="script-type" class="form-control"><option value="geral">Geral</option><option value="dor">Foco na Dor</option><option value="ganho">Foco no Ganho</option></select></div>
                <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn--primary">Salvar</button></div>
            </form>
        </div>
    </div>
    
    <!-- PHASE MODAL -->
    <div id="phase-modal" class="modal hidden">
        <div class="modal__backdrop"></div>
        <div class="modal__container">
            <div class="modal__header"><h2>Nova Fase</h2><button class="modal__close" data-action="close-modal">&times;</button></div>
            <form id="phase-form" class="modal__body">
                <input type="hidden" id="phase-index">
                <div class="form-group"><label class="form-label">Nome</label><input type="text" id="phase-name" class="form-control" required></div>
                <div class="form-group"><label class="form-label">Objetivo</label><textarea id="phase-objective" class="form-control" rows="3" required></textarea></div>
                <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn--primary">Salvar</button></div>
            </form>
        </div>
    </div>

    <!-- CONFIRMATION MODAL -->
    <div id="confirmation-modal" class="modal hidden">
        <div class="modal__backdrop"></div>
        <div class="modal__container modal--small">
            <div class="modal__header"><h2 id="confirmation-title">Confirmar</h2><button class="modal__close" data-action="close-modal">&times;</button></div>
            <div class="modal__body"><p id="confirmation-message">Confirma?</p></div>
            <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="button" class="btn btn--primary" id="confirmation-confirm">Confirmar</button></div>
        </div>
    </div>

    <!-- ADMIN GAMIFICATION MODAL -->
    <div id="admin-gamification-modal" class="modal hidden">
        <div class="modal__backdrop"></div>
        
        <div class="modal__container">
            <div class="modal__header">
                <h3>⚙️ Configurar Premiação</h3>
                <button class="modal__close" data-action="close-modal">×</button>
            </div>
            <div class="modal__body">
                <form id="admin-gamification-form">
                    <div class="form-row" style="margin-bottom: 15px;">
                        <div class="form-group">
                            <label class="form-label">XP por Lead</label>
                            <input type="number" id="rule-xp-lead" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">XP por Ligação</label>
                            <input type="number" id="rule-xp-call" class="form-control">
                        </div>
                    </div>
                    
                    <div class="form-row" style="margin-bottom: 15px;">
                        <div class="form-group">
                            <label class="form-label">XP por Agendamento</label>
                            <input type="number" id="rule-xp-schedule" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">XP por Visita</label>
                            <input type="number" id="rule-xp-visit" class="form-control">
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="color: var(--color-success); font-weight: 700;">XP por Matrícula (Venda)</label>
                        <input type="number" id="rule-xp-sale" class="form-control" style="border-color: var(--color-success); background-color: rgba(var(--color-success-rgb), 0.1);">
                    </div>
                    
                    <hr style="margin: 15px 0; border:0; border-top:1px solid var(--color-border);">
                    
                    <div class="form-row" style="margin-bottom: 15px;">
                        <div class="form-group">
                            <label class="form-label">Tarefa Vendas (XP)</label>
                            <input type="number" id="rule-xp-task-sales" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tarefa Admin (XP)</label>
                            <input type="number" id="rule-xp-task-admin" class="form-control">
                        </div>
                    </div>

                    <div class="form-group" style="background: var(--color-bg-1); padding: 15px; border-radius: 8px; border: 1px solid var(--color-border); margin-top: 20px;">
                        <label class="form-label">🔑 Alterar Senha de Acesso</label>
                        <div>
                            <input type="password" id="admin-password-input" class="form-control" placeholder="Digite nova senha">
                        </div>
                    </div>

                    <div class="modal__footer">
                        <button type="button" class="btn btn--secondary" id="btn-reset-matriculador" style="margin-right: auto; color: var(--color-error);">🔄 Resetar Func.</button>
                        <button type="submit" class="btn btn--primary">Salvar Regras</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- ADMIN LOGIN MODAL -->
    <div id="admin-login-modal" class="modal hidden" style="z-index: 10005;">
        <div class="modal__backdrop"></div>
        <div class="modal__container" style="max-width: 350px; text-align: center;">
            <div class="modal__header" style="justify-content: center; border:0;">
                <h3>🔒 Acesso Restrito</h3>
            </div>
            <div class="modal__body">
                <form id="admin-login-form">
                    <input type="password" id="admin-login-input" class="input-field" placeholder="Digite a senha" style="text-align: center; margin-bottom: 20px; font-size: 1.2rem; letter-spacing: 2px; position: relative; z-index: 20;">
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button>
                        <button type="submit" class="btn btn--primary">Entrar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `;

    document.body.appendChild(modalContainer);
};
