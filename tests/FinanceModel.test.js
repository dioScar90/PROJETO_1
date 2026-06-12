import { describe, it, expect, beforeEach } from 'vitest';
import { FinanceModel } from '../src/app/models/FinanceModel.js';

describe('FinanceModel Unit Tests', () => {
  beforeEach(() => {
    // Limpa o localStorage antes de cada teste para garantir isolamento
    localStorage.clear();
  });

  it('deve inicializar com dados semente (default) quando o localStorage estiver vazio', () => {
    const model = new FinanceModel();
    const txs = model.transactions;
    
    expect(txs.length).toBeGreaterThan(0);
    expect(txs[0]).toHaveProperty('title');
    expect(txs[0]).toHaveProperty('amount');
    expect(txs[0]).toHaveProperty('type');
    expect(txs[0]).toHaveProperty('category');
    expect(txs[0]).toHaveProperty('date');
  });

  it('deve adicionar uma transação de receita com sucesso e disparar notificação', () => {
    const model = new FinanceModel();
    let eventFired = false;
    let updatedTransactions = [];

    model.subscribe('transactions:updated', (data) => {
      eventFired = true;
      updatedTransactions = data;
    });

    model.addTransaction('Salário Freelance B', 3200.50, 'income', 'Freelance', '2026-06-11');

    expect(eventFired).toBe(true);
    // Deve ser a primeira da lista porque as transações são ordenadas por data descrescente (e 2026-06-11 é a data mais recente)
    expect(updatedTransactions[0].title).toBe('Salário Freelance B');
    expect(updatedTransactions[0].amount).toBe(3200.50);
    expect(updatedTransactions[0].type).toBe('income');
  });

  it('deve lançar exceção ao tentar adicionar transação com dados inválidos', () => {
    const model = new FinanceModel();

    // Título vazio
    expect(() => {
      model.addTransaction('', 100, 'income', 'Trabalho', '2026-06-11');
    }).toThrow('O título da transação é obrigatório.');

    // Valor zero
    expect(() => {
      model.addTransaction('Almoço', 0, 'expense', 'Alimentação', '2026-06-11');
    }).toThrow('O valor da transação deve ser um número maior que zero.');

    // Valor negativo
    expect(() => {
      model.addTransaction('Almoço', -50, 'expense', 'Alimentação', '2026-06-11');
    }).toThrow('O valor da transação deve ser um número maior que zero.');

    // Tipo inválido
    expect(() => {
      model.addTransaction('Almoço', 50, 'invalid_type', 'Alimentação', '2026-06-11');
    }).toThrow('O tipo da transação deve ser "income" (receita) ou "expense" (despesa).');

    // Categoria vazia
    expect(() => {
      model.addTransaction('Almoço', 50, 'expense', '  ', '2026-06-11');
    }).toThrow('A categoria da transação é obrigatória.');

    // Sem data
    expect(() => {
      model.addTransaction('Almoço', 50, 'expense', 'Alimentação', '');
    }).toThrow('A data da transação é obrigatória.');
  });

  it('deve calcular corretamente os totais de Saldo, Receitas e Despesas', () => {
    // Configura um estado limpo no localStorage para não usar dados semente randômicos
    const customTxs = [
      { id: 1, title: 'Salário', amount: 5000, type: 'income', category: 'Trabalho', date: '2026-06-01' },
      { id: 2, title: 'Mercado', amount: 1200, type: 'expense', category: 'Alimentação', date: '2026-06-02' },
      { id: 3, title: 'Internet', amount: 150, type: 'expense', category: 'Assinaturas', date: '2026-06-03' }
    ];
    localStorage.setItem('antigravity_finance_transactions', JSON.stringify(customTxs));

    const model = new FinanceModel();
    const totals = model.getTotals();

    expect(totals.income).toBe(5000);
    expect(totals.expense).toBe(1350);
    expect(totals.balance).toBe(3650);
  });

  it('deve remover uma transação pelo ID com sucesso', () => {
    const customTxs = [
      { id: 100, title: 'Salário', amount: 5000, type: 'income', category: 'Trabalho', date: '2026-06-01' },
      { id: 101, title: 'Mercado', amount: 1200, type: 'expense', category: 'Alimentação', date: '2026-06-02' }
    ];
    localStorage.setItem('antigravity_finance_transactions', JSON.stringify(customTxs));

    const model = new FinanceModel();
    let eventFired = false;
    model.subscribe('transactions:updated', () => {
      eventFired = true;
    });

    const deleted = model.deleteTransaction(100);

    expect(deleted).toBe(true);
    expect(model.transactions.length).toBe(1);
    expect(model.transactions[0].id).toBe(101);
    expect(eventFired).toBe(true);
  });

  it('deve retornar a distribuição correta de despesas por categoria', () => {
    const customTxs = [
      { id: 1, title: 'Salário', amount: 5000, type: 'income', category: 'Trabalho', date: '2026-06-01' },
      { id: 2, title: 'Mercado', amount: 300, type: 'expense', category: 'Alimentação', date: '2026-06-02' },
      { id: 3, title: 'Almoço', amount: 100, type: 'expense', category: 'Alimentação', date: '2026-06-03' },
      { id: 4, title: 'Combustível', amount: 100, type: 'expense', category: 'Transporte', date: '2026-06-04' }
    ];
    localStorage.setItem('antigravity_finance_transactions', JSON.stringify(customTxs));

    const model = new FinanceModel();
    const dist = model.getCategoryDistribution();

    // Total de despesas = 300 (Mercado) + 100 (Almoço) + 100 (Combustível) = 500
    // Alimentação = 400 (80%)
    // Transporte = 100 (20%)
    expect(dist['Alimentação']).toBeDefined();
    expect(dist['Alimentação'].amount).toBe(400);
    expect(dist['Alimentação'].percentage).toBe(80);

    expect(dist['Transporte']).toBeDefined();
    expect(dist['Transporte'].amount).toBe(100);
    expect(dist['Transporte'].percentage).toBe(20);
  });

  it('deve expor o catálogo de produtos com nome, preço e estoque', () => {
    const model = new FinanceModel();
    const products = model.products;

    expect(products.length).toBeGreaterThanOrEqual(3);
    expect(products[0]).toHaveProperty('id');
    expect(products[0]).toHaveProperty('name');
    expect(products[0]).toHaveProperty('price');
    expect(products[0]).toHaveProperty('stock');
  });

  it('o getter products deve retornar uma cópia, protegendo o estado interno', () => {
    const model = new FinanceModel();
    const copy = model.products;

    copy.pop();

    expect(model.products.length).toBe(copy.length + 1);
  });
});
