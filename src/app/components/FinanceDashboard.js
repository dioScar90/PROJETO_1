/**
 * Custom Element `<finance-dashboard>` — elemento raiz da SPA financeira.
 * Monta o layout principal (header, grid de cards, colunas) injetando os
 * Custom Elements filhos registrados e expõe referências a eles para a
 * camada de FinanceView.
 *
 * @extends HTMLElement
 */
export class FinanceDashboard extends HTMLElement {
  connectedCallback() {
    this._render();
    this._setupListeners();
  }

  // ─── Referências públicas aos filhos ──────────────────────────────────────

  /** @returns {HTMLElement} Card de saldo */
  get cardBalance() { return this.querySelector('summary-card[type="balance"]'); }

  /** @returns {HTMLElement} Card de receitas */
  get cardIncome() { return this.querySelector('summary-card[type="income"]'); }

  /** @returns {HTMLElement} Card de despesas */
  get cardExpense() { return this.querySelector('summary-card[type="expense"]'); }

  /** @returns {HTMLElement} Formulário de nova transação */
  get transactionForm() { return this.querySelector('transaction-form'); }

  /** @returns {HTMLElement} Distribuição de categorias */
  get categoryDistribution() { return this.querySelector('category-distribution'); }

  /** @returns {HTMLElement} Lista de transações */
  get transactionsList() { return this.querySelector('transactions-list'); }

  /** @returns {HTMLElement} Página de produtos */
  get productsPage() { return this.querySelector('products-page'); }

  // ─── Navegação entre páginas ──────────────────────────────────────────────

  /**
   * Alterna a visibilidade das páginas (seções) e destaca o botão ativo do menu.
   * @param {string} pageId - Identificador da página ('dashboard' | 'produtos').
   */
  showPage(pageId) {
    this.querySelectorAll('[data-page-section]').forEach(section => {
      section.classList.toggle('hidden', section.getAttribute('data-page-section') !== pageId);
    });
    this._updateNavButtons(pageId);
  }

  /**
   * Atualiza o estado visual dos botões do menu lateral.
   * @param {string} activePage - Página atualmente ativa.
   * @private
   */
  _updateNavButtons(activePage) {
    this.querySelectorAll('.nav-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-page') === activePage;
      btn.className = 'nav-btn w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all';
      btn.className += isActive
        ? ' bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
        : ' text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/60';
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  /**
   * Configura a delegação de eventos do menu lateral. Cada clique alterna a
   * página visível e despacha `page:change` para o FinanceController reagir.
   * @private
   */
  _setupListeners() {
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-btn');
      if (!btn) return;

      const page = btn.getAttribute('data-page');
      this.showPage(page);

      this.dispatchEvent(new CustomEvent('page:change', {
        detail: { page },
        bubbles: true,
        composed: true
      }));
    });
  }

  // ─── Renderização ─────────────────────────────────────────────────────────

  /**
   * Renderiza o layout completo do dashboard com os componentes filhos.
   * @private
   */
  _render() {
    this.innerHTML = `
      <!-- ── Header ───────────────────────────────────────────────────────── -->
      <header class="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <!-- Logo / Marca -->
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600
                        flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Antigravity Finance
              </h1>
              <p class="text-[10px] text-cyan-400 tracking-wider uppercase font-semibold">
                Engine Dashboard v2.4 · Web Components
              </p>
            </div>
          </div>

          <!-- Data do sistema -->
          <div class="text-right text-xs text-slate-400 hidden sm:block">
            <div>Data do Sistema</div>
            <div class="font-medium text-slate-200" id="system-date"></div>
          </div>
        </div>
      </header>

      <!-- ── Conteúdo Principal ─────────────────────────────────────────────── -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row gap-8 items-start">

          <!-- Menu Lateral de Navegação -->
          <aside class="w-full lg:w-52 shrink-0 lg:sticky lg:top-24">
            <nav class="flex lg:flex-col gap-2 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-2.5 shadow-xl"
                 aria-label="Navegação principal">
              <button class="nav-btn w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm"
                      data-page="dashboard" aria-current="page">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
              <button class="nav-btn w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/60"
                      data-page="produtos" aria-current="false">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Produtos
              </button>
            </nav>
          </aside>

          <!-- Páginas (alternadas pelo menu lateral) -->
          <div class="flex-1 min-w-0 w-full">

            <!-- Página: Dashboard Financeiro -->
            <section id="page-dashboard" data-page-section="dashboard" class="space-y-8" aria-label="Dashboard financeiro">

              <!-- Cards de Resumo -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Resumo financeiro">
                <summary-card type="balance" value="0"></summary-card>
                <summary-card type="income"  value="0"></summary-card>
                <summary-card type="expense" value="0"></summary-card>
              </div>

              <!-- Grid Principal: Formulário + Distribuição  |  Histórico -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                <!-- Coluna Esquerda -->
                <div class="space-y-8 lg:col-span-1">
                  <transaction-form></transaction-form>
                  <category-distribution></category-distribution>
                </div>

                <!-- Coluna Direita -->
                <div class="lg:col-span-2">
                  <transactions-list></transactions-list>
                </div>

              </div>
            </section>

            <!-- Página: Gerenciamento de Produtos -->
            <section id="page-produtos" data-page-section="produtos" class="hidden" aria-label="Gerenciamento de produtos">
              <products-page></products-page>
            </section>

          </div>
        </div>
      </main>

      <!-- ── Rodapé ──────────────────────────────────────────────────────────── -->
      <footer class="border-t border-slate-900 bg-slate-950 py-4 mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>&copy; 2026 Antigravity Finance. Todos os direitos reservados.</div>
          <div class="flex items-center gap-1.5">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Interface reativa por Web Components nativos · Antigravity Engine v2.4
          </div>
        </div>
      </footer>
    `;

    // Insere a data atual no header
    const dateEl = this.querySelector('#system-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    }
  }
}
