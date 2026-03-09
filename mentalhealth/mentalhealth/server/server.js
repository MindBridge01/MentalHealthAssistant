const express = require("express");
const { ObjectId } = require("mongodb");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const { loadEnvironment, getCorsOrigins, isProduction } = require("./config/environment");
const { getMongoClient } = require("./config/database");
const { createDefaultAdmin } = require("./utils/createDefaultAdmin");
const { errorHandler } = require("./middleware/errorHandler");

loadEnvironment();

const app = express();
const server = http.createServer(app);
app.set("trust proxy", 1);

const clientOrigins = getCorsOrigins();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}

const io = new Server(server, {
  cors: {
    origin: clientOrigins.length > 0 ? clientOrigins : true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: clientOrigins.length > 0 ? clientOrigins : true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  if (!isProduction()) return next();
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (req.secure || forwardedProto === "https") return next();
  return res.status(403).json({ error: "HTTPS required" });
});

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const profileRoutes = require("./routes/profileRoutes");
const chatRoutes = require("./routes/chatRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", chatRoutes);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

let db;

async function connectToMongo() {
  try {
    const mongoClient = await getMongoClient();
    db = mongoClient.db("Mind_Bridge");
    app.locals.db = db;
    app.locals.mongoClient = mongoClient;
    await db.command({ ping: 1 });
    console.log("Pinged your deployment. Successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

app.get("/health", (_req, res) => res.json({ status: "Server is running" }));

app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });
  const imagePath = `/uploads/${req.file.filename}`;
  return res.status(200).json({ imagePath });
});

app.get("/api/posts", async (_req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  try {
    const posts = await db.collection("posts").find().toArray();
    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ error: "Failed to fetch posts" });
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
    return res.status(201).json({ id: result.insertedId, ...newPost });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ error: "Failed to create post" });
  }
});

app.patch("/api/posts/:id", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  const { id } = req.params;
  const { action } = req.body;

  if (!["like", "comment", "save"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  const update = {};
  if (action === "like") update.likes = 1;
  if (action === "comment") update.comments = 1;
  if (action === "save") update.saved = 1;

  try {
    const result = await db
      .collection("posts")
      .updateOne({ _id: new ObjectId(id) }, { $inc: update });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json({ message: "Post updated" });
  } catch (error) {
    console.error(`Error updating post (${action}):`, error);
    return res.status(500).json({ error: "Failed to update post" });
  }
});

io.on("connection", (_socket) => {
  // socket handlers
});

app.use(errorHandler);

async function startServer() {
  await connectToMongo();
  await createDefaultAdmin(db);
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`[startup] server listening on port ${PORT}`);
  });
}

startServer();
