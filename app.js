/**
 * ==========================================================================
 * DROGARIAS PIETRÃO - SISTEMA COMPLETO (VITRINE, CARRINHO E ADMIN)
 * Padrão Corporativo e Farmacêutico
 * ==========================================================================
 */

// Chaves de Armazenamento Local e Nuvem
const DB_KEY = 'drogaria_pietrao_db_v2';
const CONFIG_KEY = 'drogaria_pietrao_config_v2';
const AUTH_KEY = 'drogaria_pietrao_admin_session';
const CUSTOMER_KEY = 'drogaria_pietrao_cliente_v2';
const CUSTOMER_SESSION_KEY = 'drogaria_pietrao_cliente_sessao_v2';
const CUSTOMER_ADDRESS_KEY = 'drogaria_pietrao_cliente_endereco_v2';
const GITHUB_REPO = 'mairiciodepaula2005-creator/Drograrias-Pietrao2';
const GITHUB_TOKEN_KEY = 'drogaria_pietrao_gh_token_v2';

// Visualizador de Senha Global
window.togglePasswordVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  btn.setAttribute('aria-label', isPass ? 'Ocultar senha' : 'Mostrar senha');
  btn.classList.toggle('active', isPass);
  const icon = btn.querySelector('.eye-icon');
  if (icon) icon.textContent = isPass ? '🔒' : '👁';
};

// Sincronização em Nuvem Multi-Dispositivos (GitHub Cloud Engine)
let isSyncing = false;

function getGitHubToken() {
  return localStorage.getItem(GITHUB_TOKEN_KEY) || config.githubToken || '';
}

function updateCloudSyncUI(status, message) {
  const badge = $('#cloud-sync-badge');
  const dot = $('#cloud-sync-dot');
  const text = $('#cloud-sync-status-text');
  if (!badge || !dot || !text) return;

  badge.className = `sync-status-badge sync-status-${status}`;
  if (status === 'online') {
    dot.textContent = '🟢';
    text.textContent = message || 'Sincronização Ativa via GitHub (PC ↔ Celulares)';
  } else if (status === 'syncing') {
    dot.textContent = '🟡';
    text.textContent = message || 'Enviando alterações para a nuvem...';
  } else {
    dot.textContent = '⚪';
    text.textContent = message || 'Armazenamento Local';
  }
}

async function syncToCloud() {
  const token = getGitHubToken();
  if (!token || isSyncing) return;

  try {
    isSyncing = true;
    updateCloudSyncUI('syncing', 'Gravando alterações na nuvem...');

    const payloadObj = {
      updatedAt: new Date().toISOString(),
      products: db.products,
      sales: db.sales || [],
      config: config
    };

    const jsonStr = JSON.stringify(payloadObj, null, 2);
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binaryStr = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binaryStr += String.fromCharCode(utf8Bytes[i]);
    }
    const base64Content = btoa(binaryStr);

    // 1. Obter SHA atual do db.json no GitHub
    let sha = null;
    try {
      const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/db.json?t=${Date.now()}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const existing = await getRes.json();
        sha = existing.sha;
      }
    } catch (e) {
      console.warn('Não foi possível verificar SHA anterior:', e);
    }

    // 2. Gravar novo db.json
    const bodyPayload = {
      message: `sync: catálogo atualizado em ${new Date().toLocaleString('pt-BR')}`,
      content: base64Content
    };
    if (sha) bodyPayload.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/db.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyPayload)
    });

    if (putRes.ok) {
      updateCloudSyncUI('online', 'Sincronizado na Nuvem GitHub (Disponível em celulares e PCs)');
    } else {
      updateCloudSyncUI('local', 'Salvo localmente no computador');
    }
  } catch (err) {
    console.warn('Sincronização em nuvem indisponível:', err);
    updateCloudSyncUI('local', 'Salvo localmente no computador');
  } finally {
    isSyncing = false;
  }
}

