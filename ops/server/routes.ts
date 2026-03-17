import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertActivitySchema, insertDeviceSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Leads ──
  app.get("/api/leads", async (_req, res) => {
    const leads = await storage.getLeads();
    res.json(leads);
  });

  app.get("/api/leads/:id", async (req, res) => {
    const lead = await storage.getLead(Number(req.params.id));
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  });

  app.post("/api/leads", async (req, res) => {
    const parsed = insertLeadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const lead = await storage.createLead(parsed.data);
    res.status(201).json(lead);
  });

  app.patch("/api/leads/:id", async (req, res) => {
    const partial = insertLeadSchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ error: partial.error.flatten() });
    const lead = await storage.updateLead(Number(req.params.id), partial.data);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  });

  app.delete("/api/leads/:id", async (req, res) => {
    const deleted = await storage.deleteLead(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Lead not found" });
    res.json({ ok: true });
  });

  // ── Activities ──
  app.get("/api/leads/:id/activities", async (req, res) => {
    const activities = await storage.getActivities(Number(req.params.id));
    res.json(activities);
  });

  app.post("/api/leads/:id/activities", async (req, res) => {
    const body = { ...req.body, leadId: Number(req.params.id) };
    const parsed = insertActivitySchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const activity = await storage.createActivity(parsed.data);
    res.status(201).json(activity);
  });

  // ── Devices ──
  app.get("/api/devices", async (_req, res) => {
    const devices = await storage.getDevices();
    res.json(devices);
  });

  app.get("/api/devices/:id", async (req, res) => {
    const device = await storage.getDevice(Number(req.params.id));
    if (!device) return res.status(404).json({ error: "Device not found" });
    res.json(device);
  });

  app.post("/api/devices", async (req, res) => {
    const parsed = insertDeviceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const device = await storage.createDevice(parsed.data);
    res.status(201).json(device);
  });

  app.patch("/api/devices/:id", async (req, res) => {
    const partial = insertDeviceSchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ error: partial.error.flatten() });
    const device = await storage.updateDevice(Number(req.params.id), partial.data);
    if (!device) return res.status(404).json({ error: "Device not found" });
    res.json(device);
  });

  app.delete("/api/devices/:id", async (req, res) => {
    const deleted = await storage.deleteDevice(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Device not found" });
    res.json({ ok: true });
  });

  return httpServer;
}
