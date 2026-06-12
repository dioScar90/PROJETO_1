import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Registro dos Custom Elements no ambiente JSDOM ────────────────────────────
// Necessário pois o Vitest com jsdom não processa módulos ES de forma automática
import { SummaryCard }          from '../src/app/components/SummaryCard.js';
import { TransactionForm }       from '../src/app/components/TransactionForm.js';
import { CategoryDistribution }  from '../src/app/components/CategoryDistribution.js';
import { TransactionsList }      from '../src/app/components/TransactionsList.js';
import { ProductsPage }          from '../src/app/components/ProductsPage.js';
import { FinanceDashboard }      from '../src/app/components/FinanceDashboard.js';
import { FinanceView }           from '../src/app/views/FinanceView.js';

// Registra os Custom Elements apenas se ainda não estiverem definidos
if (!customElements.get('summary-card'))          customElements.define('summary-card',          SummaryCard);
if (!customElements.get('transaction-form'))      customElements.define('transaction-form',      TransactionForm);
if (!customElements.get('category-distribution')) customElements.define('category-distribution', CategoryDistribution);
if (!customElements.get('transactions-list'))     customElements.define('transactions-list',     TransactionsList);
if (!customElements.get('products-page'))         customElements.define('products-page',         ProductsPage);
if (!customElements.get('finance-dashboard'))     customElements.define('finance-dashboard',     FinanceDashboard);

// ─────────────────────────────────────────────────────────────────────────────

