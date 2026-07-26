let products = [];
let config = {};
let cart = JSON.parse(localStorage.getItem("cart")) || {};
let currentFilter = "todos";
let searchTerm = "";

const catLabels = {
  verdura: "Verduras",
  fruta: "Frutas",
  proteina: "Carnes y Proteínas",
  lacteo: "Lácteos",
  grano: "Granos y Cereales",
  bastimentos: "Bastimentos",
  despensa: "Despensa"
};

// ======================
// UTILIDADES
// ======================

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("es-CO");
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCart() {
  const saved = localStorage.getpppItem("cart");

  if (saved) {
    cart = JSON.parse(saved);
  }
}

// ======================
// CARGAR JSON
// ======================

async function loadData() {
  try {

    const res = await fetch("/data/products.json");

    if (!res.ok) {
      throw new Error("No se pudo cargar productos.json");
    }

    const data = await res.json();

    config = data.tienda;
    products = data.productos;

    init();

  } catch (error) {

    document.getElementById("content").innerHTML = `
      <div class="state-msg">
        ⚠️ Error cargando catálogo
        <br>
        <small>${error.message}</small>
      </div>
    `;

    console.error(error);
  }
}

// ======================
// INICIALIZAR APP
// ======================

function init() {

  document.getElementById('storeName').textContent = config.nombre;
  document.getElementById('storeSlogan').textContent = config.slogan;
  document.title = config.nombre;


  const searchInput =
    document.getElementById('searchInput');

  const clearSearch =
    document.getElementById('clearSearch');


  searchInput.addEventListener('input', (e) => {

    searchTerm =
      e.target.value.toLowerCase();


    clearSearch.style.display =
      searchTerm ? "block" : "none";


    renderGrid();

  });


  clearSearch.addEventListener('click', () => {

    searchInput.value = "";

    searchTerm = "";

    clearSearch.style.display = "none";

    renderGrid();

  });


  renderFilters();
  renderGrid();
  renderCartItems();
  updateBadge();

}

// ======================
// FILTROS
// ======================

// Orden de las categorías

function renderFilters() {

  const cats = [
    "todos",
    ...new Set(products.map(p => p.categoria))
  ];

  const labels = {
    todos: "Todos",
    ...catLabels
  };

  document.getElementById("filters").innerHTML =
    cats.map(cat => `
      <button
        class="filter-btn ${cat === currentFilter ? "active" : ""}"
        onclick="filter('${cat}', this)">

        ${labels[cat] || cat}

      </button>
    `).join("");
}

function filter(cat, btn) {

  currentFilter = cat;

  document
    .querySelectorAll(".filter-btn")
    .forEach(b => b.classList.remove("active"));

  btn.classList.add("active");

  renderGrid();
}

// ======================
// PRODUCTOS
// ======================


function renderGrid() {

  let filtered =
    currentFilter === "todos"
      ? products
      : products.filter(
          p => p.categoria === currentFilter
        );

  // Buscar
  if (searchTerm) {
    filtered = filtered.filter(product =>
      product.nombre
        .toLowerCase()
        .includes(searchTerm)
    );
  }

  // ==========================
  // ORDENAR PRODUCTOS
  // ==========================
  const orderCategorias = {
    fruta: 1,
    verdura: 2,
    proteina: 3,
    grano: 4,
    lacteo: 5,
    bastimentos: 6
  };

  filtered.sort((a, b) => {

    const categoria =
      orderCategorias[a.categoria] -
      orderCategorias[b.categoria];

    if (categoria !== 0) {
      return categoria;
    }

    return a.nombre.localeCompare(
      b.nombre,
      "es",
      { sensitivity: "base" }
    );

  });

  // ==========================

  if (!filtered.length) {

    document.getElementById("content").innerHTML = `
      <div class="state-msg">
        No se encontraron productos.
      </div>
    `;

    return;
  }

  const html = 
  `<div class="grid">
    ${filtered.map(product => {
      const qty = cart[product.id] || 0;
      const button = product.agotado
        ? `<div class="agotado-badge">
          Agotado
        </div>`

        : qty === 0
        ? `<button
          class="add-btn"
          onclick="addToCart(${product.id})">
          + Agregar
        </button>`
            
        :`<div class="product-counter">
          <button
            class="counter-btn"
            onclick="changeQty(${product.id},-1)">
              −
          </button>

          <span class="counter-qty"> ${qty} </span>

          <button
            class="counter-btn"
            onclick="changeQty(${product.id},1)">
              +
          </button>
        </div>`;

        return `
        <div class="card ${product.agotado ? "agotado" : ""}">
          <div class="card-emoji">
            <img src="${product.imagen}" alt="${product.nombre}">
          </div>

          <span class="card-cat cat-${product.categoria}">
            ${catLabels[product.categoria]}
          </span>

          <div class="card-name">
            ${product.nombre}
          </div>

          <div class="card-unit">
            ${product.unidad}
          </div>

          <div class="card-price">
            ${fmt(product.precio)}
          </div>

          ${button}
        </div>`;
    }).join("")}
  </div>`;

  document.getElementById("content").innerHTML = html;
}

