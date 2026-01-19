// /core/bootstrap.js

import { initState, setState } from "./state.js";
import { emit, on } from "./events.js";

/**
 * Registra inicializadores (módulos) que devem rodar no boot.
 */
const initializers = [];

/**
 * Módulos chamam registerInit() quando precisam rodar algo no boot:
 *
 * registerInit(() => initDashboard())
 */
export function registerInit(fn) {
    initializers.push(fn);
}

/**
 * Roda a sequência completa de inicialização:
 * 1. Pré-carga (ex.: carregar Firebase / IndexedDB)
 * 2. Inicializar estado com os dados recebidos
 * 3. Rodar módulos registrados
 */
export async function bootstrapApp(loadDataFn) {

    emit("app:boot:start");

    // 1. Carrega dados iniciais (Firebase, Offline, etc)
    const initialData = await loadDataFn();

    // 2. Alimenta o estado global
    initState(initialData);

    emit("app:state-ready", initialData);

    // 3. Executa todos os módulos registrados
    for (const initFn of initializers) {
        try {
            await initFn();
        } catch (err) {
            console.error("Erro ao iniciar módulo:", err);
        }
    }

    emit("app:boot:done");
}
