export function imageUrl(value) {
  if (!value) return '';
  const url = new URL(String(value));
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use URL HTTP ou HTTPS.');
  return url.href;
}
export function stock(value) {
  const number = Number(value);
  if (String(value).trim() === '' || !Number.isSafeInteger(number) || number < 0)
    throw new Error('Estoque deve ser inteiro e nao negativo.');
  return number;
}
export function productData(input) {
  const nome = String(input.nome || '').trim();
  if (!nome) throw new Error('Informe o nome.');
  const rawPrice = String(input.preco).trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(rawPrice)) throw new Error('Preco invalido; use 49,90.');
  const preco = Number(rawPrice.replace(',', '.'));
  if (!Number.isFinite(preco)) throw new Error('Preco invalido.');
  if (!['kit', 'camiseta', 'chaveiro', 'outro'].includes(input.categoria)) throw new Error('Categoria invalida.');
  const variantes = input.hasVariants ? input.variantes.map(v => ({nome: String(v.nome).trim(), estoque: stock(v.estoque)})) : [];
  if (input.hasVariants && (!variantes.length || variantes.some(v => !v.nome))) throw new Error('Informe os tamanhos.');
  if (new Set(variantes.map(v => v.nome.toLowerCase())).size !== variantes.length) throw new Error('Tamanhos repetidos.');
  return {nome, preco, categoria: input.categoria, descricao: String(input.descricao || '').trim(),
    imagemUrl: imageUrl(input.imagemUrl), ativo: Boolean(input.ativo), variantes,
    estoque: input.hasVariants ? 0 : stock(input.estoque)};
}
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function readCart(raw) {
  try {
    const cart = JSON.parse(raw);
    if (!Array.isArray(cart)) return [];
    return cart.filter(item => item && typeof item.id === 'string' && typeof item.nome === 'string'
      && Number.isFinite(item.preco) && item.preco >= 0 && Number.isSafeInteger(item.qtd) && item.qtd > 0
      && (item.variant === null || typeof item.variant === 'string'));
  } catch { return []; }
}
