// /core/state.js

import { emit } from "./events.js";

/**
 * Estado global inicial.
 * Pode ser alimentado pelo Firestore na inicialização.
 */
let state = {};

/**
 * Armazena callbacks de subscribers reativos (watchers).
 */
const subscribers = [];

/**
 * Atualiza qualquer chave do estado global.
 * Dispara eventos e notifica subscribers automaticamente.
 */
export function setState(partial) {
    const changedKeys = [];

    Object.keys(partial).forEach(key => {
        const newValue = partial[key];
        const oldValue = state[key];

        if (newValue !== oldValue) {
            state[key] = newValue;
            changedKeys.push(key);
        }
    });

    if (changedKeys.length > 0) {
        // Notifica watchers
        subscribers.forEach(fn => fn(state, changedKeys));

        // Dispara evento global de estado atualizado
        emit("state:changed", { state, changedKeys });
    }
}

/**
 * Recupera o estado atual ou uma prop específica.
 */
export function getState(key = null) {
    return key ? state[key] : state;
}

/**
 * Subscreve mudanças no estado.
 */
export function subscribe(fn) {
    subscribers.push(fn);
    return () => {
        const index = subscribers.indexOf(fn);
        if (index >= 0) subscribers.splice(index, 1);
    };
}

/**
 * Inicializa o estado com dados completos — usado ao carregar Firestore.
 */
export function initState(initial) {
    state = { ...initial };
    emit("state:initialized", state);
}
