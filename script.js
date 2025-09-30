// API URL — use static JSON for GitHub Pages
 const API_URL = "products.json";
const ORDERS_URL = null; // no server on GitHub Pages

let products = [];
let cart = [];

// DOM
const productList = document.getElementById("product-list");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const cartCountEl = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("clear-cart");
const checkoutBtn = document.getElementById("checkout-btn");

// modal elements
const paymentModal = document.getElementById("payment-modal");
const closeModalBtn = document.getElementById("close-modal");
const checkoutSummary = document.getElementById("checkout-summary");
const paymentMethodSelect = document.getElementById("payment-method");
const mpesaForm = document.getElementById("mpesa-form");
const bankForm = document.getElementById("bank-form");
const mpesaPhoneInput = document.getElementById("mpesa-phone");
const mpesaPayBtn = document.getElementById("mpesa-pay");
const mpesaStatus = document.getElementById("mpesa-status");
const bankRefEl = document.getElementById("bank-ref");
const bankDoneBtn = document.getElementById("bank-done");
const bankStatus = document.getElementById("bank-status");
const orderResult = document.getElementById("order-result");

// Init
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  renderCart();
});

// Fetch products
async function fetchProducts() {
  productList.innerHTML = "<p>Loading products...</p>";
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    const data = await res.json();
    // Support both formats: an array OR { products: [...] }
    if (Array.isArray(data)) products = data;
    else if (data && Array.isArray(data.products)) products = data.products;
    else throw new Error("Invalid products format");

    renderProducts(products);
  } catch (err) {
    console.error("Fetch products error:", err);
    productList.innerHTML = `<p style="color:red">⚠️ Failed to load products. <button onclick="fetchProducts()">Retry</button></p>`;
  }
}

