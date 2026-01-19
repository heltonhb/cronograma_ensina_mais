
/**
 * Serviço para carregar Chart.js sob demanda (Lazy Loading).
 * Evita bloquear o carregamento inicial do app com uma biblioteca pesada (200kb+).
 */

const CHART_JS_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js';
let loadPromise = null;

export const loadChartJs = () => {
    // Se já estiver carregado ou carregando, retorna a promessa existente
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
        // Se já existe no window (ex: carregado por outra via), resolve.
        if (window.Chart) {
            resolve(window.Chart);
            return;
        }

        const script = document.createElement('script');
        script.src = CHART_JS_URL;
        script.async = true;

        script.onload = () => {
            if (window.Chart) {
                console.log("📊 Chart.js carregado dinamicamente.");
                resolve(window.Chart);
            } else {
                reject(new Error("Chart.js script loaded but window.Chart is missing."));
            }
        };

        script.onerror = (err) => {
            console.error("Erro ao carregar Chart.js", err);
            loadPromise = null; // Permite tentar de novo se falhar
            reject(err);
        };

        document.head.appendChild(script);
    });

    return loadPromise;
};
