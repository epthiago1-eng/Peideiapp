import React, { useEffect, useRef } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  actionLabel = 'Salvar',
  onAction,
  actionDisabled = false,
  children,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className="relative z-10 w-full max-w-[560px] max-h-[90vh] flex flex-col rounded-t-[22px] bg-white dark:bg-[#1c1c1e] text-[#111114] dark:text-[#f5f5f7] shadow-[0_-8px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-300 overflow-hidden"
      >
        {/* Grabber */}
        <div className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="h-[5px] w-[38px] rounded-full bg-[#3c3c43]/30 dark:bg-[#ebebf5]/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-black/[0.08] dark:border-white/[0.12]">
          <button
            type="button"
            onClick={onClose}
            className="text-[17px] font-normal text-[#0a84ff] hover:opacity-70 transition-opacity"
          >
            Cancelar
          </button>
          <h2 className="text-[17px] font-semibold text-center flex-1 mx-2 truncate text-[#111114] dark:text-[#f5f5f7]">
            {title}
          </h2>
          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              disabled={actionDisabled}
              className="text-[17px] font-semibold text-[#0a84ff] hover:opacity-70 disabled:opacity-30 disabled:pointer-events-none transition-opacity"
            >
              {actionLabel}
            </button>
          ) : (
            <div className="w-[60px]" />
          )}
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-8 space-y-4 no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
