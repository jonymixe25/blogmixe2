/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Local Database initialization
import localDb from "./src/lib/localDb.js"; // tsx allows importing .ts with .js extension or just .ts

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// API routes
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ 
    message: "File uploaded successfully", 
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}` 
  });
});

// Local Database Routes
app.get("/api/local/files", (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const stats = files.map(file => {
      const s = fs.statSync(path.join(uploadsDir, file));
      return {
        name: file,
        size: s.size,
        mtime: s.mtime,
        path: `/uploads/${file}`
      };
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to list files" });
  }
});

app.get("/api/local/data", (req, res) => {
  try {
    const rows = localDb.prepare("SELECT * FROM local_storage ORDER BY updated_at DESC").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch local data" });
  }
});

app.post("/api/local/data", (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: "Key and value are required" });
  }
  try {
    const stmt = localDb.prepare("INSERT OR REPLACE INTO local_storage (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
    stmt.run(key, typeof value === 'string' ? value : JSON.stringify(value));
    res.json({ message: "Data saved successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save local data" });
  }
});

app.delete("/api/local/data/:key", (req, res) => {
  const { key } = req.params;
  try {
    const stmt = localDb.prepare("DELETE FROM local_storage WHERE key = ?");
    stmt.run(key);
    res.json({ message: "Data deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete local data" });
  }
});

// Serve static files from uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
  // Add a fallback for development as well if needed
  app.use('*', async (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    try {
      const html = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      next(e);
    }
  });
} else {
  const distPath = path.resolve(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
