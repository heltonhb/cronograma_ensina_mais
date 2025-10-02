// firebase-config.js (ESM - SDK modular via CDN)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

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

// Inicializa o Firebase (SDK modular via CDN)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Expõe para o restante da aplicação (app.js usa window.auth/window.db e funções firebase.*)
window.auth = auth;
window.db = db;
window.firebase = {
  // auth
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  // firestore
  doc,
  setDoc,
  getDoc,
};