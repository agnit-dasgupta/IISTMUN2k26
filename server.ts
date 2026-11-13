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
      if (
        regData.round === "priority" ||
        regData.isPriority === true ||
        (typeof regData.id === "string" && regData.id.startsWith("PRIO-"))
      ) {
        return res.status(403).json({ status: "error", message: "Priority Round registrations are now closed." });
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

  const SCHOOL_REGISTRATIONS_FILE = path.join(process.cwd(), "data", "local_school_registrations.json");

  // Helper to read local school registrations
  const readLocalSchoolRegistrations = (): any[] => {
    try {
      if (fs.existsSync(SCHOOL_REGISTRATIONS_FILE)) {
        const raw = fs.readFileSync(SCHOOL_REGISTRATIONS_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not read local_school_registrations.json:", e);
    }
    return [];
  };

  // Helper to write local school registrations
  const writeLocalSchoolRegistrations = (list: any[]) => {
    try {
      const dir = path.dirname(SCHOOL_REGISTRATIONS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SCHOOL_REGISTRATIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not write local_school_registrations.json:", e);
    }
  };

  // GET /api/school-registrations
  app.get("/api/school-registrations", (req, res) => {
    const list = readLocalSchoolRegistrations();
    return res.json({ status: "success", count: list.length, data: list });
  });

  // POST /api/school-registrations
  app.post("/api/school-registrations", (req, res) => {
    try {
      const regData = req.body;
      if (!regData || (!regData.id && !regData.uid)) {
        return res.status(400).json({ status: "error", message: "Invalid school registration payload" });
      }

      const list = readLocalSchoolRegistrations();
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

      writeLocalSchoolRegistrations(list);
      console.log(`[SCHOOL REGISTRATION BACKUP SUCCESS] Stored ticket ${identifier} (${regData.name || "Candidate"})`);
      return res.json({ status: "success", data: regData });
    } catch (err: any) {
      console.error("Error saving local school registration:", err);
      return res.status(500).json({ status: "error", message: err.message || "Failed to persist school registration" });
    }
  });

  // DELETE /api/school-registrations/:id
  app.delete("/api/school-registrations/:id", (req, res) => {
    try {
      const { id } = req.params;
      const list = readLocalSchoolRegistrations();
      const updated = list.filter(r => r.id !== id && r.uid !== id);
      writeLocalSchoolRegistrations(updated);
      return res.json({ status: "success", message: `Deleted school registration ${id}` });
    } catch (err: any) {
      return res.status(500).json({ status: "error", message: err.message || "Failed to delete" });
    }
  });

  const COUNTRY_MATRIX_FILE = path.join(process.cwd(), "data", "local_country_matrix.json");
  const COMMITTEES_FILE = path.join(process.cwd(), "data", "local_committees.json");

  // Helper to read local country matrix
  const readLocalCountryMatrix = (): any[] => {
    try {
      if (fs.existsSync(COUNTRY_MATRIX_FILE)) {
        const raw = fs.readFileSync(COUNTRY_MATRIX_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not read local_country_matrix.json:", e);
    }
    return [];
  };

  // Helper to read local committees portfolio list
  const readLocalCommittees = (): any => {
    try {
      if (fs.existsSync(COMMITTEES_FILE)) {
        const raw = fs.readFileSync(COMMITTEES_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not read local_committees.json:", e);
    }
    return null;
  };

  // GET /api/country-matrix
  app.get("/api/country-matrix", (req, res) => {
    const list = readLocalCountryMatrix();
    return res.json({ status: "success", count: list.length, data: list });
  });

  // POST /api/country-matrix (Admin update of matrix row)
  app.post("/api/country-matrix", (req, res) => {
    try {
      const row = req.body;
      if (!row || !row.country) {
        return res.status(400).json({ status: "error", message: "Invalid country matrix row" });
      }
      const list = readLocalCountryMatrix();
      const idx = list.findIndex(r => r.country === row.country);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...row };
      } else {
        list.push(row);
      }
      fs.writeFileSync(COUNTRY_MATRIX_FILE, JSON.stringify(list, null, 2), "utf-8");
      return res.json({ status: "success", data: row });
    } catch (err: any) {
      return res.status(500).json({ status: "error", message: err.message || "Failed to update country matrix" });
    }
  });

  const PORTFOLIO_STATES_FILE = path.join(process.cwd(), "data", "local_portfolio_states.json");

  // Helper to read local portfolio states
  const readLocalPortfolioStates = (): Record<string, any> => {
    try {
      if (fs.existsSync(PORTFOLIO_STATES_FILE)) {
        const raw = fs.readFileSync(PORTFOLIO_STATES_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not read local_portfolio_states.json:", e);
    }
    return {};
  };

  // Helper to write local portfolio states
  const writeLocalPortfolioStates = (states: Record<string, any>) => {
    try {
      const dir = path.dirname(PORTFOLIO_STATES_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(PORTFOLIO_STATES_FILE, JSON.stringify(states, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not write local_portfolio_states.json:", e);
    }
  };

  // GET /api/portfolio-states
  app.get("/api/portfolio-states", (req, res) => {
    const states = readLocalPortfolioStates();
    return res.json({ status: "success", count: Object.keys(states).length, data: states });
  });

  // POST /api/portfolio-states (Admin update of portfolio status)
  app.post("/api/portfolio-states", (req, res) => {
    try {
      const { country, committee, status } = req.body;
      if (!country || !committee || !status) {
        return res.status(400).json({ status: "error", message: "Country, committee and status are required" });
      }
      const states = readLocalPortfolioStates();
      if (!states[country]) {
        states[country] = {};
      }
      states[country][committee] = status;
      writeLocalPortfolioStates(states);
      console.log(`[PORTFOLIO STATE UPDATED] ${country} -> ${committee} = ${status}`);
      return res.json({ status: "success", country, committee, portfolioStatus: status });
    } catch (err: any) {
      return res.status(500).json({ status: "error", message: err.message || "Failed to update portfolio state" });
    }
  });

  // GET /api/committees
  app.get("/api/committees", (req, res) => {
    const data = readLocalCommittees();
    return res.json({ status: "success", data });
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
