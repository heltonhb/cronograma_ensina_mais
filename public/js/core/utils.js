// js/core/utils.js

export const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

export const calculateDuration = (startTime, endTime) => timeToMinutes(endTime) - timeToMinutes(startTime);

export const formatDuration = (minutes) => {
    if (isNaN(minutes) || minutes < 0) return "Inválido";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'min' : ''}`.trim() || "0min";
};

export const generateUniqueId = (existingItems) => {
    let newId;
    do {
        newId = Math.floor(Date.now() + Math.random() * 10000);
    } while (existingItems.some(item => item.id === newId));
    return newId;
};

export const getStatusText = (status) => ({
    'concluido': 'Concluído', 'em_andamento': 'Em Andamento', 'nao_iniciado': 'Não Iniciado',
    'pausado': 'Pausado', 'cancelado': 'Cancelado'
})[status] || status;

export const calculateConversionRate = (numerator, denominator) => {
    if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
        return 0;
    }
    return Math.round((numerator / denominator) * 100);
};

export const downloadObjectAsJson = (exportObj, exportName) => {
    // ... copie o código da função aqui ...
};

/**
 * Escapes unsafe characters to prevent XSS.
 * @param {string} unsafe - The string to escape.
 * @returns {string} The escaped string.
 */
export const escapeHtml = (unsafe) => {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};