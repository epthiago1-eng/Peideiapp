import {
  AppState,
  DeductionsBreakdown,
  DayCalendarInfo,
  EarningsBreakdown,
  Holiday,
  MonthCalculation,
  Params,
  Rotation,
} from './types';

export const DEFAULT_PARAMS: Params = {
  ano: 2026,
  salario: 14395.77,
  cambio: 5.45,
  pctHE: 0.60,
  divHoras: 220,
  pctSob: 0.20,
  pctPer: 0.30,
  sobPerSempre: true,
  fatorCampo: 0.249,
  fatorNot: 0.25,
  horasNot: 7,
  divNot: 180,
  valorViagem: 345.50,
  bonusUSD: 50,
  fatorDobra: 0.15406,
  pctTrabExt: 0.25,
  regraDobra: 'escala_28',
  diasBaseDobra: 28,
  dobraDom: false,
  dobraFer: false,
  inss: 988.09,
  pctIRRF: 0.1754,
  pctAdiant: 0.40,
  pctPrev: 0.02,
  pctPGBL: 0.02,
  copart: 26.30,
  odonto: 136.00,
  pctFGTS: 0.08,
};

export const DEFAULT_HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', name: 'Confraternização Universal' },
  { date: '2026-04-03', name: 'Sexta-feira Santa' },
  { date: '2026-04-21', name: 'Tiradentes' },
  { date: '2026-05-01', name: 'Dia do Trabalho' },
  { date: '2026-09-07', name: 'Independência' },
  { date: '2026-10-12', name: 'N. Sra. Aparecida' },
  { date: '2026-11-02', name: 'Finados' },
  { date: '2026-11-15', name: 'Proclamação da República' },
  { date: '2026-11-20', name: 'Consciência Negra' },
  { date: '2026-12-25', name: 'Natal' },
];

/**
 * Pure UTC calendar date helpers (prevents timezone shifts)
 */
export function parseISODate(iso: string): { year: number; month: number; day: number; time: number } {
  const parts = iso.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 1;
  const day = parts[2] || 1;
  const time = Date.UTC(year, month - 1, day);
  return { year, month, day, time };
}

export function formatISODate(year: number, month: number, day: number): string {
  const y = year.toString().padStart(4, '0');
  const m = month.toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, daysToAdd: number): string {
  const { year, month, day } = parseISODate(iso);
  const dt = new Date(Date.UTC(year, month - 1, day + daysToAdd));
  return formatISODate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function daysBetweenInclusive(startISO: string, endISO: string): number {
  const start = parseISODate(startISO).time;
  const end = parseISODate(endISO).time;
  if (end < start) return 0;
  return Math.round((end - start) / (86400 * 1000)) + 1;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getDayOfWeekUTC(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = Sunday, 6 = Saturday
}

/**
 * Currency and Number Formatters for pt-BR
 */
const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  if (isNaN(value) || !isFinite(value)) return brlFormatter.format(0);
  return brlFormatter.format(value);
}

export function formatShortCurrency(value: number): string {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0';
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const k = value / 1000;
    const formatted = k.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `R$ ${formatted}k`;
  }
  return brlFormatter.format(value);
}

export function formatNumberBR(value: number, minDecimals = 0, maxDecimals = 2): string {
  if (isNaN(value) || !isFinite(value)) return '0';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}

export function formatPercentBR(decimalValue: number): string {
  if (isNaN(decimalValue) || !isFinite(decimalValue)) return '0%';
  return `${(decimalValue * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

export type RotationPreset = {
  id: string;
  name: string;
  diasSR: number;
  ciclo: number;
  description: string;
};

export const ROTATION_PRESETS: RotationPreset[] = [
  { id: '28x28', name: '28×28', diasSR: 29, ciclo: 56, description: '28 dias embarcado + 28 dias folga' },
  { id: '14x14', name: '14×14', diasSR: 15, ciclo: 28, description: '14 dias embarcado + 14 dias folga' },
  { id: '21x21', name: '21×21', diasSR: 22, ciclo: 42, description: '21 dias embarcado + 21 dias folga' },
  { id: 'custom', name: 'Personalizada', diasSR: 29, ciclo: 56, description: 'Duração e ciclo flexíveis' },
];

/**
 * 3.1 Rotation generator
 */
export function genRotations(
  startISO: string,
  diasSR: number,
  ciclo: number,
  endISO: string
): Rotation[] {
  const result: Rotation[] = [];
  let s = startISO;
  let count = 0;
  const endTime = parseISODate(endISO).time;

  while (parseISODate(s).time <= endTime && count < 60) {
    const saidaBR = s;
    const chegadaSR = addDays(s, 1);
    const saidaSR = addDays(chegadaSR, Math.max(1, diasSR) - 1);
    const chegadaBR = addDays(saidaSR, 1);

    result.push({
      id: `rot-${count + 1}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      saidaBR,
      chegadaSR,
      saidaSR,
      chegadaBR,
      nota: '',
    });

    s = addDays(s, Math.max(1, ciclo));
    count++;
  }

  return result;
}

