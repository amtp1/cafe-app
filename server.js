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
  await Order.findByIdAndUpdate(req.params.id, {
    status: req.body.status
  });
  res.json({ ok: true });
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
