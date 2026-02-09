const modalDish = document.getElementById("modalDish");
const modalUser = document.getElementById("modalUser");
const modalIngredient = document.getElementById("modalIngredient");
const modalRecipe = document.getElementById("modalRecipe");
const modalPurchase = document.getElementById("modalPurchase");
const modalWriteoff = document.getElementById("modalWriteoff");

const dishName = document.getElementById("dishName");
const dishPrice = document.getElementById("dishPrice");
const userNickname = document.getElementById("userNickname");
const userName = document.getElementById("userName");
const userPassword = document.getElementById("userPassword");

const ingredientName = document.getElementById("ingredientName");
const ingredientUnit = document.getElementById("ingredientUnit");
const recipeMenuSelect = document.getElementById("recipeMenuSelect");
const recipeComponentsList = document.getElementById("recipeComponentsList");
const purchaseSupplier = document.getElementById("purchaseSupplier");
const purchaseItemsList = document.getElementById("purchaseItemsList");
const writeoffReason = document.getElementById("writeoffReason");
const writeoffItemsList = document.getElementById("writeoffItemsList");

let cachedIngredients = [];

async function ensureIngredientsLoaded() {
  if (cachedIngredients.length) return;
  const res = await fetch("/api/ingredients");
  cachedIngredients = await res.json();
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();

  // Авто-загрузка активной страницы при старте
  const activeLink = document.querySelector(".nav-link.active");
  if (activeLink) {
    activeLink.click();
  }
});

function initNav() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();

      fetch(link.href)
        .then(res => res.text())
        .then(html => {
          const content = document.getElementById("content");
          content.innerHTML = html;

          document
            .querySelectorAll(".nav-link")
            .forEach(navLink => navLink.classList.remove("active"));

          link.classList.add("active");

          initPageScripts(link.dataset.page);
        })
        .catch(error => console.error(error));
    });
  });
}

// Определяем, какую функцию вызывать после загрузки контента
function initPageScripts(page) {
  if (page === "dashboard") {
    loadDashboard();
  }

  if (page === "menu") {
    loadMenu();
  }

  if (page === "users") {
    loadUsers();
  }

  if (page === "stock") {
    loadStock();
  }

  if (page === "recipes") {
    loadRecipes();
  }

  if (page === "purchases") {
    loadPurchases();
  }

  if (page === "writeoffs") {
    loadWriteoffs();
  }
}

function openDishModal() {
  modalDish.style.display = "flex";
}

function openUserModal() {
  modalUser.style.display = "flex";
}

function closeDishModal() {
  modalDish.style.display = "none";
}

function closeUserModal() {
  modalUser.style.display = "none";
}

function openIngredientModal() {
  modalIngredient.style.display = "flex";
}

function closeIngredientModal() {
  modalIngredient.style.display = "none";
}

async function openRecipeModal() {
  modalRecipe.style.display = "flex";

  // заполняем список блюд
  const res = await fetch("/api/menu");
  const menu = await res.json();

  recipeMenuSelect.innerHTML = "";
  menu.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m._id;
    opt.textContent = m.name;
    recipeMenuSelect.appendChild(opt);
  });

  await ensureIngredientsLoaded();

  recipeComponentsList.innerHTML = "";
  addRecipeRow();
}

function closeRecipeModal() {
  modalRecipe.style.display = "none";
}

async function openPurchaseModal() {
  modalPurchase.style.display = "flex";

  await ensureIngredientsLoaded();

  purchaseItemsList.innerHTML = "";
  addPurchaseRow();
}

function closePurchaseModal() {
  modalPurchase.style.display = "none";
}

async function openWriteoffModal() {
  modalWriteoff.style.display = "flex";

  await ensureIngredientsLoaded();

  writeoffItemsList.innerHTML = "";
  addWriteoffRow();
}

function buildIngredientOptions() {
  return cachedIngredients
    .map(i => `<option value="${i._id}" data-unit="${i.unit || ""}">${i.name}</option>`)
    .join("");
}

function getUnitById(id) {
  const item = cachedIngredients.find(i => i._id === id);
  return item?.unit || "";
}

function addRecipeRow() {
  if (!cachedIngredients.length) return;
  const row = document.createElement("div");
  row.className = "modal-row";
  row.innerHTML = `
    <select class="recipe-ingredient">${buildIngredientOptions()}</select>
    <input type="number" class="recipe-qty" min="0.0001" step="0.01" placeholder="Кол-во">
    <span></span>
    <button type="button" class="action-btn action-delete">×</button>
  `;
  row.querySelector("button").onclick = () => row.remove();
  recipeComponentsList.appendChild(row);
}