export function getInitialDefaultRotations(): Rotation[] {
  return [
    {
      id: 'rot-2026-1',
      saidaBR: '2026-01-13',
      chegadaSR: '2026-01-14',
      saidaSR: '2026-02-11',
      chegadaBR: '2026-02-12',
      nota: 'Escala 28×28 · Rotação 1',
    },
    {
      id: 'rot-2026-2',
      saidaBR: '2026-03-10',
      chegadaSR: '2026-03-11',
      saidaSR: '2026-04-08',
      chegadaBR: '2026-04-09',
      nota: 'Escala 28×28 · Rotação 2',
    },
    {
      id: 'rot-2026-3',
      saidaBR: '2026-05-05',
      chegadaSR: '2026-05-06',
      saidaSR: '2026-06-03',
      chegadaBR: '2026-06-04',
      nota: 'Escala 28×28 · Rotação 3',
    },
    {
      id: 'rot-2026-4',
      saidaBR: '2026-07-07',
      chegadaSR: '2026-07-08',
      saidaSR: '2026-08-05',
      chegadaBR: '2026-08-06',
      nota: 'Escala 28×28 · Rotação 4',
    },
    {
      id: 'rot-2026-5',
      saidaBR: '2026-09-23',
      chegadaSR: '2026-09-24',
      saidaSR: '2026-10-30',
      chegadaBR: '2026-10-31',
      nota: 'Rotação Holerites Reais (Set/Out 2026) · TechnipFMC',
    },
    {
      id: 'rot-2026-6',
      saidaBR: '2026-11-24',
      chegadaSR: '2026-11-25',
      saidaSR: '2026-12-23',
      chegadaBR: '2026-12-24',
      nota: 'Escala 28×28 · Rotação 6',
    },
  ];
}

export function getInitialState(): AppState {
  return {
    params: {
      ...DEFAULT_PARAMS,
      dependentesIR: 3,
      deducaoDependente: 189.59,
      aliquotaIRRFMax: 0.275,
      parcelaDedIRRFMax: 908.73,
      metodoIRRF: 'progressivo',
    },
    holidays: [...DEFAULT_HOLIDAYS_2026],
    rotations: getInitialDefaultRotations(),
    months: {
      '2026-09': {
        salario: 14395.77,
        cambio: 5.152714,
        he: 8.80,
        heVal: 921.40,
        dsr: 184.28,
        sobreaviso: 575.83,
        periculosidade: 4318.73,
        diasSR: 7,
        diasOffshore: 6,
        dobra: 0,
        valorDobra: 0,
        servicoCampo: 1075.38,
        noturnoCampo: 1259.58,
        valorViagem: 172.75,
        folgasIndenizadas: 3598.94,
        bonusViagemExterior: 1803.45,
        trabalhoExterior: 839.75,
        inss: 988.07,
        irrf: 6599.07,
        copart: 54.18,
        odonto: 124.00,
        prev: 0,
        pgbl: 287.92,
        confirmed: true,
        confirmedAt: '2026-09-30T23:59:59.000Z',
        notes: 'Recibo Pagto 09/2026 · TechnipFMC (Thiago Faria)',
      },
      '2026-10': {
        salario: 14395.77,
        cambio: 5.0277,
        he: 6.88,
        heVal: 720.36,
        dsr: 138.53,
        sobreaviso: 2879.15,
        periculosidade: 4318.73,
        diasSR: 30,
        diasOffshore: 30,
        dobra: 8,
        valorDobra: 17743.20,
        servicoCampo: 5376.90,
        noturnoCampo: 6297.90,
        valorViagem: 0,
        bonusViagemExterior: 7541.55,
        trabalhoExterior: 3598.94,
        inss: 988.07,
        irrf: 15911.99,
        copart: 0,
        odonto: 124.00,
        prev: 0,
        pgbl: 287.92,
        confirmed: true,
        confirmedAt: '2026-10-31T23:59:59.000Z',
        notes: 'Recibo Pagto 10/2026 · TechnipFMC (Thiago Faria)',
      },
    },
    updatedAt: Date.now(),
  };
}

