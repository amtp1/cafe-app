const modalDish = document.getElementById("modalDish");
const modalUser = document.getElementById("modalUser");
const modalEditUser = document.getElementById("modalEditUser");
const modalIngredient = document.getElementById("modalIngredient");
const modalRecipe = document.getElementById("modalRecipe");
const modalPurchase = document.getElementById("modalPurchase");
const modalWriteoff = document.getElementById("modalWriteoff");

const dishName = document.getElementById("dishName");
const dishPrice = document.getElementById("dishPrice");
const userNickname = document.getElementById("userNickname");
const userName = document.getElementById("userName");
const userPassword = document.getElementById("userPassword");
const editUserId = document.getElementById("editUserId");
const editUserNickname = document.getElementById("editUserNickname");

const ingredientName = document.getElementById("ingredientName");
const ingredientUnit = document.getElementById("ingredientUnit");
const recipeMenuSelect = document.getElementById("recipeMenuSelect");
const recipeComponentsList = document.getElementById("recipeComponentsList");
const purchaseSupplier = document.getElementById("purchaseSupplier");
const purchaseItemsList = document.getElementById("purchaseItemsList");
const writeoffReason = document.getElementById("writeoffReason");
const writeoffItemsList = document.getElementById("writeoffItemsList");

const modalCategory = document.getElementById("modalCategory");
const modalHall = document.getElementById("modalHall");
const modalTable = document.getElementById("modalTable");
const modalSupplier = document.getElementById("modalSupplier");
const modalShift = document.getElementById("modalShift");

let cachedIngredients = [];

async function ensureIngredientsLoaded() {
  if (cachedIngredients.length) return;
  const res = await fetch("/api/ingredients");
  cachedIngredients = await res.json();
}

document.addEventListener("DOMContentLoaded", () => {
  loadSidebarUser();
  initNav();

  // Авто-загрузка активной страницы при старте
  const activeLink = document.querySelector(".nav-link.active");
  if (activeLink) {
    activeLink.click();
  }
});

async function loadSidebarUser() {
  const el = document.getElementById("sidebarUser");
  if (!el) return;
  try {
    const res = await fetch("/api/me");
    const user = await res.json();
    el.textContent = user ? `Вы: ${user.nickname || user.username}` : "";
  } catch (e) {
    el.textContent = "";
  }
}

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

  if (page === "categories") {
    loadCategories();
  }
  if (page === "halls") {
    loadHalls();
  }
  if (page === "tables") {
    loadTables();
  }
  if (page === "suppliers") {
    loadSuppliers();
  }
  if (page === "shifts") {
    loadShifts();
  }
  if (page === "settings") {
    loadSettings();
  }
}

async function loadSettings() {
  const input = document.getElementById("cancelCodeInput");
  if (!input) return;
  try {
    const res = await fetch("/api/config/cancel-code");
    const data = await res.json();
    input.value = (data && data.value) ? data.value : "";
  } catch (e) {
    input.value = "";
  }
}

async function saveCancelCode() {
  const input = document.getElementById("cancelCodeInput");
  if (!input) return;
  const value = input.value.trim();
  await fetch("/api/config/cancel-code", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value })
  });
  alert("Сохранено");
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

function openEditUserModal(id, nickname) {
  editUserId.value = id;
  editUserNickname.value = nickname || "";
  modalEditUser.style.display = "flex";
}

function closeEditUserModal() {
  modalEditUser.style.display = "none";
}

function openCategoryModal() {
  document.getElementById("categoryName").value = "";
  document.getElementById("categorySortOrder").value = "0";
  modalCategory.style.display = "flex";
}
function closeCategoryModal() {
  modalCategory.style.display = "none";
}

function openHallModal() {
  document.getElementById("hallName").value = "";
  modalHall.style.display = "flex";
}
function closeHallModal() {
  modalHall.style.display = "none";
}

async function openTableModal() {
  const res = await fetch("/api/halls");
  const halls = await res.json();
  const sel = document.getElementById("tableHallSelect");
  sel.innerHTML = '<option value="">— Без зала —</option>';
  halls.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h._id;
    opt.textContent = h.name;
    sel.appendChild(opt);
  });
  document.getElementById("tableNumber").value = "";
  document.getElementById("tableSeats").value = "4";
  modalTable.style.display = "flex";
}
function closeTableModal() {
  modalTable.style.display = "none";
}

function openSupplierModal() {
  document.getElementById("supplierName").value = "";
  document.getElementById("supplierContact").value = "";
  modalSupplier.style.display = "flex";
}
function closeSupplierModal() {
  modalSupplier.style.display = "none";
}

