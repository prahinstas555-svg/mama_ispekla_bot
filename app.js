// Безопасное подключение Telegram
const tg = window.Telegram?.WebApp || {
  expand: () => {},
  close: () => {},
  sendData: (data) => { alert("Заказ (тест в браузере):\n" + data); },
};
tg.expand();

let DATA = null;
let cart = {};
let activeCat = null;

fetch('catalog.json')
  .then(r => r.json())
  .then(data => {
    DATA = data;
    document.getElementById('shopName').textContent = data.shop.name;
    document.getElementById('shopSub').textContent = data.shop.subtitle;
    activeCat = data.categories[0].id;
    renderCategories();
    renderProducts();
  })
  .catch(err => {
    console.error('Ошибка загрузки catalog.json:', err);
  });

function renderCategories() {
  const nav = document.getElementById('categories');
  nav.innerHTML = '';
  DATA.categories.forEach(c => {
    const b = document.createElement('button');
    b.textContent = `${c.emoji} ${c.name}`;
    if (c.id === activeCat) b.classList.add('active');
    b.onclick = () => { activeCat = c.id; renderCategories(); renderProducts(); };
    nav.appendChild(b);
  });
}

function renderProducts() {
  const main = document.getElementById('products');
  main.innerHTML = '';
  DATA.products.filter(p => p.category === activeCat).forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    const qty = cart[p.id] || 0;
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="images/${p.image}" alt="${p.name}" onerror="this.style.background='#f0e6d8'">
      </div>
      <div class="info">
        <h3>${p.name}</h3>
        <div class="desc">${p.description}</div>
        <div class="price">${p.price} ₽ ${p.unit}</div>
        ${qty === 0
          ? `<button class="add-btn" onclick="addItem(${p.id})">В корзину</button>`
          : `<div class="qty">
               <button onclick="changeQty(${p.id},-1)">−</button>
               <span>${qty}</span>
               <button onclick="changeQty(${p.id},1)">+</button>
             </div>`}
      </div>`;
    main.appendChild(card);
  });
}

function addItem(id) {
  cart[id] = 1;
  renderProducts();
  updateCartBar();
}

function changeQty(id, d) {
  cart[id] = (cart[id] || 0) + d;
  if (cart[id] <= 0) delete cart[id];
  renderProducts();
  updateCartBar();
}

function updateCartBar() {
  const bar = document.getElementById('cartBar');
  const ids = Object.keys(cart);
  if (ids.length === 0) {
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');
  let count = 0, total = 0;
  ids.forEach(id => {
    const p = DATA.products.find(x => x.id == id);
    count += cart[id];
    total += p.price * cart[id];
  });
  document.getElementById('cartInfo').textContent = `${count} поз. • ${total} ₽`;
}

document.getElementById('openCart').onclick = () => {
  renderCart();
  document.getElementById('cartModal').classList.remove('hidden');
};

document.getElementById('closeCart').onclick = () => {
  document.getElementById('cartModal').classList.add('hidden');
};

// Закрытие по клику на оверлей
document.querySelector('.modal-overlay')?.addEventListener('click', () => {
  document.getElementById('cartModal').classList.add('hidden');
});

function renderCart() {
  const box = document.getElementById('cartItems');
  box.innerHTML = '';
  let total = 0;
  Object.keys(cart).forEach(id => {
    const p = DATA.products.find(x => x.id == id);
    const sum = p.price * cart[id];
    total += sum;
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `<span>${p.name} × ${cart[id]}</span><span>${sum} ₽</span>`;
    box.appendChild(row);
  });
  document.getElementById('cartTotal').textContent = `Итого: ${total} ₽`;
}

document.getElementById('sendOrder').onclick = () => {
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const comment = document.getElementById('comment').value.trim();

  if (Object.keys(cart).length === 0) {
    alert('Корзина пуста');
    return;
  }
  if (!name || !phone) {
    alert('Укажите имя и телефон');
    return;
  }

  const items = Object.keys(cart).map(id => {
    const p = DATA.products.find(x => x.id == id);
    return {
      name: p.name,
      qty: cart[id],
      price: p.price,
      sum: p.price * cart[id]
    };
  });
  const total = items.reduce((s, i) => s + i.sum, 0);

  const order = { name, phone, comment, items, total };
  tg.sendData(JSON.stringify(order));
  tg.close();
};
