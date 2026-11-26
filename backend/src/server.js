import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const app = express();
const port = Number(process.env.PORT) || 3000;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origin not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "16kb" }));

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  category: { type: String, enum: ["f1", "gta", "random"], default: "random" },
  platform: { type: String, enum: ["youtube", "twitch"], default: "youtube" },
  videoUrl: { type: String, required: true, trim: true, maxlength: 4000 },
  thumbnailUrl: { type: String, trim: true, maxlength: 4000, default: "" },
  heartCount: { type: Number, default: 0, min: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true });

const heartSchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
  visitorId: { type: String, required: true, trim: true, maxlength: 80 },
}, { timestamps: true });
heartSchema.index({ video: 1, visitorId: 1 }, { unique: true });

const commentSchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
  text: { type: String, required: true, trim: true, maxlength: 120 },
  visitorId: { type: String, required: true, trim: true, maxlength: 80 },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);
const Heart = mongoose.models.Heart || mongoose.model("Heart", heartSchema);
const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

function mongoReady() {
  return mongoose.connection.readyState === 1;
}

function serialize(document) {
  if (!document) return null;
  const value = typeof document.toObject === "function" ? document.toObject() : document;
  return { ...value, id: String(value._id || value.id) };
}

function requireAdmin(request, response, next) {
  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || !process.env.JWT_SECRET) return response.status(401).json({ error: "No autorizado" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") throw new Error("Invalid role");
    next();
  } catch {
    response.status(401).json({ error: "Sesión inválida" });
  }
}

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "steelfire-api",
    mongodb: mongoReady() ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/auth/login", async (request, response) => {
  const email = String(request.body.email || "").trim().toLowerCase();
  const password = String(request.body.password || "");
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || "";

  if (!adminEmail || !passwordHash || !process.env.JWT_SECRET) {
    return response.status(503).json({ error: "El acceso privado aún no está configurado" });
  }
  if (email !== adminEmail) return response.status(401).json({ error: "Credenciales incorrectas" });

  const valid = await bcrypt.compare(password, passwordHash);
  if (!valid) return response.status(401).json({ error: "Credenciales incorrectas" });

  const token = jwt.sign({ role: "admin", email }, process.env.JWT_SECRET, { expiresIn: "8h" });
  response.json({ token });
});

app.get("/api/videos", async (_request, response, next) => {
  if (!mongoReady()) return response.status(503).json({ error: "MongoDB no está conectado" });
  try {
    const videos = await Video.find({ published: true }).sort({ createdAt: -1 });
    response.json(videos.map(serialize));
  } catch (error) {
    next(error);
  }
});

