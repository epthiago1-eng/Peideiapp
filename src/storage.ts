import { getInitialState, isFictitiousMonth, isFictitiousRotation } from './calc';
import { AppState, Holiday, Params, Rotation } from './types';

export const STORAGE_KEY = 'rotapay:local';
export const ONBOARDING_KEY = 'rotapay:onboarded';

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setOnboardingCompleted(completed: boolean): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, completed ? 'true' : 'false');
  } catch {
    // Ignore
  }
}

export function loadState(): AppState {
  try {
    // Purge legacy storage keys if present
    try {
      localStorage.removeItem('rotapay_app_state_v1');
    } catch {
      // Ignore
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialState();
      saveState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.params || !Array.isArray(parsed.rotations)) {
      console.warn('Invalid storage content, resetting to initial clean state');
      const initial = getInitialState();
      saveState(initial);
      return initial;
    }

    const initial = getInitialState();
    const storedMonths = parsed.months && typeof parsed.months === 'object' ? parsed.months : {};
    
    // Purge any fictitious/mock months (e.g. mock salary or sample paystubs)
    const cleanMonths: Record<string, any> = {};
    for (const [key, val] of Object.entries(storedMonths)) {
      if (!isFictitiousMonth(key, val)) {
        cleanMonths[key] = val;
      }
    }

    // Filter out fictitious or dummy rotations
    const parsedRotations: Rotation[] = Array.isArray(parsed.rotations) ? parsed.rotations : [];
    const cleanRotations: Rotation[] = parsedRotations.filter((r) => !isFictitiousRotation(r));

    const stateToReturn: AppState = {
      params: { ...initial.params, ...parsed.params },
      holidays: Array.isArray(parsed.holidays) && parsed.holidays.length > 0 ? parsed.holidays : initial.holidays,
      rotations: cleanRotations,
      months: cleanMonths,
      updatedAt: parsed.updatedAt || Date.now(),
    };
    saveState(stateToReturn);
    return stateToReturn;
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return getInitialState();
  }
}

export function saveState(state: AppState): void {
  try {
    const cleanRotations = (state.rotations || []).filter((r) => !isFictitiousRotation(r));
    const cleanMonths: Record<string, any> = {};
    if (state.months && typeof state.months === 'object') {
      for (const [key, val] of Object.entries(state.months)) {
        if (!isFictitiousMonth(key, val)) {
          cleanMonths[key] = val;
        }
      }
    }

    const stateToSave: AppState = {
      ...state,
      rotations: cleanRotations,
      months: cleanMonths,
      updatedAt: state.updatedAt || Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function resetToDefaults(): AppState {
  const initial = getInitialState();
  saveState(initial);
  return initial;
}

export function exportBackup(state: AppState): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `rotapay-backup-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateAndParseBackup(jsonString: string): AppState {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Arquivo de backup inválido.');
  }

  // Validate params
  if (!parsed.params || typeof parsed.params.salario !== 'number') {
    throw new Error('Estrutura de parâmetros inválida.');
  }

  // Validate rotations
  if (!Array.isArray(parsed.rotations)) {
    throw new Error('Lista de rotações ausente ou inválida.');
  }

  for (const rot of parsed.rotations) {
    if (!rot.id || !rot.saidaBR || !rot.chegadaSR || !rot.saidaSR || !rot.chegadaBR) {
      throw new Error('Formato de rotação incompleto no backup.');
    }
  }

  const holidays: Holiday[] = Array.isArray(parsed.holidays)
    ? parsed.holidays
    : getInitialState().holidays;

  return {
    params: { ...getInitialState().params, ...parsed.params } as Params,
    holidays,
    rotations: parsed.rotations as Rotation[],
    months: parsed.months && typeof parsed.months === 'object' ? parsed.months : {},
    updatedAt: parsed.updatedAt || Date.now(),
  };
}
