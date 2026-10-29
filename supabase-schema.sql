-- ==============================================================================
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

-- ==============================================================================
-- 1. TABELA UNIFICADA: user_state (Cache JSONB para Sincronização em Tempo Real)
-- ==============================================================================
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

create policy "Users can select own state"
  on public.user_state for select
  using (auth.uid() = user_id);

create policy "Users can insert own state"
  on public.user_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update own state"
  on public.user_state for update
  using (auth.uid() = user_id);

create policy "Users can delete own state"
  on public.user_state for delete
  using (auth.uid() = user_id);

create index if not exists idx_user_state_updated_at on public.user_state(updated_at);
comment on table public.user_state is 'Armazena o estado completo do aplicativo (JSONB) sincronizado com o frontend';


-- ==============================================================================
-- 2. TABELA RELACIONAL: user_profiles
-- ==============================================================================
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

create policy "Users can select own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "Users can delete own profile"
  on public.user_profiles for delete
  using (auth.uid() = id);


-- ==============================================================================
-- 3. TABELA RELACIONAL: user_params (Configurações e Parâmetros de Cálculo)
-- ==============================================================================
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

create policy "Users can select own params"
  on public.user_params for select
  using (auth.uid() = user_id);

create policy "Users can insert own params"
  on public.user_params for insert
  with check (auth.uid() = user_id);

create policy "Users can update own params"
  on public.user_params for update
  using (auth.uid() = user_id);

create policy "Users can delete own params"
  on public.user_params for delete
  using (auth.uid() = user_id);


-- ==============================================================================
-- 4. TABELA RELACIONAL: rotations (Rotações e Embarques Offshore)
-- ==============================================================================
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

create policy "Users can select own rotations"
  on public.rotations for select
  using (auth.uid() = user_id);

create policy "Users can insert own rotations"
  on public.rotations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own rotations"
  on public.rotations for update
  using (auth.uid() = user_id);

create policy "Users can delete own rotations"
  on public.rotations for delete
  using (auth.uid() = user_id);

create index if not exists idx_rotations_dates on public.rotations(user_id, chegada_sr, saida_sr);


-- ==============================================================================
-- 5. TABELA RELACIONAL: month_overrides (Holerites e Fechamentos Mensais)
-- ==============================================================================
create table if not exists public.month_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null, -- formato 'YYYY-MM', ex: '2026-09'
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

create policy "Users can select own month_overrides"
  on public.month_overrides for select
  using (auth.uid() = user_id);

create policy "Users can insert own month_overrides"
  on public.month_overrides for insert
  with check (auth.uid() = user_id);

create policy "Users can update own month_overrides"
  on public.month_overrides for update
  using (auth.uid() = user_id);

create policy "Users can delete own month_overrides"
  on public.month_overrides for delete
  using (auth.uid() = user_id);


-- ==============================================================================
-- 6. TABELA RELACIONAL: holidays (Calendário de Feriados)
-- ==============================================================================
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

create policy "Users can select own holidays"
  on public.holidays for select
  using (auth.uid() = user_id);

create policy "Users can insert own holidays"
  on public.holidays for insert
  with check (auth.uid() = user_id);

create policy "Users can update own holidays"
  on public.holidays for update
  using (auth.uid() = user_id);

create policy "Users can delete own holidays"
  on public.holidays for delete
  using (auth.uid() = user_id);


-- ==============================================================================
-- 7. FUNÇÃO DE CARGA INICIAL: seed_user_data_2026 (Popula Dados Padrão de 2026)
-- ==============================================================================
create or replace function public.seed_user_data_2026(target_user_id uuid)
returns void as $$
declare
  v_user_email text;