// Render products
function renderProducts(list) {
  productList.innerHTML = "";
  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${escapeHtml(p.name)}" />
      <h3>${escapeHtml(p.name)}</h3>
      <p><em>${escapeHtml(p.category)}</em></p>
      <p>Brand: ${escapeHtml(p.brand)}</p>
      <p><strong>Ksh ${Number(p.price).toLocaleString()}</strong></p>
      <button data-id="${p.id}">Add to Cart</button>
    `;
    const btn = card.querySelector("button");
    btn.addEventListener("click", () => addToCart(p.id));
    productList.appendChild(card);
  });
}

// Add to cart by id
function addToCart(id) {
  const product = products.find(p => Number(p.id) === Number(id));
  if (!product) return;
  const existing = cart.find(i => Number(i.id) === Number(id));
  if (existing) existing.qty++;
  else cart.push({ id: Number(product.id), name: product.name, price: Number(product.price), qty: 1 });
  saveCart();
  renderCart();
}

function saveCart() { localStorage.setItem("bh_cart", JSON.stringify(cart)); }

function loadCart() {
  const saved = JSON.parse(localStorage.getItem("bh_cart") || "[]");
  cart = Array.isArray(saved) ? saved : [];
}

// Render cart
function renderCart() {
  loadCart();
  cartItemsEl.innerHTML = "";
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.qty;
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `<span>${escapeHtml(item.name)} - Ksh ${Number(item.price).toLocaleString()} x ${item.qty}</span>
                    <button class="remove-btn" data-id="${item.id}">Remove</button>`;
    cartItemsEl.appendChild(li);
  });

  // cartTotalEl is a <span>, set to number
  cartTotalEl.textContent = total;
  cartCountEl.textContent = cart.reduce((s, i) => s + i.qty, 0);

  // attach remove listeners
  cartItemsEl.querySelectorAll(".remove-btn").forEach(b => {
    b.addEventListener("click", () => {
      const id = Number(b.dataset.id);
      removeFromCart(id);
    });
  });
}

function removeFromCart(id) {
  cart = cart.filter(i => Number(i.id) !== Number(id));
  saveCart();
  renderCart();
}

// Clear cart
clearCartBtn.addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
});

// Checkout button opens modal
checkoutBtn.addEventListener("click", () => openPaymentModal());

// Modal handlers
function openPaymentModal() {
  if (!cart.length) {
    alert("Your cart is empty. Add some products first.");
    return;
  }
  // populate summary
  const lines = cart.map(i => `${escapeHtml(i.name)} x${i.qty} — Ksh ${i.price * i.qty}`);
  const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
  checkoutSummary.innerHTML = `<div>${lines.join("<br>")}</div><p><strong>Total: Ksh ${total}</strong></p>`;
  // reset forms
  mpesaStatus.textContent = "";
  bankStatus.textContent = "";
  orderResult.textContent = "";
  mpesaPhoneInput.value = "";
  // set default payment view
  paymentMethodSelect.value = "mpesa";
  mpesaForm.classList.remove("hidden");
  bankForm.classList.add("hidden");
  paymentModal.classList.remove("hidden");
  paymentModal.setAttribute("aria-hidden", "false");
}

// change payment method UI
paymentMethodSelect.addEventListener("change", (e) => {
  if (e.target.value === "mpesa") {
    mpesaForm.classList.remove("hidden");
    bankForm.classList.add("hidden");
  } else {
    mpesaForm.classList.add("hidden");
    bankForm.classList.remove("hidden");
    // generate a bank reference
    bankRefEl.textContent = generateReference();
  }
});

closeModalBtn.addEventListener("click", closePaymentModal);
paymentModal.addEventListener("click", (e) => {
  if (e.target === paymentModal) closePaymentModal();
});

function closePaymentModal() {
  paymentModal.classList.add("hidden");
  paymentModal.setAttribute("aria-hidden", "true");
}

// M-Pesa simulated "STK push"
mpesaPayBtn.addEventListener("click", async () => {
  const phone = mpesaPhoneInput.value.trim();
  if (!/^(07|7)\d{8}$/.test(phone)) {
    mpesaStatus.textContent = "Enter a valid Kenyan phone number (07XXXXXXXX).";
    mpesaStatus.className = "status error";
    return;
  }
  mpesaStatus.textContent = "Sending STK push to " + phone + " ...";
  mpesaStatus.className = "status";
  // simulate network call & user completing payment
  mpesaPayBtn.disabled = true;
  try {
    await simulateNetwork(2000); // simulate delay
    if (Math.random() < 0.8) {
      mpesaStatus.textContent = "Payment successful (simulated).";
      mpesaStatus.className = "status success";
      const order = buildOrder("mpesa", { phone });
      await saveOrder(order);
      orderResult.textContent = "Order placed successfully. Order ref: " + order.reference;
      orderResult.className = "status success";
      cart = [];
      saveCart();
      renderCart();
      setTimeout(closePaymentModal, 1400);
    } else {
      mpesaStatus.textContent = "Payment failed (simulated). Try again.";
      mpesaStatus.className = "status error";
    }
  } catch (err) {
    mpesaStatus.textContent = "Network error (simulated).";
    mpesaStatus.className = "status error";
    console.error(err);
  } finally {
    mpesaPayBtn.disabled = false;
  }
});

// Bank flow
bankDoneBtn.addEventListener("click", async () => {
  const ref = bankRefEl.textContent || generateReference();
  bankStatus.textContent = "Verifying payment (simulated)...";
  bankStatus.className = "status";
  bankDoneBtn.disabled = true;
  try {
    await simulateNetwork(1500);
    if (Math.random() < 0.7) {
      bankStatus.textContent = "Payment verified (simulated).";
      bankStatus.className = "status success";
      const order = buildOrder("bank", { reference: ref });
      await saveOrder(order);
      orderResult.textContent = "Order placed. Order ref: " + order.reference;
      orderResult.className = "status success";
      cart = [];
      saveCart();
      renderCart();
      setTimeout(closePaymentModal, 1400);
    } else {
      bankStatus.textContent = "No incoming payment found yet. Please wait or try again later.";
      bankStatus.className = "status error";
    }
  } catch (err) {
    bankStatus.textContent = "Network error (simulated).";
    bankStatus.className = "status error";
    console.error(err);
  } finally {
    bankDoneBtn.disabled = false;
  }
});

// ================= Helpers =================
function buildOrder(method, details) {
  const items = cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const reference = generateReference();
  return {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    items,
    total,
    method,
    details,
    reference
  };
}

async function saveOrder(order) {
  if (!ORDERS_URL) {
    console.log("Order (simulated save):", order);
    return;
  }
  await fetch(ORDERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order)
  });
}

function generateReference() {
  return "BH" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function simulateNetwork(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c])
  );
}
