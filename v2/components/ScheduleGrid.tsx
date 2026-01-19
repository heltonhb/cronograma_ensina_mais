'use client';

import React, { useState, useMemo } from 'react';
import { Activity } from '../types/activity';
import ScheduleBlock from './ScheduleBlock';
import KanbanCard from './KanbanCard';
import { useSchedule } from '../hooks/useSchedule';
import { useGamification } from '../hooks/useGamification';

type ViewMode = 'list' | 'kanban';

interface ScheduleGridProps {
    activities: Activity[];
    onActivityClick?: (activity: Activity) => void;
    onDeleteActivity?: (id: string | number) => void;
}

export default function ScheduleGrid({ activities, onActivityClick, onDeleteActivity }: ScheduleGridProps) {

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [filter, setFilter] = useState('all');
    const { updateActivityStatus } = useSchedule();
    const { addXP } = useGamification();
    const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);

    const handleStatusUpdate = async (id: string | number, newStatus: Activity['status']) => {
        await updateActivityStatus(id, newStatus);

        if (newStatus === 'concluido') {
            addXP(50, 'Atividade Concluída');
        }
    };

    const filteredActivities = useMemo(() => {
        return activities.filter(a => filter === 'all' || a.status === filter);
    }, [activities, filter]);

    const columns = [
        { id: 'nao_iniciado', label: 'A Fazer' },
        { id: 'em_andamento', label: 'Em Andamento' },
        { id: 'pausado', label: 'Aguardando' },
        { id: 'concluido', label: 'Concluído' },
        { id: 'cancelado', label: 'Cancelado' }
    ];

    const handleDragStart = (e: React.DragEvent, activity: Activity) => {
        setDraggedActivity(activity);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        if (draggedActivity && draggedActivity.status !== newStatus) {
            await handleStatusUpdate(draggedActivity.id, newStatus as Activity['status']);
            setDraggedActivity(null);
        }
    };

    return (
        <div className="mt-6">
            {/* Filters & Toggles Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">

                {/* Filter Chips - Wrapping for full visibility */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'nao_iniciado', label: 'Não Iniciado' },
                        { id: 'em_andamento', label: 'Em Andamento' },
                        { id: 'concluido', label: 'Concluído' }
                    ].map(status => (
                        <button
                            key={status.id}
                            onClick={() => setFilter(status.id)}
                            className={`
                                px-4 py-2 rounded-full text-sm font-medium transition-all grow md:grow-0
                                ${filter === status.id
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                                    : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                }
                            `}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 self-start md:self-auto">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    >
                        <span>📋</span> <span className="hidden sm:inline">Lista</span>
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    >
                        <span>📊</span> <span className="hidden sm:inline">Kanban</span>
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredActivities.map(activity => (
                        <ScheduleBlock
                            key={activity.id}
                            activity={activity}
                            onClick={onActivityClick}
                            onStatusChange={handleStatusUpdate}
                            onDelete={onDeleteActivity}
                        />

                    ))}
                </div>
            ) : (
                <div className="flex overflow-x-auto gap-4 pb-4">
                    {columns.map(col => (
                        <div
                            key={col.id}
                            className="min-w-[280px] bg-gray-100 dark:bg-zinc-900 rounded-xl p-3 border border-gray-200 dark:border-zinc-800"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className="flex justify-between items-center mb-3 px-1">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{col.label}</span>
                                <span className="bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
                                    {filteredActivities.filter(a => a.status === col.id).length}
                                </span>
                            </div>
                            <div className="flex flex-col gap-2 min-h-[100px]">
                                {filteredActivities.filter(a => a.status === col.id).map(activity => (
                                    <KanbanCard
                                        key={activity.id}
                                        activity={activity}
                                        onClick={onActivityClick}
                                        onDragStart={handleDragStart}
                                        onDelete={onDeleteActivity}
                                    />

                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
