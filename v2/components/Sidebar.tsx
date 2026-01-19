import React, { useState, useEffect } from 'react';

type SidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    currentUser: string | null;
};

export default function Sidebar({ isOpen, onClose, onNavigate, onLogout, currentUser }: SidebarProps) {
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleNav = (view: string) => {
        setActiveTab(view);
        onNavigate(view);
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed top-0 left-0 bottom-0 z-50
                w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:static
                flex flex-col
            `}>
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3 text-blue-600 dark:text-blue-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" />
                            <path d="M4 12.5C4 11.837 4.26339 11.2011 4.73223 10.7322C5.20107 10.2634 5.83696 10 6.5 10H20" />
                            <path d="M4 5.5C4 4.83696 4.26339 4.20107 4.73223 3.73223C5.20107 3.26339 5.83696 3 6.5 3H20" />
                        </svg>
                        <span className="font-bold text-lg tracking-tight">Ensina Mais</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-auto md:hidden text-gray-500"
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    <ul className="space-y-1 px-3">
                        <NavItem
                            icon="📊" label="Dashboard"
                            active={activeTab === 'dashboard'}
                            onClick={() => handleNav('dashboard')}
                        />
                        <NavItem
                            icon="⏰" label="Cronograma"
                            active={activeTab === 'cronograma'}
                            onClick={() => handleNav('cronograma')}
                        />

                        <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Ferramentas
                        </div>

                        <NavItem
                            icon="📋" label="Templates"
                            active={activeTab === 'templates'}
                            onClick={() => handleNav('templates')}
                        />
                        <NavItem
                            icon="📓" label="Acompanhamento"
                            active={activeTab === 'daily'}
                            onClick={() => handleNav('daily')}
                        />
                        <NavItem
                            icon="📝" label="Scripts"
                            active={activeTab === 'scripts'}
                            onClick={() => handleNav('scripts')}
                        />
                        <NavItem
                            icon="📈" label="Relatórios"
                            active={activeTab === 'reports'}
                            onClick={() => handleNav('reports')}
                        />
                    </ul>
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
                    {currentUser ? (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-sm font-bold">
                                {currentUser.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {currentUser}
                                </p>
                                <button
                                    onClick={onLogout}
                                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    Sair da conta
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => onNavigate('login')}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Entrar
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}

const NavItem = ({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) => (
    <li>
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-200'
                }
            `}
        >
            <span className="text-lg opacity-80">{icon}</span>
            {label}
        </button>
    </li>
);
