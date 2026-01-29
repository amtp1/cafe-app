document.addEventListener("DOMContentLoaded", () => {
  loadMenu();
});

function openModal() {
  modalBg.style.display = "flex";
}

function closeModal() {
  modalBg.style.display = "none";
}

async function saveDish() {
  const name = dishName.value.trim();
  const price = dishPrice.value;

  if (!name || !price) return alert("Заполните поля");

  await fetch("/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price })
  });

  dishName.value = "";
  dishPrice.value = "";

  closeModal();
  loadMenu();
}

async function loadMenu() {
  const res = await fetch("/api/menu");
  const data = await res.json();

  menuList.innerHTML = "";

  data.forEach(d => {
    const div = document.createElement("div");
    div.className = "row";
    div.innerHTML = `
      <span>${d.name}</span>
      <span>${d.price} ₽</span>
    `;
    menuList.appendChild(div);
  });
}
loadMenu();

async function logout() {
  await fetch("/api/logout", { method: "POST" });
  location.href = "/login";
}