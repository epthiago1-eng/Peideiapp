# Banco de Dados Completo no Supabase: Tabelas Relacionais & Carga Inicial 2026

Plano de arquitetura e script SQL integral para provisionar **todas as tabelas necessárias** no Supabase (tabela unificada `user_state` e tabelas relacionais `rotations`, `month_overrides`, `user_params`, `holidays` e `user_profiles`), com políticas RLS completas e carga automática dos dados de 2026 (holerites de Setembro e Outubro/2026 e rotações 1 a 6).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões confirmadas:**
> - **Estrutura Híbrida (Unificada + Relacional)**: O script criará tanto a tabela unificada `user_state` (utilizada pelo app para sincronização em tempo real de latência ultrabaixa com JSONB) quanto todas as **tabelas relacionais individuais** (`rotations`, `month_overrides`, `user_params`, `holidays`, `user_profiles`).
> - **Carga Inicial com Dados Oficiais de 2026**: O script inclui uma função de carga inicial que popula automaticamente as 6 rotações do ano, os feriados nacionais de 2026 e os valores exatos dos holerites reais de Setembro/2026 (R$ 29.145,86) e Outubro/2026 (R$ 63.011,03).
> - **Segurança por Linha (RLS)**: Todas as 6 tabelas contam com políticas estritas de isolamento por usuário (`auth.uid() = user_id`).

---

## 1. Overview & Diagrama do Modelo de Dados

```
                 auth.users (Supabase Auth)
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │ user_state  │  │ user_params │  │  profiles   │
     │  (JSONB)    │  │ (Parâmetros)│  │ (Metadados) │
     └─────────────┘  └─────────────┘  └─────────────┘
            │                │
            ▼                ▼
     ┌─────────────┐  ┌──────────────────┐
     │  rotations  │  │ month_overrides  │
     │  (Escalas)  │  │ (Holerites/Mês)  │
     └─────────────┘  └──────────────────┘
            │
            ▼
     ┌─────────────┐
     │  holidays   │
     │ (Feriados)  │
     └─────────────┘
```

---

## 2. Script SQL Completo (Todas as Tabelas + RLS + Carga Inicial)

O script a seguir contém a definição de todas as tabelas e pode ser executado diretamente no **SQL Editor** do Supabase:

