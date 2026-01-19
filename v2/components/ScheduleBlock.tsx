import React from 'react';
import { Activity } from '../types/activity';
import { calculateLeadScore } from '../services/aiService';
import { openWhatsAppChat } from '../services/whatsappService';

const statusColors = {
    nao_iniciado: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    em_andamento: 'bg-yellow-100 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    pausado: 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    concluido: 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    cancelado: 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
};

const statusLabels = {
    nao_iniciado: 'Não Iniciado',
    em_andamento: 'Em Andamento',
    pausado: 'Pausado',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
};

interface ScheduleBlockProps {
    activity: Activity;
    onClick?: (activity: Activity) => void;
    onStatusChange?: (id: string | number, newStatus: Activity['status']) => void;
    onDelete?: (id: string | number) => void;
}

export default function ScheduleBlock({ activity, onClick, onStatusChange, onDelete }: ScheduleBlockProps) {

    const statusClass = statusColors[activity.status] || statusColors.nao_iniciado;
    const statusLabel = statusLabels[activity.status] || activity.status;

    const handleStatusClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening the modal
        if (!onStatusChange) return;

        const statusOrder: Activity['status'][] = ['nao_iniciado', 'em_andamento', 'concluido', 'pausado', 'cancelado'];
        const currentIndex = statusOrder.indexOf(activity.status);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        const nextStatus = statusOrder[nextIndex];

        onStatusChange(activity.id, nextStatus);
    };

    return (
        <div
            onClick={() => onClick && onClick(activity)}
            className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-gray-200 dark:border-zinc-800 border-l-4 shadow-sm hover:shadow-md transition-shadow mb-4 cursor-pointer"
            style={{ borderLeftColor: activity.cor }}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{activity.icone || '📋'}</span>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 m-0">{activity.nome}</h3>
                </div>
                <button
                    onClick={handleStatusClick}
                    className={`text-xs px-2 py-1 rounded border font-medium ${statusClass} hover:brightness-95 transition-all active:scale-95`}
                    title="Clique para alterar o status"
                >
                    {statusLabel}
                </button>
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Excluir Atividade"
                    >
                        🗑️
                    </button>
                )}
            </div>


            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2">
                {activity.horario_inicio} - {activity.horario_fim}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{activity.descricao || 'Sem descrição.'}</p>

            {((activity.meta_leads || 0) > 0 || (activity.meta_visitas || 0) > 0) && (
                <div className="grid grid-cols-2 gap-2 text-center text-sm">
                    {(activity.meta_leads || 0) > 0 && (
                        <div className="bg-gray-50 dark:bg-zinc-800 p-2 rounded border dark:border-zinc-700">
                            <div className="font-bold text-gray-800 dark:text-gray-200">{activity.leads_contatados || 0}/{activity.meta_leads}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Leads</div>
                        </div>
                    )}
                    {(activity.meta_visitas || 0) > 0 && (
                        <div className="bg-gray-50 dark:bg-zinc-800 p-2 rounded border dark:border-zinc-700">
                            <div className="font-bold text-gray-800 dark:text-gray-200">{activity.visitas_realizadas || 0}/{activity.meta_visitas}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Visitas</div>
                        </div>
                    )}
                </div>
            )}

            {/* Smart Features Section */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">

                {/* Lead Score Badge */}
                {(() => {
                    const { score, color, label } = calculateLeadScore(activity);
                    return (
                        <div className="flex items-center gap-2" title={`Lead Score: ${score}/100`}>
                            <div className="h-1.5 w-12 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }}></div>
                            </div>
                            <span className="text-xs font-bold" style={{ color }}>{label}</span>
                        </div>
                    );
                })()}

                {/* WhatsApp Action */}

            </div>
        </div>
    );
}
