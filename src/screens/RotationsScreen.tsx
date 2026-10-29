import React, { useEffect, useState } from 'react';
import { addDays, daysBetweenInclusive, formatISODate, genRotations, isFictitiousRotation, parseISODate, ROTATION_PRESETS } from '../calc';
import { BottomSheet } from '../components/BottomSheet';
import { RotationCard } from '../components/RotationCard';
import { Toggle } from '../components/Toggle';
import { syncManager } from '../sync';
import { AppState, Rotation } from '../types';

interface RotationsScreenProps {
  state: AppState;
  onUpdateRotations: (rotations: Rotation[]) => void;
  showToast: (msg: string) => void;
}

export const RotationsScreen: React.FC<RotationsScreenProps> = ({
  state,
  onUpdateRotations,
  showToast,
}) => {
  const { rotations, params } = state;
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  // Auto-clean any legacy fictitious rotations if detected in state
  useEffect(() => {
    if (rotations.some((r) => isFictitiousRotation(r))) {
      const cleaned = rotations.filter((r) => !isFictitiousRotation(r));
      onUpdateRotations(cleaned);
    }
  }, [rotations, onUpdateRotations]);

  // Sheet states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Editor form state
  const [formSaidaBR, setFormSaidaBR] = useState('');
  const [formChegadaSR, setFormChegadaSR] = useState('');
  const [formSaidaSR, setFormSaidaSR] = useState('');
  const [formChegadaBR, setFormChegadaBR] = useState('');
  const [formNota, setFormNota] = useState('');
  const [replaceConflicting, setReplaceConflicting] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  // Generator form state
  const [genPreset, setGenPreset] = useState('28x28');
  const [genStart, setGenStart] = useState('');
  const [genDiasSR, setGenDiasSR] = useState(28);
  const [genCiclo, setGenCiclo] = useState(56);
  const [genEnd, setGenEnd] = useState('');
  const [genReplaceAll, setGenReplaceAll] = useState(true);
  const [genError, setGenError] = useState<string | null>(null);

  // Sort rotations chronologically
  const sortedRotations = [...rotations].sort((a, b) => a.saidaBR.localeCompare(b.saidaBR));

  const formatShortDate = (iso: string) => {
    if (!iso) return '';
    const { day, month } = parseISODate(iso);
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
  };

  // Open Editor for New Rotation
  const handleOpenNew = () => {
    setEditingId(null);
    const now = new Date();
    const today = formatISODate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());

    // Default to today or the day after last rotation
    let defaultSaida = today;
    if (sortedRotations.length > 0) {
      const last = sortedRotations[sortedRotations.length - 1];
      defaultSaida = addDays(last.chegadaBR, 27);
    }

    setFormSaidaBR(defaultSaida);
    setFormChegadaSR(addDays(defaultSaida, 1));
    setFormSaidaSR(addDays(defaultSaida, 28)); // 28 regular days in Suriname
    setFormChegadaBR(addDays(defaultSaida, 29));
    setFormNota('');
    setReplaceConflicting(false);
    setEditorError(null);
    setIsEditorOpen(true);
  };

  // Open Editor for Editing
  const handleEdit = (rot: Rotation) => {
    setEditingId(rot.id);
    setFormSaidaBR(rot.saidaBR);
    setFormChegadaSR(rot.chegadaSR);
    setFormSaidaSR(rot.saidaSR);
    setFormChegadaBR(rot.chegadaBR);
    setFormNota(rot.nota || '');
    setReplaceConflicting(false);
    setEditorError(null);
    setIsEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = rotations.filter((r) => r.id !== id);
    onUpdateRotations(updated);
    showToast('Rotação excluída');
  };

  // Apply duration preset to current editor
  const handleApplyPreset = (diasSR: number) => {
    const base = formSaidaBR || (formChegadaSR ? addDays(formChegadaSR, -1) : '2026-01-01');
    setFormSaidaBR(base);
    const arrival = addDays(base, 1);
    setFormChegadaSR(arrival);
    const departure = addDays(arrival, Math.max(1, diasSR) - 1);
    setFormSaidaSR(departure);
    setFormChegadaBR(addDays(departure, 1));
    setEditorError(null);
  };

  // Duration in days currently set in editor
  const currentDurationDays =
    formChegadaSR && formSaidaSR && formSaidaSR >= formChegadaSR
      ? daysBetweenInclusive(formChegadaSR, formSaidaSR)
      : 0;

  // Change duration dynamically from stepper/input
  const handleChangeDuration = (newDays: number) => {
    if (newDays < 1) return;
    const arrival = formChegadaSR || (formSaidaBR ? addDays(formSaidaBR, 1) : '2026-01-02');
    setFormChegadaSR(arrival);
    const departure = addDays(arrival, newDays - 1);
    setFormSaidaSR(departure);
    setFormChegadaBR(addDays(departure, 1));
  };

  // Save Rotation validation
  const handleSaveRotation = () => {
    if (!formChegadaSR || !formSaidaSR) {
      setEditorError('Chegada e saída do Suriname são obrigatórias.');
      return;
    }

    const sBR = formSaidaBR || formChegadaSR;
    const cBR = formChegadaBR || formSaidaSR;

    // Chronological order check
    if (
      sBR > formChegadaSR ||
      formChegadaSR > formSaidaSR ||
      formSaidaSR > cBR
    ) {
      setEditorError('As datas precisam estar em ordem cronológica.');
      return;
    }

    // Overlap check: periods in Suriname cannot overlap
    const conflicting = rotations.filter((rot) => {
      if (editingId && rot.id === editingId) return false;
      const srOverlap = rot.saidaSR >= formChegadaSR && rot.chegadaSR <= formSaidaSR;
      const travelOverlap = rot.chegadaBR >= sBR && rot.saidaBR <= cBR;
      return srOverlap || travelOverlap;
    });

    if (conflicting.length > 0 && !replaceConflicting) {
      setEditorError(
        `Rotações não podem ter períodos no Suriname sobrepostos. Conflito com rotação (${formatShortDate(conflicting[0].chegadaSR)} a ${formatShortDate(conflicting[0].saidaSR)}). Ative a opção abaixo para substituir rotações conflitantes.`
      );
      return;
    }

    const updatedRot: Rotation = {
      id: editingId || `rot-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      saidaBR: sBR,
      chegadaSR: formChegadaSR,
      saidaSR: formSaidaSR,
      chegadaBR: cBR,
      nota: formNota.trim(),
    };

    let nextRotations: Rotation[];
    if (replaceConflicting && conflicting.length > 0) {
      const conflictIds = new Set(conflicting.map((c) => c.id));
      const remaining = rotations.filter((r) => !conflictIds.has(r.id) && r.id !== editingId);
      nextRotations = [...remaining, updatedRot];
    } else if (editingId) {
      nextRotations = rotations.map((r) => (r.id === editingId ? updatedRot : r));
    } else {
      nextRotations = [...rotations, updatedRot];
    }

    onUpdateRotations(nextRotations);
    setIsEditorOpen(false);
    showToast(editingId ? 'Rotação atualizada' : 'Rotação adicionada');
  };

  // Open Scale Generator Sheet
  const handleOpenGenerator = () => {
    const lastRot = sortedRotations.length > 0 ? sortedRotations[sortedRotations.length - 1] : null;
    const now = new Date();
    const today = formatISODate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());

    setGenPreset('28x28');
    setGenStart(lastRot ? addDays(lastRot.chegadaBR, 27) : today);
    setGenDiasSR(28);
    setGenCiclo(56);
    setGenEnd(`${params.ano}-12-31`);
    setGenReplaceAll(sortedRotations.length === 0);
    setGenError(null);
    setIsGeneratorOpen(true);
  };

  const handleSelectGenPreset = (presetId: string) => {
    setGenPreset(presetId);
    const p = ROTATION_PRESETS.find((item) => item.id === presetId);
    if (p && presetId !== 'custom') {
      setGenDiasSR(p.diasSR);
      setGenCiclo(p.ciclo);
    }
  };

  const handleGenerateScale = () => {
    if (!genStart || !genEnd) {
      setGenError('Data de início e término são obrigatórias.');
      return;
    }
    if (genDiasSR < 1 || genDiasSR > 90) {
      setGenError('Dias no Suriname deve estar entre 1 e 90.');
      return;
    }
    if (genCiclo < genDiasSR + 1 || genCiclo > 180) {
      setGenError(`Ciclo completo deve ser no mínimo ${genDiasSR + 1} dias.`);
      return;
    }
    if (genStart > genEnd) {
      setGenError('A data inicial deve ser anterior à data final.');
      return;
    }

    const generated = genRotations(genStart, genDiasSR, genCiclo, genEnd);

    if (generated.length === 0) {
      setGenError('Nenhuma rotação pôde ser gerada no período especificado.');
      return;
    }

    let finalRotations: Rotation[];

    if (genReplaceAll) {
      finalRotations = generated;
    } else {
      // Remove only existing rotations that overlap the generated ones
      finalRotations = rotations.filter((existing) => {
        const overlaps = generated.some(
          (gen) => existing.chegadaBR >= gen.saidaBR && existing.saidaBR <= gen.chegadaBR
        );
        return !overlaps;
      });
      finalRotations.push(...generated);
    }

    onUpdateRotations(finalRotations);
    setIsGeneratorOpen(false);
    showToast(`${generated.length} rotações geradas com sucesso!`);
  };

  const handleSyncSupabase = async () => {
    setIsSyncingSupabase(true);
    try {
      const res = await syncManager.forceSync(state, (remoteState) => {
        onUpdateRotations(remoteState.rotations || []);
      });
      if (res.success) {
        showToast('Sincronizado com Supabase!');
      } else {
        showToast(res.message);
      }
    } catch {
      showToast('Erro ao sincronizar');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Screen Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#6e6e78] dark:text-[#98989f]">
            ESCALA FLEXÍVEL · OFFSHORE
          </span>
          <h1 className="text-[32px] font-extrabold tracking-[-0.02em] text-[#111114] dark:text-[#f5f5f7] leading-tight">
            Rotações
          </h1>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncSupabase}
            disabled={isSyncingSupabase}
            title="Sincronizar rotações com Supabase"
            className="flex items-center gap-1.5 rounded-full bg-white dark:bg-[#1c1c1e] px-3.5 py-2 text-[13px] font-bold text-[#30d158] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={`w-2 h-2 rounded-full bg-[#30d158] ${isSyncingSupabase ? 'animate-ping' : ''}`} />
            <span>{isSyncingSupabase ? 'Sincronizando…' : 'Supabase'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenGenerator}
            title="Gerar / Popular escala para frente"
            className="flex items-center gap-1.5 rounded-full bg-white dark:bg-[#1c1c1e] px-3.5 py-2 text-[13px] font-bold text-[#0a84ff] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
            </svg>
            <span>Popular ano</span>
          </button>
        </div>
      </div>

      {/* Explanatory Info Card */}
      <div className="rounded-[18px] p-3.5 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.07] text-[13px] text-[#6e6e78] dark:text-[#98989f] leading-relaxed space-y-1.5">
        <div className="flex items-center gap-1.5 text-[#111114] dark:text-[#f5f5f7] font-bold">
          <span className="h-2 w-2 rounded-full bg-[#ff9f0a]" />
          <span>Regra de Dobra Offshore:</span>
        </div>
        <p>
          As dobras são calculadas quando a rotação contínua tem <strong>mais de 28 dias</strong>, independente dos meses do calendário.
        </p>
        <p className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
          Os primeiros 28 dias são offshore regular. Do <strong>29º dia em diante até o retorno ao Brasil</strong>, todos os dias são categorizados como dobra contínua (ex: quem fica agosto inteiro e 10 dias em setembro, tem 3 dobras em agosto e 10 dobras em setembro).
        </p>
      </div>

      {/* Rotation Cards List */}
      {sortedRotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] bg-white dark:bg-[#1c1c1e] p-8 text-center border border-black/[0.04] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none space-y-4 my-6">
          <div className="w-16 h-16 rounded-full bg-[#0a84ff]/10 text-[#0a84ff] flex items-center justify-center text-3xl">
            ✈️
          </div>
          <div className="space-y-1">
            <h3 className="text-[19px] font-bold text-[#111114] dark:text-[#f5f5f7]">
              Nenhuma rotação no Supabase
            </h3>
            <p className="text-[14px] text-[#6e6e78] dark:text-[#98989f] max-w-sm">
              Nenhuma rotação fictícia ativa. Adicione as datas reais do seu embarque no Suriname ou use <strong>Popular ano</strong> para programar seus ciclos.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenNew}
              className="rounded-full bg-[#0a84ff] px-5 py-2.5 text-[14px] font-bold text-white hover:opacity-90 active:scale-95 transition cursor-pointer"
            >
              Adicionar rotação
            </button>
            <button
              type="button"
              onClick={handleOpenGenerator}
              className="rounded-full bg-black/[0.05] dark:bg-white/[0.08] px-4 py-2.5 text-[14px] font-semibold text-[#111114] dark:text-[#f5f5f7] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition cursor-pointer"
            >
              Popular ano
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-semibold text-[#8e8e93] uppercase tracking-wider">
              {sortedRotations.length} {sortedRotations.length === 1 ? 'rotação programada' : 'rotações programadas'}
            </span>
          </div>

          <div className="space-y-3">
            {sortedRotations.map((rot, idx) => (
              <RotationCard
                key={rot.id}
                index={idx + 1}
                rotation={rot}
                allRotations={sortedRotations}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB "+") */}
      <button
        type="button"
        onClick={handleOpenNew}
        aria-label="Adicionar nova rotação"
        style={{
          boxShadow: '0 8px 24px rgba(10,132,255,0.4)',
        }}
        className="fixed bottom-[84px] right-5 z-40 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#0a84ff] text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* SHEET 1: NOVA / EDITAR ROTAÇÃO */}
      <BottomSheet
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingId ? 'Editar rotação' : 'Nova rotação'}
        actionLabel="Salvar rotação"
        onAction={handleSaveRotation}
      >
        <div className="space-y-4">
          {editorError && (
            <div className="rounded-xl bg-[#ff453a]/10 p-3 text-[13px] font-medium text-[#ff453a] border border-[#ff453a]/20">
              {editorError}
            </div>
          )}

          {/* Quick presets for non-fixed rotation */}
          <div>
            <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider block mb-1.5">
              Duração da rotação (presets rápidos)
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(28)}
                className={`py-2 px-1 rounded-xl text-[13px] font-bold border transition ${
                  currentDurationDays === 28
                    ? 'bg-[#0a84ff] text-white border-[#0a84ff]'
                    : 'bg-[#f7f7fa] dark:bg-[#2c2c2e] text-[#111114] dark:text-[#f5f5f7] border-black/[0.06] dark:border-white/[0.08]'
                }`}
              >
                28×28
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(14)}
                className={`py-2 px-1 rounded-xl text-[13px] font-bold border transition ${
                  currentDurationDays === 14
                    ? 'bg-[#0a84ff] text-white border-[#0a84ff]'
                    : 'bg-[#f7f7fa] dark:bg-[#2c2c2e] text-[#111114] dark:text-[#f5f5f7] border-black/[0.06] dark:border-white/[0.08]'
                }`}
              >
                14×14
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(21)}
                className={`py-2 px-1 rounded-xl text-[13px] font-bold border transition ${
                  currentDurationDays === 21
                    ? 'bg-[#0a84ff] text-white border-[#0a84ff]'
                    : 'bg-[#f7f7fa] dark:bg-[#2c2c2e] text-[#111114] dark:text-[#f5f5f7] border-black/[0.06] dark:border-white/[0.08]'
                }`}
              >
                21×21
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(35)}
                className={`py-2 px-1 rounded-xl text-[13px] font-bold border transition ${
                  currentDurationDays === 35
                    ? 'bg-[#0a84ff] text-white border-[#0a84ff]'
                    : 'bg-[#f7f7fa] dark:bg-[#2c2c2e] text-[#111114] dark:text-[#f5f5f7] border-black/[0.06] dark:border-white/[0.08]'
                }`}
              >
                35d (+dobra)
              </button>
            </div>
          </div>

          {/* Quick duration adjuster */}
          <div className="flex flex-col rounded-xl bg-[#f7f7fa] dark:bg-[#2c2c2e] p-3 border border-black/[0.06] dark:border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                  Dias no Suriname
                </span>
                <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                  Ajusta automaticamente a saída do Suriname
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleChangeDuration(currentDurationDays - 1)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-[#3a3a3c] flex items-center justify-center font-bold text-[#111114] dark:text-white shadow-xs"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold tabular-nums text-[16px] text-[#0a84ff]">
                  {currentDurationDays}d
                </span>
                <button
                  type="button"
                  onClick={() => handleChangeDuration(currentDurationDays + 1)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-[#3a3a3c] flex items-center justify-center font-bold text-[#111114] dark:text-white shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Clear dobra status for current duration */}
            <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] text-[12px]">
              {currentDurationDays <= 28 ? (
                <div className="flex items-center gap-1.5 text-[#30d158] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#30d158]" />
                  <span>Escala regular: {currentDurationDays} dias no Suriname (sem dobra)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[#d97706] dark:text-[#ffb340] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#ff9f0a]" />
                  <span>
                    <strong>28 dias regulares + {currentDurationDays - 28} dias de dobra</strong> (a partir do 29º dia contínuo até a volta ao Brasil)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Inputs for dates */}
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider block mb-1">
                Saída do Brasil (embarque / viagem)
              </label>
              <input
                type="date"
                value={formSaidaBR}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormSaidaBR(val);
                  // Maintain current duration if set
                  if (val && currentDurationDays > 0) {
                    const chSR = addDays(val, 1);
                    setFormChegadaSR(chSR);
                    const saSR = addDays(chSR, currentDurationDays - 1);
                    setFormSaidaSR(saSR);
                    setFormChegadaBR(addDays(saSR, 1));
                  }
                }}
                className="w-full h-11 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-[15px] text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider block mb-1">
                Chegada ao Suriname (início dias no país)
              </label>
              <input
                type="date"
                value={formChegadaSR}
                onChange={(e) => setFormChegadaSR(e.target.value)}
                className="w-full h-11 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-[15px] text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider block mb-1">
                Saída do Suriname (fim dias no país)
              </label>
              <input
                type="date"
                value={formSaidaSR}
                onChange={(e) => setFormSaidaSR(e.target.value)}
                className="w-full h-11 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-[15px] text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider block mb-1">
                Chegada ao Brasil (desembarque final)
              </label>
              <input
                type="date"
                value={formChegadaBR}
                onChange={(e) => setFormChegadaBR(e.target.value)}
                className="w-full h-11 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-[15px] text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider block mb-1">
                Observação
              </label>
              <input
                type="text"
                maxLength={120}
                placeholder="Ex: Poço Alpha, Dobra planejada, Treinamento..."
                value={formNota}
                onChange={(e) => setFormNota(e.target.value)}
                className="w-full h-11 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-[15px] text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
              />
            </div>

            {/* Overlap resolve toggle */}
            <div className="flex items-center justify-between rounded-xl bg-[#f7f7fa] dark:bg-[#2c2c2e] p-3 border border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex flex-col pr-3">
                <span className="text-[13px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                  Substituir rotações conflitantes
                </span>
                <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                  Remove automaticamente datas sobrepostas se houver
                </span>
              </div>
              <Toggle checked={replaceConflicting} onChange={setReplaceConflicting} />
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* SHEET 2: GERAR / POPULAR ESCALA */}
      <BottomSheet
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        title="Popular ano / Gerar escala"
        actionLabel="Popular escala"
        onAction={handleGenerateScale}
      >
        <div className="space-y-4">
          {genError && (
            <div className="rounded-xl bg-[#ff453a]/10 p-3 text-[13px] font-medium text-[#ff453a] border border-[#ff453a]/20">
              {genError}
            </div>
          )}

          {/* Preset buttons */}
          <div>
            <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider block mb-1.5">
              Modelo de escala
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROTATION_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectGenPreset(p.id)}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    genPreset === p.id
                      ? 'bg-[#0a84ff]/10 border-[#0a84ff] text-[#0a84ff]'
                      : 'bg-[#f7f7fa] dark:bg-[#2c2c2e] border-black/[0.06] dark:border-white/[0.08] text-[#111114] dark:text-[#f5f5f7]'
                  }`}
                >
                  <div className="text-[14px] font-bold">{p.name}</div>
                  <div className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider block mb-1">
              1ª saída do Brasil
            </label>
            <input
              type="date"
              value={genStart}
              onChange={(e) => setGenStart(e.target.value)}
              className="w-full h-11 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-[15px] text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider block mb-1">
                Dias no Suriname
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={genDiasSR}
                onChange={(e) => {
                  setGenDiasSR(parseInt(e.target.value, 10) || 29);
                  setGenPreset('custom');
                }}
                className="w-full h-11 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-[15px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider block mb-1">
                Ciclo total (dias)
              </label>
              <input
                type="number"
                min={genDiasSR + 1}
                max="180"
                value={genCiclo}
                onChange={(e) => {
                  setGenCiclo(parseInt(e.target.value, 10) || 56);
                  setGenPreset('custom');
                }}
                className="w-full h-11 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-[15px] font-semibold tabular-nums text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] uppercase tracking-wider">
                Popular até
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGenEnd(`${params.ano}-12-31`)}
                  className="text-[11px] text-[#0a84ff] hover:underline"
                >
                  Fim de {params.ano}
                </button>
                <button
                  type="button"
                  onClick={() => setGenEnd(`${params.ano + 1}-12-31`)}
                  className="text-[11px] text-[#0a84ff] hover:underline"
                >
                  Fim de {params.ano + 1}
                </button>
              </div>
            </div>
            <input
              type="date"
              value={genEnd}
              onChange={(e) => setGenEnd(e.target.value)}
              className="w-full h-11 rounded-[10px] bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3 text-[15px] text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-[3px] focus:ring-[#0a84ff]/35 transition"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#f7f7fa] dark:bg-[#2c2c2e] p-3 border border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex flex-col pr-3">
              <span className="text-[14px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                Substituir rotações existentes
              </span>
              <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                Desligado: mantém anteriores e adiciona novas no período
              </span>
            </div>
            <Toggle checked={genReplaceAll} onChange={setGenReplaceAll} />
          </div>

          <p className="text-[12px] text-[#6e6e78] dark:text-[#98989f] leading-normal pt-1">
            💡 Dica: Após popular a escala, você pode tocar em qualquer rotação individual para ajustar suas datas reais, registrar dobras ou alterar dias de embarque.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
};