```sql
-- ==============================================================================
-- ROTAPAY - ESQUEMA COMPLETO DE BANCO DE DADOS (SUPABASE POSTGRESQL)
-- Criação de todas as tabelas necessárias + RLS + Carga Inicial de 2026
-- ==============================================================================

-- 1. TABELA UNIFICADA DE ESTADO (Para sincronização em tempo real)
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2. TABELA DE PERFIL DE USUÁRIO
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nome text,
  created_at timestamptz not null default now()
);

-- 3. TABELA DE PARÂMETROS GERAIS DO USUÁRIO
create table if not exists public.user_params (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ano integer not null default 2026,
  salario numeric(12, 2) not null default 14395.77,
  cambio numeric(10, 6) not null default 5.45,
  pct_he numeric(5, 4) not null default 0.60,
  div_horas integer not null default 220,
  pct_sob numeric(5, 4) not null default 0.20,
  pct_per numeric(5, 4) not null default 0.30,
  sob_per_sempre boolean not null default true,
  fator_campo numeric(6, 4) not null default 0.2490,
  fator_not numeric(6, 4) not null default 0.2500,
  horas_not integer not null default 7,
  div_not integer not null default 180,
  valor_viagem numeric(10, 2) not null default 345.50,
  bonus_usd numeric(10, 2) not null default 50.00,
  fator_dobra numeric(8, 6) not null default 0.154060,
  pct_trab_ext numeric(5, 4) not null default 0.25,
  dias_base_dobra integer not null default 28,
  regra_dobra text not null default 'escala_28',
  dobra_dom boolean not null default false,
  dobra_fer boolean not null default false,
  inss numeric(10, 2) not null default 988.09,
  pct_irrf numeric(6, 4) not null default 0.1754,
  pct_adiant numeric(5, 4) not null default 0.40,
  pct_prev numeric(5, 4) not null default 0.02,
  pct_pgbl numeric(5, 4) not null default 0.02,
  copart numeric(10, 2) not null default 26.30,
  odonto numeric(10, 2) not null default 136.00,
  pct_fgts numeric(5, 4) not null default 0.08,
  dependentes_ir integer not null default 3,
  deducao_dependente numeric(10, 2) not null default 189.59,
  metodo_irrf text not null default 'progressivo',
  updated_at timestamptz not null default now()
);

-- 4. TABELA DE ROTAÇÕES (Escalas offshore)
create table if not exists public.rotations (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  saida_br date not null,
  chegada_sr date not null,
  saida_sr date not null,
  chegada_br date not null,
  nota text default '',
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- 5. TABELA DE MESES / AJUSTES INDIVIDUAIS POR MÊS
create table if not exists public.month_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  month integer not null,
  salario numeric(12, 2),
  cambio numeric(10, 6),
  he numeric(8, 2),
  he_val numeric(12, 2),
  dobra integer,
  valor_dobra numeric(12, 2),
  viag integer,
  dias_sr integer,
  dias_offshore integer,
  sobreaviso numeric(12, 2),
  periculosidade numeric(12, 2),
  servico_campo numeric(12, 2),
  noturno_campo numeric(12, 2),
  dsr numeric(12, 2),
  valor_viagem numeric(12, 2),
  bonus_viagem_exterior numeric(12, 2),
  trabalho_exterior numeric(12, 2),
  folgas_indenizadas numeric(12, 2),
  inss numeric(12, 2),
  irrf numeric(12, 2),
  copart numeric(12, 2),
  odonto numeric(12, 2),
  prev numeric(12, 2),
  pgbl numeric(12, 2),
  confirmed boolean default false,
  confirmed_at timestamptz,
  notes text,
  updated_at timestamptz not null default now(),
  primary key (user_id, year, month)
);

-- 6. TABELA DE FERIADOS
create table if not exists public.holidays (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  name text not null,
  primary key (user_id, id)
);

-- ==============================================================================
-- HABILITAÇÃO DO ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ==============================================================================
alter table public.user_state enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_params enable row level security;
alter table public.rotations enable row level security;
alter table public.month_overrides enable row level security;
alter table public.holidays enable row level security;

-- Políticas para user_state
drop policy if exists "Users can manage own state" on public.user_state;
create policy "Users can manage own state" on public.user_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Políticas para user_profiles
drop policy if exists "Users can manage own profile" on public.user_profiles;
create policy "Users can manage own profile" on public.user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Políticas para user_params
drop policy if exists "Users can manage own params" on public.user_params;
create policy "Users can manage own params" on public.user_params
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Políticas para rotations
drop policy if exists "Users can manage own rotations" on public.rotations;
create policy "Users can manage own rotations" on public.rotations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Políticas para month_overrides
drop policy if exists "Users can manage own month_overrides" on public.month_overrides;
create policy "Users can manage own month_overrides" on public.month_overrides
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Políticas para holidays
drop policy if exists "Users can manage own holidays" on public.holidays;
create policy "Users can manage own holidays" on public.holidays
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE
-- ==============================================================================
create index if not exists idx_rotations_dates on public.rotations(user_id, chegada_sr, saida_sr);
create index if not exists idx_month_overrides_lookup on public.month_overrides(user_id, year, month);
create index if not exists idx_holidays_date on public.holidays(user_id, date);
create index if not exists idx_user_state_updated_at on public.user_state(updated_at);
```

---

## 3. Carga Inicial de Dados de 2026 (Rotations, Feriados e Holerites)

Esta função opcional pode ser executada para popular automaticamente as tabelas relacionais com as rotações e os holerites oficiais de 2026 para o seu usuário:

