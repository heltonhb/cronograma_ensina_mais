'use client';

import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import ScheduleGrid from '../components/ScheduleGrid';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/MotionWrapper';
import ActivityModal from '../components/ActivityModal';
import SalesForecastWidget from '../components/SalesForecastWidget';
import TemplatesModal from '../components/TemplatesModal';
import DailyLogModal from '../components/DailyLogModal';
import ScriptsModal from '../components/ScriptsModal';
import ReportsModal from '../components/ReportsModal';
import LoginModal from '../components/LoginModal';
import PerformanceChart from '../components/PerformanceChart';
import GamificationWidget from '../components/GamificationWidget';
import { useSchedule } from '../hooks/useSchedule';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from '../types/activity';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { activities, yesterdayActivities, metrics, loading, historyData, deleteActivity } = useSchedule();
  const { user } = useAuth(); // Get user from context

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statsScope, setStatsScope] = useState<'today' | 'yesterday'>('yesterday');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState(false);
  const [isScriptsModalOpen, setIsScriptsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const handleLogout = () => signOut(auth);

  const handleNavigate = (view: string) => {
    if (view === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'cronograma') {
      document.getElementById('schedule-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'templates') {
      setIsTemplatesModalOpen(true);
    } else if (view === 'daily') {
      setIsDailyLogModalOpen(true);
    } else if (view === 'scripts') {
      setIsScriptsModalOpen(true);
    } else if (view === 'reports') {
      setIsReportsModalOpen(true);
    } else if (view === 'login') {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        currentUser={user?.email || null}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header / Top Bar (Mobile Toggle + Title) */}
        <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 md:hidden"
            >
              ☰
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">Dashboard</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Actions Top Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedActivity(null); setIsModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-1"
            >
              <span>+</span>
              <span className="hidden md:inline">Nova Atividade</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">

          {/* Stats Grid Controls */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              {statsScope === 'today' ? '🔥 Performance de Hoje' : '🏁 Resultado de Ontem'}
            </h2>
            <div className="bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg flex text-sm font-medium">
              <button
                onClick={() => setStatsScope('yesterday')}
                className={`px-3 py-1.5 rounded-md transition-all ${statsScope === 'yesterday' ? 'bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                Ontem
              </button>
              <button
                onClick={() => setStatsScope('today')}
                className={`px-3 py-1.5 rounded-md transition-all ${statsScope === 'today' ? 'bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                Hoje
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8" staggerDelay={0.05}>
            <StaggerItem>
              <StatCard
                label="Conclusão"
                value={statsScope === 'today' ? `${metrics.completed}/${metrics.total}` : `${metrics.yesterday?.completed || 0}/${metrics.yesterday?.total || 0}`}
                icon={statsScope === 'today' ? "✅" : "🏁"}
                color="purple"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Leads Novos"
                value={statsScope === 'today' ? metrics.leads_novos : (metrics.yesterday?.leads_novos || 0)}
                icon="✨"
                color="cyan"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Contatados"
                value={statsScope === 'today' ? metrics.leads_contatados : (metrics.yesterday?.leads_contatados || 0)}
                icon="💬"
                color="pink"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Agendamentos"
                value={statsScope === 'today' ? metrics.agendamentos : (metrics.yesterday?.agendamentos || 0)}
                icon="📅"
                color="yellow"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Visitas"
                value={statsScope === 'today' ? metrics.visitas : (metrics.yesterday?.visitas || 0)}
                icon="🏫"
                color="orange"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Matrículas"
                value={statsScope === 'today' ? metrics.matriculas : (metrics.yesterday?.matriculas || 0)}
                icon="🏆"
                color="green"
              />
            </StaggerItem>
          </StaggerContainer>

          {/* Main Widgets Area */}
          <FadeIn delay={0.2} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Progress Card */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">Progresso do Dia</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-300">
                    Taxa de Conclusão
                  </span>
                  <span className="text-xs font-bold inline-block text-blue-600 dark:text-blue-400">
                    {metrics.percentage}%
                  </span>
                </div>
                <div className="overflow-hidden h-2.5 mb-4 text-xs flex rounded-full bg-gray-100 dark:bg-zinc-800">
                  <div style={{ width: `${metrics.percentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-700 ease-out"></div>
                </div>
              </div>
            </div>


            {/* Widgets Container */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
              <GamificationWidget />

              <SalesForecastWidget />
              <div>
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">Performance Recente</h3>
                <div className="h-64">
                  <PerformanceChart data={historyData || []} />
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Schedule Section */}
          <FadeIn delay={0.4} className="mb-8">
            <section id="schedule-section">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span>📅</span>
                  Seu Cronograma
                </h2>

                {/* Quick Filters / Actions if needed in future, currently kept clean */}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400 font-medium">Carregando cronograma...</span>
                  </div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 hover:border-blue-200 transition-colors cursor-pointer group"
                  onClick={() => { setSelectedActivity(null); setIsModalOpen(true); }}
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">✨</div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Dia Livre!</h3>
                  <p className="text-gray-400 mb-4">Nenhuma atividade planejada para hoje.</p>
                  <button className="text-blue-600 font-medium hover:underline">Começar a planejar →</button>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                  <ScheduleGrid
                    activities={statsScope === 'today' ? activities : yesterdayActivities}
                    onActivityClick={(act) => {
                      if (statsScope === 'today') {
                        setSelectedActivity(act);
                        setIsModalOpen(true);
                      }
                    }}
                    onDeleteActivity={async (id) => {
                      if (statsScope === 'today' && confirm('Tem certeza que deseja excluir esta atividade?')) {
                        await deleteActivity(id);
                      }
                    }}
                  />
                </div>
              )}
            </section>
          </FadeIn>
        </main>
      </div>

      {/* Modals */}
      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activity={selectedActivity}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        currentActivities={activities}
      />

      <DailyLogModal
        isOpen={isDailyLogModalOpen}
        onClose={() => setIsDailyLogModalOpen(false)}
        todayActivities={activities}
        todayMetrics={{ completed: metrics.completed, total: metrics.total }}
      />

      <ScriptsModal
        isOpen={isScriptsModalOpen}
        onClose={() => setIsScriptsModalOpen(false)}
      />

      <ReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
      />
    </div>
  );
}
