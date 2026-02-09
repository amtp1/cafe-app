let token = localStorage.getItem("token");

if (token) showApp();

let menu = [];
let items = [];
let historyOrders = [];

let currentUser = null;

const dishInput = document.getElementById("dishInput");
const qtyInput = document.getElementById("qty");
const itemSumInput = document.getElementById("itemSum");
const dishDropdown = document.getElementById("dishDropdown");

const avatarBtn = document.getElementById("avatarBtn");
const dropdown = document.getElementById("userDropdown");

const logoutBtn = document.getElementById("logoutBtn");

avatarBtn.onclick = event => {
  event.stopPropagation();
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

fetch("/menu")
  .then(res => res.json())
  .then(data => {
    menu = data;
    const list = document.getElementById("menuList");
    data.forEach(dish => {
      const option = document.createElement("option");
      option.value = dish.name;
      list.appendChild(option);
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

  items.forEach(item => {
    total += item.sum;
    itemsEl.innerHTML += `
      <li>
        <span>${item.name} x${item.qty}</span>
        <strong>${item.sum}</strong>
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

  document.getElementById("userBox").innerText = `(${
    currentUser.role === "admin" ? "Админ" : "Официант"
  }): ${currentUser.nickname}`;
}

async function loadHistory() {
  const res = await fetch("/api/orders", { method: "GET" });
  let orders = await res.json();

  historyOrders = orders;

  const search = document
    .getElementById("searchWaiter")
    .value
    .toLowerCase();

  const status = document.getElementById("statusFilter").value;

  // 🔍 поиск
  if (search) {
    orders = orders.filter(order =>
      order.waiter.toLowerCase().includes(search)
    );
  }

  // 🎛 фильтр
  if (status) {
    orders = orders.filter(order => order.status === status);
  }

  renderHistory(orders);
}

function renderHistory(list) {
  const box = document.getElementById("ordersHistory");
  box.innerHTML = "";

  list.forEach(order => {
    let itemsHtml = "";
    order.items.forEach(item => {
      itemsHtml += `<div>${item.name} x${item.qty} — ${item.sum}</div>`;
    });

    const icon = order.status === "Готово" ? "✅" : "⏳";

    box.innerHTML += `
      <div class="order-card">
        <div class="order-head">
          <span>Стол ${order.table} · <b>Официант:</b> ${order.waiter}</span>
          <span class="badge ${order.status === "Готово" ? "done" : "work"}"><b>${icon} ${
            order.status
          }</b></span>
          <span>${new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-total">Итого: ${order.total}</div>
        <b>Статус:</b>
        <select onchange="changeStatus('${order._id}', this.value)">
          <option ${order.status === "В работе" ? "selected" : ""}>В работе</option>
          <option ${order.status === "Готово" ? "selected" : ""}>Готово</option>
        </select>
      </div>
    `;
  });
}

function filterHistory() {
  const query = document.getElementById("searchWaiter").value.toLowerCase();

  const filtered = historyOrders.filter(order =>
    order.waiter.toLowerCase().includes(query)
  );

  renderHistory(filtered);
}

function openTab(name) {
  document
    .querySelectorAll(".tab-content")
    .forEach(tab => tab.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach(button => button.classList.remove("active"));

  document.getElementById(name).classList.add("active");
  event.target.classList.add("active");

  if (name === "history") loadHistory();
}

function showApp() {
  const loginBox = document.getElementById("loginBox");
  const appBox = document.getElementById("appBox");

  if (loginBox) {
    loginBox.style.display = "none";
  }

  if (appBox) {
    appBox.style.display = "block";
  }
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
    .filter(dish => dish.name.toLowerCase().includes(val))
    .forEach(dish => {
      const div = document.createElement("div");
      div.className = "dish-item";
      div.innerHTML = `<span>${dish.name}</span><b>${dish.price} ₽</b>`;
      div.onclick = () => {
        dishInput.value = dish.name;
        dishDropdown.style.display = "none";
        calcCurrent();
      };
      dishDropdown.appendChild(div);
    });

  dishDropdown.style.display = "block";
}

document.addEventListener("click", event => {
  if (!dishInput.parentElement.contains(event.target)) {
    dishDropdown.style.display = "none";
  }
});
