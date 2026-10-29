import React, { useState } from 'react';
import { getRotationStatus, parseISODate } from '../calc';
import { Rotation } from '../types';

interface RotationCardProps {
  index: number;
  rotation: Rotation;
  onEdit: (rot: Rotation) => void;
  onDelete: (id: string) => void;
}

export const RotationCard: React.FC<RotationCardProps> = ({
  index,
  rotation,
  onEdit,
  onDelete,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const statusInfo = getRotationStatus(rotation);

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
          <span className="text-[17px] font-bold text-[#111114] dark:text-[#f5f5f7]">
            Rotação {index + 1}
          </span>
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
