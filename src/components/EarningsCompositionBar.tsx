import React from 'react';
import { formatCurrency, formatPercentBR } from '../calc';
import { EarningsBreakdown } from '../types';

interface EarningsCompositionBarProps {
  proventos: EarningsBreakdown;
  provTotal: number;
}

const ITEMS: Array<{
  key: keyof EarningsBreakdown;
  color: string;
  label: string;
}> = [
  { key: 'salario', color: '#8e8e93', label: 'Salário base' },
  { key: 'dobra', color: '#ff9f0a', label: 'Dobra' },
  { key: 'bonus', color: '#30d158', label: 'Bônus USD' },
  { key: 'campo', color: '#0a84ff', label: 'Campo' },
  { key: 'not', color: '#1c3faa', label: 'Noturno' },
  { key: 'per', color: '#ff453a', label: 'Periculosidade' },
  { key: 'sob', color: '#5e5ce6', label: 'Sobreaviso' },
  { key: 'trab', color: '#d4a300', label: 'Trab. exterior' },
  { key: 'viag', color: '#bf5af2', label: 'Viagem' },
  { key: 'he', color: '#64d2ff', label: 'Horas extras' },
  { key: 'dsr', color: '#40c8e0', label: 'DSR' },
];

export const EarningsCompositionBar: React.FC<EarningsCompositionBarProps> = ({
  proventos,
  provTotal,
}) => {
  if (provTotal <= 0) return null;

  const salario = proventos.salario;
  const adicionaisVal = Math.max(0, provTotal - salario);
  const adicionaisPct = adicionaisVal / provTotal;

  return (
    <div className="space-y-2">
      {/* 10px rounded stacked horizontal bar */}
      <div className="h-[10px] w-full flex overflow-hidden rounded-full bg-[#e5e5ea] dark:bg-[#2c2c2e]">
        {ITEMS.map((item) => {
          const val = proventos[item.key] || 0;
          if (val <= 0) return null;
          const pct = (val / provTotal) * 100;
          return (
            <div
              key={item.key}
              style={{
                width: `${pct}%`,
                backgroundColor: item.color,
              }}
              title={`${item.label}: ${formatCurrency(val)} (${pct.toFixed(1)}%)`}
              className="h-full transition-all duration-500 ease-out"
            />
          );
        })}
      </div>

      {/* Hint below */}
      <p className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
        Adicionais representam <strong className="text-[#111114] dark:text-[#f5f5f7]">{formatPercentBR(adicionaisPct)}</strong> dos proventos ({formatCurrency(adicionaisVal)}).
      </p>
    </div>
  );
};
