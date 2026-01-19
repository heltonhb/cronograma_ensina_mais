
/**
 * Global Error Handler
 * Captura erros não tratados e rejeições de promessas para evitar que o app "trave" silenciosamente.
 */

import { showToast } from '../components/Toast.js';

export const initErrorHandler = () => {
    // 1. Captura erros globais de script (sintaxe, runtime)
    window.onerror = (message, source, lineno, colno, error) => {
        console.error("🔥 [Global Error]:", { message, source, lineno, error });

        // Evita spam de erros trivial
        if (message.includes('Script error')) return false;

        showToast(`Ocorreu um erro inesperado: ${message}`, 'error');
        return false; // Deixa o erro propagar para o console padrão também
    };

    // 2. Captura Promessas rejeitadas não tratadas (Async/Await falhos)
    window.addEventListener('unhandledrejection', (event) => {
        console.error("🔥 [Unhandled Promise]:", event.reason);

        let msg = "Erro de conexão ou operação falhou.";
        if (event.reason && event.reason.message) {
            msg = event.reason.message;
        } else if (typeof event.reason === 'string') {
            msg = event.reason;
        }

        // Filtra erros comuns que não precisam assustar o usuário
        if (msg.includes('user cancelled')) return;

        showToast(`Erro: ${msg}`, 'error');
    });

    console.log("🛡️ Global Error Handler inicializado.");
};
