import React from 'react';

interface StepperProps {
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  step = 0.5,
  min = 0,
  max = 999,
  onChange,
  format,
}) => {
  const handleDecrement = () => {
    const next = Math.max(min, Math.round((value - step) * 100) / 100);
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, Math.round((value + step) * 100) / 100);
    onChange(next);
  };

  const displayText = format
    ? format(value)
    : value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className="inline-flex items-center rounded-lg bg-[#f7f7fa] dark:bg-[#2c2c2e] p-1 border border-black/[0.04] dark:border-white/[0.08]">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        aria-label="Diminuir"
        className="flex h-7 w-7 items-center justify-center rounded-md bg-white dark:bg-[#3a3a3c] text-[#0a84ff] font-bold text-lg shadow-xs hover:bg-[#0a84ff]/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        −
      </button>
      <span className="min-w-[44px] text-center text-[15px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7]">
        {displayText}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        aria-label="Aumentar"
        className="flex h-7 w-7 items-center justify-center rounded-md bg-white dark:bg-[#3a3a3c] text-[#0a84ff] font-bold text-lg shadow-xs hover:bg-[#0a84ff]/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        +
      </button>
    </div>
  );
};
