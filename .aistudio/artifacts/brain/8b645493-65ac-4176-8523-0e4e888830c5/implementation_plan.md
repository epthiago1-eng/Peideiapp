# Integração Definitiva e Pré-Configuração do Supabase para o Netlify

Este plano detalha as alterações para que o **RotaPay** inicie com a conexão do Supabase pré-configurada em qualquer ambiente (incluindo Netlify), eliminando a necessidade de digitar a URL e Anon Key manualmente a cada novo dispositivo ou navegador.

---

## Revisão do Usuário e Decisões Críticas

> [!IMPORTANT]
> **Decisões confirmadas na Fase de Perguntas:**
> 1. **Definição de URL e Anon Key**: O usuário optou por informar a URL e a Anon Key para embutir diretamente como credenciais padrão do app, garantindo que o build do Netlify funcione imediatamente "out-of-the-box".
> 2. **Pré-preenchimento de Acesso**: O e-mail `ep.Thiago1@gmail.com` será pré-configurado por padrão no modal de login e cadastro.
>
> ⚠️ **Aguardando envio**: Assim que você enviar a sua URL e Anon Key do Supabase (ou autorizar o uso das variáveis padrão), elas serão inseridas no arquivo de configuração do cliente para conexão instantânea.

---

## 1. Visão Geral e Objetivo

- **Problema**: Ao abrir no Netlify, o `localStorage` do navegador começa vazio e as variáveis de ambiente Vite (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) não estavam embutidas no código estático gerado no deploy, fazendo o app exibir a mensagem "Supabase não configurado".
- **Solução**:
  1. Definir credenciais padrão (URL e chave pública Anon Key) diretamente em `src/sync.ts`, com precedência automática para `localStorage` ou variáveis de ambiente se o usuário desejar alterá-las no futuro.
  2. Pré-preencher o e-mail `ep.Thiago1@gmail.com`.
  3. Garantir inicialização e verificação de sessão automática no primeiro carregamento do Netlify.
  4. Revisar toda a integridade funcional do app (cálculo de 28x28, dobra a partir do 29º dia, holerites de Setembro e Outubro/2026, exportação e diagnóstico CRUD).

---

## 2. Experiência do Usuário (UX) & Design

- **Inicialização Sem Fricção**:
  - No Netlify, o app abre já com o status de conexão verificado: **"Conectado à nuvem"** (se já logado) ou com modal direto de login preenchido com `ep.Thiago1@gmail.com`.
  - Zero necessidade de o usuário acessar a aba "Configurar URL e chaves do Supabase" a não ser que troque de projeto.
- **Feedback Visual de Sincronização**:
  - Indicador sutil no rodapé dos Ajustes: indicador verde de sincronizado na nuvem, laranja durante envio e cinza quando offline.
  - Teste de CRUD mantido na tela de Ajustes para verificação pontual em tempo real (Create, Read, Update, Delete).

---

## 3. Decisões do Produto e Arquitetura Técnica

```
┌────────────────────────────────────────────────────────┐
│                      RotaPay App                       │
│    (Local State: Params, Rotations, Months, Holidays)  │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               │                         │
               ▼                         ▼
   ┌───────────────────────┐ ┌───────────────────────┐
   │ localStorage (Local)  │ │ Supabase Sync Service │
   │   Cache offline 100%  │ │  (Dual-Sync Engine)   │
   └───────────────────────┘ └───────────┬───────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
                   ▼                                           ▼
      ┌─────────────────────────┐                 ┌─────────────────────────┐
      │   Tabela user_state     │                 │   Tabelas Relacionais   │
      │ (JSONB rápido p/ front) │                 │  - user_params          │
      │                         │                 │  - rotations            │
      │                         │                 │  - month_overrides      │
      └─────────────────────────┘                 └─────────────────────────┘
```

### Principais Ações de Implementação:

1. **Configuração de Fallback Padrão no `src/sync.ts`**:
   - Atualizar a função `getStoredConfig()` para incluir a URL e a Anon Key do projeto Supabase do usuário como fallback nativo caso o `localStorage` esteja vazio (como acontece no primeiro acesso no Netlify).
2. **Configuração de Build do Netlify (`netlify.toml` / `.env`)**:
   - Criar arquivo `netlify.toml` e `.env` com as diretivas de build para garantir que as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` sejam injetadas durante o build na nuvem.
3. **Autenticação Instantânea**:
   - No modal de autenticação, o e-mail `ep.Thiago1@gmail.com` já virá como padrão, permitindo que o usuário apenas informe sua senha para conexão imediata.
4. **Revisão Completa das Funções do App**:
   - Cálculos e fórmulas do RotaPay com precisão completa em centavos.
   - Regra da dobra offshore a partir do 29º dia validada.
   - Suporte a múltiplos meses e rotações com distribuição de dias entre meses.
   - Sincronização dupla no Supabase (tabela unificada `user_state` e tabelas relacionais).

---

## Próximo Passo

Por favor, forneça a sua **URL do Supabase** (ex: `https://xxxx.supabase.co`) e a sua **Anon Key (public key)** para que possamos integrá-las de imediato ao código e publicar a versão pré-configurada.
