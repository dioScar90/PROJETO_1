import { sanitizeHTML } from '../views/sanitizeHelper.js';

/**
 * Custom Element `<transactions-list>` que exibe a tabela de transações
 * com barra de busca e botões de filtro.
 *
 * Propriedades (setter/getter):
 * - `transactions` → Array de transações a exibir
 * - `activeFilter`  → 'all' | 'income' | 'expense'
 * - `searchQuery`   → string da busca atual
 *
 * Eventos despachados (bubbles: true, composed: true):
 * - `transaction:delete` → `{ detail: { id: number } }`
 * - `transaction:filter` → `{ detail: { filter: string, query: string } }`
 *
 * @extends HTMLElement
 */
export class TransactionsList extends HTMLElement {
  constructor() {
    super();
    this._transactions = [];
    this._activeFilter = 'all';
    this._searchQuery = '';
  }

  connectedCallback() {
    this._render();
    this._setupListeners();
  }

  // ─── Setters / Getters ─────────────────────────────────────────────────────

  /**
   * Define a lista de transações e aciona re-renderização.
   * @param {Array.<Object>} data
   */
  set transactions(data) {
    this._transactions = data || [];
    if (this.isConnected) this._updateRows();
  }

  get transactions() {
    return this._transactions;
  }

  /**
   * Define o filtro ativo e aciona re-renderização dos botões.
   * @param {'all'|'income'|'expense'} value
   */
  set activeFilter(value) {
    this._activeFilter = value;
    if (this.isConnected) this._updateFilterButtons();
  }

  get activeFilter() {
    return this._activeFilter;
  }

  /**
   * Define a query de busca atual e atualiza o input.
   * @param {string} value
   */
  set searchQuery(value) {
    this._searchQuery = value;
    const input = this.querySelector('#tx-search');
    if (input && input.value !== value) {
      input.value = value;
    }
  }

  get searchQuery() {
    return this._searchQuery;
  }

  // ─── Utilitários ──────────────────────────────────────────────────────────

  /**
   * Formata valores em moeda BRL.
   * @param {number} value
   * @returns {string}
   * @private
   */
  _formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata string de data ISO para padrão dd/mm/aaaa.
   * @param {string} dateStr
   * @returns {string}
   * @private
   */
  _formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  // ─── Renderização ─────────────────────────────────────────────────────────

  /**
   * Renderiza apenas as linhas da tabela de transações.
   * Chamado quando a propriedade `transactions` é atualizada.
   * @private
   */
  _updateRows() {
    const tbody = this.querySelector('#transactions-tbody');
    if (!tbody) return;
    tbody.innerHTML = this._buildRowsHTML();
  }

