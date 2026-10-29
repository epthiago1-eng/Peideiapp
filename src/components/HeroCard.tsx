import React, { useRef } from 'react';
import { formatCurrency, formatShortCurrency } from '../calc';

interface HeroCardProps {
  net: number;
  proventos: number;
  descontos: number;
  recebido: number;
  onSwipePrev?: () => void;
  onSwipeNext?: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  net,
  proventos,
  descontos,
  recebido,
  onSwipePrev,
  onSwipeNext,
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Only swipe if horizontal move > 50px and larger than vertical
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0 && onSwipePrev) {
        onSwipePrev();
      } else if (diffX < 0 && onSwipeNext) {
        onSwipeNext();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        background: 'linear-gradient(135deg, #0a84ff 0%, #5e5ce6 60%, #bf5af2 120%)',
        boxShadow: '0 12px 30px rgba(10,132,255,0.35)',
      }}
      className="relative overflow-hidden rounded-[26px] p-6 text-white transition-all select-none"
    >
      {/* Decorative translucent circle in top-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-xs"
      />

      <div className="relative z-10 flex flex-col">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-white/80">
          Líquido do holerite
        </span>
        <div
          aria-live="polite"
          className="mt-1 text-[32px] min-[360px]:text-[38px] font-extrabold tracking-tight tabular-nums"
        >
          {formatCurrency(net)}
        </div>

        {/* 3 mini translucent tiles */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {/* Tile 1: Proventos */}
          <div className="rounded-[14px] bg-white/16 backdrop-blur-md p-2.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-white/80 truncate">
              Proventos
            </span>
            <span className="mt-1 text-[15px] min-[360px]:text-[16px] font-bold tabular-nums truncate text-white">
              {formatShortCurrency(proventos)}
            </span>
          </div>

          {/* Tile 2: Descontos */}
          <div className="rounded-[14px] bg-white/16 backdrop-blur-md p-2.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-white/80 truncate">
              Descontos
            </span>
            <span className="mt-1 text-[15px] min-[360px]:text-[16px] font-bold tabular-nums truncate text-white/90">
              {formatShortCurrency(descontos)}
            </span>
          </div>

          {/* Tile 3: + Adiantamento */}
          <div className="rounded-[14px] bg-white/16 backdrop-blur-md p-2.5 flex flex-col justify-between border border-white/15">
            <span className="text-[11px] font-medium text-white/85 truncate" title="Líquido + Adiantamento">
              + Adiantamento
            </span>
            <span className="mt-1 text-[15px] min-[360px]:text-[16px] font-bold tabular-nums truncate text-white">
              {formatShortCurrency(recebido)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
