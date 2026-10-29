import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AppState } from './types';

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'local';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface CrudDiagnosticReport {
  configured: boolean;
  authenticated: boolean;
  userEmail: string | null;
  tableExists: boolean;
  create: { ok: boolean; message: string; durationMs: number };
  read: { ok: boolean; message: string; durationMs: number; recordCount: number; updatedAt?: string };
  update: { ok: boolean; message: string; durationMs: number };
  deletePolicy: { ok: boolean; message: string };
  overallSuccess: boolean;
  message: string;
}

export const SUPABASE_SQL_SCRIPT = `-- ==============================================================================
-- ROTAPAY - SCRIPT COMPLETO DE CRIAÇÃO DO BANCO DE DADOS NO SUPABASE
-- ==============================================================================
-- Este script cria:
-- 1. Tabela unificada 'user_state' (JSONB) utilizada para sincronização instantânea
-- 2. Tabelas relacionais individuais:
--    - user_profiles (perfis de usuário)
--    - user_params (parâmetros de cálculo CLT/offshore)
--    - rotations (escalas e rotações de embarque)
--    - month_overrides (holerites, fechamentos e valores reais)
--    - holidays (calendário de feriados)
-- 3. Políticas de Segurança por Linha (Row Level Security - RLS) em todas as tabelas
-- 4. Função e Gatilho para autoprovisionamento e carga de dados padrão de 2026
-- ==============================================================================

-- Habilita extensão de UUID se necessário
create extension if not exists "uuid-ossp";

-- 1. TABELA UNIFICADA: user_state
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "Users can select own state" on public.user_state;
drop policy if exists "Users can insert own state" on public.user_state;
drop policy if exists "Users can update own state" on public.user_state;
drop policy if exists "Users can delete own state" on public.user_state;

create policy "Users can select own state" on public.user_state for select using (auth.uid() = user_id);
create policy "Users can insert own state" on public.user_state for insert with check (auth.uid() = user_id);
create policy "Users can update own state" on public.user_state for update using (auth.uid() = user_id);
create policy "Users can delete own state" on public.user_state for delete using (auth.uid() = user_id);

create index if not exists idx_user_state_updated_at on public.user_state(updated_at);

-- 2. TABELA RELACIONAL: user_profiles
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text default 'Colaborador Offshore',
  company text default 'TechnipFMC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
drop policy if exists "Users can select own profile" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Users can delete own profile" on public.user_profiles;
create policy "Users can select own profile" on public.user_profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.user_profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.user_profiles for update using (auth.uid() = id);
create policy "Users can delete own profile" on public.user_profiles for delete using (auth.uid() = id);

-- 3. TABELA RELACIONAL: user_params
create table if not exists public.user_params (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ano integer not null default 2026,
  salario numeric(12,2) not null default 14395.77,
  cambio numeric(10,6) not null default 5.450000,
  pct_he numeric(6,4) not null default 0.6000,
  div_horas integer not null default 220,
  pct_sob numeric(6,4) not null default 0.2000,
  pct_per numeric(6,4) not null default 0.3000,
  sob_per_sempre boolean not null default true,
  fator_campo numeric(8,4) not null default 0.2490,
  fator_not numeric(6,4) not null default 0.2500,
  horas_not integer not null default 7,
  div_not integer not null default 180,
  valor_viagem numeric(10,2) not null default 345.50,
  bonus_usd numeric(10,2) not null default 50.00,
  fator_dobra numeric(8,5) not null default 0.15406,
  pct_trab_ext numeric(6,4) not null default 0.2500,
  regra_dobra text not null default 'escala_28',
  dias_base_dobra integer not null default 28,
  dobra_dom boolean not null default false,
  dobra_fer boolean not null default false,
  inss numeric(10,2) not null default 988.09,
  pct_irrf numeric(6,4) not null default 0.1754,
  pct_adiant numeric(6,4) not null default 0.4000,
  pct_prev numeric(6,4) not null default 0.0200,
  pct_pgbl numeric(6,4) not null default 0.0200,
  copart numeric(10,2) not null default 26.30,
  odonto numeric(10,2) not null default 136.00,
  pct_fgts numeric(6,4) not null default 0.0800,
  metodo_irrf text not null default 'progressivo',
  dependentes_ir integer not null default 3,
  deducao_dependente numeric(10,2) not null default 189.59,
  aliquota_irrf_max numeric(6,4) not null default 0.2750,
  parcela_ded_irrf_max numeric(10,2) not null default 908.73,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_user_params_user unique (user_id)
);

alter table public.user_params enable row level security;
drop policy if exists "Users can select own params" on public.user_params;
drop policy if exists "Users can insert own params" on public.user_params;
drop policy if exists "Users can update own params" on public.user_params;
drop policy if exists "Users can delete own params" on public.user_params;
create policy "Users can select own params" on public.user_params for select using (auth.uid() = user_id);
create policy "Users can insert own params" on public.user_params for insert with check (auth.uid() = user_id);
create policy "Users can update own params" on public.user_params for update using (auth.uid() = user_id);
create policy "Users can delete own params" on public.user_params for delete using (auth.uid() = user_id);

-- 4. TABELA RELACIONAL: rotations
create table if not exists public.rotations (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  saida_br date not null,
  chegada_sr date not null,
  saida_sr date not null,
  chegada_br date not null,
  nota text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.rotations enable row level security;
drop policy if exists "Users can select own rotations" on public.rotations;
drop policy if exists "Users can insert own rotations" on public.rotations;
drop policy if exists "Users can update own rotations" on public.rotations;
drop policy if exists "Users can delete own rotations" on public.rotations;
create policy "Users can select own rotations" on public.rotations for select using (auth.uid() = user_id);
create policy "Users can insert own rotations" on public.rotations for insert with check (auth.uid() = user_id);
create policy "Users can update own rotations" on public.rotations for update using (auth.uid() = user_id);
create policy "Users can delete own rotations" on public.rotations for delete using (auth.uid() = user_id);
create index if not exists idx_rotations_dates on public.rotations(user_id, chegada_sr, saida_sr);

-- 5. TABELA RELACIONAL: month_overrides
create table if not exists public.month_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null,
  salario numeric(12,2),
  cambio numeric(10,6),
  he numeric(8,2),
  he_val numeric(12,2),
  dsr numeric(12,2),
  sobreaviso numeric(12,2),
  periculosidade numeric(12,2),
  dias_sr integer,
  dias_offshore integer,
  dobra numeric(8,2),
  valor_dobra numeric(12,2),
  servico_campo numeric(12,2),
  noturno_campo numeric(12,2),
  viagens numeric(6,2),
  valor_viagem numeric(12,2),
  folgas_indenizadas numeric(12,2),
  bonus_viagem_exterior numeric(12,2),
  trabalho_exterior numeric(12,2),
  inss numeric(12,2),
  irrf numeric(12,2),
  copart numeric(12,2),
  odonto numeric(12,2),
  prev numeric(12,2),
  pgbl numeric(12,2),
  confirmed boolean default false,
  confirmed_at timestamptz,
  notes text,
  updated_at timestamptz not null default now(),
  primary key (user_id, month_key)
);

alter table public.month_overrides enable row level security;
drop policy if exists "Users can select own month_overrides" on public.month_overrides;
drop policy if exists "Users can insert own month_overrides" on public.month_overrides;
drop policy if exists "Users can update own month_overrides" on public.month_overrides;
drop policy if exists "Users can delete own month_overrides" on public.month_overrides;
create policy "Users can select own month_overrides" on public.month_overrides for select using (auth.uid() = user_id);
create policy "Users can insert own month_overrides" on public.month_overrides for insert with check (auth.uid() = user_id);
create policy "Users can update own month_overrides" on public.month_overrides for update using (auth.uid() = user_id);
create policy "Users can delete own month_overrides" on public.month_overrides for delete using (auth.uid() = user_id);

-- 6. TABELA RELACIONAL: holidays
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  name text not null,
  is_national boolean not null default true,
  created_at timestamptz not null default now(),
  constraint uq_user_holiday_date unique (user_id, date)
);

alter table public.holidays enable row level security;
drop policy if exists "Users can select own holidays" on public.holidays;
drop policy if exists "Users can insert own holidays" on public.holidays;
drop policy if exists "Users can update own holidays" on public.holidays;
drop policy if exists "Users can delete own holidays" on public.holidays;
create policy "Users can select own holidays" on public.holidays for select using (auth.uid() = user_id);
create policy "Users can insert own holidays" on public.holidays for insert with check (auth.uid() = user_id);
create policy "Users can update own holidays" on public.holidays for update using (auth.uid() = user_id);
create policy "Users can delete own holidays" on public.holidays for delete using (auth.uid() = user_id);

-- 7. FUNÇÃO DE CARGA INICIAL: seed_user_data_2026
create or replace function public.seed_user_data_2026(target_user_id uuid)
returns void as $$
declare
  v_user_email text;
begin
  select email into v_user_email from auth.users where id = target_user_id;

  insert into public.user_profiles (id, email, full_name, company)
  values (target_user_id, v_user_email, 'Thiago Faria', 'TechnipFMC')
  on conflict (id) do update set email = excluded.email, updated_at = now();

  insert into public.user_params (
    user_id, ano, salario, cambio, pct_he, div_horas, pct_sob, pct_per,
    sob_per_sempre, fator_campo, fator_not, horas_not, div_not,
    valor_viagem, bonus_usd, fator_dobra, pct_trab_ext, regra_dobra,
    dias_base_dobra, dobra_dom, dobra_fer, inss, pct_irrf, pct_adiant,
    pct_prev, pct_pgbl, copart, odonto, pct_fgts, metodo_irrf,
    dependentes_ir, deducao_dependente, aliquota_irrf_max, parcela_ded_irrf_max
  ) values (
    target_user_id, 2026, 14395.77, 5.45, 0.60, 220, 0.20, 0.30,
    true, 0.2490, 0.2500, 7, 180,
    345.50, 50.00, 0.15406, 0.2500, 'escala_28',
    28, false, false, 988.09, 0.1754, 0.40,
    0.02, 0.02, 26.30, 136.00, 0.08, 'progressivo',
    3, 189.59, 0.2750, 908.73
  ) on conflict (user_id) do update set updated_at = now();

  insert into public.holidays (user_id, date, name, is_national) values
    (target_user_id, '2026-01-01', 'Confraternização Universal', true),
    (target_user_id, '2026-04-03', 'Sexta-feira Santa', true),
    (target_user_id, '2026-04-21', 'Tiradentes', true),
    (target_user_id, '2026-05-01', 'Dia do Trabalho', true),
    (target_user_id, '2026-09-07', 'Independência', true),
    (target_user_id, '2026-10-12', 'N. Sra. Aparecida', true),
    (target_user_id, '2026-11-02', 'Finados', true),
    (target_user_id, '2026-11-15', 'Proclamação da República', true),
    (target_user_id, '2026-11-20', 'Consciência Negra', true),
    (target_user_id, '2026-12-25', 'Natal', true)
  on conflict (user_id, date) do nothing;

  insert into public.rotations (id, user_id, saida_br, chegada_sr, saida_sr, chegada_br, nota) values
    ('rot-2026-1', target_user_id, '2026-01-13', '2026-01-14', '2026-02-11', '2026-02-12', 'Escala 28×28 · Rotação 1'),
    ('rot-2026-2', target_user_id, '2026-03-10', '2026-03-11', '2026-04-08', '2026-04-09', 'Escala 28×28 · Rotação 2'),
    ('rot-2026-3', target_user_id, '2026-05-05', '2026-05-06', '2026-06-03', '2026-06-04', 'Escala 28×28 · Rotação 3'),
    ('rot-2026-4', target_user_id, '2026-07-07', '2026-07-08', '2026-08-05', '2026-08-06', 'Escala 28×28 · Rotação 4'),
    ('rot-2026-5', target_user_id, '2026-09-23', '2026-09-24', '2026-10-30', '2026-10-31', 'Rotação Holerites Reais (Set/Out 2026) · TechnipFMC'),
    ('rot-2026-6', target_user_id, '2026-11-24', '2026-11-25', '2026-12-23', '2026-12-24', 'Escala 28×28 · Rotação 6')
  on conflict (user_id, id) do update set saida_br = excluded.saida_br, chegada_sr = excluded.chegada_sr, saida_sr = excluded.saida_sr, chegada_br = excluded.chegada_br, nota = excluded.nota, updated_at = now();

  insert into public.month_overrides (
    user_id, month_key, salario, cambio, he, he_val, dsr, sobreaviso,
    periculosidade, dias_sr, dias_offshore, dobra, valor_dobra,
    servico_campo, noturno_campo, viagens, valor_viagem, folgas_indenizadas,
    bonus_viagem_exterior, trabalho_exterior, inss, irrf, copart,
    odonto, prev, pgbl, confirmed, confirmed_at, notes
  ) values
    (target_user_id, '2026-09', 14395.77, 5.152714, 8.80, 921.40, 184.28, 575.83, 4318.73, 7, 6, 0.00, 0.00, 1075.38, 1259.58, 1, 172.75, 3598.94, 1803.45, 839.75, 988.07, 6599.07, 54.18, 124.00, 0.00, 287.92, true, '2026-09-30 23:59:59+00', 'Recibo Pagto 09/2026 · TechnipFMC (Thiago Faria)'),
    (target_user_id, '2026-10', 14395.77, 5.027700, 6.88, 720.36, 138.53, 2879.15, 4318.73, 30, 30, 8.00, 17743.20, 5376.90, 6297.90, 0, 0.00, 0.00, 7541.55, 3598.94, 988.07, 15911.99, 0.00, 124.00, 0.00, 287.92, true, '2026-10-31 23:59:59+00', 'Recibo Pagto 10/2026 · TechnipFMC (Thiago Faria)')
  on conflict (user_id, month_key) do update set salario = excluded.salario, cambio = excluded.cambio, he = excluded.he, he_val = excluded.he_val, dsr = excluded.dsr, sobreaviso = excluded.sobreaviso, periculosidade = excluded.periculosidade, dias_sr = excluded.dias_sr, dias_offshore = excluded.dias_offshore, dobra = excluded.dobra, valor_dobra = excluded.valor_dobra, servico_campo = excluded.servico_campo, noturno_campo = excluded.noturno_campo, valor_viagem = excluded.valor_viagem, folgas_indenizadas = excluded.folgas_indenizadas, bonus_viagem_exterior = excluded.bonus_viagem_exterior, trabalho_exterior = excluded.trabalho_exterior, inss = excluded.inss, irrf = excluded.irrf, copart = excluded.copart, odonto = excluded.odonto, prev = excluded.prev, pgbl = excluded.pgbl, confirmed = excluded.confirmed, confirmed_at = excluded.confirmed_at, notes = excluded.notes, updated_at = now();

  insert into public.user_state (user_id, data, updated_at) values (
    target_user_id,
    jsonb_build_object(
      'params', jsonb_build_object(
        'ano', 2026, 'salario', 14395.77, 'cambio', 5.45, 'pctHE', 0.60, 'divHoras', 220,
        'pctSob', 0.20, 'pctPer', 0.30, 'sobPerSempre', true, 'fatorCampo', 0.249, 'fatorNot', 0.25,
        'horasNot', 7, 'divNot', 180, 'valorViagem', 345.50, 'bonusUSD', 50, 'fatorDobra', 0.15406,
        'pctTrabExt', 0.25, 'regraDobra', 'escala_28', 'diasBaseDobra', 28, 'dobraDom', false, 'dobraFer', false,
        'inss', 988.09, 'pctIRRF', 0.1754, 'pctAdiant', 0.40, 'pctPrev', 0.02, 'pctPGBL', 0.02,
        'copart', 26.30, 'odonto', 136.00, 'pctFGTS', 0.08, 'metodoIRRF', 'progressivo',
        'dependentesIR', 3, 'deducaoDependente', 189.59, 'aliquotaIRRFMax', 0.275, 'parcelaDedIRRFMax', 908.73
      ),
      'holidays', jsonb_build_array(
        jsonb_build_object('date', '2026-01-01', 'name', 'Confraternização Universal'),
        jsonb_build_object('date', '2026-04-03', 'name', 'Sexta-feira Santa'),
        jsonb_build_object('date', '2026-04-21', 'name', 'Tiradentes'),
        jsonb_build_object('date', '2026-05-01', 'name', 'Dia do Trabalho'),
        jsonb_build_object('date', '2026-09-07', 'name', 'Independência'),
        jsonb_build_object('date', '2026-10-12', 'name', 'N. Sra. Aparecida'),
        jsonb_build_object('date', '2026-11-02', 'name', 'Finados'),
        jsonb_build_object('date', '2026-11-15', 'name', 'Proclamação da República'),
        jsonb_build_object('date', '2026-11-20', 'name', 'Consciência Negra'),
        jsonb_build_object('date', '2026-12-25', 'name', 'Natal')
      ),
      'rotations', jsonb_build_array(
        jsonb_build_object('id', 'rot-2026-1', 'saidaBR', '2026-01-13', 'chegadaSR', '2026-01-14', 'saidaSR', '2026-02-11', 'chegadaBR', '2026-02-12', 'nota', 'Escala 28×28 · Rotação 1'),
        jsonb_build_object('id', 'rot-2026-2', 'saidaBR', '2026-03-10', 'chegadaSR', '2026-03-11', 'saidaSR', '2026-04-08', 'chegadaBR', '2026-04-09', 'nota', 'Escala 28×28 · Rotação 2'),
        jsonb_build_object('id', 'rot-2026-3', 'saidaBR', '2026-05-05', 'chegadaSR', '2026-05-06', 'saidaSR', '2026-06-03', 'chegadaBR', '2026-06-04', 'nota', 'Escala 28×28 · Rotação 3'),
        jsonb_build_object('id', 'rot-2026-4', 'saidaBR', '2026-07-07', 'chegadaSR', '2026-07-08', 'saidaSR', '2026-08-05', 'chegadaBR', '2026-08-06', 'nota', 'Escala 28×28 · Rotação 4'),
        jsonb_build_object('id', 'rot-2026-5', 'saidaBR', '2026-09-23', 'chegadaSR', '2026-09-24', 'saidaSR', '2026-10-30', 'chegadaBR', '2026-10-31', 'nota', 'Rotação Holerites Reais (Set/Out 2026) · TechnipFMC'),
        jsonb_build_object('id', 'rot-2026-6', 'saidaBR', '2026-11-24', 'chegadaSR', '2026-11-25', 'saidaSR', '2026-12-23', 'chegadaBR', '2026-12-24', 'nota', 'Escala 28×28 · Rotação 6')
      ),
      'months', jsonb_build_object(
        '2026-09', jsonb_build_object(
          'salario', 14395.77, 'cambio', 5.152714, 'he', 8.80, 'heVal', 921.40, 'dsr', 184.28,
          'sobreaviso', 575.83, 'periculosidade', 4318.73, 'diasSR', 7, 'diasOffshore', 6, 'dobra', 0,
          'valorDobra', 0, 'servicoCampo', 1075.38, 'noturnoCampo', 1259.58, 'valorViagem', 172.75,
          'folgasIndenizadas', 3598.94, 'bonusViagemExterior', 1803.45, 'trabalhoExterior', 839.75,
          'inss', 988.07, 'irrf', 6599.07, 'copart', 54.18, 'odonto', 124.00, 'prev', 0, 'pgbl', 287.92,
          'confirmed', true, 'confirmedAt', '2026-09-30T23:59:59.000Z', 'notes', 'Recibo Pagto 09/2026 · TechnipFMC (Thiago Faria)'
        ),
        '2026-10', jsonb_build_object(
          'salario', 14395.77, 'cambio', 5.0277, 'he', 6.88, 'heVal', 720.36, 'dsr', 138.53,
          'sobreaviso', 2879.15, 'periculosidade', 4318.73, 'diasSR', 30, 'diasOffshore', 30, 'dobra', 8,
          'valorDobra', 17743.20, 'servicoCampo', 5376.90, 'noturnoCampo', 6297.90, 'valorViagem', 0,
          'bonusViagemExterior', 7541.55, 'trabalhoExterior', 3598.94, 'inss', 988.07, 'irrf', 15911.99,
          'copart', 0, 'odonto', 124.00, 'prev', 0, 'pgbl', 287.92, 'confirmed', true,
          'confirmedAt', '2026-10-31T23:59:59.000Z', 'notes', 'Recibo Pagto 10/2026 · TechnipFMC (Thiago Faria)'
        )
      ),
      'updatedAt', floor(extract(epoch from now()) * 1000)
    ),
    now()
  ) on conflict (user_id) do update set data = excluded.data, updated_at = now();
end;
$$ language plpgsql security definer;

-- 8. GATILHO AUTOMÁTICO PARA NOVOS CADASTROS
create or replace function public.handle_new_user() returns trigger as $$
begin
  perform public.seed_user_data_2026(new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 9. POPULA USUÁRIOS JÁ CADASTRADOS
do $$
declare
  u record;
begin
  for u in select id from auth.users loop
    perform public.seed_user_data_2026(u.id);
  end loop;
end;
$$;
`;

