# CLAUDE.md

Este arquivo orienta o Claude Code ao trabalhar neste repositório.

## Visão Geral do Projeto

**Antigravity Finance** — dashboard de finanças pessoais (SPA client-side) para registrar receitas e despesas, com saldo, totais, distribuição de despesas por categoria, filtros e busca. Sem backend: os dados persistem no `localStorage` do browser.

Stack: **Vanilla JavaScript (ESM)** + **Web Components (Custom Elements)** + arquitetura **MVC** + **Tailwind CSS v4** + **Vite**. Não há frameworks (React/Vue/Angular) — não introduzir.

Idioma do projeto: UI, comentários, JSDoc e mensagens de erro são em **português (pt-BR)**.

## Comandos

```bash
npm run dev            # Servidor de desenvolvimento Vite
npm run build          # Build de produção
npm run preview        # Preview do build
npm run lint           # ESLint em src/**/*.js
npm run test           # Vitest (run única)
npm run test:watch     # Vitest em modo watch
npm run test:coverage  # Cobertura (thresholds: 80% stmts/funcs/lines, 75% branches)
```

Para rodar um teste específico: `npx vitest run tests/FinanceModel.test.js`

## Arquitetura

### Bootstrap (`src/main.js`)
1. Registra todos os Custom Elements (`customElements.define`) — **antes** do bootstrap MVC, para que o browser reconheça as tags.
2. No `DOMContentLoaded`, instancia `FinanceModel`, `FinanceView` e `FinanceController` e chama `controller.init()`.

O `index.html` contém apenas a tag raiz `<finance-dashboard>`; todo o HTML é gerado pelos componentes.

### Fluxo MVC + Web Components

```
Custom Elements ──CustomEvent──▶ FinanceView (bridge) ──callback──▶ FinanceController
      ▲                                                                    │
      │ render() via propriedades                                          ▼
FinanceView ◀──────────── notify('transactions:updated') ────────── FinanceModel
```

- **Model** (`src/app/models/FinanceModel.js`): estende `Observable` (PubSub em `src/app/core/Observable.js`). Detém `_transactions`, valida regras de negócio, calcula totais e distribuição por categoria. Persiste no `localStorage` sob a chave `antigravity_finance_transactions` (com dados-semente na primeira carga). Após cada mutação, emite `notify('transactions:updated', ...)`. **Nunca toca no DOM.**
- **View** (`src/app/views/FinanceView.js`): não gera HTML — é uma *bridge* de orquestração. Obtém referência ao `<finance-dashboard>` e delega dados às propriedades dos Custom Elements filhos. Escuta no `document` os CustomEvents despachados pelos componentes (`transaction:add`, `transaction:delete`, `transaction:filter`) e repassa ao Controller via callbacks `bind*`.
- **Controller** (`src/app/controllers/FinanceController.js`): registra os callbacks `bind*` da View, escuta o Model, e mantém estado local de filtro (`_activeFilter`: all/income/expense) e busca (`_searchQuery`). `handleRefresh()` filtra as transações e chama `view.render(...)` — totais e distribuição permanecem globais (não filtrados).

### Componentes (`src/app/components/`)
Custom Elements registrados em `main.js`:

| Tag | Classe |
|---|---|
| `<finance-dashboard>` | `FinanceDashboard` (raiz; expõe getters para os filhos) |
| `<summary-card>` | `SummaryCard` |
| `<transaction-form>` | `TransactionForm` (despacha `transaction:add`) |
| `<category-distribution>` | `CategoryDistribution` |
| `<transactions-list>` | `TransactionsList` (despacha `transaction:delete` e `transaction:filter`) |

### Core (`src/app/core/`)
- `Observable.js`: base PubSub (`subscribe`/`notify`) usada pelo Model.
- `LocalStore.js`: lib de persistência com fallback automático de drivers (IndexedDB → CacheStorage → localStorage → sessionStorage), API toda assíncrona, namespace configurável e `estimateUsage()`. **Atenção:** o `FinanceModel` atualmente usa `localStorage` direto, não o `LocalStore`.

### Regras de isolamento
- Model não conhece DOM/View; comunica mudanças apenas via eventos.
- Componentes não acessam o Model; despacham CustomEvents (`bubbles: true`) capturados pela View.
- Controller é o único que liga as camadas.

## Convenções de Código

- Indentação: **2 espaços**; ponto e vírgula obrigatório; aspas simples (template literals para HTML dinâmico).
- Classes em `PascalCase`; funções/variáveis em `camelCase`; constantes globais em `UPPER_SNAKE_CASE`; membros privados prefixados com `_`.
- Arquivos: `PascalCase.js` para classes arquiteturais (`FinanceModel.js`), `camelCase.js` para utilitários (`sanitizeHelper.js`).
- **JSDoc obrigatório** em métodos públicos, construtores e funções exportadas (padrão já seguido em todo o código).
- Delegação de eventos: um listener no container pai com `e.target.closest()`/`matches()`, em vez de listeners por item dinâmico.
- **XSS:** toda entrada do usuário interpolada em template literals HTML deve passar pelo sanitizador de `src/app/views/sanitizeHelper.js`.

## Tailwind CSS

- v4 via `@tailwindcss/postcss` (ver `postcss.config.js`); entrada em `src/styles/main.css`.
- Tema estendido com a paleta `brand` em `tailwind.config.js`; visual dark (`bg-slate-950`, acentos cyan/emerald/rose, fonte Outfit).
- Utility-first: estilizar com classes utilitárias nas strings de template dos componentes, não com CSS custom.

## Testes

- **Vitest** com `environment: 'jsdom'` e `globals: true` (não é preciso importar `describe`/`it`/`expect`).
- Testes em `tests/*.test.js`, espelhando o nome da classe testada.
- Views/componentes: montar o esqueleto com `document.body.innerHTML` no `beforeEach` antes de instanciar.
- Model: assertar tanto o estado quanto a emissão dos eventos `notify`.
