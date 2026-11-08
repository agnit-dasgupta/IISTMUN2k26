import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Allow larger payload for base64 file uploads (photos, CVs)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use("/uploads", express.static(UPLOADS_DIR));

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      backend: "firestore-direct", 
      timestamp: new Date().toISOString() 
    });
  });

  const REGISTRATIONS_FILE = path.join(process.cwd(), "data", "local_registrations.json");

  // Helper to read local registrations
  const readLocalRegistrations = (): any[] => {
    try {
      if (fs.existsSync(REGISTRATIONS_FILE)) {
        const raw = fs.readFileSync(REGISTRATIONS_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not read local_registrations.json:", e);
    }
    return [];
  };

  // Helper to write local registrations
  const writeLocalRegistrations = (list: any[]) => {
    try {
      const dir = path.dirname(REGISTRATIONS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not write local_registrations.json:", e);
    }
  };

  // GET /api/registrations
  app.get("/api/registrations", (req, res) => {
    const list = readLocalRegistrations();
    return res.json({ status: "success", count: list.length, data: list });
  });

  // POST /api/registrations
  app.post("/api/registrations", (req, res) => {
    try {
      const regData = req.body;
      if (!regData || (!regData.id && !regData.uid)) {
        return res.status(400).json({ status: "error", message: "Invalid registration payload" });
      }

      const list = readLocalRegistrations();
      const identifier = regData.id || regData.uid;
      const existingIdx = list.findIndex(r => {
        if (regData.id && r.id) return r.id === regData.id;
        if (regData.id && r.uid) return r.uid === regData.id;
        if (regData.uid && r.id) return r.id === regData.uid;
        return Boolean(regData.uid && r.uid && r.uid === regData.uid);
      });

      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...regData, updatedAt: new Date().toISOString() };
      } else {
        list.unshift({ ...regData, createdAt: new Date().toISOString() });
      }

      writeLocalRegistrations(list);
      console.log(`[REGISTRATION BACKUP SUCCESS] Stored ticket ${identifier} (${regData.name || "Candidate"})`);
      return res.json({ status: "success", data: regData });
    } catch (err: any) {
      console.error("Error saving local registration:", err);
      return res.status(500).json({ status: "error", message: err.message || "Failed to persist registration" });
    }
  });

  // DELETE /api/registrations/:id
  app.delete("/api/registrations/:id", (req, res) => {
    try {
      const { id } = req.params;
      const list = readLocalRegistrations();
      const updated = list.filter(r => r.id !== id && r.uid !== id);
      writeLocalRegistrations(updated);
      return res.json({ status: "success", message: `Deleted ${id}` });
    } catch (err: any) {
      return res.status(500).json({ status: "error", message: err.message || "Failed to delete" });
    }
  });

  const ACCOMMODATIONS_FILE = path.join(process.cwd(), "data", "local_accommodations.json");
  const ACCOMMODATION_SETTINGS_FILE = path.join(process.cwd(), "data", "local_accommodation_settings.json");

  const readLocalAccommodationSettings = (): any => {
    try {
      if (fs.existsSync(ACCOMMODATION_SETTINGS_FILE)) {
        const raw = fs.readFileSync(ACCOMMODATION_SETTINGS_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not read local_accommodation_settings.json:", e);
    }
    return {
      maleFee: 1200,
      femaleFee: 1000,
      maleRoomsAvailable: 25,
      femaleRoomsAvailable: 15,
      maleLocationName: "SPACE Apartments (Out of Campus)",
      femaleLocationName: "IIST Hostels / Guest Quarters, Valiamala (In-Campus)",
      maleDescription: "Comfortable hotel accommodation with dedicated private transport shuttle directly connecting the hotel to IIST Valiamala campus during all conference days.",
      femaleDescription: "Secure on-campus student hostel accommodation situated inside the IIST Valiamala campus with 24/7 security surveillance and biometric checkpoints."
    };
  };

  const writeLocalAccommodationSettings = (data: any) => {
    try {
      const dir = path.dirname(ACCOMMODATION_SETTINGS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(ACCOMMODATION_SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not write local_accommodation_settings.json:", e);
    }
  };
  const readLocalAccommodations = (): any[] => {
    try {
      if (fs.existsSync(ACCOMMODATIONS_FILE)) {
        const raw = fs.readFileSync(ACCOMMODATIONS_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not read local_accommodations.json:", e);
    }
    return [];
  };

  const writeLocalAccommodations = (list: any[]) => {
    try {
      const dir = path.dirname(ACCOMMODATIONS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(ACCOMMODATIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not write local_accommodations.json:", e);
    }
  };

  // GET /api/accommodations
  app.get("/api/accommodations", (req, res) => {
    const list = readLocalAccommodations();
    return res.json({ status: "success", count: list.length, data: list });
  });

  // POST /api/accommodations
  app.post("/api/accommodations", (req, res) => {
    try {
      const accomData = req.body;
      if (!accomData || !accomData.id) {
        return res.status(400).json({ status: "error", message: "Invalid accommodation payload" });
      }
      const list = readLocalAccommodations();
      const existingIdx = list.findIndex(r => r.id === accomData.id);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...accomData, updatedAt: new Date().toISOString() };
      } else {
        list.unshift({ ...accomData, createdAt: new Date().toISOString() });
      }
      writeLocalAccommodations(list);
      console.log(`[ACCOMMODATION BACKUP SUCCESS] Stored accommodation ${accomData.id} (${accomData.name || "Candidate"})`);
      return res.json({ status: "success", data: accomData });
    } catch (err: any) {
      return res.status(500).json({ status: "error", message: err.message || "Failed to persist accommodation" });
    }
  });

  // DELETE /api/accommodations/:id
  app.delete("/api/accommodations/:id", (req, res) => {
    try {
      const { id } = req.params;
      const list = readLocalAccommodations();
      const updated = list.filter(r => r.id !== id);
      writeLocalAccommodations(updated);
      return res.json({ status: "success", message: `Deleted accommodation ${id}` });
    } catch (err: any) {
      return res.status(500).json({ status: "error", message: err.message || "Failed to delete" });
    }
  });

  // GET /api/accommodation-settings
  app.get("/api/accommodation-settings", (req, res) => {
    const settings = readLocalAccommodationSettings();
    return res.json({ status: "success", data: settings });
  });

  // POST /api/accommodation-settings
  app.post("/api/accommodation-settings", (req, res) => {
    try {
      const incoming = req.body || {};
      const current = readLocalAccommodationSettings();
      const updated = { ...current, ...incoming, updatedAt: new Date().toISOString() };
      writeLocalAccommodationSettings(updated);
      return res.json({ status: "success", data: updated });
    } catch (err: any) {
      return res.status(500).json({ status: "error", message: err.message || "Failed to update accommodation settings" });
    }
  });

  // Base64 file upload endpoint for Photo and CV
  app.post("/api/upload", (req, res) => {
    try {
      const { fileName, fileData } = req.body;
      if (!fileName || !fileData) {
        return res.status(400).json({ status: "error", message: "Missing fileName or fileData" });
      }

      // Extract raw base64 buffer from data URL
      const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      if (matches && matches.length === 3) {
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(fileData, "base64");
      }

      // Generate sanitized, timestamped unique filename
      const ext = path.extname(fileName) || ".dat";
      const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
      const uniqueFileName = `${Date.now()}_${baseName}${ext}`;
      const destinationPath = path.join(UPLOADS_DIR, uniqueFileName);

      fs.writeFileSync(destinationPath, buffer);

      const fileUrl = `/uploads/${uniqueFileName}`;
      console.log(`[FILE UPLOAD SUCCESS] Saved ${fileName} -> ${fileUrl} (${buffer.length} bytes)`);

      return res.json({
        status: "success",
        url: fileUrl,
        fileName: uniqueFileName,
        originalName: fileName,
        size: buffer.length
      });
    } catch (err: any) {
      console.error("File upload error:", err);
      return res.status(500).json({ status: "error", message: err.message || "Upload failed" });
    }
  });

  // Vite middleware integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
