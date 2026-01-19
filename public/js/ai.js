// js/ai.js

// Carrega o "modelo" (neste caso, pesos heurísticos)
export const loadModel = async () => {
    // Simula um tempo de carregamento
    return new Promise(resolve => setTimeout(() => {
        console.log("🧠 Modelo de IA (Heurístico) carregado.");
        resolve(true);
    }, 500));
};

// Calcula a probabilidade de conversão (0 a 100)
export const predictConversion = async (features) => {
    /* Features esperadas:
       - leadsContatados (peso médio)
       - visitasRealizadas (peso altíssimo)
       - followUps (peso baixo)
       - horario (peso variável)
       - scriptDor (peso médio)
    */

    const wLeads = 5;
    const wVisitas = 30; // Visita vale muito
    const wFollow = 3;
    const wScriptDor = 10; // Usar script de dor aumenta chance
    
    // Bias inicial (base de conversão)
    let score = 10; 

    score += (features.leadsContatados || 0) * wLeads;
    score += (features.visitasRealizadas || 0) * wVisitas;
    score += (features.followUps || 0) * wFollow;
    
    if (features.scriptDor) {
        score += wScriptDor;
    }

    // Penalidade por horário (ex: muito tarde ou hora do almoço)
    const h = features.horario;
    if (h >= 12 && h < 14) score -= 5; // Hora do almoço
    if (h > 18) score -= 10; // Tarde da noite

    // Função Sigmoid para limitar entre 0 e 100
    // Mas para simplificar visualização, vamos usar um teto simples
    let probability = Math.min(Math.max(score, 5), 98); // Mínimo 5%, Máximo 98%

    return Math.round(probability);
};

// Explica o porquê da nota
export const explain = (features) => {
    const reasons = [];

    if ((features.visitasRealizadas || 0) > 0) {
        reasons.push("Visitas realizadas aumentam drasticamente a chance.");
    }
    if ((features.leadsContatados || 0) > 5) {
        reasons.push("Alto volume de contatos favorece o funil.");
    }
    if (features.scriptDor) {
        reasons.push("O uso de script focado na 'Dor' conecta melhor.");
    }
    if ((features.horario >= 9 && features.horario <= 11) || (features.horario >= 14 && features.horario <= 17)) {
        reasons.push("Horário nobre de atendimento.");
    }
    
    if (reasons.length === 0) return "Atividade de rotina com impacto indireto.";
    
    return reasons.join(" ");
};