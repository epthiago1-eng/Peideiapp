/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { OnboardingWizard } from './components/OnboardingWizard';
import { TabBar, TabKey } from './components/TabBar';
import { Toast } from './components/Toast';
import { AuthScreen } from './screens/AuthScreen';
import { MonthScreen } from './screens/MonthScreen';
import { RotationsScreen } from './screens/RotationsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { YearScreen } from './screens/YearScreen';
import { hasCompletedOnboarding, loadState, saveState, setOnboardingCompleted } from './storage';
import { syncManager } from './sync';
import { AppState, MonthOverride, Rotation } from './types';
import { isFictitiousMonth, isFictitiousRotation } from './calc';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [currentUser, setCurrentUser] = useState<User | null>(() => syncManager.getUser());
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabKey>('mes');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !hasCompletedOnboarding());

  // Initial month computation
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return state.params.ano || 2026;
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const now = new Date();
    const utcYear = now.getUTCFullYear();
    // Default to current month if in the same year, else January
    if (utcYear === (state.params.ano || 2026)) {
      return now.getUTCMonth() + 1;
    }
    return 1;
  });

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // Auto-save state to localStorage on every change & queue sync to Supabase
  const updateStateAndPersist = (newState: AppState) => {
    const cleanRotations = (newState.rotations || []).filter((r) => !isFictitiousRotation(r));
    const cleanMonths: Record<string, any> = {};
    if (newState.months && typeof newState.months === 'object') {
      for (const [key, val] of Object.entries(newState.months)) {
        if (!isFictitiousMonth(key, val)) {
          cleanMonths[key] = val;
        }
      }
    }
    const cleanState = { ...newState, rotations: cleanRotations, months: cleanMonths };
    setState(cleanState);
    saveState(cleanState);
    syncManager.queueSync(cleanState);
  };

  const handleUpdateOverride = (year: number, month: number, override: MonthOverride) => {
    const key = `${year}-${month}`;
    const nextMonths = { ...state.months };
    // Check if empty override
    const hasValues = Object.keys(override).some((k) => (override as Record<string, unknown>)[k] !== undefined);

    if (hasValues) {
      nextMonths[key] = override;
    } else {
      delete nextMonths[key];
    }

    const nextState: AppState = {
      ...state,
      months: nextMonths,
      updatedAt: Date.now(),
    };
    updateStateAndPersist(nextState);
  };

  const handleUpdateRotations = (rotations: Rotation[]) => {
    const cleanRotations = (rotations || []).filter((r) => !isFictitiousRotation(r));
    const nextState: AppState = {
      ...state,
      rotations: cleanRotations,
      updatedAt: Date.now(),
    };
    updateStateAndPersist(nextState);
  };

  // Cloud synchronization listener with recursion guard
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Check initial session on mount and pull remote state from Supabase
    syncManager.checkSession().then(async (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
      if (user) {
        lastUserIdRef.current = user.id;
        await syncManager.pullRemoteState((remoteState) => {
          setState(remoteState);
          saveState(remoteState);
        });
      }
    });

    // Subscribe ONLY to user ID change events, NOT every status transition
    const unsubscribe = syncManager.subscribe((_status, user) => {
      setCurrentUser(user);
      const currentUserId = user?.id || null;
      if (currentUserId && currentUserId !== lastUserIdRef.current) {
        lastUserIdRef.current = currentUserId;
        syncManager.pullRemoteState((remoteState) => {
          setState(remoteState);
          saveState(remoteState);
        });
      } else if (!currentUserId) {
        lastUserIdRef.current = null;
      }
    });

    return () => {
      unsubscribe();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // 1. Initial splash loader while checking Supabase session
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] dark:bg-[#000000] flex flex-col items-center justify-center p-4">
        <div
          style={{
            background: 'linear-gradient(135deg, #0a84ff 0%, #5e5ce6 60%, #bf5af2 120%)',
            boxShadow: '0 8px 24px rgba(10,132,255,0.3)',
          }}
          className="flex h-[84px] w-[84px] items-center justify-center rounded-[24px] text-white font-extrabold text-[36px] tracking-tight animate-pulse mb-4 select-none"
        >
          R$
        </div>
        <div className="text-[14px] font-semibold text-[#6e6e78] dark:text-[#98989f]">
          Carregando RotaPay…
        </div>
      </div>
    );
  }

  // 2. Mandatory Auth Gatekeeper: user must be logged in to access app data
  if (!currentUser) {
    return (
      <>
        <AuthScreen
          onLoginSuccess={async (user) => {
            setCurrentUser(user);
            lastUserIdRef.current = user.id;
            await syncManager.pullRemoteState((remoteState) => {
              setState(remoteState);
              saveState(remoteState);
            });
          }}
          showToast={showToast}
        />
        <Toast message={toastMessage} />
      </>
    );
  }

  // 3. Authenticated App Experience
  return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-[#000000] text-[#111114] dark:text-[#f5f5f7] flex justify-center selection:bg-[#0a84ff]/25 font-sans">
      {/* Centered mobile-first column */}
      <main className="w-full max-w-[560px] min-h-screen px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[96px] flex flex-col">
        {activeTab === 'mes' && (
          <MonthScreen
            state={state}
            currentYear={selectedYear}
            currentMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            onUpdateOverride={handleUpdateOverride}
            showToast={showToast}
          />
        )}

        {activeTab === 'rotacoes' && (
          <RotationsScreen
            state={state}
            onUpdateRotations={handleUpdateRotations}
            showToast={showToast}
          />
        )}

        {activeTab === 'ano' && (
          <YearScreen
            state={state}
            currentYear={selectedYear}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            onOpenMonthTab={() => setActiveTab('mes')}
          />
        )}

        {activeTab === 'ajustes' && (
          <SettingsScreen
            state={state}
            onUpdateState={updateStateAndPersist}
            onTriggerOnboarding={() => setShowOnboarding(true)}
            showToast={showToast}
          />
        )}
      </main>

      {/* Onboarding Setup Wizard (only shown on first launch) */}
      {showOnboarding && (
        <OnboardingWizard
          initialState={state}
          onComplete={(updatedState) => {
            updateStateAndPersist(updatedState);
            setOnboardingCompleted(true);
            setShowOnboarding(false);
            showToast('Configuração inicial concluída!');
          }}
          onSkip={() => {
            setOnboardingCompleted(true);
            setShowOnboarding(false);
            showToast('Configuração padrão mantida');
          }}
        />
      )}

      {/* iOS Dark Pill Toast */}
      <Toast message={toastMessage} />

      {/* Fixed Frosted Bottom Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
