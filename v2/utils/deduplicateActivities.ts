import { collection, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Activity } from '../types/activity';

export async function deduplicateActivities(userId: string) {
    if (!userId) return { count: 0, errors: 0 };

    const activitiesRef = collection(db, 'userData', userId, 'activities');
    const snapshot = await getDocs(activitiesRef);

    const activities: (Activity & { docId: string })[] = [];
    snapshot.forEach((doc) => {
        activities.push({
            ...(doc.data() as Activity),
            docId: doc.id
        });
    });

    // Group by signature
    const groups: { [key: string]: typeof activities } = {};

    activities.forEach(activity => {
        // Create a signature based on content that defines "identity"
        // Normalize: lowercase, trim
        const name = (activity.nome || '').toLowerCase().trim();
        const start = (activity.horario_inicio || '').trim();
        const end = (activity.horario_fim || '').trim();

        const signature = `${name}|${start}|${end}`;

        if (!groups[signature]) {
            groups[signature] = [];
        }
        groups[signature].push(activity);
    });

    let deletedCount = 0;
    let errorCount = 0;

    for (const signature in groups) {
        const group = groups[signature];
        if (group.length > 1) {
            // Found duplicates
            console.group(`Duplicate Group Found: ${signature}`);
            console.log(`Count: ${group.length}`);

            // Sort to keep the "best" one.
            // Criteria: 
            // 1. Most recent updatedAt
            // 2. Highest numerical ID (if ID is timestamp)

            group.sort((a, b) => { // ... (sorting logic remains same, assuming it works)
                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

                if (dateA !== dateB) {
                    return dateB - dateA; // Descending (Keep newest)
                }

                const idA = Number(a.id) || 0;
                const idB = Number(b.id) || 0;
                return idB - idA; // Descending
            });

            const toKeep = group[0];
            const toDelete = group.slice(1);

            console.log(`Keeping: ${toKeep.docId} (Updated: ${toKeep.updatedAt})`);

            for (const item of toDelete) {
                try {
                    console.log(`Deleting duplicate: ${item.docId} (Updated: ${item.updatedAt})`);
                    await deleteDoc(doc(db, 'userData', userId, 'activities', item.docId));
                    deletedCount++;
                } catch (e) {
                    console.error(`Failed to delete ${item.docId}`, e);
                    errorCount++;
                }
            }
            console.groupEnd();
        }
    }

    return { count: deletedCount, errors: errorCount };
}
