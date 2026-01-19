'use client';

import React from 'react';
import { useTemplates } from '../contexts/TemplatesContext';
import TemplateCard from './TemplateCard';

export default function TemplatesList() {
    const { systemTemplates, userTemplates, loading, deleteTemplate, applyTemplate } = useTemplates();

    if (loading) {
        return <div className="p-4 text-center text-gray-500">Carregando templates...</div>;
    }

    return (
        <div className="space-y-6">
            {/* System Templates */}
            <section>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Modelos do Sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {systemTemplates.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onApply={applyTemplate}
                        />
                    ))}
                    {systemTemplates.length === 0 && (
                        <p className="text-gray-500 text-sm">Nenhum modelo de sistema disponível.</p>
                    )}
                </div>
            </section>

            {/* User Templates */}
            <section>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Meus Modelos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userTemplates.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onApply={applyTemplate}
                            onDelete={deleteTemplate}
                            isCustom={true}
                        />
                    ))}
                    {userTemplates.length === 0 && (
                        <div className="col-span-1 md:col-span-2 text-center py-6 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Você ainda não criou nenhum template.
                                <br />
                                <span className="text-xs text-gray-400">(Funcionalidade de criar templates em breve)</span>
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