async function syncFromCloud(forceRender = true) {
  const endpoints = [
    `./db.json?t=${Date.now()}`,
    `https://raw.githubusercontent.com/${GITHUB_REPO}/main/db.json?t=${Date.now()}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          db.products = data.products;
          if (Array.isArray(data.sales)) db.sales = data.sales;
          localStorage.setItem(DB_KEY, JSON.stringify(db));

          if (data.config) {
            config = { ...DEFAULT_CONFIG, ...data.config };
            localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
          }

          updateCloudSyncUI('online', 'Sincronizado na Nuvem GitHub (Ativo em celulares e PCs)');

          if (forceRender) {
            applyStoreConfig();
            renderCategoryCards();
            renderStore();
            renderStoreHours();
            if (isAdminLogged()) {
              renderAdminDashboard();
            }
          }
          return true;
        }
      }
    } catch (err) {
      // continua para proximo endpoint
    }
  }
  return false;
}

window.handleCloudSyncSave = function(e) {
  e.preventDefault();
  const token = $('#cfg-github-token').value.trim();
  if (token) {
    localStorage.setItem(GITHUB_TOKEN_KEY, token);
    config.githubToken = token;
    saveConfig();
  }
  forceCloudSync();
};

window.forceCloudSync = async function() {
  updateCloudSyncUI('syncing', 'Sincronizando...');
  await syncToCloud();
  await syncFromCloud(true);
  alert('Sincronização concluída! Os dados estão sincronizados com a nuvem do GitHub.');
};

// Imagem padrão
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80';

// Categorias Predefinidas
const DEFAULT_CATEGORIES = [
  'Medicamentos',
  'Higiene e beleza',
  'Dermocosméticos',
  'Vitaminas e Suplementos',
  'Mundo infantil',
  'Primeiros socorros'
];

// Configurações Padrão
const DEFAULT_CONFIG = {
  adminEmail: 'admin@pietrao.com',
  adminPassword: 'admin123',
  whatsapp: '5592999999999',
  storeNotice: 'Compre com segurança • Frete grátis a partir de R$ 20,00',
  lowStockThreshold: 5,
  deliveryFee: 20.00,
  freeShippingThreshold: 20.00,
  categories: DEFAULT_CATEGORIES,
  storeHoursText: 'Seg. a Sáb., 8h às 20h',
  storeStatusMode: 'auto', // 'auto' | 'open' | 'closed'
  closeHour: 20
};

// Produtos Iniciais de Demonstração
const SEED_PRODUCTS = [
  {
    id: 1,
    name: 'Paracetamol 750mg c/ 20 Comprimidos',
    category: 'Medicamentos',
    price: 15.90,
    sale: 10.90,
    stock: 18,
    promo: true,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 2,
    name: 'Dipirona Monoidratada 500mg/ml Gotas 20ml',
    category: 'Medicamentos',
    price: 8.90,
    sale: null,
    stock: 25,
    promo: false,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 3,
    name: 'Vitamina C 1g + Zinco 30 Comprimidos Efervescentes',
    category: 'Vitaminas e Suplementos',
    price: 32.90,
    sale: 23.90,
    stock: 12,
    promo: true,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 4,
    name: 'Protetor Solar Facial FPS 50 Toque Seco 50g',
    category: 'Dermocosméticos',
    price: 58.90,
    sale: 44.90,
    stock: 4,
    promo: true,
    image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 5,
    name: 'Shampoo Anticaspa Nutritivo 400ml',
    category: 'Higiene e beleza',
    price: 24.50,
    sale: null,
    stock: 14,
    promo: false,
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 6,
    name: 'Álcool em Gel 70% Hidratante 500ml',
    category: 'Higiene e beleza',
    price: 12.90,
    sale: null,
    stock: 0,
    promo: false,
    image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 7,
    name: 'Fralda Infantil Confort Premium Tamanho G c/ 32 un.',
    category: 'Mundo infantil',
    price: 49.90,
    sale: 39.90,
    stock: 7,
    promo: true,
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 8,
    name: 'Kit Primeiros Socorros c/ Esparadrapo, Gaze e Antisséptico',
    category: 'Primeiros socorros',
    price: 27.90,
    sale: null,
    stock: 3,
    promo: false,
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=500&q=80'
  }
];

// Estado da Aplicação
let db = loadDatabase();
let config = loadConfig();
let cart = [];
let currentCategory = 'Todos';
let currentAdminTab = 'catalog';

// Utilitários
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);
const money = num => Number(num || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function normalizeStr(str) {
  return String(str || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function loadDatabase() {
  try {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed.products)) parsed.products = SEED_PRODUCTS;
      if (!Array.isArray(parsed.sales)) parsed.sales = [];
      return parsed;
    }
  } catch (e) {
    console.error('Erro ao carregar banco:', e);
  }
  const initial = { products: SEED_PRODUCTS, sales: [] };
  localStorage.setItem(DB_KEY, JSON.stringify(initial));
  return initial;
}

function saveDatabase() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  syncToCloud();
}

function loadConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.deliveryFee === 5 || parsed.deliveryFee === undefined) {
        parsed.deliveryFee = 20.00;
      }
      if (parsed.freeShippingThreshold === undefined) {
        parsed.freeShippingThreshold = 20.00;
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Erro ao carregar configs:', e);
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
  return { ...DEFAULT_CONFIG };
}

function saveConfig() {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  syncToCloud();
}

/* ==========================================================================
   MÓDULO: VITRINE & ATENDIMENTO
   ========================================================================== */

function renderStoreHours() {
  const el = $('#store-hours');
  if (!el) return;

  const mode = config.storeStatusMode || 'auto';
  const hoursText = config.storeHoursText || DEFAULT_CONFIG.storeHoursText;
  const closeH = Number(config.closeHour) || 20;

  if (mode === 'open') {
    el.textContent = `Aberto agora · ${hoursText}`;
    el.className = 'store-hours open';
    return;
  }

  if (mode === 'closed') {
    el.textContent = `Fechado agora · ${hoursText}`;
    el.className = 'store-hours closed';
    return;
  }

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Manaus',
      weekday: 'short',
      hour: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());

    const weekday = parts.find(p => p.type === 'weekday')?.value || '';
    const hour = Number(parts.find(p => p.type === 'hour')?.value || 0);
    const isOpen = weekday !== 'Sun' && hour >= 8 && hour < closeH;

    el.textContent = isOpen ? `Aberto agora · ${hoursText}` : `Fechado agora · ${hoursText}`;
    el.className = `store-hours ${isOpen ? 'open' : 'closed'}`;
  } catch (e) {
    el.textContent = `Atendimento: ${hoursText}`;
    el.className = 'store-hours open';
  }
}

function applyStoreConfig() {
  const noticeEl = $('#store-notice-display');
  if (noticeEl) noticeEl.textContent = config.storeNotice || DEFAULT_CONFIG.storeNotice;

  const benefitDelivery = $('#benefit-delivery-text');
  const freeThreshold = config.freeShippingThreshold || DEFAULT_CONFIG.freeShippingThreshold;
  if (benefitDelivery) {
    benefitDelivery.textContent = `Frete grátis a partir de ${money(freeThreshold)}`;
  }
}

function renderCategoryCards() {
  const container = $('#featured-categories-grid');
  if (!container) return;

  const categorySymbols = {
    'Medicamentos': '⚕',
    'Higiene e beleza': '✦',
    'Dermocosméticos': '☼',
    'Vitaminas e Suplementos': '♥',
    'Mundo infantil': '♧',
    'Primeiros socorros': '✚'
  };

  const cats = config.categories || DEFAULT_CATEGORIES;
  container.innerHTML = cats.map(cat => `
    <button class="category-card-btn" type="button" onclick="setCategory('${cat}'); location.hash='produtos';">
      <span class="cat-symbol">${categorySymbols[cat] || '✚'}</span>
      <span>${cat}</span>
    </button>
  `).join('');
}

function createProductCard(p) {
  const currentPrice = p.sale || p.price;
  const hasDiscount = p.sale && p.sale < p.price;
  const discountPercent = hasDiscount ? Math.round(((p.price - p.sale) / p.price) * 100) : 0;
  const isAvailable = p.stock > 0;

  return `
    <article class="product-card" data-product-id="${p.id}">
      <div class="card-badge-top">
        ${p.promo ? '<span class="badge-promo">PROMO DO DIA</span>' : ''}
        ${hasDiscount ? `<span class="badge-discount">-${discountPercent}%</span>` : ''}
      </div>

      <div class="product-image-wrap">
        <img class="product-image" src="${p.image || FALLBACK_IMAGE}" alt="${p.name}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'" />
      </div>

      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <div class="product-name" title="${p.name}">${p.name}</div>

        <div class="price-row">
          <strong class="price">${money(currentPrice)}</strong>
          ${hasDiscount ? `<span class="old-price">${money(p.price)}</span>` : ''}
        </div>

        ${isAvailable ? `
          <div class="card-buy">
            <div class="card-quantity" aria-label="Quantidade de ${p.name}">
              <button type="button" onclick="changeCardQty(this, -1)" aria-label="Diminuir quantidade">−</button>
              <input class="card-qty-input" type="number" value="1" min="1" max="${p.stock}" readonly aria-label="Quantidade" />
              <button type="button" onclick="changeCardQty(this, 1)" aria-label="Aumentar quantidade">+</button>
            </div>
            <button class="add-button" type="button" onclick="addCart(${p.id}, this)">
              Adicionar
            </button>
          </div>
        ` : `
          <span class="sold-out-badge">ESGOTADO</span>
        `}
      </div>
    </article>
  `;
}

function renderStore() {
  const searchInput = $('#search');
  const rawSearch = (searchInput?.value || '').trim();
  const searchNorm = normalizeStr(rawSearch);
  const clearBtn = $('#search-clear-btn');
  if (clearBtn) {
    clearBtn.style.display = rawSearch.length > 0 ? 'inline-block' : 'none';
  }

  const allProducts = db.products;

  const filtered = allProducts.filter(p => {
    const matchCategory = currentCategory === 'Todos' || p.category === currentCategory;
    const nameNorm = normalizeStr(p.name);
    const catNorm = normalizeStr(p.category);
    const matchSearch = !searchNorm || nameNorm.includes(searchNorm) || catNorm.includes(searchNorm);
    return matchCategory && matchSearch;
  });

  const cats = ['Todos', ...(config.categories || DEFAULT_CATEGORIES)];
  const filtersContainer = $('#category-filters');
  if (filtersContainer) {
    filtersContainer.innerHTML = cats.map(c => `
      <button class="filter-btn ${c === currentCategory ? 'active' : ''}" type="button" onclick="setCategory('${c}')">
        ${c}
      </button>
    `).join('');
  }

  const productListEl = $('#product-list');
  if (productListEl) {
    if (filtered.length > 0) {
      productListEl.innerHTML = filtered.map(createProductCard).join('');
    } else {
      productListEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 16px; color: var(--muted);">
          <p style="font-size: 0.95rem; margin-bottom: 10px;">Nenhum produto encontrado para "<strong>${rawSearch}</strong>".</p>
          <button class="primary-button" onclick="clearHeaderSearch()" type="button">Ver todos os produtos</button>
        </div>
      `;
    }
  }

  const countEl = $('#product-count');
  if (countEl) {
    if (rawSearch) {
      countEl.innerHTML = `Busca por "<strong>${rawSearch}</strong>": ${filtered.length} produto${filtered.length !== 1 ? 's' : ''}`;
    } else {
      countEl.textContent = `${filtered.length} produto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;
    }
  }

  const promos = allProducts.filter(p => p.promo && p.stock > 0);
  const promoListEl = $('#promo-list');
  if (promoListEl) {
    if (promos.length > 0) {
      promoListEl.innerHTML = promos.map(createProductCard).join('');
    } else {
      promoListEl.innerHTML = '<p style="color: var(--muted); padding: 10px 0; font-size: 0.82rem;">Nenhuma oferta em destaque hoje.</p>';
    }
  }
}

window.handleHeaderSearch = function(e) {
  if (e) e.preventDefault();
  currentCategory = 'Todos';
  renderStore();
  const prodSection = document.getElementById('produtos');
  if (prodSection) {
    prodSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

window.clearHeaderSearch = function() {
  const searchInput = $('#search');
  if (searchInput) searchInput.value = '';
  currentCategory = 'Todos';
  renderStore();
  searchInput?.focus();
};

window.setCategory = function(cat) {
  currentCategory = cat;
  renderStore();
};

window.changeCardQty = function(button, delta) {
  const input = button.parentElement.querySelector('.card-qty-input');
  if (!input) return;
  const max = Number(input.getAttribute('max')) || 99;
  const current = Number(input.value) || 1;
  const updated = Math.max(1, Math.min(max, current + delta));
  input.value = updated;
};

/* ==========================================================================
   MÓDULO: CARRINHO & FRETE GRÁTIS
   ========================================================================== */

function animateFlyToCart(button) {
  const card = button.closest('.product-card');
  const image = card?.querySelector('.product-image');
  const cartBtn = $('#open-cart');
  if (!image || !cartBtn) return;

  const from = image.getBoundingClientRect();
  const to = cartBtn.getBoundingClientRect();

  const fly = image.cloneNode(true);
  fly.className = 'cart-fly-item';
  fly.style.left = `${from.left}px`;
  fly.style.top = `${from.top}px`;
  fly.style.width = `${from.width}px`;
  fly.style.height = `${from.height}px`;

  document.body.appendChild(fly);

  requestAnimationFrame(() => {
    fly.style.transform = `translate(${to.left - from.left + 8}px, ${to.top - from.top + 7}px) scale(0.15)`;
    fly.style.opacity = '0';
  });

  fly.addEventListener('transitionend', () => fly.remove(), { once: true });
}

function pulseCartButton() {
  const cartBtn = $('#open-cart');
  if (!cartBtn) return;
  cartBtn.classList.remove('cart-added');
  void cartBtn.offsetWidth;
  cartBtn.classList.add('cart-added');
  setTimeout(() => cartBtn.classList.remove('cart-added'), 450);
}

window.addCart = function(id, button) {
  const product = db.products.find(p => p.id === id);
  if (!product || product.stock <= 0) return;

  const card = button?.closest('.product-card');
  const qtyInput = card?.querySelector('.card-qty-input');
  const qtyToAdd = Math.max(1, Math.min(product.stock, Number(qtyInput?.value || 1)));

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty = Math.min(product.stock, existing.qty + qtyToAdd);
  } else {
    cart.push({ id, qty: qtyToAdd });
  }

  if (button) animateFlyToCart(button);
  pulseCartButton();
  renderCart();
};

function renderCart() {
  let subtotal = 0;
  const cartItemsEl = $('#cart-items');

  if (cartItemsEl) {
    if (cart.length > 0) {
      cartItemsEl.innerHTML = cart.map(item => {
        const product = db.products.find(p => p.id === item.id);
        if (!product) return '';
        const price = product.sale || product.price;
        const lineTotal = price * item.qty;
        subtotal += lineTotal;

        return `
          <div class="cart-item">
            <img src="${product.image || FALLBACK_IMAGE}" alt="" onerror="this.src='${FALLBACK_IMAGE}'" />
            <div>
              <strong>${product.name}</strong>
              <small>${money(price)}</small>
              <div class="cart-item-qty">
                <button type="button" onclick="changeCartQty(${product.id}, -1)">−</button>
                <b>${item.qty}</b>
                <button type="button" onclick="changeCartQty(${product.id}, 1)" ${item.qty >= product.stock ? 'disabled' : ''}>+</button>
              </div>
            </div>
            <button class="remove-btn" type="button" onclick="removeFromCart(${product.id})" aria-label="Remover">×</button>
          </div>
        `;
      }).join('');
    } else {
      cartItemsEl.innerHTML = `
        <div class="empty-cart-msg">
          <p>Sua cesta está vazia.<br>Que tal escolher um produto?</p>
        </div>
      `;
    }
  }

  const freeThreshold = Number(config.freeShippingThreshold || DEFAULT_CONFIG.freeShippingThreshold);
  const baseDeliveryFee = Number(config.deliveryFee || DEFAULT_CONFIG.deliveryFee);
  const isFreeShipping = subtotal >= freeThreshold;
  const actualDeliveryFee = (cart.length === 0 || isFreeShipping) ? 0 : baseDeliveryFee;
  const grandTotal = subtotal + actualDeliveryFee;

  const freeShippingCard = $('#free-shipping-container');
  const freeShippingMsg = $('#free-shipping-msg');
  const freeShippingProgress = $('#free-shipping-progress');

  if (freeShippingCard && freeShippingMsg && freeShippingProgress) {
    if (cart.length === 0) {
      freeShippingCard.classList.remove('achieved');
      freeShippingProgress.style.width = '0%';
      freeShippingMsg.innerHTML = `Frete grátis em compras a partir de ${money(freeThreshold)}`;
    } else if (isFreeShipping) {
      freeShippingCard.classList.add('achieved');
      freeShippingProgress.style.width = '100%';
      freeShippingMsg.innerHTML = `Você atingiu o valor para entrega gratuita.`;
    } else {
      freeShippingCard.classList.remove('achieved');
      const diff = freeThreshold - subtotal;
      const percent = Math.min(100, Math.max(5, Math.round((subtotal / freeThreshold) * 100)));
      freeShippingProgress.style.width = `${percent}%`;
      freeShippingMsg.innerHTML = `Frete grátis: faltam <strong>${money(diff)}</strong> para entrega gratuita.`;
    }
  }

  $('#cart-subtotal').textContent = money(subtotal);
  const deliveryEl = $('#cart-delivery-fee');
  if (deliveryEl) {
    if (cart.length === 0) {
      deliveryEl.textContent = money(0);
      deliveryEl.className = '';
    } else if (isFreeShipping) {
      deliveryEl.innerHTML = '<span class="free-tag">Grátis</span>';
    } else {
      deliveryEl.textContent = money(actualDeliveryFee);
      deliveryEl.className = '';
    }
  }
  $('#cart-total').textContent = money(grandTotal);

  const cartCountEl = $('#cart-count');
  const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = totalCount;

  const checkoutBtn = $('#checkout');
  if (checkoutBtn) {
    checkoutBtn.disabled = cart.length === 0;
    checkoutBtn.style.opacity = cart.length === 0 ? '0.5' : '1';
  }
}

window.changeCartQty = function(id, delta) {
  const item = cart.find(x => x.id === id);
  const product = db.products.find(x => x.id === id);
  if (!item || !product) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(x => x.id !== id);
  } else if (item.qty > product.stock) {
    item.qty = product.stock;
  }
  renderCart();
};

window.removeFromCart = function(id) {
  cart = cart.filter(x => x.id !== id);
  renderCart();
};

function openCart() {
  $('#cart-drawer')?.classList.add('open');
  $('#overlay')?.classList.add('show');
}

function closeCart() {
  $('#cart-drawer')?.classList.remove('open');
  $('#overlay')?.classList.remove('show');
}

/* ==========================================================================
   MÓDULO: ENDEREÇO & CHECKOUT
   ========================================================================== */

function getSavedAddress() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_ADDRESS_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveCustomerAddress(addressObj) {
  localStorage.setItem(CUSTOMER_ADDRESS_KEY, JSON.stringify(addressObj));
  updateAccountAddressView();
}

function prepareCheckoutForm() {
  const saved = getSavedAddress();
  const alertEl = $('#saved-address-alert');

  if (saved && saved.street) {
    $('#address-street').value = saved.street || '';
    $('#address-number').value = saved.number || '';
    $('#address-district').value = saved.district || '';
    $('#address-reference').value = saved.reference || '';
    if (alertEl) alertEl.hidden = false;
  } else {
    if (alertEl) alertEl.hidden = true;
  }

  const subtotal = cart.reduce((acc, item) => {
    const prod = db.products.find(p => p.id === item.id);
    return acc + ((prod?.sale || prod?.price || 0) * item.qty);
  }, 0);

  const freeThreshold = Number(config.freeShippingThreshold || DEFAULT_CONFIG.freeShippingThreshold);
  const baseDelivery = Number(config.deliveryFee || DEFAULT_CONFIG.deliveryFee);
  const isFree = subtotal >= freeThreshold;
  const delivery = isFree ? 0 : baseDelivery;
  const total = subtotal + delivery;

  $('#checkout-subtotal').textContent = money(subtotal);
  $('#checkout-delivery-fee').innerHTML = isFree ? '<span class="free-tag">Grátis</span>' : money(delivery);
  $('#checkout-total').textContent = money(total);
}

window.clearSavedAddressForm = function() {
  $('#address-street').value = '';
  $('#address-number').value = '';
  $('#address-district').value = '';
  $('#address-reference').value = '';
  const alertEl = $('#saved-address-alert');
  if (alertEl) alertEl.hidden = true;
};

function handleCheckoutSubmit(e) {
  e.preventDefault();

  if (cart.length === 0) return;

  const stockErrors = [];
  cart.forEach(item => {
    const prod = db.products.find(p => p.id === item.id);
    if (!prod || prod.stock < item.qty) {
      stockErrors.push(prod ? prod.name : 'Item indisponível');
    }
  });

  if (stockErrors.length > 0) {
    alert(`Atenção: O item "${stockErrors[0]}" não possui estoque suficiente.`);
    renderStore();
    renderCart();
    return;
  }

  const street = $('#address-street').value.trim();
  const number = $('#address-number').value.trim();
  const district = $('#address-district').value.trim();
  const reference = $('#address-reference').value.trim();
  const payment = $('#payment').value;
  const notes = $('#order-notes')?.value.trim() || '';

  const addressObj = { street, number, district, reference };
  const addressFull = `${street}, nº ${number} — ${district}${reference ? ` (${reference})` : ''}`;

  if ($('#save-address-checkbox')?.checked) {
    saveCustomerAddress(addressObj);
  }

  let subtotal = 0;
  const orderItems = cart.map(item => {
    const prod = db.products.find(p => p.id === item.id);
    const unitPrice = prod.sale || prod.price;
    subtotal += unitPrice * item.qty;

    prod.stock -= item.qty;

    return {
      productId: prod.id,
      name: prod.name,
      category: prod.category,
      qty: item.qty,
      price: unitPrice
    };
  });

  const freeThreshold = Number(config.freeShippingThreshold || DEFAULT_CONFIG.freeShippingThreshold);
  const baseDelivery = Number(config.deliveryFee || DEFAULT_CONFIG.deliveryFee);
  const isFreeShipping = subtotal >= freeThreshold;
  const deliveryFeeCharged = isFreeShipping ? 0 : baseDelivery;
  const finalTotal = subtotal + deliveryFeeCharged;

  const orderRecord = {
    id: Date.now(),
    date: new Date().toISOString(),
    items: orderItems,
    subtotal: subtotal,
    deliveryFee: deliveryFeeCharged,
    isFreeShipping: isFreeShipping,
    total: finalTotal,
    payment: payment,
    address: addressFull,
    notes: notes,
    status: 'Recebido'
  };

  db.sales.unshift(orderRecord);
  saveDatabase();

  const itemLines = orderItems.map(i => `• ${i.qty}x ${i.name} — ${money(i.price * i.qty)}`);
  const whatsappMsg = [
    `*NOVO PEDIDO — Drogarias Pietrão*`,
    ``,
    `*Itens:*`,
    itemLines.join('\n'),
    ``,
    `*Subtotal:* ${money(subtotal)}`,
    `*Taxa de Entrega:* ${isFreeShipping ? 'Grátis' : money(deliveryFeeCharged)}`,
    `*Total: ${money(finalTotal)}*`,
    ``,
    `*Forma de Pagamento:* ${payment}`,
    `*Endereço de Entrega:* ${addressFull}`,
    notes ? `*Observações:* ${notes}` : ``
  ].filter(Boolean).join('\n');

  cart = [];
  renderStore();
  renderCart();
  e.target.reset();
  $('#checkout-modal')?.close();
  closeCart();

  const whatsappNum = (config.whatsapp || DEFAULT_CONFIG.whatsapp).replace(/\D/g, '');
  const url = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(whatsappMsg)}`;
  window.open(url, '_blank');
}

window.openDirectWhatsApp = function() {
  const whatsappNum = (config.whatsapp || DEFAULT_CONFIG.whatsapp).replace(/\D/g, '');
  const msg = 'Olá! Gostaria de atendimento na Drogarias Pietrão.';
  window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(msg)}`, '_blank');
};

/* ==========================================================================
   MÓDULO: CEP & CONTA DO CLIENTE
   ========================================================================== */

function setupLocationAndAccount() {
  $('#open-cep-btn')?.addEventListener('click', () => {
    $('#cep-modal')?.showModal();
  });

  window.handleCepSubmit = function(e) {
    e.preventDefault();
    const val = $('#input-cep').value.trim();
    if (!val) return;
    $('#cep-result').hidden = false;
    $('#cep-label-strong').textContent = val.length === 8 || val.length === 9 ? `CEP: ${val}` : val;
    $('#cep-label-small').textContent = 'Entregar em:';
  };

  $('#open-account')?.addEventListener('click', openCustomerAccount);
  $('#show-register')?.addEventListener('click', showCustomerRegister);
  $('#show-login')?.addEventListener('click', showCustomerLogin);
}

function getCustomer() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null');
  } catch {
    return null;
  }
}

function isCustomerLogged() {
  return localStorage.getItem(CUSTOMER_SESSION_KEY) === 'true';
}

function updateCustomerHeader() {
  const c = getCustomer();
  const logged = c && isCustomerLogged();
  const greetingEl = $('#account-greeting');
  const labelEl = $('#account-label');

  if (greetingEl) greetingEl.textContent = logged ? `Olá, ${c.name.split(' ')[0]}` : 'Olá, visitante';
  if (labelEl) labelEl.textContent = logged ? 'Minha conta' : 'Entre ou cadastre-se';
}

function updateAccountAddressView() {
  const saved = getSavedAddress();
  const addressTextEl = $('#customer-address-text');
  if (!addressTextEl) return;

  if (saved && saved.street) {
    addressTextEl.innerHTML = `<strong>${saved.street}, nº ${saved.number}</strong><br>${saved.district}${saved.reference ? ` — ${saved.reference}` : ''}`;
  } else {
    addressTextEl.textContent = 'Nenhum endereço salvo no momento.';
  }
}

window.editAccountAddress = function() {
  const saved = getSavedAddress() || {};
  $('#acc-address-street').value = saved.street || '';
  $('#acc-address-number').value = saved.number || '';
  $('#acc-address-district').value = saved.district || '';
  $('#acc-address-reference').value = saved.reference || '';

  $('#customer-address-details').hidden = true;
  $('#customer-address-form').hidden = false;
};

window.cancelAccountAddressEdit = function() {
  $('#customer-address-details').hidden = false;
  $('#customer-address-form').hidden = true;
};

window.handleCustomerAddressSave = function(e) {
  e.preventDefault();
  const address = {
    street: $('#acc-address-street').value.trim(),
    number: $('#acc-address-number').value.trim(),
    district: $('#acc-address-district').value.trim(),
    reference: $('#acc-address-reference').value.trim()
  };
  saveCustomerAddress(address);
  cancelAccountAddressEdit();
};

function showCustomerLogin() {
  $('#account-modal-title').textContent = 'Entre na sua conta';
  $('#account-modal-text').textContent = 'Acesse ou crie seu cadastro neste dispositivo.';
  $('#customer-login-form').hidden = false;
  $('#customer-register-form').hidden = true;
  $('#customer-account-view').hidden = true;
  $('#customer-login-error').textContent = '';
}

function showCustomerRegister() {
  $('#account-modal-title').textContent = 'Crie seu cadastro';
  $('#account-modal-text').textContent = 'Seus dados ficarão salvos com segurança neste dispositivo.';
  $('#customer-login-form').hidden = true;
  $('#customer-register-form').hidden = false;
  $('#customer-account-view').hidden = true;
  $('#customer-register-error').textContent = '';
}

function showCustomerAccount() {
  const c = getCustomer();
  if (!c || !isCustomerLogged()) return showCustomerLogin();

  $('#account-modal-title').textContent = 'Sua conta';
  $('#account-modal-text').textContent = 'Seu cadastro está ativo neste dispositivo.';
  $('#customer-login-form').hidden = true;
  $('#customer-register-form').hidden = true;
  $('#customer-account-view').hidden = false;
  $('#customer-name-display').textContent = c.name;
  $('#customer-email-display').textContent = c.email;
  updateAccountAddressView();
}

function openCustomerAccount() {
  showCustomerAccount();
  $('#account-modal')?.showModal();
}

/* ==========================================================================
   MÓDULO: PAINEL ADMINISTRATIVO CORPORATIVO
   ========================================================================== */

function isAdminLogged() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

function showAdmin() {
  $('#storefront').hidden = true;
  $('#admin-area').hidden = false;

  const logged = isAdminLogged();
  $('#login-screen').hidden = logged;
  $('#dashboard').hidden = !logged;

  if (logged) {
    renderAdminDashboard();
  } else {
    $('#login-password').value = '';
    $('#login-error').textContent = '';
    setTimeout(() => $('#login-user')?.focus(), 50);
  }
}

function showStore() {
  $('#admin-area').hidden = true;
  $('#storefront').hidden = false;
  location.hash = 'inicio';
}

function handleAdminLogin(e) {
  e.preventDefault();
  const emailInput = $('#login-user').value.trim().toLowerCase();
  const passwordInput = $('#login-password').value;

  const adminEmail = (config.adminEmail || DEFAULT_CONFIG.adminEmail).toLowerCase();
  const adminPassword = config.adminPassword || DEFAULT_CONFIG.adminPassword;

  if (emailInput === adminEmail && passwordInput === adminPassword) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    $('#login-error').textContent = '';
    e.target.reset();
    showAdmin();
  } else {
    $('#login-error').textContent = 'E-mail ou senha de administrador incorretos.';
    $('#login-password').value = '';
    $('#login-password').focus();
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  showStore();
}

function setupAdminTabs() {
  $$('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.adminView;
      currentAdminTab = view;

      $$('.admin-tab').forEach(b => b.classList.toggle('active', b === btn));

      $('#catalog-view').hidden = view !== 'catalog';
      $('#stock-alerts-view').hidden = view !== 'stock-alerts';
      $('#sales-view').hidden = view !== 'sales';
      $('#settings-view').hidden = view !== 'settings';

      renderAdminDashboard();
    });
  });
}

function renderAdminDashboard() {
  if (!isAdminLogged()) return;
  updateStockAlertBadge();

  if (currentAdminTab === 'catalog') {
    renderAdminCatalog();
  } else if (currentAdminTab === 'stock-alerts') {
    renderStockAlerts();
  } else if (currentAdminTab === 'sales') {
    renderAdminSales();
  } else if (currentAdminTab === 'settings') {
    renderAdminSettings();
  }
}

function updateStockAlertBadge() {
  const threshold = config.lowStockThreshold || DEFAULT_CONFIG.lowStockThreshold;
  const alertCount = db.products.filter(p => p.stock <= threshold).length;

  const badge = $('#stock-alert-badge');
  if (badge) {
    badge.textContent = alertCount;
    badge.style.display = alertCount > 0 ? 'inline-block' : 'none';
  }
}

/* ABA 1: CATÁLOGO */
function renderAdminCatalog() {
  const searchTerm = ($('#admin-search')?.value || '').trim().toLowerCase();
  const categoryFilter = $('#admin-category-filter')?.value || 'all';
  const stockFilter = $('#admin-stock-filter')?.value || 'all';
  const threshold = config.lowStockThreshold || DEFAULT_CONFIG.lowStockThreshold;

  const catFilterEl = $('#admin-category-filter');
  if (catFilterEl && catFilterEl.options.length <= 1) {
    const cats = config.categories || DEFAULT_CATEGORIES;
    catFilterEl.innerHTML = '<option value="all">Todas as categorias</option>' + 
      cats.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  const list = db.products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm);
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;

    let matchStock = true;
    if (stockFilter === 'in-stock') matchStock = p.stock > threshold;
    else if (stockFilter === 'low-stock') matchStock = p.stock > 0 && p.stock <= threshold;
    else if (stockFilter === 'out-of-stock') matchStock = p.stock === 0;

    return matchSearch && matchCat && matchStock;
  });

  const totalStock = db.products.reduce((acc, p) => acc + p.stock, 0);
  const activePromos = db.products.filter(p => p.promo).length;
  const lowStockCount = db.products.filter(p => p.stock <= threshold).length;

  $('#stat-products').textContent = db.products.length;
  $('#stat-stock').textContent = `${totalStock} un.`;
  $('#stat-promos').textContent = activePromos;
  $('#stat-low-stock').textContent = lowStockCount;

  const tbody = $('#admin-product-list');
  if (!tbody) return;

  if (list.length > 0) {
    tbody.innerHTML = list.map(p => {
      let stockBadgeClass = 'stock-ok';
      let stockLabel = `${p.stock} un.`;
      if (p.stock === 0) {
        stockBadgeClass = 'stock-empty';
        stockLabel = 'Esgotado (0)';
      } else if (p.stock <= threshold) {
        stockBadgeClass = 'stock-low';
        stockLabel = `Baixo (${p.stock})`;
      }

      const hasDiscount = p.sale && p.sale < p.price;
      const discountPercent = hasDiscount ? Math.round(((p.price - p.sale) / p.price) * 100) : 0;

      return `
        <tr>
          <td>
            <img class="table-product-thumb" src="${p.image || FALLBACK_IMAGE}" alt="" onerror="this.src='${FALLBACK_IMAGE}'" />
          </td>
          <td>
            <strong>${p.name}</strong>
          </td>
          <td>${p.category}</td>
          <td>${money(p.price)}</td>
          <td>
            ${p.sale ? `
              <strong style="color: var(--red);">${money(p.sale)}</strong>
              <small class="promo-tag">-${discountPercent}%</small>
            ` : '—'}
          </td>
          <td>
            <span class="stock-badge-pill ${stockBadgeClass}">
              ${stockLabel}
            </span>
          </td>
          <td>
            ${p.promo ? '<span class="promo-tag">Promo do Dia</span>' : '<span style="color: var(--muted); font-size: 0.72rem;">Normal</span>'}
          </td>
          <td class="text-right">
            <div class="table-actions">
              <button class="action-btn btn-restock" type="button" onclick="quickRestockPrompt(${p.id})">+ Estoque</button>
              <button class="action-btn btn-edit" type="button" onclick="openProductModal(${p.id})">Editar</button>
              <button class="action-btn btn-delete" type="button" onclick="deleteProduct(${p.id})">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 28px; color: var(--muted);">
          Nenhum produto encontrado.
        </td>
      </tr>
    `;
  }
}

/* ABA 2: ESTOQUE EM ATENÇÃO */
function renderStockAlerts() {
  const container = $('#stock-alerts-container');
  if (!container) return;

  const threshold = config.lowStockThreshold || DEFAULT_CONFIG.lowStockThreshold;
  const alertProducts = db.products.filter(p => p.stock <= threshold);

  if (alertProducts.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <h3>Estoque regularizado</h3>
        <p style="margin-top: 4px;">Nenhum produto está com estoque crítico no momento.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = alertProducts.map(p => {
    const isZero = p.stock === 0;

    return `
      <div class="stock-alert-card ${isZero ? 'critical' : ''}">
        <img class="alert-img" src="${p.image || FALLBACK_IMAGE}" alt="" onerror="this.src='${FALLBACK_IMAGE}'" />
        <div class="alert-content">
          <h3>${p.name}</h3>
          <small>${p.category}</small>
          
          <div class="alert-stock-info">
            Status: ${isZero ? '<span style="color: var(--red);">Esgotado (0 un.)</span>' : `<span>${p.stock} un. restantes</span>`}
          </div>

          <div style="font-size: 0.7rem; font-weight: 700; color: var(--muted); margin-bottom: 5px;">Reposição de estoque:</div>
          <div class="quick-restock-btns">
            <button type="button" onclick="addStock(${p.id}, 5)">+5</button>
            <button type="button" onclick="addStock(${p.id}, 10)">+10</button>
            <button type="button" onclick="addStock(${p.id}, 20)">+20</button>
            <button type="button" onclick="quickRestockPrompt(${p.id})">Outro</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.addStock = function(id, amount) {
  const prod = db.products.find(p => p.id === id);
  if (!prod) return;
  prod.stock += amount;
  saveDatabase();
  renderAdminDashboard();
  renderStore();
};

window.quickRestockPrompt = function(id) {
  const prod = db.products.find(p => p.id === id);
  if (!prod) return;
  const input = prompt(`Repor estoque para "${prod.name}" (Estoque atual: ${prod.stock} un.):\nDigite a quantidade a adicionar:`, '10');
  if (input !== null) {
    const qty = parseInt(input, 10);
    if (!isNaN(qty) && qty > 0) {
      prod.stock += qty;
      saveDatabase();
      renderAdminDashboard();
      renderStore();
    }
  }
};

/* ABA 3: PEDIDOS */
function renderAdminSales() {
  const salesMonthEl = $('#sales-month');
  const salesCatEl = $('#sales-category');
  const salesProdEl = $('#sales-product');

  const selectedMonth = salesMonthEl?.value || 'all';
  const selectedCat = salesCatEl?.value || 'all';
  const selectedProd = salesProdEl?.value || 'all';

  const months = [...new Set(db.sales.map(s => s.date.slice(0, 7)))].sort().reverse();
  const cats = config.categories || DEFAULT_CATEGORIES;

  if (salesMonthEl) {
    salesMonthEl.innerHTML = '<option value="all">Todos os meses</option>' +
      months.map(m => `<option value="${m}">${formatMonthLabel(m)}</option>`).join('');
    salesMonthEl.value = months.includes(selectedMonth) ? selectedMonth : 'all';
  }

  if (salesCatEl) {
    salesCatEl.innerHTML = '<option value="all">Todas as categorias</option>' +
      cats.map(c => `<option value="${c}">${c}</option>`).join('');
    salesCatEl.value = cats.includes(selectedCat) ? selectedCat : 'all';
  }

  if (salesProdEl) {
    salesProdEl.innerHTML = '<option value="all">Todos os produtos</option>' +
      db.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    salesProdEl.value = db.products.some(p => String(p.id) === selectedProd) ? selectedProd : 'all';
  }

  const monthFilter = salesMonthEl?.value || 'all';
  const catFilter = salesCatEl?.value || 'all';
  const prodFilter = salesProdEl?.value || 'all';

  const orders = db.sales.filter(s => monthFilter === 'all' || s.date.startsWith(monthFilter));

  const matchingItems = orders.flatMap(s =>
    s.items.filter(i =>
      (catFilter === 'all' || i.category === catFilter) &&
      (prodFilter === 'all' || String(i.productId) === prodFilter)
    ).map(i => ({ ...i, orderDate: s.date, orderId: s.id }))
  );

  const totalRevenue = matchingItems.reduce((acc, i) => acc + (i.qty * i.price), 0);
  const totalUnits = matchingItems.reduce((acc, i) => acc + i.qty, 0);
  const totalOrdersCount = new Set(matchingItems.map(i => i.orderId)).size;

  $('#sales-revenue').textContent = money(totalRevenue);
  $('#sales-orders').textContent = totalOrdersCount;
  $('#sales-units').textContent = totalUnits;

  const grouped = {};
  matchingItems.forEach(i => {
    grouped[i.name] = (grouped[i.name] || 0) + i.qty;
  });

  const chartEntries = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxQty = Math.max(...chartEntries.map(x => x[1]), 1);

  const chartEl = $('#sales-chart');
  if (chartEl) {
    if (chartEntries.length > 0) {
      chartEl.innerHTML = chartEntries.map(([name, qty]) => `
        <div class="bar-column">
          <span class="bar-value">${qty}</span>
          <div class="bar" style="height: ${Math.max(8, (qty / maxQty) * 130)}px;"></div>
          <span class="bar-label" title="${name}">${name}</span>
        </div>
      `).join('');
    } else {
      chartEl.innerHTML = '<p style="color: var(--muted); align-self: center; margin: auto; font-size: 0.82rem;">Não há vendas para os filtros selecionados.</p>';
    }
  }

  const tbody = $('#sales-order-list');
  if (!tbody) return;

  const relevantOrders = orders.filter(s =>
    s.items.some(i =>
      (catFilter === 'all' || i.category === catFilter) &&
      (prodFilter === 'all' || String(i.productId) === prodFilter)
    )
  );

  if (relevantOrders.length > 0) {
    tbody.innerHTML = relevantOrders.map(order => {
      const dateFormatted = new Date(order.date).toLocaleDateString('pt-BR');
      const itemsDesc = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
      const currentStatus = order.status || 'Recebido';
      const deliveryText = order.isFreeShipping ? 'Grátis' : money(order.deliveryFee || 0);

      return `
        <tr>
          <td>${dateFormatted}</td>
          <td><small>${order.address || '—'}</small></td>
          <td><small>${itemsDesc}</small></td>
          <td>${order.payment || 'Pix'}</td>
          <td>${deliveryText}</td>
          <td><strong>${money(order.total)}</strong></td>
          <td>
            <select class="order-status-select ${getStatusClass(currentStatus)}" onchange="updateOrderStatus(${order.id}, this.value)">
              <option value="Recebido" ${currentStatus === 'Recebido' ? 'selected' : ''}>Recebido</option>
              <option value="Em separação" ${currentStatus === 'Em separação' ? 'selected' : ''}>Em separação</option>
              <option value="Saiu para entrega" ${currentStatus === 'Saiu para entrega' ? 'selected' : ''}>Saiu p/ entrega</option>
              <option value="Concluído" ${currentStatus === 'Concluído' ? 'selected' : ''}>Concluído</option>
              <option value="Cancelado" ${currentStatus === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: var(--muted);">
          Nenhum pedido encontrado.
        </td>
      </tr>
    `;
  }
}

function formatMonthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function getStatusClass(status) {
  switch (status) {
    case 'Recebido': return 'status-recebido';
    case 'Em separação': return 'status-preparando';
    case 'Saiu para entrega': return 'status-enviado';
    case 'Concluído': return 'status-concluido';
    case 'Cancelado': return 'status-cancelado';
    default: return 'status-recebido';
  }
}

window.updateOrderStatus = function(orderId, newStatus) {
  const order = db.sales.find(s => s.id === orderId);
  if (!order) return;
  order.status = newStatus;
  saveDatabase();
  renderAdminSales();
};

/* ABA 4: CONFIGURAÇÕES */
function renderAdminSettings() {
  $('#cfg-whatsapp').value = config.whatsapp || DEFAULT_CONFIG.whatsapp;
  $('#cfg-delivery-fee').value = config.deliveryFee !== undefined ? config.deliveryFee : DEFAULT_CONFIG.deliveryFee;
  $('#cfg-free-shipping').value = config.freeShippingThreshold !== undefined ? config.freeShippingThreshold : DEFAULT_CONFIG.freeShippingThreshold;
  $('#cfg-notice').value = config.storeNotice || DEFAULT_CONFIG.storeNotice;
  $('#cfg-store-hours-text').value = config.storeHoursText || DEFAULT_CONFIG.storeHoursText;
  $('#cfg-store-status').value = config.storeStatusMode || DEFAULT_CONFIG.storeStatusMode;
  $('#cfg-close-hour').value = config.closeHour !== undefined ? config.closeHour : DEFAULT_CONFIG.closeHour;
  $('#cfg-threshold').value = config.lowStockThreshold || DEFAULT_CONFIG.lowStockThreshold;
  $('#cfg-admin-email').value = config.adminEmail || DEFAULT_CONFIG.adminEmail;
  if ($('#cfg-github-token')) $('#cfg-github-token').value = getGitHubToken();
  $('#cfg-admin-password').value = '';
  $('#cfg-admin-password-confirm').value = '';
  $('#cfg-cred-error').textContent = '';
  $('#cfg-cred-success').textContent = '';
}

window.handleStoreSettingsSubmit = function(e) {
  e.preventDefault();
  config.whatsapp = $('#cfg-whatsapp').value.trim();
  config.deliveryFee = Math.max(0, parseFloat($('#cfg-delivery-fee').value) || 0);
  config.freeShippingThreshold = Math.max(0, parseFloat($('#cfg-free-shipping').value) || 0);
  config.storeNotice = $('#cfg-notice').value.trim();
  config.storeHoursText = $('#cfg-store-hours-text').value.trim() || DEFAULT_CONFIG.storeHoursText;
  config.storeStatusMode = $('#cfg-store-status').value;
  config.closeHour = Math.min(23, Math.max(0, parseInt($('#cfg-close-hour').value, 10) || 20));
  config.lowStockThreshold = Math.max(1, parseInt($('#cfg-threshold').value, 10) || 5);

  saveConfig();
  applyStoreConfig();
  renderStoreHours();
  renderCart();
  alert('Configurações atualizadas com sucesso!');
  renderAdminDashboard();
};

window.handleAdminCredentialsSubmit = function(e) {
  e.preventDefault();
  const email = $('#cfg-admin-email').value.trim().toLowerCase();
  const p1 = $('#cfg-admin-password').value;
  const p2 = $('#cfg-admin-password-confirm').value;

  const errEl = $('#cfg-cred-error');
  const sucEl = $('#cfg-cred-success');
  errEl.textContent = '';
  sucEl.textContent = '';

  if (!email) {
    errEl.textContent = 'Informe um e-mail válido.';
    return;
  }

  if (p1 !== p2) {
    errEl.textContent = 'As senhas digitadas não conferem.';
    return;
  }

  if (p1.length < 4) {
    errEl.textContent = 'A senha deve conter ao menos 4 caracteres.';
    return;
  }

  config.adminEmail = email;
  config.adminPassword = p1;
  saveConfig();

  sucEl.textContent = 'Login e senha atualizados com sucesso!';
  $('#cfg-admin-password').value = '';
  $('#cfg-admin-password-confirm').value = '';
};

window.exportDataBackup = function() {
  const data = {
    db: db,
    config: config,
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_pietrao_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

window.importDataBackup = function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.db && Array.isArray(imported.db.products)) {
        db = imported.db;
        saveDatabase();
        if (imported.config) {
          config = imported.config;
          saveConfig();
        }
        alert('Backup restaurado com sucesso!');
        location.reload();
      } else {
        alert('Arquivo de backup inválido.');
      }
    } catch {
      alert('Erro ao processar o backup.');
    }
  };
  reader.readAsText(file);
};

window.resetToDefaultData = function() {
  if (confirm('Deseja restaurar o catálogo para a base de demonstração?')) {
    db.products = [...SEED_PRODUCTS];
    config.categories = [...DEFAULT_CATEGORIES];
    config.deliveryFee = DEFAULT_CONFIG.deliveryFee;
    config.freeShippingThreshold = DEFAULT_CONFIG.freeShippingThreshold;
    saveDatabase();
    saveConfig();
    alert('Catálogo restaurado com sucesso!');
    location.reload();
  }
};

/* MODAL DE PRODUTO */
function fillProductModalCategories(selectedCategory = '') {
  const select = $('#p-category');
  if (!select) return;

  const cats = config.categories || DEFAULT_CATEGORIES;

  select.innerHTML = `
    <option value="">Selecione uma categoria</option>
    ${cats.map(c => `<option value="${c}" ${c === selectedCategory ? 'selected' : ''}>${c}</option>`).join('')}
    <option value="__NEW__">+ Adicionar nova categoria...</option>
  `;

  const newWrapper = $('#new-category-wrapper');
  if (newWrapper) newWrapper.hidden = true;
  $('#p-new-category').value = '';
}

window.handleCategorySelectChange = function(select) {
  const newWrapper = $('#new-category-wrapper');
  if (!newWrapper) return;

  if (select.value === '__NEW__') {
    newWrapper.hidden = false;
    $('#p-new-category').focus();
  } else {
    newWrapper.hidden = true;
  }
};

window.openProductModal = function(id = null) {
  const form = $('#product-form');
  form.reset();
  $('#product-id').value = id || '';
  $('#discount-preview-badge').hidden = true;

  if (id) {
    const p = db.products.find(x => x.id === id);
    if (!p) return;

    $('#product-modal-title').textContent = 'Editar Produto';
    $('#p-name').value = p.name;
    $('#p-price').value = p.price;
    $('#p-sale').value = p.sale || '';
    $('#p-stock').value = p.stock;
    $('#p-image').value = p.image || '';
    $('#p-promo').checked = !!p.promo;

    fillProductModalCategories(p.category);
    updateImagePreview(p.image || '');
    calculateDiscountPreview();
  } else {
    $('#product-modal-title').textContent = 'Cadastrar Novo Produto';
    fillProductModalCategories();
    updateImagePreview('');
  }

  $('#product-modal')?.showModal();
};

window.updateImagePreview = function(url) {
  const preview = $('#p-image-preview');
  if (!preview) return;
  if (url) {
    preview.src = url;
    preview.style.display = 'block';
  } else {
    preview.src = '';
    preview.style.display = 'none';
  }
};

window.handleImageFileUpload = function(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    const base64 = event.target.result;
    $('#p-image').value = base64;
    updateImagePreview(base64);
  };
  reader.readAsDataURL(file);
};

