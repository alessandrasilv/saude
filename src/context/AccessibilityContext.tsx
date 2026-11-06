import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorblindMode, FontScale } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';

interface AccessibilityContextType {
  isDark: boolean;
  toggleDarkMode: () => void;
  isDyslexic: boolean;
  toggleDyslexicMode: () => void;
  colorblindMode: ColorblindMode;
  setColorblindMode: (mode: ColorblindMode) => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  readingRuler: boolean;
  toggleReadingRuler: () => void;
  rulerY: number;
  readAloud: (text: string) => void;
  stopAudio: () => void;
  isAudioPlaying: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('saude_dark') === 'true';
  });

  const [isDyslexic, setIsDyslexic] = useState<boolean>(() => {
    return localStorage.getItem('saude_dyslexic') === 'true';
  });

  const [colorblindMode, setColorblindModeState] = useState<ColorblindMode>(() => {
    return (localStorage.getItem('saude_colorblind') as ColorblindMode) || 'default';
  });

  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    return (localStorage.getItem('saude_font_scale') as FontScale) || 'normal';
  });

  const [readingRuler, setReadingRuler] = useState<boolean>(false);
  const [rulerY, setRulerY] = useState<number>(200);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  // Efeito do Modo Escuro
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('saude_dark', String(isDark));
  }, [isDark]);

  // Efeito do Modo Dislexia
  useEffect(() => {
    const body = document.body;
    if (isDyslexic) {
      body.classList.add('dyslexia-mode');
    } else {
      body.classList.remove('dyslexia-mode');
    }
    localStorage.setItem('saude_dyslexic', String(isDyslexic));
  }, [isDyslexic]);

  // Efeito das Paletas de Daltonismo e Alto Contraste
  useEffect(() => {
    const body = document.body;
    body.classList.remove('colorblind-protan-deutan', 'colorblind-tritan', 'high-contrast-mode');

    if (colorblindMode === 'protan-deutan') {
      body.classList.add('colorblind-protan-deutan');
    } else if (colorblindMode === 'tritan') {
      body.classList.add('colorblind-tritan');
    } else if (colorblindMode === 'high-contrast') {
      body.classList.add('high-contrast-mode');
    }
    localStorage.setItem('saude_colorblind', colorblindMode);
  }, [colorblindMode]);

  // Efeito do Tamanho da Fonte (A- / A / A+)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-scale-medium', 'text-scale-large');
    if (fontScale === 'medium') {
      root.style.fontSize = '18px';
    } else if (fontScale === 'large') {
      root.style.fontSize = '20px';
    } else {
      root.style.fontSize = '16px';
    }
    localStorage.setItem('saude_font_scale', fontScale);
  }, [fontScale]);

  // Efeito da Régua de Leitura
  useEffect(() => {
    if (!readingRuler) return;
    const handleMouseMove = (e: MouseEvent) => {
      setRulerY(e.clientY);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        setRulerY(e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [readingRuler]);

  const toggleDarkMode = () => setIsDark((prev) => !prev);
  const toggleDyslexicMode = () => setIsDyslexic((prev) => !prev);
  const setColorblindMode = (mode: ColorblindMode) => setColorblindModeState(mode);
  const setFontScale = (scale: FontScale) => setFontScaleState(scale);
  const toggleReadingRuler = () => setReadingRuler((prev) => !prev);

  const readAloud = (text: string) => {
    setIsAudioPlaying(true);
    speakText(text, () => {
      setIsAudioPlaying(false);
    });
  };

  const stopAudio = () => {
    stopSpeaking();
    setIsAudioPlaying(false);
  };

  return (
    <AccessibilityContext.Provider
      value={{
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
        rulerY,
        readAloud,
        stopAudio,
        isAudioPlaying,
      }}
    >
      {readingRuler && <div className="reading-ruler" style={{ top: `${rulerY}px` }} aria-hidden="true" />}
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser usado dentro de AccessibilityProvider');
  }
  return context;
};
