Build a complete, production-quality, mobile-first web app called **RotaPay** (React + TypeScript + Tailwind CSS, single-page app, no backend required for v1). It calculates the **estimated Brazilian payslip (holerite)** of an offshore engineer who works a **28x28 rotation in Suriname**. ALL user-facing text must be in **Brazilian Portuguese (pt-BR)**, exactly as written below. Currency must be formatted with `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` (e.g., "R$ 14.395,77").

Follow every section of this specification precisely. Do not simplify formulas, do not skip screens, do not invent extra features.

---

## 1. LOOK & FEEL (Apple iOS style – mandatory)

The app must look like a native iOS app (Apple Wallet / Health style):

- **Font stack:** `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`, antialiased, `font-variant-numeric: tabular-nums` on all money/number values.
- **Layout:** centered column, `max-width: 560px`, horizontal padding 16px, bottom padding ~96px (space for the tab bar), respects `env(safe-area-inset-*)`.
- **Light mode colors:** background `#f2f2f7`, cards `#ffffff`, secondary fill `#f7f7fa`, text `#111114`, muted text `#6e6e78`, separators `rgba(60,60,67,.12)`.
- **Dark mode** (automatic via `prefers-color-scheme: dark`): background `#000000`, cards `#1c1c1e`, secondary fill `#2c2c2e`, text `#f5f5f7`, muted `#98989f`, separators `rgba(84,84,88,.45)`, no shadows.
- **Accent colors (iOS system):** blue `#0a84ff`, indigo `#5e5ce6`, green `#30d158`, orange `#ff9f0a`, red `#ff453a`, purple `#bf5af2`, teal `#40c8e0`. "In Suriname" highlight = `rgba(10,132,255,.14)` (dark: `.28`).
- **Cards:** radius 20px, soft shadow `0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)`, inset-grouped list style (rows separated by 1px hairlines, 13–16px padding).
- **Large titles:** each screen has a small uppercase muted "eyebrow" (13px, semibold, letter-spacing .04em) above a 32px extra-bold title (letter-spacing -0.02em).
- **Section headers:** 13px uppercase muted, above each card group.
- **Round icon buttons:** 38px circles, white card background, shadow, with stroke SVG icons (inline SVG, no icon libraries required).
- **Hero card** (main screen): radius 26px, white text, gradient `linear-gradient(135deg, #0a84ff 0%, #5e5ce6 60%, #bf5af2 120%)`, glow shadow `0 12px 30px rgba(10,132,255,.35)`, decorative translucent white circle in the top-right corner. Inside: 3 mini translucent tiles (`rgba(255,255,255,.16)`, radius 14px).
- **Bottom tab bar** (fixed): frosted glass (`rgba(249,249,249,.82)` + `backdrop-filter: saturate(180%) blur(20px)`; dark: `rgba(22,22,24,.82)`), top hairline, 4 tabs with 26px stroke icons + 10px labels; active tab is blue.
- **Bottom sheets** (for forms): slide up from the bottom with a 38×5px grabber, rounded top corners 22px, dim backdrop `rgba(0,0,0,.35)`, header row with "Cancelar" (left, blue link), bold title (center), "Salvar"/"Gerar" (right, bold blue link). Close on backdrop tap and Escape key.
- **iOS toggle switches** (51×31, green when on), **steppers** (− / + buttons in blue around a number), inputs with secondary-fill background, radius 10px, right-aligned numbers, blue focus ring `0 0 0 3px rgba(10,132,255,.35)`.
- **Floating action button** (only on the Rotações tab): 58px blue circle with "+" icon, bottom-right above the tab bar, blue glow shadow.
- **Toast:** small dark pill (`rgba(30,30,32,.92)`, white text) that appears above the tab bar for ~2s ("Salvo", "Rotação adicionada", etc.).
- **Motion:** 0.25s fade/slide-up when switching tabs; sheets use `cubic-bezier(.2,.8,.2,1)` 0.32s; respect `prefers-reduced-motion`.
- **Accessibility:** labels linked to inputs, `aria-live` on the main total and error messages, visible keyboard focus, all buttons `type="button"`, minimum 320px width without horizontal scroll.

---

## 2. DATA MODEL (persist everything in localStorage, key `rotapay:local`)

