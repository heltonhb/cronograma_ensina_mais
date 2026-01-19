'use client';

import React, { useState } from 'react';
import TemplatesList from './TemplatesList';
import { Activity } from '../types/activity';
import { useTemplates } from '../contexts/TemplatesContext';

interface TemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentActivities?: Activity[];
}

export default function TemplatesModal({ isOpen, onClose, currentActivities = [] }: TemplatesModalProps) {
    const { saveTemplate } = useTemplates();
    const [templateName, setTemplateName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSaveCurrentDay = async () => {
        if (!templateName.trim()) {
            alert("Por favor, digite um nome para o modelo.");
            return;
        }

        if (currentActivities.length === 0) {
            alert("Não há atividades no dia atual para salvar como modelo.");
            return;
        }

        setIsSaving(true);
        try {
            const newTemplate = {
                id: Date.now().toString(),
                nome: templateName,
                descricao: `Modelo criado a partir do dia com ${currentActivities.length} atividades.`,
                atividades: currentActivities,
                isSystem: false
            };

            await saveTemplate(newTemplate);
            setTemplateName(''); // Reset input
            // Optionally close or stay open? Let's stay open to see the new template.
        } catch (error) {
            console.error("Failed to save template", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl p-6 m-4 max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl z-10"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-bold dark:text-white mb-6">Gerenciar Modelos</h2>

                {/* Save Current Day Section */}
                <div className="bg-blue-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-blue-100 dark:border-zinc-700 mb-6 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                            Salvar dia atual como novo modelo
                        </label>
                        <input
                            type="text"
                            placeholder="Nome do modelo (ex: Segunda-feira Ideal)"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSaveCurrentDay}
                        disabled={isSaving || currentActivities.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-[42px]"
                    >
                        {isSaving ? 'Salvando...' : '💾 Salvar Modelo'}
                    </button>
                </div>

                <TemplatesList />

                <div className="mt-8 flex justify-end pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
