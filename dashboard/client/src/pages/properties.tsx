import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Property, Alert } from "@shared/schema";
import { TopBar } from "@/components/TopBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Building2, ChevronRight, MapPin, Home, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortfolioStats } from "@shared/schema";

const TYPE_LABELS: Record<string, string> = {
  multifamily: "Multi-Family",
  sfr: "Single Family",
  vacation: "Vacation",
};

export default function PropertiesPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<PortfolioStats>({
    queryKey: ["/api/stats"],
  });

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: activeAlerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts", "active"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/alerts?status=active");
      return res.json();
    },
  });

  // Get worst severity for each property
  function getPropertyHealth(propertyId: number): { color: string; count: number; worst: string } {
    const alerts = (activeAlerts || []).filter((a) => a.propertyId === propertyId);
    const count = alerts.length;
    if (count === 0) return { color: "bg-success", count: 0, worst: "normal" };
    const hasCritical = alerts.some((a) => a.severity === "critical");
    if (hasCritical) return { color: "bg-destructive animate-pulse-dot", count, worst: "critical" };
    const hasWarning = alerts.some((a) => a.severity === "warning");
    if (hasWarning) return { color: "bg-warning", count, worst: "warning" };
    return { color: "bg-info", count, worst: "info" };
  }

  return (
    <div className="min-h-screen" data-testid="properties-page">
      <TopBar stats={stats} isLoading={statsLoading} />

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" data-testid="properties-heading">Properties</h2>
          <Link href="/import">
            <Button size="sm" variant="outline" className="gap-1.5" data-testid="import-properties-btn">
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(properties || []).map((property) => {
              const health = getPropertyHealth(property.id);
              return (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="block"
                  data-testid={`property-item-${property.id}`}
                >
                  <div className="bg-card rounded-lg px-3 py-3 flex items-center gap-3 touch-target hover:bg-muted/50 transition-colors">
                    {/* Health dot */}
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${health.color}`} />
                    </div>

                    {/* Property info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{property.name}</p>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                          {TYPE_LABELS[property.type]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {property.address}
                        </span>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-medium tabular-nums flex items-center gap-1">
                          <Home className="w-3 h-3 text-muted-foreground" />
                          {property.unitCount}
                        </p>
                        {health.count > 0 && (
                          <p className={`text-[10px] font-bold tabular-nums ${
                            health.worst === "critical" ? "text-destructive" :
                            health.worst === "warning" ? "text-warning" :
                            "text-info"
                          }`}>
                            {health.count} alert{health.count !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
