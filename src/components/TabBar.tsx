import React from 'react';

export type TabKey = 'mes' | 'rotacoes' | 'ano' | 'ajustes';

interface TabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      aria-label="Navegação Principal"
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center bg-[#f9f9f9]/85 dark:bg-[#161618]/85 backdrop-blur-[20px] backdrop-saturate-180 border-t border-black/[0.12] dark:border-white/[0.15] pb-[max(env(safe-area-inset-bottom),8px)]"
    >
      <div className="flex w-full max-w-[560px] items-center justify-around h-[52px]">
        {/* Tab 1: Mês */}
        <button
          type="button"
          onClick={() => onTabChange('mes')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'mes'
              ? 'text-[#0a84ff]'
              : 'text-[#8e8e93] hover:text-[#636366] dark:hover:text-[#aeaeb2]'
          }`}
        >
          <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="3" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
            <path d="M8 14h.01" />
            <path d="M12 14h.01" />
            <path d="M16 14h.01" />
            <path d="M8 18h.01" />
            <path d="M12 18h.01" />
          </svg>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Mês</span>
        </button>

        {/* Tab 2: Rotações */}
        <button
          type="button"
          onClick={() => onTabChange('rotacoes')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'rotacoes'
              ? 'text-[#0a84ff]'
              : 'text-[#8e8e93] hover:text-[#636366] dark:hover:text-[#aeaeb2]'
          }`}
        >
          <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Rotações</span>
        </button>

        {/* Tab 3: Ano */}
        <button
          type="button"
          onClick={() => onTabChange('ano')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'ano'
              ? 'text-[#0a84ff]'
              : 'text-[#8e8e93] hover:text-[#636366] dark:hover:text-[#aeaeb2]'
          }`}
        >
          <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" x2="18" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="16" />
            <line x1="12" x2="12" y1="20" y2="10" />
          </svg>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Ano</span>
        </button>

        {/* Tab 4: Ajustes */}
        <button
          type="button"
          onClick={() => onTabChange('ajustes')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'ajustes'
              ? 'text-[#0a84ff]'
              : 'text-[#8e8e93] hover:text-[#636366] dark:hover:text-[#aeaeb2]'
          }`}
        >
          <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Ajustes</span>
        </button>
      </div>
    </nav>
  );
};
