const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const md5 = require("md5");
const session = require("express-session");
const path = require("path");

const app = express();

// Базовые настройки / конфигурация
const LOCAL_MONGODB_URL = "mongodb://127.0.0.1:27017/cafe-app";
const SERVER_MONGODB_URL =
  "mongodb+srv://magomedovabdul20012_db_user:I4S666echQDZKDc0@cluster0.fr20fm8.mongodb.net/cafeapp?appName=Cluster0";
const MONGODB_URL = process.env.MONGODB_URL || LOCAL_MONGODB_URL;

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.set("trust proxy", 1);

app.use(
  session({
    name: "pos.sid",
    secret: "pos-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 дней
      secure: false,
      httpOnly: true
    }
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/admin")));

mongoose.connect(SERVER_MONGODB_URL);

const User = require("./models/User");
const Menu = require("./models/Menu");
const Waiter = require("./models/Waiter");
const Order = require("./models/Order");
const Ingredient = require("./models/Ingredient");
const Stock = require("./models/Stock");
const Recipe = require("./models/Recipe");
const Purchase = require("./models/Purchase");
const WriteOff = require("./models/WriteOff");

app.get("/", (req, res) => {
  console.log(req.session.user);

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const hash = md5(password);

  const user = await User.findOne({ username, password: hash });
  if (!user) {
    return res.status(401).json({ error: "Неверный логин или пароль!" });
  }

  req.session.user = {
    id: user._id,
    username: user.username,
    nickname: user.nickname,
    role: user.role,
    isBlocked: user.isBlocked
  };

  req.session.save(() => {
    res.json({ ok: true, role: user.role, isBlocked: user.isBlocked });
  });
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(error => {
    if (error) {
      return res.status(500).json({ error: "Logout error" });
    }
    res.clearCookie("cafe.sid");
    res.json({ ok: true });
  });
});

app.get("/api/me", (req, res) => {
  res.json(req.session.user || null);
});

app.get("/menu", async (req, res) => {
  const menu = await Menu.find();
  res.json(menu);
});

app.get("/waiters", async (req, res) => {
  const waiters = await Waiter.find();
  res.json(waiters);
});

app.get("/admin", auth, adminOnly, (req, res) => {
  if (req.session.user.role !== "super_admin") {
    return res.sendStatus(403);
  }

  res.sendFile(path.join(__dirname, "public", "admin/admin.html"));
});

app.post("/api/order", async (req, res) => {
  if (!req.session.user) return res.sendStatus(401);

  const order = new Order({
    waiter: req.session.user.nickname,
    userId: req.session.user.id,
    table: req.body.table,
    items: req.body.items,
    total: req.body.total
  });

  await order.save();
  res.json({ success: true });
});

app.get("/api/orders", async (req, res) => {
  if (!req.session.user) return res.sendStatus(401);

  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

app.put("/api/orders/:id/status", async (req, res) => {
  const { status, paymentMethod } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.sendStatus(404);
  }

  const prevStatus = order.status;

  order.status = status;

  if (paymentMethod) {
    order.paymentMethod = paymentMethod;
  }

  if (status === "Оплачен" && !order.paidAt) {
    order.paidAt = new Date();
  }

  await order.save();

  // При переходе в "Готово" один раз списываем ингредиенты со склада
  if (prevStatus !== "Готово" && status === "Готово") {
    await applyInventoryForOrder(order);
  }

  res.json({ ok: true, order });
});

// Простой отчёт по выручке за сегодня (как в POS/iiko)
app.get("/api/reports/today", auth, async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const orders = await Order.find({
    createdAt: { $gte: start, $lte: end }
  });

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const count = orders.length;

  const byPaymentMethod = orders.reduce((acc, o) => {
    const key = o.paymentMethod || "Без оплаты";
    acc[key] = (acc[key] || 0) + Number(o.total || 0);
    return acc;
  }, {});

  res.json({
    totalRevenue,
    count,
    byPaymentMethod
  });
});

app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post("/api/users/:id/block", async (req, res) => {
  const { isBlocked } = req.body;
  await User.findByIdAndUpdate(req.params.id, { isBlocked });
  res.json({ ok: true });
});

app.get("/api/menu", auth, async (req, res) => {
  const menu = await Menu.find();
  res.json(menu);
});

app.post("/api/menu", auth, async (req, res) => {
  if (req.session.user.role !== "super_admin") {
    return res.sendStatus(403);
  }

  const menuItem = new Menu(req.body);
  await menuItem.save();
  res.json(menuItem);
});

app.delete("/api/menu/:id", async (req, res) => {
  await Menu.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ---------- ИНГРЕДИЕНТЫ / СКЛАД / ЗАКУПКИ / СПИСАНИЯ ----------

app.get("/api/ingredients", auth, adminOnly, async (req, res) => {
  const ingredients = await Ingredient.find().sort({ name: 1 });
  res.json(ingredients);
});

app.post("/api/ingredients", auth, adminOnly, async (req, res) => {
  const ingredient = new Ingredient(req.body);
  await ingredient.save();

  // создаём строку на складе с нулевым остатком, чтобы сразу видеть ингредиент
  await Stock.findOneAndUpdate(
    { ingredient: ingredient._id },
    { $setOnInsert: { quantity: 0 } },
    { upsert: true }
  );

  res.json(ingredient);
});

app.get("/api/stock", auth, adminOnly, async (req, res) => {
  const stock = await Stock.find().populate("ingredient").sort({ "ingredient.name": 1 });
  res.json(stock);
});

app.get("/api/recipes", auth, adminOnly, async (req, res) => {
  const recipes = await Recipe.find().populate("menu").populate("components.ingredient");
  res.json(recipes);
});

app.post("/api/recipes", auth, adminOnly, async (req, res) => {
  const recipe = new Recipe(req.body);
  await recipe.save();
  res.json(recipe);
});

app.get("/api/purchases", auth, adminOnly, async (req, res) => {
  const purchases = await Purchase.find().populate("items.ingredient").sort({ date: -1 });
  res.json(purchases);
});

app.post("/api/purchases", auth, adminOnly, async (req, res) => {
  const purchase = new Purchase(req.body);
  await purchase.save();

  // обновляем склад
  await Promise.all(
    purchase.items.map(async item => {
      await Stock.findOneAndUpdate(
        { ingredient: item.ingredient },
        { $inc: { quantity: item.qty } },
        { upsert: true }
      );
    })
  );

  res.json(purchase);
});

app.get("/api/writeoffs", auth, adminOnly, async (req, res) => {
  const writeoffs = await WriteOff.find().populate("items.ingredient").sort({ date: -1 });
  res.json(writeoffs);
});

app.post("/api/writeoffs", auth, adminOnly, async (req, res) => {
  const writeOff = new WriteOff(req.body);
  await writeOff.save();

  // уменьшаем остатки
  await Promise.all(
    writeOff.items.map(async item => {
      await Stock.findOneAndUpdate(
        { ingredient: item.ingredient },
        { $inc: { quantity: -item.qty } },
        { upsert: true }
      );
    })
  );

  res.json(writeOff);
});

app.post("/api/save_user", auth, async (req, res) => {
  if (req.session.user.role !== "super_admin") {
    return res.sendStatus(403);
  }

  const { username, password, nickname } = req.body;
  const hash = md5(password);

  const user = new User({ username, password: hash, nickname });
  await user.save();
  res.json(user);
});

app.get("/admin_menu", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin/menu.html"));
});

app.get("/admin_users", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin/users.html"));
});

app.get("/admin_stock", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin/stock.html"));
});

app.get("/admin_recipes", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin/recipes.html"));
});

