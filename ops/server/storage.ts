import type { Lead, InsertLead, Activity, InsertActivity, Device, InsertDevice } from "@shared/schema";

export interface IStorage {
  // Leads
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;

  // Activities
  getActivities(leadId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Devices
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: number, device: Partial<InsertDevice>): Promise<Device | undefined>;
  deleteDevice(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private leads: Map<number, Lead> = new Map();
  private activities: Map<number, Activity> = new Map();
  private devices: Map<number, Device> = new Map();
  private nextLeadId = 1;
  private nextActivityId = 1;
  private nextDeviceId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed leads
    const sampleLeads: InsertLead[] = [
      { company: "Greenfield Property Group", contactName: "Sarah Chen", contactEmail: "sarah@greenfieldpg.com", contactPhone: "(512) 555-0134", doorCount: 85, region: "Austin, TX", zipCode: "78701", pmSoftware: "AppFolio", source: "Website", stage: "demo_scheduled", priority: "hot", notes: "Interested in pilot program. Has 3 properties with HVAC issues.", assignedTo: "Mike D.", nextAction: "Confirm demo for Thursday", nextActionDate: "2026-03-19", lastContactDate: "2026-03-15", estimatedValue: 59500 },
      { company: "Pacific Heights Management", contactName: "David Nakamura", contactEmail: "david@pacificheightsmgmt.com", contactPhone: "(415) 555-0198", doorCount: 142, region: "San Francisco, CA", zipCode: "94115", pmSoftware: "AppFolio", source: "AppFolio Marketplace", stage: "proposal", priority: "hot", notes: "Large portfolio. Wants cellular variant for older buildings without WiFi.", assignedTo: "Mike D.", nextAction: "Follow up on proposal", nextActionDate: "2026-03-18", lastContactDate: "2026-03-14", estimatedValue: 99400 },
      { company: "Heartland Rentals LLC", contactName: "Tom Baker", contactEmail: "tom@heartlandrentals.com", contactPhone: "(816) 555-0267", doorCount: 45, region: "Kansas City, MO", zipCode: "64108", pmSoftware: "Buildium", source: "Trade Show", stage: "contacted", priority: "medium", notes: "Met at PM Tech Expo. Interested but concerned about installation complexity.", assignedTo: "Mike D.", nextAction: "Send case study", nextActionDate: "2026-03-20", lastContactDate: "2026-03-12", estimatedValue: 31500 },
      { company: "Lakeview Apartments Inc", contactName: "Maria Rodriguez", contactEmail: "maria@lakeviewapts.com", contactPhone: "(312) 555-0342", doorCount: 200, region: "Chicago, IL", zipCode: "60614", pmSoftware: "AppFolio", source: "Referral", stage: "negotiation", priority: "high", notes: "Referred by Pacific Heights. Wants to start with 50-unit pilot.", assignedTo: "Mike D.", nextAction: "Finalize pilot terms", nextActionDate: "2026-03-17", lastContactDate: "2026-03-16", estimatedValue: 140000 },
      { company: "Sunshine State Properties", contactName: "James Wilson", contactEmail: "james@sunshinestateprops.com", contactPhone: "(305) 555-0456", doorCount: 67, region: "Miami, FL", zipCode: "33130", pmSoftware: "Propertyware", source: "LinkedIn Outreach", stage: "lead", priority: "medium", notes: "Responded to LinkedIn message. Handles mostly condos.", nextAction: "Initial discovery call", nextActionDate: "2026-03-21", estimatedValue: 46900 },
      { company: "Mountain West Realty", contactName: "Lisa Thompson", contactEmail: "lisa@mountainwestrealty.com", contactPhone: "(303) 555-0578", doorCount: 32, region: "Denver, CO", zipCode: "80202", pmSoftware: "Buildium", source: "Webinar", stage: "demo_done", priority: "medium", notes: "Attended webinar on predictive maintenance. Liked the concept but small portfolio.", assignedTo: "Mike D.", nextAction: "Send tailored pricing for small portfolios", nextActionDate: "2026-03-22", lastContactDate: "2026-03-13", estimatedValue: 22400 },
      { company: "Harbor Point Management", contactName: "Kevin O'Brien", contactEmail: "kevin@harborpointmgmt.com", contactPhone: "(617) 555-0691", doorCount: 120, region: "Boston, MA", zipCode: "02101", pmSoftware: "AppFolio", source: "Cold Email", stage: "contacted", priority: "low", notes: "Opened email but hasn't responded to follow-up.", assignedTo: "Mike D.", nextAction: "Second follow-up email", nextActionDate: "2026-03-23", lastContactDate: "2026-03-10", estimatedValue: 84000 },
      { company: "Desert Sun Properties", contactName: "Amanda Martinez", contactEmail: "amanda@desertsunprops.com", contactPhone: "(602) 555-0823", doorCount: 55, region: "Phoenix, AZ", zipCode: "85004", pmSoftware: "AppFolio", source: "AppFolio Marketplace", stage: "won", priority: "high", notes: "First paying customer! 10-unit pilot starting April 1.", assignedTo: "Mike D.", lastContactDate: "2026-03-16", estimatedValue: 38500 },
      { company: "Old Town Rentals", contactName: "Greg Foster", contactEmail: "greg@oldtownrentals.com", contactPhone: "(703) 555-0945", doorCount: 28, region: "Alexandria, VA", zipCode: "22314", pmSoftware: "RentManager", source: "Referral", stage: "lost", priority: "low", notes: "Decided to go with Minut for noise monitoring only.", lostReason: "Chose competitor (Minut)", lastContactDate: "2026-03-08", estimatedValue: 19600 },
      { company: "Bayview Capital Group", contactName: "Rachel Kim", contactEmail: "rachel@bayviewcapital.com", contactPhone: "(510) 555-1067", doorCount: 180, region: "Oakland, CA", zipCode: "94612", pmSoftware: "AppFolio", source: "Content Marketing", stage: "lead", priority: "high", notes: "Downloaded whitepaper on predictive maintenance ROI. High-value prospect.", nextAction: "Personalized outreach email", nextActionDate: "2026-03-18", estimatedValue: 126000 },
    ];

    for (const lead of sampleLeads) {
      this.createLead(lead);
    }

    // Seed activities
    const sampleActivities: InsertActivity[] = [
      { leadId: 1, type: "email", description: "Sent intro email with product overview deck", date: "2026-03-10", createdBy: "Mike D." },
      { leadId: 1, type: "call", description: "Discovery call - 30 min. Very interested in HVAC monitoring specifically", date: "2026-03-13", createdBy: "Mike D." },
      { leadId: 1, type: "meeting", description: "Demo scheduled for March 19 at 2pm CT", date: "2026-03-15", createdBy: "Mike D." },
      { leadId: 2, type: "email", description: "Inbound from AppFolio marketplace listing", date: "2026-03-08", createdBy: "System" },
      { leadId: 2, type: "demo", description: "Full product demo - showed dashboard, sensors, alerts", date: "2026-03-11", createdBy: "Mike D." },
      { leadId: 2, type: "proposal", description: "Sent proposal for 142-unit deployment with cellular option", date: "2026-03-14", createdBy: "Mike D." },
      { leadId: 4, type: "email", description: "Referral intro from David at Pacific Heights", date: "2026-03-10", createdBy: "Mike D." },
      { leadId: 4, type: "demo", description: "Full demo + Q&A with maintenance team", date: "2026-03-13", createdBy: "Mike D." },
      { leadId: 4, type: "note", description: "They want to start with 50 units across 2 properties to validate before full rollout", date: "2026-03-16", createdBy: "Mike D." },
      { leadId: 8, type: "email", description: "First customer signed! 10-unit pilot agreement", date: "2026-03-16", createdBy: "Mike D." },
    ];

    for (const activity of sampleActivities) {
      this.createActivity(activity);
    }

    // Seed devices
    const sampleDevices: InsertDevice[] = [
      { serialNumber: "SS-W-001", name: "Lab Unit Alpha", type: "wifi_hub", firmware: "0.3.1", status: "online", category: "lab", locationName: "Home Office Lab", locationAddress: "Austin, TX", locationZip: "78701", locationRegion: "Austin, TX", lastSeen: "2026-03-16T22:05:00Z", batteryLevel: 100, signalStrength: -45, sensorData: JSON.stringify({ temp: 72.4, humidity: 48, pressure: 1013.2, vibration: 0.02 }), installedDate: "2026-02-01" },
      { serialNumber: "SS-W-002", name: "Lab Unit Beta", type: "wifi_hub", firmware: "0.3.1", status: "online", category: "lab", locationName: "Home Office Lab", locationAddress: "Austin, TX", locationZip: "78701", locationRegion: "Austin, TX", lastSeen: "2026-03-16T22:04:30Z", batteryLevel: 100, signalStrength: -42, sensorData: JSON.stringify({ temp: 71.8, humidity: 49, pressure: 1013.1, vibration: 0.01 }), installedDate: "2026-02-01" },
      { serialNumber: "SS-W-003", name: "Lab Cellular Test", type: "cellular_hub", firmware: "0.2.8", status: "warning", category: "lab", locationName: "Home Office Lab", locationAddress: "Austin, TX", locationZip: "78701", locationRegion: "Austin, TX", lastSeen: "2026-03-16T21:30:00Z", batteryLevel: 78, signalStrength: -72, sensorData: JSON.stringify({ temp: 73.1, humidity: 52, pressure: 1013.0, vibration: 0.03 }), notes: "Intermittent cellular connection - testing antenna placement", installedDate: "2026-02-15" },
      { serialNumber: "SS-W-004", name: "Demo Unit 1", type: "wifi_hub", firmware: "0.3.1", status: "online", category: "demo", locationName: "Trade Show Kit", locationAddress: "Portable", locationZip: "78701", locationRegion: "Austin, TX", lastSeen: "2026-03-16T22:05:00Z", batteryLevel: 92, signalStrength: -55, sensorData: JSON.stringify({ temp: 70.2, humidity: 44, pressure: 1014.5, vibration: 0.00 }), installedDate: "2026-03-01" },
      { serialNumber: "SS-W-005", name: "Demo Unit 2", type: "wifi_hub", firmware: "0.3.1", status: "offline", category: "demo", locationName: "Trade Show Kit", locationAddress: "Portable", locationZip: "78701", locationRegion: "Austin, TX", lastSeen: "2026-03-14T18:00:00Z", batteryLevel: 15, signalStrength: 0, notes: "Needs charging before next demo", installedDate: "2026-03-01" },
      { serialNumber: "SS-P-001", name: "Desert Sun - Unit 101", type: "wifi_hub", firmware: "0.3.1", status: "online", category: "in_service", customerId: 8, locationName: "Desert Sun - Cactus Gardens", locationAddress: "1420 E Camelback Rd, Phoenix AZ", locationZip: "85014", locationRegion: "Phoenix, AZ", lastSeen: "2026-03-16T22:03:00Z", batteryLevel: 100, signalStrength: -48, sensorData: JSON.stringify({ temp: 76.8, humidity: 22, pressure: 1012.8, vibration: 0.04 }), installedDate: "2026-03-10" },
      { serialNumber: "SS-P-002", name: "Desert Sun - Unit 102", type: "wifi_hub", firmware: "0.3.1", status: "online", category: "in_service", customerId: 8, locationName: "Desert Sun - Cactus Gardens", locationAddress: "1420 E Camelback Rd, Phoenix AZ", locationZip: "85014", locationRegion: "Phoenix, AZ", lastSeen: "2026-03-16T22:04:00Z", batteryLevel: 100, signalStrength: -52, sensorData: JSON.stringify({ temp: 77.1, humidity: 21, pressure: 1012.7, vibration: 0.01 }), installedDate: "2026-03-10" },
      { serialNumber: "SS-P-003", name: "Desert Sun - Unit 205", type: "wifi_hub", firmware: "0.3.1", status: "error", category: "in_service", customerId: 8, locationName: "Desert Sun - Cactus Gardens", locationAddress: "1420 E Camelback Rd, Phoenix AZ", locationZip: "85014", locationRegion: "Phoenix, AZ", lastSeen: "2026-03-16T19:15:00Z", batteryLevel: 100, signalStrength: -68, sensorData: JSON.stringify({ temp: 84.2, humidity: 65, pressure: 1012.5, vibration: 0.12 }), notes: "High humidity alert - possible HVAC condensation issue", installedDate: "2026-03-10" },
      { serialNumber: "SS-P-004", name: "Desert Sun - Unit 308", type: "wifi_hub", firmware: "0.3.1", status: "online", category: "in_service", customerId: 8, locationName: "Desert Sun - Saguaro Villas", locationAddress: "2855 N 24th St, Phoenix AZ", locationZip: "85008", locationRegion: "Phoenix, AZ", lastSeen: "2026-03-16T22:05:00Z", batteryLevel: 100, signalStrength: -44, sensorData: JSON.stringify({ temp: 74.5, humidity: 25, pressure: 1012.9, vibration: 0.02 }), installedDate: "2026-03-12" },
      { serialNumber: "SS-P-005", name: "Desert Sun - Unit 312", type: "cellular_hub", firmware: "0.2.8", status: "online", category: "in_service", customerId: 8, locationName: "Desert Sun - Saguaro Villas", locationAddress: "2855 N 24th St, Phoenix AZ", locationZip: "85008", locationRegion: "Phoenix, AZ", lastSeen: "2026-03-16T22:02:00Z", batteryLevel: 95, signalStrength: -65, sensorData: JSON.stringify({ temp: 75.0, humidity: 24, pressure: 1012.8, vibration: 0.01 }), notes: "Cellular unit - no WiFi available in this building", installedDate: "2026-03-12" },
      { serialNumber: "SS-Z-001", name: "Aqara Leak Sensor - Unit 101", type: "zigbee_sensor", firmware: "1.0.2", status: "online", category: "in_service", customerId: 8, locationName: "Desert Sun - Cactus Gardens", locationAddress: "1420 E Camelback Rd, Phoenix AZ", locationZip: "85014", locationRegion: "Phoenix, AZ", lastSeen: "2026-03-16T22:00:00Z", batteryLevel: 88, sensorData: JSON.stringify({ leak: false }), installedDate: "2026-03-10" },
      { serialNumber: "SS-Z-002", name: "Sonoff Presence - Unit 101", type: "zigbee_sensor", firmware: "2.1.0", status: "online", category: "in_service", customerId: 8, locationName: "Desert Sun - Cactus Gardens", locationAddress: "1420 E Camelback Rd, Phoenix AZ", locationZip: "85014", locationRegion: "Phoenix, AZ", lastSeen: "2026-03-16T22:01:00Z", batteryLevel: 95, sensorData: JSON.stringify({ occupied: true }), installedDate: "2026-03-10" },
    ];

    for (const device of sampleDevices) {
      this.createDevice(device);
    }
  }

