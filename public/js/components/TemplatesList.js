// js/components/TemplatesList.js
import { el } from '../utils/dom.js';

/**
 * Renderiza um único cartão de template.
 */
const renderTemplateCard = (template, isCustom) => {
    // Criação dos botões de ação
    const actions = [
        el('button', { 
            className: 'template-card__action', 
            title: 'Aplicar', 
            dataset: { action: 'apply-template', id: template.id, custom: isCustom } 
        }, '✅')
    ];

    // Se for customizado, adiciona o botão de excluir
    if (isCustom) {
        actions.push(el('button', { 
            className: 'template-card__action', 
            title: 'Excluir', 
            dataset: { action: 'delete-template', id: template.id } 
        }, '🗑️'));
    }

    return el('div', { className: 'template-card' },
        // Cabeçalho (Nome + Ações)
        el('div', { className: 'template-card__header' },
            el('h3', { className: 'template-card__name' }, template.nome),
            el('div', { className: 'template-card__actions' }, ...actions)
        ),
        // Descrição
        el('p', { className: 'template-card__description' }, template.descricao || 'Sem descrição.'),
        // Contador de atividades
        el('div', { className: 'template-card__activities' }, `${template.atividades.length} atividades`)
    );
};

/**
 * Renderiza uma lista completa de templates no container.
 * @param {HTMLElement} container - O elemento onde a lista será desenhada.
 * @param {Array} templates - Array de objetos de template.
 * @param {boolean} isCustom - Define se são templates do usuário ou do sistema.
 * @param {string} emptyMessage - Mensagem para mostrar se a lista estiver vazia.
 */
export const renderTemplatesList = (container, templates, isCustom, emptyMessage = 'Nenhum template encontrado.') => {
    // 1. Limpa o container
    container.innerHTML = '';

    // 2. Verifica se está vazio
    if (!templates || templates.length === 0) {
        // Reusa o estilo de empty-state que você já tem no CSS
        container.appendChild(el('div', { className: 'empty-state' },
            el('h3', {}, isCustom ? 'Nenhum Template Personalizado' : 'Sem Templates'),
            el('p', {}, emptyMessage)
        ));
        return;
    }

    // 3. Cria o fragmento para performance
    const fragment = document.createDocumentFragment();

    templates.forEach(tpl => {
        // Envolve o card em uma div wrapper se necessário pelo seu CSS original, 
        // ou adiciona direto. No código original havia um wrapper <div> extra.
        // Vamos manter direto para ficar mais limpo, mas se quebrar o layout, avise.
        const wrapper = el('div', {}); 
        wrapper.appendChild(renderTemplateCard(tpl, isCustom));
        fragment.appendChild(wrapper.firstElementChild); // Hack para pegar o card sem criar div extra desnecessária se o CSS permitir
    });

    // 4. Injeta no DOM
    container.appendChild(fragment);
};