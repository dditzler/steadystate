import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Alert, Property, PortfolioStats } from "@shared/schema";
import { TopBar } from "@/components/TopBar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Droplets,
  Thermometer,
  Fan,
  Zap,
  WifiOff,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const ALERT_ICONS: Record<string, typeof Droplets> = {
  leak: Droplets,
  temperature: Thermometer,
  humidity: Droplets,
  hvac: Fan,
  power: Zap,
  offline: WifiOff,
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function HistoryPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<PortfolioStats>({
    queryKey: ["/api/stats"],
  });

  const { data: resolvedAlerts, isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts", "resolved"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/alerts?status=resolved");
      return res.json();
    },
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Group by day
  const grouped = (resolvedAlerts || [])
    .sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime())
    .reduce<Record<string, Alert[]>>((acc, alert) => {
      const day = formatDate(alert.resolvedAt!);
      if (!acc[day]) acc[day] = [];
      acc[day].push(alert);
      return acc;
    }, {});

  return (
    <div className="min-h-screen" data-testid="history-page">
      <TopBar stats={stats} isLoading={statsLoading} />

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-4">
        <h2 className="text-lg font-bold mb-3" data-testid="history-heading">History</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-muted-foreground" data-testid="history-empty">
            <p>No resolved alerts yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([day, alerts]) => (
              <div key={day}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  {day}
                </p>
                <div className="space-y-1">
                  {alerts.map((alert) => {
                    const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
                    const property = properties?.find((p) => p.id === alert.propertyId);
                    return (
                      <div
                        key={alert.id}
                        className="bg-card rounded-lg px-3 py-2.5 flex items-center gap-3 opacity-75"
                        data-testid={`history-item-${alert.id}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-success" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate line-through decoration-muted-foreground/30">
                            {alert.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {property?.name} · Resolved {formatTime(alert.resolvedAt!)}
                            {alert.assignedTo && ` · ${alert.assignedTo}`}
                          </p>
                        </div>
                        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
