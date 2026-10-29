# Tela Inicial de Login Obrigatório e Sincronização Permanente no Supabase

Implementar um portão de entrada com tela de login obrigatória na abertura do aplicativo, remover diagnósticos e ferramentas técnicas da tela de Ajustes, e garantir persistência definitiva dos dados do usuário no Supabase.

---

## Revisão do Usuário e Decisões Críticas

> [!IMPORTANT]
> **Decisões confirmadas na Fase de Perguntas:**
> 1. **Persistência da Sessão**: O usuário permanece conectado permanentemente após o primeiro login até clicar explicitamente em "Sair da conta".
> 2. **Comportamento Offline**: Se o usuário já tiver realizado login anteriormente e abrir o app sem internet, o aplicativo permite acesso aos dados em cache local e sincroniza automaticamente assim que a conexão for restabelecida.
> 3. **Remoção de Ferramentas Técnicas**: A tela de Ajustes será simplificada, removendo os cartões de script SQL, diagnóstico de CRUD e configurações de chave, mantendo apenas a identificação do usuário logado e o botão de logout.

---

## 1. Visão Geral e Objetivo

- **Problema**: O aplicativo abria diretamente na tela de cálculo sem exigir autenticação, mantendo ferramentas técnicas (testes de banco, cópia de script SQL e diagnóstico de CRUD) na tela de Ajustes, o que causava confusão sobre se o usuário estava realmente conectado e se os dados estavam salvos.
- **Solução**:
  1. **Portão de Autenticação Inicial (`AuthScreen`)**: Acesso aos dados restrito aos usuários autenticados. Sem login, o app exibe apenas a tela de autenticação do RotaPay com e-mail `ep.Thiago1@gmail.com` pré-preenchido.
  2. **Carregamento Imediato da Nuvem**: Ao autenticar, o app baixa imediatamente o estado salvo do Supabase (`user_state`) e inicializa a interface com as rotações e holerites do usuário.
  3. **Ajustes Enxutos e Elegantes**: A tela de Ajustes exibirá apenas o card do usuário logado com status de sincronização e o botão de sair da conta.
  4. **Persistência Contínua**: Qualquer alteração em rotações, valores mensais ou parâmetros salva automaticamente no Supabase em segundo plano.

---

## 2. Experiência do Usuário (UX) & Design Visual

### Fluxo de Uso
1. **Abertura do App**:
   - Splash sutil enquanto verifica sessão ativa no Supabase.
   - Se já logado: entra direto no aplicativo principal com os dados sincronizados.
   - Se não logado: apresenta a tela de login em tela cheia com o logotipo gradiente "R$", título RotaPay e opções de entrar / criar conta / redefinir senha.
2. **Tela de Autenticação (`AuthScreen`)**:
   - Design moderno alinhado com o iOS / Tailwind escuro e claro.
   - Campo de e-mail pré-preenchido com `ep.Thiago1@gmail.com`.
   - Campo de senha com alternador de visibilidade (mostrar/ocultar senha).
   - Botão de ação primária destacado em azul `#0a84ff`.
   - Mensagens de erro claras e amigáveis em caso de senha incorreta.
3. **Tela de Ajustes Simplificada**:
   - Card minimalista **"Sua Conta"**:
     - Avatar com iniciais ou ícone de usuário.
     - E-mail `ep.Thiago1@gmail.com`.
     - Status verde: "Conectado e sincronizado no Supabase".
     - Botão vermelho sutil: "Sair da conta".
   - Sem campos técnicos de URL, chaves, botões de teste de CRUD ou blocos de código SQL.

---

## 3. Decisões do Produto e Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                       Inicialização                          │
│        Verifica sessão ativa no Supabase SDK                 │
└──────────────────────────────┬───────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
       [Não Autenticado]                [Autenticado]
      ┌──────────────────┐           ┌──────────────────┐
      │    AuthScreen    │           │ Baixa user_state │
      │  Login / SignUp  │           │   do Supabase    │
      └─────────┬────────┘           └────────┬─────────┘
                │                             │
                └────────► [Sucesso] ─────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │        App Principal         │
                │  - Mês (Holerite)            │
                │  - Rotações (Escala)         │
                │  - Calendário                │
                │  - Ajustes (Com Logout)      │
                └──────────────┬───────────────┘
                               │ (qualquer alteração)
                               ▼
                ┌──────────────────────────────┐
                │      Sincronização Nuvem     │
                │  Grava user_state + tabelas  │
                │     relacionais Supabase     │
                └──────────────────────────────┘
```

### Detalhamento das Alterações Técnicas:

1. **Novo Componente `src/screens/AuthScreen.tsx`**:
   - Tela de login de tela inteira substituindo o modal temporário.
   - Suporte a login com senha, criação de conta com confirmação automática e recuperação de senha.
2. **Atualização do `src/App.tsx`**:
   - Estado de autenticação controlando a renderização condicional da aplicação:
     - `if (authLoading) return <SplashScreen />`
     - `if (!currentUser) return <AuthScreen onLoginSuccess={...} />`
     - `return <MainApp />`
   - Ao logar, executa pull dos dados do usuário no Supabase e atualiza o estado local.
3. **Limpeza da `src/screens/SettingsScreen.tsx`**:
   - Remoção dos cartões de SQL, testes manuais de CRUD e campos de chaves.
   - Inclusão do card de perfil simples com botão de desconexão.
4. **Garantia de Sincronização Bidirecional (`src/sync.ts`)**:
   - Ao autenticar: busca `user_state`. Se não existir registro remoto, sobe os dados iniciais de 2026 para o Supabase.
   - A cada alteração local: salva no Supabase (debounced 900ms) tanto no `user_state` quanto nas tabelas relacionais.
