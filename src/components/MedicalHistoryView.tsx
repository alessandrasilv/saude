import React, { useState, useEffect } from 'react';
import { MedicalHistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Stethoscope, Calendar, Pill, FileCheck, Search, Volume2, ShieldCheck, MapPin } from 'lucide-react';

export const MedicalHistoryView: React.FC = () => {
  const { user } = useAuth();
  const { readAloud } = useAccessibility();

  const [history, setHistory] = useState<MedicalHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    fetch(`/api/medical-history?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  const specialties = ['all', ...Array.from(new Set(history.map((h) => h.specialty)))];

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ubs_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.prescription && item.prescription.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecialty = selectedSpecialty === 'all' || item.specialty === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  const handleSpeakHistory = (item: MedicalHistoryItem) => {
    const text = `Atendimento médico de ${item.specialty} realizado em ${new Date(
      item.appointment_date + 'T00:00:00'
    ).toLocaleDateString('pt-BR')}, na ${item.ubs_name}, com ${item.doctor_name}. Diagnóstico e parecer clínico: ${
      item.diagnosis
    }. Prescrição médica: ${item.prescription || 'Nenhum medicamento prescrito'}. Orientações: ${
      item.recommendations
    }.`;
    readAloud(text);
  };

  return (
    <section className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Histórico Completo de Atendimentos Médicos
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Prontuário das consultas realizadas na rede municipal do SUS com orientações e receitas.
          </p>
        </div>

        {/* Garantia de Proteção LGPD */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Prontuário Eletrônico Protegido por Criptografia</span>
        </div>
      </div>

      {/* Barra de Filtros e Busca (Segmented Buttons e Input - §1.A) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por diagnóstico, remédio ou médico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Segmented Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedSpecialty === spec
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {spec === 'all' ? 'Todas as Especialidades' : spec}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Registros Médicos */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Carregando histórico do prontuário...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
          <FileCheck className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Nenhum atendimento encontrado com estes critérios.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Suas consultas realizadas na rede aparecerão automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const formattedDate = new Date(item.appointment_date + 'T00:00:00').toLocaleDateString(
              'pt-BR',
              { day: '2-digit', month: 'long', year: 'numeric' }
            );

            return (
              <article
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="space-y-1">
                    {/* Metadata sem pílula (§1.A) */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-sky-700 dark:text-sky-300">{item.specialty}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{formattedDate}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{item.appointment_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      <span>{item.doctor_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      <span>{item.ubs_name}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSpeakHistory(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shrink-0"
                  >
                    <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Ouvir Prontuário</span>
                  </button>
                </div>

                {/* Parecer Clínico / Diagnóstico */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Avaliação Médica & Diagnóstico:
                  </h4>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {item.diagnosis}
                  </p>
                </div>

                {/* Prescrição Médica de Medicamentos */}
                {item.prescription && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5" />
                      <span>Receita & Medicamentos Prescritos:</span>
                    </h4>
                    <p className="text-xs text-slate-800 dark:text-slate-200 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 font-mono">
                      {item.prescription}
                    </p>
                  </div>
                )}

                {/* Recomendações e Cuidados em Casa */}
                {item.recommendations && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Orientações de Cuidado & Retorno:
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {item.recommendations}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