  // ── Leads ──
  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.nextLeadId++;
    const newLead: Lead = { id, ...lead, contactEmail: lead.contactEmail ?? null, contactPhone: lead.contactPhone ?? null, doorCount: lead.doorCount ?? null, region: lead.region ?? null, zipCode: lead.zipCode ?? null, pmSoftware: lead.pmSoftware ?? null, source: lead.source ?? null, priority: lead.priority ?? "medium", notes: lead.notes ?? null, assignedTo: lead.assignedTo ?? null, nextAction: lead.nextAction ?? null, nextActionDate: lead.nextActionDate ?? null, tags: lead.tags ?? null, lastContactDate: lead.lastContactDate ?? null, estimatedValue: lead.estimatedValue ?? null, lostReason: lead.lostReason ?? null };
    this.leads.set(id, newLead);
    return newLead;
  }

  async updateLead(id: number, update: Partial<InsertLead>): Promise<Lead | undefined> {
    const existing = this.leads.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...update };
    this.leads.set(id, updated);
    return updated;
  }

  async deleteLead(id: number): Promise<boolean> {
    return this.leads.delete(id);
  }

  // ── Activities ──
  async getActivities(leadId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(a => a.leadId === leadId);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.nextActivityId++;
    const newActivity: Activity = { id, ...activity, createdBy: activity.createdBy ?? null };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // ── Devices ──
  async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const id = this.nextDeviceId++;
    const newDevice: Device = { id, ...device, firmware: device.firmware ?? null, batteryLevel: device.batteryLevel ?? null, signalStrength: device.signalStrength ?? null, sensorData: device.sensorData ?? null, notes: device.notes ?? null, installedDate: device.installedDate ?? null, customerId: device.customerId ?? null, locationName: device.locationName ?? null, locationAddress: device.locationAddress ?? null, locationZip: device.locationZip ?? null, locationRegion: device.locationRegion ?? null, lastSeen: device.lastSeen ?? null };
    this.devices.set(id, newDevice);
    return newDevice;
  }

  async updateDevice(id: number, update: Partial<InsertDevice>): Promise<Device | undefined> {
    const existing = this.devices.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...update };
    this.devices.set(id, updated);
    return updated;
  }

  async deleteDevice(id: number): Promise<boolean> {
    return this.devices.delete(id);
  }
}

export const storage = new MemStorage();
