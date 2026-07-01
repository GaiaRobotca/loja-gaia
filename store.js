/* js/store.js */
import { db, collection, getDocs, query, orderBy } from "./firebase-init.js"; // Certifique-se de que o caminho está correto

// --- CONFIGURAÇÃO ---
const WHATSAPP_NUMBER = "5534999733842"; // Coloque o DDD e número do Gaia aqui (Ex: 5534...)
const CATEGORIES = { kit: "Kits", camiseta: "Camisetas", chaveiro: "Chaveiros", outro: "Outros" };

let products = [];
let cart = JSON.parse(localStorage.getItem("gaia_cart")) || [];

// --- ELEMENTOS DOM ---
const productGrid = document.getElementById("product-grid");
const cartOverlay = document.getElementById("cart-overlay");
const cartDrawer = document.getElementById("cart-drawer");
const cartToggleBtn = document.getElementById("cart-toggle");
const cartCloseBtn = document.getElementById("cart-close");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const cartCount = document.getElementById("cart-count");

// --- INICIALIZAÇÃO ---
async function initStore() {
  updateCartUI();
  try {
    const snap = await getDocs(query(collection(db, "produtos"), orderBy("nome")));
    products = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => p.ativo !== false); // Apenas produtos ativos
    
    renderProducts(products);
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    productGrid.innerHTML = `<div class="empty-state">Erro ao carregar produtos. Tente novamente.</div>`;
  }
}

function renderProducts(lista) {
  if (lista.length === 0) {
    productGrid.innerHTML = `<div class="empty-state">Nenhum produto disponível no momento.</div>`;
    return;
  }

  productGrid.innerHTML = lista.map((p) => {
    const hasVariants = Array.isArray(p.variantes) && p.variantes.length > 0;
    
    let variantSelectHTML = "";
    if (hasVariants) {
      const options = p.variantes
        .filter(v => v.estoque > 0)
        .map(v => `<option value="${v.nome}">Tamanho: ${v.nome}</option>`)
        .join("");
      
      variantSelectHTML = options ? `<select id="var-${p.id}" class="product-select">${options}</select>` : `<p style="color:var(--danger); font-size:12px;">Esgotado</p>`;
    } else if (p.estoque <= 0) {
      variantSelectHTML = `<p style="color:var(--danger); font-size:12px;">Esgotado</p>`;
    }

    const canBuy = (hasVariants && variantSelectHTML.includes("<option")) || (!hasVariants && p.estoque > 0);

    return `
      <div class="product-card">
        ${p.imagemUrl ? `<img src="${p.imagemUrl}" class="product-img" alt="${p.nome}">` : `<div class="product-img"></div>`}
        <span class="product-cat">${CATEGORIES[p.categoria] || p.categoria}</span>
        <h3 class="product-title">${p.nome}</h3>
        <div class="product-price">${p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
        ${variantSelectHTML}
        <button class="btn btn-primary" onclick="window.addToCart('${p.id}')" ${!canBuy ? "disabled" : ""} style="width: 100%; justify-content: center;">
          ${canBuy ? "Adicionar" : "Indisponível"}
        </button>
      </div>
    `;
  }).join("");
}

// --- LÓGICA DO CARRINHO ---
window.addToCart = (productId) => {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const hasVariants = Array.isArray(product.variantes) && product.variantes.length > 0;
  let variantName = null;

  if (hasVariants) {
    const select = document.getElementById(`var-${productId}`);
    if (!select) return; // Esgotado
    variantName = select.value;
  }

  // Verifica se já está no carrinho com a mesma variante
  const existingItem = cart.find(item => item.id === productId && item.variant === variantName);
  
  if (existingItem) {
    existingItem.qtd += 1;
  } else {
    cart.push({
      id: product.id,
      nome: product.nome,
      preco: product.preco,
      variant: variantName,
      qtd: 1
    });
  }

  saveCart();
  openCart();
};

function updateCartUI() {
  // Atualiza bolinha de quantidade no header
  const totalItems = cart.reduce((acc, item) => acc + item.qtd, 0);
  cartCount.textContent = totalItems;
  cartCount.style.display = totalItems > 0 ? "flex" : "none";

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p style="text-align:center; color:var(--text-faint); margin-top: 20px;">Seu carrinho está vazio.</p>`;
    cartTotalEl.textContent = "R$ 0,00";
    checkoutBtn.disabled = true;
    return;
  }

  let total = 0;
  cartItemsContainer.innerHTML = cart.map((item, index) => {
    total += item.preco * item.qtd;
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <h4>${item.nome}</h4>
          ${item.variant ? `<span class="cart-item-variant">Tamanho: ${item.variant}</span>` : ""}
          <div class="product-price" style="font-size:1rem; margin-top:5px;">
            ${(item.preco * item.qtd).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        <div class="cart-item-actions">
          <button onclick="window.changeQty(${index}, -1)">-</button>
          <span>${item.qtd}</span>
          <button onclick="window.changeQty(${index}, 1)">+</button>
        </div>
      </div>
    `;
  }).join("");

  cartTotalEl.textContent = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  checkoutBtn.disabled = false;
}

window.changeQty = (index, delta) => {
  cart[index].qtd += delta;
  if (cart[index].qtd <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
};

function saveCart() {
  localStorage.setItem("gaia_cart", JSON.stringify(cart));
  updateCartUI();
}

// --- CHECKOUT WHATSAPP ---
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) return;

  let text = `Olá! Vim pelo site e gostaria de fazer um pedido na loja do Gaia:\n\n`;
  let total = 0;

  cart.forEach(item => {
    total += item.preco * item.qtd;
    const variantText = item.variant ? ` (${item.variant})` : "";
    text += `▪ ${item.qtd}x ${item.nome}${variantText} - R$ ${(item.preco * item.qtd).toFixed(2)}\n`;
  });

  text += `\n*Total estimado: R$ ${total.toFixed(2)}*\n\n`;
  text += `Gostaria de combinar a retirada e o pagamento.`;

  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;
  
  // Limpa o carrinho após gerar o link (opcional, pode remover se preferir manter)
  cart = [];
  saveCart();
  
  window.open(whatsappUrl, '_blank');
});

// --- CONTROLES DA GAVETA ---
function openCart() {
  cartDrawer.classList.add("active");
  cartOverlay.classList.add("active");
}
function closeCart() {
  cartDrawer.classList.remove("active");
  cartOverlay.classList.remove("active");
}

cartToggleBtn.addEventListener("click", openCart);
cartCloseBtn.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

// Start
initStore();