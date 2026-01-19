export interface DailyLog {
    date: string; // YYYY-MM-DD
    leads_novos: number;
    leads_contatados: number;
    agendamentos: number;
    visitas: number;
    matriculas: number;
    ligacoes?: number; // Manual input for calls
    vendas_valor?: number;
    notas?: string;
    updatedAt?: string;
    lastUpdated?: string; // Kept for compatibility with definition from activity.ts
    activities_completed?: number;
    activities_total?: number;
    productivity_stats?: { [category: string]: number }; // Minutes per category
}
