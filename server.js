const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* ✅ CREATE UPLOADS FOLDER AUTO */
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ✅ SERVE UPLOADS */
app.use("/uploads", express.static(uploadDir));

/* ✅ MongoDB */
mongoose.connect("mongodb+srv://raj:Raj%40101105@cluster0.3swrnlq.mongodb.net/?appName=Cluster0")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

/* ✅ Schemas */
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'creator', 'reader'], default: 'reader' },
  company: String,
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const pdfSchema = new mongoose.Schema({
  name: String,
  url: String,
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const PDF = mongoose.model("PDF", pdfSchema);

/* ✅ Multer */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

/* ✅ UPLOAD API */
app.post("/api/pdfs", upload.array("pdfs"), async (req, res) => {
  try {
    const files = req.files.map(file => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`, // IMPORTANT FIX
    }));

    await PDF.insertMany(files);

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

/* ✅ GET PDFs (FIXED - NO CRASH) */
app.get("/api/pdfs", (req, res) => {
  if (!fs.existsSync(uploadDir)) {
    return res.json([]); // IMPORTANT FIX
  }

  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.json([]);

    const pdfs = files
      .filter(f => f.endsWith(".pdf"))
      .map(file => ({
        name: file.replace(/^\d+-/, ""),
        url: `/uploads/${file}`,
      }));

    res.json(pdfs);
  });
});

/* ✅ DELETE */
app.delete("/api/pdfs/:filename", (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);

  fs.unlink(filePath, err => {
    if (err) return res.status(404).json({ message: "File not found" });
    res.json({ message: "Deleted" });
  });
});

/* ✅ FRONTEND BUILD */
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

/* ✅ START SERVER */
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
