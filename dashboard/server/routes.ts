import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { patchAlertSchema, importBatchSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // GET /api/alerts?status=active|resolved|all
  app.get("/api/alerts", async (req, res) => {
    const status = (req.query.status as string) || 'active';
    const alerts = await storage.getAlerts(status as 'active' | 'resolved' | 'all');
    res.json(alerts);
  });

  // GET /api/alerts/:id
  app.get("/api/alerts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const alert = await storage.getAlert(id);
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json(alert);
  });

  // PATCH /api/alerts/:id
  app.patch("/api/alerts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = patchAlertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const updated = await storage.patchAlert(id, parsed.data);
    if (!updated) return res.status(404).json({ error: "Alert not found" });
    res.json(updated);
  });

  // GET /api/properties
  app.get("/api/properties", async (_req, res) => {
    const properties = await storage.getProperties();
    res.json(properties);
  });

  // GET /api/properties/:id
  app.get("/api/properties/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const result = await storage.getProperty(id);
    if (!result) return res.status(404).json({ error: "Property not found" });
    res.json(result);
  });

  // POST /api/import/properties
  app.post("/api/import/properties", async (req, res) => {
    const parsed = importBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }
    const result = await storage.addProperties(parsed.data.properties);
    res.json(result);
  });

  // GET /api/stats
  app.get("/api/stats", async (_req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  return httpServer;
}
