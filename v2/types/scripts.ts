export interface ScriptItem {
    id: string; // timestamp as string
    title: string;
    content: string;
    type: 'approach' | 'objection' | 'closing' | 'followup';
}

export interface ScriptPhase {
    phase: string;
    objective: string;
    scripts: ScriptItem[];
}
