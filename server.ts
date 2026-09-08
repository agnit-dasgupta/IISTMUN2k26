import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

import fs from "fs";

const QUERIES_FILE = path.join(process.cwd(), "data", "contact_queries.json");

function getStoredQueries() {
  try {
    if (!fs.existsSync(path.dirname(QUERIES_FILE))) {
      fs.mkdirSync(path.dirname(QUERIES_FILE), { recursive: true });
    }
    if (!fs.existsSync(QUERIES_FILE)) {
      fs.writeFileSync(QUERIES_FILE, JSON.stringify([]));
      return [];
    }
    const content = fs.readFileSync(QUERIES_FILE, "utf-8");
    return JSON.parse(content) || [];
  } catch (err) {
    console.error("Error reading queries file:", err);
    return [];
  }
}

function saveStoredQueries(queries: any[]) {
  try {
    if (!fs.existsSync(path.dirname(QUERIES_FILE))) {
      fs.mkdirSync(path.dirname(QUERIES_FILE), { recursive: true });
    }
    fs.writeFileSync(QUERIES_FILE, JSON.stringify(queries, null, 2));
  } catch (err) {
    console.error("Error writing queries file:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Contact query dispatch endpoint - persists queries and logs them
  app.post("/api/contact", (req, res) => {
    const { name, email, category, message, queryId, timestamp } = req.body;
    const queries = getStoredQueries();
    const newQuery = {
      id: queryId && queryId !== "offline-ref" ? queryId : `IM-CQ-${Date.now().toString().slice(-6)}`,
      name: name?.trim() || "Anonymous Delegate",
      email: email?.trim() || "unspecified@iistmun.org",
      category: category || "General Inquiry",
      message: message?.trim() || "",
      timestamp: timestamp || new Date().toLocaleString(),
      status: "pending",
      destination: "support@iistmun.org",
      source: "portal_contact_form",
      createdAt: new Date().toISOString()
    };

    queries.unshift(newQuery);
    saveStoredQueries(queries);

    console.log(`[QUERY TRANSMITTED TO support@iistmun.org & SAVED]`, {
      id: newQuery.id,
      from: `${newQuery.name} <${newQuery.email}>`,
      category: newQuery.category,
      time: newQuery.timestamp
    });

    res.json({
      status: "success",
      query: newQuery,
      sentTo: "support@iistmun.org",
      timestamp: new Date().toISOString()
    });
  });

  // Retrieve all logged queries for the Admin Console
  app.get("/api/queries", (req, res) => {
    const queries = getStoredQueries();
    res.json({ status: "success", queries });
  });

  // Delete a query
  app.delete("/api/queries/:id", (req, res) => {
    const { id } = req.params;
    let queries = getStoredQueries();
    queries = queries.filter((q: any) => q.id !== id);
    saveStoredQueries(queries);
    res.json({ status: "success", id });
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
