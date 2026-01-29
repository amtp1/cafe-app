let token = localStorage.getItem("token");

if (token) showApp();

let menu = [];
let items = [];
let historyOrders = [];

let currentUser = null;

const dishInput = document.getElementById("dishInput");
const qtyInput = document.getElementById("qty");
const itemSumInput = document.getElementById("itemSum");

const avatarBtn = document.getElementById("avatarBtn");
const dropdown = document.getElementById("userDropdown");

const logoutBtn = document.getElementById("logoutBtn");

avatarBtn.onclick = e => {
  e.stopPropagation();
  dropdown.classList.toggle("show");
};

document.body.onclick = () => {
  dropdown.classList.remove("show");
};

logoutBtn.onclick = async () => {
  await fetch("/api/logout", { method: "POST" });
  location.href = "/login";
};

loadUser();
loadHistory();

fetch("/menu").then(r => r.json()).then(data => {
  menu = data;
  const list = document.getElementById("menuList");
  data.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.name;
    list.appendChild(opt);
  });
});

fetch("/waiters").then(r => r.json()).then(data => {
  const w = document.getElementById("waiter");
  data.forEach(d => {
    const opt = document.createElement("option");
    opt.text = d.name;
    w.add(opt);
  });
});

function addItem() {
  const name = dishInput.value;

  let qty = Number(qtyInput.value || 1);
  if (qty < 1) {
    qty = 1;
    qtyInput.value = 1;
  }

  const dish = menu.find(d => d.name === name);

  if (!dish) {
    alert("Выберите блюдо из списка");
    return;
  }

  const sum = dish.price * qty;
  items.push({ name, qty, price: dish.price, sum });

  dishInput.value = "";
  qtyInput.value = 1;
  itemSumInput.value = "";

  render();
}

function render() {
  const itemsEl = document.getElementById("items");
  const totalEl = document.getElementById("total");

  itemsEl.innerHTML = "";
  let total = 0;

  items.forEach(i => {
    total += i.sum;
    itemsEl.innerHTML += `
      <li>
        <span>${i.name} x${i.qty}</span>
        <strong>${i.sum}</strong>
      </li>
    `;
  });

  totalEl.innerText = total;
}

function saveOrder() {
  fetch("/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table: table.value,
      items,
      total: total.innerText
    })
  }).then(() => alert("Сохранено"));
}

dishInput.addEventListener("input", calcCurrent);
qtyInput.addEventListener("input", calcCurrent);

dishInput.addEventListener("input", calcCurrent);
qtyInput.addEventListener("input", calcCurrent);

function calcCurrent() {
  const dish = menu.find(d => d.name === dishInput.value);

  let qty = Number(qtyInput.value || 1);

  if (qty < 1) {
    qty = 1;
    qtyInput.value = 1;
  }

  if (!dish) {
    itemSumInput.value = "";
    return;
  }

  itemSumInput.value = dish.price * qty;
}

async function loadUser() {
  const res = await fetch("/api/me");
  currentUser = await res.json();

  if (!currentUser) {
    location.href = "/login";
    return;
  }

  document.getElementById("userBox").innerText = `(${currentUser.role === "admin" ? "Админ" : "Официант"}): ${currentUser.username}`;
}

async function loadHistory() {
  const res = await fetch("/api/orders", { method: "GET" });
  let orders = await res.json();

  const search = document
    .getElementById("searchWaiter")
    .value
    .toLowerCase();

  const status = document.getElementById("statusFilter").value;

  // 🔍 поиск
  if (search) {
    orders = orders.filter(o =>
      o.waiter.toLowerCase().includes(search)
    );
  }

  // 🎛 фильтр
  if (status) {
    orders = orders.filter(o =>
      o.status === status
    );
  }

  renderHistory(orders);
}

function renderHistory(list) {
  const box = document.getElementById("ordersHistory");
  box.innerHTML = "";

  list.forEach(o => {
    let itemsHtml = "";
    o.items.forEach(i => {
      itemsHtml += `<div>${i.name} x${i.qty} — ${i.sum}</div>`;
    });

    const icon = o.status === "Готово" ? "✅" : "⏳";

    box.innerHTML += `
      <div class="order-card">
        <div class="order-head">
          <span>Стол ${o.table} · <b>Официант:</b> ${o.waiter}</span>
          <span class="badge ${o.status === "Готово" ? "done" : "work"}"><b>${icon} ${o.status}</b></span>
          <span>${new Date(o.createdAt).toLocaleString()}</span>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-total">Итого: ${o.total}</div>
        <b>Статус:</b>
        <select onchange="changeStatus('${o._id}', this.value)">
          <option ${o.status === "В работе" ? "selected" : ""}>В работе</option>
          <option ${o.status === "Готово" ? "selected" : ""}>Готово</option>
        </select>
      </div>
    `;
  });
}

function filterHistory() {
  const q = document.getElementById("searchWaiter").value.toLowerCase();

  const filtered = historyOrders.filter(o =>
    o.waiter.toLowerCase().includes(q)
  );

  renderHistory(filtered);
}

function openTab(name) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(name).classList.add("active");
  event.target.classList.add("active");

  if (name === "history") loadHistory();
}

function showApp() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("appBox").style.display = "block";
}

async function changeStatus(id, status) {
  await fetch(`/api/orders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  loadHistory();
}

dishInput.addEventListener("input", showDropdown);
dishInput.addEventListener("focus", showDropdown);

function showDropdown() {
  const val = dishInput.value.toLowerCase();
  dishDropdown.innerHTML = "";

  menu
    .filter(d => d.name.toLowerCase().includes(val))
    .forEach(d => {
      const div = document.createElement("div");
      div.className = "dish-item";
      div.innerHTML = `<span>${d.name}</span><b>${d.price} ₽</b>`;
      div.onclick = () => {
        dishInput.value = d.name;
        dishDropdown.style.display = "none";
        calcCurrent();
      };
      dishDropdown.appendChild(div);
    });

  dishDropdown.style.display = "block";
}

document.addEventListener("click", e => {
  if (!dishInput.parentElement.contains(e.target)) {
    dishDropdown.style.display = "none";
  }
});
