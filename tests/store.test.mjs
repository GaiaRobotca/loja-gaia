import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {escapeHtml, imageUrl, readCart} from '../js/product-data.mjs';
test('vitrine escapa dados externos e inicializa com carrinho corrompido',async()=>{
  const nodes = new Map();
  const el=id=>{if(!nodes.has(id))nodes.set(id,{style:{},events:{},classList:{add(){},remove(){}},
    addEventListener(name,fn){this.events[name]=fn;}});return nodes.get(id);};
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  const context={h:escapeHtml,imageUrl,readCart,console,window:{},document:{getElementById:id=>{
    assert.ok(ids.has(id),id);return el(id);}},localStorage:{getItem:()=>'{',setItem(){}},
    db:{},collection:()=>{},orderBy:()=>{},query:()=>{},getDocs:async()=>({docs:[{
      id:"x');alert(1);//", data:()=>({nome:'<img src=x onerror=alert(1)>',categoria:'<script>',
        preco:10,estoque:1,ativo:true,imagemUrl:'javascript:alert(1)'})}]})};
  const source=fs.readFileSync(new URL('../js/store.js',import.meta.url),'utf8').replace(/import[\s\S]*?from\s+["'][^"']+["'];/g,'');
  vm.runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));
  assert.match(el('product-grid').innerHTML,/&lt;img/);
  assert.doesNotMatch(el('product-grid').innerHTML,/src="javascript:|onclick=|<script>/);
  assert.equal(el('cart-count').textContent,0);
  assert.equal(typeof el('product-grid').events.click,'function');
});