app.get("/admin_purchases", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin/purchases.html"));
});

app.get("/admin_writeoffs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin/writeoffs.html"));
});

app.get("/admin_dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin/dashboard.html"));
});

function auth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }
  next();
}

function adminOnly(req, res, next) {
  if (!req.session.user || req.session.user.role !== "super_admin") {
    return res.status(403).json({ error: "Нет доступа" });
  }
  next();
}

function isLocked(req, res, next) {
  if (req.session.user && req.session.user.isBlocked) {
    return res.redirect("/login");
  }
  next();
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});

// ---------- ВСПОМОГАТЕЛЬНАЯ ЛОГИКА СКЛАДА ----------

async function applyInventoryForOrder(order) {
  // Находим позиции меню по имени
  const names = order.items.map(i => i.name);
  const menuItems = await Menu.find({ name: { $in: names } });
  const menuByName = menuItems.reduce((acc, m) => {
    acc[m.name] = m;
    return acc;
  }, {});

  const menuIds = menuItems.map(m => m._id);
  const recipes = await Recipe.find({ menu: { $in: menuIds } });
  const recipesByMenuId = recipes.reduce((acc, r) => {
    acc[r.menu.toString()] = r;
    return acc;
  }, {});

  const changes = {};

  order.items.forEach(item => {
    const menuDoc = menuByName[item.name];
    if (!menuDoc) return;
    const recipe = recipesByMenuId[menuDoc._id.toString()];
    if (!recipe) return;

    recipe.components.forEach(component => {
      const key = component.ingredient.toString();
      const totalQty = (changes[key] || 0) + component.qty * item.qty;
      changes[key] = totalQty;
    });
  });

  await Promise.all(
    Object.entries(changes).map(([ingredientId, qty]) =>
      Stock.findOneAndUpdate(
        { ingredient: ingredientId },
        { $inc: { quantity: -qty } },
        { upsert: true }
      )
    )
  );
}
