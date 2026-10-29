import React from 'react';
import { computeMonth, formatCurrency, MONTH_NAMES, MONTH_SHORT_NAMES } from '../calc';
import { AppState, MonthCalculation } from '../types';

interface YearScreenProps {
  state: AppState;
  currentYear: number;
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
  onOpenMonthTab: () => void;
}

export const YearScreen: React.FC<YearScreenProps> = ({
  state,
  currentYear,
  selectedMonth,
  onSelectMonth,
  onOpenMonthTab,
}) => {
  // Pre-calculate all 12 months for the current year
  const monthsData: MonthCalculation[] = [];
  let totalProv = 0;
  let totalNet = 0;
  let totalDiasSR = 0;

  for (let m = 1; m <= 12; m++) {
    const calc = computeMonth(state, currentYear, m);
    monthsData.push(calc);
    totalProv += calc.prov;
    totalNet += calc.net;
    totalDiasSR += calc.dias;
  }

  const confirmedCount = monthsData.filter((m) => m.isConfirmed).length;
  const avgNet = totalNet / 12;

  // Max net value for chart scaling
  const maxNet = Math.max(...monthsData.map((m) => m.net), 1);

  const handleBarTap = (m: number) => {
    onSelectMonth(m);
    onOpenMonthTab();
  };

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-200">
      {/* Screen Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#6e6e78] dark:text-[#98989f]">
            {currentYear}
          </span>
          <h1 className="text-[32px] font-extrabold tracking-[-0.02em] text-[#111114] dark:text-[#f5f5f7] leading-tight">
            Visão anual
          </h1>
        </div>

        {/* Confirmation status chip */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.08] shadow-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              confirmedCount === 12
                ? 'bg-[#30d158]'
                : confirmedCount > 0
                ? 'bg-[#0a84ff]'
                : 'bg-[#ff9f0a]'
            }`}
          />
          <span className="text-[12px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
            {confirmedCount}/12 confirmados
          </span>
        </div>
      </div>

      {/* 2x2 KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* KPI 1: Proventos no ano */}
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f]">
            Proventos no ano
          </span>
          <span className="mt-2 text-[20px] min-[380px]:text-[22px] font-extrabold tabular-nums text-[#30d158] truncate">
            {formatCurrency(totalProv)}
          </span>
        </div>

        {/* KPI 2: Líquido no ano */}
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f]">
            Líquido no ano
          </span>
          <span className="mt-2 text-[20px] min-[380px]:text-[22px] font-extrabold tabular-nums text-[#0a84ff] dark:text-[#64d2ff] truncate">
            {formatCurrency(totalNet)}
          </span>
        </div>

        {/* KPI 3: Dias no Suriname */}
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f]">
            Dias no Suriname
          </span>
          <span className="mt-2 text-[20px] min-[380px]:text-[22px] font-extrabold tabular-nums text-[#111114] dark:text-[#f5f5f7]">
            {totalDiasSR} <span className="text-[13px] font-normal text-[#6e6e78] dark:text-[#98989f]">dias</span>
          </span>
        </div>

        {/* KPI 4: Média líquida/mês */}
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f]">
            Média líquida/mês
          </span>
          <span className="mt-2 text-[20px] min-[380px]:text-[22px] font-extrabold tabular-nums text-[#5e5ce6] truncate">
            {formatCurrency(avgNet)}
          </span>
        </div>
      </div>

      {/* SECTION: LÍQUIDO POR MÊS (180px pure CSS/SVG bar chart) */}
      <div className="space-y-2">
        <div className="text-[13px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] px-1">
          LÍQUIDO POR MÊS
        </div>
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08]">
          <div className="h-[180px] w-full flex items-end justify-between gap-1 pt-6 pb-2">
            {monthsData.map((m) => {
              const heightPct = Math.max(8, Math.round((m.net / maxNet) * 100));
              const hasSR = m.dias > 0;
              const isSelected = m.month === selectedMonth;

              return (
                <button
                  key={m.month}
                  type="button"
                  onClick={() => handleBarTap(m.month)}
                  title={`${MONTH_NAMES[m.month - 1]}: ${formatCurrency(m.net)} (${m.dias} dias SR)`}
                  className="flex flex-col items-center flex-1 h-full justify-end group focus:outline-none"
                >
                  {/* Vertical bar */}
                  <div
                    style={{
                      height: `${heightPct}%`,
                      background: hasSR
                        ? 'linear-gradient(180deg, #0a84ff 0%, #5e5ce6 100%)'
                        : undefined,
                    }}
                    className={`w-full max-w-[24px] rounded-t-[6px] transition-all duration-300 group-hover:opacity-85 ${
                      !hasSR ? 'bg-[#8e8e93]/35 dark:bg-[#8e8e93]/20' : ''
                    } ${
                      isSelected
                        ? 'ring-2 ring-[#ff9f0a] ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1e]'
                        : ''
                    }`}
                  />
                  {/* Month label */}
                  <span
                    className={`text-[10px] mt-2 font-medium ${
                      isSelected
                        ? 'text-[#ff9f0a] font-bold'
                        : 'text-[#6e6e78] dark:text-[#98989f]'
                    }`}
                  >
                    {MONTH_SHORT_NAMES[m.month - 1]}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] text-[11px] text-[#6e6e78] dark:text-[#98989f]">
            Toque em um mês para abrir o holerite dele. Barras cinza = meses sem dias no Suriname.
          </p>
        </div>
      </div>

      {/* SECTION: DETALHE MENSAL */}
      <div className="space-y-2">
        <div className="text-[13px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] px-1">
          DETALHE MENSAL
        </div>
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.08]">
          {monthsData.map((m) => (
            <button
              key={m.month}
              type="button"
              onClick={() => handleBarTap(m.month)}
              className="w-full text-left flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:bg-black/[0.04] transition-colors"
            >
              <div className="flex flex-col pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                    {MONTH_NAMES[m.month - 1]}
                  </span>
                  {m.isConfirmed ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#30d158]/15 text-[#30d158] inline-flex items-center gap-1">
                      <span>✓</span> Confirmado
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[#8e8e93]">
                      Estimado
                    </span>
                  )}
                  {m.hasCustomSalary && (
                    <span className="text-[10px] font-medium px-1 py-0.2 rounded bg-[#0a84ff]/10 text-[#0a84ff]">
                      Salário ajustado
                    </span>
                  )}
                </div>
                <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f] mt-0.5">
                  {m.dias} dias SR · Salário: {formatCurrency(m.salario)} · Câmbio: R$ {m.cambio.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-[15px] font-bold tabular-nums text-[#0a84ff] dark:text-[#64d2ff]">
                    {formatCurrency(m.net)}
                  </span>
                  <span className="text-[10px] text-[#8e8e93]">líquido</span>
                </div>
                <svg className="w-4 h-4 text-[#8e8e93]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          ))}

          {/* Footer Total Líquido */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-[#f7f7fa] dark:bg-[#2c2c2e]/60">
            <span className="text-[15px] font-extrabold text-[#111114] dark:text-[#f5f5f7]">
              Total líquido
            </span>
            <span className="text-[16px] font-extrabold tabular-nums text-[#0a84ff] dark:text-[#64d2ff]">
              {formatCurrency(totalNet)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
