/**
 * Custom Element `<transaction-form>` que contém o formulário completo para
 * adicionar novas transações financeiras.
 *
 * Eventos despachados (bubbles: true, composed: true):
 * - `transaction:add` → `{ detail: { title, amount, type, category, date } }`
 *
 * Métodos públicos:
 * - `showError(message)` → exibe mensagem de erro no container interno
 *
 * @extends HTMLElement
 */
export class TransactionForm extends HTMLElement {
  connectedCallback() {
    this._render();
    this._setupListeners();
  }

  /**
   * Exibe uma mensagem de erro amigável no componente.
   * @param {string} message - Mensagem a ser exibida.
   */
  showError(message) {
    const errorEl = this.querySelector('#form-error');
    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.classList.remove('hidden');

    setTimeout(() => {
      errorEl.classList.add('hidden');
    }, 5000);
  }

  /**
   * Limpa os campos de texto do formulário após submissão.
   */
  resetInputs() {
    const title = this.querySelector('#tx-title');
    const amount = this.querySelector('#tx-amount');
    if (title) { title.value = ''; title.focus(); }
    if (amount) amount.value = '';
  }

  /**
   * Configura o listener de submissão do formulário.
   * @private
   */
  _setupListeners() {
    const form = this.querySelector('#transaction-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = this.querySelector('#tx-title')?.value?.trim();
      const amount = parseFloat(this.querySelector('#tx-amount')?.value);
      const type = this.querySelector('#tx-type')?.value;
      const category = this.querySelector('#tx-category')?.value;
      const date = this.querySelector('#tx-date')?.value;

      /**
       * Dispara o CustomEvent `transaction:add` que borbulha até o document
       * para ser capturado pelo FinanceController.
       * @type {CustomEvent}
       */
      this.dispatchEvent(new CustomEvent('transaction:add', {
        detail: { title, amount, type, category, date },
        bubbles: true,
        composed: true
      }));
    });
  }

  /**
   * Renderiza o template HTML do formulário.
   * @private
   */
  _render() {
    const todayStr = new Date().toISOString().split('T')[0];

    this.innerHTML = `
      <div class="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-4">
        <h2 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-cyan-500"></span>
          Nova Transação
        </h2>

        <form id="transaction-form" class="space-y-4" novalidate>
          <!-- Container de erro -->
          <div id="form-error" class="hidden text-xs bg-rose-500/15 border border-rose-500/30 text-rose-400 px-3 py-2.5 rounded-lg"></div>

          <!-- Descrição -->
          <div class="space-y-1">
            <label for="tx-title" class="text-xs font-semibold text-slate-400">Descrição</label>
            <input type="text" id="tx-title" placeholder="Ex: Supermercado" required
                   class="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all" />
          </div>

          <!-- Valor e Tipo -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label for="tx-amount" class="text-xs font-semibold text-slate-400">Valor (R$)</label>
              <input type="number" id="tx-amount" step="0.01" min="0.01" placeholder="0,00" required
                     class="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all" />
            </div>
            <div class="space-y-1">
              <label for="tx-type" class="text-xs font-semibold text-slate-400">Tipo</label>
              <select id="tx-type" required
                      class="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all cursor-pointer">
                <option value="expense" class="bg-slate-900">Despesa</option>
                <option value="income" class="bg-slate-900">Receita</option>
              </select>
            </div>
          </div>

          <!-- Categoria e Data -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label for="tx-category" class="text-xs font-semibold text-slate-400">Categoria</label>
              <select id="tx-category" required
                      class="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all cursor-pointer">
                <option value="Alimentação" class="bg-slate-900">Alimentação</option>
                <option value="Moradia" class="bg-slate-900">Moradia</option>
                <option value="Transporte" class="bg-slate-900">Transporte</option>
                <option value="Lazer" class="bg-slate-900">Lazer</option>
                <option value="Trabalho" class="bg-slate-900">Trabalho</option>
                <option value="Freelance" class="bg-slate-900">Freelance</option>
                <option value="Assinaturas" class="bg-slate-900">Assinaturas</option>
                <option value="Outros" class="bg-slate-900">Outros</option>
              </select>
            </div>
            <div class="space-y-1">
              <label for="tx-date" class="text-xs font-semibold text-slate-400">Data</label>
              <input type="date" id="tx-date" value="${todayStr}" required
                     class="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all" />
            </div>
          </div>

          <!-- Botão de Submissão -->
          <button type="submit"
                  class="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-sm transition-all shadow-md shadow-cyan-600/10 active:scale-[0.98] cursor-pointer">
            Confirmar Transação
          </button>
        </form>
      </div>
    `;
  }
}
