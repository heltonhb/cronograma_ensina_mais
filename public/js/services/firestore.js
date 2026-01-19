// js/services/firestore.js
import { db, firebaseFunctions } from '../../firebase-config.js';

// Nomes das coleções para evitar strings mágicas espalhadas
const COLLECTIONS = {
    USER_DATA: 'userData',
    LOGS: 'dailyLogs',
    HISTORY: 'scheduleHistory',
    ACTIVITIES: 'activities' // <--- NOVA CONSTANTE
};

// --- FUNÇÕES ATÔMICAS (FASE 1) ---

/**
 * Salva ou Atualiza uma Única Atividade na subcoleção.
 * Substitui o salvamento em massa dentro do array principal.
 */
export const saveActivityAtomic = async (uid, activity) => {
    try {
        // Usa o ID da atividade como ID do documento (convertido para string)
        const activityRef = firebaseFunctions.doc(db, COLLECTIONS.USER_DATA, uid, COLLECTIONS.ACTIVITIES, String(activity.id));
        
        // merge: true garante que se adicionarmos campos novos no futuro, não quebramos os antigos
        return firebaseFunctions.setDoc(activityRef, activity, { merge: true });
    } catch (error) {
        console.error("Erro ao salvar atividade atômica:", error);
        throw error;
    }
};

/**
 * Atualiza apenas campos específicos (ex: status) sem reescrever a atividade toda.
 */
export const updateActivityStatusAtomic = async (uid, activityId, newStatus) => {
    try {
        const activityRef = firebaseFunctions.doc(db, COLLECTIONS.USER_DATA, uid, COLLECTIONS.ACTIVITIES, String(activityId));
        return firebaseFunctions.updateDoc(activityRef, { 
            status: newStatus,
            updatedAt: new Date().toISOString() // Útil para sincronização
        });
    } catch (error) {
        console.error("Erro ao atualizar status atômico:", error);
        throw error;
    }
};

/**
 * Remove uma atividade específica da subcoleção.
 */
export const deleteActivityAtomic = async (uid, activityId) => {
    try {
        const activityRef = firebaseFunctions.doc(db, COLLECTIONS.USER_DATA, uid, COLLECTIONS.ACTIVITIES, String(activityId));
        return firebaseFunctions.deleteDoc(activityRef);
    } catch (error) {
        console.error("Erro ao deletar atividade atômica:", error);
        throw error;
    }
};

/**
 * Busca todas as atividades da subcoleção 'activities'.
 */
export const fetchAtomicActivities = async (uid) => {
    try {
        const activitiesQuery = firebaseFunctions.collection(db, COLLECTIONS.USER_DATA, uid, COLLECTIONS.ACTIVITIES);
        const querySnapshot = await firebaseFunctions.getDocs(activitiesQuery);
        
        const activities = [];
        querySnapshot.forEach((doc) => {
            activities.push(doc.data());
        });
        return activities;
    } catch (error) {
        console.error("Erro ao buscar atividades atômicas:", error);
        return [];
    }
};

// --- FUNÇÕES DE CARGA E SALVAMENTO GERAL (MODIFICADAS) ---

/**
 * Carrega todos os dados do usuário.
 * AGORA: Busca atividades na subcoleção e as "monta" no objeto core para o app usar.
 */
export const fetchFullUserData = async (uid) => {
    try {
        const userDocRef = firebaseFunctions.doc(db, COLLECTIONS.USER_DATA, uid);
        const userSnap = await firebaseFunctions.getDoc(userDocRef);

        let data = { exists: false, core: {}, dailyLogs: {}, scheduleHistory: {} };

        if (userSnap.exists()) {
            data.exists = true;
            data.core = userSnap.data();

            // 1. Busca Logs Diários (Subcoleção)
            const logsQuery = firebaseFunctions.collection(db, COLLECTIONS.USER_DATA, uid, COLLECTIONS.LOGS);
            const logsSnap = await firebaseFunctions.getDocs(logsQuery);
            logsSnap.forEach(doc => {
                data.dailyLogs[doc.id] = doc.data();
            });

            // 2. Busca Histórico (Subcoleção)
            const historyQuery = firebaseFunctions.collection(db, COLLECTIONS.USER_DATA, uid, COLLECTIONS.HISTORY);
            const historySnap = await firebaseFunctions.getDocs(historyQuery);
            historySnap.forEach(doc => {
                data.scheduleHistory[doc.id] = doc.data().activities;
            });

            // 3. (NOVO) Busca Atividades Atômicas (Subcoleção)
            const atomicActivities = await fetchAtomicActivities(uid);
            
            // LÓGICA HÍBRIDA/MIGRAÇÃO:
            // Se existirem atividades na subcoleção, usamos elas.
            // Se não, usamos o array antigo que veio do 'core' (caso o usuário ainda não tenha migrado).
            if (atomicActivities.length > 0) {
                data.core.blocos_atividades = atomicActivities;
            } else {
                data.core.blocos_atividades = data.core.blocos_atividades || [];
            }
        }
        
        return data;
    } catch (error) {
        console.error("Erro no serviço firestore/fetchFullUserData:", error);
        throw error;
    }
};

/**
 * Salva os dados principais (Config, Templates, Gamification).
 * MODIFICADO: Agora REMOVEMOS 'blocos_atividades' daqui para não duplicar dados.
 */
export const saveCoreData = async (uid, coreData) => {
    // Segurança: Removemos logs, histórico E AGORA as atividades
    // para garantir que o doc principal fique leve e contenha apenas configurações/perfil.
    const { 
        dailyLogs, 
        scheduleHistory, 
        autoSnapshots, 
        blocos_atividades, // <--- REMOVIDO DO SAVE PRINCIPAL
        ...safeData 
    } = coreData;
    
    const userDocRef = firebaseFunctions.doc(db, COLLECTIONS.USER_DATA, uid);
    return firebaseFunctions.setDoc(userDocRef, safeData, { merge: true });
};

/**
 * Salva um log diário específico na subcoleção.
 */
export const saveDailyLogEntry = async (uid, date, logData) => {
    const logDocRef = firebaseFunctions.doc(db, COLLECTIONS.USER_DATA, uid, COLLECTIONS.LOGS, date);
    return firebaseFunctions.setDoc(logDocRef, logData);
};

/**
 * Salva o histórico de um dia específico na subcoleção.
 */
export const saveScheduleHistoryEntry = async (uid, date, activities) => {
    const historyDocRef = firebaseFunctions.doc(db, COLLECTIONS.USER_DATA, uid, COLLECTIONS.HISTORY, date);
    return firebaseFunctions.setDoc(historyDocRef, { activities });
};