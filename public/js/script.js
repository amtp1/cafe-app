let token = localStorage.getItem("token");

if (token) showApp();

let menu = [];
let items = [];
let historyOrders = [];
let allTables = [];
let halls = [];

let currentUser = null;

const dishInput = document.getElementById("dishInput");
const qtyInput = document.getElementById("qty");
const itemSumInput = document.getElementById("itemSum");
const dishDropdown = document.getElementById("dishDropdown");

const avatarBtn = document.getElementById("avatarBtn");
const dropdown = document.getElementById("userDropdown");
const logoutBtn = document.getElementById("logoutBtn");

if (avatarBtn) {
  avatarBtn.onclick = event => {
    event.stopPropagation();
    openTab("profile");
  };
}
if (dropdown) {
  document.body.onclick = () => dropdown.classList.remove("show");
}
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await fetch("/api/logout", { method: "POST" });
    location.href = "/login";
  };
}

loadUser();
loadHistory();
loadHallsAndTables();
initProfileLogout();

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
  const hallSelect = document.getElementById("hallSelect");
  const tableSelect = document.getElementById("tableSelect");
  const totalEl = document.getElementById("total");
  const tableNumber = tableSelect && tableSelect.value ? Number(tableSelect.value) : null;
  if (tableNumber == null || tableNumber === "") {
    alert("Выберите зал и стол");
    return;
  }
  const hallName = hallSelect && hallSelect.value
    ? (halls.find(h => h._id === hallSelect.value) || {}).name || ""
    : "";
  fetch("/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table: tableNumber,
      hall: hallName,
      items,
      total: totalEl ? totalEl.innerText : 0
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

  const userBox = document.getElementById("userBox");
  if (userBox) {
    userBox.innerText = `(${
      currentUser.role === "admin" ? "Админ" : "Официант"
    }): ${currentUser.nickname}`;
  }
}

async function loadHallsAndTables() {
  const hallSelect = document.getElementById("hallSelect");
  const tableSelect = document.getElementById("tableSelect");
  const tableSeats = document.getElementById("tableSeats");
  if (!hallSelect || !tableSelect) return;
  try {
    const [hallsRes, tablesRes] = await Promise.all([
      fetch("/api/halls"),
      fetch("/api/tables")
    ]);
    if (!hallsRes.ok || !tablesRes.ok) return;
    halls = await hallsRes.json();
    allTables = await tablesRes.json();

    hallSelect.innerHTML = "<option value=\"\">— Выберите зал —</option>";
    halls.forEach(h => {
      const opt = document.createElement("option");
      opt.value = h._id;
      opt.textContent = h.name;
      hallSelect.appendChild(opt);
    });

    hallSelect.onchange = () => {
      const hallId = hallSelect.value;
      tableSelect.innerHTML = "<option value=\"\">— Выберите стол —</option>";
      if (tableSeats) tableSeats.textContent = "—";
      if (!hallId) return;
      const filtered = allTables.filter(t => {
        const hId = t.hall && (t.hall._id || t.hall);
        return String(hId) === String(hallId);
      });
      filtered.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.number;
        opt.textContent = `Стол № ${t.number}`;
        opt.dataset.seats = t.seats != null ? t.seats : "";
        tableSelect.appendChild(opt);
      });
    };

    tableSelect.onchange = () => {
      const opt = tableSelect.selectedOptions[0];
      if (tableSeats) tableSeats.textContent = opt && opt.dataset.seats !== undefined && opt.dataset.seats !== "" ? opt.dataset.seats : "—";
    };
  } catch (e) {
    console.error("Halls/tables load error", e);
  }
}

async function loadProfile() {
  const nameEl = document.getElementById("profileName");
  const dateEl = document.getElementById("profileDate");
  const avatarEl = document.getElementById("profileAvatar");
  if (!nameEl || !dateEl) return;
  try {
    const res = await fetch("/api/profile");
    const user = await res.json();
    if (!user) return;
    const displayName = (user.nickname || user.username || "Пользователь").trim();
    nameEl.textContent = displayName.toUpperCase();
    dateEl.textContent = user.createdAt
      ? "Дата регистрации: " + new Date(user.createdAt).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })
      : "Дата регистрации: —";
    if (avatarEl) avatarEl.innerHTML = "&#129332;";
  } catch (e) {
    nameEl.textContent = "—";
    dateEl.textContent = "Дата регистрации: —";
  }
}

