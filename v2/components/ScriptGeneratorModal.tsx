'use client';

import React, { useState } from 'react';
import { generateScript, ScriptSuggestion } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';

interface ScriptGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ScriptGeneratorModal({ isOpen, onClose }: ScriptGeneratorModalProps) {
    const [objection, setObjection] = useState('');
    const [suggestions, setSuggestions] = useState<ScriptSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!objection.trim()) return;

        setIsLoading(true);
        try {
            const results = await generateScript(objection);
            setSuggestions(results);
        } catch (error) {
            console.error("Erro ao gerar script:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Script copiado!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-800 overflow-hidden m-4 max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 md:p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                            🤖 AI Objection Killer
                        </h2>
                        <p className="text-purple-200 text-sm">Digite o que o cliente disse e receba a resposta perfeita.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 md:p-6 overflow-y-auto">
                    <div className="flex flex-col md:flex-row gap-2">
                        <input
                            type="text"
                            placeholder="Ex: Está caro, vou pensar..."
                            value={objection}
                            onChange={(e) => setObjection(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={!objection.trim() || isLoading}
                            className={`px-6 py-3 rounded-lg font-bold text-white transition-all whitespace-nowrap ${!objection.trim() || isLoading
                                ? 'bg-gray-700 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/50 hover:scale-105 active:scale-95'
                                }`}
                        >
                            {isLoading ? 'Gerando...' : 'Gerar'}
                        </button>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-4">
                        <AnimatePresence>
                            {suggestions.map((script, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-purple-500/50 transition-colors group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded textxs font-bold uppercase tracking-wide
                                                ${script.tone === 'Empathetic' ? 'bg-green-900/50 text-green-400' :
                                                    script.tone === 'Aggressive' ? 'bg-red-900/50 text-red-400' :
                                                        script.tone === 'Logical' ? 'bg-blue-900/50 text-blue-400' :
                                                            'bg-yellow-900/50 text-yellow-400'
                                                }
                                            `}>
                                                {script.tone}
                                            </span>
                                            <h3 className="font-semibold text-gray-200">{script.title}</h3>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(script.content)}
                                            className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-gray-300 transition-colors md:opacity-0 md:group-hover:opacity-100 opacity-100"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed italic">
                                        "{script.content}"
                                    </p>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {suggestions.length === 0 && !isLoading && (
                            <div className="text-center text-gray-600 py-12">
                                <span className="text-4xl block mb-2">💬</span>
                                <p>Aguardando objeção do cliente...</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
