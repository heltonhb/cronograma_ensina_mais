
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                // Optionally add user profile creation logic here later
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (err: any) {
            console.error("Auth error:", err);
            let msg = 'Falha na autenticação.';

            if (err.code === 'auth/email-already-in-use') msg = 'Este email já está cadastrado.';
            else if (err.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres.';
            else if (err.code === 'auth/invalid-credential') msg = 'Email ou senha incorretos.';
            else if (err.code === 'auth/user-not-found') msg = 'Usuário não encontrado.';
            else if (err.code === 'auth/wrong-password') msg = 'Senha incorreta.';

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 m-4"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold dark:text-white">
                                {isSignUp ? 'Criar Conta' : 'Entrar'}
                            </h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                                    <span className="block sm:inline">{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isSignUp ? "Mínimo 6 caracteres" : ""}
                                />
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
                                >
                                    {loading ? 'Processando...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:underline text-center"
                                >
                                    {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
