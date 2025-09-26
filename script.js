const productsContainer = document.getElementById("products");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");

let cart = [];

// API Endpoints
const LOCAL_API = "http://localhost:3000/products";
const MAKEUP_API = "http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline&product_type=lipstick";

// Fetch and display products
async function fetchProducts(apiUrl, isLocal = true) {
  productsContainer.innerHTML = "Loading products...";
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    // Normalize data (local JSON vs Makeup API have different structures)
    const products = isLocal
      ? data
      : data.slice(0, 12).map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: Math.floor(Math.random() * 4000) + 500, // random price
          category: p.product_type,
        }));

    renderProducts(products);
  } catch (err) {
    productsContainer.innerHTML = "⚠️ Failed to load products.";
    console.error(err);
  }
}

function renderProducts(products) {
  productsContainer.innerHTML = "";
  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <h3>${product.name}</h3>
      <p><strong>Brand:</strong> ${product.brand}</p>
      <p><strong>Category:</strong> ${product.category}</p>
      <p><strong>Price:</strong> Ksh ${product.price}</p>
      <button onclick="addToCart(${product.id}, '${product.name}', ${product.price})">Add to Cart</button>
    `;
    productsContainer.appendChild(card);
  });
}

// Cart functions
function addToCart(id, name, price) {
  cart.push({ id, name, price });
  updateCart();
}

function updateCart() {
  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price;
    const li = document.createElement("li");
    li.textContent = `${item.name} - Ksh ${item.price}`;
    li.innerHTML += ` <button onclick="removeFromCart(${index})">❌</button>`;
    cartItems.appendChild(li);
  });

  cartTotal.textContent = total;
  cartCount.textContent = cart.length;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// Event listeners
document.getElementById("load-local").addEventListener("click", () => fetchProducts(LOCAL_API, true));
document.getElementById("load-api").addEventListener("click", () => fetchProducts(MAKEUP_API, false));

// Load local products by default
fetchProducts(LOCAL_API, true);