  /**
   * Atualiza o estado visual dos botões de filtro.
   * @private
   */
  _updateFilterButtons() {
    const buttons = this.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      const filter = btn.getAttribute('data-filter');
      const isActive = filter === this._activeFilter;

      // Remove todas as classes de estado ativo
      btn.className = 'filter-btn px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all';

      if (isActive) {
        if (filter === 'all') {
          btn.className += ' bg-slate-800 text-white shadow-sm';
        } else if (filter === 'income') {
          btn.className += ' bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm';
        } else {
          btn.className += ' bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm';
        }
      } else {
        btn.className += ' text-slate-400 hover:text-slate-200';
      }
    });
  }

  /**
   * Gera o HTML das linhas da tabela.
   * @returns {string}
   * @private
   */
  _buildRowsHTML() {
    if (this._transactions.length === 0) {
      return `
        <tr>
          <td colspan="5" class="px-4 py-10 text-center text-slate-500 text-sm">
            Nenhuma transação encontrada para os filtros aplicados.
          </td>
        </tr>
      `;
    }

    return this._transactions.map(t => {
      const isIncome = t.type === 'income';
      const symbol = isIncome ? '+' : '-';
      const valueColor = isIncome ? 'text-emerald-400' : 'text-rose-400';
      const badgeBg = isIncome
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      return `
        <tr class="border-b border-slate-800/60 hover:bg-slate-900/30 transition-colors">
          <td class="px-4 py-3.5">
            <div class="font-medium text-slate-100 text-sm">${sanitizeHTML(t.title)}</div>
            <div class="text-xs text-slate-500 md:hidden mt-0.5">
              ${this._formatDate(t.date)} • ${sanitizeHTML(t.category)}
            </div>
          </td>
          <td class="px-4 py-3.5 hidden md:table-cell">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeBg}">
              ${sanitizeHTML(t.category)}
            </span>
          </td>
          <td class="px-4 py-3.5 text-xs text-slate-400 hidden md:table-cell">
            ${this._formatDate(t.date)}
          </td>
          <td class="px-4 py-3.5 text-right font-semibold ${valueColor} text-sm">
            ${symbol} ${this._formatCurrency(t.amount)}
          </td>
          <td class="px-4 py-3.5 text-right">
            <button class="delete-tx-btn text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                    data-id="${t.id}" title="Excluir transação" aria-label="Excluir ${sanitizeHTML(t.title)}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Renderização inicial completa do componente.
   * @private
   */
  _render() {
    this.innerHTML = `
      <div class="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-6">

        <!-- Cabeçalho: Título + Busca + Filtros -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            Histórico de Lançamentos
          </h2>

          <div class="flex flex-col sm:flex-row gap-2.5">
            <!-- Campo de busca -->
            <div class="relative min-w-[180px]">
              <input type="text" id="tx-search" placeholder="Buscar..." value="${sanitizeHTML(this._searchQuery)}"
                     aria-label="Buscar transações"
                     class="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" />
              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>

            <!-- Grupo de botões de filtro -->
            <div class="flex bg-slate-950/80 border border-slate-800 p-0.5 rounded-lg" role="group" aria-label="Filtrar por tipo">
              <button class="filter-btn px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all bg-slate-800 text-white shadow-sm"
                      data-filter="all" aria-pressed="true">Tudo</button>
              <button class="filter-btn px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all text-slate-400 hover:text-slate-200"
                      data-filter="income" aria-pressed="false">Receitas</button>
              <button class="filter-btn px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all text-slate-400 hover:text-slate-200"
                      data-filter="expense" aria-pressed="false">Despesas</button>
            </div>
          </div>
        </div>

        <!-- Tabela de transações -->
        <div class="overflow-x-auto rounded-xl border border-slate-800/50 bg-slate-950/20">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-950/40 border-b border-slate-800/50 text-xs font-semibold text-slate-400">
                <th class="px-4 py-3">Descrição</th>
                <th class="px-4 py-3 hidden md:table-cell">Categoria</th>
                <th class="px-4 py-3 hidden md:table-cell">Data</th>
                <th class="px-4 py-3 text-right">Valor</th>
                <th class="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody id="transactions-tbody">
              ${this._buildRowsHTML()}
            </tbody>
          </table>
        </div>

      </div>
    `;

    // Garante que os botões comecem com o estado correto
    this._updateFilterButtons();
  }

  /**
   * Configura os event listeners usando delegação de eventos no elemento raiz.
   * @private
   */
  _setupListeners() {
    // Delegação: deleção
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-tx-btn');
      if (!btn) return;

      const id = parseInt(btn.getAttribute('data-id'), 10);
      if (isNaN(id)) return;

      if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

      /**
       * Dispara `transaction:delete` que borbulha até o document
       * para ser capturado pelo FinanceController.
       */
      this.dispatchEvent(new CustomEvent('transaction:delete', {
        detail: { id },
        bubbles: true,
        composed: true
      }));
    });

    // Delegação: filtros
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      this._activeFilter = btn.getAttribute('data-filter');
      this._updateFilterButtons();

      this.dispatchEvent(new CustomEvent('transaction:filter', {
        detail: { filter: this._activeFilter, query: this._searchQuery },
        bubbles: true,
        composed: true
      }));
    });

    // Busca com input
    this.addEventListener('input', (e) => {
      if (e.target.id !== 'tx-search') return;
      this._searchQuery = e.target.value;

      this.dispatchEvent(new CustomEvent('transaction:filter', {
        detail: { filter: this._activeFilter, query: this._searchQuery },
        bubbles: true,
        composed: true
      }));
    });
  }
}
