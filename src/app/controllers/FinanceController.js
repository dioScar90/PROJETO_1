/**
 * Controller que intermedia as interações entre o FinanceModel e a FinanceView.
 *
 * Com a migração para Web Components, os eventos de interação do usuário
 * (adicionar, deletar, filtrar transações) são despachados como CustomEvents
 * nativos pelos próprios Custom Elements, capturados pela FinanceView e
 * repassados para este Controller via callbacks registrados no `constructor`.
 */
export class FinanceController {
  /**
   * Construtor do Controller.
   * @param {FinanceModel} model - Instância do modelo.
   * @param {FinanceView} view - Instância da view bridge que coordena os Custom Elements.
   */
  constructor(model, view) {
    this.model = model;
    this.view = view;

    // Estado local de filtro e busca gerenciados pelo Controller
    this._activeFilter = 'all';
    this._searchQuery = '';

    // Ciclo reativo: quando o Model emitir 'transactions:updated', re-renderizar
    this.model.subscribe('transactions:updated', () => this.handleRefresh());

    // Vincula os CustomEvents do DOM (despachados pelos Custom Elements filhos)
    // via os métodos bind* da FinanceView, preservando a interface MVC
    this.view.bindAddTransaction((data) => this.handleAddTransaction(data));
    this.view.bindDeleteTransaction((id) => this.handleDeleteTransaction(id));
    this.view.bindFilterChange((filterState) => this.handleFilterChange(filterState));
    this.view.bindPageChange(({ page }) => this.handlePageChange(page));
  }


  /**
   * Inicializa a aplicação carregando os dados e renderizando a interface inicial.
   * @returns {Promise.<void>}
   */
  async init() {
    this.handleRefresh();
  }

  /**
   * Adiciona uma nova transação financeira via Model.
   * @param {Object} data - Dados da transação (title, amount, type, category, date).
   */
  handleAddTransaction(data) {
    try {
      this.model.addTransaction(
        data.title,
        data.amount,
        data.type,
        data.category,
        data.date
      );
    } catch (error) {
      // Exibe o erro na UI
      this.view.showError(error.message);
    }
  }

  /**
   * Deleta uma transação via Model.
   * @param {number} id - ID da transação a ser deletada.
   */
  handleDeleteTransaction(id) {
    try {
      this.model.deleteTransaction(id);
    } catch (error) {
      this.view.showError('Não foi possível excluir a transação.');
    }
  }

  /**
   * Trata a navegação entre páginas do menu lateral. Ao entrar na página
   * de Produtos, busca a lista no Model e ordena que a View a desenhe.
   * @param {string} page - Identificador da página ativa ('dashboard' | 'produtos').
   */
  handlePageChange(page) {
    if (page === 'produtos') {
      this.view.renderProducts(this.model.products);
    }
  }

  /**
   * Trata a alteração de filtros de exibição (tipo e busca).
   * @param {{filter: string, query: string}} filterState - Estado do filtro ativo.
   */
  handleFilterChange(filterState) {
    this._activeFilter = filterState.filter;
    this._searchQuery = filterState.query;
    this.handleRefresh();
  }

  /**
   * Atualiza a renderização da View com os dados filtrados.
   * @private
   */
  handleRefresh() {
    const allTransactions = this.model.transactions;
    const totals = this.model.getTotals();
    const categoryDistribution = this.model.getCategoryDistribution();

    // Filtra transações baseando-se no tipo (income/expense/all) e na busca textual
    const filteredTransactions = allTransactions.filter(t => {
      // 1. Filtro por tipo
      const matchesType = this._activeFilter === 'all' || t.type === this._activeFilter;

      // 2. Filtro por busca textual (no título ou categoria)
      const query = this._searchQuery.toLowerCase().trim();
      const matchesQuery = query === '' || 
        t.title.toLowerCase().includes(query) || 
        t.category.toLowerCase().includes(query);

      return matchesType && matchesQuery;
    });

    // Renderiza a view com a lista filtrada, mas mantendo totais e distribuição globais
    this.view.render(
      filteredTransactions,
      totals,
      categoryDistribution,
      this._activeFilter,
      this._searchQuery
    );
  }
}