/**
 * Tabela progressiva oficial do INSS
 * Faixa 1: até R$ 1.518,00 -> 7,5%
 * Faixa 2: de R$ 1.518,01 até R$ 2.793,88 -> 9%
 * Faixa 3: de R$ 2.793,89 até R$ 4.190,83 -> 12%
 * Faixa 4: de R$ 4.190,84 até R$ 8.157,41 -> 14%
 */
export function calculateProgressiveINSS(baseSalario: number, tetoConfig = 988.09): {
  value: number;
  isTeto: boolean;
  description: string;
} {
  const brackets = [
    { limit: 1518.00, rate: 0.075 },
    { limit: 2793.88, rate: 0.09 },
    { limit: 4190.83, rate: 0.12 },
    { limit: 8157.41, rate: 0.14 },
  ];

  let totalINSS = 0;
  let prevLimit = 0;

  for (const b of brackets) {
    if (baseSalario > prevLimit) {
      const taxable = Math.min(baseSalario, b.limit) - prevLimit;
      totalINSS += taxable * b.rate;
      prevLimit = b.limit;
    } else {
      break;
    }
  }

  if (totalINSS >= tetoConfig || baseSalario >= 8157.41) {
    return {
      value: tetoConfig,
      isTeto: true,
      description: `Teto máximo atingido (${formatCurrency(tetoConfig)})`,
    };
  }

  return {
    value: Math.round(totalINSS * 100) / 100,
    isTeto: false,
    description: `Tabela progressiva (faixas 7,5% a 14%)`,
  };
}

/**
 * Tabela progressiva mensal oficial do IRRF
 * Faixa 1: até R$ 2.259,20 -> 0% (isento)
 * Faixa 2: de R$ 2.259,21 até R$ 2.826,65 -> 7,5% (dedução R$ 169,44)
 * Faixa 3: de R$ 2.826,66 até R$ 3.751,05 -> 15,0% (dedução R$ 381,44)
 * Faixa 4: de R$ 3.751,06 até R$ 4.664,68 -> 22,5% (dedução R$ 651,73)
 * Faixa 5: acima de R$ 4.664,68 -> alíquota max (27,5% padrão, parcela padrão R$ 896,00)
 */
export function calculateProgressiveIRRF(
  baseCalculo: number,
  aliquotaMax = 0.275,
  parcelaMax = 896.00
): {
  value: number;
  aliquota: number;
  deducao: number;
  description: string;
} {
  if (baseCalculo <= 2259.20) {
    return {
      value: 0,
      aliquota: 0,
      deducao: 0,
      description: 'Isento de IRRF (base ≤ R$ 2.259,20)',
    };
  }
  if (baseCalculo <= 2826.65) {
    const val = Math.max(0, baseCalculo * 0.075 - 169.44);
    return {
      value: Math.round(val * 100) / 100,
      aliquota: 0.075,
      deducao: 169.44,
      description: 'Faixa 1: 7,5% (dedução R$ 169,44)',
    };
  }
  if (baseCalculo <= 3751.05) {
    const val = Math.max(0, baseCalculo * 0.15 - 381.44);
    return {
      value: Math.round(val * 100) / 100,
      aliquota: 0.15,
      deducao: 381.44,
      description: 'Faixa 2: 15,0% (dedução R$ 381,44)',
    };
  }
  if (baseCalculo <= 4664.68) {
    const val = Math.max(0, baseCalculo * 0.225 - 651.73);
    return {
      value: Math.round(val * 100) / 100,
      aliquota: 0.225,
      deducao: 651.73,
      description: 'Faixa 3: 22,5% (dedução R$ 651,73)',
    };
  }

  // Faixa máxima
  const val = Math.max(0, baseCalculo * aliquotaMax - parcelaMax);
  return {
    value: Math.round(val * 100) / 100,
    aliquota: aliquotaMax,
    deducao: parcelaMax,
    description: `Faixa 4: ${(aliquotaMax * 100).toFixed(1)}% (dedução ${formatCurrency(parcelaMax)})`,
  };
}

