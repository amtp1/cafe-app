const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const md5 = require("md5");
const session = require("express-session");
const path = require("path");

const app = express();
const JWT_SECRET = "Asdjaj-SDF23-@#@!asdasd-asd23-12j3kl23j";
const SERVER_MONGODB_URL = "mongodb+srv://magomedovabdul20012_db_user:I4S666echQDZKDc0@cluster0.fr20fm8.mongodb.net/cafeapp?appName=Cluster0"
const LOCAL_MONGODB_URL = "mongodb://127.0.0.1:27017/cafe-app"

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.set("trust proxy", 1);

app.use(session({
  name: "pos.sid",
  secret: "pos-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 дней
    secure: false,
    httpOnly: true,
  }
}));

app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(SERVER_MONGODB_URL);

const User = require("./models/User");
const Menu = require("./models/Menu");
const Waiter = require("./models/Waiter");
const Order = require("./models/Order");

app.get("/", auth, (req, res) => {
  if (req.session.user.role === "super_admin") {
    return res.redirect("/admin");
  }

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const hash = md5(password);

  const user = await User.findOne({ username, password: hash });
  if (!user) {
    return res.status(401).json({ error: "Неверный логин или пароль" });
  }

  req.session.user = {
    id: user._id,
    username: user.username,
    role: user.role
  };

  req.session.save(() => {
    res.json({ ok: true , role: user.role});
  });
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
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
  res.json(await Menu.find());
});

app.get("/waiters", async (req, res) => {
  res.json(await Waiter.find());
});

app.get("/admin", auth, adminOnly, (req, res) => {
  if (req.session.user.role !== "super_admin") {
    return res.sendStatus(403);
  }

  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.post("/api/order", async (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  const order = new Order({
    waiter: req.session.user.username,
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

app.get("/api/menu", auth, async (req, res) => {
  const menu = await Menu.find();
  res.json(menu);
});

app.post("/api/menu", auth, async (req, res) => {
  if (req.session.user.role !== "super_admin")
    return res.sendStatus(403);

  const m = new Menu(req.body);
  await m.save();
  res.json(m);
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

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {console.log("Server running on port", PORT);});
