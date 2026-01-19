'use client';

import React from 'react';
import { Template } from '../contexts/TemplatesContext';

interface TemplateCardProps {
    template: Template;
    onApply: (template: Template) => void;
    onDelete?: (id: string) => void;
    isCustom?: boolean;
}

export default function TemplateCard({ template, onApply, onDelete, isCustom }: TemplateCardProps) {
    return (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg line-clamp-1" title={template.nome}>
                        {template.nome}
                    </h3>
                    {/* Badge count */}
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {template.atividades.length} ativ.
                    </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5em]">
                    {template.descricao || 'Sem descrição.'}
                </p>
            </div>

            <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-zinc-700">
                <button
                    onClick={() => onApply(template)}
                    className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    title="Aplicar Template"
                >
                    ✅ Aplicar
                </button>

                {isCustom && onDelete && (
                    <button
                        onClick={() => onDelete(template.id)}
                        className="bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-md text-sm transition-colors"
                        title="Excluir Template"
                    >
                        🗑️
                    </button>
                )}
            </div>
        </div>
    );
}
