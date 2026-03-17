import {
  type Property,
  type Unit,
  type Alert,
  type PortfolioStats,
  type PatchAlert,
  type ImportProperty,
  MOCK_PROPERTIES,
  MOCK_UNITS,
  MOCK_ALERTS,
} from "@shared/schema";

export interface IStorage {
  getAlerts(status?: 'active' | 'resolved' | 'all'): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | undefined>;
  patchAlert(id: number, data: PatchAlert): Promise<Alert | undefined>;
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<{ property: Property; units: Unit[]; alerts: Alert[] } | undefined>;
  getStats(): Promise<PortfolioStats>;
  addProperties(data: ImportProperty[]): Promise<{ propertiesAdded: number; unitsAdded: number }>;
}

export class MemStorage implements IStorage {
  private properties: Map<number, Property>;
  private units: Map<number, Unit>;
  private alerts: Map<number, Alert>;

  constructor() {
    this.properties = new Map();
    this.units = new Map();
    this.alerts = new Map();

    MOCK_PROPERTIES.forEach((p) => this.properties.set(p.id, { ...p }));
    MOCK_UNITS.forEach((u) => this.units.set(u.id, { ...u }));
    MOCK_ALERTS.forEach((a) => this.alerts.set(a.id, { ...a }));
  }

  async getAlerts(status?: 'active' | 'resolved' | 'all'): Promise<Alert[]> {
    const all = Array.from(this.alerts.values());
    if (!status || status === 'all') return all;
    if (status === 'resolved') return all.filter((a) => a.resolvedAt !== null);
    return all.filter((a) => a.resolvedAt === null);
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async patchAlert(id: number, data: PatchAlert): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    const updated = { ...alert, ...data };
    this.alerts.set(id, updated);
    return updated;
  }

  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getProperty(id: number): Promise<{ property: Property; units: Unit[]; alerts: Alert[] } | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;
    const units = Array.from(this.units.values()).filter((u) => u.propertyId === id);
    const alerts = Array.from(this.alerts.values()).filter((a) => a.propertyId === id);
    return { property, units, alerts };
  }

  async getStats(): Promise<PortfolioStats> {
    const allAlerts = Array.from(this.alerts.values());
    const active = allAlerts.filter((a) => a.resolvedAt === null);
    const allUnits = Array.from(this.units.values());
    const occupied = allUnits.filter((u) => u.status === 'occupied').length;

    return {
      totalProperties: this.properties.size,
      totalUnits: allUnits.length,
      criticalCount: active.filter((a) => a.severity === 'critical').length,
      warningCount: active.filter((a) => a.severity === 'warning').length,
      infoCount: active.filter((a) => a.severity === 'info').length,
      normalCount: allUnits.length - active.length,
      occupancyRate: Math.round((occupied / allUnits.length) * 100),
    };
  }

  async addProperties(data: ImportProperty[]): Promise<{ propertiesAdded: number; unitsAdded: number }> {
    let propertiesAdded = 0;
    let unitsAdded = 0;

    // Find max IDs
    let maxPropId = Math.max(0, ...Array.from(this.properties.keys()));
    let maxUnitId = Math.max(0, ...Array.from(this.units.keys()));

    for (const item of data) {
      maxPropId++;
      const propertyType = item.type || 'multifamily';
      const units = item.units || [{ unitNumber: "Main" }];

      const fullAddress = [item.address, item.city, item.state, item.zip].filter(Boolean).join(", ");

      const property: Property = {
        id: maxPropId,
        name: item.name,
        address: fullAddress,
        unitCount: units.length,
        type: propertyType,
      };
      this.properties.set(maxPropId, property);
      propertiesAdded++;

      for (const unit of units) {
        maxUnitId++;
        const u: Unit = {
          id: maxUnitId,
          propertyId: maxPropId,
          unitNumber: unit.unitNumber || "Main",
          status: 'vacant',
        };
        this.units.set(maxUnitId, u);
        unitsAdded++;
      }
    }

    return { propertiesAdded, unitsAdded };
  }
}

export const storage = new MemStorage();
