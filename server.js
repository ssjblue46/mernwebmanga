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
const path = require("path");


app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/pdfCollection", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'creator', 'reader'], default: 'reader' },
  company: String,
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

// PDF schema
const pdfSchema = new mongoose.Schema({
  name: String,
  url: String,
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const PDF = mongoose.model("PDF", pdfSchema);

// OTP storage (in production, use Redis or database)
const otpStorage = new Map();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create default admin user if it doesn't exist
const createDefaultAdmin = async () => {
  try {
    // Delete any existing admin user first
    await User.deleteMany({ role: 'admin' });
    
    const hashedPassword = await bcrypt.hash('Raj@101105', 10);
    const admin = new User({
      name: 'Admin',
      email: 'rajmt2005@gmail.com',
      password: hashedPassword,
      role: 'admin',
      company: 'MangaVerse',
      isVerified: true
    });
    await admin.save();
    console.log('✅ Admin user created: rajmt2005@gmail.com / Raj@101105');
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
};

// Call the function after MongoDB connection
setTimeout(createDefaultAdmin, 2000);

// Authentication endpoints
// Register endpoint
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, company } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'creator', // New registrations are creators
      company
    });

    await user.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check role
    if (role && user.role !== role) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Admin requires OTP
    if (user.role === 'admin') {
      return res.json({ 
        message: "OTP required",
        role: user.role 
      });
    }

    // Creator gets direct access
    if (user.role === 'creator') {
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        message: "Login successful",
        token,
        user: { id: user._id, email: user.email, name: user.name, role: user.role }
      });
    }

    // Reader gets direct access
    if (user.role === 'reader') {
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        message: "Login successful",
        token,
        user: { id: user._id, email: user.email, name: user.name, role: user.role }
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Send OTP endpoint
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (5 minutes)
    otpStorage.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // For development, log OTP to console with prominent formatting
    console.log('\n' + '='.repeat(50));
    console.log(`🔐 ADMIN OTP VERIFICATION`);
    console.log('='.repeat(50));
    console.log(`📧 Email: ${email}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`⏰ Expires in: 5 minutes`);
    console.log('='.repeat(50) + '\n');

    // In production, send email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: 'Your OTP for MangaVerse',
        text: `Your OTP is: ${otp}. This code will expire in 5 minutes.`
      });
      console.log('📧 OTP email sent successfully');
    } catch (emailErr) {
      console.log("⚠️  Email sending failed, but OTP is logged to console above");
    }

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify OTP endpoint
app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Check if OTP exists and is valid
    const storedData = otpStorage.get(email);
    if (!storedData) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (Date.now() > storedData.expires) {
      otpStorage.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP is valid, get user and create token
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Clean up OTP
    otpStorage.delete(email);

    res.json({
      message: "OTP verified successfully",
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Multer setup for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });




// Upload PDFs
app.post("/api/pdfs", upload.array("pdfs"), async (req, res) => {
  try {
    const files = req.files.map(file => ({
      name: file.originalname,
      url: `http://localhost:${PORT}/uploads/${file.filename}`,
    }));




    // Optional: save to MongoDB
    await PDF.insertMany(files).catch(() => {});




    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});




// Get all PDFs from **uploads folder**
app.get("/api/pdfs", (req, res) => {
  const folderPath = path.join(__dirname, "uploads");
  fs.readdir(folderPath, (err, files) => {
    if (err) return res.status(500).json({ message: "Cannot read uploads folder" });




    const pdfs = files
      .filter(f => f.endsWith(".pdf"))
      .map(file => ({
        name: file.replace(/^\d+-/, ""), // remove timestamp prefix
        url: `http://localhost:${PORT}/uploads/${file}`,
      }));




    res.json(pdfs);
  });
});




// Optional: delete PDF by filename
app.delete("/api/pdfs/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  fs.unlink(filePath, err => {
    if (err) return res.status(404).json({ message: "File not found" });
    res.json({ message: "PDF deleted" });
  });
});

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


