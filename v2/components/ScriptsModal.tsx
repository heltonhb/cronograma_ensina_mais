'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ScriptPhase, ScriptItem } from '../types/scripts';
import { openWhatsAppChat } from '../services/whatsappService';

interface ScriptsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ScriptsModal({ isOpen, onClose }: ScriptsModalProps) {
    const { user } = useAuth();
    const [phases, setPhases] = useState<ScriptPhase[]>([]);
    const [activePhaseIndex, setActivePhaseIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // Mobile Navigation State
    const [showScriptsMobile, setShowScriptsMobile] = useState(false);

    // Modal States for Sub-actions
    const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
    const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);

    // Sub-forms Data
    const [editingPhaseIndex, setEditingPhaseIndex] = useState<number | null>(null);
    const [phaseFormData, setPhaseFormData] = useState({ phase: '', objective: '' });

    const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
    const [scriptFormData, setScriptFormData] = useState({ title: '', content: '', type: 'approach' });

    useEffect(() => {
        if (isOpen && user) {
            loadScripts();
        }
    }, [isOpen, user]);

    const loadScripts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const docRef = doc(db, 'userData', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().script_phases) {
                setPhases(docSnap.data().script_phases);
            } else {
                setPhases([]);
            }
        } catch (error) {
            console.error("Error loading scripts:", error);
        } finally {
            setLoading(false);
        }
    };

    const savePhasesToFirestore = async (newPhases: ScriptPhase[]) => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'userData', user.uid), {
                script_phases: newPhases
            }, { merge: true });
            setPhases(newPhases);
        } catch (error) {
            console.error("Error saving scripts:", error);
            alert("Erro ao salvar dados.");
        }
    };

    // --- Phase Actions ---
    const handleOpenPhaseModal = (index: number | null = null) => {
        setEditingPhaseIndex(index);
        if (index !== null) {
            setPhaseFormData({
                phase: phases[index].phase,
                objective: phases[index].objective
            });
        } else {
            setPhaseFormData({ phase: '', objective: '' });
        }
        setIsPhaseModalOpen(true);
    };

    const handleSavePhase = async () => {
        const newPhases = [...phases];
        const phaseData = {
            phase: phaseFormData.phase,
            objective: phaseFormData.objective,
            scripts: editingPhaseIndex !== null ? newPhases[editingPhaseIndex].scripts : []
        };

        if (editingPhaseIndex !== null) {
            newPhases[editingPhaseIndex] = phaseData;
        } else {
            newPhases.push(phaseData);
            setActivePhaseIndex(newPhases.length - 1);
        }

        await savePhasesToFirestore(newPhases);
        setIsPhaseModalOpen(false);
    };

    const handleDeletePhase = async (index: number) => {
        if (confirm("Tem certeza que deseja excluir esta fase e todos os seus scripts?")) {
            const newPhases = phases.filter((_, i) => i !== index);
            if (activePhaseIndex >= index && activePhaseIndex > 0) {
                setActivePhaseIndex(activePhaseIndex - 1);
            }
            await savePhasesToFirestore(newPhases);
            if (newPhases.length === 0) setShowScriptsMobile(false);
        }
    };

    const handlePhaseClick = (index: number) => {
        setActivePhaseIndex(index);
        setShowScriptsMobile(true);
    }

    // --- Script Actions ---
    const handleOpenScriptModal = (scriptId: string | null = null) => {
        setEditingScriptId(scriptId);
        if (scriptId !== null) {
            const script = phases[activePhaseIndex].scripts.find(s => s.id === scriptId);
            if (script) {
                setScriptFormData({
                    title: script.title,
                    content: script.content,
                    type: script.type as any
                });
            }
        } else {
            setScriptFormData({ title: '', content: '', type: 'approach' });
        }
        setIsScriptModalOpen(true);
    };

    const handleSaveScript = async () => {
        const newPhases = [...phases];
        const currentPhase = newPhases[activePhaseIndex];

        const scriptData: ScriptItem = {
            id: editingScriptId || Date.now().toString(),
            title: scriptFormData.title,
            content: scriptFormData.content,
            type: scriptFormData.type as any
        };

        if (editingScriptId) {
            const idx = currentPhase.scripts.findIndex(s => s.id === editingScriptId);
            if (idx !== -1) currentPhase.scripts[idx] = scriptData;
        } else {
            if (!currentPhase.scripts) currentPhase.scripts = [];
            currentPhase.scripts.push(scriptData);
        }

        await savePhasesToFirestore(newPhases);
        setIsScriptModalOpen(false);
    };

    const handleDeleteScript = async (scriptId: string) => {
        if (confirm("Excluir este script?")) {
            const newPhases = [...phases];
            const currentPhase = newPhases[activePhaseIndex];
            currentPhase.scripts = currentPhase.scripts.filter(s => s.id !== scriptId);
            await savePhasesToFirestore(newPhases);
        }
    };

    // --- Utility Actions ---
    const handleSendWhatsApp = (content: string) => {
        const phone = prompt("Digite o número do cliente (DDD + Número):");
        if (phone) {
            openWhatsAppChat(phone, content);
        }
    };

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        alert("Copiado!");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col md:flex-row overflow-hidden">

                {/* Sidebar - Phases */}
                <div className={`${showScriptsMobile ? 'hidden' : 'flex'} md:flex w-full md:w-1/4 min-w-[250px] h-full md:border-r border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 flex-col`}>
                    <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-gray-50 dark:bg-zinc-950 z-10">
                        <div className="flex items-center gap-2">
                            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Fechar">✕</button>
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Fases</h3>
                        </div>
                        <button onClick={() => handleOpenPhaseModal()} className="text-blue-600 hover:text-blue-700 font-bold text-xl">+</button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {phases.map((phase, index) => (
                            <div
                                key={index}
                                onClick={() => handlePhaseClick(index)}
                                className={`p-4 cursor-pointer hover:bg-white dark:hover:bg-zinc-900 border-b border-gray-100 dark:border-zinc-900 transition-colors ${activePhaseIndex === index ? 'bg-white dark:bg-zinc-900 border-l-4 border-l-blue-600' : ''}`}
                            >
                                <div className="font-medium text-gray-800 dark:text-gray-200">{phase.phase}</div>
                                <div className="text-xs text-gray-500 truncate">{phase.scripts?.length || 0} scripts</div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-zinc-800 hidden md:block">
                        <button onClick={onClose} className="w-full py-2 bg-gray-200 dark:bg-zinc-800 rounded text-sm font-medium">Fechar</button>
                    </div>
                </div>

                {/* Main Content - Scripts */}
                <div className={`${!showScriptsMobile ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-white dark:bg-zinc-900 h-full`}>
                    {phases.length > 0 ? (
                        <>
                            <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                <div>
                                    <button
                                        onClick={() => setShowScriptsMobile(false)}
                                        className="md:hidden mb-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        ← Voltar para Fases
                                    </button>
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{phases[activePhaseIndex].phase}</h2>
                                    <p className="text-gray-600 dark:text-gray-400">{phases[activePhaseIndex].objective}</p>
                                </div>
                                <div className="flex gap-2 self-end md:self-auto">
                                    <button onClick={() => handleOpenPhaseModal(activePhaseIndex)} className="p-2 text-gray-500 hover:bg-gray-100 rounded" title="Editar Fase">✏️</button>
                                    <button onClick={() => handleDeletePhase(activePhaseIndex)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Excluir Fase">🗑️</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {phases[activePhaseIndex].scripts?.length === 0 && (
                                    <div className="text-center text-gray-500 mt-10">
                                        Nenhum script nesta fase. <br />
                                        <button onClick={() => handleOpenScriptModal()} className="text-blue-600 font-medium hover:underline mt-2">Adicionar o primeiro script</button>
                                    </div>
                                )}

                                {phases[activePhaseIndex].scripts?.map((script) => (
                                    <div key={script.id} className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-5 border border-gray-200 dark:border-zinc-700">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">{script.title}</h4>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenScriptModal(script.id)} className="text-gray-400 hover:text-blue-500">✏️</button>
                                                <button onClick={() => handleDeleteScript(script.id)} className="text-gray-400 hover:text-red-500">🗑️</button>
                                            </div>
                                        </div>
                                        <div
                                            className="bg-white dark:bg-zinc-900 p-4 rounded border border-gray-200 dark:border-zinc-700 font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4"
                                            dangerouslySetInnerHTML={{ __html: script.content }}
                                        />
                                        <div className="flex gap-3 flex-wrap">
                                            <button
                                                onClick={() => handleCopy(script.content)}
                                                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-zinc-700 rounded hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                                            >
                                                📋 Copiar
                                            </button>
                                            <button
                                                onClick={() => handleSendWhatsApp(script.content)}
                                                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                            >
                                                📱 WhatsApp
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
                                <button
                                    onClick={() => handleOpenScriptModal()}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                                >
                                    ➕ Adicionar Novo Script
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <p className="mb-4">Nenhuma fase criada.</p>
                            <button onClick={() => handleOpenPhaseModal()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Criar Primeira Fase</button>
                        </div>
                    )}
                </div>

            </div>

            {/* Sub-Modal: Phase Form */}
            {isPhaseModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">{editingPhaseIndex !== null ? 'Editar Fase' : 'Nova Fase'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome da Fase</label>
                                <input
                                    className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                                    value={phaseFormData.phase}
                                    onChange={e => setPhaseFormData({ ...phaseFormData, phase: e.target.value })}
                                    placeholder="Ex: Abordagem Inicial"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Objetivo</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                                    value={phaseFormData.objective}
                                    onChange={e => setPhaseFormData({ ...phaseFormData, objective: e.target.value })}
                                    placeholder="Ex: Qualificar o lead e agendar visita"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setIsPhaseModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                <button onClick={handleSavePhase} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-Modal: Script Form */}
            {isScriptModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">{editingScriptId ? 'Editar Script' : 'Novo Script'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Título</label>
                                <input
                                    className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                                    value={scriptFormData.title}
                                    onChange={e => setScriptFormData({ ...scriptFormData, title: e.target.value })}
                                    placeholder="Ex: Mensagem de Boas-vindas"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Conteúdo</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white h-32 font-mono text-sm"
                                    value={scriptFormData.content}
                                    onChange={e => setScriptFormData({ ...scriptFormData, content: e.target.value })}
                                    placeholder="Olá [Nome], tudo bem?..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setIsScriptModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                <button onClick={handleSaveScript} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
