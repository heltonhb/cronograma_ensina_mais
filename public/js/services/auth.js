// js/services/auth.js

// Ajuste o caminho do import conforme a sua estrutura de pastas.
// Se o firebase-config.js estiver na raiz e este ficheiro em /js/services, o caminho é ../../firebase-config.js
import { auth, firebaseFunctions } from '../../firebase-config.js'; 

/**
 * Tenta fazer login com email e password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise}
 */
export const loginUser = (email, password) => {
    return firebaseFunctions.signInWithEmailAndPassword(auth, email, password);
};

/**
 * Cria um novo utilizador.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise}
 */
export const registerUser = (email, password) => {
    return firebaseFunctions.createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Faz logout do utilizador atual.
 * @returns {Promise}
 */
export const logoutUser = () => {
    return firebaseFunctions.signOut(auth);
};

/**
 * Observa mudanças no estado de autenticação (Login/Logout).
 * Aceita callbacks para executar ações específicas em cada estado.
 * * @param {Object} callbacks
 * @param {Function} callbacks.onLogin - Executada quando o user faz login
 * @param {Function} callbacks.onLogout - Executada quando o user faz logout
 */
export const initAuthObserver = ({ onLogin, onLogout }) => {
    return firebaseFunctions.onAuthStateChanged(auth, (user) => {
        if (user) {
            onLogin(user);
        } else {
            onLogout();
        }
    });
};