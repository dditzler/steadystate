import { z } from "zod";

// --- Data Model Types ---

export interface Property {
  id: number;
  name: string;
  address: string;
  unitCount: number;
  type: 'multifamily' | 'sfr' | 'vacation';
}

export interface Unit {
  id: number;
  propertyId: number;
  unitNumber: string;
  status: 'occupied' | 'vacant' | 'turnover';
}

export type AlertType = 'leak' | 'temperature' | 'humidity' | 'hvac' | 'power' | 'offline';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: number;
  unitId: number;
  propertyId: number;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  assignedTo: string | null;
}

export interface PortfolioStats {
  totalProperties: number;
  totalUnits: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  normalCount: number;
  occupancyRate: number;
}

// --- Zod Schemas ---

export const patchAlertSchema = z.object({
  acknowledgedAt: z.string().nullable().optional(),
  resolvedAt: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
});

export type PatchAlert = z.infer<typeof patchAlertSchema>;

// --- Mock Data ---

export const MOCK_PROPERTIES: Property[] = [
  { id: 1, name: "Sunset Villas", address: "2401 Sunset Blvd, Austin, TX 78704", unitCount: 12, type: 'multifamily' },
  { id: 2, name: "Oak Ridge Apartments", address: "890 Oak Ridge Dr, Austin, TX 78745", unitCount: 8, type: 'multifamily' },
  { id: 3, name: "Lakewood Terrace", address: "1550 Lakewood Ave, Austin, TX 78703", unitCount: 6, type: 'multifamily' },
  { id: 4, name: "Highland Park Homes", address: "340 Highland Park Rd, Round Rock, TX 78664", unitCount: 4, type: 'sfr' },
  { id: 5, name: "Barton Creek Lodge", address: "7200 Barton Creek Blvd, Austin, TX 78735", unitCount: 3, type: 'vacation' },
  { id: 6, name: "Cedar Park Place", address: "1200 Cedar Park Dr, Cedar Park, TX 78613", unitCount: 5, type: 'multifamily' },
  { id: 7, name: "Riverside Commons", address: "450 Riverside Dr, Austin, TX 78741", unitCount: 4, type: 'multifamily' },
  { id: 8, name: "Pflugerville Heights", address: "2100 Heights Blvd, Pflugerville, TX 78660", unitCount: 3, type: 'sfr' },
  { id: 9, name: "South Congress Flats", address: "1800 S Congress Ave, Austin, TX 78704", unitCount: 3, type: 'multifamily' },
  { id: 10, name: "Dripping Springs Retreat", address: "500 Ranch Rd, Dripping Springs, TX 78620", unitCount: 2, type: 'vacation' },
];

