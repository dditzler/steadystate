import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── CRM: Leads / Prospects ──
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  doorCount: integer("door_count"),
  region: text("region"),
  zipCode: text("zip_code"),
  pmSoftware: text("pm_software"), // AppFolio, Buildium, etc.
  source: text("source"), // Website, Referral, AppFolio Marketplace, LinkedIn, Trade Show, etc.
  stage: text("stage").notNull().default("lead"), // lead, contacted, demo_scheduled, demo_done, proposal, negotiation, won, lost
  priority: text("priority").default("medium"), // low, medium, high, hot
  notes: text("notes"),
  assignedTo: text("assigned_to"),
  nextAction: text("next_action"),
  nextActionDate: text("next_action_date"),
  tags: text("tags"), // comma-separated
  lastContactDate: text("last_contact_date"),
  estimatedValue: integer("estimated_value"), // MRR in cents
  lostReason: text("lost_reason"),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// ── CRM: Activities ──
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  type: text("type").notNull(), // email, call, meeting, note, demo, proposal
  description: text("description").notNull(),
  date: text("date").notNull(),
  createdBy: text("created_by"),
});

export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// ── Device Management: Devices ──
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  serialNumber: text("serial_number").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // wifi_hub, cellular_hub, zigbee_sensor
  firmware: text("firmware"),
  status: text("status").notNull().default("online"), // online, offline, warning, error
  category: text("category").notNull().default("lab"), // lab, pilot, demo, in_service, decommissioned
  customerId: integer("customer_id"), // links to lead if in_service
  locationName: text("location_name"),
  locationAddress: text("location_address"),
  locationZip: text("location_zip"),
  locationRegion: text("location_region"),
  lastSeen: text("last_seen"),
  batteryLevel: integer("battery_level"), // 0-100
  signalStrength: integer("signal_strength"), // RSSI
  sensorData: text("sensor_data"), // JSON string of latest readings
  notes: text("notes"),
  installedDate: text("installed_date"),
});

export const insertDeviceSchema = createInsertSchema(devices).omit({ id: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;

// ── Pipeline stage definitions ──
export const PIPELINE_STAGES = [
  { id: "lead", label: "New Lead", color: "slate" },
  { id: "contacted", label: "Contacted", color: "blue" },
  { id: "demo_scheduled", label: "Demo Scheduled", color: "purple" },
  { id: "demo_done", label: "Demo Complete", color: "indigo" },
  { id: "proposal", label: "Proposal Sent", color: "amber" },
  { id: "negotiation", label: "Negotiation", color: "orange" },
  { id: "won", label: "Won", color: "emerald" },
  { id: "lost", label: "Lost", color: "red" },
] as const;

export const DEVICE_CATEGORIES = [
  { id: "lab", label: "Testing Lab", color: "blue" },
  { id: "pilot", label: "Pilot", color: "purple" },
  { id: "demo", label: "Demo Unit", color: "amber" },
  { id: "in_service", label: "In Service", color: "emerald" },
  { id: "decommissioned", label: "Decommissioned", color: "slate" },
] as const;

export const LEAD_SOURCES = [
  "Website",
  "AppFolio Marketplace",
  "Buildium Partner",
  "LinkedIn Outreach",
  "Trade Show",
  "Referral",
  "Cold Email",
  "Webinar",
  "Content Marketing",
  "Other",
] as const;