function addPurchaseRow() {
  if (!cachedIngredients.length) return;
  const row = document.createElement("div");
  row.className = "modal-row";
  row.innerHTML = `
    <select class="purchase-ingredient">${buildIngredientOptions()}</select>
    <input type="number" class="purchase-qty" min="0.0001" step="0.01" placeholder="Кол-во">
    <input type="number" class="purchase-cost" min="0.01" step="0.01" placeholder="Сумма">
    <button type="button" class="action-btn action-delete">×</button>
  `;
  row.querySelector("button").onclick = () => row.remove();
  purchaseItemsList.appendChild(row);
}

function addWriteoffRow() {
  if (!cachedIngredients.length) return;
  const row = document.createElement("div");
  row.className = "modal-row";
  row.innerHTML = `
    <select class="writeoff-ingredient">${buildIngredientOptions()}</select>
    <input type="number" class="writeoff-qty" min="0.0001" step="0.01" placeholder="Кол-во">
    <span class="writeoff-unit"></span>
    <button type="button" class="action-btn action-delete">×</button>
  `;
  const select = row.querySelector(".writeoff-ingredient");
  const unitSpan = row.querySelector(".writeoff-unit");

  const updateUnit = () => {
    unitSpan.textContent = getUnitById(select.value);
  };

  select.addEventListener("change", updateUnit);
  updateUnit();

  row.querySelector("button").onclick = () => row.remove();
  writeoffItemsList.appendChild(row);
}

function closeWriteoffModal() {
  modalWriteoff.style.display = "none";
}

async function saveUser() {
  const nickname = userNickname.value.trim();
  const username = userName.value.trim();
  const password = userPassword.value;

  if (!username || !password) {
    alert("Заполните поля");
    return;
  }

  await fetch("/api/save_user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, username, password })
  });

  closeUserModal();
  loadUsers();
}

async function saveIngredient() {
  const name = ingredientName.value.trim();
  const unit = ingredientUnit.value.trim() || "шт";

  if (!name) {
    alert("Введите название ингредиента");
    return;
  }

  await fetch("/api/ingredients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, unit })
  });

  ingredientName.value = "";
  ingredientUnit.value = "шт";

  closeIngredientModal();
  loadStock();
}

async function loadUsers() {
  const userList = document.getElementById("userList");
  if (!userList) return;

  const res = await fetch("/api/users");
  const data = await res.json();

  userList.innerHTML = "";

  data.forEach(user => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span>${user.nickname}</span>
      <span>${user.username}</span>
      <span>
        <button class="action-btn ${user.isBlocked ? "action-unlock" : "action-lock"}">
          ${user.isBlocked ? "Разблокировать" : "Заблокировать"}
        </button>
      </span>
    `;

    row.querySelector("button").addEventListener("click", () => {
      toggleUser(user._id, user.isBlocked);
    });

    userList.appendChild(row);
  });
}

async function toggleUser(id, isBlocked) {
  await fetch(`/api/users/${id}/block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isBlocked: !isBlocked })
  });

  loadUsers();
}

async function saveDish() {
  const name = dishName.value.trim();
  const price = dishPrice.value;

  if (!name || !price) {
    alert("Заполните поля");
    return;
  }

  await fetch("/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price })
  });

  dishName.value = "";
  dishPrice.value = "";

  closeDishModal();
  loadMenu();
}

async function saveRecipe() {
  const menuId = recipeMenuSelect.value;

  if (!menuId) {
    alert("Выберите блюдо");
    return;
  }

  const rows = recipeComponentsList.querySelectorAll(".modal-row");
  const components = [];

  rows.forEach(row => {
    const select = row.querySelector(".recipe-ingredient");
    const qtyInput = row.querySelector(".recipe-qty");
    if (!select || !qtyInput) return;

    const ingredient = select.value;
    const qty = Number(qtyInput.value);

    if (ingredient && qty > 0) {
      components.push({ ingredient, qty });
    }
  });

  if (!components.length) {
    alert("Добавьте хотя бы один ингредиент");
    return;
  }

  await fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ menu: menuId, components })
  });

  closeRecipeModal();
  loadRecipes();
}

async function savePurchase() {
  const supplier = purchaseSupplier.value.trim();

  const rows = purchaseItemsList.querySelectorAll(".modal-row");
  const items = [];

  rows.forEach(row => {
    const select = row.querySelector(".purchase-ingredient");
    const qtyInput = row.querySelector(".purchase-qty");
    const costInput = row.querySelector(".purchase-cost");
    if (!select || !qtyInput || !costInput) return;

    const ingredient = select.value;
    const qty = Number(qtyInput.value);
    const costTotal = Number(costInput.value);

    if (ingredient && qty > 0 && costTotal > 0) {
      items.push({ ingredient, qty, costTotal });
    }
  });

  if (!items.length) {
    alert("Добавьте хотя бы одну позицию");
    return;
  }

  await fetch("/api/purchases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supplier, items })
  });

  purchaseSupplier.value = "";

  closePurchaseModal();
  loadPurchases();
  loadStock();
}

