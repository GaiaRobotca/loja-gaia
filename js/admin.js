import {db, auth, storage, ADMIN_EMAILS, collection, doc, getDocs, addDoc, updateDoc,
  serverTimestamp, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  ref, uploadBytes, getDownloadURL} from './firebase-init.js';
import {productData, imageUrl} from './product-data.mjs';

const el = id => document.getElementById(id);
let currentUser = null, editing = null, busy = false;
// UI convenience only: Firestore/Storage rules must enforce authorization.
const allowed = user => Boolean(user && ADMIN_EMAILS.some(email => email.toLowerCase() === user.email?.toLowerCase())
  && !['seu-email@gmail.com', 'outro-membro@uftm.edu.br'].includes(user.email?.toLowerCase()));
function requireAdmin() {
  if (!allowed(currentUser)) throw new Error('Sessao de administrador necessaria.');
}
function status(message, error = false) {
  el('form-status').textContent = message;
  el('form-status').className = error ? 'form-error' : 'form-success';
}
function variantsVisibility() {
  el('variantes-field').style.display = el('f-has-variantes').checked ? 'block' : 'none';
  el('estoque-field').style.display = el('f-has-variantes').checked ? 'none' : 'block';
}
function addVariant(value = {nome: '', estoque: 0}) {
  const row = document.createElement('div'); row.className = 'variant-editor-row';
  const name = document.createElement('input');
  name.value = value.nome; name.placeholder = 'Tamanho'; name.setAttribute('aria-label', 'Tamanho');
  const quantity = document.createElement('input');
  quantity.type = 'number'; quantity.min = '0'; quantity.step = '1'; quantity.value = value.estoque;
  quantity.setAttribute('aria-label', 'Estoque do tamanho');
  const remove = document.createElement('button');
  remove.type = 'button'; remove.textContent = 'Remover'; remove.onclick = () => row.remove();
  row.append(name, quantity, remove); el('variant-editor').append(row);
}
function resetForm() {
  editing = null; el('product-form').reset(); el('variant-editor').replaceChildren();
  el('form-title').textContent = 'Novo Produto'; el('cancel-edit-btn').style.display = 'none'; variantsVisibility();
}
function editProduct(id, product) {
  if (busy) return;
  resetForm(); editing = id;
  for (const field of ['nome', 'categoria', 'preco', 'descricao', 'estoque']) el('f-' + field).value = product[field] ?? '';
  el('f-imagem-url').value = product.imagemUrl || ''; el('f-ativo').checked = product.ativo !== false;
  const variants = Array.isArray(product.variantes) ? product.variantes : [];
  el('f-has-variantes').checked = variants.length > 0; variants.forEach(addVariant); variantsVisibility();
  el('form-title').textContent = 'Editar Produto'; el('cancel-edit-btn').style.display = 'inline-block';
}
async function loadProducts() {
  requireAdmin(); const user = currentUser;
  const snapshot = await getDocs(collection(db, 'produtos'));
  if (currentUser !== user || !allowed(currentUser)) return;
  const body = el('product-table-body'); body.replaceChildren();
  for (const item of snapshot.docs) {
    const product = item.data(), row = document.createElement('tr'), picture = document.createElement('td');
    try {
      if (product.imagemUrl) {
        const img = document.createElement('img'); img.src = imageUrl(product.imagemUrl);
        img.alt = String(product.nome || 'Produto'); picture.append(img);
      }
    } catch { picture.textContent = 'URL invalida'; }
    row.append(picture);
    const total = Array.isArray(product.variantes) && product.variantes.length
      ? product.variantes.reduce((sum, v) => sum + Number(v.estoque || 0), 0) : product.estoque;
    for (const value of [product.nome + ' / ' + product.categoria,
      Number(product.preco).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}),
      total ?? 'Nao informado', product.ativo === false ? 'Inativo' : 'Ativo']) {
      const cell = document.createElement('td'); cell.textContent = String(value); row.append(cell);
    }
    const actions = document.createElement('td'), button = document.createElement('button');
    button.type = 'button'; button.textContent = 'Editar'; button.onclick = () => editProduct(item.id, product);
    actions.append(button); row.append(actions); body.append(row);
  }
  if (!snapshot.docs.length) body.textContent = 'Nenhum produto cadastrado.';
}
el('login-form').addEventListener('submit', async event => {
  event.preventDefault(); el('login-error').textContent = '';
  try { await signInWithEmailAndPassword(auth, el('login-email').value.trim(), el('login-senha').value); }
  catch { el('login-error').textContent = 'Nao foi possivel entrar. Confira credenciais e conexao.'; }
  finally { el('login-senha').value = ''; }
});
for (const id of ['logout-btn', 'denied-logout-btn']) el(id).addEventListener('click', async () => {
  try { await signOut(auth); } catch { status('Falha ao encerrar sessao.', true); }
});
el('f-has-variantes').addEventListener('change', variantsVisibility);
el('add-variant-btn').addEventListener('click', () => addVariant());
el('cancel-edit-btn').addEventListener('click', () => { if (!busy) resetForm(); });
el('product-form').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  busy = true; el('save-btn').disabled = true; status('Salvando...');
  const user = currentUser, targetId = editing;
  let uploadedPath = null, saved = false;
  try {
    requireAdmin();
    const data = productData({nome: el('f-nome').value, categoria: el('f-categoria').value,
      preco: el('f-preco').value, descricao: el('f-descricao').value, estoque: el('f-estoque').value,
      imagemUrl: el('f-imagem-url').value.trim(), ativo: el('f-ativo').checked,
      hasVariants: el('f-has-variantes').checked,
      variantes: Array.from(el('variant-editor').children, row => ({nome: row.children[0].value, estoque: row.children[1].value}))});
    const file = el('f-imagem-arquivo').files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
        throw new Error('Use JPEG, PNG ou WebP de ate 5 MB.');
      uploadedPath = 'produtos/' + crypto.randomUUID(); const target = ref(storage, uploadedPath);
      await uploadBytes(target, file, {contentType: file.type}); data.imagemUrl = await getDownloadURL(target);
    }
    requireAdmin(); if (currentUser !== user) throw new Error('Sessao mudou; entre novamente.');
    data.atualizadoEm = serverTimestamp();
    if (targetId) await updateDoc(doc(db, 'produtos', targetId), data);
    else await addDoc(collection(db, 'produtos'), {...data, criadoEm: serverTimestamp()});
    saved = true; resetForm(); status('Produto salvo.'); await loadProducts();
  } catch (error) {
    status(saved ? 'Produto salvo, mas a lista nao foi atualizada. Recarregue a pagina.'
      : String(error.message || error) + (uploadedPath ? ' Upload separado: confira arquivo ' + uploadedPath : ''), true);
  } finally { busy = false; el('save-btn').disabled = false; }
});
onAuthStateChanged(auth, user => {
  currentUser = user; resetForm(); status(''); el('product-table-body').replaceChildren();
  el('login-screen').style.display = user ? 'none' : 'grid';
  el('denied-screen').style.display = user && !allowed(user) ? 'block' : 'none';
  el('admin-app').style.display = allowed(user) ? 'block' : 'none';
  el('admin-email').textContent = user?.email || ''; el('denied-email').textContent = user?.email || '';
  if (allowed(user)) loadProducts().catch(error => status('Falha ao carregar catalogo: ' + error.message, true));
});
