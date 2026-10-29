import React, { useState } from 'react';
import { getRotationDobraBreakdown, getRotationStatus, parseISODate } from '../calc';
import { Rotation } from '../types';

interface RotationCardProps {
  index: number;
  rotation: Rotation;
  allRotations?: Rotation[];
  onEdit: (rot: Rotation) => void;
  onDelete: (id: string) => void;
}

export const RotationCard: React.FC<RotationCardProps> = ({
  index,
  rotation,
  allRotations = [],
  onEdit,
  onDelete,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const statusInfo = getRotationStatus(rotation);
  const dobraInfo = getRotationDobraBreakdown(rotation, allRotations);

  const formatShortDate = (iso: string) => {
    const { day, month } = parseISODate(iso);
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
  };

  const getPillStyle = () => {
    switch (statusInfo.status) {
      case 'andamento':
        return 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30';
      case 'proxima':
        return 'bg-[#0a84ff]/15 text-[#0a84ff] border-[#0a84ff]/30';
      case 'concluida':
      default:
        return 'bg-black/5 dark:bg-white/10 text-[#6e6e78] dark:text-[#98989f] border-transparent';
    }
  };

  return (
    <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] flex flex-col space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-[#111114] dark:text-[#f5f5f7]">
              Rotação {index + 1}
            </span>
            {dobraInfo.dobraDays > 0 ? (
              <span className="rounded-md bg-[#ff9f0a]/15 text-[#ff9f0a] border border-[#ff9f0a]/30 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">
                +{dobraInfo.dobraDays} {dobraInfo.dobraDays === 1 ? 'dobra' : 'dobras'}
              </span>
            ) : (
              <span className="rounded-md bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30 px-2 py-0.5 text-[11px] font-bold">
                Sem dobra
              </span>
            )}
          </div>
          {rotation.nota && (
            <span className="text-[13px] text-[#6e6e78] dark:text-[#98989f] mt-0.5 line-clamp-2">
              {rotation.nota}
            </span>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${getPillStyle()}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Duration and Dobra Breakdown Banner */}
      <div className="rounded-xl p-2.5 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-[12px] space-y-1.5">
        <div className="flex items-center justify-between text-[#111114] dark:text-[#f5f5f7]">
          <span className="font-medium text-[#6e6e78] dark:text-[#98989f]">
            Tempo no Suriname:
          </span>
          <span className="font-bold tabular-nums">
            {dobraInfo.totalDays} dias{' '}
            <span className="text-[#6e6e78] dark:text-[#98989f] font-normal">
              ({dobraInfo.regularDays} regulares{dobraInfo.dobraDays > 0 ? ` + ${dobraInfo.dobraDays} dobras` : ''})
            </span>
          </span>
        </div>

        {/* Multi-month distribution when rotation crosses month boundaries */}
        {dobraInfo.monthsBreakdown.length > 1 && (
          <div className="pt-1.5 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0a84ff] block">
              Distribuição mensal da dobra:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {dobraInfo.monthsBreakdown.map((mb) => (
                <span
                  key={mb.monthKey}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                    mb.dobraDays > 0
                      ? 'bg-[#ff9f0a]/10 border-[#ff9f0a]/25 text-[#d97706] dark:text-[#ffb340]'
                      : 'bg-black/5 dark:bg-white/5 border-transparent text-[#6e6e78] dark:text-[#98989f]'
                  }`}
                >
                  <strong>{mb.monthName.split(' ')[0]}:</strong>
                  {mb.regularDays > 0 && <span>{mb.regularDays}d reg</span>}
                  {mb.regularDays > 0 && mb.dobraDays > 0 && <span>+</span>}
                  {mb.dobraDays > 0 && (
                    <span className="font-bold">
                      {mb.dobraDays}d dobra{mb.regularDays === 0 ? ' (continua)' : ''}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4-Node Timeline connected by gradient line */}
      <div className="relative pt-2 pb-1">
        {/* Connecting gradient line */}
        <div
          aria-hidden="true"
          className="absolute top-[17px] left-[10%] right-[10%] h-[3px] rounded-full"
          style={{
            background: 'linear-gradient(90deg, #bf5af2 0%, #0a84ff 33%, #0a84ff 66%, #bf5af2 100%)',
          }}
        />

        {/* 4 Nodes */}
        <div className="relative flex justify-between">
          {/* Node 1: SAI BR (Travel) */}
          <div className="flex flex-col items-center text-center w-[22%]">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#bf5af2] ring-3 ring-white dark:ring-[#1c1c1e] shadow-xs z-10">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#bf5af2]">
              SAI BR
            </span>
            <span className="text-[12px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7]">
              {formatShortDate(rotation.saidaBR)}
            </span>
          </div>

          {/* Node 2: CHEGA SR (Suriname) */}
          <div className="flex flex-col items-center text-center w-[22%]">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0a84ff] ring-3 ring-white dark:ring-[#1c1c1e] shadow-xs z-10">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#0a84ff]">
              CHEGA SR
            </span>
            <span className="text-[12px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7]">
              {formatShortDate(rotation.chegadaSR)}
            </span>
          </div>

          {/* Node 3: SAI SR (Suriname) */}
          <div className="flex flex-col items-center text-center w-[22%]">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0a84ff] ring-3 ring-white dark:ring-[#1c1c1e] shadow-xs z-10">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#0a84ff]">
              SAI SR
            </span>
            <span className="text-[12px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7]">
              {formatShortDate(rotation.saidaSR)}
            </span>
          </div>

          {/* Node 4: CHEGA BR (Travel) */}
          <div className="flex flex-col items-center text-center w-[22%]">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#bf5af2] ring-3 ring-white dark:ring-[#1c1c1e] shadow-xs z-10">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#bf5af2]">
              CHEGA BR
            </span>
            <span className="text-[12px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7]">
              {formatShortDate(rotation.chegadaBR)}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
        {showConfirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#ff453a] font-medium">Excluir esta rotação?</span>
            <button
              type="button"
              onClick={() => onDelete(rotation.id)}
              className="px-3 py-1.5 rounded-lg bg-[#ff453a] text-white text-[13px] font-semibold shadow-xs hover:bg-[#ff453a]/90 transition"
            >
              Sim, excluir
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-[#111114] dark:text-[#f5f5f7] text-[13px] font-medium hover:bg-black/10 transition"
            >
              Não
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onEdit(rotation)}
              className="px-3.5 py-1.5 rounded-lg bg-[#0a84ff]/10 text-[#0a84ff] text-[13px] font-semibold hover:bg-[#0a84ff]/20 transition"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#ff453a]/10 text-[#ff453a] text-[13px] font-semibold hover:bg-[#ff453a]/20 transition"
            >
              Excluir
            </button>
          </>
        )}
      </div>
    </div>
  );
};
