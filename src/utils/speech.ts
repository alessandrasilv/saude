/**
 * Síntese de voz acessível para leitura em áudio de agendamentos e instruções
 * voltada para pessoas com baixa visão, idosos e dificuldades de leitura.
 */
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Síntese de voz não suportada pelo navegador.');
    return;
  }

  // Interrompe qualquer áudio em execução anterior
  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/[#*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.95; // Levemente pausado para maior clareza e compreensão
  utterance.pitch = 1.0;

  // Busca voz em português do Brasil se disponível
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find((v) => v.lang.includes('pt-BR') || v.lang.includes('pt'));
  if (ptVoice) {
    utterance.voice = ptVoice;
  }

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}
