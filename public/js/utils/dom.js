// js/utils/dom.js

/**
 * Cria um elemento DOM com atributos e filhos.
 * @param {string} tag - A tag HTML (ex: 'div', 'button').
 * @param {Object} props - Atributos e propriedades (ex: { className: 'btn', textContent: 'Olá' }).
 * @param {...(HTMLElement|string)} children - Filhos do elemento.
 * @returns {HTMLElement}
 */
export const el = (tag, props = {}, ...children) => {
    const element = document.createElement(tag);

    Object.entries(props).forEach(([key, value]) => {
        if (key === 'dataset' && typeof value === 'object') {
            // Trata dataset separadamente (data-id, data-action, etc.)
            Object.assign(element.dataset, value);
        } else if (key === 'style' && typeof value === 'object') {
            // Trata style como objeto
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            // Trata eventos (ex: onClick)
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
            // Atributos normais (className, id, draggable, etc.)
            element[key] = value;
        }
    });

    children.forEach(child => {
        // Se for string ou número, cria nó de texto (SEGURANÇA CONTRA XSS AQUI)
        if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        } else if (Array.isArray(child)) {
             // Suporta arrays de filhos
             child.forEach(c => element.appendChild(c));
        }
    });

    return element;
};