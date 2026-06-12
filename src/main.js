import './styles/main.css';

// ── Registro dos Custom Elements (Web Components) ─────────────────────────────
// Todos os elementos devem ser registrados antes do bootstrap do MVC para que
// o browser reconheça as tags ao processar o HTML injetado pelo FinanceDashboard.
import { SummaryCard }           from './app/components/SummaryCard.js';
import { TransactionForm }        from './app/components/TransactionForm.js';
import { CategoryDistribution }   from './app/components/CategoryDistribution.js';
import { TransactionsList }       from './app/components/TransactionsList.js';
import { ProductsPage }           from './app/components/ProductsPage.js';
import { FinanceDashboard }       from './app/components/FinanceDashboard.js';

customElements.define('summary-card',          SummaryCard);
customElements.define('transaction-form',      TransactionForm);
customElements.define('category-distribution', CategoryDistribution);
customElements.define('transactions-list',     TransactionsList);
customElements.define('products-page',         ProductsPage);
customElements.define('finance-dashboard',     FinanceDashboard);

// ── Bootstrap MVC ─────────────────────────────────────────────────────────────
import { FinanceModel }      from './app/models/FinanceModel.js';
import { FinanceView }       from './app/views/FinanceView.js';
import { FinanceController } from './app/controllers/FinanceController.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const model      = new FinanceModel();
    const view       = new FinanceView();          // obtém referência ao <finance-dashboard>
    const controller = new FinanceController(model, view);

    await controller.init();

    console.info('[Antigravity Finance] Dashboard inicializado com sucesso via Web Components.');
  } catch (error) {
    console.error('[Antigravity Finance] Falha crítica na inicialização:', error);
  }
});
