// server.js
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config({ debug: true });

const app = express();
const server = http.createServer(app);

// ========== SOCKET.IO SETUP ==========
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

// ========== MIDDLEWARE ==========
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========== ROUTES ==========
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const doctorRoutes = require('./routes/doctor');
const profileRoutes = require('./routes/profile');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/profile', profileRoutes);

// ========== MULTER SETUP ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// ========== MONGODB SETUP ==========
console.log("Loading MONGODB_URI from .env:", process.env.MONGODB_URI);
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Error: MONGODB_URI is not defined. Please check your .env file.");
  process.exit(1);
}

const client = new MongoClient(uri);
let db;

// server.js, after Mongo connect
async function connectToMongo() {
  try {
    await client.connect();
    db = client.db("Mind_Bridge");
    app.locals.db = db; // <--- make it accessible to routes
    await db.command({ ping: 1 });
    console.log("Pinged your deployment. Successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

// ========== HEALTH CHECK ==========
app.get("/health", (req, res) => res.json({ status: "Server is running" }));

// ========== IMAGE UPLOAD ==========
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });
  const imagePath = `/uploads/${req.file.filename}`;
  console.log("Uploaded image:", imagePath);
  res.status(200).json({ imagePath });
});

// ========== POSTS ==========
app.get("/api/posts", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  try {
    const posts = await db.collection("posts").find().toArray();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

app.post("/api/posts", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  const { caption, name, location, image } = req.body;
  if (!caption) return res.status(400).json({ error: "Caption is required" });

  const newPost = {
    caption,
    ...(name ? { name } : {}),
    ...(location ? { location } : {}),
    ...(image ? { image } : {}),
    likes: 0,
    comments: 0,
    saved: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    const result = await db.collection("posts").insertOne(newPost);
    res.status(201).json({ id: result.insertedId, ...newPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

app.patch("/api/posts/:id", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  const { id } = req.params;
  const { action } = req.body;

  if (!["like", "comment", "save"].includes(action)) return res.status(400).json({ error: "Invalid action" });

  const update = {};
  if (action === "like") update.likes = 1;
  if (action === "comment") update.comments = 1;
  if (action === "save") update.saved = 1;

  try {
    const result = await db.collection("posts").updateOne(
      { _id: new ObjectId(id) },
      { $inc: update }
    );
    if (result.modifiedCount === 0) return res.status(404).json({ error: "Post not found" });
    res.status(200).json({ message: "Post updated" });
  } catch (error) {
    console.error(`Error updating post (${action}):`, error);
    res.status(500).json({ error: "Failed to update post" });
  }
});

// ========== CHAT API ==========
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      { model: "meta-llama/llama-4-maverick:free", messages: [{ role: "user", content: message }] },
      {
        headers: {
          Authorization: "Bearer YOUR_API_KEY_HERE",
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "MindBridge Chat",
        },
      }
    );
    res.json({ content: response.data.choices[0].message.content });
  } catch (error) {
    console.error("Chat API error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// ========== SOCKET.IO REAL-TIME CHAT ==========
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Add your socket events here...
});

// ========== START SERVER ==========
async function startServer() {
  await connectToMongo();
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Socket.IO running on ws://localhost:${PORT}`);
  });
}

startServer();