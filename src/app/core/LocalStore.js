/**
 * Lib local de persistência centralizada de dados.
 *
 * Seleciona automaticamente a primeira API de armazenamento nativa do
 * browser disponível, na seguinte ordem de prioridade:
 *
 *   1. IndexedDB
 *   2. CacheStorage
 *   3. LocalStorage
 *   4. SessionStorage
 *
 * Quando uma API não está disponível (ou falha no teste de uso), a
 * próxima da lista é tentada. Toda a API pública é assíncrona
 * (async/await), mesmo quando o backend subjacente é bloqueante.
 */

const DEFAULT_NAMESPACE = 'local-store';

/**
 * Calcula o tamanho aproximado de uma string em bytes (UTF-8).
 * @param {string} text - Texto a ser medido.
 * @returns {number} Quantidade de bytes.
 */
function byteSize(text) {
  return new TextEncoder().encode(text).length;
}

/**
 * Driver de persistência baseado em IndexedDB.
 */
export class IndexedDBDriver {
  /**
   * @param {string} namespace - Nome do banco de dados utilizado.
   */
  constructor(namespace) {
    this.name = 'indexedDB';
    this._dbName = namespace;
    this._storeName = 'keyval';
    this._db = null;
  }

  /**
   * Verifica se o IndexedDB existe e pode ser aberto neste ambiente.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    if (typeof indexedDB === 'undefined' || indexedDB === null) {
      return false;
    }
    try {
      await this._open();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Abre (e memoiza) a conexão com o banco de dados.
   * @returns {Promise<IDBDatabase>}
   * @private
   */
  _open() {
    if (this._db) {
      return Promise.resolve(this._db);
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this._dbName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(this._storeName);
      };
      request.onsuccess = () => {
        this._db = request.result;
        resolve(this._db);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Abertura do IndexedDB bloqueada por outra conexão.'));
    });
  }

  /**
   * Executa uma operação dentro de uma transação do object store.
   * @param {IDBTransactionMode} mode - Modo da transação.
   * @param {function(IDBObjectStore): IDBRequest} operation - Operação a executar.
   * @returns {Promise<*>} Resultado da request.
   * @private
   */
  async _run(mode, operation) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const store = db.transaction(this._storeName, mode).objectStore(this._storeName);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(key, value) {
    await this._run('readwrite', store => store.put(value, key));
  }

  async get(key) {
    return this._run('readonly', store => store.get(key));
  }

  async delete(key) {
    await this._run('readwrite', store => store.delete(key));
  }

  async clear() {
    await this._run('readwrite', store => store.clear());
  }

  async keys() {
    return this._run('readonly', store => store.getAllKeys());
  }

  async values() {
    return this._run('readonly', store => store.getAll());
  }

  async length() {
    return this._run('readonly', store => store.count());
  }
}

/**
 * Driver de persistência baseado em CacheStorage (API de Service Workers).
 * Os valores são serializados como respostas JSON dentro de um cache dedicado.
 */
export class CacheStorageDriver {
  /**
   * @param {string} namespace - Nome do cache utilizado.
   */
  constructor(namespace) {
    this.name = 'cacheStorage';
    this._cacheName = namespace;
    this._baseUrl = 'https://local-store.invalid/';
  }

  /**
   * Verifica se o CacheStorage existe e pode ser aberto (exige contexto seguro).
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    if (typeof caches === 'undefined' || caches === null) {
      return false;
    }
    try {
      await caches.open(this._cacheName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Converte uma chave em URL sintética usada como índice do cache.
   * @param {string} key - Chave do registro.
   * @returns {string} URL correspondente.
   * @private
   */
  _url(key) {
    return this._baseUrl + encodeURIComponent(key);
  }

