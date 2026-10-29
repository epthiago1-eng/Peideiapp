import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  if (isInstallable) {
    return (
      <div className="mb-4 rounded-[18px] bg-gradient-to-r from-[#0a84ff]/15 via-[#5e5ce6]/15 to-[#bf5af2]/15 border border-[#0a84ff]/30 p-3.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] text-white font-bold text-[15px] shadow-xs shrink-0">
            R$
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-[#111114] dark:text-[#f5f5f7]">
              Instalar RotaPay
            </span>
            <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
              Acesse offline diretamente da tela de início
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={install}
            className="rounded-full bg-[#0a84ff] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-xs hover:bg-[#0a84ff]/90 transition"
          >
            Instalar
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dispensar"
            className="text-[#6e6e78] dark:text-[#98989f] hover:text-[#111114] p-1 text-sm font-semibold"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (isIOS) {
    return (
      <>
        <div className="mb-4 rounded-[18px] bg-white dark:bg-[#1c1c1e] border border-[#0a84ff]/30 p-3 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] text-white font-bold text-[14px] shrink-0">
              R$
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                Adicionar à Tela de Início
              </span>
              <span className="text-[11px] text-[#6e6e78] dark:text-[#98989f]">
                Use como aplicativo no seu iPhone
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="rounded-full bg-[#0a84ff]/10 text-[#0a84ff] px-3 py-1 text-[12px] font-semibold hover:bg-[#0a84ff]/20 transition"
            >
              Como instalar
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dispensar"
              className="text-[#6e6e78] dark:text-[#98989f] p-1 text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-[22px] bg-white dark:bg-[#1c1c1e] p-6 shadow-2xl text-[#111114] dark:text-[#f5f5f7] border border-black/[0.08] dark:border-white/[0.1]">
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] text-white font-bold text-xl shadow-md">
                  R$
                </div>
              </div>
              <h3 className="text-lg font-bold text-center">Instalar no iPhone / iPad</h3>
              <p className="mt-3 text-sm text-[#6e6e78] dark:text-[#98989f] leading-relaxed">
                1. Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra inferior do Safari.<br />
                2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.<br />
                3. Toque em <strong>Adicionar</strong> no canto superior direito.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#0a84ff] py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#0a84ff]/90"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