export const MOCK_UNITS: Unit[] = [
  // Sunset Villas (12 units)
  { id: 1, propertyId: 1, unitNumber: "101", status: 'occupied' },
  { id: 2, propertyId: 1, unitNumber: "102", status: 'occupied' },
  { id: 3, propertyId: 1, unitNumber: "103", status: 'vacant' },
  { id: 4, propertyId: 1, unitNumber: "104", status: 'occupied' },
  { id: 5, propertyId: 1, unitNumber: "201", status: 'occupied' },
  { id: 6, propertyId: 1, unitNumber: "202", status: 'occupied' },
  { id: 7, propertyId: 1, unitNumber: "203", status: 'occupied' },
  { id: 8, propertyId: 1, unitNumber: "204", status: 'turnover' },
  { id: 9, propertyId: 1, unitNumber: "301", status: 'occupied' },
  { id: 10, propertyId: 1, unitNumber: "302", status: 'occupied' },
  { id: 11, propertyId: 1, unitNumber: "303", status: 'occupied' },
  { id: 12, propertyId: 1, unitNumber: "304", status: 'occupied' },
  // Oak Ridge (8 units)
  { id: 13, propertyId: 2, unitNumber: "A", status: 'occupied' },
  { id: 14, propertyId: 2, unitNumber: "B", status: 'occupied' },
  { id: 15, propertyId: 2, unitNumber: "C", status: 'occupied' },
  { id: 16, propertyId: 2, unitNumber: "D", status: 'vacant' },
  { id: 17, propertyId: 2, unitNumber: "E", status: 'occupied' },
  { id: 18, propertyId: 2, unitNumber: "F", status: 'occupied' },
  { id: 19, propertyId: 2, unitNumber: "G", status: 'occupied' },
  { id: 20, propertyId: 2, unitNumber: "H", status: 'occupied' },
  // Lakewood Terrace (6 units)
  { id: 21, propertyId: 3, unitNumber: "1A", status: 'occupied' },
  { id: 22, propertyId: 3, unitNumber: "1B", status: 'occupied' },
  { id: 23, propertyId: 3, unitNumber: "2A", status: 'occupied' },
  { id: 24, propertyId: 3, unitNumber: "2B", status: 'occupied' },
  { id: 25, propertyId: 3, unitNumber: "3A", status: 'turnover' },
  { id: 26, propertyId: 3, unitNumber: "3B", status: 'occupied' },
  // Highland Park Homes (4 SFR)
  { id: 27, propertyId: 4, unitNumber: "Main", status: 'occupied' },
  { id: 28, propertyId: 4, unitNumber: "Main", status: 'occupied' },
  { id: 29, propertyId: 4, unitNumber: "Main", status: 'occupied' },
  { id: 30, propertyId: 4, unitNumber: "Main", status: 'vacant' },
  // Barton Creek Lodge (3 vacation)
  { id: 31, propertyId: 5, unitNumber: "Cabin A", status: 'occupied' },
  { id: 32, propertyId: 5, unitNumber: "Cabin B", status: 'occupied' },
  { id: 33, propertyId: 5, unitNumber: "Cabin C", status: 'vacant' },
  // Cedar Park Place (5 units)
  { id: 34, propertyId: 6, unitNumber: "101", status: 'occupied' },
  { id: 35, propertyId: 6, unitNumber: "102", status: 'occupied' },
  { id: 36, propertyId: 6, unitNumber: "103", status: 'occupied' },
  { id: 37, propertyId: 6, unitNumber: "201", status: 'occupied' },
  { id: 38, propertyId: 6, unitNumber: "202", status: 'occupied' },
  // Riverside Commons (4 units)
  { id: 39, propertyId: 7, unitNumber: "1", status: 'occupied' },
  { id: 40, propertyId: 7, unitNumber: "2", status: 'occupied' },
  { id: 41, propertyId: 7, unitNumber: "3", status: 'occupied' },
  { id: 42, propertyId: 7, unitNumber: "4", status: 'occupied' },
  // Pflugerville Heights (3 SFR)
  { id: 43, propertyId: 8, unitNumber: "Main", status: 'occupied' },
  { id: 44, propertyId: 8, unitNumber: "Main", status: 'occupied' },
  { id: 45, propertyId: 8, unitNumber: "Main", status: 'occupied' },
  // South Congress Flats (3 units)
  { id: 46, propertyId: 9, unitNumber: "1", status: 'occupied' },
  { id: 47, propertyId: 9, unitNumber: "2", status: 'occupied' },
  { id: 48, propertyId: 9, unitNumber: "3", status: 'occupied' },
  // Dripping Springs Retreat (2 vacation)
  { id: 49, propertyId: 10, unitNumber: "House A", status: 'occupied' },
  { id: 50, propertyId: 10, unitNumber: "House B", status: 'occupied' },
];

