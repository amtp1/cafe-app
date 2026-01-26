const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const md5 = require("md5");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const JWT_SECRET = "Asdjaj-SDF23-@#@!asdasd-asd23-12j3kl23j";

mongoose.connect("mongodb+srv://magomedovabdul20012_db_user:I4S666echQDZKDc0@cluster0.fr20fm8.mongodb.net/cafe-app/?retryWrites=true&w=majority");

const User = require("./models/User");
const Menu = require("./models/Menu");
const Waiter = require("./models/Waiter");
const Order = require("./models/Order");

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "Нет пользователя" });

  const hash = md5(password);

  if (hash !== user.password)
    return res.status(400).json({ error: "Неверный пароль" });

  const token = jwt.sign(
    { id: user._id, username: user.username },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ token, username: user.username });
});

app.get("/menu", async (req, res) => {
  res.json(await Menu.find());
});

app.get("/waiters", async (req, res) => {
  res.json(await Waiter.find());
});

app.post("/order", async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  res.json({ success: true });
});

app.get("/orders", auth, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Нет доступа" });

  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Токен неверный" });
  }
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {console.log("Server running on port", PORT);});
