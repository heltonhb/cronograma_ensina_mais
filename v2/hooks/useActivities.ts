import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from '../types/activity';

export function useActivities() {
    const { user, loading: authLoading } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setActivities([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const activitiesRef = collection(db, 'userData', user.uid, 'activities');
        const unsubscribe = onSnapshot(activitiesRef, (snapshot) => {
            const loadedActivities: Activity[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data() as Activity;
                // Ensure ID is present. If missing in data (legacy), use doc.id
                loadedActivities.push({
                    ...data,
                    id: data.id || doc.id
                });
            });
            loadedActivities.sort((a, b) => (a.horario_inicio || '').localeCompare(b.horario_inicio || ''));
            setActivities(loadedActivities);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching activities:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);

    const updateActivityStatus = async (activityId: number | string, newStatus: Activity['status']) => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'userData', user.uid, 'activities', String(activityId)), {
                status: newStatus,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error updating activity status:", error);
        }
    };

    const deleteActivity = async (activityId: number | string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'userData', user.uid, 'activities', String(activityId)));
        } catch (error) {
            console.error("Error deleting activity:", error);
        }

    };

    const addActivity = async (activity: Activity) => {
        if (!user) return;
        try {
            // Ensure ID is string
            const id = String(activity.id || Date.now());
            await setDoc(doc(db, 'userData', user.uid, 'activities', id), {
                ...activity,
                id,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error adding activity:", error);
        }
    };

    return { activities, loading, updateActivityStatus, deleteActivity, addActivity };
}
