import React, { useEffect, useRef, useState } from 'react';
import { exportBackup, resetToDefaults, validateAndParseBackup } from '../storage';
import { syncManager, SUPABASE_SQL_SCRIPT, CrudDiagnosticReport } from '../sync';
import { AppState, Holiday, Params } from '../types';
import { Toggle } from '../components/Toggle';
import { SupabaseAuthModal } from '../components/SupabaseAuthModal';

interface SettingsScreenProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onTriggerOnboarding?: () => void;
  showToast: (msg: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  state,
  onUpdateState,
  onTriggerOnboarding,
  showToast,
}) => {
  const { params, holidays } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collapsible sections state: first open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    salario: true,
    adicionais: false,
    dobra: false,
    descontos: false,
  });

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [syncStatus, setSyncStatus] = useState(syncManager.getStatusLabel());
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(syncManager.getUserEmail());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; tableExists: boolean } | null>(null);
  const [showSqlDetails, setShowSqlDetails] = useState(false);
  const [crudReport, setCrudReport] = useState<CrudDiagnosticReport | null>(null);
  const [isRunningCrudTest, setIsRunningCrudTest] = useState(false);
  const [showConfirmDeleteCloud, setShowConfirmDeleteCloud] = useState(false);
  const [isDeletingCloud, setIsDeletingCloud] = useState(false);

  useEffect(() => {
    return syncManager.subscribe(() => {
      setSyncStatus(syncManager.getStatusLabel());
      setCurrentUserEmail(syncManager.getUserEmail());
    });
  }, []);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateParams = (partial: Partial<Params>) => {
    const updatedParams = { ...params, ...partial };
    const nextState: AppState = {
      ...state,
      params: updatedParams,
      updatedAt: Date.now(),
    };
    onUpdateState(nextState);
    showToast('Salvo');
  };

  // Safe numeric input handlers
  const handleNumberParam = (key: keyof Params, valStr: string, min = 0) => {
    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val) && val >= min) {
      updateParams({ [key]: val } as Partial<Params>);
    }
  };

  const handlePercentParam = (key: keyof Params, valStr: string) => {
    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      updateParams({ [key]: val / 100 } as Partial<Params>);
    }
  };

  // Holiday handlers
  const handleUpdateHoliday = (index: number, updated: Partial<Holiday>) => {
    const nextHolidays = [...holidays];
    nextHolidays[index] = { ...nextHolidays[index], ...updated };
    nextHolidays.sort((a, b) => a.date.localeCompare(b.date));
    onUpdateState({ ...state, holidays: nextHolidays, updatedAt: Date.now() });
    showToast('Salvo');
  };

  const handleRemoveHoliday = (index: number) => {
    const nextHolidays = holidays.filter((_, i) => i !== index);
    onUpdateState({ ...state, holidays: nextHolidays, updatedAt: Date.now() });
    showToast('Feriado removido');
  };

  const handleAddHoliday = () => {
    const newHol: Holiday = {
      date: `${params.ano}-01-01`,
      name: 'Novo Feriado',
    };
    const nextHolidays = [...holidays, newHol].sort((a, b) => a.date.localeCompare(b.date));
    onUpdateState({ ...state, holidays: nextHolidays, updatedAt: Date.now() });
    showToast('Feriado adicionado');
  };

  // Backup & Restore
  const handleExport = () => {
    exportBackup(state);
    showToast('Backup exportado');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const restored = validateAndParseBackup(text);
        onUpdateState(restored);
        showToast('Backup importado com sucesso');
      } catch (err) {
        console.error('Import error:', err);
        showToast('Arquivo inválido');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    const def = resetToDefaults();
    onUpdateState(def);
    setShowConfirmReset(false);
    showToast('Padrões restaurados');
  };

  const handleManualSync = async () => {
    setSyncStatus(syncManager.getStatusLabel());
    const res = await syncManager.forceSync(state, (remoteState) => {
      onUpdateState(remoteState);
      showToast('Dados atualizados da nuvem');
    });
    setSyncStatus(syncManager.getStatusLabel());
    if (res.success) {
      showToast('Sincronizado na nuvem');
    } else {
      showToast(res.message);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingDb(true);
    setTestResult(null);
    try {
      const result = await syncManager.testConnection();
      setTestResult(result);
      if (result.ok) {
        showToast('Tabela verificada com sucesso!');
      } else {
        showToast(result.tableExists ? 'Erro ao consultar' : 'Tabela não existe ainda no Supabase');
      }
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    showToast('Script SQL copiado!');
  };

  const handleRunCrudDiagnostic = async () => {
    setIsRunningCrudTest(true);
    setCrudReport(null);
    try {
      const res = await syncManager.runCrudDiagnostic(state);
      setCrudReport(res);
      if (res.overallSuccess) {
        showToast('CRUD com Supabase 100% verificado!');
      } else {
        showToast(res.message);
      }
    } finally {
      setIsRunningCrudTest(false);
    }
  };

  const handleDeleteCloudData = async () => {
    setIsDeletingCloud(true);
    try {
      const res = await syncManager.deleteRemoteState();
      setShowConfirmDeleteCloud(false);
      showToast(res.message);
      setSyncStatus(syncManager.getStatusLabel());
    } finally {
      setIsDeletingCloud(false);
    }
  };

  const handleSignOut = async () => {
    await syncManager.signOut();
    setCurrentUserEmail(null);
    setSyncStatus(syncManager.getStatusLabel());
    showToast('Desconectado');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Screen Header */}
      <div className="flex flex-col pt-2">
        <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#6e6e78] dark:text-[#98989f]">
          PARÂMETROS
        </span>
        <h1 className="text-[32px] font-extrabold tracking-[-0.02em] text-[#111114] dark:text-[#f5f5f7] leading-tight">
          Ajustes
        </h1>
      </div>

      {/* SECTION CONTA (Supabase & Cloud Status) */}
      <div className="space-y-3">
        <div className="text-[13px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] px-1">
          CONTA & SINCRONIZAÇÃO EM NUVEM
        </div>

        {/* Cloud Status Card */}
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${syncStatus.dotClass}`} />
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                  {syncStatus.label}
                </span>
                <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
                  {currentUserEmail ? currentUserEmail : 'Nenhum usuário conectado'}
                </span>
              </div>
            </div>

            {currentUserEmail ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  className="rounded-lg bg-[#0a84ff]/10 px-3 py-1.5 text-[13px] font-semibold text-[#0a84ff] hover:bg-[#0a84ff]/20 transition cursor-pointer"
                >
                  Sincronizar agora
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-lg bg-[#ff453a]/10 px-3 py-1.5 text-[13px] font-semibold text-[#ff453a] hover:bg-[#ff453a]/20 transition cursor-pointer"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="rounded-lg bg-[#0a84ff] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-xs hover:bg-[#0a84ff]/90 transition cursor-pointer"
              >
                Conectar conta
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[12px]">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="text-[#0a84ff] hover:underline font-medium cursor-pointer"
            >
              Configurar URL e chaves do Supabase
            </button>
            <span className="text-[#8e8e93]">Nuvem Supabase PostgreSQL</span>
          </div>
        </div>

        {/* Dedicated Supabase SQL Setup Card */}
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0a84ff]/10 text-[#0a84ff] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
              SQL
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-bold text-[#111114] dark:text-[#f5f5f7]">
                Script SQL Completo (Tabelas Relacionais + Unificada + Carga 2026)
              </h3>
              <p className="text-[12px] text-[#6e6e78] dark:text-[#98989f] mt-0.5 leading-relaxed">
                <strong>Sim, é indispensável rodar o SQL!</strong> O Supabase é um banco PostgreSQL real. Este script cria a tabela unificada <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">user_state</code>, as tabelas relacionais (<code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">rotations</code>, <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">month_overrides</code>, <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">user_params</code>), regras de segurança RLS e popula automaticamente os dados e holerites reais de 2026.
              </p>
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`rounded-xl p-3 text-[12px] leading-relaxed border ${
                testResult.ok
                  ? 'bg-[#30d158]/10 text-[#248a3d] dark:text-[#30d158] border-[#30d158]/30'
                  : 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/30'
              }`}
            >
              <div className="font-semibold mb-0.5">
                {testResult.ok ? '✓ Banco de dados pronto!' : '✕ Tabela ausente ou inacessível'}
              </div>
              <div>{testResult.message}</div>
              {!testResult.ok && (
                <div className="mt-1.5 font-medium">
                  → Copie o script SQL abaixo, acesse o <strong>SQL Editor</strong> no painel do Supabase e clique em <strong>Run</strong>.
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a84ff] px-3 py-1.5 text-[12px] font-semibold text-white shadow-xs hover:bg-[#0a84ff]/90 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copiar Script SQL
            </button>

            <button
              type="button"
              disabled={isTestingDb}
              onClick={handleTestConnection}
              className="inline-flex items-center gap-1.5 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] px-3 py-1.5 text-[12px] font-semibold text-[#111114] dark:text-[#f5f5f7] hover:bg-black/[0.1] dark:hover:bg-white/[0.15] transition cursor-pointer disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              {isTestingDb ? 'Verificando…' : 'Testar tabela no Supabase'}
            </button>

            <button
              type="button"
              onClick={() => setShowSqlDetails(!showSqlDetails)}
              className="text-[12px] font-medium text-[#0a84ff] hover:underline px-1 ml-auto cursor-pointer"
            >
              {showSqlDetails ? 'Ocultar código SQL' : 'Visualizar código SQL'}
            </button>
          </div>

          {/* Quick 3-Step Guide */}
          <div className="rounded-xl bg-[#f7f7fa] dark:bg-[#2c2c2e] p-3 text-[11px] text-[#6e6e78] dark:text-[#98989f] space-y-1">
            <div className="font-semibold text-[#111114] dark:text-[#f5f5f7] mb-1">Como rodar no Supabase (leva 30 segundos):</div>
            <div>1. Acesse seu painel no Supabase (<strong>supabase.com</strong>) e abra seu projeto.</div>
            <div>2. Na barra lateral esquerda, clique em <strong>SQL Editor</strong> e crie uma <strong>New query</strong>.</div>
            <div>3. Cole o script SQL copiado e clique no botão verde <strong>Run</strong>.</div>
          </div>

          {/* Expanded SQL Code block */}
          {showSqlDetails && (
            <div className="space-y-2 pt-1 animate-in fade-in duration-150">
              <div className="rounded-xl bg-[#18181b] p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 border border-white/10">
                <pre>{SUPABASE_SQL_SCRIPT}</pre>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="w-full text-center py-2 rounded-lg bg-[#0a84ff]/10 text-[#0a84ff] text-[12px] font-semibold hover:bg-[#0a84ff]/20 transition cursor-pointer"
              >
                Copiar todo o SQL acima
              </button>
            </div>
          )}
        </div>

        {/* Dedicated CRUD Diagnostic Card */}
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#30d158]/10 text-[#30d158] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
              ✓
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-bold text-[#111114] dark:text-[#f5f5f7]">
                Diagnóstico do CRUD (Create, Read, Update, Delete)
              </h3>
              <p className="text-[12px] text-[#6e6e78] dark:text-[#98989f] mt-0.5 leading-relaxed">
                Verifique se as 4 operações de banco de dados com o Supabase estão ativas e com permissões RLS liberadas para sua conta.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isRunningCrudTest}
              onClick={handleRunCrudDiagnostic}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#30d158] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-xs hover:bg-[#30d158]/90 transition cursor-pointer disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${isRunningCrudTest ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              {isRunningCrudTest ? 'Testando operações CRUD…' : 'Executar Teste do CRUD'}
            </button>

            {currentUserEmail && (
              <button
                type="button"
                onClick={() => setShowConfirmDeleteCloud(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff453a]/10 px-3 py-1.5 text-[12px] font-semibold text-[#ff453a] hover:bg-[#ff453a]/20 transition cursor-pointer"
              >
                Limpar dados da nuvem (Delete)
              </button>
            )}
          </div>

          {/* CRUD Report Output */}
          {crudReport && (
            <div className="space-y-2.5 pt-2 animate-in fade-in duration-200">
              <div
                className={`rounded-xl p-3 text-[12px] leading-relaxed border ${
                  crudReport.overallSuccess
                    ? 'bg-[#30d158]/10 text-[#248a3d] dark:text-[#30d158] border-[#30d158]/30'
                    : 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/30'
                }`}
              >
                <div className="font-semibold mb-0.5">
                  {crudReport.overallSuccess ? '✓ CRUD 100% Operacional no Supabase!' : '✕ Falha na verificação do CRUD'}
                </div>
                <div>{crudReport.message}</div>
              </div>

              {/* 4 Operations Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                {/* CREATE */}
                <div className="rounded-xl bg-[#f7f7fa] dark:bg-[#2c2c2e] p-3 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111114] dark:text-[#f5f5f7]">1. CREATE (Insert)</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      crudReport.create.ok ? 'bg-[#30d158]/15 text-[#30d158]' : 'bg-[#ff453a]/15 text-[#ff453a]'
                    }`}>
                      {crudReport.create.ok ? '✓ OK' : '✕ Erro'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                    {crudReport.create.message}
                  </p>
                </div>

                {/* READ */}
                <div className="rounded-xl bg-[#f7f7fa] dark:bg-[#2c2c2e] p-3 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111114] dark:text-[#f5f5f7]">2. READ (Select)</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      crudReport.read.ok ? 'bg-[#30d158]/15 text-[#30d158]' : 'bg-[#ff453a]/15 text-[#ff453a]'
                    }`}>
                      {crudReport.read.ok ? '✓ OK' : '✕ Erro'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                    {crudReport.read.message}
                  </p>
                </div>

                {/* UPDATE */}
                <div className="rounded-xl bg-[#f7f7fa] dark:bg-[#2c2c2e] p-3 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111114] dark:text-[#f5f5f7]">3. UPDATE (Upsert)</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      crudReport.update.ok ? 'bg-[#30d158]/15 text-[#30d158]' : 'bg-[#ff453a]/15 text-[#ff453a]'
                    }`}>
                      {crudReport.update.ok ? '✓ OK' : '✕ Erro'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                    {crudReport.update.message}
                  </p>
                </div>

                {/* DELETE */}
                <div className="rounded-xl bg-[#f7f7fa] dark:bg-[#2c2c2e] p-3 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111114] dark:text-[#f5f5f7]">4. DELETE (RLS Policy)</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      crudReport.deletePolicy.ok ? 'bg-[#30d158]/15 text-[#30d158]' : 'bg-[#ff453a]/15 text-[#ff453a]'
                    }`}>
                      {crudReport.deletePolicy.ok ? '✓ OK' : '✕ Erro'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                    {crudReport.deletePolicy.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal: Delete Cloud Data */}
      {showConfirmDeleteCloud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setShowConfirmDeleteCloud(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-[380px] rounded-[24px] bg-white dark:bg-[#1c1c1e] p-6 shadow-2xl border border-black/[0.06] dark:border-white/[0.1] space-y-4">
            <h3 className="text-[18px] font-bold text-[#111114] dark:text-[#f5f5f7]">
              Excluir dados na nuvem?
            </h3>
            <p className="text-[13px] text-[#6e6e78] dark:text-[#98989f] leading-relaxed">
              Esta ação executará uma operação de <strong>DELETE</strong> no Supabase, removendo o registro correspondente ao seu usuário. Seus dados neste aparelho serão mantidos.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteCloud(false)}
                className="flex-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] py-2.5 text-[14px] font-semibold text-[#111114] dark:text-[#f5f5f7] hover:bg-black/[0.1] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingCloud}
                onClick={handleDeleteCloudData}
                className="flex-1 rounded-xl bg-[#ff453a] py-2.5 text-[14px] font-semibold text-white shadow-xs hover:bg-[#ff453a]/90 transition cursor-pointer disabled:opacity-50"
              >
                {isDeletingCloud ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GROUP 1: SALÁRIO E CÂMBIO */}
      <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('salario')}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
        >
          <span className="text-[16px] font-bold text-[#111114] dark:text-[#f5f5f7]">
            Salário e câmbio
          </span>
          <svg
            className={`w-5 h-5 text-[#8e8e93] transition-transform duration-200 ${
              openSections.salario ? 'rotate-90' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {openSections.salario && (
          <div className="border-t border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            <div className="p-3 bg-black/[0.02] dark:bg-white/[0.02] text-[12px] text-[#6e6e78] dark:text-[#98989f]">
              Estes são os valores padrão do ano. Na aba <strong>Meu mês</strong>, você pode alterar e <strong>confirmar o salário e a cotação do câmbio individualmente para cada mês</strong>.
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Salário mensal padrão (R$)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={params.salario}
                onBlur={(e) => handleNumberParam('salario', e.target.value)}
                className="w-28 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Câmbio USD→BRL padrão
              </span>
              <input
                type="number"
                step="0.01"
                min="0.1"
                defaultValue={params.cambio}
                onBlur={(e) => handleNumberParam('cambio', e.target.value, 0.1)}
                className="w-24 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Ano de referência
              </span>
              <input
                type="number"
                min="2000"
                max="2100"
                defaultValue={params.ano}
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val >= 2000 && val <= 2100) {
                    updateParams({ ano: val });
                  }
                }}
                className="w-24 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* GROUP 2: ADICIONAIS */}
      <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('adicionais')}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
        >
          <span className="text-[16px] font-bold text-[#111114] dark:text-[#f5f5f7]">
            Adicionais
          </span>
          <svg
            className={`w-5 h-5 text-[#8e8e93] transition-transform duration-200 ${
              openSections.adicionais ? 'rotate-90' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {openSections.adicionais && (
          <div className="border-t border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Sobreaviso (%)
              </span>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                defaultValue={Math.round(params.pctSob * 100)}
                onBlur={(e) => handlePercentParam('pctSob', e.target.value)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Periculosidade (%)
              </span>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                defaultValue={Math.round(params.pctPer * 100)}
                onBlur={(e) => handlePercentParam('pctPer', e.target.value)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col pr-3">
                <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                  Sobreaviso/periculosidade todo mês
                </span>
                <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                  Desligado: só em meses com dias no Suriname
                </span>
              </div>
              <Toggle
                checked={params.sobPerSempre}
                onChange={(checked) => updateParams({ sobPerSempre: checked })}
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Fator serviço no campo
              </span>
              <input
                type="number"
                step="0.001"
                min="0"
                defaultValue={params.fatorCampo}
                onBlur={(e) => handleNumberParam('fatorCampo', e.target.value)}
                className="w-24 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Fator noturno campo
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={params.fatorNot}
                onBlur={(e) => handleNumberParam('fatorNot', e.target.value)}
                className="w-24 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Horas noturnas/dia
              </span>
              <input
                type="number"
                min="0"
                max="24"
                defaultValue={params.horasNot}
                onBlur={(e) => handleNumberParam('horasNot', e.target.value)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Divisor noturno
              </span>
              <input
                type="number"
                min="1"
                defaultValue={params.divNot}
                onBlur={(e) => handleNumberParam('divNot', e.target.value, 1)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Adicional por viagem (R$)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={params.valorViagem}
                onBlur={(e) => handleNumberParam('valorViagem', e.target.value)}
                className="w-24 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Bônus exterior (US$/dia)
              </span>
              <input
                type="number"
                min="0"
                defaultValue={params.bonusUSD}
                onBlur={(e) => handleNumberParam('bonusUSD', e.target.value)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Adic. trabalho no exterior (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                defaultValue={Math.round(params.pctTrabExt * 100)}
                onBlur={(e) => handlePercentParam('pctTrabExt', e.target.value)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Hora extra (%)
              </span>
              <input
                type="number"
                min="0"
                defaultValue={Math.round(params.pctHE * 100)}
                onBlur={(e) => handlePercentParam('pctHE', e.target.value)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Divisor horas/mês
              </span>
              <input
                type="number"
                min="1"
                defaultValue={params.divHoras}
                onBlur={(e) => handleNumberParam('divHoras', e.target.value, 1)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* GROUP 3: DOBRA */}
      <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('dobra')}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
        >
          <span className="text-[16px] font-bold text-[#111114] dark:text-[#f5f5f7]">
            Dobra
          </span>
          <svg
            className={`w-5 h-5 text-[#8e8e93] transition-transform duration-200 ${
              openSections.dobra ? 'rotate-90' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {openSections.dobra && (
          <div className="border-t border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            <div className="p-3 bg-black/[0.02] dark:bg-white/[0.02] text-[12px] text-[#6e6e78] dark:text-[#98989f] leading-relaxed">
              A dobra é categorizada a partir do 28º dia offshore (ou seja, o <strong>29º dia é uma dobra</strong>, o 30º, etc.). Os dias de dobra aparecem destacados em <strong>âmbar</strong> no calendário.
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Regra de categorização da dobra
              </span>
              <select
                value={params.regraDobra || 'escala_28'}
                onChange={(e) => updateParams({ regraDobra: e.target.value as 'escala_28' | 'domingos_feriados' })}
                className="h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-2.5 text-[13px] font-semibold text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] outline-none cursor-pointer"
              >
                <option value="escala_28">A partir do 29º dia (Escala &gt; 28 dias)</option>
                <option value="domingos_feriados">Domingos e feriados no Suriname</option>
              </select>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col">
                <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                  Dias de escala para início de dobra
                </span>
                <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                  Ex: 28 dias normais (o 29º dia em diante vira dobra)
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="60"
                defaultValue={params.diasBaseDobra || 28}
                onBlur={(e) => handleNumberParam('diasBaseDobra', e.target.value, 1)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Fator dobra (× salário/dia)
              </span>
              <input
                type="number"
                step="0.00001"
                min="0"
                defaultValue={params.fatorDobra}
                onBlur={(e) => handleNumberParam('fatorDobra', e.target.value)}
                className="w-28 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            {params.regraDobra === 'domingos_feriados' && (
              <>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                    Domingos no Suriname contam como dobra
                  </span>
                  <Toggle
                    checked={params.dobraDom}
                    onChange={(checked) => updateParams({ dobraDom: checked })}
                  />
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                    Feriados no Suriname contam como dobra
                  </span>
                  <Toggle
                    checked={params.dobraFer}
                    onChange={(checked) => updateParams({ dobraFer: checked })}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* GROUP 4: DESCONTOS */}
      <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('descontos')}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
        >
          <span className="text-[16px] font-bold text-[#111114] dark:text-[#f5f5f7]">
            Descontos
          </span>
          <svg
            className={`w-5 h-5 text-[#8e8e93] transition-transform duration-200 ${
              openSections.descontos ? 'rotate-90' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {openSections.descontos && (
          <div className="border-t border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            {/* IMPOSTOS & TAXAS: SELEÇÃO DE MÉTODO E ALÍQUOTAS */}
            <div className="p-4 bg-[#f7f7fa]/60 dark:bg-[#2c2c2e]/40 space-y-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#0a84ff]">
                Cálculo de Imposto de Renda (IRRF)
              </span>

              {/* Segmented control for IRRF */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-black/5 dark:bg-white/10 gap-1 text-[13px] font-semibold">
                <button
                  type="button"
                  onClick={() => updateParams({ metodoIRRF: 'manual' })}
                  className={`py-1.5 rounded-lg transition-all ${
                    (params.metodoIRRF || 'manual') === 'manual'
                      ? 'bg-white dark:bg-[#1c1c1e] text-[#0a84ff] shadow-xs'
                      : 'text-[#6e6e78] dark:text-[#98989f]'
                  }`}
                >
                  Alíquota efetiva manual
                </button>
                <button
                  type="button"
                  onClick={() => updateParams({ metodoIRRF: 'progressivo' })}
                  className={`py-1.5 rounded-lg transition-all ${
                    params.metodoIRRF === 'progressivo'
                      ? 'bg-white dark:bg-[#1c1c1e] text-[#0a84ff] shadow-xs'
                      : 'text-[#6e6e78] dark:text-[#98989f]'
                  }`}
                >
                  Tabela progressiva auto
                </button>
              </div>

              {(params.metodoIRRF || 'manual') === 'manual' ? (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col pr-2">
                    <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                      IRRF – alíquota efetiva (%)
                    </span>
                    <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                      Estimativa sobre o total de proventos
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={(params.pctIRRF * 100).toFixed(2)}
                    onBlur={(e) => handlePercentParam('pctIRRF', e.target.value)}
                    className="w-20 h-9 rounded-[10px] bg-white dark:bg-[#1c1c1e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <p className="text-[11px] text-[#6e6e78] dark:text-[#98989f] leading-relaxed">
                    Aplica automaticamente as faixas da Receita Federal (7,5% a 27,5%), deduzindo INSS, Previdência e Dependentes.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col pr-2">
                      <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                        Dependentes de IRRF
                      </span>
                      <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                        Dedução legal de R$ 189,59 cada
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      defaultValue={params.dependentesIR || 0}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 0) {
                          updateParams({ dependentesIR: val });
                        }
                      }}
                      className="w-20 h-9 rounded-[10px] bg-white dark:bg-[#1c1c1e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col pr-2">
                      <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                        Dedução por dependente (R$)
                      </span>
                      <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                        Padrão legal: R$ 189,59
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={params.deducaoDependente || 189.59}
                      onBlur={(e) => handleNumberParam('deducaoDependente', e.target.value)}
                      className="w-24 h-9 rounded-[10px] bg-white dark:bg-[#1c1c1e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col pr-2">
                      <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                        Outras deduções da base (R$)
                      </span>
                      <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                        Pensão alimentícia judicial, etc.
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={params.outrasDeducoesIR || 0}
                      onBlur={(e) => handleNumberParam('outrasDeducoesIR', e.target.value)}
                      className="w-24 h-9 rounded-[10px] bg-white dark:bg-[#1c1c1e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col pr-2">
                      <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                        Alíquota máxima de IR (%)
                      </span>
                      <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                        Padrão: 27,5%
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      defaultValue={Math.round((params.aliquotaIRRFMax || 0.275) * 1000) / 10}
                      onBlur={(e) => handlePercentParam('aliquotaIRRFMax', e.target.value)}
                      className="w-20 h-9 rounded-[10px] bg-white dark:bg-[#1c1c1e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col pr-2">
                      <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                        Parcela a deduzir faixa máxima (R$)
                      </span>
                      <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                        Padrão: R$ 896,00
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={params.parcelaDedIRRFMax || 896.00}
                      onBlur={(e) => handleNumberParam('parcelaDedIRRFMax', e.target.value)}
                      className="w-24 h-9 rounded-[10px] bg-white dark:bg-[#1c1c1e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SELEÇÃO DO INSS */}
            <div className="p-4 bg-[#f7f7fa]/60 dark:bg-[#2c2c2e]/40 space-y-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#0a84ff]">
                Cálculo de Previdência Oficial (INSS)
              </span>

              {/* Segmented control for INSS */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-black/5 dark:bg-white/10 gap-1 text-[13px] font-semibold">
                <button
                  type="button"
                  onClick={() => updateParams({ metodoINSS: 'fixo' })}
                  className={`py-1.5 rounded-lg transition-all ${
                    (params.metodoINSS || 'fixo') === 'fixo'
                      ? 'bg-white dark:bg-[#1c1c1e] text-[#0a84ff] shadow-xs'
                      : 'text-[#6e6e78] dark:text-[#98989f]'
                  }`}
                >
                  Teto fixo manual
                </button>
                <button
                  type="button"
                  onClick={() => updateParams({ metodoINSS: 'progressivo' })}
                  className={`py-1.5 rounded-lg transition-all ${
                    params.metodoINSS === 'progressivo'
                      ? 'bg-white dark:bg-[#1c1c1e] text-[#0a84ff] shadow-xs'
                      : 'text-[#6e6e78] dark:text-[#98989f]'
                  }`}
                >
                  Tabela progressiva auto
                </button>
              </div>

              {(params.metodoINSS || 'fixo') === 'fixo' ? (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                    INSS mensal fixo (R$)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={params.inss}
                    onBlur={(e) => handleNumberParam('inss', e.target.value)}
                    className="w-24 h-9 rounded-[10px] bg-white dark:bg-[#1c1c1e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col pr-2">
                    <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                      Teto máximo do INSS (R$)
                    </span>
                    <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                      Calcula 7,5% a 14% até o limite
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={params.tetoINSS || params.inss || 988.09}
                    onBlur={(e) => handleNumberParam('tetoINSS', e.target.value)}
                    className="w-24 h-9 rounded-[10px] bg-white dark:bg-[#1c1c1e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Adiantamento quinzenal (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                defaultValue={Math.round(params.pctAdiant * 100)}
                onBlur={(e) => handlePercentParam('pctAdiant', e.target.value)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Previdência privada básica (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                defaultValue={Math.round(params.pctPrev * 100)}
                onBlur={(e) => handlePercentParam('pctPrev', e.target.value)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                PGBL empregado (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                defaultValue={Math.round(params.pctPGBL * 100)}
                onBlur={(e) => handlePercentParam('pctPGBL', e.target.value)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Co-participação médica (R$)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={params.copart}
                onBlur={(e) => handleNumberParam('copart', e.target.value)}
                className="w-24 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                Assistência odontológica (R$)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={params.odonto}
                onBlur={(e) => handleNumberParam('odonto', e.target.value)}
                className="w-24 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7]">
                FGTS (empresa) (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                defaultValue={Math.round(params.pctFGTS * 100)}
                onBlur={(e) => handlePercentParam('pctFGTS', e.target.value)}
                className="w-20 h-9 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[14px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION FERIADOS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f]">
            FERIADOS ({holidays.length})
          </span>
          <button
            type="button"
            onClick={handleAddHoliday}
            className="text-[13px] font-semibold text-[#0a84ff] hover:opacity-75 transition"
          >
            + Adicionar feriado
          </button>
        </div>

        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.08]">
          {holidays.map((h, idx) => (
            <div key={`${h.date}-${idx}`} className="flex items-center justify-between px-3 py-2.5 gap-2">
              <input
                type="date"
                defaultValue={h.date}
                onBlur={(e) => handleUpdateHoliday(idx, { date: e.target.value })}
                className="w-36 h-8 rounded-lg bg-[#f7f7fa] dark:bg-[#2c2c2e] px-2 text-[13px] text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] outline-none"
              />
              <input
                type="text"
                defaultValue={h.name}
                onBlur={(e) => handleUpdateHoliday(idx, { name: e.target.value })}
                className="flex-1 h-8 rounded-lg bg-[#f7f7fa] dark:bg-[#2c2c2e] px-2.5 text-[13px] text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] outline-none truncate"
              />
              <button
                type="button"
                onClick={() => handleRemoveHoliday(idx)}
                aria-label={`Remover feriado ${h.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#ff453a] hover:bg-[#ff453a]/10 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION DADOS */}
      <div className="space-y-2">
        <div className="text-[13px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] px-1">
          DADOS & BACKUP
        </div>

        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.08]">
          <button
            type="button"
            onClick={handleExport}
            className="w-full text-left flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
          >
            <span className="text-[15px] font-semibold text-[#0a84ff]">
              Exportar backup (JSON)
            </span>
            <svg className="w-4 h-4 text-[#8e8e93]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          <label className="w-full text-left flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition">
            <span className="text-[15px] font-semibold text-[#0a84ff]">
              Importar backup
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />
            <svg className="w-4 h-4 text-[#8e8e93]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </label>

          {onTriggerOnboarding && (
            <button
              type="button"
              onClick={onTriggerOnboarding}
              className="w-full text-left flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[15px] font-semibold text-[#0a84ff]">
                  Refazer configuração inicial guiada
                </span>
                <span className="rounded-md bg-[#0a84ff]/10 text-[#0a84ff] px-1.5 py-0.5 text-[10px] font-bold uppercase">
                  Assistente
                </span>
              </div>
              <svg className="w-4 h-4 text-[#8e8e93]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </button>
          )}

          {showConfirmReset ? (
            <div className="flex items-center justify-between px-4 py-3 bg-[#ff453a]/10">
              <span className="text-[13px] font-semibold text-[#ff453a]">
                Confirmar restauração de padrões?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg bg-[#ff453a] px-3 py-1 text-[13px] font-semibold text-white shadow-xs hover:bg-[#ff453a]/90 transition"
                >
                  Restaurar
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="rounded-lg bg-black/5 dark:bg-white/10 px-3 py-1 text-[13px] font-medium text-[#111114] dark:text-[#f5f5f7]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="w-full text-left flex items-center justify-between px-4 py-3.5 hover:bg-[#ff453a]/5 transition"
            >
              <span className="text-[15px] font-semibold text-[#ff453a]">
                Restaurar padrões
              </span>
              <svg className="w-4 h-4 text-[#ff453a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* FOOTER HINTS */}
      <div className="pt-2 pb-6 text-center space-y-2">
        <p className="text-[12px] text-[#6e6e78] dark:text-[#98989f] leading-relaxed max-w-md mx-auto">
          IRRF é estimado por alíquota efetiva. Os valores são uma projeção e podem diferir do holerite oficial.
        </p>
        <p className="text-[11px] font-semibold text-[#8e8e93]">
          RotaPay v1.0.0
        </p>
      </div>

      {/* Supabase Auth & Config Modal */}
      <SupabaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          syncManager.forceSync(state, (remoteState) => {
            onUpdateState(remoteState);
          });
        }}
        showToast={showToast}
      />
    </div>
  );
};
