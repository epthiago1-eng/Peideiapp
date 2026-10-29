import React, { useState } from 'react';
import { computeMonth, formatCurrency, genRotations } from '../calc';
import { AppState, Params, Rotation } from '../types';
import { Stepper } from './Stepper';
import { Toggle } from './Toggle';

interface OnboardingWizardProps {
  initialState: AppState;
  onComplete: (updatedState: AppState) => void;
  onSkip: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialState,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard form state initialized from current/default state
  const [salario, setSalario] = useState<number>(initialState.params.salario);
  const [cambio, setCambio] = useState<number>(initialState.params.cambio);
  const [ano, setAno] = useState<number>(initialState.params.ano || 2026);

  // Escala
  const [dataSaidaBR, setDataSaidaBR] = useState<string>(() => {
    if (initialState.rotations.length > 0) {
      return initialState.rotations[0].saidaBR;
    }
    return `${initialState.params.ano || 2026}-01-13`;
  });
  const [gerarAnoInteiro, setGerarAnoInteiro] = useState(true);

  // Impostos & Deduções
  const [dependentes, setDependentes] = useState<number>(initialState.params.dependentesIR || 0);
  const [metodoIRRF, setMetodoIRRF] = useState<'manual' | 'progressivo'>(
    initialState.params.metodoIRRF || 'progressivo'
  );
  const [temPrevidencia, setTemPrevidencia] = useState(initialState.params.pctPrev > 0);
  const [temPGBL, setTemPGBL] = useState(initialState.params.pctPGBL > 0);

  // Compute a live preview of the payslip
  const previewParams: Params = {
    ...initialState.params,
    salario,
    cambio,
    ano,
    dependentesIR: dependentes,
    metodoIRRF,
    pctPrev: temPrevidencia ? 0.02 : 0,
    pctPGBL: temPGBL ? 0.02 : 0,
  };

  const previewRotations: Rotation[] = gerarAnoInteiro
    ? genRotations(dataSaidaBR, 29, 56, `${ano}-12-31`)
    : initialState.rotations;

  const previewState: AppState = {
    ...initialState,
    params: previewParams,
    rotations: previewRotations.length > 0 ? previewRotations : initialState.rotations,
  };

  // Preview calculation for the first month with rotation
  const previewMonthCalc = computeMonth(previewState, ano, 11);

