import { Activity } from '../types/activity';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Service - Smart Sales Forecast & Gemini Integration
 * Ported from v1/js/services/ai.js and upgraded with Gemini 1.5 Flash
 */

// Initialize Gemini API
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Helper to try multiple models
const generateWithFallback = async (prompt: string): Promise<string> => {
    if (!genAI) throw new Error("API Key not found");

    const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-exp"
    ];

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.warn(`Model ${modelName} failed:`, error.message);
            // If it's the last model, rethrow
            if (modelName === modelsToTry[modelsToTry.length - 1]) throw error;
            // Otherwise continues to next model
        }
    }
    throw new Error("All models failed");
};

const model = null; // Deprecated direct access, use generateWithFallback

export interface AiPrediction {
    probability: number;
    explanation: string;
    trend: number;
}

export interface LeadScore {
    score: number;
    color: string;
    label: string;
}

export interface ActivityDefault {
    nome: string;
    categoria: string;
    prioridade: 'Baixa' | 'Média' | 'Alta';
    meta_leads?: number;
    meta_visitas?: number;
}

export const predictActivityDefaults = (currentHour: number): ActivityDefault => {
    // 08:00 - 10:00: Planejamento
    if (currentHour >= 8 && currentHour < 10) {
        return { nome: 'Planejamento Diário', categoria: 'Preparação', prioridade: 'Alta' };
    }
    // 10:00 - 12:00: Prospecção
    if (currentHour >= 10 && currentHour < 12) {
        return {
            nome: 'Ligações Novos Leads',
            categoria: 'Prospecção',
            prioridade: 'Alta',
            meta_leads: 10
        };
    }
    // 12:00 - 14:00: Almoço
    if (currentHour >= 12 && currentHour < 14) {
        return { nome: 'Almoço', categoria: 'Geral', prioridade: 'Baixa' };
    }
    // 14:00 - 17:00: Visitas / Conversão
    if (currentHour >= 14 && currentHour < 17) {
        return {
            nome: 'Visita / Reunião',
            categoria: 'Conversão',
            prioridade: 'Alta',
            meta_visitas: 1 // Interpreted as "1 Matrícula/Visita"
        };
    }
    // 17:00 - 18:30: Follow-up
    if (currentHour >= 17 && currentHour < 19) {
        return {
            nome: 'Follow-up do dia',
            categoria: 'Follow-up',
            prioridade: 'Média',
            meta_leads: 5
        };
    }
    // 19:00+: Fechamento
    if (currentHour >= 19) {
        return { nome: 'Fechamento do Dia', categoria: 'Finalização', prioridade: 'Média' };
    }

    // Default Fallback
    return { nome: '', categoria: 'Geral', prioridade: 'Média' };
};

export interface SalesProjection {
    current: number;
    projected: number;
    gap: number;
    velocity: number;
    message: string;
    onTrack: boolean;
}

export const predictMonthlySales = (
    currentSales: number,
    historyLast7Days: { matriculas: number; date: string }[]
): SalesProjection => {
    // 1. Calculate Velocity (Sales/Week)
    // Filter last 7 days data
    const totalLast7Days = historyLast7Days.reduce((acc, curr) => acc + (Number(curr.matriculas) || 0), 0);
    const dailyVelocity = totalLast7Days / 7; // Averaged over 7 days regardless of activity

    // 2. Time Remaining
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = Math.max(0, endOfMonth.getDate() - now.getDate());

    // 3. Projection
    const projectedAdditional = dailyVelocity * daysRemaining;
    const projectedTotal = Math.round(currentSales + projectedAdditional);

    // 4. Analysis
    // Assume a dynamic goal? For now, let's just project. 
    // Or compare with a "breakeven" or "growth" baseline. 
    // Let's assume a healthy velocity is > 0.5 sales/day (15/month).

    return {
        current: currentSales,
        projected: projectedTotal,
        gap: Math.round(projectedAdditional),
        velocity: Number(dailyVelocity.toFixed(2)),
        message: dailyVelocity > 0.8
            ? "🚀 Ritmo acelerado! Você vai quebrar recordes."
            : dailyVelocity > 0.4
                ? "📈 Ritmo constante. Mantenha o foco."
                : "⚠️ Atenção: Ritmo baixo. Aumente a prospecção.",
        onTrack: dailyVelocity > 0.5
    };
};

