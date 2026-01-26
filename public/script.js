let token = localStorage.getItem("token");

if (token) showApp();

let menu = [];
let items = [];
let historyOrders = [];

const dishInput = document.getElementById("dishInput");
const qtyInput = document.getElementById("qty");
const itemSumInput = document.getElementById("itemSum");

loadHistory();

async function login() {
  const username = loginUser.value;
  const password = loginPass.value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem("token", data.token);
    showApp();
  } else {
    alert(data.error);
  }
}

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
  const qty = Number(qtyInput.value || 1);
  const dish = menu.find(d => d.name === name);

  if (!dish) {
    alert("Выберите блюдо из списка");
    return;
  }

  const sum = dish.price * qty;
  items.push({ name, qty, price: dish.price, sum });

  console.log(items); // для проверки

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
  fetch("/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      waiter: waiter.value,
      table: table.value,
      status: status.value,
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
  const qty = Number(qtyInput.value || 1);

  if (!dish) {
    itemSumInput.value = "";
    return;
  }

  itemSumInput.value = dish.price * qty;
}

async function loadHistory() {
  res = await fetch("/orders", {
    headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
    }
  });
  historyOrders = await res.json();
  renderHistory(historyOrders);
}

function renderHistory(list) {
  const box = document.getElementById("ordersHistory");
  box.innerHTML = "";

  list.forEach(o => {
    let itemsHtml = "";
    o.items.forEach(i => {
      itemsHtml += `<div>${i.name} x${i.qty} — ${i.sum}</div>`;
    });

    box.innerHTML += `
      <div class="order-card">
        <div class="order-head">
          <span>Стол ${o.table} · ${o.waiter}</span>
          <span>${new Date(o.createdAt).toLocaleString()}</span>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-total">Итого: ${o.total}</div>
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