window.calculateDiscountPreview = function() {
  const price = parseFloat($('#p-price').value);
  const sale = parseFloat($('#p-sale').value);
  const badge = $('#discount-preview-badge');

  if (badge && price > 0 && sale > 0 && sale < price) {
    const percent = Math.round(((price - sale) / price) * 100);
    badge.textContent = `Desconto de ${percent}% aplicado`;
    badge.hidden = false;
  } else if (badge) {
    badge.hidden = true;
  }
};

window.handleProductSubmit = function(e) {
  e.preventDefault();

  const id = Number($('#product-id').value);
  const name = $('#p-name').value.trim();
  let category = $('#p-category').value;
  const newCategory = $('#p-new-category').value.trim();

  if (category === '__NEW__') {
    if (!newCategory) {
      alert('Digite o nome da nova categoria.');
      $('#p-new-category').focus();
      return;
    }
    category = newCategory;

    if (!config.categories.includes(category)) {
      config.categories.push(category);
      saveConfig();
      renderCategoryCards();
    }
  }

  if (!category) {
    alert('Selecione uma categoria.');
    return;
  }

  const price = Number($('#p-price').value);
  const saleVal = $('#p-sale').value ? Number($('#p-sale').value) : null;
  const stock = Number($('#p-stock').value);
  const image = $('#p-image').value.trim() || FALLBACK_IMAGE;
  const promo = $('#p-promo').checked;

  const productData = {
    id: id || Date.now(),
    name,
    category,
    price,
    sale: saleVal,
    stock,
    image,
    promo
  };

  if (id) {
    const index = db.products.findIndex(p => p.id === id);
    if (index !== -1) {
      db.products[index] = productData;
    }
  } else {
    db.products.unshift(productData);
  }

  saveDatabase();
  $('#product-modal')?.close();

  renderAdminDashboard();
  renderStore();
  renderCart();
};