const now = new Date("2026-03-17T08:10:00-05:00");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const MOCK_ALERTS: Alert[] = [
  // CRITICAL alerts
  {
    id: 1,
    unitId: 7,
    propertyId: 1,
    type: 'leak',
    severity: 'critical',
    title: "Water Leak — Unit 203",
    description: "Moisture sensor in Unit 203 bathroom triggered at 7:58 AM. Readings jumped from baseline 12% to 89% in under 3 minutes. Historical pattern suggests supply line issue — similar signature to Unit 301 incident last October.",
    recommendation: "Dispatch plumber immediately. Shut off water to unit via main shutoff in utility closet B. Notify tenant via automated message.",
    createdAt: minutesAgo(12),
    acknowledgedAt: null,
    resolvedAt: null,
    assignedTo: null,
  },
  {
    id: 2,
    unitId: 31,
    propertyId: 5,
    type: 'temperature',
    severity: 'critical',
    title: "Freezing Temps — Cabin A",
    description: "Interior temperature dropped to 38°F at 6:15 AM. HVAC system appears non-responsive. Outside temp is 28°F. Pipes at risk of freezing within 2-3 hours at current rate of heat loss.",
    recommendation: "Send maintenance to check HVAC unit. Enable backup electric heaters remotely. Guest check-in scheduled for 3 PM today — may need to relocate.",
    createdAt: minutesAgo(115),
    acknowledgedAt: minutesAgo(90),
    resolvedAt: null,
    assignedTo: "Mike (maintenance)",
  },
  {
    id: 3,
    unitId: 39,
    propertyId: 7,
    type: 'power',
    severity: 'critical',
    title: "Power Outage — Unit 1",
    description: "Complete power loss detected at 7:42 AM. Smart meter reporting zero draw. Adjacent units (2, 3, 4) operating normally. Likely isolated breaker trip or wiring issue in Unit 1.",
    recommendation: "Check breaker panel in Unit 1 utility closet. If breaker is not tripped, dispatch electrician. Tenant reported working from home today.",
    createdAt: minutesAgo(28),
    acknowledgedAt: null,
    resolvedAt: null,
    assignedTo: null,
  },

  // WARNING alerts
  {
    id: 4,
    unitId: 13,
    propertyId: 2,
    type: 'hvac',
    severity: 'warning',
    title: "HVAC Cycling Too Often — Unit A",
    description: "HVAC system completed 23 on/off cycles in the last 4 hours, compared to a normal range of 6-8. Short-cycling pattern suggests refrigerant issue or dirty evaporator coil. Energy usage up 40% vs. last week.",
    recommendation: "Schedule HVAC tech visit within 48 hours. Not an emergency but will increase tenant's utility bill and wear on compressor.",
    createdAt: hoursAgo(2),
    acknowledgedAt: null,
    resolvedAt: null,
    assignedTo: null,
  },
  {
    id: 5,
    unitId: 23,
    propertyId: 3,
    type: 'humidity',
    severity: 'warning',
    title: "High Humidity — Unit 2A",
    description: "Bathroom humidity has remained above 75% for 6 consecutive hours. Normal post-shower spike resolves within 45 minutes. Exhaust fan may be malfunctioning or ductwork is blocked.",
    recommendation: "Check bathroom exhaust fan operation. If fan is running, inspect ductwork for obstruction. Prolonged humidity above 70% creates mold risk within 48-72 hours.",
    createdAt: hoursAgo(6),
    acknowledgedAt: hoursAgo(4),
    resolvedAt: null,
    assignedTo: "Sarah (maintenance)",
  },
  {
    id: 6,
    unitId: 34,
    propertyId: 6,
    type: 'offline',
    severity: 'warning',
    title: "Sensor Offline — Cedar Park 101",
    description: "All 4 sensors in Unit 101 went offline at 5:30 AM. Last battery report showed 15% remaining 3 days ago. Likely battery depletion across sensor cluster.",
    recommendation: "Replace sensor batteries during next scheduled visit. Unit is occupied — coordinate entry with tenant. No immediate risk but monitoring gap.",
    createdAt: hoursAgo(2.5),
    acknowledgedAt: null,
    resolvedAt: null,
    assignedTo: null,
  },
  {
    id: 7,
    unitId: 43,
    propertyId: 8,
    type: 'temperature',
    severity: 'warning',
    title: "High Temp Spike — Pflugerville #1",
    description: "Interior temperature reached 82°F despite thermostat set to 72°F. HVAC is running but not cooling effectively. Outside temp is 68°F, so this is unusual. Possible refrigerant leak or compressor issue.",
    recommendation: "Have HVAC tech inspect within 24 hours. Check air filter — last replacement was 4 months ago.",
    createdAt: hoursAgo(1),
    acknowledgedAt: null,
    resolvedAt: null,
    assignedTo: null,
  },
  {
    id: 8,
    unitId: 46,
    propertyId: 9,
    type: 'leak',
    severity: 'warning',
    title: "Moisture Elevated — S. Congress #1",
    description: "Kitchen moisture sensor reading 45%, up from baseline 18%. Gradual increase over 8 hours suggests slow leak rather than acute burst. Dishwasher supply line is a common culprit at this age.",
    recommendation: "Schedule plumber visit within 24 hours. Ask tenant to check under kitchen sink for visible moisture. Not urgent but needs attention before it worsens.",
    createdAt: hoursAgo(3),
    acknowledgedAt: null,
    resolvedAt: null,
    assignedTo: null,
  },

  // INFO / PREDICTIVE alerts
  {
    id: 9,
    unitId: 5,
    propertyId: 1,
    type: 'hvac',
    severity: 'info',
    title: "HVAC Efficiency Declining — Unit 201",
    description: "Cooling efficiency has dropped 18% over the past 30 days based on runtime-to-temperature-delta analysis. System is still maintaining setpoint but working harder. Filter likely needs replacement.",
    recommendation: "Schedule filter replacement during next routine maintenance. Monitor for further decline — if efficiency drops below 70%, escalate to warning.",
    createdAt: hoursAgo(12),
    acknowledgedAt: null,
    resolvedAt: null,
    assignedTo: null,
  },
  {
    id: 10,
    unitId: 14,
    propertyId: 2,
    type: 'humidity',
    severity: 'info',
    title: "Humidity Trending Up — Oak Ridge B",
    description: "Average daily humidity in Unit B has increased from 52% to 61% over the past two weeks. Currently within acceptable range but trending toward the 70% threshold. Seasonal change or behavioral shift.",
    recommendation: "No immediate action needed. Add to watchlist. If trend continues for another week, inspect ventilation and recommend dehumidifier to tenant.",
    createdAt: hoursAgo(24),
    acknowledgedAt: null,
    resolvedAt: null,
    assignedTo: null,
  },
  {
    id: 11,
    unitId: 49,
    propertyId: 10,
    type: 'temperature',
    severity: 'info',
    title: "Thermostat Schedule Mismatch — DS House A",
    description: "Thermostat at Dripping Springs House A has been maintaining 74°F 24/7 despite no bookings for the past 5 days. Energy waste estimated at $4.20/day compared to vacant-mode setback of 60°F.",
    recommendation: "Set thermostat to vacant mode (60°F heat / 85°F cool) until next booking. Consider enabling auto-vacancy detection.",
    createdAt: hoursAgo(48),
    acknowledgedAt: null,
    resolvedAt: null,
    assignedTo: null,
  },
  {
    id: 12,
    unitId: 40,
    propertyId: 7,
    type: 'hvac',
    severity: 'info',
    title: "Filter Change Due — Riverside #2",
    description: "HVAC filter in Unit 2 has been running for 92 days. Manufacturer recommends replacement every 90 days. Airflow restriction hasn't impacted performance yet but will soon.",
    recommendation: "Replace filter during next routine visit. Stock: 16x25x1 MERV-8 filters.",
    createdAt: hoursAgo(36),
    acknowledgedAt: null,
    resolvedAt: null,
    assignedTo: null,
  },

  // RESOLVED alerts (recent)
  {
    id: 13,
    unitId: 9,
    propertyId: 1,
    type: 'leak',
    severity: 'critical',
    title: "Water Leak — Unit 301",
    description: "Bathroom supply line leak detected and repaired. Plumber replaced corroded fitting. Damage limited to subfloor — no drywall replacement needed.",
    recommendation: "Monitor sensor readings for 72 hours post-repair. Schedule follow-up inspection next week.",
    createdAt: daysAgo(2),
    acknowledgedAt: daysAgo(2),
    resolvedAt: hoursAgo(18),
    assignedTo: "Mike (maintenance)",
  },
  {
    id: 14,
    unitId: 17,
    propertyId: 2,
    type: 'offline',
    severity: 'warning',
    title: "Sensor Reconnected — Oak Ridge E",
    description: "Hub firmware update caused 4-hour communication loss. All sensors back online after automatic reconnection.",
    recommendation: "No further action needed. Firmware update completed successfully.",
    createdAt: daysAgo(1),
    acknowledgedAt: daysAgo(1),
    resolvedAt: hoursAgo(22),
    assignedTo: null,
  },
  {
    id: 15,
    unitId: 27,
    propertyId: 4,
    type: 'hvac',
    severity: 'warning',
    title: "HVAC Repaired — Highland Park #1",
    description: "Capacitor replaced on outdoor condenser unit. System now cycling normally with expected runtime intervals.",
    recommendation: "Monitor for 48 hours. If short-cycling returns, compressor may need deeper inspection.",
    createdAt: daysAgo(3),
    acknowledgedAt: daysAgo(3),
    resolvedAt: daysAgo(1),
    assignedTo: "Mike (maintenance)",
  },
  {
    id: 16,
    unitId: 21,
    propertyId: 3,
    type: 'temperature',
    severity: 'critical',
    title: "Heating Restored — Lakewood 1A",
    description: "Gas valve was stuck in closed position. Technician freed the valve and confirmed normal flame sensor operation. Unit heating normally.",
    recommendation: "Schedule gas valve replacement within 30 days as preventive measure.",
    createdAt: daysAgo(4),
    acknowledgedAt: daysAgo(4),
    resolvedAt: daysAgo(2),
    assignedTo: "Sarah (maintenance)",
  },
  {
    id: 17,
    unitId: 32,
    propertyId: 5,
    type: 'power',
    severity: 'warning',
    title: "Power Restored — Cabin B",
    description: "GFCI outlet in bathroom tripped due to moisture. Reset outlet, sealed gap around exterior conduit entry point.",
    recommendation: "Monitor GFCI trips. If recurring, may indicate ongoing moisture intrusion.",
    createdAt: daysAgo(5),
    acknowledgedAt: daysAgo(5),
    resolvedAt: daysAgo(4),
    assignedTo: "Mike (maintenance)",
  },
];

// --- Import Schemas ---

export const importPropertySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  type: z.enum(['multifamily', 'sfr', 'vacation']).default('multifamily'),
  units: z.array(z.object({
    unitNumber: z.string().default("Main"),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
  })).default([{ unitNumber: "Main" }]),
});

export const importBatchSchema = z.object({
  properties: z.array(importPropertySchema).min(1),
});

export type ImportProperty = z.infer<typeof importPropertySchema>;
export type ImportBatch = z.infer<typeof importBatchSchema>;

// Helper: unused placeholder types for drizzle compatibility
export type InsertUser = { username: string; password: string };
export type User = { id: string; username: string; password: string };