begin
  -- Busca email do usuário em auth.users
  select email into v_user_email from auth.users where id = target_user_id;

  -- 1. Perfil
  insert into public.user_profiles (id, email, full_name, company)
  values (target_user_id, v_user_email, 'Thiago Faria', 'TechnipFMC')
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

  -- 2. Parâmetros 2026
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
  )
  on conflict (user_id) do update
  set updated_at = now();

  -- 3. Feriados Nacionais 2026
  insert into public.holidays (user_id, date, name, is_national)
  values
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

  -- 4. Rotações 2026 (Escala 28x28 + Período Real Set/Out 2026)
  insert into public.rotations (id, user_id, saida_br, chegada_sr, saida_sr, chegada_br, nota)
  values
    ('rot-2026-1', target_user_id, '2026-01-13', '2026-01-14', '2026-02-11', '2026-02-12', 'Escala 28×28 · Rotação 1'),
    ('rot-2026-2', target_user_id, '2026-03-10', '2026-03-11', '2026-04-08', '2026-04-09', 'Escala 28×28 · Rotação 2'),
    ('rot-2026-3', target_user_id, '2026-05-05', '2026-05-06', '2026-06-03', '2026-06-04', 'Escala 28×28 · Rotação 3'),
    ('rot-2026-4', target_user_id, '2026-07-07', '2026-07-08', '2026-08-05', '2026-08-06', 'Escala 28×28 · Rotação 4'),
    ('rot-2026-5', target_user_id, '2026-09-23', '2026-09-24', '2026-10-30', '2026-10-31', 'Rotação Holerites Reais (Set/Out 2026) · TechnipFMC'),
    ('rot-2026-6', target_user_id, '2026-11-24', '2026-11-25', '2026-12-23', '2026-12-24', 'Escala 28×28 · Rotação 6')
  on conflict (user_id, id) do update
  set saida_br = excluded.saida_br,
      chegada_sr = excluded.chegada_sr,
      saida_sr = excluded.saida_sr,
      chegada_br = excluded.chegada_br,
      nota = excluded.nota,
      updated_at = now();

  -- 5. Holerites Reais Importados (Setembro/2026 e Outubro/2026 - TechnipFMC)
  insert into public.month_overrides (
    user_id, month_key, salario, cambio, he, he_val, dsr, sobreaviso,
    periculosidade, dias_sr, dias_offshore, dobra, valor_dobra,
    servico_campo, noturno_campo, viagens, valor_viagem, folgas_indenizadas,
    bonus_viagem_exterior, trabalho_exterior, inss, irrf, copart,
    odonto, prev, pgbl, confirmed, confirmed_at, notes
  ) values
    (
      target_user_id, '2026-09', 14395.77, 5.152714, 8.80, 921.40, 184.28, 575.83,
      4318.73, 7, 6, 0.00, 0.00,
      1075.38, 1259.58, 1, 172.75, 3598.94,
      1803.45, 839.75, 988.07, 6599.07, 54.18,
      124.00, 0.00, 287.92, true, '2026-09-30 23:59:59+00', 'Recibo Pagto 09/2026 · TechnipFMC (Thiago Faria)'
    ),
    (
      target_user_id, '2026-10', 14395.77, 5.027700, 6.88, 720.36, 138.53, 2879.15,
      4318.73, 30, 30, 8.00, 17743.20,
      5376.90, 6297.90, 0, 0.00, 0.00,
      7541.55, 3598.94, 988.07, 15911.99, 0.00,
      124.00, 0.00, 287.92, true, '2026-10-31 23:59:59+00', 'Recibo Pagto 10/2026 · TechnipFMC (Thiago Faria)'
    )
  on conflict (user_id, month_key) do update
  set salario = excluded.salario,
      cambio = excluded.cambio,
      he = excluded.he,
      he_val = excluded.he_val,
      dsr = excluded.dsr,
      sobreaviso = excluded.sobreaviso,
      periculosidade = excluded.periculosidade,
      dias_sr = excluded.dias_sr,
      dias_offshore = excluded.dias_offshore,
      dobra = excluded.dobra,
      valor_dobra = excluded.valor_dobra,
      servico_campo = excluded.servico_campo,
      noturno_campo = excluded.noturno_campo,
      valor_viagem = excluded.valor_viagem,
      folgas_indenizadas = excluded.folgas_indenizadas,
      bonus_viagem_exterior = excluded.bonus_viagem_exterior,
      trabalho_exterior = excluded.trabalho_exterior,
      inss = excluded.inss,
      irrf = excluded.irrf,
      copart = excluded.copart,
      odonto = excluded.odonto,
      prev = excluded.prev,
      pgbl = excluded.pgbl,
      confirmed = excluded.confirmed,
      confirmed_at = excluded.confirmed_at,
      notes = excluded.notes,
      updated_at = now();

  -- 6. Tabela Unificada user_state (JSONB completo pronto para o Frontend)
  insert into public.user_state (user_id, data, updated_at)
  values (
    target_user_id,
    jsonb_build_object(
      'params', jsonb_build_object(
        'ano', 2026,
        'salario', 14395.77,
        'cambio', 5.45,
        'pctHE', 0.60,
        'divHoras', 220,
        'pctSob', 0.20,
        'pctPer', 0.30,
        'sobPerSempre', true,
        'fatorCampo', 0.249,
        'fatorNot', 0.25,
        'horasNot', 7,
        'divNot', 180,
        'valorViagem', 345.50,
        'bonusUSD', 50,
        'fatorDobra', 0.15406,
        'pctTrabExt', 0.25,
        'regraDobra', 'escala_28',
        'diasBaseDobra', 28,
        'dobraDom', false,
        'dobraFer', false,
        'inss', 988.09,
        'pctIRRF', 0.1754,
        'pctAdiant', 0.40,
        'pctPrev', 0.02,
        'pctPGBL', 0.02,
        'copart', 26.30,
        'odonto', 136.00,
        'pctFGTS', 0.08,
        'metodoIRRF', 'progressivo',
        'dependentesIR', 3,
        'deducaoDependente', 189.59,
        'aliquotaIRRFMax', 0.275,
        'parcelaDedIRRFMax', 908.73
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
          'salario', 14395.77,
          'cambio', 5.152714,
          'he', 8.80,
          'heVal', 921.40,
          'dsr', 184.28,
          'sobreaviso', 575.83,
          'periculosidade', 4318.73,
          'diasSR', 7,
          'diasOffshore', 6,
          'dobra', 0,
          'valorDobra', 0,
          'servicoCampo', 1075.38,
          'noturnoCampo', 1259.58,
          'valorViagem', 172.75,
          'folgasIndenizadas', 3598.94,
          'bonusViagemExterior', 1803.45,
          'trabalhoExterior', 839.75,
          'inss', 988.07,
          'irrf', 6599.07,
          'copart', 54.18,
          'odonto', 124.00,
          'prev', 0,
          'pgbl', 287.92,
          'confirmed', true,
          'confirmedAt', '2026-09-30T23:59:59.000Z',
          'notes', 'Recibo Pagto 09/2026 · TechnipFMC (Thiago Faria)'
        ),
        '2026-10', jsonb_build_object(
          'salario', 14395.77,
          'cambio', 5.0277,
          'he', 6.88,
          'heVal', 720.36,
          'dsr', 138.53,
          'sobreaviso', 2879.15,
          'periculosidade', 4318.73,
          'diasSR', 30,
          'diasOffshore', 30,
          'dobra', 8,
          'valorDobra', 17743.20,
          'servicoCampo', 5376.90,
          'noturnoCampo', 6297.90,
          'valorViagem', 0,
          'bonusViagemExterior', 7541.55,
          'trabalhoExterior', 3598.94,
          'inss', 988.07,
          'irrf', 15911.99,
          'copart', 0,
          'odonto', 124.00,
          'prev', 0,
          'pgbl', 287.92,
          'confirmed', true,
          'confirmedAt', '2026-10-31T23:59:59.000Z',
          'notes', 'Recibo Pagto 10/2026 · TechnipFMC (Thiago Faria)'
        )
      ),
      'updatedAt', floor(extract(epoch from now()) * 1000)
    ),
    now()
  )
  on conflict (user_id) do update
  set data = excluded.data,
      updated_at = now();

end;
$$ language plpgsql security definer;


-- ==============================================================================
-- 8. GATILHO AUTOMÁTICO: Popula novos usuários criados no Supabase Auth
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  perform public.seed_user_data_2026(new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Remove gatilho anterior se existir
drop trigger if exists on_auth_user_created on auth.users;

-- Cria gatilho para novos cadastros
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ==============================================================================
-- 9. EXECUÇÃO PARA USUÁRIOS JÁ EXISTENTES
-- ==============================================================================
-- Se você já criou usuários no Auth antes de rodar este script,
-- a instrução abaixo garante que todos eles recebam a carga inicial de dados:
do $$
declare
  u record;
begin
  for u in select id from auth.users loop
    perform public.seed_user_data_2026(u.id);
  end loop;
end;
$$;

-- FIM DO SCRIPT
