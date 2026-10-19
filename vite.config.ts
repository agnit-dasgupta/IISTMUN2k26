import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function viteApiPlugin(): Plugin {
  const REGISTRATIONS_FILE = path.join(process.cwd(), "data", "local_registrations.json");

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

  const handleApi = (req: any, res: any, next: any) => {
    // Health check
    if (req.url === "/api/health" && req.method === "GET") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "ok", backend: "vite-middleware", timestamp: new Date().toISOString() }));
      return;
    }

    // GET /api/registrations
    if (req.url === "/api/registrations" && req.method === "GET") {
      const list = readLocalRegistrations();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "success", count: list.length, data: list }));
      return;
    }

    // POST /api/registrations
    if (req.url === "/api/registrations" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk: any) => { body += chunk; });
      req.on("end", () => {
        try {
          const regData = typeof req.body === "object" && req.body !== null ? req.body : JSON.parse(body || "{}");
          if (!regData || (!regData.id && !regData.uid)) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ status: "error", message: "Invalid registration payload" }));
            return;
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
          console.log(`[VITE REGISTRATION BACKUP] Stored ticket ${identifier} (${regData.name || "Candidate"})`);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ status: "success", data: regData }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ status: "error", message: err.message || "Failed to persist registration" }));
        }
      });
      return;
    }

    // DELETE /api/registrations/:id
    if (req.url && req.url.startsWith("/api/registrations/") && req.method === "DELETE") {
      const id = req.url.replace("/api/registrations/", "").split("?")[0];
      const list = readLocalRegistrations();
      const updated = list.filter(r => r.id !== id && r.uid !== id);
      writeLocalRegistrations(updated);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "success", message: `Deleted ${id}` }));
      return;
    }

    // POST /api/upload
    if (req.url && req.url.startsWith('/api/upload') && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const payload = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(body || '{}');
          const { fileName, fileData } = payload;
          if (!fileName || !fileData) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', message: 'Missing fileName or fileData' }));
            return;
          }

          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          const buffer = Buffer.from(matches && matches.length === 3 ? matches[2] : fileData, 'base64');

          const ext = path.extname(fileName) || '.dat';
          const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
          const uniqueFileName = `${Date.now()}_${baseName}${ext}`;
          const destinationPath = path.join(uploadsDir, uniqueFileName);

          fs.writeFileSync(destinationPath, buffer);

          const fileUrl = `/uploads/${uniqueFileName}`;
          console.log(`[VITE UPLOAD] Saved ${fileName} -> ${fileUrl} (${buffer.length} bytes)`);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'success',
            url: fileUrl,
            fileName: uniqueFileName,
            originalName: fileName,
            size: buffer.length
          }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'error', message: err.message || 'Upload failed' }));
        }
      });
      return;
    }

    next();
  };

  return {
    name: 'vite-api-plugin',
    configureServer(server) {
      server.middlewares.use(handleApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApi);
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), viteApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