describe('FinanceDashboard Custom Element', () => {
  let dashboard;

  beforeEach(() => {
    document.body.innerHTML = '<finance-dashboard></finance-dashboard>';
    dashboard = document.querySelector('finance-dashboard');
  });

  it('deve renderizar o header com título da aplicação', () => {
    expect(dashboard.innerHTML).toContain('Antigravity Finance');
    expect(dashboard.innerHTML).toContain('Web Components');
  });

  it('deve incluir os três <summary-card> no DOM após render', () => {
    const cards = dashboard.querySelectorAll('summary-card');
    expect(cards.length).toBe(3);
    expect(dashboard.querySelector('summary-card[type="balance"]')).not.toBeNull();
    expect(dashboard.querySelector('summary-card[type="income"]')).not.toBeNull();
    expect(dashboard.querySelector('summary-card[type="expense"]')).not.toBeNull();
  });

  it('deve incluir os componentes <transaction-form>, <category-distribution> e <transactions-list>', () => {
    expect(dashboard.querySelector('transaction-form')).not.toBeNull();
    expect(dashboard.querySelector('category-distribution')).not.toBeNull();
    expect(dashboard.querySelector('transactions-list')).not.toBeNull();
  });

  it('os getters de referência devem retornar os elementos corretos', () => {
    expect(dashboard.cardBalance).toBe(dashboard.querySelector('summary-card[type="balance"]'));
    expect(dashboard.transactionForm).toBe(dashboard.querySelector('transaction-form'));
    expect(dashboard.transactionsList).toBe(dashboard.querySelector('transactions-list'));
    expect(dashboard.productsPage).toBe(dashboard.querySelector('products-page'));
  });

  it('deve renderizar o menu lateral com botões Dashboard e Produtos e a seção de produtos oculta', () => {
    const navButtons = dashboard.querySelectorAll('.nav-btn');
    expect(navButtons.length).toBe(2);
    expect(dashboard.querySelector('.nav-btn[data-page="produtos"]').textContent).toContain('Produtos');

    expect(dashboard.querySelector('#page-dashboard').classList.contains('hidden')).toBe(false);
    expect(dashboard.querySelector('#page-produtos').classList.contains('hidden')).toBe(true);
  });

  it('deve alternar a visibilidade das páginas e destacar o botão ativo ao clicar no menu', () => {
    const produtosBtn = dashboard.querySelector('.nav-btn[data-page="produtos"]');
    produtosBtn.click();

    expect(dashboard.querySelector('#page-produtos').classList.contains('hidden')).toBe(false);
    expect(dashboard.querySelector('#page-dashboard').classList.contains('hidden')).toBe(true);
    expect(produtosBtn.getAttribute('aria-current')).toBe('page');
    expect(produtosBtn.className).toContain('text-cyan-400');
  });

  it('deve despachar CustomEvent page:change ao clicar em um botão do menu', () => {
    const handler = vi.fn();
    dashboard.addEventListener('page:change', handler);

    dashboard.querySelector('.nav-btn[data-page="produtos"]').click();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].detail.page).toBe('produtos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('SummaryCard Custom Element', () => {
  it('deve renderizar o card de saldo com o valor formatado em BRL', () => {
    document.body.innerHTML = '<summary-card type="balance" value="3650.50"></summary-card>';
    const card = document.querySelector('summary-card');
    expect(card.innerHTML).toContain('3.650,50');
    expect(card.innerHTML).toContain('Saldo Disponível');
    expect(card.innerHTML).toContain('Saúde financeira positiva');
  });

  it('deve renderizar o card de receita com cor emerald', () => {
    document.body.innerHTML = '<summary-card type="income" value="5000"></summary-card>';
    const card = document.querySelector('summary-card');
    expect(card.innerHTML).toContain('Total Receitas');
    expect(card.innerHTML).toContain('text-emerald-400');
  });

  it('deve re-renderizar ao atualizar o atributo value', () => {
    document.body.innerHTML = '<summary-card type="expense" value="100"></summary-card>';
    const card = document.querySelector('summary-card');
    expect(card.innerHTML).toContain('100,00');

    card.setAttribute('value', '999.99');
    expect(card.innerHTML).toContain('999,99');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('CategoryDistribution Custom Element', () => {
  let el;

  beforeEach(() => {
    document.body.innerHTML = '<category-distribution></category-distribution>';
    el = document.querySelector('category-distribution');
  });

  it('deve exibir texto padrão quando não há dados de distribuição', () => {
    expect(el.innerHTML).toContain('Adicione despesas para visualizar');
  });

  it('deve renderizar barras com larguras proporcionais ao percentual', () => {
    el.distribution = {
      'Alimentação': { amount: 800, percentage: 80 },
      'Transporte':  { amount: 200, percentage: 20 }
    };
    expect(el.innerHTML).toContain('width: 80%');
    expect(el.innerHTML).toContain('width: 20%');
    expect(el.innerHTML).toContain('Alimentação');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('TransactionsList Custom Element', () => {
  let el;

  beforeEach(() => {
    document.body.innerHTML = '<transactions-list></transactions-list>';
    el = document.querySelector('transactions-list');
  });

  it('deve exibir mensagem de lista vazia quando não há transações', () => {
    el.transactions = [];
    expect(el.querySelector('#transactions-tbody').innerHTML)
      .toContain('Nenhuma transação encontrada');
  });

  it('deve renderizar linhas para cada transação recebida via setter', () => {
    el.transactions = [
      { id: 1, title: 'Mercado Extra', amount: 250, type: 'expense', category: 'Alimentação', date: '2026-06-11' }
    ];
    const tbody = el.querySelector('#transactions-tbody');
    expect(tbody.innerHTML).toContain('Mercado Extra');
    expect(tbody.innerHTML).toContain('Alimentação');
    expect(tbody.innerHTML).toContain('data-id="1"');
  });

  it('deve despachar CustomEvent transaction:filter ao clicar em botão de filtro', () => {
    const handler = vi.fn();
    el.addEventListener('transaction:filter', handler);

    const btn = el.querySelector('.filter-btn[data-filter="income"]');
    btn.click();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].detail.filter).toBe('income');
  });

  it('deve despachar CustomEvent transaction:delete ao clicar no botão de excluir', () => {
    el.transactions = [
      { id: 42, title: 'Teste', amount: 10, type: 'expense', category: 'Outros', date: '2026-06-11' }
    ];

    const handler = vi.fn();
    el.addEventListener('transaction:delete', handler);

    // Mocka o confirm para retornar true automaticamente
    vi.stubGlobal('confirm', () => true);

    const btn = el.querySelector('.delete-tx-btn');
    btn.click();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].detail.id).toBe(42);

    vi.unstubAllGlobals();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('FinanceView Bridge', () => {
  beforeEach(() => {
    document.body.innerHTML = '<finance-dashboard></finance-dashboard>';
  });

  it('deve instanciar sem erros quando finance-dashboard está no DOM', () => {
    expect(() => new FinanceView()).not.toThrow();
  });

  it('o método render() deve atualizar o atributo value dos summary-cards', () => {
    const view = new FinanceView();
    const dashboard = document.querySelector('finance-dashboard');

    view.render(
      [],
      { balance: 1234.56, income: 2000, expense: 765.44 },
      {},
      'all',
      ''
    );

    expect(dashboard.cardBalance.getAttribute('value')).toBe('1234.56');
    expect(dashboard.cardIncome.getAttribute('value')).toBe('2000');
    expect(dashboard.cardExpense.getAttribute('value')).toBe('765.44');
  });

  it('o método renderProducts() deve delegar os produtos ao <products-page>', () => {
    const view = new FinanceView();
    const dashboard = document.querySelector('finance-dashboard');

    view.renderProducts([
      { id: 1, name: 'Teclado Mecânico', price: 489.90, stock: 12 }
    ]);

    expect(dashboard.productsPage.products.length).toBe(1);
    expect(dashboard.productsPage.innerHTML).toContain('Teclado Mecânico');
  });
});
