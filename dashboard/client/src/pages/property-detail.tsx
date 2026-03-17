import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Property, Unit, Alert } from "@shared/schema";
import { TopBar } from "@/components/TopBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "wouter";
import { ArrowLeft, Home, Droplets, Thermometer, Fan, Zap, WifiOff, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PortfolioStats } from "@shared/schema";

const ALERT_ICONS: Record<string, typeof Droplets> = {
  leak: Droplets,
  temperature: Thermometer,
  humidity: Droplets,
  hvac: Fan,
  power: Zap,
  offline: WifiOff,
};

const STATUS_COLORS: Record<string, string> = {
  occupied: "bg-success/20 text-success",
  vacant: "bg-warning/20 text-warning",
  turnover: "bg-info/20 text-info",
};

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const propertyId = parseInt(params.id || "0");

  const { data: stats, isLoading: statsLoading } = useQuery<PortfolioStats>({
    queryKey: ["/api/stats"],
  });

  const { data, isLoading } = useQuery<{ property: Property; units: Unit[]; alerts: Alert[] }>({
    queryKey: ["/api/properties", propertyId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/properties/${propertyId}`);
      return res.json();
    },
    enabled: propertyId > 0,
  });

  return (
    <div className="min-h-screen" data-testid="property-detail-page">
      <TopBar stats={stats} isLoading={statsLoading} />

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-4">
        <Link href="/properties">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" data-testid="back-to-properties">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Properties
          </Button>
        </Link>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="space-y-2 mt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          </div>
        ) : data ? (
          <div>
            <h2 className="text-lg font-bold" data-testid="property-name">{data.property.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{data.property.address}</p>

            {/* Units */}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Units · {data.units.length}
            </h3>
            <div className="space-y-1.5 mb-6">
              {data.units.map((unit) => {
                const unitAlerts = data.alerts.filter(
                  (a) => a.unitId === unit.id && !a.resolvedAt
                );
                return (
                  <div
                    key={unit.id}
                    className="bg-card rounded-lg px-3 py-2.5 flex items-center gap-3"
                    data-testid={`unit-item-${unit.id}`}
                  >
                    <Home className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Unit {unit.unitNumber}</p>
                      <Badge variant="secondary" className={`text-[10px] h-4 px-1.5 mt-0.5 ${STATUS_COLORS[unit.status]}`}>
                        {unit.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {unitAlerts.map((alert) => {
                        const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
                        return (
                          <div
                            key={alert.id}
                            className={`w-7 h-7 rounded flex items-center justify-center ${
                              alert.severity === "critical" ? "bg-destructive/10 text-destructive" :
                              alert.severity === "warning" ? "bg-warning/10 text-warning" :
                              "bg-info/10 text-info"
                            }`}
                            title={alert.title}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        );
                      })}
                      {unitAlerts.length === 0 && (
                        <CheckCircle className="w-4 h-4 text-success/50" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active alerts for this property */}
            {data.alerts.filter((a) => !a.resolvedAt).length > 0 && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Active Alerts
                </h3>
                <div className="space-y-1.5">
                  {data.alerts
                    .filter((a) => !a.resolvedAt)
                    .map((alert) => {
                      const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
                      return (
                        <div
                          key={alert.id}
                          className={`bg-card rounded-lg px-3 py-2.5 flex items-center gap-3 border-l-[3px] ${
                            alert.severity === "critical" ? "border-l-destructive" :
                            alert.severity === "warning" ? "border-l-warning" :
                            "border-l-info"
                          }`}
                          data-testid={`property-alert-${alert.id}`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${
                            alert.severity === "critical" ? "text-destructive" :
                            alert.severity === "warning" ? "text-warning" :
                            "text-info"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{alert.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{alert.description.slice(0, 80)}...</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Property not found.</p>
        )}
      </main>
    </div>
  );
}