```ts
type Params = {
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
  dobraDom: boolean;      // Sundays in Suriname count as "dobra"
  dobraFer: boolean;      // holidays in Suriname count as "dobra"
  inss: number; pctIRRF: number; pctAdiant: number; pctPrev: number; pctPGBL: number;
  copart: number; odonto: number; pctFGTS: number;
};
type Rotation = { id: string; saidaBR: string; chegadaSR: string; saidaSR: string; chegadaBR: string; nota: string }; // ISO dates YYYY-MM-DD
type Holiday = { date: string; name: string };
type MonthOverride = { he?: number; dobra?: number; viag?: number; cambio?: number }; // key "YYYY-M" e.g. "2026-11"
type AppState = { params: Params; holidays: Holiday[]; rotations: Rotation[]; months: Record<string, MonthOverride>; updatedAt: number };
```

**IMPORTANT – dates:** treat all dates as pure calendar days in UTC (`Date.UTC(y, m-1, d)`), never local time, to avoid timezone off-by-one bugs.

### 2.1 Pre-filled default values (use exactly)

| Param | Value |
|---|---|
| ano | 2026 |
| salario | 14395.77 |
| cambio | 5.45 |
| pctHE | 0.60 |
| divHoras | 220 |
| pctSob | 0.20 |
| pctPer | 0.30 |
| sobPerSempre | true |
| fatorCampo | 0.249 |
| fatorNot | 0.25 |
| horasNot | 7 |
| divNot | 180 |
| valorViagem | 345.50 |
| bonusUSD | 50 |
| fatorDobra | 0.15406 |
| pctTrabExt | 0.25 |
| dobraDom | true |
| dobraFer | true |
| inss | 988.09 |
| pctIRRF | 0.1754 |
| pctAdiant | 0.40 |
| pctPrev | 0.02 |
| pctPGBL | 0.02 |
| copart | 26.30 |
| odonto | 136.00 |
| pctFGTS | 0.08 |

**Default holidays (2026):**
2026-01-01 Confraternização Universal · 2026-04-03 Sexta-feira Santa · 2026-04-21 Tiradentes · 2026-05-01 Dia do Trabalho · 2026-09-07 Independência · 2026-10-12 N. Sra. Aparecida · 2026-11-02 Finados · 2026-11-15 Proclamação da República · 2026-11-20 Consciência Negra · 2026-12-25 Natal

**Default rotations:** generate with `genRotations("2026-01-13", 29, 56, "2026-12-31")` (see 3.1). The first rotation gets `nota = "Exemplo – edite com suas datas"`. This produces 7 rotations, the last one being 20/10 → 21/10 → 18/11 → 19/11.

---

## 3. CALCULATION ENGINE (put in a pure module `calc.ts`, no React)

### 3.1 Rotation generator
```
genRotations(startISO, diasSR, ciclo, endISO):
  s = start
  while s <= end (max 60 iterations):
    saidaBR = s
    chegadaSR = s + 1
    saidaSR = chegadaSR + diasSR - 1
    chegadaBR = saidaSR + 1
    push; s += ciclo
```

### 3.2 Monthly calculation `computeMonth(state, year, month)`
For every day of the month:
- `inSR` = the day is between `chegadaSR` and `saidaSR` (inclusive) of any rotation.
- `trav` = number of rotations where `saidaBR === day` plus where `saidaSR === day` (each departure = 1 trip).
- `isHol` = day is in holidays list; `sun` = Sunday.
- `dob` = inSR AND ((sun AND dobraDom) OR (isHol AND dobraFer)).
- Count: `dias` (days inSR), `dobraAuto`, `viagAuto` (sum of trav), `domingos` (Sundays in month), `uteis` (Mon–Fri that are not holidays).

Overrides for the month (`months["YYYY-M"]`), blank = automatic:
- `dobra = min(dias, override.dobra ?? dobraAuto)`
- `off = max(dias − dobra, 0)` ← "dias offshore líquidos"
- `viagens = override.viag ?? viagAuto`
- `he = override.he ?? 0`
- `cambio = override.cambio > 0 ? override.cambio : params.cambio`
- `ap = (sobPerSempre || dias > 0) ? 1 : 0`