window.deleteProduct = function(id) {
  const prod = db.products.find(p => p.id === id);
  if (!prod) return;

  if (confirm(`Excluir o produto "${prod.name}" do catálogo?`)) {
    db.products = db.products.filter(p => p.id !== id);
    cart = cart.filter(x => x.id !== id);
    saveDatabase();
    renderAdminDashboard();
    renderStore();
    renderCart();
  }
};

/* INICIALIZAÇÃO */
document.addEventListener('DOMContentLoaded', () => {
  applyStoreConfig();
  renderCategoryCards();
  renderStore();
  renderCart();
  renderStoreHours();
  updateCustomerHeader();
  setupLocationAndAccount();

  setInterval(renderStoreHours, 60000);

  // Sincronização em Nuvem Multi-Dispositivos
  syncFromCloud(true);
  setInterval(() => syncFromCloud(false), 25000);
  window.addEventListener('focus', () => syncFromCloud(true));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncFromCloud(true);
  });

  $('#open-cart')?.addEventListener('click', openCart);
  $('.close-cart')?.addEventListener('click', closeCart);
  $('#overlay')?.addEventListener('click', closeCart);

  // Busca Inteligente de Produtos
  $('#search')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.length > 0 && currentCategory !== 'Todos') {
      currentCategory = 'Todos';
    }
    renderStore();
  });
  $('#search-clear-btn')?.addEventListener('click', clearHeaderSearch);
  $('#header-search-form')?.addEventListener('submit', handleHeaderSearch);

  $('#checkout')?.addEventListener('click', () => {
    if (cart.length > 0) {
      prepareCheckoutForm();
      $('#checkout-modal')?.showModal();
    }
  });
  $('#checkout-form')?.addEventListener('submit', handleCheckoutSubmit);

  $$('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      $(`#${modalId}`)?.close();
    });
  });

  $('#admin-link')?.addEventListener('click', showAdmin);
  $$('.back-store').forEach(btn => btn.addEventListener('click', showStore));
  $('#logout')?.addEventListener('click', handleAdminLogout);
  $('#login-form')?.addEventListener('submit', handleAdminLogin);
  $('#new-product')?.addEventListener('click', () => openProductModal());
  $('#admin-search')?.addEventListener('input', renderAdminCatalog);
  $('#admin-category-filter')?.addEventListener('change', renderAdminCatalog);
  $('#admin-stock-filter')?.addEventListener('change', renderAdminCatalog);

  ['sales-month', 'sales-category', 'sales-product'].forEach(id => {
    $(`#${id}`)?.addEventListener('change', renderAdminSales);
  });

  $('#customer-register-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#customer-name').value.trim();
    const email = $('#customer-register-email').value.trim().toLowerCase();
    const password = $('#customer-register-password').value;

    if (!name || !email || password.length < 4) {
      $('#customer-register-error').textContent = 'Preencha os dados e use senha com ao menos 4 caracteres.';
      return;
    }

    localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name, email, password }));
    localStorage.setItem(CUSTOMER_SESSION_KEY, 'true');
    e.target.reset();
    updateCustomerHeader();
    showCustomerAccount();
  });

  $('#customer-login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const c = getCustomer();
    const email = $('#customer-email').value.trim().toLowerCase();
    const password = $('#customer-password').value;

    if (!c || c.email !== email || c.password !== password) {
      $('#customer-login-error').textContent = 'E-mail ou senha incorretos.';
      return;
    }

    localStorage.setItem(CUSTOMER_SESSION_KEY, 'true');
    e.target.reset();
    updateCustomerHeader();
    showCustomerAccount();
  });

  $('#customer-logout')?.addEventListener('click', () => {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    updateCustomerHeader();
    showCustomerLogin();
  });

  setupAdminTabs();

  window.addEventListener('hashchange', () => {
    if (location.hash === '#admin') {
      showAdmin();
    } else if (['#inicio', '#produtos', '#promocoes', ''].includes(location.hash)) {
      if ($('#admin-area') && !$('#admin-area').hidden) {
        showStore();
      }
    }
  });

  if (location.hash === '#admin') {
    showAdmin();
  } else {
    $('#admin-area').hidden = true;
    $('#storefront').hidden = false;
  }
});