// ======================
// MODO OSCURO
// ======================
const themeBtn = document.getElementById('themeBtn');

function loadTheme() {
  const saved = localStorage.getItem('theme');

  if (saved === 'dark') {
    document.body.classList.add('dark');
    themeBtn.textContent = '☀️';
  }
}

themeBtn.addEventListener('click', () => {

  document.body.classList.toggle('dark');

  const dark =
    document.body.classList.contains('dark');

  localStorage.setItem(
    'theme',
    dark ? 'dark' : 'light'
  );

  themeBtn.textContent =
    dark ? '☀️' : '🌙';
});

loadTheme();

// ======================
// CARRITO
// ======================

function addToCart(id) {

  const product =
    products.find(p => p.id === id);

  if (product?.agotado) return;

  cart[id] = (cart[id] || 0) + 1;

  saveCart();

  updateBadge();
  renderGrid();
  renderCartItems();
}

function changeQty(id, delta) {

  cart[id] = (cart[id] || 0) + delta;

  if (cart[id] <= 0) {
    delete cart[id];
  }

  saveCart();
  updateBadge();
  renderGrid();
  renderCartItems();
}

function clearCart() {

  cart = {};

  saveCart();

  updateBadge();
  renderGrid();
  renderCartItems();
}

function updateBadge() {

  const total =
    Object.values(cart)
      .reduce((a, b) => a + b, 0);

  const badge =
    document.getElementById("badge");

  badge.textContent = total;

  badge.style.display =
    total > 0
      ? "flex"
      : "none";
}

// ======================
// ITEMS DEL CARRITO
// ======================

function renderCartItems() {

  const ids = Object.keys(cart);

  const itemsEl =
    document.getElementById("cartItems");

  const waBtn =
    document.getElementById("waBtn");

  if (!ids.length) {

    itemsEl.innerHTML = `
      <div class="cart-empty">
        <span>🛒</span>
        Tu carrito está vacío
      </div>
    `;

    document.getElementById(
      "totalPrice"
    ).textContent = "$0";

    waBtn.disabled = true;

    return;
  }

  let total = 0;

  itemsEl.innerHTML = ids.map(id => {

    const p =
      products.find(prod => prod.id == id);

    const qty = cart[id];

    const subtotal =
      p.precio * qty;

    total += subtotal;

    return `
    <div class="cart-item">

        <div class="ci-info">

            <div class="ci-name">

                <img
                    src="${p.imagen}"
                    alt="${p.nombre}"
                    class="cart-img">

                <span>${p.nombre}</span>

            </div>

            <div class="ci-sub">
                ${fmt(p.precio)} × ${qty} = <strong>${fmt(subtotal)}</strong>
            </div>

        </div>

        <div class="qty-controls">

            <button
                class="qty-btn"
                onclick="changeQty(${id}, -1)">
                −
            </button>

            <span class="qty-num">
                ${qty}
            </span>

            <button
                class="qty-btn"
                onclick="changeQty(${id}, 1)">
                +
            </button>

        </div>

    </div>
    `;

  }).join("");

  document.getElementById(
    "totalPrice"
  ).textContent = fmt(total);

  waBtn.disabled = false;
}

// ======================
// PANEL CARRITO
// ======================

function openCart() {

  document
    .getElementById("cartPanel")
    .classList.add("open");

  document
    .getElementById("overlay")
    .classList.add("open");
}

function toggleCart() {

  document
    .getElementById("cartPanel")
    .classList.toggle("open");

  document
    .getElementById("overlay")
    .classList.toggle("open");
}

// ======================
// WHATSAPP
// ======================

function sendWhatsApp() {

  const ids = Object.keys(cart);

  if (!ids.length) return;

  let total = 0;

  const items = ids.map(id => {

    const p =
      products.find(prod => prod.id == id);

    const qty = cart[id];

    const subtotal =
      p.precio * qty;

    total += subtotal;

    return `x${qty} ${p.unidad} ${p.nombre} - ${fmt(subtotal)}`;
  });

  const message = encodeURIComponent(
`Hola 👋

Quiero realizar el siguiente pedido:

${items.join("\n")}

*Total estimado = ${fmt(total)}*`
  );

  window.open(
    `https://wa.me/${config.whatsapp}?text=${message}`,
    "_blank"
  );
}

// ======================
// INICIO
// ======================

loadData();