```sql
-- Função para semear dados iniciais de 2026 para um usuário autenticado
create or replace function public.seed_user_data_2026(target_user_id uuid)
returns void as $$
begin
  -- 1. Cria ou atualiza parâmetros padrão
  insert into public.user_params (user_id, ano, salario, cambio, dias_base_dobra, regra_dobra)
  values (target_user_id, 2026, 14395.77, 5.45, 28, 'escala_28')
  on conflict (user_id) do nothing;

  -- 2. Insere as rotações oficiais de 2026
  insert into public.rotations (id, user_id, saida_br, chegada_sr, saida_sr, chegada_br, nota) values
    ('rot-2026-1', target_user_id, '2026-01-13', '2026-01-14', '2026-02-11', '2026-02-12', 'Escala 28×28 · Rotação 1'),
    ('rot-2026-2', target_user_id, '2026-03-10', '2026-03-11', '2026-04-08', '2026-04-09', 'Escala 28×28 · Rotação 2'),
    ('rot-2026-3', target_user_id, '2026-05-05', '2026-05-06', '2026-06-03', '2026-06-04', 'Escala 28×28 · Rotação 3'),
    ('rot-2026-4', target_user_id, '2026-07-07', '2026-07-08', '2026-08-05', '2026-08-06', 'Escala 28×28 · Rotação 4'),
    ('rot-2026-5', target_user_id, '2026-09-23', '2026-09-24', '2026-10-30', '2026-10-31', 'Rotação Holerites Reais (Set/Out 2026) · TechnipFMC'),
    ('rot-2026-6', target_user_id, '2026-11-24', '2026-11-25', '2026-12-23', '2026-12-24', 'Escala 28×28 · Rotação 6')
  on conflict (user_id, id) do nothing;

  -- 3. Insere os holerites reais de Setembro e Outubro de 2026
  insert into public.month_overrides (
    user_id, year, month, salario, cambio, he, he_val, dsr, sobreaviso, periculosidade,
    dias_sr, dias_offshore, dobra, valor_dobra, servico_campo, noturno_campo,
    valor_viagem, folgas_indenizadas, bonus_viagem_exterior, trabalho_exterior,
    inss, irrf, copart, odonto, prev, pgbl, confirmed, confirmed_at, notes
  ) values
    (target_user_id, 2026, 9, 14395.77, 5.152714, 8.80, 921.40, 184.28, 575.83, 4318.73,
     7, 6, 0, 0, 1075.38, 1259.58, 172.75, 3598.94, 1803.45, 839.75,
     988.07, 6599.07, 54.18, 124.00, 0, 287.92, true, '2026-09-30T23:59:59Z', 'Recibo Pagto 09/2026 · TechnipFMC'),
    (target_user_id, 2026, 10, 14395.77, 5.027700, 6.88, 720.36, 138.53, 2879.15, 4318.73,
     30, 30, 8, 17743.20, 5376.90, 6297.90, 0, 0, 7541.55, 3598.94,
     988.07, 15911.99, 0, 124.00, 0, 287.92, true, '2026-10-31T23:59:59Z', 'Recibo Pagto 10/2026 · TechnipFMC')
  on conflict (user_id, year, month) do nothing;

  -- 4. Insere os feriados nacionais de 2026
  insert into public.holidays (id, user_id, date, name) values
    ('hol-1', target_user_id, '2026-01-01', 'Confraternização Universal'),
    ('hol-2', target_user_id, '2026-04-03', 'Sexta-feira Santa'),
    ('hol-3', target_user_id, '2026-04-21', 'Tiradentes'),
    ('hol-4', target_user_id, '2026-05-01', 'Dia do Trabalho'),
    ('hol-5', target_user_id, '2026-09-07', 'Independência'),
    ('hol-6', target_user_id, '2026-10-12', 'N. Sra. Aparecida'),
    ('hol-7', target_user_id, '2026-11-02', 'Finados'),
    ('hol-8', target_user_id, '2026-11-15', 'Proclamação da República'),
    ('hol-9', target_user_id, '2026-11-20', 'Consciência Negra'),
    ('hol-10', target_user_id, '2026-12-25', 'Natal')
  on conflict (user_id, id) do nothing;
end;
$$ language plpgsql security definer;
```

---

## 4. Próximos Passos para Execução

1. Atualizar o arquivo local `supabase-schema.sql` na raiz do projeto com o script unificado e relacional completo.
2. Atualizar o visualizador de SQL na tela **Ajustes** e no **SupabaseAuthModal** para permitir copiar todo o script detalhado em um único clique.
3. Explicar como rodar no **SQL Editor** do Supabase e chamar a função `seed_user_data_2026` para o usuário logado.
