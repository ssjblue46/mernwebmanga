const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

const MONGO_URI =
  "mongodb+srv://raj:Raj%40101105@cluster0.3swrnlq.mongodb.net/pdfCollection?retryWrites=true&w=majority&authSource=admin";

const JWT_SECRET = "demo_secret_key";

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ===== AUTH MIDDLEWARE =====
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ===== MAIN DB CONNECTION =====
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// ===== GRIDFS =====
const conn = mongoose.createConnection(MONGO_URI);

let bucket;

conn.once("open", () => {
  bucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "pdfs",
  });
  console.log("✅ GridFS ready");
});

// ===== MODELS =====
const pdfSchema = new mongoose.Schema({
  name: String,
  fileId: mongoose.Schema.Types.ObjectId,
  url: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // ✅ OWNER
}, { timestamps: true });

const PDF = mongoose.model("PDF", pdfSchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  company: String,
  role: { type: String, enum: ["admin", "creator", "reader"], default: "reader" },
}, { timestamps: true });

const User = mongoose.model("User", userSchema, "users");

// ===== GRIDFS STORAGE =====
const storage = new GridFsStorage({
  url: MONGO_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      if (file.mimetype !== "application/pdf") {
        return reject(new Error("Only PDF allowed"));
      }

      resolve({
        filename: Date.now() + "-" + file.originalname,
        bucketName: "pdfs",
      });
    });
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ===== AUTH ROUTES =====

// SIGNUP
app.post("/api/signup", async (req, res) => {
  const { name, email, password, company } = req.body;

  if (!name || !email || !password || !company) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      company,
      role: "creator"
    });

    res.json({ success: true });

  } catch {
    res.status(500).json({ message: "Signup failed" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        name: user.name,
        role: user.role
      }
    });

  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

// ===== PDF ROUTES =====

// UPLOAD (protected)
app.post("/api/pdfs", authMiddleware, upload.array("pdfs"), async (req, res) => {
  try {
    const savedFiles = [];

    for (const file of req.files) {
      const newPdf = new PDF({
        name: file.originalname,
        fileId: file.id,
        url: `/api/file/${file.filename}`,
        owner: req.user.id // ✅ OWNER SAVED
      });

      await newPdf.save();
      savedFiles.push(newPdf);
    }

    res.status(201).json(savedFiles);

  } catch {
    res.status(500).json({ message: "Upload failed" });
  }
});

// GET ALL
app.get("/api/pdfs", async (req, res) => {
  const pdfs = await PDF.find().sort({ createdAt: -1 });
  res.json(pdfs);
});

// STREAM
app.get("/api/file/:filename", async (req, res) => {
  const file = await bucket.find({ filename: req.params.filename }).next();
  if (!file) return res.status(404).json({ message: "Not found" });

  res.set("Content-Type", "application/pdf");
  bucket.openDownloadStream(file._id).pipe(res);
});

// DELETE (protected + role check)
app.delete("/api/pdfs/:id", authMiddleware, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "Not found" });

    const user = await User.findById(req.user.id);

    // ❌ BLOCK if not owner AND not admin
    if (
      user.role !== "admin" &&
      pdf.owner.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (bucket) {
      await bucket.delete(pdf.fileId);
    }

    await PDF.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted" });

  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});

// ===== FRONTEND =====
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
