// firebase-config.js

// Cole aqui o objeto de configuração que você copiou do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAQiXJvYPHpoZUrQ8NYpKXF-IkZPNIemUU",
  authDomain: "cronograma-ensina-mais.firebaseapp.com",
  projectId: "cronograma-ensina-mais",
  storageBucket: "cronograma-ensina-mais.firebasestorage.app",
  messagingSenderId: "502505921925",
  appId: "1:502505921925:web:90a5a84dc9863304fd78ec",
  measurementId: "G-CSGN1VSCYK"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Disponibiliza as funcionalidades que vamos usar para o resto da aplicação
const auth = firebase.auth();
const db = firebase.firestore();