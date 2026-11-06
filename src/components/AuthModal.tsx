import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isValidCPF, formatCPF, formatPhone, formatSUSCard } from '../utils/cpf';
import { X, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { login, register, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Campos de Login
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Campos de Cadastro
  const [name, setName] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [susCard, setSusCard] = useState<string>('');
  const [lgpdConsent, setLgpdConsent] = useState<boolean>(true);

  // Estados de Validação e Feedback
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const isCPFCurrentlyValid = cpf.length >= 11 && isValidCPF(cpf);
  const isCPFFilled = cpf.replace(/\D/g, '').length === 11;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSusCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSUSCard(e.target.value);
    setSusCard(formatted);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier || !loginPassword) {
      setErrorMessage('Informe seu CPF ou e-mail e a senha cadastrada.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(loginIdentifier, loginPassword);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Falha no login.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name || !cpf || !email || !password || !phone || !birthDate) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!isValidCPF(cpf)) {
      setErrorMessage('O CPF informado não é válido. Verifique os números digitados.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 dígitos para sua segurança.');
      return;
    }

    if (!lgpdConsent) {
      setErrorMessage('É necessário aceitar os termos da LGPD para criar seu prontuário no SUS.');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name,
      cpf,
      email,
      password,
      phone,
      birth_date: birthDate,
      sus_card: susCard,
      lgpd_consent: lgpdConsent,
    });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Cadastro realizado com sucesso! Seus dados estão criptografados.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMessage(result.error || 'Erro ao realizar o cadastro.');
    }
  };

  const handleQuickDemo = async () => {
    await loginAsDemo();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header do Modal com Abas de Acesso */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <h2 id="auth-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === 'login' ? 'Entrar no Saúde para Todos' : 'Novo Cadastro de Paciente'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Identificação do Cidadão no Sistema Único de Saúde (SUS)
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alternador de Modo: Entrar ou Cadastrar (§1.A Segmented Tab) */}
        <div className="p-6 pb-2">
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Já tenho Cadastro (Entrar)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Criar Novo Cadastro (Com CPF)
            </button>
          </div>
        </div>

        {/* Mensagens de Sucesso ou Erro */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* FORMULÁRIO DE LOGIN */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-id" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Seu CPF ou E-mail cadastrado:
              </label>
              <input
                id="login-id"
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="000.000.000-00 ou seu@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-pass" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Senha de Acesso:
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <input
                id="login-pass"
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 dark:hover:bg-sky-600 rounded-xl transition-colors shadow-xs"
            >
              {isSubmitting ? 'Verificando dados...' : 'Acessar Meu Prontuário e Consultas'}
            </button>

            {/* Acesso de Teste Rápido */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block text-center">
                Deseja testar sem digitar?
              </span>
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-sky-800 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-xl border border-sky-200 dark:border-sky-800 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-sky-600" />
                <span>Entrar como Dona Maria Helena (Paciente de Demonstração)</span>
              </button>
            </div>
          </form>
        ) : (
          /* FORMULÁRIO DE CADASTRO COM VALIDAÇÃO DE CPF E LGPD */
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
            {/* Nome Completo */}
            <div className="space-y-1">
              <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nome Completo do Paciente *:
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Exemplo: Maria de Fátima Oliveira"
                className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* CPF com Validação Oficial da Receita Federal */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="reg-cpf" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Número de CPF (com validação oficial) *:
                </label>
                {isCPFFilled && (
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      isCPFCurrentlyValid
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isCPFCurrentlyValid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>CPF Válido</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>CPF Inválido</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <input
                id="reg-cpf"
                type="text"
                required
                maxLength={14}
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className={`w-full px-4 py-2 font-mono text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none ${
                  isCPFFilled
                    ? isCPFCurrentlyValid
                      ? 'border-emerald-500 ring-1 ring-emerald-500'
                      : 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-sky-500'
                }`}
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                O CPF é criptografado com chave AES-256 e protegido pela LGPD.
              </p>
            </div>

            {/* Data de Nascimento & Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="reg-birth" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Data de Nascimento *:
                </label>
                <input
                  id="reg-birth"
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Telefone / WhatsApp *:
                </label>
                <input
                  id="reg-phone"
                  type="text"
                  required
                  maxLength={15}
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Cartão SUS (Opcional, mas muito comum na rede pública) */}
            <div className="space-y-1">
              <label htmlFor="reg-sus" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Número do Cartão Nacional do SUS (Opcional):
              </label>
              <input
                id="reg-sus"
                type="text"
                maxLength={19}
                value={susCard}
                onChange={handleSusCardChange}
                placeholder="000 0000 0000 0000"
                className="w-full px-4 py-2 font-mono text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* E-mail e Senha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  E-mail do Paciente *:
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="reg-pass" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Senha *:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-sky-600 dark:text-sky-400"
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                <input
                  id="reg-pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 dígitos"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Termo de Consentimento da LGPD Obrigatório */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lgpdConsent}
                  onChange={(e) => setLgpdConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Consentimento LGPD (Lei 13.709/2018):
                  </span>{' '}
                  Autorizo o armazenamento criptografado dos meus dados de identificação e saúde para fins
                  exclusivos de agendamento e atendimento médico nas Unidades Básicas de Saúde.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isCPFCurrentlyValid}
              className={`w-full py-2.5 px-4 text-xs font-semibold text-white rounded-xl transition-all shadow-xs ${
                isSubmitting || !isCPFCurrentlyValid
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 dark:hover:bg-sky-600'
              }`}
            >
              {isSubmitting ? 'Registrando com Criptografia...' : 'Concluir Cadastro no SUS'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
