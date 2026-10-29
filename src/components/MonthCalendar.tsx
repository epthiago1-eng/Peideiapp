import React from 'react';
import { getDayOfWeekUTC } from '../calc';
import { DayCalendarInfo } from '../types';

interface MonthCalendarProps {
  year: number;
  month: number;
  days: DayCalendarInfo[];
}

const WEEKDAY_HEADERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const MonthCalendar: React.FC<MonthCalendarProps> = ({ year, month, days }) => {
  // First day of month to compute leading empty cells (Sunday = 0)
  const firstDayOfWeek = getDayOfWeekUTC(year, month, 1);
  const leadingBlanks = Array.from({ length: firstDayOfWeek });

  return (
    <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08]">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {WEEKDAY_HEADERS.map((day, idx) => (
          <div
            key={idx}
            className={`text-[12px] font-semibold ${
              idx === 0 ? 'text-[#ff453a]' : 'text-[#6e6e78] dark:text-[#98989f]'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {leadingBlanks.map((_, idx) => (
          <div key={`blank-${idx}`} className="aspect-square" />
        ))}

        {days.map((d) => {
          // Build tooltip description
          const hints: string[] = [];
          if (d.inSR) {
            if (d.dayInRotation) {
              hints.push(`No Suriname (Dia ${d.dayInRotation} de embarque)`);
            } else {
              hints.push('No Suriname');
            }
          }
          if (d.isDobra) {
            if (d.dayInRotation && d.dayInRotation > 28) {
              hints.push(`Dobra de escala (${d.dayInRotation}º dia offshore)`);
            } else {
              hints.push('Dobra de escala');
            }
          }
          if (d.isTravel) hints.push('Dia de viagem');
          if (d.isHoliday) hints.push(d.holidayName ? `Feriado: ${d.holidayName}` : 'Feriado');
          if (d.isToday) hints.push('Hoje');
          const tooltip = `${d.day}/${month.toString().padStart(2, '0')}: ${hints.join(' · ') || 'Folga / Normal'}`;

          return (
            <div
              key={d.day}
              title={tooltip}
              className={`relative aspect-square rounded-[12px] flex flex-col items-center justify-center transition-transform hover:scale-105 select-none ${
                d.isDobra
                  ? 'bg-[#ff9f0a]/20 dark:bg-[#ff9f0a]/30 border border-[#ff9f0a]/50'
                  : d.inSR
                  ? 'bg-[#0a84ff]/14 dark:bg-[#0a84ff]/28'
                  : 'bg-transparent'
              } ${
                d.isTravel
                  ? 'ring-2 ring-inset ring-[#bf5af2]'
                  : ''
              }`}
            >
              {d.isToday ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff453a] text-white font-bold text-[13px] tabular-nums shadow-xs">
                  {d.day}
                </span>
              ) : (
                <span
                  className={`text-[13px] font-semibold tabular-nums ${
                    d.isHoliday
                      ? 'text-[#ff453a]'
                      : d.isDobra
                      ? 'text-[#d97706] dark:text-[#ffb340]'
                      : d.inSR
                      ? 'text-[#0a84ff] dark:text-[#64d2ff]'
                      : d.isSunday
                      ? 'text-[#6e6e78]/80 dark:text-[#98989f]'
                      : 'text-[#111114] dark:text-[#f5f5f7]'
                  }`}
                >
                  {d.day}
                </span>
              )}

              {/* Dobra indicator dot at bottom */}
              {d.isDobra && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[#ff9f0a] shadow-xs"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-[#6e6e78] dark:text-[#98989f]">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-[#0a84ff]/20 border border-[#0a84ff]/40" />
          <span>No Suriname</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-[#ff9f0a]/20 border border-[#ff9f0a]/60 flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff9f0a]" />
          </span>
          <span>Dobra (a partir do 29º dia)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md border-2 border-[#bf5af2]" />
          <span>Viagem</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff453a]" />
          <span>Hoje</span>
        </div>
      </div>
    </div>
  );
};
