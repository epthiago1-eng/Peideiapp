import React from 'react';

interface StatTilesProps {
  dias: number;
  dobra: number;
  off: number;
  viagens: number;
}

export const StatTiles: React.FC<StatTilesProps> = ({ dias, dobra, off, viagens }) => {
  return (
    <div className="grid grid-cols-2 min-[360px]:grid-cols-4 gap-2.5">
      {/* Tile 1: Suriname */}
      <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#0a84ff]" />
          <span className="text-[11px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider truncate">
            Suriname
          </span>
        </div>
        <span className="mt-2 text-[22px] font-bold tabular-nums text-[#111114] dark:text-[#f5f5f7]">
          {dias} <span className="text-[13px] font-normal text-[#6e6e78] dark:text-[#98989f]">dias</span>
        </span>
      </div>

      {/* Tile 2: Dobra */}
      <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ff9f0a]" />
          <span className="text-[11px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider truncate">
            Dobra
          </span>
        </div>
        <span className="mt-2 text-[22px] font-bold tabular-nums text-[#111114] dark:text-[#f5f5f7]">
          {dobra} <span className="text-[13px] font-normal text-[#6e6e78] dark:text-[#98989f]">dias</span>
        </span>
      </div>

      {/* Tile 3: Offshore líq. */}
      <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#30d158]" />
          <span className="text-[11px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider truncate">
            Offshore líq.
          </span>
        </div>
        <span className="mt-2 text-[22px] font-bold tabular-nums text-[#111114] dark:text-[#f5f5f7]">
          {off} <span className="text-[13px] font-normal text-[#6e6e78] dark:text-[#98989f]">dias</span>
        </span>
      </div>

      {/* Tile 4: Viagens */}
      <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#bf5af2]" />
          <span className="text-[11px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider truncate">
            Viagens
          </span>
        </div>
        <span className="mt-2 text-[22px] font-bold tabular-nums text-[#111114] dark:text-[#f5f5f7]">
          {viagens}
        </span>
      </div>
    </div>
  );
};
