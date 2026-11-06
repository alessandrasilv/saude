/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityBar } from './components/AccessibilityBar';
import { Header } from './components/Header';
import { AppointmentCard } from './components/AppointmentCard';
import { ScheduleModal } from './components/ScheduleModal';
import { MedicalHistoryView } from './components/MedicalHistoryView';
import { UBSListView } from './components/UBSListView';
import { AuthModal } from './components/AuthModal';
import { LGPDModal } from './components/LGPDModal';
import { TicketReceiptModal } from './components/TicketReceiptModal';
import { Appointment } from './types';
import {
  CalendarPlus,
  Clock,
  ShieldCheck,
  HeartPulse,
  Building2,
  FileCheck2,
  Volume2,
  Users,
  CheckCircle2,
} from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const { readAloud } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'appointments' | 'schedule' | 'history' | 'ubs' | 'lgpd'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estados dos Modais
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [initialUbsForSchedule, setInitialUbsForSchedule] = useState<string>('');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedTicket, setSelectedTicket] = useState<Appointment | null>(null);

  const fetchAppointments = async () => {
    if (!user) {
      setAppointments([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/appointments?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data || []);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleOpenNewSchedule = (ubsId?: string) => {
    if (!user) {
      setAuthMode('login');
      setIsAuthOpen(true);
      return;
    }
    setEditingAppointment(null);
    setInitialUbsForSchedule(ubsId || '');
    setIsScheduleOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsScheduleOpen(true);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch {
      alert('Erro ao desmarcar a consulta.');
    }
  };

  const handleHeroSpeech = () => {
    readAloud(
      'Sistema de Agendamento de Consultas Saúde para Todos. Agende sua consulta médica na UBS mais próxima com atendimento humanizado, sem filas e com respeito a todas as idades.'
    );
  };

  const activeAppointments = appointments.filter((a) => a.status !== 'cancelada');
  const cancelledAppointments = appointments.filter((a) => a.status === 'cancelada');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Barra Superior de Acessibilidade WCAG */}
      <AccessibilityBar />

      {/* 2. Top Bar Navigation (§2 Top Bar Contract) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => {
          setAuthMode('login');
          setIsAuthOpen(true);
        }}
        onOpenSchedule={() => handleOpenNewSchedule()}
      />

      {/* 3. Hero Banner Acolhedor (Exibido nas páginas principais) */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Texto Hero */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-300">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>Atendimento Humanizado · Sistema Único de Saúde</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance">
                Cuidado médico ao seu alcance em todas as UBSs
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Agende consultas médicas presenciais na Unidade Básica de Saúde da sua região. Sem filas,
                com total respeito à privacidade dos seus dados (LGPD) e ferramentas acessíveis para todas as idades.
              </p>

              {/* Botões de Ação */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleOpenNewSchedule()}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 dark:hover:bg-sky-600 rounded-xl transition-all shadow-sm"
                >
                  <CalendarPlus className="w-5 h-5" />
                  <span>Agendar Consulta Agora</span>
                </button>

                <button
                  onClick={() => setActiveTab('ubs')}
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <Building2 className="w-5 h-5 text-sky-600" />
                  <span>Ver Unidades & Horários</span>
                </button>

                <button
                  onClick={handleHeroSpeech}
                  aria-label="Ouvir resumo da apresentação"
                  className="p-3 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Ouvir instruções"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Indicadores Concretos de Confiança (§1.H Claim-to-Proof) */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% Gratuito no SUS</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>LGPD: Criptografia AES-256</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Dislexia & Daltonismo Inclusivos</span>
                </div>
              </div>
            </div>

            {/* Imagem Acolhedora da UBS (§3.E Fallback Resiliente) */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md aspect-16/9 lg:aspect-4/3 bg-slate-100 dark:bg-slate-800">
                <img
                  src="/src/assets/images/ubs_recepcao_acolhedora_1793961422999.jpg"
                  alt="Recepção acolhedora e acessível da Unidade Básica de Saúde com atendente orientando uma senhora e uma jovem mãe"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Conteúdo Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* ABA: Meus Agendamentos */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Consultas Agendadas
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  {user
                    ? `Prontuário de ${user.name} (CPF: ${user.cpf_masked})`
                    : 'Acesse com seu CPF para visualizar seus agendamentos'}
                </p>
              </div>

              <button
                onClick={() => handleOpenNewSchedule()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 dark:hover:bg-sky-600 rounded-xl transition-colors shadow-xs shrink-0"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Nova Consulta</span>
              </button>
            </div>

            {/* Lista de Consultas */}
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Carregando suas consultas...
              </div>
            ) : !user ? (
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-md mx-auto">
                <Users className="w-10 h-10 text-sky-600 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Identificação do Paciente
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Faça login com seu CPF ou faça um cadastro rápido para visualizar ou agendar suas consultas.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setIsAuthOpen(true);
                    }}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700"
                  >
                    Entrar com CPF ou E-mail
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setIsAuthOpen(true);
                    }}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
                  >
                    Criar Novo Cadastro
                  </button>
                </div>
              </div>
            ) : activeAppointments.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
                <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Você não possui consultas agendadas no momento
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Agende sua consulta preventiva ou de acompanhamento na Unidade Básica de Saúde mais próxima.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleOpenNewSchedule()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>Agendar Primeira Consulta</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAppointments.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onEdit={handleEditAppointment}
                      onCancel={handleCancelAppointment}
                      onViewReceipt={(appointment) => setSelectedTicket(appointment)}
                    />
                  ))}
                </div>

                {/* Consultas Canceladas (se houver) */}
                {cancelledAppointments.length > 0 && (
                  <div className="pt-8">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                      Consultas Desmarcadas Recentemente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cancelledAppointments.map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          onEdit={handleEditAppointment}
                          onCancel={handleCancelAppointment}
                          onViewReceipt={(appointment) => setSelectedTicket(appointment)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ABA: Histórico Completo de Atendimentos */}
        {activeTab === 'history' && <MedicalHistoryView />}

        {/* ABA: Rede de UBSs */}
        {activeTab === 'ubs' && (
          <UBSListView
            onSelectUBS={(ubsId) => {
              handleOpenNewSchedule(ubsId);
            }}
          />
        )}

        {/* ABA: Privacidade e LGPD */}
        {activeTab === 'lgpd' && <LGPDModal />}
      </main>

      {/* 5. Rodapé Acessível e Confiável */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-sky-600 flex items-center justify-center text-white font-bold text-xs">
                +
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Saúde para Todos · Sistema de Atenção Primária
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={() => setActiveTab('lgpd')}
                className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                Termos da LGPD
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => setActiveTab('ubs')}
                className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                Postos de Saúde (UBS)
              </button>
              <span aria-hidden="true">·</span>
              <a href="#root" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Voltar ao Topo
              </a>
            </div>
          </div>

          <p className="text-center sm:text-left text-[11px] text-slate-400 dark:text-slate-500">
            Plataforma pública desenvolvida para garantir agendamento inclusivo, com fontes amigáveis para dislexia,
            paletas certificadas para daltonismo e rigorosa criptografia de dados confidenciais nos termos da Lei 13.709/2018.
          </p>
        </div>
      </footer>

      {/* 6. Modais Globais do Sistema */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={() => {
          fetchAppointments();
          setActiveTab('appointments');
        }}
        editAppointment={editingAppointment}
        initialUbsId={initialUbsForSchedule}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          fetchAppointments();
        }}
        defaultMode={authMode}
      />

      <TicketReceiptModal
        appointment={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </AccessibilityProvider>
  );
}