function openShiftModal() {
  const d = new Date();
  document.getElementById("shiftDate").value = d.toISOString().slice(0, 10);
  modalShift.style.display = "flex";
}
function closeShiftModal() {
  modalShift.style.display = "none";
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
  const unit = ingredientUnit.value || "шт";

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
      <span class="row-actions">
        <button class="action-btn action-edit" data-action="edit">Изменить</button>
        <button class="action-btn ${user.isBlocked ? "action-unlock" : "action-lock"}" data-action="block">
          ${user.isBlocked ? "Разблокировать" : "Заблокировать"}
        </button>
      </span>
    `;

    row.querySelector("[data-action=edit]").addEventListener("click", () => {
      openEditUserModal(user._id, user.nickname);
    });
    row.querySelector("[data-action=block]").addEventListener("click", () => {
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

async function saveEditUser() {
  const id = editUserId.value;
  const nickname = editUserNickname.value.trim();

  if (!id || !nickname) {
    alert("Введите имя");
    return;
  }

  await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname })
  });

  closeEditUserModal();
  loadUsers();
}

async function saveCategory() {
  const name = document.getElementById("categoryName").value.trim();
  const sortOrder = Number(document.getElementById("categorySortOrder").value) || 0;
  if (!name) {
    alert("Введите название");
    return;
  }
  await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, sortOrder })
  });
  closeCategoryModal();
  loadCategories();
}

async function saveHall() {
  const name = document.getElementById("hallName").value.trim();
  if (!name) {
    alert("Введите название зала");
    return;
  }
  await fetch("/api/halls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  closeHallModal();
  loadHalls();
}

async function saveTable() {
  const number = Number(document.getElementById("tableNumber").value);
  const hall = document.getElementById("tableHallSelect").value || undefined;
  const seats = Number(document.getElementById("tableSeats").value) || 4;
  if (!number || number < 1) {
    alert("Введите номер стола");
    return;
  }
  await fetch("/api/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number, hall: hall || null, seats })
  });
  closeTableModal();
  loadTables();
}

async function saveSupplier() {
  const name = document.getElementById("supplierName").value.trim();
  const contact = document.getElementById("supplierContact").value.trim();
  if (!name) {
    alert("Введите название поставщика");
    return;
  }
  await fetch("/api/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, contact })
  });
  closeSupplierModal();
  loadSuppliers();
}

async function saveShift() {
  const date = document.getElementById("shiftDate").value;
  if (!date) {
    alert("Укажите дату");
    return;
  }
  await fetch("/api/shifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date })
  });
  closeShiftModal();
  loadShifts();
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
      <span>${p.createdBy?.nickname || p.createdBy?.username || "—"}</span>
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
      <span>${w.createdBy?.nickname || w.createdBy?.username || "—"}</span>
    `;
    list.appendChild(div);
  });
}

async function loadCategories() {
  const list = document.getElementById("categoryList");
  if (!list) return;
  const res = await fetch("/api/categories");
  const data = await res.json();
  list.innerHTML = "";
  data.forEach(c => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span>${c.name}</span>
      <span>${c.sortOrder ?? 0}</span>
      <span>
        <button class="action-btn action-delete">Удалить</button>
      </span>
    `;
    row.querySelector("button").onclick = () => deleteCategory(c._id);
    list.appendChild(row);
  });
}

async function loadHalls() {
  const list = document.getElementById("hallList");
  if (!list) return;
  const res = await fetch("/api/halls");
  const data = await res.json();
  list.innerHTML = "";
  data.forEach(h => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span>${h.name}</span>
      <span>
        <button class="action-btn action-delete">Удалить</button>
      </span>
    `;
    row.querySelector("button").onclick = () => deleteHall(h._id);
    list.appendChild(row);
  });
}

async function loadTables() {
  const list = document.getElementById("tableList");
  if (!list) return;
  const res = await fetch("/api/tables");
  const data = await res.json();
  list.innerHTML = "";
  data.forEach(t => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span>${t.number}</span>
      <span>${t.hall?.name || "—"}</span>
      <span>${t.seats ?? "—"}</span>
      <span>
        <button class="action-btn action-delete">Удалить</button>
      </span>
    `;
    row.querySelector("button").onclick = () => deleteTable(t._id);
    list.appendChild(row);
  });
}

async function loadSuppliers() {
  const list = document.getElementById("supplierList");
  if (!list) return;
  const res = await fetch("/api/suppliers");
  const data = await res.json();
  list.innerHTML = "";
  data.forEach(s => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span>${s.name}</span>
      <span>${s.contact || "-"}</span>
      <span>
        <button class="action-btn action-delete">Удалить</button>
      </span>
    `;
    row.querySelector("button").onclick = () => deleteSupplier(s._id);
    list.appendChild(row);
  });
}

async function loadShifts() {
  const list = document.getElementById("shiftList");
  if (!list) return;
  const res = await fetch("/api/shifts");
  const data = await res.json();
  list.innerHTML = "";
  data.forEach(s => {
    const row = document.createElement("div");
    row.className = "row";
    const openedBy = s.openedBy?.nickname || s.openedBy?.username || "—";
    const closedBy = s.closedBy?.nickname || s.closedBy?.username || "—";
    const closeBtn = !s.closedAt
      ? '<button type="button" class="action-btn action-edit">Закрыть смену</button>'
      : "";
    row.innerHTML = `
      <span>${new Date(s.date).toLocaleDateString()}</span>
      <span>${s.openedAt ? new Date(s.openedAt).toLocaleTimeString() : "—"}</span>
      <span>${s.closedAt ? new Date(s.closedAt).toLocaleTimeString() : "—"}</span>
      <span>${openedBy}</span>
      <span>${closedBy}</span>
      <span>${closeBtn}</span>
    `;
    const btn = row.querySelector("button");
    if (btn) btn.onclick = () => closeShift(s._id);
    list.appendChild(row);
  });
}

async function closeShift(id) {
  await fetch(`/api/shifts/${id}/close`, { method: "PUT" });
  loadShifts();
}

async function deleteCategory(id) {
  if (!confirm("Удалить категорию?")) return;
  await fetch(`/api/categories/${id}`, { method: "DELETE" });
  loadCategories();
}
async function deleteHall(id) {
  if (!confirm("Удалить зал?")) return;
  await fetch(`/api/halls/${id}`, { method: "DELETE" });
  loadHalls();
}
async function deleteTable(id) {
  if (!confirm("Удалить стол?")) return;
  await fetch(`/api/tables/${id}`, { method: "DELETE" });
  loadTables();
}
async function deleteSupplier(id) {
  if (!confirm("Удалить поставщика?")) return;
  await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
  loadSuppliers();
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