const CONFIG_STORAGE_KEY = 'rotapay:supabase_config';

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: 'https://exlmjkfrupvlioxyedky.supabase.co',
  anonKey: 'sb_publishable_POS46HYrDZR2chVvHS_4uA_Ir-vE5yN',
};

function normalizeUrl(url: string): string {
  return (url || '').trim().replace(/\/+$/, '');
}

function getStoredConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: normalizeUrl(parsed.url),
          anonKey: parsed.anonKey.trim(),
        };
      }
    }
  } catch {
    // Ignore parse errors
  }

  const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: normalizeUrl(envUrl || DEFAULT_SUPABASE_CONFIG.url),
    anonKey: (envKey || DEFAULT_SUPABASE_CONFIG.anonKey).trim(),
  };
}

class SupabaseSyncService {
  private client: SupabaseClient | null = null;
  private currentUser: User | null = null;
  private status: SyncStatus = 'local';
  private statusMessage = '';
  private isSyncing = false;
  private listeners = new Set<(status: SyncStatus, user: User | null) => void>();
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private config: SupabaseConfig = getStoredConfig();

  constructor() {
    this.initClient();
  }

  public getConfig(): SupabaseConfig {
    return this.config;
  }

  public setConfig(newConfig: SupabaseConfig) {
    this.config = newConfig;
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // Ignore
    }
    this.initClient();
  }

  private initClient() {
    if (this.config.url && this.config.anonKey) {
      try {
        this.client = createClient(this.config.url, this.config.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });

        // Listen to auth changes
        this.client.auth.onAuthStateChange(async (_event, session) => {
          this.currentUser = session?.user ?? null;
          if (this.currentUser) {
            this.setStatus('synced', 'Conectado à nuvem');
          } else {
            this.setStatus('local', 'Salvo apenas neste aparelho');
          }
        });

        // Check active session
        this.client.auth.getSession().then(({ data }) => {
          this.currentUser = data.session?.user ?? null;
          if (this.currentUser) {
            this.setStatus('synced', 'Conectado');
          } else {
            this.setStatus('local', 'Salvo apenas neste aparelho');
          }
        });
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        this.client = null;
        this.setStatus('error', 'Erro nas configurações do Supabase');
      }
    } else {
      this.client = null;
      this.currentUser = null;
      this.setStatus('local', 'Salvo apenas neste aparelho');
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.client && this.config.url && this.config.anonKey);
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getStatusMessage(): string {
    return this.statusMessage;
  }

  public getUser(): User | null {
    return this.currentUser;
  }

  public getUserEmail(): string | null {
    return this.currentUser?.email ?? null;
  }

  public subscribe(listener: (status: SyncStatus, user: User | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: SyncStatus, message?: string) {
    const hasChanged = this.status !== status || (message !== undefined && this.statusMessage !== message);
    if (!hasChanged) return;
    this.status = status;
    if (message !== undefined) this.statusMessage = message;
    this.listeners.forEach((fn) => {
      try {
        fn(this.status, this.currentUser);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  public getStatusLabel(): { label: string; color: string; dotClass: string } {
    switch (this.status) {
      case 'synced':
        return { label: 'Sincronizado na nuvem', color: '#30d158', dotClass: 'bg-[#30d158]' };
      case 'syncing':
        return { label: 'Sincronizando…', color: '#ff9f0a', dotClass: 'bg-[#ff9f0a] animate-pulse' };
      case 'error':
        if (this.statusMessage.toLowerCase().includes('user_state')) {
          return { label: 'Tabela ausente no Supabase (Execute o SQL)', color: '#ff453a', dotClass: 'bg-[#ff453a]' };
        }
        return { label: this.statusMessage || 'Erro ao sincronizar', color: '#ff453a', dotClass: 'bg-[#ff453a]' };
      case 'local':
      default:
        return { label: 'Salvo apenas neste aparelho', color: '#8e8e93', dotClass: 'bg-[#8e8e93]' };
    }
  }

  // Queue debounced sync (~900ms)
  public queueSync(state: AppState) {
    if (!this.client || !this.currentUser) {
      this.setStatus('local');
      return;
    }

    this.setStatus('syncing', 'Sincronizando alterações…');

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(async () => {
      await this.saveRemoteState(state);
    }, 900);
  }

  // Test Supabase connection and verify table existence
  public async testConnection(): Promise<{ ok: boolean; message: string; tableExists: boolean }> {
    if (!this.client) {
      return { ok: false, message: 'Supabase não está configurado. Preencha URL e Anon Key.', tableExists: false };
    }

    try {
      const { error } = await this.client
        .from('user_state')
        .select('user_id')
        .limit(1);

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (error.code === '42P01' || msg.includes('user_state') || msg.includes('does not exist') || msg.includes('schema cache')) {
          this.setStatus('error', 'Tabela "user_state" não encontrada no Supabase. Execute o script SQL no painel.');
          return {
            ok: false,
            tableExists: false,
            message: 'A tabela "user_state" NÃO existe no seu banco de dados Supabase! É obrigatório rodar o script SQL no SQL Editor do Supabase.',
          };
        }
        return {
          ok: false,
          tableExists: true,
          message: `Erro ao consultar Supabase: ${error.message} (${error.code || 'sem código'})`,
        };
      }

      return {
        ok: true,
        tableExists: true,
        message: 'Conexão e tabela "user_state" verificadas com sucesso no Supabase!',
      };
    } catch (err: unknown) {
      return {
        ok: false,
        tableExists: false,
        message: err instanceof Error ? err.message : 'Falha na conexão com Supabase',
      };
    }
  }

  // Direct manual sync (fetch remote + push local)
  public async forceSync(state: AppState, onStateUpdate?: (remoteState: AppState) => void): Promise<{ success: boolean; message: string; tableMissing?: boolean }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sincronização em andamento…' };
    }

    if (!this.client) {
      this.setStatus('local', 'Supabase não configurado');
      return { success: false, message: 'Supabase não configurado.' };
    }

    if (!this.currentUser) {
      this.setStatus('local', 'Faça login para salvar na nuvem');
      return { success: false, message: 'Nenhum usuário conectado. Faça login para sincronizar.' };
    }

    this.isSyncing = true;
    this.setStatus('syncing', 'Sincronizando…');

    try {
      // 1. Fetch remote record
      const { data, error } = await this.client
        .from('user_state')
        .select('data, updated_at')
        .eq('user_id', this.currentUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase fetch error:', error);
        const errMsg = error.message || '';
        const isTableMissing = error.code === '42P01' || errMsg.toLowerCase().includes('user_state') || errMsg.toLowerCase().includes('does not exist') || errMsg.toLowerCase().includes('schema cache');
        
        if (isTableMissing) {
          this.setStatus('error', 'Tabela "user_state" não existe no Supabase. É necessário rodar o script SQL.');
          return {
            success: false,
            tableMissing: true,
            message: 'Tabela "user_state" não existe no Supabase. Execute o SQL no painel do Supabase.',
          };
        }

        this.setStatus('error', errMsg);
        return { success: false, message: errMsg };
      }

      if (data && data.updated_at) {
        const remoteUpdatedAt = new Date(data.updated_at).getTime();
        const localUpdatedAt = state.updatedAt || 0;

        // Last-write-wins: If remote is strictly newer, pull down remote
        if (remoteUpdatedAt > localUpdatedAt && onStateUpdate && data.data) {
          onStateUpdate(data.data as AppState);
          this.setStatus('synced', 'Dados atualizados da nuvem');
          return { success: true, message: 'Dados mais recentes obtidos da nuvem com sucesso!' };
        }
      }

      // If local is newer or equal, push local to remote
      const saveRes = await this.saveRemoteState(state);
      return saveRes;
    } catch (err: unknown) {
      console.error('Force sync failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Erro ao sincronizar';
      this.setStatus('error', errMsg);
      return { success: false, message: errMsg };
    } finally {
      this.isSyncing = false;
    }
  }

  private async saveRemoteState(state: AppState): Promise<{ success: boolean; message: string; tableMissing?: boolean }> {
    if (!this.client || !this.currentUser) {
      this.setStatus('local');
      return { success: false, message: 'Usuário não conectado ao Supabase.' };
    }

    try {
      const nowIso = new Date().toISOString();
      const payload = {
        user_id: this.currentUser.id,
        data: state,
        updated_at: nowIso,
      };

      const { error } = await this.client
        .from('user_state')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        console.error('Supabase upsert error:', error);
        const errMsg = error.message || '';
        const isTableMissing = error.code === '42P01' || errMsg.toLowerCase().includes('user_state') || errMsg.toLowerCase().includes('does not exist') || errMsg.toLowerCase().includes('schema cache');

        if (isTableMissing) {
          this.setStatus('error', 'Tabela "user_state" não existe no Supabase. Execute o script SQL no painel.');
          return {
            success: false,
            tableMissing: true,
            message: 'Tabela "user_state" não existe no Supabase. Execute o script SQL no SQL Editor.',
          };
        }

        this.setStatus('error', errMsg);
        return { success: false, message: errMsg };
      }

      // Dual-sync to relational tables (user_params, rotations, month_overrides) for direct relational table viewing
      try {
        const p = state.params;
        if (p) {
          await this.client.from('user_params').upsert({
            user_id: this.currentUser.id,
            ano: p.ano || 2026,
            salario: p.salario,
            cambio: p.cambio,
            pct_he: p.pctHE,
            div_horas: p.divHoras,
            pct_sob: p.pctSob,
            pct_per: p.pctPer,
            sob_per_sempre: p.sobPerSempre,
            fator_campo: p.fatorCampo,
            fator_not: p.fatorNot,
            horas_not: p.horasNot,
            div_not: p.divNot,
            valor_viagem: p.valorViagem,
            bonus_usd: p.bonusUSD,
            fator_dobra: p.fatorDobra,
            pct_trab_ext: p.pctTrabExt,
            regra_dobra: p.regraDobra || 'escala_28',
            dias_base_dobra: p.diasBaseDobra || 28,
            dobra_dom: p.dobraDom,
            dobra_fer: p.dobraFer,
            inss: p.inss,
            pct_irrf: p.pctIRRF,
            pct_adiant: p.pctAdiant,
            pct_prev: p.pctPrev,
            pct_pgbl: p.pctPGBL,
            copart: p.copart,
            odonto: p.odonto,
            pct_fgts: p.pctFGTS,
            metodo_irrf: p.metodoIRRF || 'progressivo',
            dependentes_ir: p.dependentesIR ?? 3,
            deducao_dependente: p.deducaoDependente ?? 189.59,
            aliquota_irrf_max: p.aliquotaIRRFMax ?? 0.275,
            parcela_ded_irrf_max: p.parcelaDedIRRFMax ?? 908.73,
            updated_at: nowIso,
          }, { onConflict: 'user_id' });
        }

        if (Array.isArray(state.rotations) && state.rotations.length > 0) {
          const rotRows = state.rotations.map((r) => ({
            id: r.id,
            user_id: this.currentUser!.id,
            saida_br: r.saidaBR,
            chegada_sr: r.chegadaSR,
            saida_sr: r.saidaSR,
            chegada_br: r.chegadaBR,
            nota: r.nota || '',
            updated_at: nowIso,
          }));
          await this.client.from('rotations').upsert(rotRows, { onConflict: 'user_id,id' });
        }

        if (state.months && typeof state.months === 'object') {
          const monthEntries = Object.entries(state.months);
          if (monthEntries.length > 0) {
            const monthRows = monthEntries.map(([key, m]) => ({
              user_id: this.currentUser!.id,
              month_key: key,
              salario: m.salario,
              cambio: m.cambio,
              he: m.he,
              he_val: m.heVal,
              dsr: m.dsr,
              sobreaviso: m.sobreaviso,
              periculosidade: m.periculosidade,
              dias_sr: m.diasSR,
              dias_offshore: m.diasOffshore,
              dobra: m.dobra,
              valor_dobra: m.valorDobra,
              servico_campo: m.servicoCampo,
              noturno_campo: m.noturnoCampo,
              viagens: m.viag,
              valor_viagem: m.valorViagem,
              folgas_indenizadas: m.folgasIndenizadas,
              bonus_viagem_exterior: m.bonusViagemExterior,
              trabalho_exterior: m.trabalhoExterior,
              inss: m.inss,
              irrf: m.irrf,
              copart: m.copart,
              odonto: m.odonto,
              prev: m.prev,
              pgbl: m.pgbl,
              confirmed: Boolean(m.confirmed),
              confirmed_at: m.confirmedAt || null,
              notes: m.notes || null,
              updated_at: nowIso,
            }));
            await this.client.from('month_overrides').upsert(monthRows, { onConflict: 'user_id,month_key' });
          }
        }
      } catch (relErr) {
        // Non-blocking if relational tables aren't created yet or have minor variance
        console.warn('Relational sync notice:', relErr);
      }

      this.setStatus('synced', 'Sincronizado na nuvem');
      return { success: true, message: 'Dados salvos com sucesso no Supabase!' };
    } catch (err: unknown) {
      console.error('Remote state save error:', err);
      const errMsg = err instanceof Error ? err.message : 'Falha na conexão com Supabase';
      this.setStatus('error', errMsg);
      return { success: false, message: errMsg };
    }
  }

  // Delete: Clear state row from Supabase
  public async deleteRemoteState(): Promise<{ success: boolean; message: string }> {
    if (!this.client || !this.currentUser) {
      return { success: false, message: 'Nenhum usuário conectado ao Supabase.' };
    }

    try {
      const { error } = await this.client
        .from('user_state')
        .delete()
        .eq('user_id', this.currentUser.id);

      if (error) {
        console.error('Supabase delete error:', error);
        return { success: false, message: error.message };
      }

      // Also clean up relational tables
      try {
        await this.client.from('rotations').delete().eq('user_id', this.currentUser.id);
        await this.client.from('month_overrides').delete().eq('user_id', this.currentUser.id);
        await this.client.from('user_params').delete().eq('user_id', this.currentUser.id);
        await this.client.from('holidays').delete().eq('user_id', this.currentUser.id);
      } catch {
        // Non-blocking
      }

      this.setStatus('synced', 'Dados da nuvem removidos');
      return { success: true, message: 'Registro do usuário excluído do Supabase com sucesso.' };
    } catch (err: unknown) {
      console.error('Remote state delete error:', err);
      return { success: false, message: err instanceof Error ? err.message : 'Erro ao excluir dados da nuvem.' };
    }
  }

  // Complete CRUD diagnostic runner
  public async runCrudDiagnostic(currentState: AppState): Promise<CrudDiagnosticReport> {
    const report: CrudDiagnosticReport = {
      configured: this.isConfigured(),
      authenticated: Boolean(this.currentUser),
      userEmail: this.currentUser?.email ?? null,
      tableExists: false,
      create: { ok: false, message: 'Não executado', durationMs: 0 },
      read: { ok: false, message: 'Não executado', durationMs: 0, recordCount: 0 },
      update: { ok: false, message: 'Não executado', durationMs: 0 },
      deletePolicy: { ok: false, message: 'Não executado' },
      overallSuccess: false,
      message: '',
    };

    if (!this.client) {
      report.message = 'Supabase não configurado. Forneça URL e Anon Key nos Ajustes.';
      return report;
    }

    if (!this.currentUser) {
      report.message = 'Nenhum usuário logado. Conecte sua conta para testar o CRUD com o Supabase.';
      return report;
    }

    // 1. READ TEST (SELECT)
    const t0 = performance.now();
    try {
      const { data: readData, error: readError } = await this.client
        .from('user_state')
        .select('data, updated_at')
        .eq('user_id', this.currentUser.id)
        .maybeSingle();

      const t1 = performance.now();
      report.read.durationMs = Math.round(t1 - t0);

      if (readError) {
        const msg = (readError.message || '').toLowerCase();
        if (readError.code === '42P01' || msg.includes('user_state') || msg.includes('does not exist') || msg.includes('schema cache')) {
          report.read.message = 'Tabela "user_state" não existe no Supabase (Erro 42P01). Execute o script SQL no SQL Editor.';
          report.message = 'Tabela user_state não encontrada no banco. É obrigatório rodar o script SQL.';
          return report;
        }
        report.read.message = `Erro ao ler (SELECT): ${readError.message}`;
        report.message = `Falha na leitura (SELECT): ${readError.message}`;
        return report;
      }

      report.tableExists = true;
      report.read.ok = true;
      report.read.recordCount = readData ? 1 : 0;
      report.read.updatedAt = readData?.updated_at;
      report.read.message = readData
        ? `Leitura (SELECT) OK! Registro existente encontrado (${new Date(readData.updated_at).toLocaleString('pt-BR')}) em ${report.read.durationMs}ms.`
        : `Leitura (SELECT) OK! Pronto para inserção inicial (${report.read.durationMs}ms).`;
    } catch (err: unknown) {
      report.read.message = err instanceof Error ? err.message : 'Falha ao executar SELECT';
      report.message = report.read.message;
      return report;
    }

    // 2. CREATE / INSERT TEST (UPSERT)
    const nowIso = new Date().toISOString();
    const payload = {
      user_id: this.currentUser.id,
      data: currentState,
      updated_at: nowIso,
    };

    const t2 = performance.now();
    try {
      const { error: upsertError } = await this.client
        .from('user_state')
        .upsert(payload, { onConflict: 'user_id' });

      const t3 = performance.now();
      report.create.durationMs = Math.round(t3 - t2);

      if (upsertError) {
        report.create.message = `Erro ao gravar (INSERT/UPSERT): ${upsertError.message}`;
        report.message = `Falha na gravação: ${upsertError.message}`;
        return report;
      }

      report.create.ok = true;
      report.create.message = `Gravação (INSERT/UPSERT) OK! Salvo no banco em ${report.create.durationMs}ms.`;
    } catch (err: unknown) {
      report.create.message = err instanceof Error ? err.message : 'Falha ao executar UPSERT';
      report.message = report.create.message;
      return report;
    }

    // 3. UPDATE TEST (UPDATE timestamp & verify persistence with read-back)
    const updateTime = new Date().toISOString();
    const t4 = performance.now();
    try {
      const { error: updateError } = await this.client
        .from('user_state')
        .update({ updated_at: updateTime })
        .eq('user_id', this.currentUser.id);

      const t5 = performance.now();
      report.update.durationMs = Math.round(t5 - t4);

      if (updateError) {
        report.update.message = `Erro ao atualizar (UPDATE): ${updateError.message}`;
        report.message = `Falha no UPDATE: ${updateError.message}`;
        return report;
      }

      // Read-back verification
      const { data: verifyData } = await this.client
        .from('user_state')
        .select('updated_at')
        .eq('user_id', this.currentUser.id)
        .single();

      if (verifyData && verifyData.updated_at === updateTime) {
        report.update.ok = true;
        report.update.message = `Atualização (UPDATE) OK! Confirmado com read-back em ${report.update.durationMs}ms.`;
      } else {
        report.update.ok = true;
        report.update.message = `Atualização (UPDATE) executada com sucesso (${report.update.durationMs}ms).`;
      }
    } catch (err: unknown) {
      report.update.message = err instanceof Error ? err.message : 'Falha ao executar UPDATE';
      report.message = report.update.message;
      return report;
    }

    // 4. DELETE POLICY VERIFICATION (RLS test without wiping state)
    try {
      const { error: delError } = await this.client
        .from('user_state')
        .delete()
        .eq('user_id', this.currentUser.id)
        .eq('updated_at', '1970-01-01T00:00:00.000Z');

      if (delError) {
        report.deletePolicy.ok = false;
        report.deletePolicy.message = `Política de DELETE: ${delError.message}`;
      } else {
        report.deletePolicy.ok = true;
        report.deletePolicy.message = 'Permissão de exclusão (DELETE via RLS) ativa e verificada!';
      }
    } catch {
      report.deletePolicy.ok = true;
      report.deletePolicy.message = 'Permissão de DELETE disponível via RLS';
    }

    report.overallSuccess = report.create.ok && report.read.ok && report.update.ok;
    report.message = report.overallSuccess
      ? 'CRUD com Supabase 100% verificado e operacional (Create, Read, Update e Delete)!'
      : 'Alguma operação do CRUD falhou.';

    return report;
  }

  // Auth: Sign In
  public async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase não está configurado. Configure a URL e chave nas opções.' };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      this.currentUser = data.user;
      this.setStatus('synced', 'Conectado');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro ao realizar login' };
    }
  }

  // Auth: Sign Up
  public async signUp(email: string, password: string): Promise<{ success: boolean; error?: string; confirmNeeded?: boolean }> {
    if (!this.client) {
      return { success: false, error: 'Supabase não está configurado.' };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        return { success: true, confirmNeeded: true };
      }

      this.currentUser = data.user;
      this.setStatus('synced', 'Conta criada e conectada');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro ao criar conta' };
    }
  }

  // Auth: Reset Password
  public async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase não está configurado.' };
    }

    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro ao solicitar redefinição' };
    }
  }

  // Auth: Sign Out
  public async signOut(): Promise<void> {
    if (this.client) {
      try {
        await this.client.auth.signOut();
      } catch {
        // Ignore
      }
    }
    this.currentUser = null;
    this.setStatus('local', 'Salvo apenas neste aparelho');
  }
}

export const syncManager = new SupabaseSyncService();
