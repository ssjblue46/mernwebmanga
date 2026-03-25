const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ REPLACE THIS with your actual Render Environment Variable if possible
const mongoURI = "mongodb+srv://raj:Raj%40101105@cluster0.3swrnlq.mongodb.net/pdfCollection?retryWrites=true&w=majority";

// ✅ MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increased limit for Manga PDFs
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ 1. DATABASE CONNECTION
// We use createConnection for GridFS and mongoose.connect for the Model
const conn = mongoose.createConnection(mongoURI);

let bucket;
conn.once("open", () => {
  // Initialize GridFS Bucket only after connection is open to avoid 503/500 errors
  bucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "pdfs",
  });
  console.log("✅ MongoDB & GridFS connected successfully");
});

mongoose.connect(mongoURI)
  .then(() => console.log("✅ Mongoose Model connected"))
  .catch(err => console.error("❌ Mongoose Error:", err));

// ✅ 2. SCHEMAS
const pdfSchema = new mongoose.Schema({
  name: String,
  fileId: mongoose.Schema.Types.ObjectId, // Points to the actual file in GridFS
  url: String,
}, { timestamps: true });

const PDF = mongoose.model("PDF", pdfSchema);

// ✅ STABLE STORAGE CONFIG
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useUnifiedTopology: true, useNewUrlParser: true }, // Add these flags
  file: (req, file) => {
    // This function MUST return an object or it will crash with a 502
    return new Promise((resolve, reject) => {
      const fileInfo = {
        filename: Date.now() + "-" + file.originalname,
        bucketName: "pdfs"
      };
      resolve(fileInfo);
    });
  }
});

// Catch errors on the storage engine itself
storage.on('connectionError', (err) => {
  console.error("Storage Connection Error:", err);
});

const upload = multer({ storage });


// ✅ 4. ROUTES

// UPLOAD PDF
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
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Internal Server Error during upload" });
  }
});

// GET ALL PDFs (Metadata)
app.get("/api/pdfs", async (req, res) => {
  try {
    const pdfs = await PDF.find().sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch PDF list" });
  }
});

// VIEW/STREAM PDF (Fetches from Atlas)
app.get("/api/file/:filename", async (req, res) => {
  try {
    if (!bucket) return res.status(503).json({ message: "Bucket not initialized" });

    const file = await bucket.find({ filename: req.params.filename }).next();
    if (!file) return res.status(404).json({ message: "File not found" });

    res.set("Content-Type", "application/pdf");
    const readStream = bucket.openDownloadStream(file._id);
    
    readStream.on("error", () => res.status(500).end());
    readStream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: "Error streaming file" });
  }
});

// DELETE PDF
app.delete("/api/pdfs/:id", async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "PDF record not found" });

    // Delete chunks and files from GridFS
    await bucket.delete(pdf.fileId);
    // Delete metadata record
    await PDF.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted successfully from Atlas" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete" });
  }
});

// ✅ 5. FRONTEND INTEGRATION
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