app.post("/api/videos", requireAdmin, async (request, response, next) => {
  if (!mongoReady()) return response.status(503).json({ error: "MongoDB no está conectado" });
  try {
    const video = await Video.create({
      title: request.body.title,
      description: request.body.description,
      category: request.body.category,
      platform: request.body.platform,
      videoUrl: request.body.videoUrl,
      thumbnailUrl: request.body.thumbnailUrl,
    });
    response.status(201).json(serialize(video));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/videos/:id", requireAdmin, async (request, response, next) => {
  if (!mongoReady()) return response.status(503).json({ error: "MongoDB no está conectado" });
  try {
    const allowed = ["title", "description", "category", "platform", "videoUrl", "thumbnailUrl", "published"];
    const updates = Object.fromEntries(allowed.filter((key) => key in request.body).map((key) => [key, request.body[key]]));
    const video = await Video.findByIdAndUpdate(request.params.id, updates, { new: true, runValidators: true });
    if (!video) return response.status(404).json({ error: "Video no encontrado" });
    response.json(serialize(video));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/videos/:id", requireAdmin, async (request, response, next) => {
  if (!mongoReady()) return response.status(503).json({ error: "MongoDB no está conectado" });
  try {
    const video = await Video.findByIdAndDelete(request.params.id);
    if (!video) return response.status(404).json({ error: "Video no encontrado" });
    await Promise.all([Heart.deleteMany({ video: video._id }), Comment.deleteMany({ video: video._id })]);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post("/api/videos/:id/heart", async (request, response, next) => {
  if (!mongoReady()) return response.status(503).json({ error: "MongoDB no está conectado" });
  const visitorId = String(request.body.visitorId || "").trim();
  if (!visitorId) return response.status(400).json({ error: "Identificador de visitante requerido" });
  try {
    const video = await Video.findById(request.params.id);
    if (!video) return response.status(404).json({ error: "Video no encontrado" });
    await Heart.updateOne(
      { video: video._id, visitorId },
      { $setOnInsert: { video: video._id, visitorId } },
      { upsert: true },
    );
    const heartCount = await Heart.countDocuments({ video: video._id });
    await Video.findByIdAndUpdate(video._id, { heartCount });
    response.json({ heartCount });
  } catch (error) {
    if (error.code === 11000) {
      const heartCount = await Heart.countDocuments({ video: request.params.id });
      return response.json({ heartCount });
    }
    next(error);
  }
});

app.post("/api/videos/:id/comments", async (request, response, next) => {
  if (!mongoReady()) return response.status(503).json({ error: "MongoDB no está conectado" });
  const text = String(request.body.text || "").trim();
  const visitorId = String(request.body.visitorId || "").trim();
  if (!text) return response.status(400).json({ error: "El comentario no puede estar vacío" });
  if (text.length > 120) return response.status(400).json({ error: "Máximo 120 caracteres" });
  if (!visitorId) return response.status(400).json({ error: "Identificador de visitante requerido" });
  try {
    const video = await Video.findById(request.params.id);
    if (!video) return response.status(404).json({ error: "Video no encontrado" });
    const comment = await Comment.create({ video: video._id, text, visitorId, status: "pending" });
    response.status(201).json({ id: String(comment._id), status: comment.status });
  } catch (error) {
    next(error);
  }
});

app.get("/api/videos/:id/comments", async (request, response, next) => {
  if (!mongoReady()) return response.json([]);
  try {
    const comments = await Comment.find({ video: request.params.id, status: "approved" })
      .sort({ createdAt: -1 })
      .limit(20);
    response.json(comments.map(serialize));
  } catch (error) {
    next(error);
  }
});

app.get("/api/comments", requireAdmin, async (_request, response, next) => {
  if (!mongoReady()) return response.status(503).json({ error: "MongoDB no está conectado" });
  try {
    const comments = await Comment.find({ status: "pending" }).populate("video", "title").sort({ createdAt: -1 });
    response.json(comments.map(serialize));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/comments/:id", requireAdmin, async (request, response, next) => {
  if (!mongoReady()) return response.status(503).json({ error: "MongoDB no está conectado" });
  if (!["approved", "rejected"].includes(request.body.status)) return response.status(400).json({ error: "Estado inválido" });
  try {
    const comment = await Comment.findByIdAndUpdate(request.params.id, { status: request.body.status }, { new: true });
    if (!comment) return response.status(404).json({ error: "Comentario no encontrado" });
    response.json(serialize(comment));
  } catch (error) {
    next(error);
  }
});

let twitchCache = { live: false, expiresAt: 0 };
app.get("/api/twitch/status", async (_request, response) => {
  if (Date.now() < twitchCache.expiresAt) return response.json({ live: twitchCache.live });
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const login = process.env.TWITCH_USER_LOGIN;
  if (!clientId || !clientSecret || !login) return response.json({ live: false, configured: false });
  try {
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
    });
    if (!tokenResponse.ok) throw new Error("Twitch token error");
    const token = await tokenResponse.json();
    const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(login)}`, {
      headers: { "Client-ID": clientId, Authorization: `Bearer ${token.access_token}` },
    });
    if (!streamResponse.ok) throw new Error("Twitch stream error");
    const streamData = await streamResponse.json();
    const live = streamData.data.length > 0;
    twitchCache = { live, expiresAt: Date.now() + 60_000 };
    response.json({ live, configured: true });
  } catch {
    twitchCache = { live: false, expiresAt: Date.now() + 60_000 };
    response.json({ live: false, configured: true });
  }
});

app.use((error, _request, response, _next) => {
  const status = error.name === "ValidationError" ? 400 : 500;
  response.status(status).json({ error: status === 400 ? error.message : "Error interno del servidor" });
});

app.use((_request, response) => {
  response.status(404).json({ error: "Route not found" });
});

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected");
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
    }
  }
  app.listen(port, () => console.log(`SteelFire API listening on port ${port}`));
}

start();
