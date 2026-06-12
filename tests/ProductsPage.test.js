import { describe, it, expect, beforeEach } from 'vitest';
import { ProductsPage } from '../src/app/components/ProductsPage.js';

// Registra o Custom Element apenas se ainda não estiver definido
if (!customElements.get('products-page')) customElements.define('products-page', ProductsPage);

describe('ProductsPage Custom Element', () => {
  let el;

  beforeEach(() => {
    document.body.innerHTML = '<products-page></products-page>';
    el = document.querySelector('products-page');
  });

  it('deve exibir mensagem de catálogo vazio quando não há produtos', () => {
    expect(el.innerHTML).toContain('Nenhum produto cadastrado');
  });

  it('deve renderizar um cartão para cada produto recebido via setter', () => {
    el.products = [
      { id: 1, name: 'Teclado Mecânico', price: 489.90, stock: 12 },
      { id: 2, name: 'Mouse Óptico', price: 259.00, stock: 30 }
    ];

    const cards = el.querySelectorAll('.product-card');
    expect(cards.length).toBe(2);
    expect(el.innerHTML).toContain('Teclado Mecânico');
    expect(el.innerHTML).toContain('Mouse Óptico');
  });

  it('deve formatar o preço em moeda BRL', () => {
    el.products = [
      { id: 1, name: 'Headset Orbital', price: 699.50, stock: 5 }
    ];
    expect(el.innerHTML).toContain('699,50');
  });

  it('deve sinalizar estoque baixo (menos de 10 unidades) com badge rose', () => {
    el.products = [
      { id: 1, name: 'Headset Orbital', price: 699.50, stock: 5 },
      { id: 2, name: 'Hub USB-C', price: 349.90, stock: 18 }
    ];
    expect(el.innerHTML).toContain('text-rose-400');
    expect(el.innerHTML).toContain('text-emerald-400');
  });

  it('deve sanitizar o nome do produto contra XSS', () => {
    el.products = [
      { id: 1, name: '<script>alert(1)</script>', price: 10, stock: 1 }
    ];
    expect(el.innerHTML).not.toContain('<script>');
    expect(el.innerHTML).toContain('&lt;script&gt;');
  });
});
