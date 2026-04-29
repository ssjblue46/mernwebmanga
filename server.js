const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ IMPORTANT: REAL MONGO URI
const MONGO_URI = "mongodb+srv://raj:Raj%40101105@cluster0.3swrnlq.mongodb.net/pdfCollection?retryWrites=true&w=majority&authSource=admin";
const JWT_SECRET = "demo_secret_key";

// ✅ CORS FIX (prevents 401 due to header drop)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== AUTH MIDDLEWARE =====
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) return res.status(401).json({ message: "No token" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ===== DB =====
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ Mongo error:", err));

// ===== GRIDFS =====
const conn = mongoose.createConnection(MONGO_URI);
let bucket;

conn.once("open", () => {
  bucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "pdfs"
  });
  console.log("✅ GridFS ready");
});

// ===== MODELS =====
const PDF = mongoose.model("PDF", new mongoose.Schema({
  name: String,
  fileId: mongoose.Schema.Types.ObjectId,
  url: String,
  owner: mongoose.Schema.Types.ObjectId
}, { timestamps: true }));

const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
}), "users");

// ===== STORAGE =====
const storage = new GridFsStorage({
  url: MONGO_URI,
  file: (req, file) => ({
    filename: Date.now() + "-" + file.originalname,
    bucketName: "pdfs"
  })
});

const upload = multer({ storage });

// ===== LOGIN =====
app.post("/api/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return res.status(401).json({ message: "User not found" });

    const match = await bcrypt.compare(req.body.password, user.password);

    if (!match) return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: { role: user.role, email: user.email }
    });

  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

// ===== UPLOAD =====
app.post("/api/pdfs", authMiddleware, upload.array("pdfs"), async (req, res) => {
  try {
    if (!req.files.length) {
      return res.status(400).json({ message: "No files" });
    }

    const saved = [];

    for (const file of req.files) {
      const pdf = await PDF.create({
        name: file.originalname,
        fileId: file.id,
        url: `/api/file/${file.filename}`,
        owner: req.user.id
      });
      saved.push(pdf);
    }

    res.json(saved);

  } catch {
    res.status(500).json({ message: "Upload failed" });
  }
});

// ===== GET =====
app.get("/api/pdfs", async (req, res) => {
  try {
    const pdfs = await PDF.find().sort({ createdAt: -1 });
    res.json(pdfs);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
});

// ===== DELETE =====
app.delete("/api/pdfs/:id", authMiddleware, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "Not found" });

    if (
      req.user.role !== "admin" &&
      pdf.owner.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await bucket.delete(pdf.fileId);
    await PDF.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted" });

  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});

// ===== STREAM =====
app.get("/api/file/:filename", async (req, res) => {
  try {
    const file = await bucket.find({ filename: req.params.filename }).next();

    if (!file) return res.status(404).json({ message: "Not found" });

    res.set("Content-Type", "application/pdf");
    bucket.openDownloadStream(file._id).pipe(res);

  } catch {
    res.status(500).json({ message: "Streaming error" });
  }
});

app.listen(PORT, () => console.log("🚀 Server running"));
const path = require("path");

// Serve React build
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});
