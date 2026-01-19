
export interface Activity {
    id: number | string;
    nome: string;
    horario_inicio: string;
    horario_fim: string;
    descricao?: string;
    cor: string;
    icone: string;
    status: 'nao_iniciado' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado';

    // Metrics
    leads_contatados?: number;
    visitas_realizadas?: number;
    agendamentos_feitos?: number;

    // Metas
    meta_leads?: number;
    meta_visitas?: number;

    // Metadata
    observacoes?: string;
    categoria?: string;
    prioridade?: 'Alta' | 'Média' | 'Baixa';
    tipo?: 'Obrigatória' | 'Flexível' | 'Opcional';
    duracao?: number;
    participantes?: string[];

    // System
    updatedAt?: string;
    notificationSent?: boolean;
}

export interface ActivityLog {
    timestamp: string;
    activityId: number | string;
    action: string;
    details?: string;
}



export interface ScheduleHistoryEntry {
    date: string;
    activities: Activity[];
}
