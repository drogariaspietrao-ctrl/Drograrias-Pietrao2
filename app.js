/**
 * ==========================================================================
 * DROGARIAS PIETRÃO - SISTEMA COMPLETO EM NUVEM (FIREBASE FIRESTORE)
 * Vitrine em Tempo Real, Carrinho, WhatsApp e Painel Administrativo
 * ==========================================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// ==========================================================================
// CONFIGURAÇÃO DO FIREBASE CLOUD
// ==========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCqYx5jeKQbtwPrct2kYflb5coqkDfyRyY",
  authDomain: "drogarias-pietrao.firebaseapp.com",
  projectId: "drogarias-pietrao",
  storageBucket: "drogarias-pietrao.firebasestorage.app",
  messagingSenderId: "196475357342",
  appId: "1:196475357342:web:67c53cbcecb40d9f53538f",
  measurementId: "G-HW7PLSPTH9"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);

let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // Analytics é opcional em ambientes locais/restritos
}

const dbFirestore = getFirestore(app);
const produtosCol = collection(dbFirestore, "produtos");
const configDocRef = doc(dbFirestore, "configuracoes", "loja");
const pedidosCol = collection(dbFirestore, "pedidos");

// Chaves de Sessão Local (Apenas Login do Usuário, Endereço e Filial Escolhida)
const CONFIG_KEY = 'drogaria_pietrao_config_v2';
const AUTH_KEY = 'drogaria_pietrao_admin_session';
const CUSTOMER_KEY = 'drogaria_pietrao_cliente_v2';
const CUSTOMER_SESSION_KEY = 'drogaria_pietrao_cliente_sessao_v2';
const CUSTOMER_ADDRESS_KEY = 'drogaria_pietrao_cliente_endereco_v2';
const BRANCH_STORAGE_KEY = 'drogaria_pietrao_filial';

// 4 Filiais Físicas da Rede
const DEFAULT_BRANCHES = {
  grande_vitoria: {
    id: 'grande_vitoria',
    name: 'Grande Vitória',
    shortName: 'Grande Vitória',
    address: 'Av. Grande Vitória — Manaus / AM',
    whatsapp: '5592999999991',
    phone: '(92) 3000-0001'
  },
  sao_jose: {
    id: 'sao_jose',
    name: 'São José',
    shortName: 'São José',
    address: 'Av. Cosme Ferreira, São José — Manaus / AM',
    whatsapp: '5592999999992',
    phone: '(92) 3000-0002'
  },
  novo_aleixo: {
    id: 'novo_aleixo',
    name: 'Novo Aleixo',
    shortName: 'Novo Aleixo',
    address: 'Rua Penetração, Novo Aleixo — Manaus / AM',
    whatsapp: '5592999999993',
    phone: '(92) 3000-0003'
  },
  nova_cidade: {
    id: 'nova_cidade',
    name: 'Nova Cidade',
    shortName: 'Nova Cidade',
    address: 'Av. Margarita, Nova Cidade — Manaus / AM',
    whatsapp: '5592999999994',
    phone: '(92) 3000-0004'
  }
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
  whatsapp: '5592999999991',
  storeNotice: 'Compre com segurança • Frete grátis a partir de R$ 20,00',
  lowStockThreshold: 5,
  deliveryFee: 20.00,
  freeShippingThreshold: 20.00,
  categories: DEFAULT_CATEGORIES,
  storeHoursText: 'Seg. a Sáb., 8h às 20h',
  storeStatusMode: 'auto', // 'auto' | 'open' | 'closed'
  closeHour: 20,
  branches: DEFAULT_BRANCHES
};

// Catálogo Base de Produtos com Suporte às 4 Filiais
const SEED_PRODUCTS = [
  {
    id: 1,
    name: 'Paracetamol 750mg c/ 20 Comprimidos',
    category: 'Medicamentos',
    barcode: '7891234567890',
    description: 'Analgésico e antitérmico para alívio de dores e febre.',
    price: 15.90,
    sale: 10.90,
    stock: 18,
    promo: true,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80',
    branches: {
      grande_vitoria: { price: 15.90, sale: 10.90, stock: 18, promo: true },
      sao_jose:       { price: 15.90, sale: 10.90, stock: 12, promo: true },
      novo_aleixo:    { price: 16.50, sale: null,  stock: 8,  promo: false },
      nova_cidade:    { price: 15.90, sale: 11.50, stock: 15, promo: true }
    }
  },
  {
    id: 2,
    name: 'Dipirona Monoidratada 500mg/ml Gotas 20ml',
    category: 'Medicamentos',
    barcode: '7891234567891',
    description: 'Medicamento à base de dipirona monoidratada para dor e febre.',
    price: 8.90,
    sale: null,
    stock: 25,
    promo: false,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=500&q=80',
    branches: {
      grande_vitoria: { price: 8.90, sale: null, stock: 25, promo: false },
      sao_jose:       { price: 8.90, sale: null, stock: 20, promo: false },
      novo_aleixo:    { price: 9.20, sale: null, stock: 14, promo: false },
      nova_cidade:    { price: 8.90, sale: null, stock: 19, promo: false }
    }
  },
  {
    id: 3,
    name: 'Vitamina C 1g + Zinco 30 Comprimidos Efervescentes',
    category: 'Vitaminas e Suplementos',
    barcode: '7891234567892',
    description: 'Suplemento vitamínico efervescente para fortalecimento da imunidade.',
    price: 32.90,
    sale: 23.90,
    stock: 12,
    promo: true,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80',
    branches: {
      grande_vitoria: { price: 32.90, sale: 23.90, stock: 12, promo: true },
      sao_jose:       { price: 32.90, sale: 23.90, stock: 9,  promo: true },
      novo_aleixo:    { price: 33.90, sale: 25.90, stock: 6,  promo: true },
      nova_cidade:    { price: 32.90, sale: 23.90, stock: 14, promo: true }
    }
  },
  {
    id: 4,
    name: 'Protetor Solar Facial FPS 50 Toque Seco 50g',
    category: 'Dermocosméticos',
    barcode: '7891234567893',
    description: 'Alta proteção solar UVA/UVB com acabamento matte antibrilho.',
    price: 58.90,
    sale: 44.90,
    stock: 4,
    promo: true,
    image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=500&q=80',
    branches: {
      grande_vitoria: { price: 58.90, sale: 44.90, stock: 4, promo: true },
      sao_jose:       { price: 58.90, sale: 44.90, stock: 6, promo: true },
      novo_aleixo:    { price: 59.90, sale: 48.00, stock: 3, promo: true },
      nova_cidade:    { price: 58.90, sale: 44.90, stock: 5, promo: true }
    }
  },
  {
    id: 5,
    name: 'Shampoo Anticaspa Nutritivo 400ml',
    category: 'Higiene e beleza',
    barcode: '7891234567894',
    description: 'Controle efetivo da caspa mantendo os fios hidratados e macios.',
    price: 24.50,
    sale: null,
    stock: 14,
    promo: false,
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=500&q=80',
    branches: {
      grande_vitoria: { price: 24.50, sale: null, stock: 14, promo: false },
      sao_jose:       { price: 24.50, sale: null, stock: 10, promo: false },
      novo_aleixo:    { price: 24.50, sale: null, stock: 8,  promo: false },
      nova_cidade:    { price: 24.50, sale: null, stock: 12, promo: false }
    }
  },
  {
    id: 6,
    name: 'Álcool em Gel 70% Hidratante 500ml',
    category: 'Higiene e beleza',
    barcode: '7891234567895',
    description: 'Higienização e antissepsia rápida com ação hidratante de aloe vera.',
    price: 12.90,
    sale: null,
    stock: 0,
    promo: false,
    image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=500&q=80',
    branches: {
      grande_vitoria: { price: 12.90, sale: null, stock: 0,  promo: false },
      sao_jose:       { price: 12.90, sale: null, stock: 15, promo: false },
      novo_aleixo:    { price: 12.90, sale: null, stock: 0,  promo: false },
      nova_cidade:    { price: 12.90, sale: null, stock: 8,  promo: false }
    }
  },
  {
    id: 7,
    name: 'Fralda Infantil Confort Premium Tamanho G c/ 32 un.',
    category: 'Mundo infantil',
    barcode: '7891234567896',
    description: 'Até 12 horas de proteção com barreiras antivazamento duplas.',
    price: 49.90,
    sale: 39.90,
    stock: 7,
    promo: true,
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=500&q=80',
    branches: {
      grande_vitoria: { price: 49.90, sale: 39.90, stock: 7,  promo: true },
      sao_jose:       { price: 49.90, sale: 39.90, stock: 11, promo: true },
      novo_aleixo:    { price: 51.90, sale: null,  stock: 4,  promo: false },
      nova_cidade:    { price: 49.90, sale: 39.90, stock: 9,  promo: true }
    }
  },
  {
    id: 8,
    name: 'Kit Primeiros Socorros c/ Esparadrapo, Gaze e Antisséptico',
    category: 'Primeiros socorros',
    barcode: '7891234567897',
    description: 'Kit prático e completo para curativos de emergência e pequenos ferimentos.',
    price: 27.90,
    sale: null,
    stock: 3,
    promo: false,
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=500&q=80',
    branches: {
      grande_vitoria: { price: 27.90, sale: null, stock: 3, promo: false },
      sao_jose:       { price: 27.90, sale: null, stock: 5, promo: false },
      novo_aleixo:    { price: 28.50, sale: null, stock: 2, promo: false },
      nova_cidade:    { price: 27.90, sale: null, stock: 4, promo: false }
    }
  }
];

// Estado da Aplicação (Memória em Tempo Real - Zero LocalStorage para Produtos)
let db = { products: [], sales: [] };
let config = { ...DEFAULT_CONFIG };
let cart = [];
let currentCategory = 'Todos';
let currentAdminTab = 'catalog';
let currentBranch = localStorage.getItem(BRANCH_STORAGE_KEY) || 'grande_vitoria';
let currentProductBranchTab = 'grande_vitoria';
let currentAdminBranchFilter = 'all';
let visibleProductsLimit = 16; // Paginação: 16 produtos por página
let isFirestoreInitialized = false;

// Utilitários de DOM e Formatação
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

// Helper: Extrair dados de preço/estoque da filial ativa para um produto
function getProductBranchData(p, branchId = currentBranch) {
  if (p && p.branches && p.branches[branchId]) {
    const b = p.branches[branchId];
    return {
      price: Number(b.price) || 0,
      sale: b.sale !== null && b.sale !== undefined && b.sale !== '' ? Number(b.sale) : null,
      stock: parseInt(b.stock, 10) || 0,
      promo: Boolean(b.promo)
    };
  }
  // Fallback para valores legados
  return {
    price: Number(p?.price) || 0,
    sale: p?.sale !== null && p?.sale !== undefined && p?.sale !== '' ? Number(p.sale) : null,
    stock: parseInt(p?.stock, 10) || 0,
    promo: Boolean(p?.promo)
  };
}

function getBranchName(branchId = currentBranch) {
  return config.branches?.[branchId]?.name || DEFAULT_BRANCHES[branchId]?.name || 'Grande Vitória';
}

function getBranchWhatsApp(branchId = currentBranch) {
  const b = config.branches?.[branchId] || DEFAULT_BRANCHES[branchId];
  return (b?.whatsapp || config.whatsapp || DEFAULT_CONFIG.whatsapp).replace(/\D/g, '');
}

function getBranchPhone(branchId = currentBranch) {
  const b = config.branches?.[branchId] || DEFAULT_BRANCHES[branchId];
  return b?.phone || '';
}

function getBranchAddress(branchId = currentBranch) {
  const b = config.branches?.[branchId] || DEFAULT_BRANCHES[branchId];
  return b?.address || '';
}

function updateBranchUI() {
  const nameEl = $('#header-branch-name');
  if (nameEl) nameEl.textContent = getBranchName(currentBranch);

  Object.keys(DEFAULT_BRANCHES).forEach(bId => {
    const btn = $(`#branch-btn-${bId}`);
    const badge = $(`#badge-branch-${bId}`);
    if (btn) btn.classList.toggle('active', bId === currentBranch);
    if (badge) badge.hidden = bId !== currentBranch;
  });
}

// Selecionar Filial
window.selectBranch = function(branchId) {
  if (!DEFAULT_BRANCHES[branchId]) return;
  currentBranch = branchId;
  localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
  updateBranchUI();
  $('#branch-modal')?.close();
  renderStore();
  renderCart();
  renderStoreHours();
  showToast(`🏬 Unidade alterada para: ${getBranchName(branchId)}`);
};

// Checagem de primeiro acesso para exibir o modal de escolha de filial
function checkInitialBranchSelection() {
  const saved = localStorage.getItem(BRANCH_STORAGE_KEY);
  if (!saved) {
    setTimeout(() => {
      $('#branch-modal')?.showModal();
    }, 450);
  }
}

// Paginação / Carregar Mais
window.loadMoreProducts = function() {
  visibleProductsLimit += 16;
  renderStore();
};

// Alternar Abas de Filiais no Cadastro de Medicamento
window.switchProductBranchTab = function(branchId) {
  currentProductBranchTab = branchId;
  $$('.branch-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.branchTab === branchId);
  });
  Object.keys(DEFAULT_BRANCHES).forEach(bId => {
    const panel = $(`#branch-panel-${bId}`);
    if (panel) panel.hidden = bId !== branchId;
  });
};

// Replicar dados de uma filial para as outras 3
window.replicateBranchData = function(sourceBranchId) {
  const price = $(`#p-price-${sourceBranchId}`)?.value || '';
  const sale = $(`#p-sale-${sourceBranchId}`)?.value || '';
  const stock = $(`#p-stock-${sourceBranchId}`)?.value || '';
  const promo = $(`#p-promo-${sourceBranchId}`)?.checked || false;

  Object.keys(DEFAULT_BRANCHES).forEach(bId => {
    if (bId !== sourceBranchId) {
      if ($(`#p-price-${bId}`)) $(`#p-price-${bId}`).value = price;
      if ($(`#p-sale-${bId}`)) $(`#p-sale-${bId}`).value = sale;
      if ($(`#p-stock-${bId}`)) $(`#p-stock-${bId}`).value = stock;
      if ($(`#p-promo-${bId}`)) $(`#p-promo-${bId}`).checked = promo;
    }
  });
  showToast(`📋 Valores replicados da unidade ${getBranchName(sourceBranchId)} para todas as filiais!`);
};

// Visualizador de Senha
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

// Notificações Toast Flutuantes
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = 'background:#14532d;color:#ffffff;padding:12px 18px;border-radius:8px;font-size:0.82rem;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.2);display:flex;align-items:center;gap:8px;pointer-events:auto;border-left:4px solid #22c55e;transition:all 0.3s ease;';
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

function updateCloudSyncUI(status, message) {
  const badge = $('#cloud-sync-badge');
  const dot = $('#cloud-sync-dot');
  const text = $('#cloud-sync-status-text');
  if (!badge || !dot || !text) return;

  badge.className = `sync-status-badge sync-status-${status}`;
  if (status === 'online') {
    dot.textContent = '🟢';
    text.textContent = message || 'Firebase Firestore Conectado (Tempo Real Ativo)';
  } else if (status === 'syncing') {
    dot.textContent = '🟡';
    text.textContent = message || 'Sincronizando com o Firebase...';
  } else {
    dot.textContent = '⚪';
    text.textContent = message || 'Conectando ao Firebase...';
  }
}

// ==========================================================================
// SINCRONIZAÇÃO EM TEMPO REAL COM O FIREBASE FIRESTORE
// ==========================================================================

function initFirestoreListeners() {
  console.log('[Firebase Firestore] Inicializando listeners onSnapshot em tempo real...');
  updateCloudSyncUI('syncing', 'Conectando ao Firebase Firestore...');

  // 1. Escuta EXCLUSIVA e Contínua da Coleção 'produtos' via onSnapshot
  onSnapshot(produtosCol, async (snapshot) => {
    console.log(`[Firebase onSnapshot] Atualização em tempo real recebida: ${snapshot.docs.length} produtos na coleção.`);

    if (snapshot.empty && !isFirestoreInitialized) {
      isFirestoreInitialized = true;
      console.log('[Firebase Firestore] Coleção "produtos" vazia. Inserindo catálogo base inicial...');
      await seedInitialProductsToFirestore(true);
      return;
    }

    isFirestoreInitialized = true;
    const parsedProducts = [];

    // Leitura direta dos documentos em tempo real do Firestore
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = data.id !== undefined ? data.id : docSnap.id;

      // Monta / Normaliza objeto de filiais
      let branches = data.branches || {};
      if (!branches || Object.keys(branches).length === 0) {
        branches = {};
        Object.keys(DEFAULT_BRANCHES).forEach(bId => {
          branches[bId] = {
            price: Number(data.price) || 0,
            sale: data.sale !== null && data.sale !== undefined && data.sale !== '' ? Number(data.sale) : null,
            stock: Number(data.stock !== undefined ? data.stock : 0),
            promo: Boolean(data.promo)
          };
        });
      }

      parsedProducts.push({
        id: id,
        name: data.name || '',
        category: data.category || 'Medicamentos',
        barcode: data.barcode || '',
        description: data.description || '',
        branches: branches,
        price: Number(data.price) || (branches.grande_vitoria ? branches.grande_vitoria.price : 0),
        sale: data.sale ? Number(data.sale) : (branches.grande_vitoria ? branches.grande_vitoria.sale : null),
        stock: Number(data.stock !== undefined ? data.stock : (branches.grande_vitoria ? branches.grande_vitoria.stock : 0)),
        promo: Boolean(data.promo !== undefined ? data.promo : (branches.grande_vitoria ? branches.grande_vitoria.promo : false)),
        image: data.image || FALLBACK_IMAGE,
        updatedAt: data.updatedAt || null
      });
    });

    // Ordenação consistente dos produtos por ID ou Nome
    parsedProducts.sort((a, b) => {
      const idA = Number(a.id);
      const idB = Number(b.id);
      if (!isNaN(idA) && !isNaN(idB)) return idA - idB;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });

    db.products = parsedProducts;

    updateCloudSyncUI('online', `Firebase Conectado (${db.products.length} produtos em 4 filiais)`);

    const detailsEl = $('#firestore-sync-details');
    if (detailsEl) {
      detailsEl.innerHTML = `Sincronização em tempo real ativa. <strong>${db.products.length} produtos</strong> sincronizados para as 4 filiais físicas.`;
    }

    // Re-renderização reativa e imediata do DOM para todos os clientes sem refresh
    updateBranchUI();
    renderCategoryCards();
    renderStore();
    renderCart();
    renderStoreHours();
    if (isAdminLogged()) {
      renderAdminDashboard();
    }
  }, (error) => {
    console.error('[Firebase Firestore] ERRO no onSnapshot da coleção produtos:', error);
    updateCloudSyncUI('local', 'Erro na conexão do Firebase Firestore');
    if (error.code === 'permission-denied') {
      alert('⚠️ ATENÇÃO: As Regras do Firestore estão bloqueando a leitura/gravação (permission-denied).\n\nAcesse o Firebase Console > Firestore Database > Aba "Regras" e altere para:\nallow read, write: if true;');
    }
  });

  // 2. Escutar Documento 'configuracoes/loja' em Tempo Real
  onSnapshot(configDocRef, (docSnap) => {
    if (docSnap.exists()) {
      config = { ...DEFAULT_CONFIG, ...docSnap.data() };
      applyStoreConfig();
      updateBranchUI();
      renderCategoryCards();
      renderStore();
      renderStoreHours();
      if (isAdminLogged() && currentAdminTab === 'settings') {
        renderAdminSettings();
      }
    } else {
      setDoc(configDocRef, DEFAULT_CONFIG, { merge: true }).catch(e => console.warn(e));
    }
  }, (error) => {
    console.warn('[Firebase Firestore] Listener de configurações:', error);
  });

  // 3. Escutar Coleção 'pedidos' em Tempo Real
  onSnapshot(pedidosCol, (snapshot) => {
    const orders = [];
    snapshot.forEach(docSnap => {
      orders.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Ordena por data decrescente
    orders.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    db.sales = orders;

    if (isAdminLogged() && currentAdminTab === 'sales') {
      renderAdminSales();
    }
  }, (error) => {
    console.warn('[Firebase Firestore] Listener de pedidos:', error);
  });
}

// Carga Inicial / Restauração dos Produtos no Firestore com Feedback Imediato
window.seedInitialProductsToFirestore = async function(silent = false) {
  try {
    console.log('[Firebase Firestore] Iniciando gravação de todos os produtos multi-filiais...');
    updateCloudSyncUI('syncing', 'Gravando produtos base no Firebase...');

    for (const p of SEED_PRODUCTS) {
      const docRef = doc(dbFirestore, "produtos", String(p.id));
      await setDoc(docRef, {
        id: p.id,
        name: p.name,
        category: p.category,
        barcode: p.barcode || '',
        description: p.description || '',
        branches: p.branches,
        price: p.branches.grande_vitoria.price,
        sale: p.branches.grande_vitoria.sale,
        stock: p.branches.grande_vitoria.stock,
        promo: p.branches.grande_vitoria.promo,
        image: p.image,
        updatedAt: new Date().toISOString()
      });
      console.log(`[Firebase Firestore] ✅ Produto "${p.name}" gravado com 4 filiais.`);
    }

    await setDoc(configDocRef, DEFAULT_CONFIG, { merge: true });

    updateCloudSyncUI('online', `Firebase Conectado (${SEED_PRODUCTS.length} produtos em 4 filiais)`);
    console.log('[Firebase Firestore] Sucesso! Todos os produtos foram sincronizados na nuvem.');

    if (!silent) {
      showToast(`🌱 ${SEED_PRODUCTS.length} produtos gravados no Firebase com 4 filiais!`);
      alert(`✅ Sucesso!\n\n${SEED_PRODUCTS.length} produtos foram gravados diretamente na coleção "produtos" do Firebase Firestore com estoques e preços individuais para as 4 filiais físicas!`);
    }
  } catch (err) {
    console.error('[Firebase Firestore] ERRO ao salvar no Firebase:', err);
    updateCloudSyncUI('local', 'Erro ao gravar no Firebase');
    alert(`❌ ERRO NO FIREBASE AO GRAVAR PRODUTOS:\n\nCódigo: ${err.code || 'Desconhecido'}\nMensagem: ${err.message}`);
  }
};

// ==========================================================================
// MÓDULO: VITRINE & ATENDIMENTO
// ==========================================================================

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
  const bData = getProductBranchData(p, currentBranch);
  const currentPrice = (bData.sale && bData.sale < bData.price) ? bData.sale : bData.price;
  const hasDiscount = bData.sale && bData.sale < bData.price;
  const discountPercent = hasDiscount ? Math.round(((bData.price - bData.sale) / bData.price) * 100) : 0;
  const isAvailable = bData.stock > 0;

  return `
    <article class="product-card" data-product-id="${p.id}">
      <div class="card-badge-top">
        ${bData.promo ? '<span class="badge-promo">PROMO DO DIA</span>' : ''}
        ${hasDiscount ? `<span class="badge-discount">-${discountPercent}%</span>` : ''}
      </div>

      <div class="product-image-wrap">
        <img class="product-image" src="${p.image || FALLBACK_IMAGE}" alt="${p.name}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'" />
      </div>

      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <div class="product-name" title="${p.name}">${p.name}</div>
        ${p.description ? `<p style="font-size: 0.72rem; color: var(--muted); margin: 2px 0 6px 0; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${p.description}</p>` : ''}

        <div class="price-row">
          <strong class="price">${money(currentPrice)}</strong>
          ${hasDiscount ? `<span class="old-price">${money(bData.price)}</span>` : ''}
        </div>

        ${isAvailable ? `
          <div class="card-buy">
            <div class="card-quantity" aria-label="Quantidade de ${p.name}">
              <button type="button" onclick="changeCardQty(this, -1)" aria-label="Diminuir quantidade">−</button>
              <input class="card-qty-input" type="number" value="1" min="1" max="${bData.stock}" readonly aria-label="Quantidade" />
              <button type="button" onclick="changeCardQty(this, 1)" aria-label="Aumentar quantidade">+</button>
            </div>
            <button class="add-button" type="button" onclick="addCart('${p.id}', this)">
              Adicionar
            </button>
          </div>
        ` : `
          <span class="sold-out-badge">ESGOTADO NESSA UNIDADE</span>
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

  const productListEl = $('#product-list');
  const promoListEl = $('#promo-list');
  const countEl = $('#product-count');

  // Limpeza explícita dos containers antes de renderizar os novos dados do Firestore
  if (productListEl) productListEl.innerHTML = '';
  if (promoListEl) promoListEl.innerHTML = '';

  const allProducts = db.products || [];

  // Filtragem dinâmica por filial ativa, categoria e busca
  const filtered = allProducts.filter(p => {
    const bData = getProductBranchData(p, currentBranch);
    // Não exibe na loja se o produto não estiver disponível / sem estoque nesta filial
    const isAvailableInBranch = Boolean(bData && bData.stock > 0 && bData.price > 0);
    if (!isAvailableInBranch) return false;

    const matchCategory = currentCategory === 'Todos' || p.category === currentCategory;
    const nameNorm = normalizeStr(p.name);
    const catNorm = normalizeStr(p.category);
    const barcodeNorm = normalizeStr(p.barcode || '');
    const descNorm = normalizeStr(p.description || '');
    const matchSearch = !searchNorm || nameNorm.includes(searchNorm) || catNorm.includes(searchNorm) || barcodeNorm.includes(searchNorm) || descNorm.includes(searchNorm);
    return matchCategory && matchSearch;
  });

  // Atualização dos filtros de categoria
  const cats = ['Todos', ...(config.categories || DEFAULT_CATEGORIES)];
  const filtersContainer = $('#category-filters');
  if (filtersContainer) {
    filtersContainer.innerHTML = cats.map(c => `
      <button class="filter-btn ${c === currentCategory ? 'active' : ''}" type="button" onclick="setCategory('${c}')">
        ${c}
      </button>
    `).join('');
  }

  // Paginação progressiva de 16 em 16 produtos
  const pagedProducts = filtered.slice(0, visibleProductsLimit);

  // Renderização dinâmica da grade de produtos da vitrine
  if (productListEl) {
    if (filtered.length > 0) {
      let catalogHtml = '';
      pagedProducts.forEach(p => {
        catalogHtml += createProductCard(p);
      });
      productListEl.innerHTML = catalogHtml;
    } else {
      productListEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 16px; color: var(--muted);">
          <p style="font-size: 0.95rem; margin-bottom: 10px;">Nenhum produto encontrado para "<strong>${rawSearch || currentCategory}</strong>" na unidade ${getBranchName(currentBranch)}.</p>
          <button class="primary-button" onclick="clearHeaderSearch()" type="button">Ver todos os produtos</button>
        </div>
      `;
    }
  }

  // Controle de exibição do botão de carregar mais
  const loadMoreEl = $('#load-more-container');
  if (loadMoreEl) {
    loadMoreEl.style.display = filtered.length > visibleProductsLimit ? 'block' : 'none';
  }

  // Contador de produtos em tempo real com indicador da unidade
  if (countEl) {
    const bName = getBranchName(currentBranch);
    if (rawSearch) {
      countEl.innerHTML = `Busca por "<strong>${rawSearch}</strong>": ${filtered.length} produto${filtered.length !== 1 ? 's' : ''} em <strong>${bName}</strong>`;
    } else {
      countEl.innerHTML = `Exibindo <strong>${pagedProducts.length}</strong> de <strong>${filtered.length}</strong> produtos · Unidade <strong>${bName}</strong>`;
    }
  }

  // Renderização dinâmica das Ofertas em Destaque da filial ativa
  const promos = allProducts.filter(p => {
    const b = getProductBranchData(p, currentBranch);
    return b.promo && b.stock > 0;
  });

  if (promoListEl) {
    if (promos.length > 0) {
      let promoHtml = '';
      promos.forEach(p => {
        promoHtml += createProductCard(p);
      });
      promoListEl.innerHTML = promoHtml;
    } else {
      promoListEl.innerHTML = `<p style="color: var(--muted); padding: 10px 0; font-size: 0.82rem;">Nenhuma oferta em destaque na unidade ${getBranchName(currentBranch)} hoje.</p>`;
    }
  }
}

window.handleHeaderSearch = function(e) {
  if (e) e.preventDefault();
  currentCategory = 'Todos';
  visibleProductsLimit = 16;
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
  visibleProductsLimit = 16;
  renderStore();
  searchInput?.focus();
};

window.setCategory = function(cat) {
  currentCategory = cat;
  visibleProductsLimit = 16;
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

// ==========================================================================
// MÓDULO: CARRINHO & FRETE GRÁTIS
// ==========================================================================

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
  const product = db.products.find(p => String(p.id) === String(id));
  if (!product) return;
  const bData = getProductBranchData(product, currentBranch);
  if (bData.stock <= 0) {
    alert(`O produto "${product.name}" está esgotado na unidade ${getBranchName(currentBranch)}.`);
    return;
  }

  const card = button?.closest('.product-card');
  const qtyInput = card?.querySelector('.card-qty-input');
  const qtyToAdd = Math.max(1, Math.min(bData.stock, Number(qtyInput?.value || 1)));

  const existing = cart.find(item => String(item.id) === String(id));
  if (existing) {
    existing.qty = Math.min(bData.stock, existing.qty + qtyToAdd);
  } else {
    cart.push({ id: product.id, qty: qtyToAdd });
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
        const product = db.products.find(p => String(p.id) === String(item.id));
        if (!product) return '';
        const bData = getProductBranchData(product, currentBranch);
        const price = (bData.sale && bData.sale < bData.price) ? bData.sale : bData.price;
        const lineTotal = price * item.qty;
        subtotal += lineTotal;

        return `
          <div class="cart-item">
            <img src="${product.image || FALLBACK_IMAGE}" alt="" onerror="this.src='${FALLBACK_IMAGE}'" />
            <div>
              <strong>${product.name}</strong>
              <small>${money(price)} · Unidade ${getBranchName(currentBranch)}</small>
              <div class="cart-item-qty">
                <button type="button" onclick="changeCartQty('${product.id}', -1)">−</button>
                <b>${item.qty}</b>
                <button type="button" onclick="changeCartQty('${product.id}', 1)" ${item.qty >= bData.stock ? 'disabled' : ''}>+</button>
              </div>
            </div>
            <button class="remove-btn" type="button" onclick="removeFromCart('${product.id}')" aria-label="Remover">×</button>
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
  const item = cart.find(x => String(x.id) === String(id));
  const product = db.products.find(x => String(x.id) === String(id));
  if (!item || !product) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(x => String(x.id) !== String(id));
  } else if (item.qty > product.stock) {
    item.qty = product.stock;
  }
  renderCart();
};

window.removeFromCart = function(id) {
  cart = cart.filter(x => String(x.id) !== String(id));
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

// ==========================================================================
// MÓDULO: ENDEREÇO & CHECKOUT COM FIREBASE
// ==========================================================================

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
    const prod = db.products.find(p => String(p.id) === String(item.id));
    if (!prod) return acc;
    const bData = getProductBranchData(prod, currentBranch);
    const unitPrice = (bData.sale && bData.sale < bData.price) ? bData.sale : bData.price;
    return acc + (unitPrice * item.qty);
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

window.handleCheckoutSubmit = async function(e) {
  e.preventDefault();

  if (cart.length === 0) return;

  const stockErrors = [];
  cart.forEach(item => {
    const prod = db.products.find(p => String(p.id) === String(item.id));
    if (!prod) {
      stockErrors.push('Item indisponível');
    } else {
      const bData = getProductBranchData(prod, currentBranch);
      if (bData.stock < item.qty) {
        stockErrors.push(`${prod.name} (Disponível em ${getBranchName(currentBranch)}: ${bData.stock} un.)`);
      }
    }
  });

  if (stockErrors.length > 0) {
    alert(`Atenção: Estoque insuficiente na unidade ${getBranchName(currentBranch)}:\n\n• ${stockErrors.join('\n• ')}`);
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
    const prod = db.products.find(p => String(p.id) === String(item.id));
    const bData = getProductBranchData(prod, currentBranch);
    const unitPrice = (bData.sale && bData.sale < bData.price) ? bData.sale : bData.price;
    subtotal += unitPrice * item.qty;

    return {
      productId: prod.id,
      name: prod.name,
      category: prod.category,
      qty: item.qty,
      price: unitPrice,
      branchId: currentBranch,
      branchName: getBranchName(currentBranch)
    };
  });

  const freeThreshold = Number(config.freeShippingThreshold || DEFAULT_CONFIG.freeShippingThreshold);
  const baseDelivery = Number(config.deliveryFee || DEFAULT_CONFIG.deliveryFee);
  const isFreeShipping = subtotal >= freeThreshold;
  const deliveryFeeCharged = isFreeShipping ? 0 : baseDelivery;
  const finalTotal = subtotal + deliveryFeeCharged;
  const branchName = getBranchName(currentBranch);
  const branchWa = getBranchWhatsApp(currentBranch);

  const orderRecord = {
    id: Date.now(),
    date: new Date().toISOString(),
    branchId: currentBranch,
    branchName: branchName,
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

  // 1. Atualizar estoque da filial correspondente e salvar pedido no Firebase Firestore
  try {
    for (const item of cart) {
      const prod = db.products.find(p => String(p.id) === String(item.id));
      if (prod) {
        const bData = getProductBranchData(prod, currentBranch);
        const newBranchStock = Math.max(0, bData.stock - item.qty);
        const updatedBranches = {
          ...(prod.branches || {}),
          [currentBranch]: {
            ...(prod.branches?.[currentBranch] || {}),
            price: bData.price,
            sale: bData.sale,
            promo: bData.promo,
            stock: newBranchStock
          }
        };

        await updateDoc(doc(dbFirestore, "produtos", String(prod.id)), {
          branches: updatedBranches,
          stock: newBranchStock, // fallback de compatibilidade
          updatedAt: new Date().toISOString()
        });
      }
    }
    await setDoc(doc(dbFirestore, "pedidos", String(orderRecord.id)), orderRecord);
    showToast(`☁️ Pedido registrado para a unidade ${branchName}!`);
  } catch (err) {
    console.error('[Firebase Firestore] Erro ao gravar pedido:', err);
  }

  const cleanPhone = (branchWa || '').replace(/\D/g, '');
  const itemLines = orderItems.map(i => `• ${i.qty}x ${i.name} — ${money(i.price * i.qty)}`);
  
  const whatsappMsg = [
    `🏬 *NOVO PEDIDO - DROGARIAS PIETRÃO*`,
    `---------------------------------`,
    `📍 *Unidade:* ${branchName}`,
    `🕒 *Data:* ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    ``,
    `📋 *ITENS DO PEDIDO*`,
    itemLines.join('\n'),
    ``,
    `---------------------------------`,
    `💵 *Subtotal:* ${money(subtotal)}`,
    `🛵 *Taxa de Entrega:* ${isFreeShipping ? 'Grátis' : money(deliveryFeeCharged)}`,
    `💰 *TOTAL:* *${money(finalTotal)}*`,
    `💳 *Pagamento:* ${payment}`,
    `---------------------------------`,
    ``,
    `📍 *ENDEREÇO DE ENTREGA*`,
    `${addressFull}`,
    notes ? `\n📝 *Observações:* ${notes}` : ``
  ].filter(line => line !== null && line !== undefined).join('\n');

  cart = [];
  renderStore();
  renderCart();
  e.target.reset();
  $('#checkout-modal')?.close();
  closeCart();

  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMsg)}`;
  window.open(url, '_blank');
};

window.openDirectWhatsApp = function() {
  const branchWa = getBranchWhatsApp(currentBranch);
  const cleanPhone = (branchWa || '').replace(/\D/g, '');
  const branchName = getBranchName(currentBranch);
  const msg = `Olá! Gostaria de falar com o atendimento da Drogarias Pietrão (Unidade ${branchName}).`;
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
};

// ==========================================================================
// MÓDULO: CEP & CONTA DO CLIENTE
// ==========================================================================

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

// ==========================================================================
// MÓDULO: PAINEL ADMINISTRATIVO CORPORATIVO & FIREBASE
// ==========================================================================

function isAdminLogged() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

window.showAdmin = function() {
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
};

window.showStore = function() {
  $('#admin-area').hidden = true;
  $('#storefront').hidden = false;
  location.hash = 'inicio';
};

window.handleAdminLogin = function(e) {
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
};

window.handleAdminLogout = function() {
  sessionStorage.removeItem(AUTH_KEY);
  showStore();
};

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

window.setAdminBranchFilter = function(branchId) {
  const select = $('#admin-branch-filter');
  if (select) select.value = branchId;
  renderAdminCatalog();
};

// ABA 1: CATÁLOGO
function renderAdminCatalog() {
  const searchTerm = ($('#admin-search')?.value || '').trim().toLowerCase();
  const categoryFilter = $('#admin-category-filter')?.value || 'all';
  const stockFilter = $('#admin-stock-filter')?.value || 'all';
  const branchFilter = $('#admin-branch-filter')?.value || 'all';
  currentAdminBranchFilter = branchFilter;
  const threshold = config.lowStockThreshold || DEFAULT_CONFIG.lowStockThreshold;

  // Sincroniza botões de pílulas de filiais no topo
  $$('.branch-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.branch === branchFilter);
  });

  const catFilterEl = $('#admin-category-filter');
  if (catFilterEl && catFilterEl.options.length <= 1) {
    const cats = config.categories || DEFAULT_CATEGORIES;
    catFilterEl.innerHTML = '<option value="all">Todas as categorias</option>' + 
      cats.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  const list = db.products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm) || (p.barcode || '').toLowerCase().includes(searchTerm);
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;

    let pStock = p.stock || 0;
    if (branchFilter !== 'all') {
      const bData = getProductBranchData(p, branchFilter);
      if (bData.stock === 0 && bData.price === 0) return false;
      pStock = bData.stock;
    } else {
      // Total de estoque somado das 4 filiais
      pStock = Object.keys(DEFAULT_BRANCHES).reduce((acc, bId) => {
        return acc + getProductBranchData(p, bId).stock;
      }, 0);
    }

    let matchStock = true;
    if (stockFilter === 'in-stock') matchStock = pStock > threshold;
    else if (stockFilter === 'low-stock') matchStock = pStock > 0 && pStock <= threshold;
    else if (stockFilter === 'out-of-stock') matchStock = pStock === 0;

    return matchSearch && matchCat && matchStock;
  });

  // Cálculo das Métricas (Geral da Rede vs. Unidade Específica)
  const branchName = branchFilter === 'all' ? 'Toda a Rede' : getBranchName(branchFilter);

  if (branchFilter === 'all') {
    const totalStockAll = db.products.reduce((acc, p) => {
      return acc + Object.keys(DEFAULT_BRANCHES).reduce((sum, bId) => sum + getProductBranchData(p, bId).stock, 0);
    }, 0);
    const activePromos = db.products.filter(p => {
      return Object.keys(DEFAULT_BRANCHES).some(bId => getProductBranchData(p, bId).promo);
    }).length;
    const lowStockCount = db.products.filter(p => {
      return Object.keys(DEFAULT_BRANCHES).some(bId => getProductBranchData(p, bId).stock <= threshold);
    }).length;

    if ($('#stat-products-title')) $('#stat-products-title').textContent = 'Produtos cadastrados';
    if ($('#stat-products')) $('#stat-products').textContent = db.products.length;
    if ($('#stat-products-scope')) $('#stat-products-scope').textContent = 'Toda a Rede (4 Filiais)';

    if ($('#stat-promos-title')) $('#stat-promos-title').textContent = 'Promoções ativas';
    if ($('#stat-promos')) $('#stat-promos').textContent = activePromos;
    if ($('#stat-promos-scope')) $('#stat-promos-scope').textContent = 'Em todas as lojas';

    if ($('#stat-stock-title')) $('#stat-stock-title').textContent = 'Total em estoque';
    if ($('#stat-stock')) $('#stat-stock').textContent = `${totalStockAll} un.`;
    if ($('#stat-stock-scope')) $('#stat-stock-scope').textContent = 'Soma das 4 filiais';

    if ($('#stat-low-stock-title')) $('#stat-low-stock-title').textContent = 'Estoque baixo / esgotado';
    if ($('#stat-low-stock')) $('#stat-low-stock').textContent = lowStockCount;
    if ($('#stat-low-stock-scope')) $('#stat-low-stock-scope').textContent = 'Com alerta na rede';
  } else {
    // Cálculo exclusivo para a filial selecionada
    const branchActiveProducts = db.products.filter(p => {
      const b = getProductBranchData(p, branchFilter);
      return b.stock > 0 || b.price > 0;
    });

    const branchStockTotal = db.products.reduce((sum, p) => sum + getProductBranchData(p, branchFilter).stock, 0);
    const branchPromos = db.products.filter(p => getProductBranchData(p, branchFilter).promo).length;
    const branchLowStock = db.products.filter(p => {
      const b = getProductBranchData(p, branchFilter);
      return b.stock <= threshold;
    }).length;

    if ($('#stat-products-title')) $('#stat-products-title').textContent = `Produtos em ${branchName}`;
    if ($('#stat-products')) $('#stat-products').textContent = `${branchActiveProducts.length} itens`;
    if ($('#stat-products-scope')) $('#stat-products-scope').textContent = `Disponíveis nesta unidade`;

    if ($('#stat-promos-title')) $('#stat-promos-title').textContent = `Promoções em ${branchName}`;
    if ($('#stat-promos')) $('#stat-promos').textContent = branchPromos;
    if ($('#stat-promos-scope')) $('#stat-promos-scope').textContent = `Ativas nesta filial`;

    if ($('#stat-stock-title')) $('#stat-stock-title').textContent = `Estoque em ${branchName}`;
    if ($('#stat-stock')) $('#stat-stock').textContent = `${branchStockTotal} un.`;
    if ($('#stat-stock-scope')) $('#stat-stock-scope').textContent = `Físico desta unidade`;

    if ($('#stat-low-stock-title')) $('#stat-low-stock-title').textContent = `Estoque Baixo em ${branchName}`;
    if ($('#stat-low-stock')) $('#stat-low-stock').textContent = branchLowStock;
    if ($('#stat-low-stock-scope')) $('#stat-low-stock-scope').textContent = `Críticos nesta unidade`;
  }

  const tbody = $('#admin-product-list');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (list.length > 0) {
    tbody.innerHTML = list.map(p => {
      let bData = getProductBranchData(p, branchFilter === 'all' ? 'grande_vitoria' : branchFilter);
      let stockDisplay = '';

      if (branchFilter === 'all') {
        const stockSummary = Object.keys(DEFAULT_BRANCHES).map(bId => {
          const b = getProductBranchData(p, bId);
          const isCrit = b.stock <= threshold;
          return `<span style="display:inline-block; margin-right:6px; font-size:0.7rem; color:${isCrit ? 'var(--red)' : 'var(--ink)'}; font-weight:700;">${DEFAULT_BRANCHES[bId].shortName.split(' ')[0]}: ${b.stock}</span>`;
        }).join('');
        stockDisplay = stockSummary;
      } else {
        const b = getProductBranchData(p, branchFilter);
        let badgeClass = b.stock === 0 ? 'stock-empty' : (b.stock <= threshold ? 'stock-low' : 'stock-ok');
        stockDisplay = `<span class="stock-badge-pill ${badgeClass}">${b.stock} un. (${getBranchName(branchFilter)})</span>`;
      }

      const hasDiscount = bData.sale && bData.sale < bData.price;
      const discountPercent = hasDiscount ? Math.round(((bData.price - bData.sale) / bData.price) * 100) : 0;

      return `
        <tr>
          <td>
            <img class="table-product-thumb" src="${p.image || FALLBACK_IMAGE}" alt="" onerror="this.src='${FALLBACK_IMAGE}'" />
          </td>
          <td>
            <strong>${p.name}</strong>
            ${p.barcode ? `<br><small style="color:var(--muted); font-size:0.68rem;">EAN: ${p.barcode}</small>` : ''}
          </td>
          <td>${p.category}</td>
          <td>${money(bData.price)}</td>
          <td>
            ${bData.sale ? `
              <strong style="color: var(--red);">${money(bData.sale)}</strong>
              <small class="promo-tag">-${discountPercent}%</small>
            ` : '—'}
          </td>
          <td>
            ${stockDisplay}
          </td>
          <td>
            ${bData.promo ? '<span class="promo-tag">Promoção</span>' : '<span style="color: var(--muted); font-size: 0.72rem;">Normal</span>'}
          </td>
          <td class="text-right">
            <div class="table-actions">
              <button class="action-btn btn-restock" type="button" onclick="quickRestockPrompt('${p.id}')">+ Estoque</button>
              <button class="action-btn btn-edit" type="button" onclick="openProductModal('${p.id}')">Editar</button>
              <button class="action-btn btn-delete" type="button" onclick="deleteProduct('${p.id}')">Excluir</button>
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

// ABA 2: ESTOQUE EM ATENÇÃO
function renderStockAlerts() {
  const container = $('#stock-alerts-container');
  if (!container) return;
  container.innerHTML = '';

  const threshold = config.lowStockThreshold || DEFAULT_CONFIG.lowStockThreshold;
  
  // Agrupa alertas por produto e suas respectivas filiais críticas
  const alerts = [];
  db.products.forEach(p => {
    const criticalBranches = [];
    Object.keys(DEFAULT_BRANCHES).forEach(bId => {
      const b = getProductBranchData(p, bId);
      if (b.stock <= threshold) {
        criticalBranches.push({ branchId: bId, branchName: getBranchName(bId), stock: b.stock });
      }
    });

    if (criticalBranches.length > 0) {
      alerts.push({ product: p, criticalBranches });
    }
  });

  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <h3>Estoque regularizado em todas as 4 filiais</h3>
        <p style="margin-top: 4px;">Nenhum produto está com estoque crítico no momento.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = alerts.map(a => {
    const p = a.product;

    const branchesHtml = a.criticalBranches.map(cb => {
      const isZero = cb.stock === 0;
      return `
        <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:6px; padding:8px 12px; margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="font-size:0.8rem; color:var(--ink);">📍 ${cb.branchName}</strong>
            <span style="font-size:0.75rem; font-weight:800; color:${isZero ? 'var(--red)' : '#b45309'};">
              ${isZero ? 'ESGOTADO (0 un.)' : `${cb.stock} un. restantes`}
            </span>
          </div>
          <div class="quick-restock-btns">
            <button type="button" onclick="addStockBranch('${p.id}', '${cb.branchId}', 5)">+5</button>
            <button type="button" onclick="addStockBranch('${p.id}', '${cb.branchId}', 10)">+10</button>
            <button type="button" onclick="addStockBranch('${p.id}', '${cb.branchId}', 20)">+20</button>
            <button type="button" onclick="quickRestockBranchPrompt('${p.id}', '${cb.branchId}')">Outro</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="stock-alert-card critical">
        <img class="alert-img" src="${p.image || FALLBACK_IMAGE}" alt="" onerror="this.src='${FALLBACK_IMAGE}'" />
        <div class="alert-content" style="width: 100%;">
          <h3>${p.name}</h3>
          <small>${p.category}</small>
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); margin-top: 8px;">Unidades que precisam de reposição:</div>
          ${branchesHtml}
        </div>
      </div>
    `;
  }).join('');
}

window.addStockBranch = async function(id, branchId, amount) {
  const prod = db.products.find(p => String(p.id) === String(id));
  if (!prod) return;
  const bData = getProductBranchData(prod, branchId);
  const newStock = Math.max(0, bData.stock + amount);

  const updatedBranches = {
    ...(prod.branches || {}),
    [branchId]: {
      ...(prod.branches?.[branchId] || {}),
      price: bData.price,
      sale: bData.sale,
      promo: bData.promo,
      stock: newStock
    }
  };

  try {
    console.log(`[Firebase Firestore] Atualizando estoque de "${prod.name}" em ${getBranchName(branchId)} para ${newStock} un....`);
    await updateDoc(doc(dbFirestore, "produtos", String(id)), {
      branches: updatedBranches,
      stock: newStock, // compatibilidade
      updatedAt: new Date().toISOString()
    });
    showToast(`📦 Estoque de "${prod.name}" em ${getBranchName(branchId)} atualizado para ${newStock} un.!`);
  } catch (err) {
    console.error('[Firebase Firestore] Erro ao atualizar estoque:', err);
    alert(`❌ ERRO AO ATUALIZAR ESTOQUE: ${err.message}`);
  }
};

window.quickRestockBranchPrompt = async function(id, branchId) {
  const prod = db.products.find(p => String(p.id) === String(id));
  if (!prod) return;
  const bData = getProductBranchData(prod, branchId);
  const branchName = getBranchName(branchId);
  const input = prompt(`Repor estoque para "${prod.name}" na unidade ${branchName} (Estoque atual: ${bData.stock} un.):\nDigite a quantidade a adicionar:`, '10');
  if (input !== null) {
    const qty = parseInt(input, 10);
    if (!isNaN(qty) && qty > 0) {
      await addStockBranch(id, branchId, qty);
    }
  }
};

window.addStock = function(id, amount) {
  const targetBranch = currentAdminBranchFilter !== 'all' ? currentAdminBranchFilter : currentBranch;
  addStockBranch(id, targetBranch, amount);
};

window.quickRestockPrompt = function(id) {
  const prod = db.products.find(p => String(p.id) === String(id));
  if (!prod) return;
  const targetBranch = currentAdminBranchFilter !== 'all' ? currentAdminBranchFilter : currentBranch;
  quickRestockBranchPrompt(id, targetBranch);
};

// ABA 3: PEDIDOS
function renderAdminSales() {
  const salesMonthEl = $('#sales-month');
  const salesCatEl = $('#sales-category');
  const salesProdEl = $('#sales-product');

  const selectedMonth = salesMonthEl?.value || 'all';
  const selectedCat = salesCatEl?.value || 'all';
  const selectedProd = salesProdEl?.value || 'all';

  const months = [...new Set(db.sales.map(s => (s.date || '').slice(0, 7)).filter(Boolean))].sort().reverse();
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
    salesProdEl.value = selectedProd;
  }

  const monthFilter = salesMonthEl?.value || 'all';
  const catFilter = salesCatEl?.value || 'all';
  const prodFilter = salesProdEl?.value || 'all';

  const orders = db.sales.filter(s => {
    if (monthFilter !== 'all' && !(s.date || '').startsWith(monthFilter)) return false;
    return true;
  });

  const productCounts = {};
  let totalRevenue = 0;
  let totalOrdersCount = 0;

  orders.forEach(order => {
    totalOrdersCount++;
    (order.items || []).forEach(item => {
      if (catFilter !== 'all' && item.category !== catFilter) return;
      if (prodFilter !== 'all' && String(item.productId) !== prodFilter) return;

      productCounts[item.name] = (productCounts[item.name] || 0) + item.qty;
      totalRevenue += (item.price * item.qty);
    });
  });

  $('#stat-sales-revenue').textContent = money(totalRevenue);
  $('#stat-sales-orders').textContent = totalOrdersCount;
  const avgTicket = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount) : 0;
  $('#stat-sales-avg').textContent = money(avgTicket);

  const sortedProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const chartEl = $('#top-products-chart');
  if (chartEl) {
    if (sortedProducts.length > 0) {
      const maxQty = sortedProducts[0][1] || 1;
      chartEl.innerHTML = sortedProducts.map(([name, qty]) => {
        const percent = Math.min(100, Math.max(8, Math.round((qty / maxQty) * 100)));
        return `
          <div class="chart-row">
            <span class="chart-label" title="${name}">${name}</span>
            <div class="chart-bar-wrap">
              <div class="chart-bar" style="width: ${percent}%;"></div>
            </div>
            <strong class="chart-val">${qty} un.</strong>
          </div>
        `;
      }).join('');
    } else {
      chartEl.innerHTML = '<p style="color: var(--muted); align-self: center; margin: auto; font-size: 0.82rem;">Não há vendas para os filtros selecionados.</p>';
    }
  }

  const tbody = $('#sales-order-list');
  if (!tbody) return;

  const relevantOrders = orders.filter(s =>
    (s.items || []).some(i =>
      (catFilter === 'all' || i.category === catFilter) &&
      (prodFilter === 'all' || String(i.productId) === prodFilter)
    )
  );

  if (relevantOrders.length > 0) {
    tbody.innerHTML = relevantOrders.map(order => {
      const dateFormatted = order.date ? new Date(order.date).toLocaleDateString('pt-BR') : '—';
      const itemsDesc = (order.items || []).map(i => `${i.qty}x ${i.name}`).join(', ');
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
            <select class="order-status-select ${getStatusClass(currentStatus)}" onchange="updateOrderStatus('${order.id}', this.value)">
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

window.updateOrderStatus = async function(orderId, newStatus) {
  try {
    await updateDoc(doc(dbFirestore, "pedidos", String(orderId)), {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    showToast(`Status do pedido atualizado para "${newStatus}"!`);
  } catch (err) {
    console.error('Erro ao atualizar status do pedido no Firestore:', err);
  }
};

// ABA 4: CONFIGURAÇÕES
function renderAdminSettings() {
  $('#cfg-whatsapp').value = config.whatsapp || DEFAULT_CONFIG.whatsapp;
  $('#cfg-delivery-fee').value = config.deliveryFee !== undefined ? config.deliveryFee : DEFAULT_CONFIG.deliveryFee;
  $('#cfg-free-shipping').value = config.freeShippingThreshold !== undefined ? config.freeShippingThreshold : DEFAULT_CONFIG.freeShippingThreshold;
  $('#cfg-notice').value = config.storeNotice || DEFAULT_CONFIG.storeNotice;
  $('#cfg-store-hours-text').value = config.storeHoursText || DEFAULT_CONFIG.storeHoursText;
  $('#cfg-store-status').value = config.storeStatusMode || DEFAULT_CONFIG.storeStatusMode;
  $('#cfg-close-hour').value = config.closeHour !== undefined ? config.closeHour : DEFAULT_CONFIG.closeHour;
  $('#cfg-threshold').value = config.lowStockThreshold || DEFAULT_CONFIG.lowStockThreshold;

  // Preenche dados das 4 filiais físicas
  const branches = config.branches || DEFAULT_BRANCHES;
  Object.keys(DEFAULT_BRANCHES).forEach(bId => {
    const b = branches[bId] || DEFAULT_BRANCHES[bId];
    if ($(`#cfg-branch-whatsapp-${bId}`)) $(`#cfg-branch-whatsapp-${bId}`).value = b.whatsapp || '';
    if ($(`#cfg-branch-phone-${bId}`)) $(`#cfg-branch-phone-${bId}`).value = b.phone || '';
    if ($(`#cfg-branch-address-${bId}`)) $(`#cfg-branch-address-${bId}`).value = b.address || '';
  });

  $('#cfg-admin-email').value = config.adminEmail || DEFAULT_CONFIG.adminEmail;
  $('#cfg-admin-password').value = '';
  $('#cfg-admin-password-confirm').value = '';
  $('#cfg-cred-error').textContent = '';
  $('#cfg-cred-success').textContent = '';
}

window.handleStoreSettingsSubmit = async function(e) {
  e.preventDefault();
  config.whatsapp = $('#cfg-whatsapp').value.trim();
  config.deliveryFee = Math.max(0, parseFloat($('#cfg-delivery-fee').value) || 0);
  config.freeShippingThreshold = Math.max(0, parseFloat($('#cfg-free-shipping').value) || 0);
  config.storeNotice = $('#cfg-notice').value.trim();
  config.storeHoursText = $('#cfg-store-hours-text').value.trim() || DEFAULT_CONFIG.storeHoursText;
  config.storeStatusMode = $('#cfg-store-status').value;
  config.closeHour = Math.min(23, Math.max(0, parseInt($('#cfg-close-hour').value, 10) || 20));
  config.lowStockThreshold = Math.max(1, parseInt($('#cfg-threshold').value, 10) || 5);

  // Coleta dados das 4 filiais
  const updatedBranches = {};
  Object.keys(DEFAULT_BRANCHES).forEach(bId => {
    updatedBranches[bId] = {
      id: bId,
      name: DEFAULT_BRANCHES[bId].name,
      shortName: DEFAULT_BRANCHES[bId].shortName,
      whatsapp: $(`#cfg-branch-whatsapp-${bId}`)?.value.trim() || DEFAULT_BRANCHES[bId].whatsapp,
      phone: $(`#cfg-branch-phone-${bId}`)?.value.trim() || DEFAULT_BRANCHES[bId].phone,
      address: $(`#cfg-branch-address-${bId}`)?.value.trim() || DEFAULT_BRANCHES[bId].address
    };
  });
  config.branches = updatedBranches;

  try {
    await setDoc(configDocRef, config, { merge: true });
    showToast('☁️ Configurações da loja e filiais salvas no Firebase!');
    alert('✅ Sucesso! As configurações e os números de WhatsApp das 4 filiais foram salvos no Firebase.');
  } catch (err) {
    console.error('Erro ao salvar configurações no Firestore:', err);
    alert('Erro ao salvar no Firebase: ' + err.message);
  }

  applyStoreConfig();
  updateBranchUI();
  renderStoreHours();
  renderCart();
};

window.handleAdminCredentialsSubmit = async function(e) {
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

  try {
    await setDoc(configDocRef, {
      adminEmail: email,
      adminPassword: p1
    }, { merge: true });
    sucEl.textContent = 'Login e senha atualizados com sucesso no Firebase!';
    showToast('🔑 Credenciais atualizadas no Firebase!');
  } catch (err) {
    errEl.textContent = 'Erro ao salvar credenciais: ' + err.message;
  }

  $('#cfg-admin-password').value = '';
  $('#cfg-admin-password-confirm').value = '';
};

// ==========================================================================
// MODAL DE PRODUTO & OPERAÇÕES FIRESTORE (MULTI-FILIAIS)
// ==========================================================================

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
  const newCatInput = $('#p-new-category');
  if (newCatInput) newCatInput.value = '';
}

window.handleCategorySelectChange = function(select) {
  const newWrapper = $('#new-category-wrapper');
  if (!newWrapper) return;

  if (select.value === '__NEW__') {
    newWrapper.hidden = false;
    $('#p-new-category')?.focus();
  } else {
    newWrapper.hidden = true;
  }
};

// ==========================================================================
// CONTROLES DO MENU SUSPENSO INTERATIVO DE BAIRROS NO CADASTRO DE PRODUTO
// ==========================================================================

let currentModalBranchData = {};

window.toggleBranchDropdown = function() {
  const menu = $('#branch-dropdown-menu');
  const arrow = $('#branch-dropdown-arrow');
  if (!menu) return;
  const isHidden = menu.hidden;
  menu.hidden = !isHidden;
  if (arrow) arrow.textContent = isHidden ? '▲ Fechar Seleção' : '▼ Escolher Lojas';
};

window.updateBranchDropdownSummary = function() {
  const checkedBoxes = Array.from($$('.branch-checkbox:checked'));
  const summary = $('#branch-dropdown-summary');
  const selectAll = $('#branch-select-all');

  if (selectAll) {
    selectAll.checked = checkedBoxes.length === Object.keys(DEFAULT_BRANCHES).length;
  }

  if (!summary) return;

  if (checkedBoxes.length === 0) {
    summary.innerHTML = '<span style="color: var(--red);">⚠️ Nenhuma unidade selecionada</span>';
  } else if (checkedBoxes.length === Object.keys(DEFAULT_BRANCHES).length) {
    summary.textContent = `📍 Todas as 4 filiais selecionadas`;
  } else {
    const names = checkedBoxes.map(cb => DEFAULT_BRANCHES[cb.value]?.shortName || cb.value).join(', ');
    summary.textContent = `📍 ${checkedBoxes.length} unidade${checkedBoxes.length > 1 ? 's' : ''} (${names})`;
  }
};

window.toggleSelectAllBranches = function(checked) {
  $$('.branch-checkbox').forEach(cb => {
    cb.checked = checked;
  });
  updateBranchDropdownSummary();
  renderSelectedBranchInputs();
};

window.handleBranchCheckboxChange = function(branchId) {
  updateBranchDropdownSummary();
  renderSelectedBranchInputs();
};

window.renderSelectedBranchInputs = function(initialBranches = null) {
  const container = $('#selected-branches-container');
  if (!container) return;

  // Salva os valores atuais digitados antes de re-renderizar
  Object.keys(DEFAULT_BRANCHES).forEach(bId => {
    const pInput = $(`#p-price-${bId}`);
    const sInput = $(`#p-sale-${bId}`);
    const stInput = $(`#p-stock-${bId}`);
    const prInput = $(`#p-promo-${bId}`);

    if (pInput || sInput || stInput) {
      if (!currentModalBranchData[bId]) currentModalBranchData[bId] = {};
      if (pInput) currentModalBranchData[bId].price = pInput.value;
      if (sInput) currentModalBranchData[bId].sale = sInput.value;
      if (stInput) currentModalBranchData[bId].stock = stInput.value;
      if (prInput) currentModalBranchData[bId].promo = prInput.checked;
    }
  });

  if (initialBranches) {
    currentModalBranchData = JSON.parse(JSON.stringify(initialBranches));
  }

  const checkedBranches = Array.from($$('.branch-checkbox:checked')).map(cb => cb.value);

  if (checkedBranches.length === 0) {
    container.innerHTML = `
      <div style="padding: 16px; background: #fff1f2; border: 1.5px dashed #fecdd3; border-radius: 6px; text-align: center; color: var(--red);">
        <p style="font-weight: 700; font-size: 0.84rem; margin-bottom: 4px;">⚠️ Nenhuma unidade física selecionada</p>
        <p style="font-size: 0.74rem; color: var(--muted);">Clique no menu suspenso acima e marque ao menos um bairro para habilitar os campos de preço e estoque.</p>
      </div>
    `;
    return;
  }

  const bulkPrice = $('#bulk-price')?.value || '';
  const bulkSale = $('#bulk-sale')?.value || '';
  const bulkStock = $('#bulk-stock')?.value || '10';

  let html = '';
  checkedBranches.forEach(bId => {
    const branchInfo = DEFAULT_BRANCHES[bId];
    const bData = currentModalBranchData[bId] || {};
    const priceVal = (bData.price !== undefined && bData.price !== '') ? bData.price : bulkPrice;
    const saleVal = (bData.sale !== undefined && bData.sale !== null && bData.sale !== '') ? bData.sale : bulkSale;
    const stockVal = (bData.stock !== undefined && bData.stock !== '') ? bData.stock : bulkStock;
    const promoChecked = Boolean(bData.promo);

    html += `
      <div class="branch-price-card" id="price-card-${bId}">
        <div class="branch-price-card-header">
          <strong>📍 ${branchInfo.name}</strong>
          <span class="branch-status-badge">Ativo nesta unidade</span>
        </div>
        <div class="form-grid" style="margin: 0; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px;">
          <label>
            Preço Regular (R$) <strong style="color:var(--red);">*</strong>
            <input id="p-price-${bId}" type="number" min="0" step="0.01" placeholder="0.00" value="${priceVal}" />
          </label>
          <label>
            Preço Promo (R$) <small>(Opcional)</small>
            <input id="p-sale-${bId}" type="number" min="0" step="0.01" placeholder="0.00" value="${saleVal}" />
          </label>
          <label>
            Estoque (un.) <strong style="color:var(--red);">*</strong>
            <input id="p-stock-${bId}" type="number" min="0" step="1" placeholder="10" value="${stockVal}" />
          </label>
        </div>
        <div class="checkbox-group" style="margin-top: 8px;">
          <label class="checkbox-label" style="font-size: 0.76rem;">
            <input id="p-promo-${bId}" type="checkbox" ${promoChecked ? 'checked' : ''} />
            <span>Destacar como Promoção do Dia nesta unidade</span>
          </label>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
};

window.applyBulkPricesToSelected = function() {
  const bulkPrice = $('#bulk-price')?.value || '';
  const bulkSale = $('#bulk-sale')?.value || '';
  const bulkStock = $('#bulk-stock')?.value || '10';

  const checkedBranches = Array.from($$('.branch-checkbox:checked')).map(cb => cb.value);
  checkedBranches.forEach(bId => {
    const pIn = $(`#p-price-${bId}`);
    const sIn = $(`#p-sale-${bId}`);
    const stIn = $(`#p-stock-${bId}`);

    if (pIn && bulkPrice) pIn.value = bulkPrice;
    if (sIn) sIn.value = bulkSale;
    if (stIn && bulkStock) stIn.value = bulkStock;
  });
  showToast('⚡ Valores aplicados para todas as unidades selecionadas!');
};

window.autoSyncBulkPrice = function(val) {
  const checkedBranches = Array.from($$('.branch-checkbox:checked')).map(cb => cb.value);
  checkedBranches.forEach(bId => {
    const pIn = $(`#p-price-${bId}`);
    if (pIn && !pIn.dataset.custom) {
      pIn.value = val;
    }
  });
};

window.autoSyncBulkSale = function(val) {
  const checkedBranches = Array.from($$('.branch-checkbox:checked')).map(cb => cb.value);
  checkedBranches.forEach(bId => {
    const sIn = $(`#p-sale-${bId}`);
    if (sIn && !sIn.dataset.custom) {
      sIn.value = val;
    }
  });
};

window.autoSyncBulkStock = function(val) {
  const checkedBranches = Array.from($$('.branch-checkbox:checked')).map(cb => cb.value);
  checkedBranches.forEach(bId => {
    const stIn = $(`#p-stock-${bId}`);
    if (stIn && !stIn.dataset.custom) {
      stIn.value = val;
    }
  });
};

window.openProductModal = function(id = null) {
  const modal = $('#product-modal');
  const form = $('#product-form');
  if (!form || !modal) return;

  form.reset();
  currentModalBranchData = {};

  const idInput = $('#product-id');
  if (idInput) idInput.value = id || '';

  const title = $('#product-modal-title');
  const dropdownMenu = $('#branch-dropdown-menu');
  if (dropdownMenu) dropdownMenu.hidden = true;
  const arrow = $('#branch-dropdown-arrow');
  if (arrow) arrow.textContent = '▼';

  if (id) {
    const p = db.products.find(x => String(x.id) === String(id));
    if (!p) return;

    if (title) title.textContent = 'Editar Medicamento';
    if ($('#p-name')) $('#p-name').value = p.name || '';
    if ($('#p-image')) $('#p-image').value = p.image || '';

    fillProductModalCategories(p.category);
    updateImagePreview(p.image || '');

    // Identifica quais filiais têm esse produto ativo
    const branchesDataToLoad = {};
    let firstActivePrice = '';
    let firstActiveSale = '';
    let firstActiveStock = '10';

    Object.keys(DEFAULT_BRANCHES).forEach(bId => {
      const bData = getProductBranchData(p, bId);
      const isBranchActive = (bData.stock > 0 || bData.price > 0);
      const cb = $(`#check-branch-${bId}`);
      if (cb) cb.checked = isBranchActive;

      branchesDataToLoad[bId] = {
        price: bData.price > 0 ? bData.price.toFixed(2) : '',
        sale: (bData.sale !== null && bData.sale !== undefined) ? bData.sale.toFixed(2) : '',
        stock: bData.stock,
        promo: Boolean(bData.promo)
      };

      if (isBranchActive && !firstActivePrice && bData.price > 0) {
        firstActivePrice = bData.price.toFixed(2);
        firstActiveSale = (bData.sale !== null && bData.sale !== undefined) ? bData.sale.toFixed(2) : '';
        firstActiveStock = bData.stock;
      }
    });

    if ($('#bulk-price')) $('#bulk-price').value = firstActivePrice;
    if ($('#bulk-sale')) $('#bulk-sale').value = firstActiveSale;
    if ($('#bulk-stock')) $('#bulk-stock').value = firstActiveStock || '10';

    updateBranchDropdownSummary();
    renderSelectedBranchInputs(branchesDataToLoad);
  } else {
    if (title) title.textContent = 'Cadastrar Novo Medicamento';
    if ($('#p-name')) $('#p-name').value = '';
    if ($('#p-image')) $('#p-image').value = '';
    if ($('#bulk-price')) $('#bulk-price').value = '';
    if ($('#bulk-sale')) $('#bulk-sale').value = '';
    if ($('#bulk-stock')) $('#bulk-stock').value = '10';

    // Seleciona todas as 4 filiais por padrão
    $$('.branch-checkbox').forEach(cb => cb.checked = true);
    if ($('#branch-select-all')) $('#branch-select-all').checked = true;

    fillProductModalCategories();
    updateImagePreview('');
    updateBranchDropdownSummary();
    renderSelectedBranchInputs();
  }

  modal.showModal();
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
    if ($('#p-image')) $('#p-image').value = base64;
    updateImagePreview(base64);
  };
  reader.readAsDataURL(file);
};

let isSavingProduct = false;

window.handleProductSubmit = async function(e) {
  if (e) e.preventDefault();

  if (isSavingProduct) {
    console.warn('[Firebase Firestore] Gravação já em andamento, ignorando clique duplicado.');
    return;
  }

  const idRaw = $('#product-id')?.value;
  const id = idRaw ? (Number(idRaw) || idRaw) : Date.now();
  const name = ($('#p-name')?.value || '').trim();
  let category = $('#p-category')?.value || '';
  const newCategory = ($('#p-new-category')?.value || '').trim();

  if (!name) {
    alert('⚠️ Por favor, digite o nome do medicamento / produto.');
    $('#p-name')?.focus();
    return;
  }

  if (category === '__NEW__') {
    if (!newCategory) {
      alert('⚠️ Por favor, digite o nome da nova categoria.');
      $('#p-new-category')?.focus();
      return;
    }
    category = newCategory;

    if (!config.categories.includes(category)) {
      config.categories.push(category);
      setDoc(configDocRef, { categories: config.categories }, { merge: true }).catch(e => console.warn(e));
      renderCategoryCards();
    }
  }

  if (!category) {
    alert('⚠️ Por favor, selecione uma categoria.');
    $('#p-category')?.focus();
    return;
  }

  const image = ($('#p-image')?.value || '').trim() || FALLBACK_IMAGE;

  // Coleta filiais selecionadas no dropdown
  const checkedBranches = Array.from($$('.branch-checkbox:checked')).map(cb => cb.value);

  if (checkedBranches.length === 0) {
    alert('⚠️ Selecione ao menos uma unidade física (bairro) no menu suspenso para disponibilizar o medicamento.');
    toggleBranchDropdown();
    return;
  }

  const branchesData = {};
  let validPriceFound = false;

  for (const bId of Object.keys(DEFAULT_BRANCHES)) {
    const isChecked = checkedBranches.includes(bId);
    if (isChecked) {
      const pRaw = $(`#p-price-${bId}`)?.value || $('#bulk-price')?.value;
      const bPrice = parseFloat(pRaw) || 0;
      const sRaw = $(`#p-sale-${bId}`)?.value || $('#bulk-sale')?.value;
      const bSale = (!isNaN(parseFloat(sRaw)) && parseFloat(sRaw) > 0) ? parseFloat(sRaw) : null;
      const stRaw = $(`#p-stock-${bId}`)?.value || $('#bulk-stock')?.value;
      const bStock = parseInt(stRaw, 10) || 0;
      const bPromo = Boolean($(`#p-promo-${bId}`)?.checked);

      if (bPrice <= 0) {
        alert(`⚠️ Por favor, informe o preço regular para a unidade ${DEFAULT_BRANCHES[bId].name}.`);
        $(`#p-price-${bId}`)?.focus();
        return;
      }

      validPriceFound = true;
      branchesData[bId] = {
        price: bPrice,
        sale: bSale,
        stock: bStock,
        promo: bPromo,
        active: true
      };
    } else {
      // Filial não selecionada: estoque 0 e inativo (não aparece nessa unidade)
      branchesData[bId] = {
        price: 0,
        sale: null,
        stock: 0,
        promo: false,
        active: false
      };
    }
  }

  if (!validPriceFound) {
    alert('⚠️ Por favor, informe o preço do medicamento.');
    return;
  }

  const firstActiveBranchKey = checkedBranches[0];
  const primaryBranch = branchesData[firstActiveBranchKey] || Object.values(branchesData)[0];

  const productData = {
    id: id,
    name: name,
    category: category,
    image: image,
    branches: branchesData,
    // Propriedades raiz para compatibilidade direta
    price: primaryBranch.price,
    sale: primaryBranch.sale,
    stock: primaryBranch.stock,
    promo: primaryBranch.promo,
    updatedAt: new Date().toISOString()
  };

  isSavingProduct = true;
  const submitBtn = $('#product-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando no Firebase...';
  }

  console.log('[Firebase Firestore] Enviando produto para a coleção "produtos"...', productData);
  updateCloudSyncUI('syncing', `Salvando "${name}" no Firebase...`);

  try {
    const docRef = doc(dbFirestore, "produtos", String(id));
    await setDoc(docRef, productData);

    console.log('[Firebase Firestore] ✅ SUCESSO! Produto salvo no Firestore com ID:', id);
    showToast(`☁️ "${name}" salvo no Firebase com sucesso!`);
    alert(`✅ Medicamento "${name}" foi salvo com sucesso no Firebase Firestore!`);
    
    $('#product-modal')?.close();
  } catch (err) {
    console.error('[Firebase Firestore] ❌ ERRO ao salvar produto no Firestore:', err);
    updateCloudSyncUI('local', 'Erro ao salvar no Firebase');
    alert(`❌ ERRO AO SALVAR PRODUTO NO FIREBASE:\n\nCódigo: ${err.code || 'Desconhecido'}\nMensagem: ${err.message}`);
  } finally {
    isSavingProduct = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Salvar Medicamento';
    }
  }
};

window.deleteProduct = async function(id) {
  const prod = db.products.find(p => String(p.id) === String(id));
  if (!prod) return;

  if (confirm(`Deseja realmente excluir "${prod.name}" de todas as filiais no Firebase?`)) {
    try {
      console.log(`[Firebase Firestore] Excluindo produto ID: ${id}...`);
      updateCloudSyncUI('syncing', 'Excluindo produto no Firebase...');
      await deleteDoc(doc(dbFirestore, "produtos", String(id)));

      console.log(`[Firebase Firestore] ✅ Produto ID ${id} excluído com sucesso.`);
      cart = cart.filter(x => String(x.id) !== String(id));
      renderCart();
      showToast(`🗑️ "${prod.name}" excluído do Firebase!`);
      alert(`✅ Medicamento "${prod.name}" excluído com sucesso do Firebase Firestore!`);
    } catch (err) {
      console.error('[Firebase Firestore] ❌ Erro ao excluir no Firestore:', err);
      alert(`❌ ERRO AO EXCLUIR NO FIREBASE:\n\nCódigo: ${err.code || ''}\nMensagem: ${err.message}`);
    }
  }
};

// ==========================================================================
// INTEGRAÇÃO COM PLANILHAS EXCEL (EXPORTAÇÃO & IMPORTAÇÃO EM MASSA)
// ==========================================================================

function buildWorkbookFromDatabase() {
  if (typeof XLSX === 'undefined') {
    throw new Error('Biblioteca SheetJS não carregada.');
  }

  const wb = XLSX.utils.book_new();

  // 1. Aba Produtos
  const prodHeaders = ["ID", "Nome", "Categoria", "Preco_Regular", "Preco_Promocional", "Estoque", "Promocao_Do_Dia", "Imagem_URL"];
  const prodRows = (db.products || []).map(p => [
    p.id,
    p.name,
    p.category,
    p.price,
    p.sale || "",
    p.stock,
    p.promo ? "SIM" : "NAO",
    p.image || ""
  ]);
  const wsProd = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
  XLSX.utils.book_append_sheet(wb, wsProd, "Produtos");

  // 2. Aba Configuracoes
  const cfgHeaders = ["Chave", "Valor", "Descricao"];
  const cfgRows = [
    ["whatsapp", String(config.whatsapp || DEFAULT_CONFIG.whatsapp), "Número do WhatsApp oficial da farmácia com DDD"],
    ["storeNotice", String(config.storeNotice || DEFAULT_CONFIG.storeNotice), "Frase de destaque na barra do topo do site"],
    ["lowStockThreshold", String(config.lowStockThreshold || DEFAULT_CONFIG.lowStockThreshold), "Quantidade para alertar estoque baixo no painel"],
    ["deliveryFee", String(config.deliveryFee || DEFAULT_CONFIG.deliveryFee), "Taxa padrão de entrega em Reais"],
    ["freeShippingThreshold", String(config.freeShippingThreshold || DEFAULT_CONFIG.freeShippingThreshold), "Valor mínimo de compra para frete grátis"],
    ["storeHoursText", String(config.storeHoursText || DEFAULT_CONFIG.storeHoursText), "Texto de horário exibido no cabeçalho"],
    ["storeStatusMode", String(config.storeStatusMode || DEFAULT_CONFIG.storeStatusMode), "Modo do horário: auto (automático), open (sempre aberto), closed (fechado)"],
    ["closeHour", String(config.closeHour || DEFAULT_CONFIG.closeHour), "Hora de fechamento no modo automático (0-23)"],
    ["adminEmail", String(config.adminEmail || DEFAULT_CONFIG.adminEmail), "E-mail de login do painel administrativo"],
    ["adminPassword", String(config.adminPassword || DEFAULT_CONFIG.adminPassword), "Senha de login do painel administrativo"]
  ];
  const wsCfg = XLSX.utils.aoa_to_sheet([cfgHeaders, ...cfgRows]);
  XLSX.utils.book_append_sheet(wb, wsCfg, "Configuracoes");

  // 3. Aba Categorias
  const catHeaders = ["Nome_Categoria"];
  const catRows = (config.categories || DEFAULT_CATEGORIES).map(c => [c]);
  const wsCat = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
  XLSX.utils.book_append_sheet(wb, wsCat, "Categorias");

  // 4. Aba Pedidos
  const pedHeaders = ["ID_Pedido", "Data_Hora", "Itens", "Subtotal", "Taxa_Entrega", "Total", "Forma_Pagamento", "Endereco_Entrega", "Observacoes", "Status"];
  const pedRows = (db.sales || []).map(s => {
    const itemsStr = (s.items || []).map(i => `${i.qty}x ${i.name}`).join(", ");
    return [
      s.id,
      s.date ? new Date(s.date).toLocaleString('pt-BR') : "",
      itemsStr,
      s.subtotal || 0,
      s.deliveryFee || 0,
      s.total || 0,
      s.payment || "",
      s.address || "",
      s.notes || "",
      s.status || "Recebido"
    ];
  });
  const wsPed = XLSX.utils.aoa_to_sheet([pedHeaders, ...pedRows]);
  XLSX.utils.book_append_sheet(wb, wsPed, "Pedidos");

  return wb;
}

window.exportExcelDatabase = function() {
  try {
    if (typeof XLSX === 'undefined') {
      alert('Biblioteca Excel ainda não carregou. Por favor, aguarde.');
      return;
    }
    const wb = buildWorkbookFromDatabase();
    XLSX.writeFile(wb, "BANCO DE DADOS.xlsx");
    showToast('📥 BANCO DE DADOS.xlsx exportado com sucesso da nuvem!');
  } catch (err) {
    console.error('Erro ao exportar planilha Excel:', err);
    alert('Erro ao exportar planilha: ' + err.message);
  }
};

window.handleExcelFileInput = async function(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    const prodSheetName = wb.SheetNames.find(n => /produto|products|plan1|sheet1/i.test(n)) || wb.SheetNames[0];
    const wsProd = wb.Sheets[prodSheetName];

    if (wsProd) {
      const rawProducts = XLSX.utils.sheet_to_json(wsProd, { defval: "" });
      if (Array.isArray(rawProducts) && rawProducts.length > 0) {
        updateCloudSyncUI('syncing', 'Enviando produtos da planilha para o Firebase...');
        const batch = writeBatch(dbFirestore);

        rawProducts.forEach((row, idx) => {
          const name = String(row.Nome || row.nome || row.Produto || row.produto || row.Name || row.name || '').trim();
          if (!name) return;

          const idRaw = row.ID || row.Id || row.id || (idx + 1);
          const id = Number(idRaw) || Date.now() + idx;
          const category = String(row.Categoria || row.categoria || row.Category || row.category || 'Medicamentos').trim();
          const rawPrice = String(row.Preco_Regular || row.Preco || row.preco || row.price || row.Price || '0').replace(/[^\d.,]/g, '').replace(',', '.');
          const price = parseFloat(rawPrice) || 0;
          let sale = null;
          const rawSale = String(row.Preco_Promocional || row.Preco_Promo || row.sale || row.Sale || '').replace(/[^\d.,]/g, '').replace(',', '.');
          if (rawSale && parseFloat(rawSale) > 0) sale = parseFloat(rawSale);
          const stock = parseInt(row.Estoque || row.estoque || row.Stock || row.stock || 0) || 0;
          const promoVal = String(row.Promocao_Do_Dia || row.Promo || row.promo || row.Promocao || '').toLowerCase().trim();
          const promo = ['sim', 's', 'true', '1', 'yes', 'si'].includes(promoVal);
          const image = String(row.Imagem_URL || row.Imagem || row.imagem || row.Image || row.image || '').trim() || FALLBACK_IMAGE;

          const docRef = doc(dbFirestore, "produtos", String(id));
          batch.set(docRef, {
            id,
            name,
            category,
            price,
            sale,
            stock,
            promo,
            image,
            updatedAt: new Date().toISOString()
          });
        });

        await batch.commit();
        showToast(`✅ Planilha importada e sincronizada no Firebase!`);
      }
    }
  } catch (err) {
    alert('Erro ao carregar o arquivo Excel: ' + err.message);
  } finally {
    e.target.value = '';
  }
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
  a.download = `backup_pietrao_firebase_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

window.importDataBackup = async function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.db && Array.isArray(imported.db.products)) {
        const batch = writeBatch(dbFirestore);
        for (const p of imported.db.products) {
          const docRef = doc(dbFirestore, "produtos", String(p.id));
          batch.set(docRef, { ...p, updatedAt: new Date().toISOString() });
        }
        await batch.commit();
        if (imported.config) {
          await setDoc(configDocRef, imported.config, { merge: true });
        }
        showToast('Backup JSON restaurado no Firebase com sucesso!');
      } else {
        alert('Arquivo de backup inválido.');
      }
    } catch (err) {
      alert('Erro ao processar o backup: ' + err.message);
    }
  };
  reader.readAsText(file);
};

window.resetToDefaultData = function() {
  if (confirm('Deseja restaurar o catálogo do Firebase para a base padrão?')) {
    seedInitialProductsToFirestore(false);
  }
};

// ==========================================================================
// INICIALIZAÇÃO GERAL DO APLICATIVO
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  applyStoreConfig();
  renderCategoryCards();
  renderStore();
  renderCart();
  renderStoreHours();
  updateCustomerHeader();
  setupLocationAndAccount();

  // Iniciar ouvintes em tempo real do Firebase Firestore
  initFirestoreListeners();

  setInterval(renderStoreHours, 60000);

  $('#open-cart')?.addEventListener('click', openCart);
  $('.close-cart')?.addEventListener('click', closeCart);
  $('#overlay')?.addEventListener('click', closeCart);

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
  $('#product-form')?.addEventListener('submit', handleProductSubmit);
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

  // Botão de seleção de filial no cabeçalho
  $('#open-branch-btn')?.addEventListener('click', () => {
    $('#branch-modal')?.showModal();
  });

  // Filtro de filial no painel administrativo
  $('#admin-branch-filter')?.addEventListener('change', renderAdminCatalog);

  // Inicialização e checagem de primeiro acesso para escolha de filial
  updateBranchUI();
  checkInitialBranchSelection();

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

  // Fechar dropdown de bairros ao clicar fora
  document.addEventListener('click', (e) => {
    const wrapper = $('#branch-dropdown-wrapper');
    const menu = $('#branch-dropdown-menu');
    if (wrapper && menu && !menu.hidden && !wrapper.contains(e.target)) {
      menu.hidden = true;
      const arrow = $('#branch-dropdown-arrow');
      if (arrow) arrow.textContent = '▼';
    }
  });

  if (location.hash === '#admin') {
    showAdmin();
  } else {
    $('#admin-area').hidden = true;
    $('#storefront').hidden = false;
  }
});
