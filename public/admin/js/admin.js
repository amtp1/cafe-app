const modalDish = document.getElementById("modalDish");
const modalUser = document.getElementById("modalUser");
const dishName = document.getElementById("dishName");
const dishPrice = document.getElementById("dishPrice");
const userNickname = document.getElementById("userNickname");
const userName = document.getElementById("userName");
const userPassword = document.getElementById("userPassword");

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
  if (page === "menu") {
    loadMenu();
  }

  if (page === "users") {
    loadUsers();
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