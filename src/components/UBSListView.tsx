import React, { useState, useEffect } from 'react';
import { UBSUnit } from '../types';
import { MapPin, Phone, Clock, Accessibility, CalendarPlus, Search, Building2 } from 'lucide-react';

interface UBSListViewProps {
  onSelectUBS: (ubsId: string) => void;
}

export const UBSListView: React.FC<UBSListViewProps> = ({ onSelectUBS }) => {
  const [units, setUnits] = useState<UBSUnit[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/ubs')
      .then((res) => res.json())
      .then((data) => setUnits(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const neighborhoods = ['all', ...Array.from(new Set(units.map((u) => u.neighborhood)))];

  const filtered = units.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.specialties.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesNeighborhood =
      selectedNeighborhood === 'all' || u.neighborhood === selectedNeighborhood;

    return matchesSearch && matchesNeighborhood;
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Rede de Unidades Básicas de Saúde (UBS)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Consulte horários de funcionamento, especialidades médicas e recursos de acessibilidade física e comunicacional.
          </p>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome da UBS, bairro ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Bairros */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {neighborhoods.map((n) => (
            <button
              key={n}
              onClick={() => setSelectedNeighborhood(n)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedNeighborhood === n
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {n === 'all' ? 'Todos os Bairros' : n}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Carregando informações das UBSs...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((ubs) => (
            <article
              key={ubs.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                      Código: {ubs.code}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {ubs.name}
                    </h3>
                  </div>
                  <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{ubs.address} · {ubs.neighborhood}, {ubs.city}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{ubs.phone}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{ubs.opening_hours}</span>
                  </div>
                </div>

                {/* Especialidades disponíveis */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Especialidades Atendidas:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {ubs.specialties.map((spec, idx) => (
                      <span key={spec}>
                        {spec}
                        {idx < ubs.specialties.length - 1 && (
                          <span className="text-slate-300 dark:text-slate-700 ml-1.5" aria-hidden="true">·</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Instalações Acessíveis */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    <Accessibility className="w-4 h-4 text-emerald-600" />
                    <span>Recursos de Acessibilidade Certificados:</span>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5 list-disc list-inside">
                    {ubs.accessible_facilities.map((fac) => (
                      <li key={fac}>{fac}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onSelectUBS(ubs.id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 dark:bg-sky-500 rounded-lg hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors shadow-xs"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Agendar Consulta nesta Unidade</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
