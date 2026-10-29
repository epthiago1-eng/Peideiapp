import React, { useState } from 'react';
import { syncManager, SUPABASE_SQL_SCRIPT } from '../sync';

interface SupabaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'config' | 'sql';

export const SupabaseAuthModal: React.FC<SupabaseAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [mode, setMode] = useState<AuthMode>(() =>
    syncManager.isConfigured() ? 'login' : 'config'
  );

  const [email, setEmail] = useState('ep.Thiago1@gmail.com');
  const [password, setPassword] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState(() => syncManager.getConfig().url);
  const [supabaseKey, setSupabaseKey] = useState(() => syncManager.getConfig().anonKey);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; tableExists: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'config') {
      if (!supabaseUrl.trim() || !supabaseKey.trim()) {
        setErrorMessage('Por favor, informe a URL e a Anon Key do seu projeto Supabase.');
        return;
      }
      syncManager.setConfig({
        url: supabaseUrl.trim(),
        anonKey: supabaseKey.trim(),
      });
      showToast('Configuração do Supabase salva');
      setMode('login');
      return;
    }

    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMessage('Informe seu e-mail para receber as instruções.');
        return;
      }
      setLoading(true);
      const res = await syncManager.resetPassword(email.trim());
      setLoading(false);
      if (res.success) {
        showToast('E-mail de redefinição enviado');
        setMode('login');
      } else {
        setErrorMessage(res.error || 'Erro ao redefinir senha.');
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Preencha seu e-mail e senha.');
      return;
    }

    setLoading(true);

    if (mode === 'login') {
      const res = await syncManager.signIn(email.trim(), password);
      setLoading(false);
      if (res.success) {
        showToast('Conectado com sucesso');
        onSuccess();
        onClose();
      } else {
        if (res.error?.toLowerCase().includes('email not confirmed')) {
          setErrorMessage('E-mail ainda não confirmado no Supabase. Para acesso imediato sem depender de links, desmarque a opção "Confirm email" em Authentication > Providers > Email no painel do Supabase.');
        } else {
          setErrorMessage(res.error || 'Falha ao autenticar.');
        }
      }
    } else if (mode === 'signup') {
      const res = await syncManager.signUp(email.trim(), password);
      setLoading(false);
      if (res.success) {
        if (res.confirmNeeded) {
          showToast('Conta criada no Supabase!');
          setErrorMessage('Conta criada! Se o login falhar por e-mail não confirmado, desmarque a opção "Confirm email" em Authentication > Providers > Email no painel do Supabase para acesso instantâneo.');
          setMode('login');
        } else {
          showToast('Conta criada e conectada');
          onSuccess();
          onClose();
        }
      } else {
        setErrorMessage(res.error || 'Erro ao criar conta.');
      }
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    showToast('SQL copiado para a área de transferência');
  };

  const handleTestTable = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await syncManager.testConnection();
      setTestResult(res);
      if (res.ok) {
        showToast('Tabela verificada no Supabase!');
      } else {
        showToast(res.tableExists ? 'Erro ao acessar' : 'Tabela user_state não existe');
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[420px] rounded-[24px] bg-white dark:bg-[#1c1c1e] text-[#111114] dark:text-[#f5f5f7] p-6 shadow-2xl border border-black/[0.06] dark:border-white/[0.1] max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-[#8e8e93] hover:text-[#111114] dark:hover:text-white p-1 cursor-pointer"
        >
          ✕
        </button>

        {/* 84px gradient "R$" logo */}
        <div className="flex justify-center mb-3">
          <div
            style={{
              background: 'linear-gradient(135deg, #0a84ff 0%, #5e5ce6 60%, #bf5af2 120%)',
              boxShadow: '0 8px 24px rgba(10,132,255,0.3)',
            }}
            className="flex h-[84px] w-[84px] items-center justify-center rounded-[22px] text-white font-extrabold text-[36px] tracking-tight"
          >
            R$
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-5">
          <h2 className="text-[22px] font-extrabold tracking-tight">RotaPay</h2>
          <p className="text-[13px] text-[#6e6e78] dark:text-[#98989f] mt-0.5">
            {mode === 'login' && 'Entre para ver e sincronizar seus holerites'}
            {mode === 'signup' && 'Crie sua conta para salvar suas rotações na nuvem'}
            {mode === 'forgot' && 'Redefinição de senha'}
            {mode === 'config' && 'Conectar projeto Supabase'}
            {mode === 'sql' && 'Script SQL Completo (Tabelas e Carga 2026)'}
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 rounded-xl bg-[#ff453a]/10 p-3 text-[13px] font-medium text-[#ff453a] border border-[#ff453a]/20">
            {errorMessage}
          </div>
        )}

        {/* Forms */}
        {mode === 'sql' ? (
          <div className="space-y-3">
            <div className="text-[12px] text-[#6e6e78] dark:text-[#98989f] leading-relaxed">
              Cria a tabela unificada <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">user_state</code>, tabelas relacionais (<code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">rotations</code>, <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">month_overrides</code>, <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">user_params</code>), permissões RLS e carga inicial de 2026:
            </div>

            <div className="rounded-xl bg-[#18181b] p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto border border-black/[0.06] dark:border-white/[0.08] max-h-52">
              <pre>{SUPABASE_SQL_SCRIPT}</pre>
            </div>

            {testResult && (
              <div
                className={`rounded-xl p-3 text-[12px] border ${
                  testResult.ok
                    ? 'bg-[#30d158]/10 text-[#248a3d] dark:text-[#30d158] border-[#30d158]/30'
                    : 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/30'
                }`}
              >
                <div className="font-semibold">{testResult.ok ? '✓ Sucesso' : '✕ Atenção'}</div>
                <div>{testResult.message}</div>
              </div>
            )}

            <button
              type="button"
              onClick={copySql}
              className="w-full rounded-xl bg-[#0a84ff] py-2.5 text-[14px] font-semibold text-white shadow-xs hover:bg-[#0a84ff]/90 cursor-pointer"
            >
              Copiar script SQL
            </button>

            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestTable}
              className="w-full rounded-xl bg-black/[0.05] dark:bg-white/[0.08] py-2.5 text-[14px] font-semibold text-[#111114] dark:text-[#f5f5f7] hover:bg-black/[0.1] dark:hover:bg-white/[0.15] cursor-pointer disabled:opacity-50"
            >
              {isTesting ? 'Verificando tabela…' : 'Testar se tabela já existe'}
            </button>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-[13px] font-semibold text-[#0a84ff] cursor-pointer"
              >
                Voltar para o login
              </button>
            </div>
          </div>
        ) : mode === 'config' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-[16px] bg-[#f7f7fa] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              <div className="p-3">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] block mb-1">
                  Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-transparent text-[14px] text-[#111114] dark:text-[#f5f5f7] outline-none"
                />
              </div>
              <div className="p-3">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] block mb-1">
                  Anon / Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full bg-transparent text-[14px] text-[#111114] dark:text-[#f5f5f7] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#0a84ff] py-3 text-[15px] font-semibold text-white shadow-xs hover:bg-[#0a84ff]/90"
            >
              Salvar e Continuar
            </button>

            <div className="flex justify-between items-center text-[12px] pt-1">
              <button
                type="button"
                onClick={() => setMode('sql')}
                className="text-[#0a84ff] font-medium"
              >
                Ver script SQL (tabela user_state)
              </button>
              {syncManager.isConfigured() && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#0a84ff] font-medium"
                >
                  Ir para login
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Grouped card */}
            <div className="rounded-[16px] bg-[#f7f7fa] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              <div className="p-3">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] block mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-[15px] text-[#111114] dark:text-[#f5f5f7] outline-none"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="p-3">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] block mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-[15px] text-[#111114] dark:text-[#f5f5f7] outline-none"
                  />
                </div>
              )}
            </div>

            {(mode === 'login' || mode === 'signup') && (
              <div className="rounded-xl bg-[#0a84ff]/8 dark:bg-[#0a84ff]/15 p-2.5 text-[11px] text-[#0a84ff] dark:text-[#64d2ff] leading-relaxed border border-[#0a84ff]/20">
                💡 <strong>Dica de acesso rápido:</strong> Para entrar sem depender de link por e-mail, desative <em>Confirm email</em> em <strong>Authentication &gt; Providers &gt; Email</strong> no painel do Supabase.
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0a84ff] py-3 text-[16px] font-semibold text-white shadow-xs hover:bg-[#0a84ff]/90 disabled:opacity-50 transition cursor-pointer"
            >
              {loading
                ? 'Carregando…'
                : mode === 'login'
                ? 'Entrar'
                : mode === 'signup'
                ? 'Criar conta'
                : 'Enviar e-mail'}
            </button>

            {/* Footer Links */}
            <div className="flex flex-col items-center gap-2 text-[13px] pt-1">
              {mode === 'login' && (
                <>
                  <div className="flex justify-between w-full">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[#0a84ff] hover:opacity-80 font-medium"
                    >
                      Esqueci a senha
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-[#0a84ff] hover:opacity-80 font-semibold"
                    >
                      Criar conta
                    </button>
                  </div>
                </>
              )}

              {mode === 'signup' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#0a84ff] hover:opacity-80 font-medium"
                >
                  Já tem uma conta? Entrar
                </button>
              )}

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#0a84ff] hover:opacity-80 font-medium"
                >
                  Voltar para o login
                </button>
              )}

              <div className="pt-2 flex items-center justify-between w-full text-[11px] text-[#8e8e93]">
                <button
                  type="button"
                  onClick={() => setMode('config')}
                  className="hover:underline text-[#0a84ff]"
                >
                  Configurar chaves Supabase
                </button>
                <button
                  type="button"
                  onClick={() => setMode('sql')}
                  className="hover:underline text-[#0a84ff]"
                >
                  Ver SQL da tabela
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
