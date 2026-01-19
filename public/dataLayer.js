// /core/dataLayer.js

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase.js";
import { setState } from "./state.js";
import { emit } from "./events.js";

/**
 * Helper centralizado para merges seguros
 */
async function safeMerge(path, data) {
    const ref = doc(db, path);
    try {
        await updateDoc(ref, data);
    } catch (e) {
        // Se updateDoc falhar (doc não existe), cria o doc
        await setDoc(ref, data, { merge: true });
    }
}

/**
 * DataLayer: comunicação padrão com Firestore
 */
export const DataLayer = {

    user: {
        /**
         * Carrega todos os dados do usuário
         * e inicializa o state.js com esses dados.
         */
        async load(uid) {
            const userRef = doc(db, "users", uid);
            const snap = await getDoc(userRef);

            if (!snap.exists()) {
                // Criação padrão do documento
                const baseData = {
                    uid,
                    createdAt: serverTimestamp(),
                    blocos_atividades: [],
                    dailyLogs: {},
                    scheduleHistory: [],
                    settings: {},
                };
                await setDoc(userRef, baseData, { merge: true });
                setState(baseData);
                return baseData;
            }

            const data = snap.data();

            // injeta no estado global
            setState(data);

            emit("user:data-loaded", data);

            return data;
        },
    },

    schedule: {
        /**
         * Atualiza qualquer parte do cronograma
         */
        async update(uid, newSchedule) {
            await safeMerge(`users/${uid}`, {
                blocos_atividades: newSchedule,
                updatedAt: serverTimestamp(),
            });

            // Atualiza estado local
            setState({ blocos_atividades: newSchedule });

            emit("schedule:updated", newSchedule);
        }
    },

    logs: {
        /**
         * Adiciona uma entrada no dailyLog
         */
        async add(uid, dateKey, payload) {
            const fieldPath = `dailyLogs.${dateKey}`;
            await safeMerge(`users/${uid}`, {
                [fieldPath]: payload,
                updatedAt: serverTimestamp(),
            });

            // Atualiza estado local
            const currentLogs = getState("dailyLogs") || {};
            currentLogs[dateKey] = payload;
            setState({ dailyLogs: currentLogs });

            emit("logs:added", { dateKey, payload });
        }
    },

    history: {
        /**
         * Arquiva uma versão do cronograma
         */
        async archive(uid, snapshotData) {
            const ref = collection(db, `users/${uid}/scheduleHistory`);

            await addDoc(ref, {
                ...snapshotData,
                createdAt: serverTimestamp(),
            });

            emit("history:archived", snapshotData);
        }
    },
};