**Earnings (Proventos)** – S = salario:
| Key | Label (pt-BR) | Formula |
|---|---|---|
| salario | Salário mensal | S |
| he | Horas extras 60% | (S / divHoras) × (1 + pctHE) × he |
| dsr | DSR horas extras | uteis > 0 ? he_value / uteis × domingos : 0 |
| sob | Adicional de sobreaviso | S × pctSob × ap |
| per | Adicional de periculosidade | S × pctPer × ap |
| campo | Adic. serviço no campo | off > 0 ? off × (fatorCampo × (S + sob + per) / 30) : 0 |
| not | Adic. noturno serv. campo | off > 0 ? off × (fatorNot × horasNot × (S + sob + per) / divNot) : 0 |
| viag | Adic. viagem com OS | viagens × valorViagem |
| bonus | Bônus viagem exterior | **dias** (total, NOT minus dobra) × cambio × bonusUSD |
| dobra | Valor total em dobra | dobra × S × fatorDobra |
| trab | Adic. trabalho no exterior | (S / 30) × pctTrabExt × **dias** |

`prov` = sum of all earnings.

**Deductions (Descontos):**
| Key | Label | Formula |
|---|---|---|
| inss | INSS | inss |
| irrf | IRRF (estimado) | prov × pctIRRF |
| adiant | Adiantamento quinzenal | S × pctAdiant |
| prev | Previdência privada básica | S × pctPrev |
| pgbl | PGBL empregado | S × pctPGBL |
| copart | Co-participação médica | copart |
| odonto | Assistência odontológica | odonto |

`desc` = sum; `net = prov − desc`; `recebido = net + adiant`; `fgts = prov × pctFGTS`.

### 3.3 Acceptance tests (the app MUST reproduce these)
1. With only the rotation 2026-10-20 / 2026-10-21 / 2026-11-18 / 2026-11-19 and default params → **November 2026**: dias = 18, dobra = 4, viagens = 1, **prov = R$ 43.323,09**, **net = R$ 28.239,69**.
2. Rotation 2026-11-10 / 11-11 / 11-19 / 11-20 with November overrides he = 1.5, dobra = 3, viag = 1 → campo = 1.075,36; not = 1.259,63; bonus = 2.452,50; dobra = 6.653,44; trab = 1.079,68; he = 157,04.

Include a small unit-test file (`calc.test.ts`) asserting these values (±0.01).

---

## 4. SCREENS (bottom tab bar: Mês · Rotações · Ano · Ajustes)

### 4.1 Tab "Mês" (home)
- Eyebrow "HOLERITE ESTIMADO", title "Meu mês", round calendar icon button on the right (goes to the current month, toast "Mês atual").
- **Month switcher:** round ‹ and › buttons with the label "Novembro 2026" centered (bold 17px). Swiping left/right on the hero card also changes month. Initial month = current month if the current year equals `params.ano`, else January.
- **Hero card:** label "Líquido do holerite", big value (38px extra-bold) = net. Three mini tiles: "Proventos", "Descontos", "+ Adiantamento" (= recebido), shown in short format (e.g., "R$ 43,3k" when ≥ 1000).
- **4 stat tiles** (grid of 4, 2 columns under 360px): dias "Suriname" (blue dot), dobra "Dobra" (orange dot), off "Offshore líq.", viagens "Viagens" (purple dot). Big 22px number, 11px label.
- Section "CALENDÁRIO": card with a 7-column month grid, weekday headers D S T Q Q S S (Sunday first), leading blanks. Day cells: square, radius 12px. In Suriname → blue tinted background + blue number. Dobra → small orange dot at the bottom. Travel day → 2px purple inner ring. Holiday → red number. Today → number inside a red filled circle. Tooltip (title) listing what applies. Legend below: "No Suriname", "Dobra", "Viagem", "Hoje".
- Section "COMPOSIÇÃO DOS PROVENTOS": a 10px rounded stacked horizontal bar with each earning's share in its color, and the hint "Adicionais representam X% dos proventos (R$ …)." (X = (prov − salario)/prov).
- Section "PROVENTOS": inset list. Each row: 30px rounded colored badge with a glyph, label, small muted subtitle, value right-aligned bold. Show salario, sob, per always; others only when > 0. Colors/glyphs: salario #8e8e93 "R$"; he #64d2ff "⏱"; dsr #40c8e0 "↺"; sob #5e5ce6 "☎"; per #ff453a "⚠"; campo #0a84ff "⛏"; not #1c3faa "☾"; viag #bf5af2 "✈"; bonus #30d158 "$"; dobra #ff9f0a "×2"; trab #d4a300 "🌎". Subtitles: he "1,5 h"; dsr "21 úteis · 4 domingos"; campo/not "14 dias líquidos"; viag "1 viagem(ns)"; bonus "18 dias × US$ 50 × 5,45"; dobra "4 dia(s)"; trab "18 dias no Suriname". Footer row (secondary fill, extra-bold): "Total de proventos".
- Section "DESCONTOS": same list style, values in red with a minus sign, footer "Total de descontos".
- Section "AJUSTES DESTE MÊS" (card with rows):
  - "Horas extras 60%" / small "Horas no mês" → stepper (step 0.5, min 0).
  - "Dias de dobra" / small "Automático: N (domingos/feriados no Suriname)" → number input, placeholder "Auto".
  - "Viagens" / small "Automático: N" → number input, placeholder "Auto".
  - "Câmbio USD→BRL" / small "Padrão: 5,45" → number input, placeholder "Padrão".
  - Empty input = remove override (automatic). Negative/invalid = ignored. Recalculate live as the user types.
