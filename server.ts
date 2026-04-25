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

// Test write access to uploads directory
try {
  const testFile = path.join(uploadsDir, ".write-test");
  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);
  console.log("Uploads directory is writable");
} catch (err) {
  console.error("WARNING: Uploads directory is NOT writable:", err);
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
app.use("/api", (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.url}`);
  next();
});

app.post("/api/upload", (req, res, next) => {
  console.log("Receiving upload request...");
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      return res.status(400).json({ error: `Multer upload error: ${err.message}` });
    } else if (err) {
      console.error("Unknown upload error:", err);
      return res.status(500).json({ error: `Upload error: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File uploaded successfully:", req.file.filename);
    res.json({ 
      message: "File uploaded successfully", 
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}` 
    });
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

// API 404 Catch-all (to debug why requests fail)
app.all("/api/*", (req, res) => {
  console.log(`[404] API Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found on this server.` });
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
