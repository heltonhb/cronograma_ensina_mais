import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAQiXJvYPHpoZUrQ8NYpKXF-IkZPNIemUU",
    authDomain: "cronograma-ensina-mais.firebaseapp.com",
    projectId: "cronograma-ensina-mais",
    storageBucket: "cronograma-ensina-mais.appspot.com",
    messagingSenderId: "502505921925",
    appId: "1:502505921925:web:90a5a84dc9863304fd78ec",
    measurementId: "G-CSGN1VSCYK"
};

// Initialize Firebase (Singleton pattern for Next.js to avoid re-initialization on hot reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable Offline Persistence
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Persistence failed: multiple tabs open.');
        } else if (err.code == 'unimplemented') {
            console.warn('Persistence failed: browser not supported.');
        }
    });
}
