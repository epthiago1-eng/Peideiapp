export type Params = {
  ano: number;            // reference year
  salario: number;        // monthly base salary (BRL)
  cambio: number;         // default USD→BRL
  pctHE: number;          // overtime premium (0.6 = 60%)
  divHoras: number;       // monthly hours divisor
  pctSob: number;         // sobreaviso %
  pctPer: number;         // periculosidade %
  sobPerSempre: boolean;  // pay sobreaviso/periculosidade every month (false = only months with days in Suriname)
  fatorCampo: number;     // field service factor
  fatorNot: number;       // field night factor
  horasNot: number;       // night hours per day
  divNot: number;         // night divisor
  valorViagem: number;    // BRL per trip
  bonusUSD: number;       // USD per day in Suriname
  fatorDobra: number;     // × salary per double day
  pctTrabExt: number;     // work-abroad %
  regraDobra?: 'escala_28' | 'domingos_feriados'; // 'escala_28' (a partir do 29º dia) ou 'domingos_feriados'
  diasBaseDobra?: number; // escala base antes de contar dobra (padrão 28 dias)
  dobraDom: boolean;      // Sundays in Suriname count as "dobra"
  dobraFer: boolean;      // holidays in Suriname count as "dobra"
  inss: number;
  pctIRRF: number;
  pctAdiant: number;
  pctPrev: number;
  pctPGBL: number;
  copart: number;
  odonto: number;
  pctFGTS: number;

  // Campos opcionais de cálculo automático de impostos (IR/INSS)
  metodoIRRF?: 'manual' | 'progressivo';
  dependentesIR?: number;
  deducaoDependente?: number;
  outrasDeducoesIR?: number;
  aliquotaIRRFMax?: number;
  parcelaDedIRRFMax?: number;
  metodoINSS?: 'fixo' | 'progressivo';
  tetoINSS?: number;
};

export type Rotation = {
  id: string;
  saidaBR: string;   // ISO YYYY-MM-DD
  chegadaSR: string; // ISO YYYY-MM-DD
  saidaSR: string;   // ISO YYYY-MM-DD
  chegadaBR: string; // ISO YYYY-MM-DD
  nota: string;
};

export type Holiday = {
  date: string; // ISO YYYY-MM-DD
  name: string;
};

export type MonthOverride = {
  he?: number;
  heVal?: number;
  dobra?: number;
  valorDobra?: number;
  viag?: number;
  cambio?: number;
  salario?: number;
  diasSR?: number;
  diasOffshore?: number;
  sobreaviso?: number;
  periculosidade?: number;
  servicoCampo?: number;
  noturnoCampo?: number;
  dsr?: number;
  valorViagem?: number;
  bonusViagemExterior?: number;
  trabalhoExterior?: number;
  folgasIndenizadas?: number;
  copart?: number;
  odonto?: number;
  prev?: number;
  pgbl?: number;
  inss?: number;
  irrf?: number;
  confirmed?: boolean;
  confirmedAt?: string;
  notes?: string;
};

export type AppState = {
  params: Params;
  holidays: Holiday[];
  rotations: Rotation[];
  months: Record<string, MonthOverride>; // key "YYYY-M", e.g. "2026-11"
  updatedAt: number;
};

export type DayCalendarInfo = {
  day: number;
  dateISO: string;
  inSR: boolean;
  isDobra: boolean;
  isTravel: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isSunday: boolean;
  isToday: boolean;
  travelType?: 'saidaBR' | 'saidaSR' | 'both';
  dayInRotation?: number; // 1-indexed day count in Suriname during the rotation
};

export type EarningsBreakdown = {
  salario: number;
  horasExtras60: number;
  he: number; // compat alias
  dsrHorasExtras: number;
  dsr: number; // compat alias
  sobreaviso: number;
  sob: number; // compat alias
  periculosidade: number;
  per: number; // compat alias
  servicoCampo: number;
  campo: number; // compat alias
  noturnoCampo: number;
  not: number; // compat alias
  adicionalViagem: number;
  viag: number; // compat alias
  bonusViagemExterior: number;
  bonus: number; // compat alias
  valorDobra: number;
  dobra: number; // compat alias
  trabalhoExterior: number;
  trab: number; // compat alias
  folgasIndenizadas?: number; // Código 01350
};

export type DeductionsBreakdown = {
  inss: number;
  irrfEstimado: number;
  irrf: number; // compat alias
  adiantamento: number;
  adiant: number; // compat alias
  previdenciaBasica: number;
  prev: number; // compat alias
  pgbl: number;
  coparticipacaoMedica: number;
  copart: number; // compat alias
  assistenciaOdontologica: number;
  odonto: number; // compat alias
};

export type TaxCalculationDetails = {
  inssMethod: 'fixo' | 'progressivo';
  inssValue: number;
  inssBase: number;
  inssTetoAtingido: boolean;
  inssFaixaDescricao: string;

  irrfMethod: 'manual' | 'progressivo';
  irrfValue: number;
  irrfBase: number;
  irrfAliquotaNominal: number;
  irrfAliquotaEfetiva: number;
  irrfDeducaoFaixa: number;
  irrfDeducaoDependentes: number;
  dependentesQtd: number;
  irrfFaixaDescricao: string;
};

export type MonthCalculation = {
  year: number;
  month: number;
  salario: number;
  cambio: number;
  cambioUsado: number;
  isConfirmed: boolean;
  hasCustomSalary: boolean;
  hasCustomCambio: boolean;

  // Exact canonical variables from RotaPay specification
  diasSR: number;
  dobraAutomatica: number;
  dobraUsada: number;
  diasOffshoreLiquidos: number;
  viagensAutomaticas: number;
  viagensUsadas: number;
  horasExtras: number;
  diasUteis: number;
  domingos: number;
  totalProventos: number;
  totalDescontos: number;
  liquidoHolerite: number;
  totalRecebidoMes: number;
  fgts: number;

  // Compat aliases
  dias: number;
  dobraAuto: number;
  dobra: number;
  off: number;
  viagAuto: number;
  viagens: number;
  he: number;
  ap: number;
  uteis: number;
  prov: number;
  desc: number;
  net: number;
  recebido: number;

  proventos: EarningsBreakdown;
  descontos: DeductionsBreakdown;
  days: DayCalendarInfo[];
  override?: MonthOverride;
  taxDetails?: TaxCalculationDetails;
};
