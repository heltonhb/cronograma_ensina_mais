import React from 'react';

type StatCardProps = {
    label: string;
    value: string | number;
    icon: string;
    color: keyof typeof colorMap;
    loading?: boolean;
};

const colorMap = {
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
    pink: { bg: 'bg-pink-100 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
    green: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
};

const StatCard = React.memo(function StatCard({ label, value, icon, color, loading = false }: StatCardProps) {
    const styles = colorMap[color];

    return (
        <div className={`
            relative overflow-hidden p-5 rounded-2xl border bg-white dark:bg-zinc-900 
            ${styles.border} shadow-sm hover:shadow-md transition-all duration-300 group
        `}>
            {/* Background Decor */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${styles.bg} opacity-50 blur-2xl group-hover:opacity-75 transition-opacity`}></div>

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</span>
                    {loading ? (
                        <div className="h-8 w-20 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                    ) : (
                        <div className={`text-2xl md:text-3xl font-bold tracking-tight ${styles.text}`}>
                            {value}
                        </div>
                    )}
                </div>
                <div className={`
                    p-3 rounded-xl bg-opacity-30 ${styles.bg} text-2xl backdrop-blur-sm
                `}>
                    {icon}
                </div>
            </div>
        </div>
    );
});

export default StatCard;
