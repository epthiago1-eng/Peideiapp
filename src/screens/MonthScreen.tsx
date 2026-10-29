import React, { useEffect, useState } from 'react';
import { computeMonth, formatCurrency, MONTH_NAMES } from '../calc';
import { EarningsCompositionBar } from '../components/EarningsCompositionBar';
import { EarningsList } from '../components/EarningsList';
import { HeroCard } from '../components/HeroCard';
import { MonthCalendar } from '../components/MonthCalendar';
import { MonthOverridesCard } from '../components/MonthOverridesCard';
import { PWAInstallBanner } from '../components/PWAInstallBanner';
import { StatTiles } from '../components/StatTiles';
import { syncManager } from '../sync';
import { AppState, MonthOverride } from '../types';

interface MonthScreenProps {
  state: AppState;
  currentYear: number;
  currentMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onUpdateOverride: (year: number, month: number, override: MonthOverride) => void;
  showToast: (msg: string) => void;
}

export const MonthScreen: React.FC<MonthScreenProps> = ({
  state,
  currentYear,
  currentMonth,
  onYearChange,
  onMonthChange,
  onUpdateOverride,
  showToast,
}) => {
  const calc = computeMonth(state, currentYear, currentMonth);
  const [syncStatus, setSyncStatus] = useState(syncManager.getStatusLabel());

  React.useEffect(() => {
    return syncManager.subscribe(() => {
      setSyncStatus(syncManager.getStatusLabel());
    });
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      onYearChange(currentYear - 1);
      onMonthChange(12);
    } else {
      onMonthChange(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onYearChange(currentYear + 1);
      onMonthChange(1);
    } else {
      onMonthChange(currentMonth + 1);
    }
  };

  const handleGoToCurrentMonth = () => {
    const now = new Date();
    onYearChange(now.getUTCFullYear());
    onMonthChange(now.getUTCMonth() + 1);
    showToast('Mês atual');
  };

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-200">
      <PWAInstallBanner />

      {/* Screen Header with Large Title */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${syncStatus.dotClass}`}
              title={syncStatus.label}
            />
            <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#6e6e78] dark:text-[#98989f]">
              HOLERITE ESTIMADO
            </span>
          </div>
          <h1 className="text-[32px] font-extrabold tracking-[-0.02em] text-[#111114] dark:text-[#f5f5f7] leading-tight">
            Meu mês
          </h1>
        </div>

        {/* Round Calendar Icon Button */}
        <button
          type="button"
          onClick={handleGoToCurrentMonth}
          title="Ir para o mês atual"
          aria-label="Ir para o mês atual"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white dark:bg-[#1c1c1e] text-[#0a84ff] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] hover:scale-105 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="3" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
            <circle cx="12" cy="15" r="2" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Month Switcher */}
      <div className="flex items-center justify-between rounded-[18px] bg-white dark:bg-[#1c1c1e] p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08]">
        <button
          type="button"
          onClick={handlePrevMonth}
          aria-label="Mês anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#0a84ff] hover:bg-[#0a84ff]/10 active:scale-95 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span className="text-[17px] font-bold text-[#111114] dark:text-[#f5f5f7]">
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Próximo mês"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#0a84ff] hover:bg-[#0a84ff]/10 active:scale-95 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Month Confirmation Quick Status Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-[16px] bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-[13px]">
        <div className="flex items-center gap-2 overflow-hidden">
          <span
            className={`flex h-2.5 w-2.5 shrink-0 rounded-full ${
              calc.isConfirmed ? 'bg-[#30d158]' : 'bg-[#ff9f0a]'
            }`}
          />
          <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center min-[380px]:gap-1.5 truncate">
            <span className="font-bold text-[#111114] dark:text-[#f5f5f7]">
              {calc.isConfirmed ? 'Mês confirmado' : 'Valores estimados'}
            </span>
            <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f] truncate">
              · {formatCurrency(calc.salario)} · US$ 1 = R$ {calc.cambio.toFixed(2)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const nextConfirmed = !calc.isConfirmed;
            onUpdateOverride(currentYear, currentMonth, {
              ...calc.override,
              confirmed: nextConfirmed,
              salario: calc.override?.salario ?? state.params.salario,
              cambio: calc.override?.cambio ?? state.params.cambio,
            });
            showToast(nextConfirmed ? 'Mês confirmado!' : 'Confirmação desbloqueada');
          }}
          className={`shrink-0 text-[12px] font-bold px-2.5 py-1 rounded-[8px] transition ${
            calc.isConfirmed
              ? 'text-[#6e6e78] hover:text-[#111114] dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.06]'
              : 'text-[#0a84ff] bg-[#0a84ff]/10 hover:bg-[#0a84ff]/15'
          }`}
        >
          {calc.isConfirmed ? 'Desbloquear' : 'Confirmar'}
        </button>
      </div>

      {/* Hero Card with Net & 3 mini tiles */}
      <HeroCard
        net={calc.net}
        proventos={calc.prov}
        descontos={calc.desc}
        recebido={calc.recebido}
        onSwipePrev={handlePrevMonth}
        onSwipeNext={handleNextMonth}
      />

      {/* 4 Stat Tiles */}
      <StatTiles
        dias={calc.dias}
        dobra={calc.dobra}
        off={calc.off}
        viagens={calc.viagens}
      />

      {/* CALENDÁRIO */}
      <div className="space-y-2">
        <div className="text-[13px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] px-1">
          CALENDÁRIO
        </div>
        <MonthCalendar year={currentYear} month={currentMonth} days={calc.days} />
      </div>

      {/* COMPOSIÇÃO DOS PROVENTOS */}
      <div className="space-y-2">
        <div className="text-[13px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] px-1">
          COMPOSIÇÃO DOS PROVENTOS
        </div>
        <EarningsCompositionBar
          proventos={calc.proventos}
          provTotal={calc.prov}
        />
      </div>

      {/* PROVENTOS & DESCONTOS INSET LISTS */}
      <EarningsList calc={calc} />

      {/* AJUSTES DESTE MÊS */}
      <MonthOverridesCard
        calc={calc}
        params={state.params}
        onUpdateOverride={(override) => onUpdateOverride(currentYear, currentMonth, override)}
      />
    </div>
  );
};
