const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// ===== Schemas =====
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);

// ===== Default user =====
User.findOne().then(u => {
  if (!u) {
    User.create({ username: "shikha", password: "12345" });
    console.log("👤 Default user: shikha / 12345");
  }
});

// ===== Routes =====

// Login API
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    // Save logged-in state in a cookie
    res.cookie("loggedIn", true, { httpOnly: true });
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});

// Logout API
app.post("/logout", (req, res) => {
  res.clearCookie("loggedIn");
  res.json({ success: true });
});

// Middleware to check login
function checkLogin(req, res, next) {
  if (req.cookies.loggedIn) next();
  else res.status(401).json({ success: false, message: "Unauthorized" });
}

// Serve static files
app.use(express.static(__dirname));

// Homepage
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// Login page
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "login.html")));

// Blog page
app.get("/blog", (req, res) => res.sendFile(path.join(__dirname, "blog.html")));

// Get all posts (everyone can view)
app.get("/posts", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

// Create post (only logged-in users)
app.post("/posts", checkLogin, async (req, res) => {
  const post = await Post.create(req.body);
  res.json({ success: true, post });
});

// Catch-all for HTML pages
app.get("/:page", (req, res) => {
  const page = req.params.page;
  res.sendFile(path.join(__dirname, `${page}.html`));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