  async put(key, value) {
    const cache = await caches.open(this._cacheName);
    const body = JSON.stringify({ value });
    await cache.put(this._url(key), new Response(body, {
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  async get(key) {
    const cache = await caches.open(this._cacheName);
    const response = await cache.match(this._url(key));
    if (!response) {
      return undefined;
    }
    const data = await response.json();
    return data.value;
  }

  async delete(key) {
    const cache = await caches.open(this._cacheName);
    await cache.delete(this._url(key));
  }

  async clear() {
    await caches.delete(this._cacheName);
  }

  async keys() {
    const cache = await caches.open(this._cacheName);
    const requests = await cache.keys();
    return requests.map(request => decodeURIComponent(request.url.slice(this._baseUrl.length)));
  }

  async values() {
    const allKeys = await this.keys();
    return Promise.all(allKeys.map(key => this.get(key)));
  }

  async length() {
    const allKeys = await this.keys();
    return allKeys.length;
  }
}

/**
 * Driver de persistência baseado em Web Storage (LocalStorage ou
 * SessionStorage). As chaves recebem um prefixo de namespace para não
 * conflitar com outros usos do storage pela aplicação.
 */
export class WebStorageDriver {
  /**
   * @param {string} namespace - Prefixo aplicado às chaves.
   * @param {'localStorage'|'sessionStorage'} storageName - Storage alvo.
   */
  constructor(namespace, storageName) {
    this.name = storageName;
    this._storageName = storageName;
    this._prefix = `${namespace}:`;
  }

  /**
   * Storage nativo subjacente (resolvido tardiamente para facilitar testes).
   * @returns {Storage}
   * @private
   */
  get _storage() {
    return globalThis[this._storageName];
  }

  /**
   * Verifica se o storage existe e aceita escrita (pode lançar em modo
   * privado ou com cota esgotada).
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const probeKey = `${this._prefix}__probe__`;
      this._storage.setItem(probeKey, '1');
      this._storage.removeItem(probeKey);
      return true;
    } catch {
      return false;
    }
  }

  async put(key, value) {
    this._storage.setItem(this._prefix + key, JSON.stringify({ value }));
  }

  async get(key) {
    const raw = this._storage.getItem(this._prefix + key);
    return raw === null ? undefined : JSON.parse(raw).value;
  }

  async delete(key) {
    this._storage.removeItem(this._prefix + key);
  }

  async clear() {
    const allKeys = await this.keys();
    allKeys.forEach(key => this._storage.removeItem(this._prefix + key));
  }

  async keys() {
    const result = [];
    for (let index = 0; index < this._storage.length; index += 1) {
      const rawKey = this._storage.key(index);
      if (rawKey !== null && rawKey.startsWith(this._prefix)) {
        result.push(rawKey.slice(this._prefix.length));
      }
    }
    return result;
  }

  async values() {
    const allKeys = await this.keys();
    return Promise.all(allKeys.map(key => this.get(key)));
  }

  async length() {
    const allKeys = await this.keys();
    return allKeys.length;
  }
}

/**
 * Fachada de persistência centralizada. Resolve o primeiro driver
 * disponível na ordem de prioridade e delega todas as operações a ele.
 */
export class LocalStore {
  /**
   * @param {Object} [options] - Opções de configuração.
   * @param {string} [options.namespace] - Namespace usado pelos drivers
   *   (nome do banco, do cache e prefixo de chaves).
   * @param {Array<Object>} [options.drivers] - Lista customizada de drivers,
   *   em ordem de prioridade (útil para testes).
   */
  constructor({ namespace = DEFAULT_NAMESPACE, drivers } = {}) {
    this._drivers = drivers ?? [
      new IndexedDBDriver(namespace),
      new CacheStorageDriver(namespace),
      new WebStorageDriver(namespace, 'localStorage'),
      new WebStorageDriver(namespace, 'sessionStorage')
    ];
    this._driverPromise = null;
  }

  /**
   * Resolve (e memoiza) o primeiro driver disponível na ordem configurada.
   * @returns {Promise<Object>} Driver ativo.
   * @private
   */
  _driver() {
    if (!this._driverPromise) {
      this._driverPromise = (async () => {
        for (const driver of this._drivers) {
          try {
            if (await driver.isAvailable()) {
              return driver;
            }
          } catch {
            // Driver indisponível ou com falha: tenta o próximo da lista.
          }
        }
        throw new Error('Nenhuma API de armazenamento disponível neste ambiente.');
      })();
    }
    return this._driverPromise;
  }

  /**
   * Garante que a chave informada é uma string não vazia.
   * @param {*} key - Chave a validar.
   * @returns {void}
   * @private
   */
  _assertKey(key) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new TypeError('A chave deve ser uma string não vazia.');
    }
  }

  /**
   * Nome do driver ativo (ex.: "indexedDB", "localStorage").
   * @returns {Promise<string>}
   */
  async driverName() {
    return (await this._driver()).name;
  }

  /**
   * Persiste um valor associado a uma chave.
   * @param {string} key - Chave do registro.
   * @param {*} value - Valor serializável a armazenar.
   * @returns {Promise<void>}
   */
  async put(key, value) {
    this._assertKey(key);
    const driver = await this._driver();
    await driver.put(key, value);
  }

  /**
   * Recupera o valor associado a uma chave.
   * @param {string} key - Chave do registro.
   * @returns {Promise<*>} Valor armazenado, ou undefined se não existir.
   */
  async get(key) {
    this._assertKey(key);
    const driver = await this._driver();
    return driver.get(key);
  }

  /**
   * Remove o registro associado a uma chave.
   * @param {string} key - Chave do registro.
   * @returns {Promise<void>}
   */
  async delete(key) {
    this._assertKey(key);
    const driver = await this._driver();
    await driver.delete(key);
  }

  /**
   * Remove todos os registros gerenciados pela lib.
   * @returns {Promise<void>}
   */
  async clear() {
    const driver = await this._driver();
    await driver.clear();
  }

  /**
   * Lista todas as chaves armazenadas.
   * @returns {Promise<Array<string>>}
   */
  async keys() {
    const driver = await this._driver();
    return driver.keys();
  }

  /**
   * Lista todos os valores armazenados.
   * @returns {Promise<Array<*>>}
   */
  async values() {
    const driver = await this._driver();
    return driver.values();
  }

  /**
   * Quantidade de registros armazenados.
   * @returns {Promise<number>}
   */
  async length() {
    const driver = await this._driver();
    return driver.length();
  }

  /**
   * Calcula o uso de armazenamento (cache) da lib.
   *
   * Soma o tamanho aproximado em bytes (UTF-8) das chaves e valores
   * serializados no driver ativo e, quando o browser expõe a Storage
   * Estimation API (navigator.storage.estimate), inclui também o uso e
   * a cota globais da origem.
   *
   * @returns {Promise<{driver: string, entries: number, approximateBytes: number,
   *   originUsageBytes: (number|null), originQuotaBytes: (number|null)}>}
   */
  async estimateUsage() {
    const driver = await this._driver();
    const allKeys = await driver.keys();
    let approximateBytes = 0;

    for (const key of allKeys) {
      const value = await driver.get(key);
      approximateBytes += byteSize(key) + byteSize(JSON.stringify(value) ?? '');
    }

    const result = {
      driver: driver.name,
      entries: allKeys.length,
      approximateBytes,
      originUsageBytes: null,
      originQuotaBytes: null
    };

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const { usage, quota } = await navigator.storage.estimate();
        result.originUsageBytes = usage ?? null;
        result.originQuotaBytes = quota ?? null;
      } catch {
        // Estimation API falhou: mantém apenas o cálculo aproximado local.
      }
    }

    return result;
  }
}

/**
 * Instância compartilhada da lib, pronta para uso pela aplicação.
 * @type {LocalStore}
 */
export const localStore = new LocalStore();
