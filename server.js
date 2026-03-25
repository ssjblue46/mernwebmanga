const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage"); // ✅ NEW
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;
const mongoURI = "mongodb+srv://raj:Raj%40101105@cluster0.3swrnlq.mongodb.net/pdfCollection?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json());

/* ✅ MongoDB Connection */
const conn = mongoose.createConnection(mongoURI);

// Initialize GridFS Bucket for streaming
let bucket;
conn.once("open", () => {
  bucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "pdfs",
  });
  console.log("MongoDB & GridFS Connected");
});

/* ✅ Schemas */
// Note: We use the main mongoose instance for models, but conn for GridFS
mongoose.connect(mongoURI);

const pdfSchema = new mongoose.Schema({
  name: String,
  fileId: mongoose.Schema.Types.ObjectId, // Link to GridFS file
  url: String,
}, { timestamps: true });

const PDF = mongoose.model("PDF", pdfSchema);

/* ✅ GridFS Storage Engine (Replaces DiskStorage) */
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      filename: Date.now() + "-" + file.originalname,
      bucketName: "pdfs", // Collection name in Atlas
    };
  },
});
const upload = multer({ storage });

/* ✅ UPLOAD API (Saves to Atlas) */
app.post("/api/pdfs", upload.array("pdfs"), async (req, res) => {
  try {
    const files = req.files.map((file) => ({
      name: file.originalname,
      fileId: file.id,
      url: `/api/file/${file.filename}`, // Virtual URL
    }));

    await PDF.insertMany(files);
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

/* ✅ STREAM API (Fetches from Atlas) */
app.get("/api/file/:filename", async (req, res) => {
  try {
    const file = await bucket.find({ filename: req.params.filename }).next();
    if (!file) return res.status(404).json({ message: "File not found" });

    res.set("Content-Type", "application/pdf");
    const readStream = bucket.openDownloadStream(file._id);
    readStream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: "Error streaming file" });
  }
});

/* ✅ GET ALL PDFs */
app.get("/api/pdfs", async (req, res) => {
  try {
    const pdfs = await PDF.find().sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
});

/* ✅ DELETE (From Atlas) */
app.delete("/api/pdfs/:id", async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "Not found" });

    // Delete from GridFS
    await bucket.delete(pdf.fileId);
    // Delete metadata
    await PDF.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted from Atlas" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

/* ✅ FRONTEND BUILD */
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