/**
 * 3.2 Monthly calculation: computeMonth(state, year, month)
 */
export function computeMonth(state: AppState, year: number, month: number): MonthCalculation {
  const { params, holidays, rotations, months } = state;
  const daysInMonth = getDaysInMonth(year, month);
  const monthKey = `${year}-${month}`;
  const monthKeyPad = `${year}-${month.toString().padStart(2, '0')}`;
  const override = months[monthKey] || months[monthKeyPad] || {};

  // Build lookup maps for holidays
  const holidayMap = new Map<string, string>();
  for (const h of holidays) {
    holidayMap.set(h.date, h.name);
  }

  let dias = 0;
  let dobraAuto = 0;
  let viagAuto = 0;
  let domingos = 0;
  let uteis = 0;

  // Prepare calendar days
  const days: DayCalendarInfo[] = [];

  // Today in UTC format
  const now = new Date();
  const todayISO = formatISODate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());

  for (let d = 1; d <= daysInMonth; d++) {
    const dateISO = formatISODate(year, month, d);
    const dateTime = parseISODate(dateISO).time;
    const dayOfWeek = getDayOfWeekUTC(year, month, d);
    const sun = dayOfWeek === 0;
    const isSat = dayOfWeek === 6;
    const isHol = holidayMap.has(dateISO);
    const holidayName = holidayMap.get(dateISO);

    if (sun) {
      domingos++;
    } else if (!isSat && !isHol) {
      uteis++;
    }

    // Check rotations
    let inSR = false;
    let trav = 0;
    let isSaidaBR = false;
    let isSaidaSR = false;
    let dayInRotation = 0;

    for (const rot of rotations) {
      const chegadaTime = parseISODate(rot.chegadaSR).time;
      const saidaTime = parseISODate(rot.saidaSR).time;

      if (dateTime >= chegadaTime && dateTime <= saidaTime) {
        inSR = true;
        // 1-indexed day count in Suriname during this rotation (chegadaSR = day 1)
        const currentDayIndex = Math.round((dateTime - chegadaTime) / (24 * 60 * 60 * 1000)) + 1;
        dayInRotation = Math.max(dayInRotation, currentDayIndex);
      }
      if (rot.saidaBR === dateISO) {
        trav++;
        isSaidaBR = true;
      }
      if (rot.saidaSR === dateISO) {
        trav++;
        isSaidaSR = true;
      }
    }

    const baseDays = params.diasBaseDobra !== undefined && params.diasBaseDobra > 0 ? params.diasBaseDobra : 28;
    const isEscalaDobra = inSR && dayInRotation > baseDays;
    const isDomFerDobra = inSR && ((sun && params.dobraDom) || (isHol && params.dobraFer));

    let dobAuto = false;
    if (params.regraDobra === 'domingos_feriados') {
      dobAuto = isDomFerDobra;
    } else {
      // Default: A dobra é categorizada a partir do 28º dia offshore (ou seja, 29º dia é dobra, 30º, etc.)
      dobAuto = isEscalaDobra || isDomFerDobra;
    }

    if (inSR) {
      dias++;
    }
    if (dobAuto) {
      dobraAuto++;
    }
    viagAuto += trav;

    let travelType: 'saidaBR' | 'saidaSR' | 'both' | undefined;
    if (isSaidaBR && isSaidaSR) travelType = 'both';
    else if (isSaidaBR) travelType = 'saidaBR';
    else if (isSaidaSR) travelType = 'saidaSR';

    days.push({
      day: d,
      dateISO,
      inSR,
      isDobra: dobAuto,
      isTravel: trav > 0,
      isHoliday: isHol,
      holidayName,
      isSunday: sun,
      isToday: dateISO === todayISO,
      travelType,
      dayInRotation: inSR ? dayInRotation : undefined,
    });
  }

  // If there is a manual override for dobra in this month, synchronize the calendar markers
  if (override.dobra !== undefined) {
    const targetDobra = Math.max(0, override.dobra);
    if (targetDobra === 0) {
      for (const dayInfo of days) {
        dayInfo.isDobra = false;
      }
    } else {
      const overstayDays = days.filter(
        (dayInfo) => dayInfo.inSR && (dayInfo.dayInRotation ? dayInfo.dayInRotation > (params.diasBaseDobra || 28) : false)
      );
      if (overstayDays.length > 0) {
        let marked = 0;
        for (const dayInfo of days) {
          if (dayInfo.inSR && dayInfo.dayInRotation && dayInfo.dayInRotation > (params.diasBaseDobra || 28)) {
            if (marked < targetDobra) {
              dayInfo.isDobra = true;
              marked++;
            } else {
              dayInfo.isDobra = false;
            }
          } else {
            dayInfo.isDobra = false;
          }
        }
      } else {
        // No natural overstay days in this month, mark the last targetDobra days in SR of the month
        const srDays = days.filter((dayInfo) => dayInfo.inSR);
        const startIndex = Math.max(0, srDays.length - targetDobra);
        const dobraDateSet = new Set(srDays.slice(startIndex).map((dayInfo) => dayInfo.dateISO));
        for (const dayInfo of days) {
          dayInfo.isDobra = dobraDateSet.has(dayInfo.dateISO);
        }
      }
    }
  }

  // Overrides & safety validation
  const diasSR = override.diasSR !== undefined ? Math.max(0, override.diasSR) : dias;
  const dobraAutoSafe = Math.min(diasSR, Math.max(0, dobraAuto));
  const dobraManualRaw = override.dobra !== undefined ? override.dobra : dobraAutoSafe;
  const dobra = Math.min(diasSR, Math.max(0, dobraManualRaw));
  const offAuto = Math.max(diasSR - dobra, 0);
  const off = override.diasOffshore !== undefined ? Math.max(0, override.diasOffshore) : offAuto;
  const viagManualRaw = override.viag !== undefined ? override.viag : viagAuto;
  const viagens = Math.max(0, viagManualRaw);
  const he = Math.max(0, override.he !== undefined ? override.he : 0);
  
  // Monthly salary and exchange rate can vary per month
  const hasCustomSalary = override.salario !== undefined && override.salario > 0;
  const S = Math.max(0, hasCustomSalary ? override.salario! : (params.salario || 0));

  const hasCustomCambio = override.cambio !== undefined && override.cambio > 0;
  const cambio = hasCustomCambio ? override.cambio! : (params.cambio > 0 ? params.cambio : 5.45);

  const isConfirmed = Boolean(override.confirmed);
  const ap = (params.sobPerSempre || diasSR > 0) ? 1 : 0;

  // Earnings
  const salarioVal = S;
  const divHorasSafe = params.divHoras > 0 ? params.divHoras : 220;
  const pctHESafe = Math.max(0, params.pctHE);
  const heCalc = (S / divHorasSafe) * (1 + pctHESafe) * he;
  const heVal = override.heVal !== undefined ? override.heVal : heCalc;
  const dsrVal = override.dsr !== undefined ? override.dsr : (uteis > 0 ? (heVal / uteis) * domingos : 0);
  const pctSobSafe = Math.max(0, params.pctSob);
  const pctPerSafe = Math.max(0, params.pctPer);
  const sobVal = override.sobreaviso !== undefined ? override.sobreaviso : (S * pctSobSafe * ap);
  const perVal = override.periculosidade !== undefined ? override.periculosidade : (S * pctPerSafe * ap);

  const baseCampo = S + (S * pctSobSafe * ap) + perVal;
  const fatorCampoSafe = Math.max(0, params.fatorCampo);
  const campoCalc = off > 0 ? off * (fatorCampoSafe * baseCampo / 30) : 0;
  const campoVal = override.servicoCampo !== undefined ? override.servicoCampo : campoCalc;
  const divNotSafe = params.divNot > 0 ? params.divNot : 180;
  const fatorNotSafe = Math.max(0, params.fatorNot);
  const horasNotSafe = Math.max(0, params.horasNot);
  const notCalc = off > 0 ? off * (fatorNotSafe * horasNotSafe * baseCampo / divNotSafe) : 0;
  const notVal = override.noturnoCampo !== undefined ? override.noturnoCampo : notCalc;
  const valorViagemSafe = Math.max(0, params.valorViagem);
  const viagVal = override.valorViagem !== undefined ? override.valorViagem : (viagens * valorViagemSafe);
  const bonusUSDSafe = Math.max(0, params.bonusUSD);
  const bonusCalc = diasSR * cambio * bonusUSDSafe;
  const bonusVal = override.bonusViagemExterior !== undefined ? override.bonusViagemExterior : bonusCalc;
  const fatorDobraSafe = Math.max(0, params.fatorDobra);
  const dobraCalc = dobra * S * fatorDobraSafe;
  const dobraVal = override.valorDobra !== undefined ? override.valorDobra : dobraCalc;
  const pctTrabExtSafe = Math.max(0, params.pctTrabExt);
  const trabCalc = (S / 30) * pctTrabExtSafe * diasSR;
  const trabVal = override.trabalhoExterior !== undefined ? override.trabalhoExterior : trabCalc;
  const folgasIndenizadasVal = override.folgasIndenizadas !== undefined ? Math.max(0, override.folgasIndenizadas) : 0;

  const proventos: EarningsBreakdown = {
    salario: salarioVal,
    horasExtras60: heVal,
    he: heVal,
    dsrHorasExtras: dsrVal,
    dsr: dsrVal,
    sobreaviso: sobVal,
    sob: sobVal,
    periculosidade: perVal,
    per: perVal,
    servicoCampo: campoVal,
    campo: campoVal,
    noturnoCampo: notVal,
    not: notVal,
    adicionalViagem: viagVal,
    viag: viagVal,
    bonusViagemExterior: bonusVal,
    bonus: bonusVal,
    valorDobra: dobraVal,
    dobra: dobraVal,
    trabalhoExterior: trabVal,
    trab: trabVal,
    folgasIndenizadas: folgasIndenizadasVal > 0 ? folgasIndenizadasVal : undefined,
  };

  const prov =
    salarioVal +
    heVal +
    dsrVal +
    sobVal +
    perVal +
    campoVal +
    notVal +
    viagVal +
    bonusVal +
    dobraVal +
    trabVal +
    folgasIndenizadasVal;

  // Deductions & Impostos
  let inssVal = override.inss !== undefined ? override.inss : Math.max(0, params.inss);
  let inssBase = S;
  let inssTetoAtingido = true;
  let inssFaixaDescricao = override.inss !== undefined
    ? `Teto fixo holerite (${formatCurrency(override.inss)})`
    : `Teto fixo (${formatCurrency(params.inss)})`;

  if (override.inss === undefined && params.metodoINSS === 'progressivo') {
    const teto = params.tetoINSS || 988.09;
    inssBase = Math.min(S, 8157.41);
    const inssRes = calculateProgressiveINSS(S, teto);
    inssVal = inssRes.value;
    inssTetoAtingido = inssRes.isTeto;
    inssFaixaDescricao = inssRes.description;
  }

  const adiantVal = S * Math.max(0, params.pctAdiant);
  const prevVal = override.prev !== undefined ? Math.max(0, override.prev) : (S * Math.max(0, params.pctPrev));
  const pgblVal = override.pgbl !== undefined ? Math.max(0, override.pgbl) : (S * Math.max(0, params.pctPGBL));
  const copartVal = override.copart !== undefined ? Math.max(0, override.copart) : Math.max(0, params.copart);
  const odontoVal = override.odonto !== undefined ? Math.max(0, override.odonto) : Math.max(0, params.odonto);

  const pctIRRFSafe = Math.max(0, params.pctIRRF);
  let irrfVal = override.irrf !== undefined ? override.irrf : (prov * pctIRRFSafe);
  let irrfBase = prov;
  let irrfAliquotaNominal = pctIRRFSafe;
  let irrfDeducaoFaixa = 0;
  let irrfDeducaoDependentes = 0;
  const dependentesQtd = Math.max(0, params.dependentesIR || 0);
  let irrfFaixaDescricao = override.irrf !== undefined
    ? `Retenção oficial do holerite (${formatCurrency(override.irrf)})`
    : `Alíquota efetiva manual (${(pctIRRFSafe * 100).toFixed(2)}%)`;

  if (override.irrf === undefined && params.metodoIRRF === 'progressivo') {
    const dedDep = dependentesQtd * (params.deducaoDependente || 189.59);
    const outrasDed = Math.max(0, params.outrasDeducoesIR || 0);
    irrfDeducaoDependentes = dedDep;
    irrfBase = Math.max(0, prov - inssVal - prevVal - pgblVal - dedDep - outrasDed);

    const progIR = calculateProgressiveIRRF(
      irrfBase,
      params.aliquotaIRRFMax || 0.275,
      params.parcelaDedIRRFMax || 896.00
    );
    irrfVal = progIR.value;
    irrfAliquotaNominal = progIR.aliquota;
    irrfDeducaoFaixa = progIR.deducao;
    irrfFaixaDescricao = progIR.description;
  }

  const taxDetails = {
    inssMethod: params.metodoINSS || 'fixo',
    inssValue: inssVal,
    inssBase,
    inssTetoAtingido,
    inssFaixaDescricao,
    irrfMethod: params.metodoIRRF || 'manual',
    irrfValue: irrfVal,
    irrfBase,
    irrfAliquotaNominal,
    irrfAliquotaEfetiva: prov > 0 ? irrfVal / prov : 0,
    irrfDeducaoFaixa,
    irrfDeducaoDependentes,
    dependentesQtd,
    irrfFaixaDescricao,
  };

  const descontos: DeductionsBreakdown = {
    inss: inssVal,
    irrfEstimado: irrfVal,
    irrf: irrfVal,
    adiantamento: adiantVal,
    adiant: adiantVal,
    previdenciaBasica: prevVal,
    prev: prevVal,
    pgbl: pgblVal,
    coparticipacaoMedica: copartVal,
    copart: copartVal,
    assistenciaOdontologica: odontoVal,
    odonto: odontoVal,
  };

  const desc = inssVal + irrfVal + adiantVal + prevVal + pgblVal + copartVal + odontoVal;
  const net = prov - desc;
  const recebido = net + adiantVal;
  const fgts = prov * Math.max(0, params.pctFGTS);

  return {
    year,
    month,
    salario: S,
    cambio,
    cambioUsado: cambio,
    isConfirmed,
    hasCustomSalary,
    hasCustomCambio,

    // Canonical properties from RotaPay specification
    diasSR,
    dobraAutomatica: dobraAutoSafe,
    dobraUsada: dobra,
    diasOffshoreLiquidos: off,
    viagensAutomaticas: viagAuto,
    viagensUsadas: viagens,
    horasExtras: he,
    diasUteis: uteis,
    domingos,
    totalProventos: prov,
    totalDescontos: desc,
    liquidoHolerite: net,
    totalRecebidoMes: recebido,
    fgts,

    // Compatibility aliases
    dias: diasSR,
    dobraAuto: dobraAutoSafe,
    dobra,
    off,
    viagAuto,
    viagens,
    he,
    ap,
    uteis,
    prov,
    desc,
    net,
    recebido,

    proventos,
    descontos,
    days,
    override,
    taxDetails,
  };
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const MONTH_SHORT_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function getRotationStatus(rotation: Rotation, todayISO?: string): {
  status: 'concluida' | 'andamento' | 'proxima';
  label: string;
  days: number;
} {
  const today = todayISO || (() => {
    const n = new Date();
    return formatISODate(n.getUTCFullYear(), n.getUTCMonth() + 1, n.getUTCDate());
  })();

  const days = daysBetweenInclusive(rotation.chegadaSR, rotation.saidaSR);

  if (today > rotation.chegadaBR) {
    return { status: 'concluida', label: `Concluída · ${days} dias`, days };
  }
  if (today < rotation.saidaBR) {
    return { status: 'proxima', label: `Próxima · ${days} dias`, days };
  }
  return { status: 'andamento', label: `Em andamento · ${days} dias`, days };
}
