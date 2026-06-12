import { Observable } from '../core/Observable.js';

/**
 * Model que gerencia os dados financeiros da aplicação, incluindo transações,
 * cálculos de saldo, receitas, despesas e distribuição de categorias.
 * @extends Observable
 */
export class FinanceModel extends Observable {
  constructor() {
    super();
    /**
     * Lista interna de transações financeiras.
     * @type {Array.<{id: number, title: string, amount: number, type: 'income'|'expense', category: string, date: string}>}
     * @private
     */
    this._transactions = [];
    this._loadFromLocalStorage();

    /**
     * Catálogo de produtos exibido na página "Produtos".
     * @type {Array.<{id: number, name: string, price: number, stock: number}>}
     * @private
     */
    this._products = [
      { id: 1, name: 'Teclado Mecânico Antigravity K1', price: 489.90, stock: 12 },
      { id: 2, name: 'Mouse Óptico Zero-G Pro', price: 259.00, stock: 30 },
      { id: 3, name: 'Headset Orbital Surround 7.1', price: 699.50, stock: 5 },
      { id: 4, name: 'Hub USB-C Gravity Dock', price: 349.90, stock: 18 }
    ];
  }

  /**
   * Retorna uma cópia das transações.
   * @returns {Array.<Object>} Lista de transações.
   */
  get transactions() {
    return [...this._transactions];
  }

  /**
   * Retorna uma cópia da lista de produtos cadastrados.
   * @returns {Array.<{id: number, name: string, price: number, stock: number}>} Lista de produtos.
   */
  get products() {
    return [...this._products];
  }

  /**
   * Carrega as transações salvas do localStorage.
   * @private
   */
  _loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('antigravity_finance_transactions');
      if (data) {
        this._transactions = JSON.parse(data);
      } else {
        // Dados de exemplo (semente inicial) para wow effect na primeira carga
        this._transactions = [
          { id: 1, title: 'Salário Google Core', amount: 8500.00, type: 'income', category: 'Trabalho', date: '2026-06-01' },
          { id: 2, title: 'Aluguel Loft Central', amount: 2200.00, type: 'expense', category: 'Moradia', date: '2026-06-02' },
          { id: 3, title: 'Supermercado Orgânico', amount: 650.30, type: 'expense', category: 'Alimentação', date: '2026-06-05' },
          { id: 4, title: 'Freelance Design UI', amount: 1500.00, type: 'income', category: 'Freelance', date: '2026-06-07' },
          { id: 5, title: 'Assinatura Antigravity API', amount: 149.90, type: 'expense', category: 'Assinaturas', date: '2026-06-09' },
          { id: 6, title: 'Gasolina Viagem', amount: 250.00, type: 'expense', category: 'Transporte', date: '2026-06-10' }
        ];
        this._saveToLocalStorage();
      }
    } catch (error) {
      console.error('Falha ao carregar transações do localStorage:', error);
      this._transactions = [];
    }
  }

  /**
   * Salva o estado atual das transações no localStorage.
   * @private
   */
  _saveToLocalStorage() {
    try {
      localStorage.setItem('antigravity_finance_transactions', JSON.stringify(this._transactions));
    } catch (error) {
      console.error('Falha ao salvar transações no localStorage:', error);
    }
  }

  /**
   * Calcula e retorna os totais financeiros (Saldo, Receitas, Despesas).
   * @returns {{balance: number, income: number, expense: number}} Totais calculados.
   */
  getTotals() {
    const income = this._transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = this._transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    return { balance, income, expense };
  }

  /**
   * Adiciona uma nova transação financeira.
   * @param {string} title - Descrição ou título da transação.
   * @param {number} amount - Valor monetário da transação.
   * @param {'income'|'expense'} type - Tipo da transação.
   * @param {string} category - Categoria.
   * @param {string} date - Data da transação (YYYY-MM-DD).
   * @throws {Error} Se algum dado for inválido.
   * @returns {void}
   */
  addTransaction(title, amount, type, category, date) {
    if (!title || title.trim() === '') {
      throw new Error('O título da transação é obrigatório.');
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('O valor da transação deve ser um número maior que zero.');
    }
    if (type !== 'income' && type !== 'expense') {
      throw new Error('O tipo da transação deve ser "income" (receita) ou "expense" (despesa).');
    }
    if (!category || category.trim() === '') {
      throw new Error('A categoria da transação é obrigatória.');
    }
    if (!date) {
      throw new Error('A data da transação é obrigatória.');
    }

    const newTransaction = {
      id: Date.now(),
      title: title.trim(),
      amount: numAmount,
      type,
      category: category.trim(),
      date
    };

    this._transactions.push(newTransaction);
    // Ordena transações por data decrescente (mais recentes primeiro)
    this._transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    this._saveToLocalStorage();
    this.notify('transactions:updated', this.transactions);
  }

  /**
   * Remove uma transação financeira pelo ID.
   * @param {number} id - ID da transação a ser removida.
   * @returns {boolean} True se a transação foi removida com sucesso, false caso contrário.
   */
  deleteTransaction(id) {
    const initialLength = this._transactions.length;
    this._transactions = this._transactions.filter(t => t.id !== id);

    if (this._transactions.length !== initialLength) {
      this._saveToLocalStorage();
      this.notify('transactions:updated', this.transactions);
      return true;
    }
    return false;
  }

  /**
   * Calcula a distribuição de despesas por categoria.
   * @returns {Object.<string, {amount: number, percentage: number}>} Distribuição por categoria.
   */
  getCategoryDistribution() {
    const expenses = this._transactions.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const distribution = {};

    expenses.forEach(t => {
      if (!distribution[t.category]) {
        distribution[t.category] = { amount: 0, percentage: 0 };
      }
      distribution[t.category].amount += t.amount;
    });

    if (totalExpense > 0) {
      Object.keys(distribution).forEach(category => {
        distribution[category].percentage = parseFloat(
          ((distribution[category].amount / totalExpense) * 100).toFixed(1)
        );
      });
    }

    return distribution;
  }
}
