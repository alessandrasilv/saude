import React, { useState } from 'react';
import { Appointment } from '../types';
import { Calendar, Clock, MapPin, Stethoscope, Volume2, Edit3, Trash2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onCancel: (appointmentId: string) => void;
  onViewReceipt: (appointment: Appointment) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onEdit,
  onCancel,
  onViewReceipt,
}) => {
  const { readAloud } = useAccessibility();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const formattedDate = new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString(
    'pt-BR',
    { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
  );

  const handleSpeak = () => {
    const textToRead = `Consulta médica na especialidade de ${appointment.specialty}. Unidade Básica de Saúde: ${appointment.ubs_name}. Data: ${formattedDate}, às ${appointment.appointment_time}. Profissional: ${appointment.doctor_name}. Motivo informado: ${appointment.reason}. Status: ${appointment.status}.`;
    readAloud(textToRead);
  };

  const isCancelled = appointment.status === 'cancelada';

  return (
    <article
      className={`rounded-xl border p-5 transition-all bg-white dark:bg-slate-900 ${
        isCancelled
          ? 'border-slate-200 dark:border-slate-800 opacity-75'
          : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          {/* Metadata limpa sem formato de pílula (Zero-Pill Discipline §1.A) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-sky-700 dark:text-sky-300">{appointment.specialty}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{appointment.appointment_time}</span>
            <span aria-hidden="true">·</span>
            <span>Protocolo: #{appointment.id.slice(-6).toUpperCase()}</span>
          </div>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
            {formattedDate}
          </h3>

          <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 pt-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
              <span className="font-medium text-slate-800 dark:text-slate-200">{appointment.ubs_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{appointment.doctor_name}</span>
            </div>

            {appointment.reason && (
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 italic">
                Motivo: "{appointment.reason}"
              </p>
            )}
          </div>
        </div>

        {/* Status com Ícone Explícito + Texto (Regra Anti-Daltonismo §1.F) */}
        <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {isCancelled ? (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <span>Consulta Cancelada</span>
              </span>
            ) : appointment.status === 'confirmada' ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmada na UBS</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <Clock className="w-4 h-4" />
                <span>Agendamento Ativo</span>
              </span>
            )}
          </div>

          {/* Botão de Leitura de Áudio Acessível */}
          <button
            onClick={handleSpeak}
            title="Ouvir informações desta consulta em voz alta"
            aria-label="Ouvir detalhes da consulta"
            className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">Ouvir</span>
          </button>
        </div>
      </div>

      {/* Ações da Consulta */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => onViewReceipt(appointment)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Comprovante SUS</span>
        </button>

        {!isCancelled && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(appointment)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 px-3 py-1.5 rounded border border-sky-200 dark:border-sky-800 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Remarcar / Editar</span>
            </button>

            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded border border-rose-200 dark:border-rose-900 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Desmarcar</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 p-1 rounded border border-rose-200 dark:border-rose-800">
                <span className="text-[11px] text-rose-800 dark:text-rose-300 px-1 font-medium">
                  Confirmar cancelamento?
                </span>
                <button
                  onClick={() => {
                    onCancel(appointment.id);
                    setShowCancelConfirm(false);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2 py-1 rounded"
                >
                  Sim
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-[11px] px-2 py-1 rounded"
                >
                  Não
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
