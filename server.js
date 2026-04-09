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

// ===== YOUR MONGO URI (FIXED DB NAME) =====
const MONGO_URI =
  "mongodb+srv://raj:Raj%40101105@cluster0.3swrnlq.mongodb.net/pdfCollection?retryWrites=true&w=majority&authSource=admin";

const JWT_SECRET = "demo_secret_key";

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ===== MAIN DB CONNECTION =====
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected to pdfCollection"))
  .catch(err => console.error("❌ Mongo Error:", err));

// ===== GRIDFS CONNECTION =====
const conn = mongoose.createConnection(MONGO_URI);

let bucket;

conn.once("open", () => {
  bucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "pdfs",
  });
  console.log("✅ GridFS ready");
});

// ===== PDF MODEL =====
const pdfSchema = new mongoose.Schema({
  name: String,
  fileId: mongoose.Schema.Types.ObjectId,
  url: String,
}, { timestamps: true });

const PDF = mongoose.model("PDF", pdfSchema);

// ===== USER MODEL (USES 'users' COLLECTION) =====
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  company: String,
  role: { type: String, enum: ["admin", "creator", "reader"], default: "reader" },
}, { timestamps: true });

// FORCE collection name = users
const User = mongoose.model("User", userSchema, "users");

// ===== GRIDFS STORAGE =====
const storage = new GridFsStorage({
  url: MONGO_URI,
  options: { useUnifiedTopology: true, useNewUrlParser: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {

      if (file.mimetype !== "application/pdf") {
        return reject(new Error("Only PDF allowed"));
      }

      const fileInfo = {
        filename: Date.now() + "-" + file.originalname,
        bucketName: "pdfs",
      };

      resolve(fileInfo);
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
      role: "creator" // ✅ FORCE ROLE HERE

    });

    res.json({ success: true, message: "Account created" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

// ===== PDF ROUTES =====

// UPLOAD
app.post("/api/pdfs", upload.array("pdfs"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const savedFiles = [];

    for (const file of req.files) {
      const newPdf = new PDF({
        name: file.originalname,
        fileId: file.id,
        url: `/api/file/${file.filename}`,
      });

      await newPdf.save();
      savedFiles.push(newPdf);
    }

    res.status(201).json(savedFiles);

  } catch (err) {
    res.status(500).json({ message: "Upload failed" });
  }
});

// GET ALL
app.get("/api/pdfs", async (req, res) => {
  try {
    const pdfs = await PDF.find().sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
});

// STREAM
app.get("/api/file/:filename", async (req, res) => {
  try {
    if (!bucket) return res.status(503).json({ message: "Server not ready" });

    const file = await bucket.find({ filename: req.params.filename }).next();

    if (!file) return res.status(404).json({ message: "File not found" });

    res.set("Content-Type", "application/pdf");

    const stream = bucket.openDownloadStream(file._id);
    stream.pipe(res);

  } catch (err) {
    res.status(500).json({ message: "Streaming error" });
  }
});

// DELETE
app.delete("/api/pdfs/:id", async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) return res.status(404).json({ message: "Not found" });

    if (bucket) {
      await bucket.delete(pdf.fileId);
    }

    await PDF.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted" });

  } catch (err) {
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
