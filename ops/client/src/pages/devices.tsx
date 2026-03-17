import { useQuery } from "@tanstack/react-query";
import type { Device } from "@shared/schema";
import { DEVICE_CATEGORIES } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import {
  Search,
  Wifi,
  WifiOff,
  AlertTriangle,
  XCircle,
  Signal,
  Battery,
  Thermometer,
  Droplets,
  MapPin,
  ChevronDown,
  ChevronRight,
  Radio,
  Cpu,
  Smartphone,
} from "lucide-react";

const statusConfig: Record<string, { icon: typeof Wifi; color: string; bgColor: string; label: string }> = {
  online: { icon: Wifi, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", label: "Online" },
  offline: { icon: WifiOff, color: "text-muted-foreground", bgColor: "bg-muted", label: "Offline" },
  warning: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30", label: "Warning" },
  error: { icon: XCircle, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30", label: "Error" },
};

const categoryBadge: Record<string, string> = {
  lab: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  pilot: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  demo: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  in_service: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  decommissioned: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const typeIcon: Record<string, typeof Wifi> = {
  wifi_hub: Wifi,
  cellular_hub: Smartphone,
  zigbee_sensor: Radio,
};

function parseSensorData(raw: string | null) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function timeSince(isoStr: string | null) {
  if (!isoStr) return "Never";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function BatteryIndicator({ level }: { level: number | null }) {
  if (level === null) return null;
  const color = level > 50 ? "text-emerald-500" : level > 20 ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex items-center gap-1 text-xs">
      <Battery className={`w-3.5 h-3.5 ${color}`} />
      <span className="tabular-nums">{level}%</span>
    </div>
  );
}

function SignalIndicator({ rssi }: { rssi: number | null }) {
  if (rssi === null || rssi === 0) return null;
  const bars = rssi > -50 ? 4 : rssi > -60 ? 3 : rssi > -70 ? 2 : 1;
  const color = bars >= 3 ? "text-emerald-500" : bars === 2 ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex items-center gap-1 text-xs">
      <Signal className={`w-3.5 h-3.5 ${color}`} />
      <span className="tabular-nums">{rssi}dBm</span>
    </div>
  );
}

function DeviceCard({ device }: { device: Device }) {
  const [open, setOpen] = useState(false);
  const status = statusConfig[device.status] || statusConfig.offline;
  const StatusIcon = status.icon;
  const TypeIcon = typeIcon[device.type] || Cpu;
  const sensors = parseSensorData(device.sensorData);
  const catObj = DEVICE_CATEGORIES.find((c) => c.id === device.category);

  return (
    <Card className="overflow-hidden" data-testid={`card-device-${device.id}`}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left p-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${status.bgColor}`}>
                <StatusIcon className={`w-4 h-4 ${status.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium truncate">{device.name}</span>
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 ${categoryBadge[device.category] || ""}`}>
                    {catObj?.label || device.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TypeIcon className="w-3 h-3" />
                    {device.serialNumber}
                  </span>
                  <span>· {timeSince(device.lastSeen)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <BatteryIndicator level={device.batteryLevel} />
                <SignalIndicator rssi={device.signalStrength} />
                {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0 border-t border-border/40">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {sensors?.temp !== undefined && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  <span className="tabular-nums">{sensors.temp}°F</span>
                </div>
              )}
              {sensors?.humidity !== undefined && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span className="tabular-nums">{sensors.humidity}%</span>
                </div>
              )}
              {sensors?.pressure !== undefined && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-xs text-muted-foreground">hPa</span>
                  <span className="tabular-nums">{sensors.pressure}</span>
                </div>
              )}
              {sensors?.vibration !== undefined && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-xs text-muted-foreground">Vib</span>
                  <span className="tabular-nums">{sensors.vibration}g</span>
                </div>
              )}
              {sensors?.leak !== undefined && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Droplets className={`w-3.5 h-3.5 ${sensors.leak ? "text-red-500" : "text-emerald-500"}`} />
                  <span>{sensors.leak ? "Leak detected" : "No leak"}</span>
                </div>
              )}
              {sensors?.occupied !== undefined && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-xs text-muted-foreground">Occ</span>
                  <span>{sensors.occupied ? "Yes" : "No"}</span>
                </div>
              )}
            </div>
            {device.locationAddress && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                <MapPin className="w-3 h-3" />
                <span>{device.locationName} · {device.locationAddress}</span>
              </div>
            )}
            {device.firmware && (
              <div className="text-xs text-muted-foreground mt-1">
                Firmware: {device.firmware} · Installed: {device.installedDate || "—"}
              </div>
            )}
            {device.notes && (
              <div className="text-xs mt-2 p-2 rounded bg-muted/50 text-muted-foreground">
                {device.notes}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function DevicesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: devices, isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const filtered = (devices || []).filter((d) => {
    const matchSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      (d.locationName || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.locationAddress || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.locationZip || "").includes(search) ||
      (d.locationRegion || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || d.category === categoryFilter;
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  // KPI counts
  const all = devices || [];
  const onlineCount = all.filter((d) => d.status === "online").length;
  const warningCount = all.filter((d) => d.status === "warning").length;
  const errorCount = all.filter((d) => d.status === "error").length;
  const offlineCount = all.filter((d) => d.status === "offline").length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-32" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header + KPIs */}
      <div className="p-4 pb-3 border-b border-border/60">
        <h1 className="text-lg font-semibold mb-3" data-testid="text-page-title">Device Fleet</h1>

        <div className="flex gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
            <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold tabular-nums">{all.length}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-sm font-semibold tabular-nums">{onlineCount}</span>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
          {warningCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 dark:bg-amber-900/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-sm font-semibold tabular-nums">{warningCount}</span>
              <span className="text-xs text-muted-foreground">Warning</span>
            </div>
          )}
          {errorCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-900/20">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-sm font-semibold tabular-nums">{errorCount}</span>
              <span className="text-xs text-muted-foreground">Error</span>
            </div>
          )}
          {offlineCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
              <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold tabular-nums">{offlineCount}</span>
              <span className="text-xs text-muted-foreground">Offline</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search name, serial, location, zip, region..."
              className="pl-8 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-devices"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm" data-testid="select-category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DEVICE_CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-sm" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Device list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filtered.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-12">
              No devices match your filters
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
