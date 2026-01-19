
import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    writeBatch,
    DocumentData,
    WriteBatch
} from 'firebase/firestore';

export interface BackupData {
    version: number;
    timestamp: string;
    userData: DocumentData;
    activities: DocumentData[];
    dailyLogs: DocumentData[];
    scheduleHistory: DocumentData[];
}

/**
 * Fetches all user data for a complete backup.
 */
export const fetchFullBackup = async (uid: string): Promise<BackupData> => {
    // 1. Fetch Core User Data (Profile, settings, scripts, gamification)
    const userDocRef = doc(db, 'userData', uid);
    const userSnap = await getDoc(userDocRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    // 2. Fetch Activities (Subcollection)
    const activitiesSnap = await getDocs(collection(db, 'userData', uid, 'activities'));
    const activities = activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 3. Fetch Daily Logs (Subcollection)
    const logsSnap = await getDocs(collection(db, 'userData', uid, 'dailyLogs'));
    const dailyLogs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 4. Fetch Schedule History (Subcollection)
    const historySnap = await getDocs(collection(db, 'userData', uid, 'scheduleHistory'));
    const scheduleHistory = historySnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return {
        version: 2, // Versioning for future compatibility
        timestamp: new Date().toISOString(),
        userData,
        activities,
        dailyLogs,
        scheduleHistory
    };
};

/**
 * Restores data from a backup object.
 * Uses batch writes to correctly restore subcollections.
 */
export const restoreBackup = async (uid: string, data: BackupData) => {
    if (!data || !data.userData) {
        throw new Error("Dados de backup inválidos ou corrompidos.");
    }

    // Helper to commit batches of 500 ops
    const commitBatch = async (ops: ((batch: WriteBatch) => void)[]) => {
        const chunkedOps = [];
        for (let i = 0; i < ops.length; i += 500) {
            chunkedOps.push(ops.slice(i, i + 500));
        }

        for (const chunk of chunkedOps) {
            const batch = writeBatch(db);
            chunk.forEach(op => op(batch));
            await batch.commit();
        }
    };

    const operations: ((batch: WriteBatch) => void)[] = [];

    // 1. Restore Core Data
    operations.push((batch) => {
        const ref = doc(db, 'userData', uid);
        batch.set(ref, data.userData, { merge: true });
    });

    // 2. Restore Activities
    if (data.activities) {
        data.activities.forEach(activity => {
            operations.push((batch) => {
                const ref = doc(db, 'userData', uid, 'activities', activity.id);
                batch.set(ref, activity);
            });
        });
    }

    // 3. Restore Daily Logs
    if (data.dailyLogs) {
        data.dailyLogs.forEach(log => {
            operations.push((batch) => {
                const ref = doc(db, 'userData', uid, 'dailyLogs', log.id);
                batch.set(ref, log);
            });
        });
    }

    // 4. Restore Schedule History
    if (data.scheduleHistory) {
        data.scheduleHistory.forEach(hist => {
            operations.push((batch) => {
                const ref = doc(db, 'userData', uid, 'scheduleHistory', hist.id);
                batch.set(ref, hist);
            });
        });
    }

    await commitBatch(operations);
};
