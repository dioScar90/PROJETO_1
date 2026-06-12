import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStore, WebStorageDriver } from '../src/app/core/LocalStore.js';

/**
 * No ambiente jsdom não existem IndexedDB nem CacheStorage, portanto a
 * cadeia de fallback deve resolver naturalmente para o LocalStorage.
 */
describe('LocalStore', () => {
  let store;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    store = new LocalStore({ namespace: 'teste' });
  });

  describe('fallback de drivers', () => {
    it('usa o LocalStorage quando IndexedDB e CacheStorage não existem', async () => {
      expect(await store.driverName()).toBe('localStorage');
    });

    it('pula drivers indisponíveis e usa o primeiro disponível', async () => {
      const indisponivel = { name: 'a', isAvailable: async () => false };
      const comFalha = {
        name: 'b',
        isAvailable: async () => {
          throw new Error('quebrado');
        }
      };
      const disponivel = {
        name: 'c',
        isAvailable: async () => true,
        put: async () => {},
        get: async () => 'valor-de-c'
      };
      const custom = new LocalStore({ drivers: [indisponivel, comFalha, disponivel] });

      expect(await custom.driverName()).toBe('c');
      expect(await custom.get('qualquer')).toBe('valor-de-c');
    });

    it('rejeita quando nenhum driver está disponível', async () => {
      const custom = new LocalStore({ drivers: [{ name: 'x', isAvailable: async () => false }] });
      await expect(custom.driverName()).rejects.toThrow('Nenhuma API de armazenamento disponível');
    });
  });

  describe('put/get', () => {
    it('persiste e recupera valores primitivos e objetos', async () => {
      await store.put('numero', 42);
      await store.put('texto', 'olá');
      await store.put('objeto', { saldo: 10.5, tags: ['a', 'b'] });

      expect(await store.get('numero')).toBe(42);
      expect(await store.get('texto')).toBe('olá');
      expect(await store.get('objeto')).toEqual({ saldo: 10.5, tags: ['a', 'b'] });
    });

    it('retorna undefined para chave inexistente', async () => {
      expect(await store.get('nao-existe')).toBeUndefined();
    });

    it('sobrescreve o valor de uma chave existente', async () => {
      await store.put('chave', 'antigo');
      await store.put('chave', 'novo');
      expect(await store.get('chave')).toBe('novo');
    });

    it('rejeita chaves que não sejam strings não vazias', async () => {
      await expect(store.put(123, 'x')).rejects.toThrow(TypeError);
      await expect(store.get('')).rejects.toThrow(TypeError);
      await expect(store.delete(null)).rejects.toThrow(TypeError);
    });
  });

  describe('delete/clear', () => {
    it('remove apenas o registro indicado', async () => {
      await store.put('a', 1);
      await store.put('b', 2);
      await store.delete('a');

      expect(await store.get('a')).toBeUndefined();
      expect(await store.get('b')).toBe(2);
    });

    it('clear remove apenas as chaves do namespace da lib', async () => {
      localStorage.setItem('fora-do-namespace', 'preservar');
      await store.put('a', 1);
      await store.put('b', 2);

      await store.clear();

      expect(await store.length()).toBe(0);
      expect(localStorage.getItem('fora-do-namespace')).toBe('preservar');
    });
  });

  describe('keys/values/length', () => {
    it('lista chaves, valores e o total de registros', async () => {
      await store.put('a', 1);
      await store.put('b', 'dois');

      expect((await store.keys()).sort()).toEqual(['a', 'b']);
      expect((await store.values()).length).toBe(2);
      expect(await store.length()).toBe(2);
    });

    it('não enxerga chaves de outros namespaces', async () => {
      localStorage.setItem('outro:chave', JSON.stringify({ value: 1 }));
      await store.put('minha', 1);

      expect(await store.keys()).toEqual(['minha']);
      expect(await store.length()).toBe(1);
    });
  });

  describe('estimateUsage', () => {
    it('calcula a quantidade de registros e bytes aproximados', async () => {
      await store.put('a', { texto: 'conteúdo' });
      await store.put('b', 12345);

      const usage = await store.estimateUsage();

      expect(usage.driver).toBe('localStorage');
      expect(usage.entries).toBe(2);
      expect(usage.approximateBytes).toBeGreaterThan(0);
    });

    it('retorna zero para o store vazio', async () => {
      const usage = await store.estimateUsage();
      expect(usage.entries).toBe(0);
      expect(usage.approximateBytes).toBe(0);
    });
  });
});

describe('WebStorageDriver (sessionStorage)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('persiste e recupera valores no SessionStorage', async () => {
    const driver = new WebStorageDriver('teste', 'sessionStorage');

    expect(await driver.isAvailable()).toBe(true);

    await driver.put('chave', { ok: true });
    expect(await driver.get('chave')).toEqual({ ok: true });
    expect(await driver.keys()).toEqual(['chave']);
    expect(await driver.length()).toBe(1);

    await driver.delete('chave');
    expect(await driver.get('chave')).toBeUndefined();
  });
});
