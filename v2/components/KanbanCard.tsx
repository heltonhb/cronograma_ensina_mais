import React from 'react';
import { Activity } from '../types/activity';

interface KanbanCardProps {
    activity: Activity;
    onClick?: (activity: Activity) => void;
    onDragStart?: (e: React.DragEvent, activity: Activity) => void;
    onDelete?: (id: string | number) => void;
}

export default function KanbanCard({ activity, onClick, onDragStart, onDelete }: KanbanCardProps) {

    return (
        <div
            onClick={() => onClick && onClick(activity)}
            onDragStart={(e) => onDragStart && onDragStart(e, activity)}
            className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 mb-3 cursor-move hover:shadow-md transition-shadow"
            draggable
        >
            <div className="flex justify-between items-center mb-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{activity.horario_inicio}</span>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activity.cor }}></div>
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }}
                            className="text-gray-300 dark:text-zinc-600 hover:text-red-500 transition-colors"
                            title="Excluir"
                        >
                            &times;
                        </button>
                    )}
                </div>
            </div>

            <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-2">{activity.nome}</div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>{activity.categoria || 'Geral'}</span>
                <span>{activity.duracao}m</span>
            </div>
        </div>
    );
}
