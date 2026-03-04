// server.js
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { authenticateJWT } = require("./middleware/authMiddleware");
const { piiFilterMessage } = require("./middleware/piiFilter");
const { crisisDetectionMiddleware } = require("./middleware/crisisDetection");
const { promptGuardrailMiddleware } = require("./middleware/promptGuardrail");
const { disclaimerMiddleware } = require("./middleware/disclaimerMiddleware");
const { encryptClassifiedFields } = require("./services/encryptionService");
const { moderateModelResponse } = require("./services/responseModerationService");
const { logSafetyEvent } = require("./services/safetyEventLogger");

const app = express();
const server = http.createServer(app);
app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";
const clientOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}

// ========== SOCKET.IO SETUP ==========
const io = new Server(server, {
  cors: {
    origin: clientOrigins.length > 0 ? clientOrigins : true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

// ========== MIDDLEWARE ==========
app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: clientOrigins.length > 0 ? clientOrigins : true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  if (!isProduction) return next();
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (req.secure || forwardedProto === "https") return next();
  return res.status(403).json({ error: "HTTPS required" });
});

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
app.post(
  "/api/chat",
  authenticateJWT(),
  disclaimerMiddleware,
  piiFilterMessage,
  crisisDetectionMiddleware,
  promptGuardrailMiddleware,
  async (req, res, next) => {
  const message = req.piiSafeMessage || "";
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
  if (!ollamaBaseUrl) {
    return res.status(500).json({ error: "AI backend is not configured" });
  }
  try {
    const response = await axios.post(
      `${ollamaBaseUrl}/api/generate`,
      {
        model: "llama2:7b",
        prompt: message,
        stream: false
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const moderated = moderateModelResponse(response.data.response);
    if (moderated.moderated) {
      logSafetyEvent({
        eventType: "response_moderated",
        userRole: req.user?.role,
        metadata: { severity: "medium", reason: moderated.reason },
      });
    }
    res.json({ content: moderated.content });
  } catch (error) {
    next(error);
  }
});

app.post("/api/save-conversation", authenticateJWT(), async (req, res, next) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length <= 1) {
    return res.status(200).json({ success: false, message: "No conversation to save" });
  }

  try {
    const messagesDb = client.db("Messages");
    const collection = messagesDb.collection("conversations");
    const encryptedConversation = encryptClassifiedFields({ messages });
    const conversation = {
      id: Date.now(),
      userId: req.user._id,
      ...encryptedConversation,
      createdAt: new Date(),
    };

    await collection.insertOne(conversation);
    return res.status(200).json({ success: true, conversationId: conversation.id });
  } catch (error) {
    return next(error);
  }
});

// ========== SOCKET.IO REAL-TIME CHAT ==========
io.on("connection", (socket) => {
  // Add your socket events here...
});

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode >= 500 ? "Internal server error" : err.message;

  if (!isProduction) {
    console.error("[error]", {
      path: req.path,
      method: req.method,
      statusCode,
      message: err.message,
    });
  } else {
    console.error("[error]", {
      path: req.path,
      method: req.method,
      statusCode,
    });
  }

  res.status(statusCode).json({ error: message });
});

// ========== START SERVER ==========
async function startServer() {
  await connectToMongo();
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`[startup] server listening on port ${PORT}`);
  });
}

startServer();
