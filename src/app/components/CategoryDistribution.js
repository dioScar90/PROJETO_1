import { sanitizeHTML } from '../views/sanitizeHelper.js';

/**
 * Mapa de gradientes para cada categoria de despesa.
 * @type {Object.<string, string>}
 */
const CATEGORY_COLORS = {
  'Alimentação': 'from-amber-400 to-orange-500',
  'Moradia': 'from-indigo-400 to-blue-600',
  'Transporte': 'from-cyan-400 to-teal-500',
  'Trabalho': 'from-emerald-400 to-green-500',
  'Freelance': 'from-purple-400 to-pink-500',
  'Lazer': 'from-rose-400 to-red-500',
  'Assinaturas': 'from-violet-400 to-fuchsia-600',
  'Outros': 'from-slate-400 to-slate-600'
};

const DEFAULT_COLOR = 'from-cyan-400 to-indigo-500';

/**
 * Custom Element `<category-distribution>` que exibe as barras de progresso
 * da distribuição de despesas por categoria.
 *
 * Propriedades:
 * - `distribution` (setter) → recebe `Object.<string, {amount: number, percentage: number}>`
 *   e aciona re-renderização automática.
 *
 * @extends HTMLElement
 */
export class CategoryDistribution extends HTMLElement {
  constructor() {
    super();
    /**
     * Estado interno da distribuição.
     * @type {Object.<string, {amount: number, percentage: number}>}
     * @private
     */
    this._distribution = {};
  }

  connectedCallback() {
    this._render();
  }

  /**
   * Define os dados de distribuição por categoria e aciona re-renderização.
   * @param {Object.<string, {amount: number, percentage: number}>} data
   */
  set distribution(data) {
    this._distribution = data || {};
    if (this.isConnected) {
      this._render();
    }
  }

  /**
   * Retorna a distribuição de categorias atual.
   * @returns {Object.<string, {amount: number, percentage: number}>}
   */
  get distribution() {
    return this._distribution;
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
   * Renderiza as barras de progresso por categoria.
   * @private
   */
  _render() {
    const entries = Object.entries(this._distribution)
      .sort((a, b) => b[1].amount - a[1].amount);

    const barsHTML = entries.length > 0
      ? entries.map(([category, data]) => {
          const color = CATEGORY_COLORS[category] || DEFAULT_COLOR;
          return `
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs font-medium text-slate-300">
                <span>${sanitizeHTML(category)}</span>
                <span class="text-slate-400">${this._formatCurrency(data.amount)} (${data.percentage}%)</span>
              </div>
              <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700"
                     style="width: ${data.percentage}%">
                </div>
              </div>
            </div>
          `;
        }).join('')
      : `<p class="text-xs text-slate-500 text-center py-6">
           Adicione despesas para visualizar a distribuição por categoria.
         </p>`;

    this.innerHTML = `
      <div class="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-4">
        <h2 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-indigo-500"></span>
          Distribuição de Despesas
        </h2>
        <div class="space-y-4" id="category-bars">
          ${barsHTML}
        </div>
      </div>
    `;
  }
}