  const handleFinish = () => {
    let finalRotations = initialState.rotations;
    if (gerarAnoInteiro && dataSaidaBR) {
      finalRotations = genRotations(dataSaidaBR, 29, 56, `${ano}-12-31`);
      if (finalRotations.length > 0) {
        finalRotations[0].nota = 'Escala configurada';
      }
    }

    const finalState: AppState = {
      ...initialState,
      params: previewParams,
      rotations: finalRotations,
      updatedAt: Date.now(),
    };

    onComplete(finalState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 min-[420px]:p-4 bg-black/55 backdrop-blur-md animate-in fade-in duration-300">
      {/* Container */}
      <div className="relative w-full max-w-[500px] max-h-[92vh] flex flex-col rounded-[26px] bg-white dark:bg-[#1c1c1e] text-[#111114] dark:text-[#f5f5f7] shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-black/[0.08] dark:border-white/[0.1] overflow-hidden">
        {/* Top Header bar with progress dots and Skip button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
          {/* Progress indicators (4 dots/bars) */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-7 bg-[#0a84ff]'
                    : i < step
                    ? 'w-3.5 bg-[#0a84ff]/50'
                    : 'w-3.5 bg-black/10 dark:bg-white/15'
                }`}
              />
            ))}
          </div>

          {/* Skip link */}
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] font-semibold text-[#8e8e93] hover:text-[#111114] dark:hover:text-[#f5f5f7] transition"
          >
            Pular
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 no-scrollbar">
          {/* STEP 1: Salário & Moeda */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] text-white font-extrabold text-2xl shadow-md">
                  R$
                </div>
                <h2 className="text-[24px] font-extrabold tracking-tight">
                  Bem-vindo ao RotaPay
                </h2>
                <p className="text-[13px] text-[#6e6e78] dark:text-[#98989f] max-w-sm mx-auto leading-relaxed">
                  Configuração inicial de remuneração. O salário e o câmbio podem variar durante o ano e você poderá confirmá-los para cada mês individualmente.
                </p>
              </div>

              <div className="rounded-[20px] bg-[#f7f7fa] dark:bg-[#2c2c2e] p-4 border border-black/[0.06] dark:border-white/[0.08] space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] block mb-1.5">
                    Salário base mensal (R$)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-[17px] font-bold text-[#8e8e93]">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={salario}
                      onChange={(e) => setSalario(parseFloat(e.target.value) || 0)}
                      className="w-full h-12 rounded-[12px] bg-white dark:bg-[#1c1c1e] pl-11 pr-4 text-right text-[18px] font-bold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] block mb-1">
                      Câmbio USD→BRL
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={cambio}
                      onChange={(e) => setCambio(parseFloat(e.target.value) || 5.45)}
                      className="w-full h-11 rounded-[12px] bg-white dark:bg-[#1c1c1e] px-3 text-right text-[15px] font-bold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] block mb-1">
                      Ano de referência
                    </label>
                    <input
                      type="number"
                      min="2020"
                      max="2035"
                      value={ano}
                      onChange={(e) => setAno(parseInt(e.target.value, 10) || 2026)}
                      className="w-full h-11 rounded-[12px] bg-white dark:bg-[#1c1c1e] px-3 text-right text-[15px] font-bold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Escala 28x28 */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#0a84ff]/15 text-[#0a84ff] text-2xl shadow-xs">
                  ✈️
                </div>
                <h2 className="text-[22px] font-extrabold tracking-tight">
                  Sua Escala Offshore
                </h2>
                <p className="text-[13px] text-[#6e6e78] dark:text-[#98989f] max-w-sm mx-auto">
                  A escala não é fixa: você pode gerar o ano para frente e depois editar ou ajustar cada rotação inserida (14x14, 21x21, 28x28 ou personalizada).
                </p>
              </div>

              <div className="rounded-[20px] bg-[#f7f7fa] dark:bg-[#2c2c2e] p-4 border border-black/[0.06] dark:border-white/[0.08] space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] block mb-1.5">
                    Data da 1ª saída do Brasil
                  </label>
                  <input
                    type="date"
                    value={dataSaidaBR}
                    onChange={(e) => setDataSaidaBR(e.target.value)}
                    className="w-full h-12 rounded-[12px] bg-white dark:bg-[#1c1c1e] px-3.5 text-[15px] font-semibold text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-[14px] bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06]">
                  <div className="flex flex-col pr-3">
                    <span className="text-[14px] font-bold text-[#111114] dark:text-[#f5f5f7]">
                      Gerar escala do ano inteiro
                    </span>
                    <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                      Gera automaticamente os ciclos de 56 dias até dezembro de {ano}
                    </span>
                  </div>
                  <Toggle checked={gerarAnoInteiro} onChange={setGerarAnoInteiro} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Impostos & Dependentes */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#5e5ce6]/15 text-[#5e5ce6] text-2xl shadow-xs">
                  📊
                </div>
                <h2 className="text-[22px] font-extrabold tracking-tight">
                  Impostos & Dependentes
                </h2>
                <p className="text-[13px] text-[#6e6e78] dark:text-[#98989f] max-w-sm mx-auto">
                  Ajuste suas deduções para que a projeção líquida reflita fielmente sua realidade fiscal.
                </p>
              </div>

              <div className="rounded-[20px] bg-[#f7f7fa] dark:bg-[#2c2c2e] p-4 border border-black/[0.06] dark:border-white/[0.08] space-y-4">
                {/* Dependentes */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col pr-2">
                    <span className="text-[14px] font-bold text-[#111114] dark:text-[#f5f5f7]">
                      Dependentes de IRRF
                    </span>
                    <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                      Dedução legal de R$ 189,59 por dependente
                    </span>
                  </div>
                  <Stepper
                    value={dependentes}
                    step={1}
                    min={0}
                    max={15}
                    onChange={setDependentes}
                    format={(v) => `${v}`}
                  />
                </div>

                {/* Método de IRRF */}
                <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#0a84ff] block">
                    Método de Cálculo do IRRF
                  </span>
                  <div className="grid grid-cols-2 p-1 rounded-xl bg-black/5 dark:bg-white/10 gap-1 text-[12px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setMetodoIRRF('progressivo')}
                      className={`py-2 rounded-lg transition-all ${
                        metodoIRRF === 'progressivo'
                          ? 'bg-white dark:bg-[#1c1c1e] text-[#0a84ff] shadow-xs'
                          : 'text-[#6e6e78] dark:text-[#98989f]'
                      }`}
                    >
                      Tabela Progressiva (Auto)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoIRRF('manual')}
                      className={`py-2 rounded-lg transition-all ${
                        metodoIRRF === 'manual'
                          ? 'bg-white dark:bg-[#1c1c1e] text-[#0a84ff] shadow-xs'
                          : 'text-[#6e6e78] dark:text-[#98989f]'
                      }`}
                    >
                      Alíquota Efetiva Fixa
                    </button>
                  </div>
                </div>

                {/* Previdência / PGBL Toggles */}
                <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                      Previdência privada básica (2%)
                    </span>
                    <Toggle checked={temPrevidencia} onChange={setTemPrevidencia} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                      PGBL empregado (2%)
                    </span>
                    <Toggle checked={temPGBL} onChange={setTemPGBL} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Pronto! Resumo */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#30d158]/15 text-[#30d158] text-2xl shadow-xs">
                  ✅
                </div>
                <h2 className="text-[22px] font-extrabold tracking-tight">
                  Tudo Configurado!
                </h2>
                <p className="text-[13px] text-[#6e6e78] dark:text-[#98989f] max-w-sm mx-auto">
                  Veja uma prévia do seu holerite estimado para um mês típico de rotação no Suriname:
                </p>
              </div>

              {/* Summary Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0a84ff 0%, #5e5ce6 60%, #bf5af2 120%)',
                  boxShadow: '0 8px 24px rgba(10,132,255,0.3)',
                }}
                className="rounded-[22px] p-5 text-white space-y-3.5"
              >
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                    Estimativa Líquida do Holerite
                  </span>
                  <div className="text-[32px] font-extrabold tracking-tight tabular-nums mt-0.5">
                    {formatCurrency(previewMonthCalc.net)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15 text-xs">
                  <div>
                    <span className="text-white/70 block">Proventos Brutos:</span>
                    <span className="font-bold text-white text-[14px] tabular-nums">
                      {formatCurrency(previewMonthCalc.prov)}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/70 block">Descontos + IR:</span>
                    <span className="font-bold text-white text-[14px] tabular-nums">
                      − {formatCurrency(previewMonthCalc.desc)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80">
                  <span>Regra de IRRF:</span>
                  <span className="font-semibold text-white">
                    {metodoIRRF === 'progressivo'
                      ? `Tabela Progressiva (${dependentes} dep.)`
                      : 'Alíquota Efetiva 17,54%'}
                  </span>
                </div>
              </div>

              <p className="text-[12px] text-[#6e6e78] dark:text-[#98989f] text-center leading-relaxed">
                Você poderá ajustar qualquer parâmetro a qualquer momento na aba <strong>Ajustes</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Button Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/[0.04] dark:border-white/[0.06] bg-[#f7f7fa]/60 dark:bg-[#2c2c2e]/40">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
              className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 text-[14px] font-semibold text-[#111114] dark:text-[#f5f5f7] hover:bg-black/10 transition"
            >
              Voltar
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
              className="px-6 py-2.5 rounded-xl bg-[#0a84ff] text-[14px] font-semibold text-white shadow-xs hover:bg-[#0a84ff]/90 transition"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-[#30d158] text-[15px] font-bold text-white shadow-xs hover:bg-[#30d158]/90 transition"
            >
              Começar a usar o RotaPay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