function initProfileLogout() {
  const btn = document.getElementById("profileLogoutBtn");
  if (btn) {
    btn.onclick = async () => {
      await fetch("/api/logout", { method: "POST" });
      location.href = "/login";
    };
  }
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

  // Загружаем краткий отчёт по дню
  try {
    const reportRes = await fetch("/api/reports/today");
    if (reportRes.ok) {
      const report = await reportRes.json();
      const box = document.getElementById("reportSummary");
      if (box) {
        const methods = Object.entries(report.byPaymentMethod || {})
          .map(([m, sum]) => `${m}: ${sum} ₽`)
          .join(" · ");

        box.innerHTML = `
          <div><b>Выручка за сегодня:</b> ${report.totalRevenue} ₽ (заказов: ${report.count})</div>
          <div><small>${methods || "Пока нет оплаченных заказов"}</small></div>
        `;
      }
    }
  } catch (error) {
    console.error("Report load error", error);
  }
}

function renderHistory(list) {
  const box = document.getElementById("ordersHistory");
  box.innerHTML = "";

  list.forEach(order => {
    let itemsHtml = "";
    order.items.forEach(item => {
      itemsHtml += `<div>${item.name} x${item.qty} — ${item.sum}</div>`;
    });

    const icon =
      order.status === "Оплачен"
        ? "💰"
        : order.status === "Готово"
        ? "✅"
        : order.status === "Отменен"
        ? "❌"
        : "⏳";
    const badgeClass =
      order.status === "Оплачен" || order.status === "Готово"
        ? "done"
        : order.status === "Отменен"
        ? "cancel"
        : "work";
    const hallText = order.hall ? ` · ${order.hall}` : "";

    box.innerHTML += `
      <div class="order-card">
        <div class="order-head">
          <span>Стол ${order.table}${hallText} · <b>Официант:</b> ${order.waiter}</span>
          <span class="badge ${badgeClass}"><b>${icon} ${order.status}</b></span>
          <span>${new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-total">Итого: ${order.total}</div>
        <div><b>Оплата:</b> ${order.paymentMethod || "—"}</div>
        <b>Статус:</b>
        <select onchange="changeStatus('${order._id}', this.value)">
          <option ${order.status === "В работе" ? "selected" : ""}>В работе</option>
          <option ${order.status === "Готово" ? "selected" : ""}>Готово</option>
          <option ${order.status === "Оплачен" ? "selected" : ""}>Оплачен</option>
          <option ${order.status === "Отменен" ? "selected" : ""}>Отменен</option>
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
    .forEach(btn => btn.classList.remove("active"));

  const content = document.getElementById(name);
  const btn = document.querySelector(`.tab-btn[onclick="openTab('${name}')"]`);
  if (content) content.classList.add("active");
  if (btn) btn.classList.add("active");

  const titleEl = document.getElementById("pageTitle");
  if (titleEl) {
    if (name === "profile") titleEl.textContent = "👤 Профиль";
    else if (name === "history") titleEl.textContent = "📋 История";
    else titleEl.textContent = "🍽 POS Заказы";
  }

  if (name === "history") loadHistory();
  if (name === "profile") loadProfile();
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
  let paymentMethod;
  let codeWord;

  if (status === "Оплачен") {
    paymentMethod = prompt(
      "Способ оплаты (например: Наличные, Карта, Онлайн):",
      "Наличные"
    );
  }
  if (status === "Отменен") {
    codeWord = prompt("Введите кодовое слово для отмены заказа:");
    if (codeWord === null) return; // отмена нажата
  }

  const res = await fetch(`/api/orders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, paymentMethod, codeWord })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(data.error || "Ошибка смены статуса");
    return;
  }

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
