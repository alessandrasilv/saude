import React, { useState, useEffect } from 'react';
import { Appointment, Doctor, TimeSlot, UBSUnit } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { X, Calendar, Clock, MapPin, Stethoscope, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editAppointment?: Appointment | null;
  initialUbsId?: string;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editAppointment,
  initialUbsId,
}) => {
  const { user } = useAuth();
  const { readAloud } = useAccessibility();

  const [ubsList, setUbsList] = useState<UBSUnit[]>([]);
  const [selectedUbsId, setSelectedUbsId] = useState<string>('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Define data mínima como amanhã
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  // Carrega lista de UBSs
  useEffect(() => {
    fetch('/api/ubs')
      .then((res) => res.json())
      .then((data: UBSUnit[]) => {
        setUbsList(data);
        if (editAppointment) {
          setSelectedUbsId(editAppointment.ubs_id);
          setSelectedSpecialty(editAppointment.specialty);
          setSelectedDoctorId(editAppointment.doctor_id);
          setAppointmentDate(editAppointment.appointment_date);
          setSelectedTime(editAppointment.appointment_time);
          setReason(editAppointment.reason);
          setNotes(editAppointment.notes || '');
        } else if (initialUbsId) {
          setSelectedUbsId(initialUbsId);
        } else if (data.length > 0) {
          setSelectedUbsId(data[0].id);
        }
      })
      .catch(() => {});
  }, [isOpen, editAppointment, initialUbsId]);

  // Atualiza especialidades quando a UBS muda
  useEffect(() => {
    if (!selectedUbsId) return;
    const ubs = ubsList.find((u) => u.id === selectedUbsId);
    if (ubs) {
      setSpecialties(ubs.specialties);
      if (!selectedSpecialty || !ubs.specialties.includes(selectedSpecialty)) {
        setSelectedSpecialty(ubs.specialties[0] || 'Clínica Geral');
      }
    }
  }, [selectedUbsId, ubsList]);

  // Carrega médicos compatíveis
  useEffect(() => {
    if (!selectedUbsId) return;
    fetch(`/api/doctors?ubsId=${selectedUbsId}`)
      .then((res) => res.json())
      .then((data: Doctor[]) => {
        setDoctors(data);
      })
      .catch(() => {});
  }, [selectedUbsId]);

  // Carrega horários disponíveis quando a UBS e data estão selecionadas
  useEffect(() => {
    if (!selectedUbsId || !appointmentDate) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    fetch(`/api/slots?ubsId=${selectedUbsId}&date=${appointmentDate}&doctorId=${selectedDoctorId || ''}`)
      .then((res) => res.json())
      .then((data) => {
        setAvailableSlots(data.slots || []);
        // Se o horário atual selecionado não estiver disponível, limpa
        if (selectedTime && data.slots && !data.slots.some((s: TimeSlot) => s.time === selectedTime && s.available)) {
          if (!editAppointment || editAppointment.appointment_date !== appointmentDate) {
            setSelectedTime('');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSlots(false));
  }, [selectedUbsId, appointmentDate, selectedDoctorId]);

  if (!isOpen) return null;

  const currentUbs = ubsList.find((u) => u.id === selectedUbsId);
  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const handleSpeakSummary = () => {
    const text = `Resumo do agendamento: Unidade Básica de Saúde ${currentUbs?.name || 'selecionada'}. Especialidade: ${selectedSpecialty}. Data: ${appointmentDate || 'não selecionada'}, horário: ${selectedTime || 'não selecionado'}. Paciente: ${user?.name || 'cidadão'}.`;
    readAloud(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      setErrorMessage('Por favor, faça login ou cadastre-se para confirmar o agendamento.');
      return;
    }

    if (!selectedUbsId || !appointmentDate || !selectedTime || !selectedSpecialty) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios (UBS, Especialidade, Data e Horário).');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        user_id: user.id,
        ubs_id: selectedUbsId,
        doctor_id: selectedDoctorId || undefined,
        appointment_date: appointmentDate,
        appointment_time: selectedTime,
        specialty: selectedSpecialty,
        reason: reason || 'Consulta de rotina',
        notes,
      };

      const url = editAppointment ? `/api/appointments/${editAppointment.id}` : '/api/appointments';
      const method = editAppointment ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Erro ao processar o agendamento.');
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setErrorMessage('Erro de conexão com a rede da saúde pública.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header do Modal */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <h2 id="schedule-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
              {editAppointment ? 'Remarcar Consulta Médica' : 'Agendar Consulta na UBS'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Serviço gratuito do Sistema Único de Saúde (SUS)
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com passos claros e campos acessíveis */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Atenção no preenchimento:</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* 1. Escolha da Unidade Básica de Saúde */}
          <div className="space-y-2">
            <label htmlFor="ubs-select" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              1. Escolha a Unidade Básica de Saúde (UBS):
            </label>
            <select
              id="ubs-select"
              value={selectedUbsId}
              onChange={(e) => setSelectedUbsId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {ubsList.map((ubs) => (
                <option key={ubs.id} value={ubs.id}>
                  {ubs.name} — {ubs.neighborhood}
                </option>
              ))}
            </select>
            {currentUbs && (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>{currentUbs.address} · {currentUbs.opening_hours}</span>
              </div>
            )}
          </div>

          {/* 2. Especialidade Médica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="specialty-select" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                2. Especialidade Necessária:
              </label>
              <select
                id="specialty-select"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {specialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Profissional / Equipe */}
            <div className="space-y-2">
              <label htmlFor="doctor-select" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                3. Profissional (Opcional):
              </label>
              <select
                id="doctor-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Qualquer profissional disponível da equipe</option>
                {doctors
                  .filter((d) => d.specialty.toLowerCase() === selectedSpecialty.toLowerCase() || !selectedSpecialty)
                  .map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.crm})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 4. Data da Consulta */}
          <div className="space-y-2">
            <label htmlFor="date-input" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              4. Escolha a Data:
            </label>
            <input
              type="date"
              id="date-input"
              min={minDateStr}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Agendamentos disponíveis a partir de amanhã.
            </p>
          </div>

          {/* 5. Horários Disponíveis em Tempo Real */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                5. Horários Disponíveis para Atendimento:
              </span>
              {loadingSlots && (
                <span className="text-xs text-sky-600 dark:text-sky-400">Consultando vagas na UBS...</span>
              )}
            </div>

            {!appointmentDate ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                Selecione uma data acima para visualizar as vagas livres.
              </div>
            ) : availableSlots.length === 0 && !loadingSlots ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs text-center">
                Não há horários disponíveis para esta data nesta UBS. Escolha outra data ou unidade.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      aria-label={`Horário ${slot.time}, ${slot.available ? 'disponível' : 'ocupado'}`}
                      className={`py-2 px-1 text-xs font-mono font-medium rounded-lg text-center transition-all ${
                        !slot.available
                          ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-400 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-sky-500'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. Motivo da Consulta */}
          <div className="space-y-2">
            <label htmlFor="reason-textarea" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              6. Qual o motivo ou sintoma da consulta?
            </label>
            <textarea
              id="reason-textarea"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Exemplo: dor de cabeça há 3 dias, renovação de receita para hipertensão, vacina da gripe..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Botão de Leitura de Acessibilidade */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Deseja ouvir o resumo do agendamento?
            </span>
            <button
              type="button"
              onClick={handleSpeakSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Ouvir Resumo</span>
            </button>
          </div>

          {/* Ações Finais */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedTime || !appointmentDate}
              className={`px-6 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs transition-all ${
                isSubmitting || !selectedTime || !appointmentDate
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 dark:hover:bg-sky-600'
              }`}
            >
              {isSubmitting
                ? 'Processando...'
                : editAppointment
                ? 'Salvar Alterações da Consulta'
                : 'Confirmar Agendamento no SUS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
