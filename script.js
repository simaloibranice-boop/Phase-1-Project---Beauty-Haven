// Beauty Haven Script

const API_URL = "./products.json"; // Local JSON file for GitHub Pages
let cart = [];

// Fetch products
async function fetchProducts() {
  try {
    const response = await fetch(API_URL);
    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error("Failed to load products:", error);
    document.getElementById("products").innerHTML = `
      <p class="error">⚠️ Failed to load products.</p>
    `;
  }
}

// Display products
function displayProducts(products) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  products.forEach(product => {
    const item = document.createElement("div");
    item.className = "product-card";

    item.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p><strong>Category:</strong> ${product.category}</p>
      <p><strong>Brand:</strong> ${product.brand}</p>
      <p><strong>Price:</strong> Ksh ${product.price}</p>
      <button onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
        Add to Cart
      </button>
    `;

    container.appendChild(item);
  });
}

// Add to cart
function addToCart(id, name, price) {
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id, name, price, quantity: 1 });
  }

  updateCart();
}

// Update cart display
function updateCart() {
  const cartContainer = document.getElementById("cart-items");
  cartContainer.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;

    const li = document.createElement("li");
    li.textContent = `${item.name} - Ksh ${item.price} x ${item.quantity}`;
    cartContainer.appendChild(li);
  });

  document.getElementById("cart-total").textContent = `Total: Ksh ${total}`;
  document.getElementById("cart-count").textContent = cart.length;
}

// Init
fetchProducts();