- Hint below: "Deixe em branco para usar o cálculo automático. FGTS do mês (depósito da empresa): R$ …".

### 4.2 Tab "Rotações"
- Eyebrow "ESCALA 28X28", title "Rotações", round icon button (sparkle/sun icon) opening the **"Gerar escala"** sheet.
- List of rotation cards sorted by date. Each card: "Rotação N" bold + optional note (muted), and a pill on the right: "Concluída · 29 dias" (grey), "Em andamento · 29 dias" (green tint), "Próxima · 29 dias" (blue tint) based on today.
- **Timeline** inside each card: 4 evenly spaced nodes connected by a gradient line (purple→blue→blue→purple): "SAI BR", "CHEGA SR", "SAI SR", "CHEGA BR" with dates "dd/mm". Travel nodes purple, Suriname nodes blue (20px circles with card-colored border).
- Buttons: "Editar" (soft blue) and "Excluir" (soft red, with confirm "Excluir esta rotação?").
- Empty state: ✈️ emoji, "Nenhuma rotação", "Toque em + para adicionar ou use o gerador de escala."
- **FAB "+"** opens the **"Nova rotação"** sheet with date fields: "Saída do Brasil", "Chegada ao Suriname", "Saída do Suriname", "Chegada ao Brasil", text "Observação" (placeholder "Opcional", max 120 chars). Button "Preencher 28x28 a partir da saída" → chegadaSR = saída+1, saidaSR = saída+29, chegadaBR = saída+30. Live hint: "N dias no Suriname." Validation messages (red): "Chegada e saída do Suriname são obrigatórias." / "As datas precisam estar em ordem cronológica." / "Sobrepõe outra rotação (dd/mm–dd/mm)." Title changes to "Editar rotação" when editing.
- **"Gerar escala" sheet:** "1ª saída do Brasil" (default = last rotation's saidaBR or today), "Dias no Suriname" / small "Chegada → saída, inclusive" (default 29, 1–60), "Ciclo completo (dias)" / small "De uma saída à próxima" (default 56, must be ≥ dias+2 and ≤ 120), "Gerar até" (default 31/12 of params.ano), toggle "Substituir rotações existentes" (default on; when off, remove only existing rotations that overlap the generated ones). Toast "N rotações geradas".

### 4.3 Tab "Ano"
- Eyebrow = year, title "Visão anual".
- 2×2 KPI cards: "Proventos no ano", "Líquido no ano", "Dias no Suriname", "Média líquida/mês" (net/12).
- Section "LÍQUIDO POR MÊS": vertical bar chart (pure CSS/SVG, 180px tall) with 12 bars (labels Jan…Dez), height proportional to net, blue→indigo gradient; months with zero days in Suriname shown grey; selected month gets an orange ring. Tapping a bar opens that month in the "Mês" tab.
- Hint: "Toque em um mês para abrir o holerite dele. Barras cinza = meses sem dias no Suriname."
- Section "DETALHE MENSAL": list rows "Janeiro" + subtitle "29 dias SR · 4 dobra · 2 viagens" + net on the right (tappable), footer "Total líquido".

### 4.4 Tab "Ajustes"
- Eyebrow "PARÂMETROS", title "Ajustes".
- Collapsible grouped cards (iOS disclosure chevron), first open:
  - **Salário e câmbio:** Salário mensal (R$), Câmbio USD→BRL padrão, Ano de referência (2000–2100).
  - **Adicionais:** Sobreaviso (%), Periculosidade (%), toggle "Sobreaviso/periculosidade todo mês" (small: "Desligado: só em meses com dias no Suriname"), Fator serviço no campo, Fator noturno campo, Horas noturnas/dia, Divisor noturno, Adicional por viagem (R$), Bônus exterior (US$/dia), Adic. trabalho no exterior (%), Hora extra (%), Divisor horas/mês.
  - **Dobra:** Fator dobra (× salário/dia), toggle "Domingos no Suriname contam como dobra", toggle "Feriados no Suriname contam como dobra".
  - **Descontos:** INSS mensal (R$), IRRF – alíquota efetiva (%) (small: "Estimativa sobre o total de proventos"), Adiantamento quinzenal (%), Previdência privada básica (%), PGBL empregado (%), Co-participação médica (R$), Assistência odontológica (R$), FGTS (empresa) (%).
  - Percent fields show/edit as 0–100 but store as decimals. Reject negatives, NaN and zero divisors. Auto-save with a debounced "Salvo" toast.
- Section "FERIADOS": editable rows (date input + name input + red ⊖ remove button), sorted by date, button "+ Adicionar feriado".
- Section "DADOS": "Exportar backup (JSON)" (downloads `rotapay-backup-YYYY-MM-DD.json`), "Importar backup" (file input, validates `params` and `rotations` array, toast "Arquivo inválido" on error), "Restaurar padrões" (red, with confirm).
- Footer hints: "IRRF é estimado por alíquota efetiva. Os valores são uma projeção e podem diferir do holerite oficial." and "RotaPay v1.0.0".

---

## 5. BEHAVIOR & QUALITY RULES

- Every change recalculates instantly and is saved to localStorage (`{ state, dirty }`).
- Never show `NaN`, `Infinity` or `undefined`; fall back to 0.
- Escape any user text (notes, holiday names) before rendering.
- Responsive down to 320px; at ≤360px reduce hero value to 32px and stats grid to 2 columns.
- Add a web app manifest (name "RotaPay – Salário de Rotação", short_name "RotaPay", theme `#0a84ff`, background `#f2f2f7`, display standalone, portrait) and a generated app icon: rounded square with the blue→indigo→purple gradient and white bold "R$".
- Add iOS meta tags (`apple-mobile-web-app-capable`, `viewport-fit=cover`, theme-color) so it can be added to the Home Screen.
- Code structure: `calc.ts` (pure engine + defaults), `storage.ts`, `components/` (HeroCard, StatTiles, MonthCalendar, EarningsList, RotationCard, BottomSheet, TabBar, Toggle, Stepper, Toast), `screens/` (MonthScreen, RotationsScreen, YearScreen, SettingsScreen).

## 6. OPTIONAL – PREPARE FOR SUPABASE (do not block v1)

Create a `sync.ts` abstraction so storage can later be swapped to Supabase (table `user_state(user_id uuid pk references auth.users, data jsonb, updated_at timestamptz)` with RLS "user can only access own row"). Read `SUPABASE_URL` and `SUPABASE_ANON_KEY` from environment variables; if they are empty, run in local mode (no login). When configured, show an iOS-style login screen (gradient "R$" logo 84px, title "RotaPay", subtitle "Entre para ver seus holerites", grouped e-mail/senha card, blue "Entrar" button, links "Esqueci a senha" and "Criar conta"), sync with ~900ms debounce, last-write-wins by `updated_at`, and show a status dot next to the eyebrow (green = Sincronizado, orange = Sincronizando…, red = Erro, grey = Salvo apenas neste aparelho). Add an "CONTA" section at the top of Ajustes with user e-mail, sync status, "Sincronizar agora" and "Sair".

Deliver the full working app now, with the default data pre-loaded so the first screen already shows October/November 2026 with real values.
