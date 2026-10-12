import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {productData, imageUrl} from '../js/product-data.mjs';

function fixture() {
  const nodes = new Map(), calls = [];
  function node() {
    return {value:'',checked:false,files:[],children:[],style:{},events:{},textContent:'',
      addEventListener(name, fn) {this.events[name]=fn;},
      setAttribute(){}, reset(){}, append(...items){this.children.push(...items);},
      replaceChildren(){this.children=[];}};
  }
  const el = id => {if(!nodes.has(id)) nodes.set(id,node());return nodes.get(id);};
  const html = fs.readFileSync(new URL('../admin.html', import.meta.url),'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  let authChanged;
  const context = {document:{getElementById:id=>{assert.ok(ids.has(id),id);return el(id);},createElement:node},
    productData,imageUrl,db:{},auth:{},storage:{},ADMIN_EMAILS:['admin@example.com'],
    collection:(_,name)=>name,doc:(_,collection,id)=>({collection,id}),serverTimestamp:()=>123,
    getDocs:async()=>({docs:[]}),addDoc:async(...args)=>calls.push(['add',...args]),
    updateDoc:async(...args)=>calls.push(['update',...args]),
    signInWithEmailAndPassword:async(...args)=>calls.push(['login',...args]),signOut:async()=>{},
    onAuthStateChanged:(_,callback)=>{authChanged=callback;},ref:(_,path)=>path,
    uploadBytes:async()=>{throw Error('upload offline');},getDownloadURL:async()=>'',
    crypto:{randomUUID:()=> 'fixture'}};
  const source = fs.readFileSync(new URL('../js/admin.js',import.meta.url),'utf8').replace(/import[\s\S]*?from\s+'[^']+';/g,'');
  vm.runInNewContext(source, context);
  const form = () => {
    for(const [id,value] of Object.entries({'f-nome':'Produto','f-categoria':'kit','f-preco':'12,50','f-estoque':'2'}))el(id).value=value;
    el('f-ativo').checked=true;
  };
  return {el,calls,context,form,login:authChanged,submit:()=>el('product-form').events.submit({preventDefault(){}})};
}
test('sem login ou sem permissao nao consulta nem escreve catalogo',async()=>{
  const f=fixture(); let reads=0;f.context.getDocs=async()=>{reads++;return {docs:[]};};
  f.login(null);f.form();await f.submit();assert.equal(f.calls.length,0);
  f.login({email:'member@example.com'});await f.submit();
  assert.equal(f.calls.length,0);assert.equal(reads,0);assert.equal(f.el('denied-screen').style.display,'block');
});
test('admin cria produto validado e lista usando doubles',async()=>{
  const f=fixture();f.login({email:'admin@example.com'});f.form();await f.submit();
  assert.equal(f.calls.length,1);assert.equal(f.calls[0][0],'add');assert.equal(f.calls[0][1],'produtos');
  assert.equal(f.calls[0][2].preco,12.5);assert.equal(f.el('form-status').textContent,'Produto salvo.');
});
test('edicao usa id original e atualiza sem criar duplicata',async()=>{
  const f=fixture();
  f.context.getDocs=async()=>({docs:[{id:'original',data:()=>({nome:'A',categoria:'kit',preco:10,estoque:2})}]});
  f.login({email:'admin@example.com'});await new Promise(resolve=>setImmediate(resolve));
  f.el('product-table-body').children[0].children[5].children[0].onclick();
  f.el('f-preco').value='20';await f.submit();
  assert.equal(f.calls[0][0],'update');assert.equal(f.calls[0][1].id,'original');assert.equal(f.calls[0][2].preco,20);
});
test('erro de upload nao grava documento nem informa sucesso',async()=>{
  const f=fixture();f.login({email:'admin@example.com'});f.form();
  f.el('f-imagem-arquivo').files=[{type:'image/png',size:100}];await f.submit();
  assert.equal(f.calls.length,0);assert.match(f.el('form-status').textContent,/upload offline/);
  assert.equal(f.el('save-btn').disabled,false);
});
test('falha ao recarregar apos gravacao nao sugere gravar novamente',async()=>{
  const f=fixture();f.login({email:'admin@example.com'});f.form();
  f.context.getDocs=async()=>{throw Error('offline');};await f.submit();
  assert.equal(f.calls.length,1);assert.match(f.el('form-status').textContent,/Produto salvo, mas/);
});
