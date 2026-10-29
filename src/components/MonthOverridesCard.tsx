import React from 'react';
import { formatCurrency, formatNumberBR } from '../calc';
import { MonthCalculation, MonthOverride, Params } from '../types';
import { Stepper } from './Stepper';

interface MonthOverridesCardProps {
  calc: MonthCalculation;
  params: Params;
  onUpdateOverride: (override: MonthOverride) => void;
}

export const MonthOverridesCard: React.FC<MonthOverridesCardProps> = ({
  calc,
  params,
  onUpdateOverride,
}) => {
  const {
    dobraAuto,
    viagAuto,
    override = {},
    fgts,
    salario,
    cambio,
    isConfirmed,
    hasCustomSalary,
    hasCustomCambio,
  } = calc;

  const handleToggleConfirm = () => {
    const nextConfirmed = !isConfirmed;
    onUpdateOverride({
      ...override,
      confirmed: nextConfirmed,
      confirmedAt: nextConfirmed ? new Date().toISOString() : undefined,
      // When confirming, preserve the current effective salary and exchange rate so they are locked for this month
      salario: override.salario !== undefined ? override.salario : params.salario,
      cambio: override.cambio !== undefined ? override.cambio : params.cambio,
    });
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value.trim().replace(',', '.');
    if (valStr === '') {
      const next = { ...override };
      delete next.salario;
      onUpdateOverride(next);
      return;
    }
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0) {
      onUpdateOverride({ ...override, salario: val });
    }
  };

  const handleCambioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value.trim().replace(',', '.');
    if (valStr === '') {
      const next = { ...override };
      delete next.cambio;
      onUpdateOverride(next);
      return;
    }
    const val = parseFloat(valStr);
    if (!isNaN(val) && val > 0) {
      onUpdateOverride({ ...override, cambio: val });
    }
  };

  const handleHEChange = (val: number) => {
    onUpdateOverride({
      ...override,
      he: val > 0 ? val : undefined,
    });
  };

  const handleDobraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value.trim();
    if (valStr === '') {
      const next = { ...override };
      delete next.dobra;
      onUpdateOverride(next);
      return;
    }
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateOverride({ ...override, dobra: val });
    }
  };

  const handleViagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value.trim();
    if (valStr === '') {
      const next = { ...override };
      delete next.viag;
      onUpdateOverride(next);
      return;
    }
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateOverride({ ...override, viag: val });
    }
  };

  const handleResetMonth = () => {
    onUpdateOverride({});
  };

  const hasAnyOverride =
    override.salario !== undefined ||
    override.cambio !== undefined ||
    override.he !== undefined ||
    override.dobra !== undefined ||
    override.viag !== undefined ||
    override.confirmed !== undefined;

  return (
    <div className="space-y-3">
      {/* Header with Title and Reset button */}
      <div className="flex items-center justify-between px-1">
        <div className="text-[13px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f]">
          AJUSTES E CONFIRMAÇÃO DO MÊS
        </div>
        {hasAnyOverride && (
          <button
            type="button"
            onClick={handleResetMonth}
            className="text-[12px] font-medium text-[#0a84ff] hover:underline"
          >
            Restaurar padrões
          </button>
        )}
      </div>

      {/* Confirmation Status Banner */}
      <div
        className={`rounded-[20px] p-4 border transition-all duration-200 ${
          isConfirmed
            ? 'bg-[#30d158]/10 dark:bg-[#30d158]/15 border-[#30d158]/30 dark:border-[#30d158]/30'
            : 'bg-[#ff9f0a]/10 dark:bg-[#ff9f0a]/15 border-[#ff9f0a]/30 dark:border-[#ff9f0a]/30'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isConfirmed
                  ? 'bg-[#30d158] text-white shadow-sm'
                  : 'bg-[#ff9f0a] text-white shadow-sm'
              }`}
            >
              {isConfirmed ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-[#111114] dark:text-[#f5f5f7]">
                {isConfirmed ? 'Valores confirmados deste mês' : 'Mês com valores estimados'}
              </span>
              {override.notes && (
                <span className="inline-block mt-0.5 rounded-md bg-[#30d158]/20 text-[#30d158] dark:text-[#30d158] px-2 py-0.5 text-[11px] font-bold w-fit">
                  📄 {override.notes}
                </span>
              )}
              <p className="text-[12px] text-[#6e6e78] dark:text-[#98989f] leading-snug mt-0.5">
                {isConfirmed
                  ? `Salário R$ ${formatNumberBR(salario, 2, 2)} · Câmbio R$ ${formatNumberBR(cambio, 2, 4)} por USD`
                  : 'A cotação e o salário podem mudar a cada mês. Confirme os valores oficiais para fechar o holerite.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleConfirm}
            className={`shrink-0 rounded-[12px] px-3.5 py-2 text-[13px] font-bold shadow-xs active:scale-95 transition ${
              isConfirmed
                ? 'bg-white dark:bg-[#2c2c2e] text-[#111114] dark:text-[#f5f5f7] border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.02]'
                : 'bg-[#0a84ff] text-white hover:bg-[#0a84ff]/90'
            }`}
          >
            {isConfirmed ? 'Desbloquear' : 'Confirmar mês'}
          </button>
        </div>
      </div>

      {/* Main Settings Form Card */}
      <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.08]">
        {/* Row 1: Salário Base deste Mês */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                Salário base deste mês
              </span>
              {hasCustomSalary && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#0a84ff]/10 text-[#0a84ff]">
                  Custom
                </span>
              )}
            </div>
            <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
              Padrão anual: {formatCurrency(params.salario)}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder={params.salario.toFixed(2)}
              value={override.salario !== undefined ? override.salario : ''}
              onChange={handleSalaryChange}
              className="w-[110px] h-[36px] rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[15px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
            />
          </div>
        </div>

        {/* Row 2: Câmbio USD->BRL deste Mês */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                Câmbio USD→BRL
              </span>
              {hasCustomCambio && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#0a84ff]/10 text-[#0a84ff]">
                  Custom
                </span>
              )}
            </div>
            <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
              Padrão anual: R$ {formatNumberBR(params.cambio, 2, 4)}
            </span>
          </div>
          <input
            type="number"
            step="0.01"
            min="0.1"
            placeholder={params.cambio.toFixed(2)}
            value={override.cambio !== undefined ? override.cambio : ''}
            onChange={handleCambioChange}
            className="w-[110px] h-[36px] rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[15px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
          />
        </div>

        {/* Row 3: Horas extras 60% */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
              Horas extras 60%
            </span>
            <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
              Quantidade no mês
            </span>
          </div>
          <Stepper
            value={override.he || 0}
            step={0.5}
            min={0}
            onChange={handleHEChange}
          />
        </div>

        {/* Row 4: Dias de dobra */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col pr-2">
            <span className="text-[15px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
              Dias de dobra
            </span>
            <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
              Automático: {dobraAuto} {params.regraDobra === 'domingos_feriados' ? '(domingos/feriados no Suriname)' : '(rotação contínua > 28 dias)'}
            </span>
          </div>
          <input
            type="number"
            min="0"
            max="31"
            placeholder="Auto"
            value={override.dobra !== undefined ? override.dobra : ''}
            onChange={handleDobraChange}
            className="w-[84px] h-[36px] rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[15px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
          />
        </div>

        {/* Row 5: Viagens */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col pr-2">
            <span className="text-[15px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
              Viagens
            </span>
            <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
              Automático: {viagAuto}
            </span>
          </div>
          <input
            type="number"
            min="0"
            max="20"
            placeholder="Auto"
            value={override.viag !== undefined ? override.viag : ''}
            onChange={handleViagChange}
            className="w-[84px] h-[36px] rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-right text-[15px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
          />
        </div>
      </div>

      {/* Hint below */}
      <p className="text-[12px] text-[#6e6e78] dark:text-[#98989f] px-1 pt-1 leading-relaxed">
        Campos em branco assumem os valores padrão das configurações. FGTS depositado este mês:{' '}
        <strong className="text-[#111114] dark:text-[#f5f5f7]">{formatCurrency(fgts)}</strong>.
      </p>
    </div>
  );
};
