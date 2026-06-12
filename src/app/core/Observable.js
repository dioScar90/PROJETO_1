/**
 * Classe base que implementa o padrão Observer (PubSub) para gerenciar
 * as atualizações de estado de forma reativa entre Model, View e Controller.
 */
export class Observable {
  constructor() {
    /**
     * Objeto contendo os arrays de ouvintes associados a cada evento.
     * @type {Object.<string, Array.<Function>>}
     * @private
     */
    this._observers = {};
  }

  /**
   * Registra um callback para ouvir um evento específico.
   * @param {string} event - O nome do evento a escutar.
   * @param {Function} callback - A função chamada quando o evento ocorre.
   * @returns {void}
   */
  subscribe(event, callback) {
    if (!this._observers[event]) {
      this._observers[event] = [];
    }
    this._observers[event].push(callback);
  }

  /**
   * Notifica todos os ouvintes registrados para um determinado evento.
   * @param {string} event - O nome do evento a disparar.
   * @param {*} data - Os dados que serão passados aos ouvintes.
   * @returns {void}
   */
  notify(event, data) {
    if (this._observers[event]) {
      this._observers[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro ao disparar callback para o evento "${event}":`, error);
        }
      });
    }
  }
}