export const predictConversion = (
    currentFeatures: { diaSemana: number; visitasRealizadas: number },
    historicalLogs: Record<string, { visitas?: number | string; matriculas?: number | string; visitas_realizadas?: number | string }>
): AiPrediction => {
    const logs = Object.entries(historicalLogs || {});

    // 1. Prepare Dataset
    const dataset = logs
        .map(([date, data], index) => {
            const visitas = Number(data.visitas || data.visitas_realizadas || 0);
            const matriculas = Number(data.matriculas || 0);
            const taxa = visitas > 0 ? (matriculas / visitas) * 100 : 0;
            return {
                index,
                date,
                visitas,
                matriculas,
                taxa,
                weight: 1 + (index * 0.1) // Linear Time Decay
            };
        })
        .filter(d => d.visitas > 0);

    // 2. Fallback
    if (dataset.length < 3) {
        return {
            probability: 15,
            explanation: "Calibrando IA... (Complete ao menos 3 dias com visitas para gerar previsões)",
            trend: 0
        };
    }

    // 3. Weighted Linear Regression
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, totalWeight = 0;

    dataset.slice(-30).forEach(point => {
        const w = point.weight;
        sumX += point.index * w;
        sumY += point.taxa * w;
        sumXY += point.index * point.taxa * w;
        sumXX += point.index * point.index * w;
        totalWeight += w;
    });

    const denominator = (totalWeight * sumXX - sumX * sumX);
    if (denominator === 0) return { probability: 15, explanation: "Dados insuficientes para cálculo de tendência.", trend: 0 };

    const slope = (totalWeight * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / totalWeight;

    // 4. Prediction for Today
    const nextIndex = logs.length;
    let predictedRate = (slope * nextIndex) + intercept;

    // Sanity checks
    predictedRate = Math.max(5, Math.min(predictedRate, 95));

    // 5. Seasonality Adjustment
    const todayStats = getDayOfWeekStats(logs, currentFeatures.diaSemana);
    let seasonalityFactor = 0;

    if (todayStats.average > 0) {
        const diff = todayStats.average - predictedRate;
        seasonalityFactor = diff * 0.3;
    }

    let finalProbability = Math.round(predictedRate + seasonalityFactor);

    // 6. Realtime Context Boost
    if (currentFeatures.visitasRealizadas > todayStats.avgVisits) {
        finalProbability += 5;
    }

    finalProbability = Math.max(5, Math.min(finalProbability, 95));

    // 7. Explanation
    let explanation = `Tendência: ${slope > 0 ? "📈 Crescimento" : "📉 Estável"}.`;
    if (slope > 0.5) explanation = "Sua conversão vem subindo consistentemente!";
    else if (slope < -0.5) explanation = "Atenção: Sua conversão caiu nos últimos dias.";

    if (seasonalityFactor > 5) explanation += " Hoje costuma ser um bom dia para você!";
    if (currentFeatures.visitasRealizadas > 3) explanation += " Alto volume de visitas potencializa o resultado.";

    return {
        probability: finalProbability,
        explanation,
        trend: slope
    };
};

// Helper
const getDayOfWeekStats = (logs: [string, { visitas?: number | string; matriculas?: number | string }][], dayOfWeek: number) => {
    const sameDays = logs.filter(([date]) => {
        const d = new Date(date + "T12:00:00");
        return d.getDay() === dayOfWeek;
    });

    if (sameDays.length === 0) return { average: 0, avgVisits: 0 };

    let totalRate = 0;
    let totalVisits = 0;

    sameDays.forEach(([, data]) => {
        const v = Number(data.visitas || 0);
        const m = Number(data.matriculas || 0);
        if (v > 0) totalRate += (m / v) * 100;
        totalVisits += v;
    });

    return {
        average: totalRate / sameDays.length,
        avgVisits: totalVisits / sameDays.length
    };
};

export const getAiSuggestion = (probability: number) => {
    if (probability < 30) return "O dia está difícil. Foque em volume de prospecção.";
    if (probability < 60) return "Mantenha a consistência. Revise seus scripts.";
    if (probability < 80) return "Ótimo momento! Seja mais agressivo no fechamento.";
    return "🔥🔥 Dia de Ouro! Aproveite a maré alta!";
};

/**
 * Lead Scoring System
 */
export const calculateLeadScore = (activity: Activity): LeadScore => {
    let score = 0;

    // 1. Engagement
    score += (activity.leads_contatados || 0) * 5;
    score += (activity.visitas_realizadas || 0) * 20;
    // Note: Activity type definition might need 'agendamentos_feitos' if used in v1. 
    // Assuming standard fields from v2. If not, ignore.

    // 2. Semantic Analysis
    const text = ((activity.nome || '') + ' ' + (activity.descricao || '')).toLowerCase();

    const hotKeywords = ['fechamento', 'interessado', 'urgente', 'pagamento', 'contrato', 'visita', 'reunião'];
    const warmKeywords = ['duvida', 'conhecer', 'preço', 'valor', 'cotação'];
    const coldKeywords = ['desligou', 'sem interesse', 'caixa postal', 'ocupado'];

    hotKeywords.forEach(w => { if (text.includes(w)) score += 15; });
    warmKeywords.forEach(w => { if (text.includes(w)) score += 5; });
    coldKeywords.forEach(w => { if (text.includes(w)) score -= 10; });

    // 3. Status
    if (activity.status === 'em_andamento') score += 10;
    if (activity.status === 'concluido') score += 50;

    score = Math.max(0, Math.min(score, 100));

    let color = '#94a3b8'; // Cold (Gray)
    let label = 'Frio';

    if (score >= 80) {
        color = '#22c55e'; // Hot (Green)
        label = '🔥🔥 Quente';
    } else if (score >= 50) {
        color = '#f59e0b'; // Warm (Orange)
        label = 'Morno';
    }

    return { score, color, label };
};

export interface ScriptSuggestion {
    title: string;
    content: string;
    tone: 'Empathetic' | 'Logical' | 'Aggressive' | 'Creative';
}


// Contexto da Empresa
const COMPANY_CONTEXT = `
# SYSTEM ROLE: ESPECIALISTA EM GESTÃO DE CRISE EDUCACIONAL (Agente de Vendas)

## 1. IDENTIDADE E ALINHAMENTO DE VALORES
Você é o Especialista Sênior da **Ensina Mais Turma da Mônica (Unidade Tatuapé)**.
Você não vende cursos; você gerencia a ansiedade familiar e oferece **Segurança Futura**.
Sua arquitetura mental é regida pelos princípios de Diógenes Lucca:
1.  **Humanidade:** Conexão empática imediata (validar a dor).
2.  **Autoridade:** Domínio técnico absoluto (diagnóstico preciso).
3.  **Resultado/Segurança:** O foco não é o preço, mas o custo irreversível da inação.

## 2. BASE DE CONHECIMENTO (PRODUTOS)
*   **Apoio Escolar:** Português e Matemática (foco em base forte).
*   **Tecnologia:** Robótica e Programação/Jogos (foco em raciocínio lógico e futuro digital).
*   **Metodologia:** Mediação individualizada, autonomia do aluno e sistema híbrido (interativo + instrutor).

## 3. PROTOCOLO DE EXECUÇÃO (CHAIN-OF-THOUGHT)
Antes de responder, você deve executar este processo lógico silencioso (CoT) para evitar respostas genéricas:
1.  **Diagnóstico de Intenção:** Qual é o medo oculto deste pai? (Ex: filho reprovar, vício em telas, falta de foco, despreparo  para as profissões do futuro).
2.  **Seleção da "Pílula de Segurança":** Qual produto mitiga esse risco específico?
3.  **Construção da Resposta:** Aplicar a estrutura de 3 passos (Acolhimento -> Reenquadramento -> Ação).

## 4. DIRETRIZES DE ESTILO E PRAGMÁTICA
*   **Conciso:** Máximo de 60 palavras. Use a "Máxima de Quantidade" de Grice (seja tão informativo quanto necessário, não mais).
*   **Tom:** "Calma Armada". Você é firme porque sabe que tem a solução. Nunca use diminutivos ou linguagem infantilizada com os pais.
*   **Gatilho de Urgência:** Aja como se a vaga fosse um recurso escasso e necessário para o sucesso acadêmico do aluno.

## 5. FORMATO DE SAÍDA (Obrigatório)
Para cada interação, gere a resposta seguindo estritamente este template:

**[ANÁLISE INTERNA]:** (Identifique a dor do cliente em 1 frase)
**[RESPOSTA]:** (Sua resposta final ao cliente seguindo os 3 passos)

`;

/**
 * Generates sales scripts using Gemini AI
 */
export const generateScript = async (objection: string): Promise<ScriptSuggestion[]> => {
    if (!genAI) {
        console.warn("Gemini API Key not found. Falling back to mock data.");
        return generateMockScript(objection);
    }

    try {
        const prompt = `
        ${COMPANY_CONTEXT}

        O cliente apresentou a seguinte objeção: "${objection}".
        
        Gere 3 scripts de resposta para contornar essa objeção.
        Retorne APENAS um JSON array com a seguinte estrutura:
        [
            { "title": "Nome da Tática", "content": "O script de fala", "tone": "Empathetic" | "Logical" | "Aggressive" | "Creative" }
        ]
        
        Certifique-se que o JSON seja válido. Tones permitidos: Empathetic, Logical, Aggressive, Creative.
        `;

        const text = await generateWithFallback(prompt);

        // Clean markdown code blocks if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText) as ScriptSuggestion[];
    } catch (error) {
        console.error("Gemini API Error:", error);
        return generateMockScript(objection);
    }
};

// Fallback for when API is unavailable
const generateMockScript = (objection: string): ScriptSuggestion[] => {
    const lowerObj = objection.toLowerCase();
    const suggestions: ScriptSuggestion[] = [];

    // Tática do "Está Caro"
    if (lowerObj.includes('caro') || lowerObj.includes('preço') || lowerObj.includes('valor')) {
        suggestions.push({
            title: 'Isolamento da Objeção',
            tone: 'Logical',
            content: 'Entendo perfeitamente. Mas quando você diz que está caro, está comparando com o que exatamente? Com nossos concorrentes ou com o orçamento que você tinha previsto?'
        });
        suggestions.push({
            title: 'Reforço de Valor (Custo x Benefício)',
            tone: 'Aggressive',
            content: 'Se o preço não fosse um problema, esse seria o curso ideal para o seu filho? (Se sim) Então o problema não é o curso, é como viabilizar o pagamento. Vamos focar nisso.'
        });
        suggestions.push({
            title: 'Empatia e Parcelamento',
            tone: 'Empathetic',
            content: 'Eu sei que é um investimento importante. Mas pense no retorno que isso trará para o aprendizado dele em poucos meses. E se parcelarmos de uma forma que caiba melhor no seu fluxo?'
        });
    }
    // Tática do "Vou pensar" / "Falar com marido/esposa"
    else if (lowerObj.includes('pensar') || lowerObj.includes('falar com') || lowerObj.includes('analisar')) {
        suggestions.push({
            title: 'Compromisso de Tempo',
            tone: 'Empathetic',
            content: 'Claro, é uma decisão importante. Mas me diga, qual é a principal dúvida que ficou pendente para que vocês possam conversar com mais clareza?'
        });
        suggestions.push({
            title: 'Escassez Real',
            tone: 'Aggressive',
            content: 'Sem problemas. Só quero te avisar que as vagas para essa turma estão fechando. Se você decidir até amanhã, consigo segurar essa condição especial. Posso te ligar amanhã às 10h?'
        });
        suggestions.push({
            title: 'Perguntas Mágicas',
            tone: 'Logical',
            content: 'Você quer pensar sobre o valor ou sobre a metodologia? Se for a metodologia, eu posso te explicar melhor agora.'
        });
    }
    // Tática do "Já tenho outro"
    else if (lowerObj.includes('outro') || lowerObj.includes('concorrente') || lowerObj.includes('escola')) {
        suggestions.push({
            title: 'Diferenciação',
            tone: 'Logical',
            content: 'Que bom que você já investe em educação! O que te fez procurar a gente, mesmo já tendo outra escola? Talvez algo lá não esteja atendendo 100%?'
        });
    }
    // Genérico / Fallback
    else {
        suggestions.push({
            title: 'Técnica do Espelhamento',
            tone: 'Empathetic',
            content: `Entendo que "${objection}" seja uma questão. Pode me falar um pouco mais sobre por que isso te preocupa agora?`
        });
        suggestions.push({
            title: 'Sondagem Profunda',
            tone: 'Creative',
            content: 'Se a gente resolvesse esse ponto agora, haveria mais algum impedimento para fecharmos?'
        });
    }

    return suggestions;
};

export interface CoachInsight {
    type: 'warning' | 'tip' | 'praise';
    message: string;
    metric?: string;
}

export const getCoachInsights = (logs: any[]): CoachInsight[] => {
    // logs should be DailyLog[] but using any to avoid circular deps or complex type fetching for now
    const insights: CoachInsight[] = [];
    if (!logs || logs.length === 0) return [{ type: 'tip', message: 'Continue alimentando o diário para receber dicas personalizadas.' }];

    const lastLog = logs[0]; // Assuming sorted desc
    const conversionRate = lastLog.visitas > 0 ? (lastLog.matriculas / lastLog.visitas) : 0;

    // 1. Conversion Analysis
    if (lastLog.visitas > 3 && conversionRate < 0.2) {
        insights.push({
            type: 'warning',
            message: 'Sua conversão de visitas em matrículas está baixa (<20%).',
            metric: 'Revise suas técnicas de fechamento.'
        });
    } else if (lastLog.matriculas >= 2) {
        insights.push({
            type: 'praise',
            message: 'Excelente conversão ontem! Você está "on fire".',
            metric: 'Continue assim!'
        });
    }

    // 2. Volume Analysis
    if (lastLog.leads_contatados < 10 && lastLog.visitas === 0) {
        insights.push({
            type: 'warning',
            message: 'Volume de prospecção baixo ontem.',
            metric: 'Tente fazer pelo menos 15 contatos hoje.'
        });
    }

    // 3. Consistency
    if (logs.length >= 3) {
        const trend = logs.slice(0, 3).every((l, i, arr) => i === 0 || l.matriculas >= arr[i - 1].matriculas);
        if (trend) insights.push({ type: 'praise', message: 'Você vem melhorando seus resultados dia após dia!', metric: 'Consistência top!' });
    }

    if (insights.length === 0) {
        insights.push({ type: 'tip', message: 'Mantenha o foco nas metas diárias de visitas.' });
    }

    return insights;
};

// --- Smart Planner Logic ---

export interface DailyPlanSuggestion {
    activities: Activity[];
    summary: string;
}

export async function generateDailyPlanSuggestion(historyActivities: Activity[]): Promise<DailyPlanSuggestion> {
    if (!genAI) {
        console.warn("Gemini API Key not found. Falling back to mock data.");
        return generateMockDailyPlan(historyActivities);
    }

    try {
        const historyJson = JSON.stringify(historyActivities.slice(0, 20).map(a => ({
            nome: a.nome,
            categoria: a.categoria,
            status: a.status,
            meta_leads: a.meta_leads,
            horario_inicio: a.horario_inicio
        })));

        const prompt = `
        Analise o histórico de atividades recentes deste vendedor (JSON abaixo) e gere um plano de atividades para HOJE.
        
        Histórico:
        ${historyJson}
        
        Objetivo: Criar uma lista de 3 a 5 atividades focadas em melhorar os resultados.
        Se houve baixa prospecção recente, sugira prospecção.
        Se houve muitas visitas sem fechamento, sugira follow-up.
        
        Retorne APENAS um JSON com a seguinte estrutura:
        {
            "summary": "Um resumo motivacional curto explicando o foco do dia.",
            "activities": [
                {
                    "nome": "Nome da Atividade",
                    "categoria": "Prospecção" | "Follow-up" | "Reunião" | "Administrativo",
                    "horario_inicio": "09:00",
                    "horario_fim": "10:00",
                    "prioridade": "Alta" | "Média" | "Baixa",
                    "meta_leads": 10 // Opcional, meta numérica
                }
            ]
        }
        Certifique-se que o JSON seja válido.
        `;

        const text = await generateWithFallback(prompt);
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        // Map response to Activity type (adding IDs and colors)
        const mappedActivities: Activity[] = data.activities.map((act: any, index: number) => ({
            id: Date.now() + index, // Temp ID
            nome: act.nome,
            categoria: act.categoria,
            horario_inicio: act.horario_inicio,
            horario_fim: act.horario_fim,
            data: new Date().toISOString().split('T')[0],
            realizado: false,
            status: 'nao_iniciado',
            prioridade: act.prioridade,
            descricao: 'Sugestão automática do Gemini AI',
            cor: act.categoria === 'Prospecção' ? '#3b82f6' : act.categoria === 'Reunião' ? '#8b5cf6' : '#10b981',
            icone: act.categoria === 'Prospecção' ? '📞' : act.categoria === 'Reunião' ? '👥' : '📝',
            meta_leads: act.meta_leads
        }));

        return {
            summary: data.summary,
            activities: mappedActivities
        };

    } catch (error) {
        console.error("Gemini API Error:", error);
        return generateMockDailyPlan(historyActivities);
    }
}

function generateMockDailyPlan(historyActivities: Activity[]): DailyPlanSuggestion {
    // 1. Filter valid activities from history
    const baseActivities = historyActivities.filter(a => a.status !== 'cancelado');

    if (baseActivities.length === 0) {
        return { activities: [], summary: "Não encontramos atividades recentes para basear o planejamento." };
    }

    // 2. Calculate Momentum
    const completedCount = baseActivities.filter(a => a.status === 'concluido').length;
    const totalCount = baseActivities.length;
    const completionRate = totalCount > 0 ? completedCount / totalCount : 0;

    let momentumType: 'slump' | 'neutral' | 'streak' = 'neutral';
    if (completionRate < 0.5) momentumType = 'slump';
    if (completionRate > 0.9) momentumType = 'streak';

    const suggestedActivities: Activity[] = baseActivities.map((activity, index) => {
        // Deep copy
        const newActivity = { ...activity };

        // Reset IDs
        newActivity.id = Date.now() + index + Math.random();

        // Update Date/Status
        newActivity.status = 'nao_iniciado';
        newActivity.leads_contatados = 0;
        newActivity.visitas_realizadas = 0;
        newActivity.agendamentos_feitos = 0;

        // Smart Goal Adjustment (Adaptive Goals)
        if (activity.meta_leads && activity.meta_leads > 0) {
            if (momentumType === 'streak') {
                newActivity.meta_leads = Math.ceil(activity.meta_leads * 1.1);
            } else if (momentumType === 'slump') {
                newActivity.meta_leads = Math.ceil(activity.meta_leads * 0.8);
            }
        }

        return newActivity;
    });

    let summary = `Baseado no seu histórico recente (Ritmo: ${(completionRate * 100).toFixed(0)}%).`;
    if (momentumType === 'streak') {
        summary = "🚀 Você está voando! Aumentei levemente suas metas para te desafiar hoje.";
    } else if (momentumType === 'slump') {
        summary = "📉 Percebi que ontem foi difícil. Ajustei as metas para você recuperar o ritmo com tranquilidade.";
    } else {
        summary = "Mantique as metas equilibradas para hoje.";
    }

    return {
        activities: suggestedActivities,
        summary
    };
}
