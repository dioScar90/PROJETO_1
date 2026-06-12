import { sanitizeHTML } from '../views/sanitizeHelper.js';

/**
 * Limite de unidades abaixo do qual o estoque é sinalizado como baixo.
 * @type {number}
 */
const LOW_STOCK_THRESHOLD = 10;

/**
 * Custom Element `<products-page>` que exibe o catálogo de produtos em
 * cartões com efeito visual de Glassmorphism.
 *
 * Propriedades (setter/getter):
 * - `products` → Array de produtos `{ id, name, price, stock }` a exibir.
 *
 * @extends HTMLElement
 */
export class ProductsPage extends HTMLElement {
  constructor() {
    super();
    /**
     * Estado interno da lista de produtos.
     * @type {Array.<{id: number, name: string, price: number, stock: number}>}
     * @private
     */
    this._products = [];
  }

  connectedCallback() {
    this._render();
  }

  /**
   * Define a lista de produtos e aciona re-renderização.
   * @param {Array.<{id: number, name: string, price: number, stock: number}>} data
   */
  set products(data) {
    this._products = data || [];
    if (this.isConnected) this._render();
  }

  /**
   * Retorna a lista de produtos atual.
   * @returns {Array.<{id: number, name: string, price: number, stock: number}>}
   */
  get products() {
    return this._products;
  }

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
   * Gera o HTML dos cartões de produto com efeito Glassmorphism.
   * @returns {string}
   * @private
   */
  _buildCardsHTML() {
    if (this._products.length === 0) {
      return `
        <p class="col-span-full text-sm text-slate-500 text-center py-10">
          Nenhum produto cadastrado no momento.
        </p>
      `;
    }

    return this._products.map(p => {
      const lowStock = p.stock < LOW_STOCK_THRESHOLD;
      const stockBadge = lowStock
        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

      return `
        <article class="product-card bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5
                        shadow-xl shadow-slate-950/40 space-y-4 transition-all duration-300
                        hover:bg-white/10 hover:-translate-y-1 hover:shadow-cyan-500/10">
          <div class="flex items-start justify-between gap-3">
            <h3 class="font-semibold text-slate-100 text-sm leading-snug">${sanitizeHTML(p.name)}</h3>
            <span class="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-600/20
                         border border-white/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-cyan-400" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
          </div>

          <div class="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            ${this._formatCurrency(p.price)}
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500">Em estoque</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full font-medium border ${stockBadge}">
              ${p.stock} un.
            </span>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * Renderiza a página completa de produtos.
   * @private
   */
  _render() {
    this.innerHTML = `
      <div class="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-6">
        <h2 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-cyan-500"></span>
          Gerenciamento de Produtos
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5" id="products-grid">
          ${this._buildCardsHTML()}
        </div>
      </div>
    `;
  }
}
