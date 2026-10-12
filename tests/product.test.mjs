import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productData, imageUrl, escapeHtml, readCart} from '../js/product-data.mjs';
const base = {nome: 'Camiseta', categoria: 'camiseta', preco: '49,90', estoque: '2', ativo: true};
test('preco brasileiro e estoque inteiro', () => {
  assert.equal(productData(base).preco, 49.9); assert.equal(productData(base).estoque, 2);
});
test('recusa preco, categoria, nome ou estoque invalidos', () => {
  for (const override of [{preco: '-1'}, {preco: '1.000,99'}, {preco: 'NaN'}, {preco: ''},
    {estoque: -1}, {estoque: 1.2}, {estoque: ''}, {nome: ' '}, {categoria: 'invalida'}])
    assert.throws(() => productData({...base, ...override}));
});
test('variantes exigem nomes unicos e quantidade valida', () => {
  assert.throws(() => productData({...base, hasVariants: true, variantes: []}));
  assert.throws(() => productData({...base, hasVariants: true, variantes: [{nome:'P',estoque:1},{nome:'p',estoque:2}]}));
  const data = productData({...base, hasVariants: true, variantes: [{nome:' M ',estoque:'3'}]});
  assert.deepEqual(data.variantes, [{nome:'M',estoque:3}]); assert.equal(data.estoque, 0);
});
test('URL de imagem recusa protocolos ativos', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'file:///tmp/a']) assert.throws(() => imageUrl(url));
  assert.equal(imageUrl('https://example.com/a.png'), 'https://example.com/a.png');
});
test('dados interpolados sao escapados', () => {
  assert.equal(escapeHtml('<img src="x">&'), '&lt;img src=&quot;x&quot;&gt;&amp;');
});
test('carrinho corrompido ou com valores invalidos nao derruba pagina', () => {
  for (const value of ['{', '{}', 'null', '[null]', '[{"qtd":-1}]']) assert.deepEqual(readCart(value), []);
  const item = {id:'a',nome:'Teste',preco:1.5,qtd:2,variant:null};
  assert.deepEqual(readCart(JSON.stringify([item])), [item]);
});
