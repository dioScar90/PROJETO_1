/**
 * Mapa de configurações visuais para cada tipo de card financeiro.
 * @type {Object.<string, {label: string, iconPath: string, colorClass: string, badgeClass: string, glowClass: string, subtitleFn: Function}>}
 */
const TYPE_CONFIG = {
  balance: {
    label: 'Saldo Disponível',
    iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    bgIconPath: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    colorClass: 'text-white',
    badgeClass: 'bg-cyan-500/10 text-cyan-400',
    glowClass: 'glow-cyan',
    bgIconColor: 'text-cyan-500/5',
    getSubtitle: (value) => value >= 0
      ? '<span class="text-emerald-400 font-medium">Saúde financeira positiva</span>'
      : '<span class="text-rose-400 font-medium">Atenção ao saldo negativo</span>'
  },
  income: {
    label: 'Total Receitas',
    iconPath: 'M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z',
    bgIconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    colorClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-400',
    glowClass: 'glow-emerald',
    bgIconColor: 'text-emerald-500/5',
    getSubtitle: () => 'Ganhos acumulados no período'
  },
  expense: {
    label: 'Total Despesas',
    iconPath: 'M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z',
    bgIconPath: 'M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6',
    colorClass: 'text-rose-400',
    badgeClass: 'bg-rose-500/10 text-rose-400',
    glowClass: 'glow-rose',
    bgIconColor: 'text-rose-500/5',
    getSubtitle: () => 'Gastos totais no período'
  }
};

/**
 * Custom Element `<summary-card>` que exibe um card de resumo financeiro (Saldo, Receitas ou Despesas).
 *
 * Atributos observados:
 * - `type`: 'balance' | 'income' | 'expense'
 * - `value`: valor numérico como string (ex: "3650.50")
 *
 * @extends HTMLElement
 */
export class SummaryCard extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'value'];
  }

  constructor() {
    super();
    this._value = 0;
    this._type = 'balance';
  }

  connectedCallback() {
    this._render();
  }

  /**
   * Reage às mudanças de atributos recalculando a renderização.
   * @param {string} name - Nome do atributo alterado.
   * @param {string} oldVal - Valor anterior.
   * @param {string} newVal - Novo valor.
   */
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    if (name === 'value') {
      this._value = parseFloat(newVal) || 0;
    } else if (name === 'type') {
      this._type = newVal;
    }

    // Re-renderiza somente se já estiver conectado ao DOM
    if (this.isConnected) {
      this._render();
    }
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
   * Renderiza o template HTML interno do card.
   * @private
   */
  _render() {
    const config = TYPE_CONFIG[this._type] || TYPE_CONFIG.balance;

    this.innerHTML = `
      <div class="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-6 ${config.glowClass} transition-all duration-300 hover:border-slate-700/80 h-full">
        <!-- Ícone de fundo decorativo -->
        <div class="absolute -right-4 -bottom-4 ${config.bgIconColor} pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${config.bgIconPath}" />
          </svg>
        </div>

        <!-- Cabeçalho com label e ícone de badge -->
        <div class="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">
          <span>${config.label}</span>
          <span class="p-1.5 rounded-lg ${config.badgeClass}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${config.iconPath}" />
            </svg>
          </span>
        </div>

        <!-- Valor principal -->
        <div class="text-3xl font-extrabold ${config.colorClass} tracking-tight">
          ${this._formatCurrency(this._value)}
        </div>

        <!-- Subtítulo / indicador de estado -->
        <div class="text-xs text-slate-500 mt-2">
          ${config.getSubtitle(this._value)}
        </div>
      </div>
    `;
  }
}
