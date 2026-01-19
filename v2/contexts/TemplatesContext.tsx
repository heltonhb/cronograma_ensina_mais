'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useToast } from './ToastContext'; // Assuming you have a ToastContext
import { Activity } from '../types/activity';

export interface Template {
    id: string;
    nome: string;
    descricao?: string;
    atividades: Activity[];
    isSystem?: boolean; // To distinguish system templates
}

interface TemplatesContextType {
    userTemplates: Template[];
    systemTemplates: Template[];
    loading: boolean;
    saveTemplate: (template: Template) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;
    applyTemplate: (template: Template) => Promise<void>;
}

const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

// System Templates (Hardcoded for now as per legacy usually, or fetch from a 'system_templates' collection)
const INITIAL_SYSTEM_TEMPLATES: Template[] = [
    {
        id: 'sys_base',
        nome: 'Dia Padrão de Vendas',
        descricao: 'Estrutura básica com prospecção e follow-up',
        atividades: [
            { id: 't1_1', nome: 'Planejamento e Café', horario_inicio: '08:00', horario_fim: '08:30', categoria: 'Preparação', status: 'nao_iniciado', cor: '#fab1a0', icone: '☕', tipo: 'Obrigatória', prioridade: 'Alta' },
            { id: 't1_2', nome: 'Prospecção Fria', horario_inicio: '09:00', horario_fim: '11:00', categoria: 'Prospecção', status: 'nao_iniciado', cor: '#74b9ff', icone: '📞', tipo: 'Obrigatória', prioridade: 'Alta' },
            { id: 't1_3', nome: 'Follow-up Clientes', horario_inicio: '14:00', horario_fim: '16:00', categoria: 'Follow-up', status: 'nao_iniciado', cor: '#a29bfe', icone: '📧', tipo: 'Obrigatória', prioridade: 'Média' }
        ],
        isSystem: true
    }
];

export function TemplatesProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [userTemplates, setUserTemplates] = useState<Template[]>([]);
    const [systemTemplates] = useState<Template[]>(INITIAL_SYSTEM_TEMPLATES);
    const [loading, setLoading] = useState(true);

    // Load User Templates
    useEffect(() => {
        if (!user) {
            setUserTemplates([]);
            setLoading(false);
            return;
        }

        const fetchTemplates = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, 'userData', user.uid, 'templates'));
                const querySnapshot = await getDocs(q);
                const fetchedTemplates: Template[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedTemplates.push(doc.data() as Template);
                });
                setUserTemplates(fetchedTemplates);
            } catch (error) {
                console.error("Error fetching templates:", error);
                showToast("Erro ao carregar templates.", 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, [user, showToast]);

    const saveTemplate = async (template: Template) => {
        if (!user) return;
        try {
            const templateRef = doc(db, 'userData', user.uid, 'templates', template.id);
            await setDoc(templateRef, template);
            setUserTemplates(prev => {
                const index = prev.findIndex(t => t.id === template.id);
                if (index >= 0) {
                    const newTemplates = [...prev];
                    newTemplates[index] = template;
                    return newTemplates;
                }
                return [...prev, template];
            });
            showToast("Template salvo com sucesso!", 'success');
        } catch (error) {
            console.error("Error saving template:", error);
            showToast("Erro ao salvar template.", 'error');
            throw error;
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'userData', user.uid, 'templates', id));
            setUserTemplates(prev => prev.filter(t => t.id !== id));
            showToast("Template excluído.", 'success');
        } catch (error) {
            console.error("Error deleting template:", error);
            showToast("Erro ao excluir template.", 'error');
            throw error;
        }
    };

    const applyTemplate = async (template: Template) => {
        if (!user) {
            showToast("Você precisa estar logado.", 'warning');
            return;
        }

        try {
            // Use writeBatch for atomic operation
            const batch = writeBatch(db);

            // 1. Get all current activities to delete
            const activitiesRef = collection(db, 'userData', user.uid, 'activities');
            const currentActivitiesSnap = await getDocs(activitiesRef);

            currentActivitiesSnap.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // 2. Add new activities from template
            template.atividades.forEach((activity) => {
                // Generate new ID for the instance
                const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                const newActivity = {
                    ...activity,
                    id: newId,
                    status: 'nao_iniciado', // Reset status
                    // Preserve times from template
                };
                const newActivityRef = doc(db, 'userData', user.uid, 'activities', newId);
                batch.set(newActivityRef, newActivity);
            });

            // 3. Commit batch
            await batch.commit();

            showToast(`Template "${template.nome}" aplicado. O cronograma foi substituído.`, 'success');
        } catch (error) {
            console.error("Error applying template:", error);
            showToast("Erro ao aplicar template.", 'error');
            throw error;
        }
    };

    return (
        <TemplatesContext.Provider value={{ userTemplates, systemTemplates, loading, saveTemplate, deleteTemplate, applyTemplate }}>
            {children}
        </TemplatesContext.Provider>
    );
}

export function useTemplates() {
    const context = useContext(TemplatesContext);
    if (context === undefined) {
        throw new Error('useTemplates must be used within a TemplatesProvider');
    }
    return context;
}
