import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[96px] left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ease-out"
    >
      <div className="bg-[#1e1e20]/95 backdrop-blur-md text-white text-[14px] font-medium px-4 py-2.5 rounded-full shadow-lg border border-white/10 flex items-center gap-2">
        <span>{message}</span>
      </div>
    </div>
  );
};
