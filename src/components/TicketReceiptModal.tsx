import React from 'react';
import { Appointment } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, Printer, CheckCircle2, MapPin, Calendar, Clock, Stethoscope, ShieldCheck } from 'lucide-react';

interface TicketReceiptModalProps {
  appointment: Appointment | null;
  onClose: () => void;
}

export const TicketReceiptModal: React.FC<TicketReceiptModalProps> = ({ appointment, onClose }) => {
  const { user } = useAuth();
  if (!appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString(
    'pt-BR',
    { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header de Controle */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Comprovante Oficial de Agendamento
          </span>
          <button
            onClick={onClose}
            aria-label="Fechar comprovante"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Comprovante (Formatado para Impressão) */}
        <div id="printable-ticket" className="p-6 space-y-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-4 space-y-1">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-black text-xl mb-1">
              +
            </div>
            <h2 id="ticket-modal-title" className="text-lg font-bold">
              Sistema Único de Saúde — SUS
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Saúde para Todos · Comprovante de Agendamento Eletrônico
            </p>
            <div className="pt-2 font-mono text-xs font-bold text-sky-700 dark:text-sky-300 tracking-wider">
              PROTOCOLO: #{appointment.id.toUpperCase()}
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Paciente:</span>
              <span className="font-bold text-slate-900 dark:text-white">{user?.name || 'Cidadão'}</span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400">CPF (Protegido LGPD):</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                {user?.cpf_masked || '***.***.***-**'}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Cartão Nacional do SUS:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                {user?.sus_card || 'Apresentar na recepção'}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Unidade Básica:</span>
              <span className="font-semibold text-slate-900 dark:text-white text-right">
                {appointment.ubs_name}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Especialidade:</span>
              <span className="font-semibold text-sky-700 dark:text-sky-300">{appointment.specialty}</span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Profissional:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{appointment.doctor_name}</span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Data e Horário:</span>
              <span className="font-bold text-slate-900 dark:text-white text-right">
                {formattedDate} às {appointment.appointment_time}
              </span>
            </div>

            {appointment.notes && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-[11px]">
                <strong>Instruções ao Paciente:</strong> {appointment.notes}
              </div>
            )}
          </div>

          {/* Código de Barras / Protocolo Gráfico Visual */}
          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex justify-center items-center gap-0.5 h-8 px-8 py-1 bg-slate-100 dark:bg-slate-800 rounded">
              {[4, 2, 6, 1, 3, 5, 2, 4, 1, 6, 3, 2, 5, 1, 4, 2, 6, 3, 5, 1, 4, 2, 3, 5, 2].map(
                (w, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 dark:bg-slate-100 h-full"
                    style={{ width: `${w * 1.5}px` }}
                  />
                )
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest">
              VALIDADO DIGITALMENTE · LEI 13.709/2018
            </span>
          </div>
        </div>

        {/* Rodapé com botão de imprimir */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Comprovante</span>
          </button>
        </div>
      </div>
    </div>
  );
};
