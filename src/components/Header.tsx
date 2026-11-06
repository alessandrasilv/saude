import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User as UserIcon, LogOut, PlusCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'appointments' | 'schedule' | 'history' | 'ubs' | 'lgpd';
  setActiveTab: (tab: 'appointments' | 'schedule' | 'history' | 'ubs' | 'lgpd') => void;
  onOpenAuth: () => void;
  onOpenSchedule: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenSchedule,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Wordmark do Brand Title (Single text element) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('appointments')}
              className="text-left flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white shadow-xs font-bold text-lg">
                +
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                Saúde para Todos
              </span>
            </button>
          </div>

          {/* Zone 2: 4-5 Clean single-line text navigation links */}
          <nav
            aria-label="Navegação Principal do Cidadão"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              onClick={() => setActiveTab('appointments')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                activeTab === 'appointments'
                  ? 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-300 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Meus Agendamentos
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                activeTab === 'history'
                  ? 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-300 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Histórico de Atendimentos
            </button>

            <button
              onClick={() => setActiveTab('ubs')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                activeTab === 'ubs'
                  ? 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-300 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Unidades Básicas (UBS)
            </button>

            <button
              onClick={() => setActiveTab('lgpd')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'lgpd'
                  ? 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-300 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Privacidade LGPD</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action & Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenSchedule}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 dark:bg-sky-500 rounded-lg hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors whitespace-nowrap shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nova Consulta</span>
                </button>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
                  <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-[130px]">
                      {user.name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {user.cpf_masked}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    title="Sair da conta"
                    aria-label="Sair da conta"
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 dark:bg-sky-500 rounded-lg hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors whitespace-nowrap shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Entrar / Cadastrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-1 px-2 ${
              activeTab === 'appointments'
                ? 'text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Consultas
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-1 px-2 ${
              activeTab === 'history'
                ? 'text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => setActiveTab('ubs')}
            className={`py-1 px-2 ${
              activeTab === 'ubs'
                ? 'text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            UBSs
          </button>
          <button
            onClick={() => setActiveTab('lgpd')}
            className={`py-1 px-2 ${
              activeTab === 'lgpd'
                ? 'text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            LGPD
          </button>
        </div>
      </div>
    </header>
  );
};
