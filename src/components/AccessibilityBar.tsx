import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { Volume2, VolumeX, Eye, BookOpen, Sun, Moon, Type } from 'lucide-react';
import { ColorblindMode, FontScale } from '../types';

export const AccessibilityBar: React.FC = () => {
  const {
    isDark,
    toggleDarkMode,
    isDyslexic,
    toggleDyslexicMode,
    colorblindMode,
    setColorblindMode,
    fontScale,
    setFontScale,
    readingRuler,
    toggleReadingRuler,
    isAudioPlaying,
    stopAudio,
    readAloud,
  } = useAccessibility();

  const handleReadIntro = () => {
    if (isAudioPlaying) {
      stopAudio();
    } else {
      readAloud(
        'Bem-vindo ao portal Saúde para Todos. Aqui você pode agendar consultas médicas em Unidades Básicas de Saúde, consultar seu histórico de atendimentos e gerenciar seus agendamentos com total acessibilidade e segurança pela LGPD.'
      );
    }
  };

  return (
    <aside
      aria-label="Barra de Ferramentas de Acessibilidade"
      className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 px-4 py-2"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Lado Esquerdo: Identificação e Ativação de Áudio */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" aria-hidden="true" />
            Acessibilidade WCAG
          </span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>
          <button
            onClick={handleReadIntro}
            aria-label={isAudioPlaying ? 'Parar leitura por voz' : 'Ouvir instruções do portal por voz'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              isAudioPlaying
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-semibold'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isAudioPlaying ? <VolumeX className="w-3.5 h-3.5 text-amber-600" /> : <Volume2 className="w-3.5 h-3.5 text-sky-600" />}
            <span>{isAudioPlaying ? 'Pausar Áudio' : 'Ouvir Página'}</span>
          </button>
        </div>

        {/* Lado Direito: Controles de Dislexia, Daltonismo, Escala de Fonte e Modo Escuro */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Alternador de Fonte Dislexia */}
          <button
            onClick={toggleDyslexicMode}
            aria-pressed={isDyslexic}
            aria-label="Alternar fonte e espaçamento para pessoas com dislexia"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              isDyslexic
                ? 'bg-sky-700 text-white font-medium shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Modo Dislexia: {isDyslexic ? 'Ativado' : 'Desativado'}</span>
          </button>

          {/* Régua de Leitura */}
          <button
            onClick={toggleReadingRuler}
            aria-pressed={readingRuler}
            aria-label="Alternar régua de leitura para foco linha por linha"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              readingRuler
                ? 'bg-amber-600 text-white font-medium shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-xs font-mono">―</span>
            <span>Régua de Foco: {readingRuler ? 'Ativa' : 'Desativada'}</span>
          </button>

          {/* Seletor de Daltonismo & Contraste */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded px-1.5 py-0.5 border border-slate-200 dark:border-slate-700">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <label htmlFor="colorblind-select" className="sr-only">
              Paleta para Daltonismo e Contraste
            </label>
            <select
              id="colorblind-select"
              value={colorblindMode}
              onChange={(e) => setColorblindMode(e.target.value as ColorblindMode)}
              className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="default">Cores Padrão SUS</option>
              <option value="protan-deutan">Daltonismo: Protanopia / Deuteranopia</option>
              <option value="tritan">Daltonismo: Tritanopia</option>
              <option value="high-contrast">Alto Contraste (WCAG AAA)</option>
            </select>
          </div>

          {/* Escala de Tamanho de Fonte (Para Idosos e Baixa Visão) */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
            <span className="px-1.5 text-slate-400" aria-hidden="true">
              <Type className="w-3.5 h-3.5" />
            </span>
            <button
              onClick={() => setFontScale('normal')}
              aria-label="Tamanho de fonte normal"
              className={`px-2 py-0.5 text-xs font-semibold ${
                fontScale === 'normal' ? 'bg-sky-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontScale('medium')}
              aria-label="Tamanho de fonte médio"
              className={`px-2 py-0.5 text-xs font-semibold ${
                fontScale === 'medium' ? 'bg-sky-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              A+
            </button>
            <button
              onClick={() => setFontScale('large')}
              aria-label="Tamanho de fonte grande para melhor leitura"
              className={`px-2 py-0.5 text-xs font-semibold ${
                fontScale === 'large' ? 'bg-sky-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              A++
            </button>
          </div>

          {/* Modo Escuro Nativo */}
          <button
            onClick={toggleDarkMode}
            aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
