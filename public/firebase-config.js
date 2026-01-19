// Importa as funções do SDK do Firebase via CDN (necessário para module type)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Cole aqui o objeto de configuração que você copiou do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAQiXJvYPHpoZUrQ8NYpKXF-IkZPNIemUU",
    authDomain: "cronograma-ensina-mais.firebaseapp.com",
    projectId: "cronograma-ensina-mais",
    storageBucket: "cronograma-ensina-mais.appspot.com",
    messagingSenderId: "502505921925",
    appId: "1:502505921925:web:90a5a84dc9863304fd78ec",
    measurementId: "G-CSGN1VSCYK"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e EXPORTA os serviços (Isso corrige o erro "does not provide an export")
export const auth = getAuth(app);
export const db = getFirestore(app);

// Cria e EXPORTA o objeto auxiliar que seu app.js espera
export const firebaseFunctions = {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where
};