import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Download, FileText, CheckCircle2, User, Key, Database } from 'lucide-react';

export const LGPDModal: React.FC = () => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      const res = await fetch(`/api/lgpd/export/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portabilidade_dados_lgpd_${user.name.toLowerCase().replace(/\s+/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadSuccess(true);
      }
    } catch {
      alert('Erro ao exportar os dados.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Privacidade e Proteção de Dados (LGPD)</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) na Saúde Pública.
          </p>
        </div>
      </div>

      {/* Cartão de Resumo da Proteção Criptográfica */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>Criptografia de CPF</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Seu CPF é criptografado em repouso com algoritmo padrão militar <strong>AES-256</strong> e
              armazenado sob chave simétrica segura.
            </p>
            <div className="pt-2 text-xs font-mono text-slate-800 dark:text-slate-200">
              Exibição mascarada: <span className="font-bold">{user ? user.cpf_masked : '***.***.***-**'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <Key className="w-4 h-4" />
              <span>Proteção de Senhas</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Senhas nunca são salvas em texto puro. O sistema emprega <strong>PBKDF2 com Salt criptográfico</strong> e 10.000 iterações de hash.
            </p>
            <div className="pt-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              Inviolabilidade garantida
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Database className="w-4 h-4" />
              <span>Finalidade Exclusiva</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Os dados de saúde destinam-se exclusivamente ao agendamento, prontuário e regulação do SUS, vedado qualquer compartilhamento comercial.
            </p>
            <div className="pt-2 text-xs text-amber-700 dark:text-amber-400 font-semibold">
              Artigo 7º, II da LGPD
            </div>
          </div>
        </div>

        {/* Direitos do Titular (Art. 18) e Botão de Portabilidade */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Seus Direitos como Titular de Dados Pessoais:
          </h3>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
            <li>
              <strong>Acesso e Confirmação:</strong> Você pode consultar a qualquer momento seus dados cadastrais e prontuários médicos.
            </li>
            <li>
              <strong>Portabilidade dos Dados (Art. 18, V):</strong> Obtenha uma cópia estruturada em formato aberto de todos os seus dados e histórico de consultas.
            </li>
            <li>
              <strong>Correção e Atualização:</strong> Mantenha seus números de contato e residência sempre atualizados para contato da equipe da UBS.
            </li>
            <li>
              <strong>Revogação do Consentimento:</strong> Conforme as diretrizes do Ministério da Saúde para sistemas públicos de assistência médica.
            </li>
          </ul>

          {user && (
            <div className="pt-3">
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-xl transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Gerando Relatório Seguro...' : 'Exportar Meus Dados em JSON (Portabilidade LGPD)'}</span>
              </button>

              {downloadSuccess && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Arquivo de portabilidade gerado e baixado com sucesso.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
