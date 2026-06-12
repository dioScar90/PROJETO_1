/**
 * Camada View refatorada para o modelo de Web Components.
 *
 * Em vez de gerar HTML via template literal monolítico, a FinanceView atua
 * como uma **bridge de orquestração**: ela obtém referências ao elemento raiz
 * `<finance-dashboard>` e a seus filhos, e delega dados/erros diretamente
 * para as propriedades dos Custom Elements.
 *
 * A comunicação de eventos (adicionar, deletar, filtrar) agora flui via
 * CustomEvent nativos despachados pelos próprios Custom Elements, escutados
 * pelo FinanceController no document.
 */
export class FinanceView {
  constructor() {
    /**
     * Elemento raiz Custom Element da aplicação.
     * @type {HTMLElement}
     */
    this.root = document.querySelector('finance-dashboard');

    if (!this.root) {
      throw new Error('[FinanceView] <finance-dashboard> não encontrado no DOM. Verifique o index.html.');
    }
  }

  // ─── Referências aos Custom Elements filhos ───────────────────────────────

  /** @returns {HTMLElement} */
  get _form() { return this.root.transactionForm; }

  /** @returns {HTMLElement} */
  get _distribution() { return this.root.categoryDistribution; }

  /** @returns {HTMLElement} */
  get _list() { return this.root.transactionsList; }

  /** @returns {HTMLElement} */
  get _productsPage() { return this.root.productsPage; }

  // ─── Binding de CustomEvents (interface MVC preservada) ───────────────────

  /**
   * Registra o handler para o evento nativo `transaction:add`
   * despachado pelo `<transaction-form>`.
   * @param {Function} handler - `(data: Object) => void`
   */
  bindAddTransaction(handler) {
    document.addEventListener('transaction:add', (e) => {
      try {
        handler(e.detail);
        // Limpa o formulário após submissão bem-sucedida
        this._form?.resetInputs();
      } catch (err) {
        this.showError(err.message);
      }
    });
  }

  /**
   * Registra o handler para o evento nativo `transaction:delete`
   * despachado pelo `<transactions-list>`.
   * @param {Function} handler - `(id: number) => void`
   */
  bindDeleteTransaction(handler) {
    document.addEventListener('transaction:delete', (e) => {
      handler(e.detail.id);
    });
  }

  /**
   * Registra o handler para o evento nativo `transaction:filter`
   * despachado pelo `<transactions-list>`.
   * @param {Function} handler - `({ filter: string, query: string }) => void`
   */
  bindFilterChange(handler) {
    document.addEventListener('transaction:filter', (e) => {
      handler(e.detail);
    });
  }

  /**
   * Registra o handler para o evento nativo `page:change`
   * despachado pelo `<finance-dashboard>` ao clicar no menu lateral.
   * @param {Function} handler - `({ page: string }) => void`
   */
  bindPageChange(handler) {
    document.addEventListener('page:change', (e) => {
      handler(e.detail);
    });
  }

  // ─── Exibição de erros ────────────────────────────────────────────────────

  /**
   * Delega a exibição de erros de validação ao componente `<transaction-form>`.
   * @param {string} message - Mensagem de erro a exibir.
   */
  showError(message) {
    this._form?.showError(message);
  }

  // ─── Renderização (atualização de propriedades dos componentes) ───────────

  /**
   * Atualiza todos os Custom Elements filhos com os dados mais recentes.
   * Este método substitui o antigo `render()` monolítico, delegando
   * cada pedaço de dados ao componente responsável.
   *
   * @param {Array.<Object>} transactions - Transações filtradas a exibir.
   * @param {{balance: number, income: number, expense: number}} totals - Totais calculados.
   * @param {Object} categoryDistribution - Distribuição de despesas por categoria.
   * @param {string} [activeFilter='all'] - Filtro ativo atual.
   * @param {string} [searchQuery=''] - Query de busca atual.
   */
  render(transactions, totals, categoryDistribution, activeFilter = 'all', searchQuery = '') {
    const { root } = this;

    // 1. Atualiza os cards de resumo via atributos HTML observados
    root.cardBalance?.setAttribute('value', String(totals.balance));
    root.cardIncome?.setAttribute('value', String(totals.income));
    root.cardExpense?.setAttribute('value', String(totals.expense));

    // 2. Atualiza as barras de categoria via setter JavaScript
    if (this._distribution) {
      this._distribution.distribution = categoryDistribution;
    }

    // 3. Atualiza a lista de transações via setters JavaScript
    if (this._list) {
      this._list.activeFilter = activeFilter;
      this._list.searchQuery = searchQuery;
      this._list.transactions = transactions; // setter dispara re-render das linhas
    }
  }

  /**
   * Delega a lista de produtos ao componente `<products-page>`,
   * que re-renderiza os cartões na seção de Produtos.
   * @param {Array.<{id: number, name: string, price: number, stock: number}>} products - Produtos a exibir.
   */
  renderProducts(products) {
    if (this._productsPage) {
      this._productsPage.products = products; // setter dispara re-render dos cartões
    }
  }
}