async function saveWriteoff() {
  const reason = writeoffReason.value.trim();

  const rows = writeoffItemsList.querySelectorAll(".modal-row");
  const items = [];

  rows.forEach(row => {
    const select = row.querySelector(".writeoff-ingredient");
    const qtyInput = row.querySelector(".writeoff-qty");
    if (!select || !qtyInput) return;

    const ingredient = select.value;
    const qty = Number(qtyInput.value);

    if (ingredient && qty > 0) {
      items.push({ ingredient, qty });
    }
  });

  if (!items.length) {
    alert("Добавьте хотя бы одну позицию");
    return;
  }

  await fetch("/api/writeoffs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, items })
  });

  writeoffReason.value = "";

  closeWriteoffModal();
  loadWriteoffs();
  loadStock();
}

async function loadMenu() {
  const menuList = document.getElementById("menuList");
  if (!menuList) return;

  const res = await fetch("/api/menu");
  const data = await res.json();

  menuList.innerHTML = "";

  data.forEach(dish => {
    const row = document.createElement("div");
    row.className = "row";

    row.innerHTML = `
      <span>${dish.name}</span>
      <span>${dish.price} ₽</span>
      <span>
        <button class="action-btn action-delete">Удалить</button>
      </span>
    `;

    row.querySelector("button").addEventListener("click", () => {
      deleteDish(dish._id);
    });

    menuList.appendChild(row);
  });
}

// ---------- DASHBOARD / СКЛАД / РЕЦЕПТЫ / ЗАКУПКИ / СПИСАНИЯ ----------

async function loadDashboard() {
  const box = document.getElementById("dashboardSummary");
  if (!box) return;

  try {
    const res = await fetch("/api/reports/today");
    if (!res.ok) {
      box.innerText = "Ошибка загрузки отчёта";
      return;
    }
    const report = await res.json();

    const methods = Object.entries(report.byPaymentMethod || {})
      .map(([name, sum]) => `${name}: ${sum} ₽`)
      .join(" · ");

    box.innerHTML = `
      <div><b>Выручка за сегодня:</b> ${report.totalRevenue} ₽</div>
      <div>Всего заказов: ${report.count}</div>
      <div><small>${methods || "Пока нет данных об оплате"}</small></div>
    `;
  } catch (error) {
    console.error(error);
    box.innerText = "Ошибка загрузки отчёта";
  }
}

async function loadStock() {
  const list = document.getElementById("stockList");
  if (!list) return;

  const res = await fetch("/api/stock");
  const data = await res.json();

  list.innerHTML = "";

  data.forEach(row => {
    const div = document.createElement("div");
    div.className = "row";
    div.innerHTML = `
      <span>${row.ingredient?.name || "-"}</span>
      <span>${row.ingredient?.unit || ""}</span>
      <span>${row.quantity}</span>
    `;
    list.appendChild(div);
  });
}

async function loadRecipes() {
  const list = document.getElementById("recipeList");
  if (!list) return;

  const res = await fetch("/api/recipes");
  const data = await res.json();

  list.innerHTML = "";

  data.forEach(recipe => {
    const components = recipe.components
      .map(c => `${c.ingredient?.name || "?"} — ${c.qty}`)
      .join(", ");

    const div = document.createElement("div");
    div.className = "row";
    div.innerHTML = `
      <span>${recipe.menu?.name || "-"}</span>
      <span>${components}</span>
    `;
    list.appendChild(div);
  });
}

async function loadPurchases() {
  const list = document.getElementById("purchaseList");
  if (!list) return;

  const res = await fetch("/api/purchases");
  const data = await res.json();

  list.innerHTML = "";

  data.forEach(p => {
    const total = p.items.reduce(
      (sum, i) => sum + Number(i.costTotal || 0),
      0
    );

    const itemsText = p.items
      .map(i => `${i.ingredient?.name || "?"} — ${i.qty} на ${i.costTotal} ₽`)
      .join(", ");

    const div = document.createElement("div");
    div.className = "row";
    div.innerHTML = `
      <span>${new Date(p.date).toLocaleDateString()}</span>
      <span>${p.supplier || "-"}</span>
      <span>
        <div><b>${total} ₽</b></div>
        <div><small>${itemsText}</small></div>
      </span>
    `;
    list.appendChild(div);
  });
}

async function loadWriteoffs() {
  const list = document.getElementById("writeoffList");
  if (!list) return;

  const res = await fetch("/api/writeoffs");
  const data = await res.json();

  list.innerHTML = "";

  data.forEach(w => {
    const div = document.createElement("div");
    div.className = "row";
    div.innerHTML = `
      <span>${new Date(w.date).toLocaleDateString()}</span>
      <span>${w.reason || "-"}</span>
    `;
    list.appendChild(div);
  });
}

async function deleteDish(id) {
  if (!confirm("Удалить блюдо?")) return;

  await fetch(`/api/menu/${id}`, {
    method: "DELETE"
  });

  loadMenu();
}

async function logout() {
  await fetch("/api/logout", { method: "POST" });
  location.href = "/login";
}