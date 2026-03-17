import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Alert, PortfolioStats } from "@shared/schema";
import { TopBar } from "@/components/TopBar";
import { AlertItem } from "@/components/AlertItem";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle } from "lucide-react";
import { useState } from "react";

export default function TodayPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<PortfolioStats>({
    queryKey: ["/api/stats"],
  });

  const { data: activeAlerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts", "active"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/alerts?status=active");
      return res.json();
    },
  });

  const { data: resolvedAlerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts", "resolved"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/alerts?status=resolved");
      return res.json();
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/alerts/${id}`, {
        acknowledgedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/alerts/${id}`, {
        resolvedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, assignee }: { id: number; assignee: string }) => {
      const res = await apiRequest("PATCH", `/api/alerts/${id}`, {
        assignedTo: assignee,
        acknowledgedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  // Sort active alerts: critical first, then warning, then info
  const sortedAlerts = (activeAlerts || []).sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const orderDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (orderDiff !== 0) return orderDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Recent resolved (last 7 days)
  const recentResolved = (resolvedAlerts || [])
    .sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime())
    .slice(0, 5);

  const criticalAlerts = sortedAlerts.filter((a) => a.severity === "critical");
  const warningAlerts = sortedAlerts.filter((a) => a.severity === "warning");
  const infoAlerts = sortedAlerts.filter((a) => a.severity === "info");

  return (
    <div className="min-h-screen" data-testid="today-page">
      <TopBar stats={stats} isLoading={statsLoading} />

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-4">
        {alertsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Critical alerts */}
            {criticalAlerts.length > 0 && (
              <div className="space-y-1" data-testid="critical-section">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive px-1 pb-1 pt-2">
                  Critical · {criticalAlerts.length}
                </p>
                {criticalAlerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    expanded={expandedId === alert.id}
                    onToggle={() =>
                      setExpandedId(expandedId === alert.id ? null : alert.id)
                    }
                    onAcknowledge={() => acknowledgeMutation.mutate(alert.id)}
                    onResolve={() => resolveMutation.mutate(alert.id)}
                    onAssign={(assignee) =>
                      assignMutation.mutate({ id: alert.id, assignee })
                    }
                  />
                ))}
              </div>
            )}

            {/* Warning alerts */}
            {warningAlerts.length > 0 && (
              <div className="space-y-1" data-testid="warning-section">
                <p className="text-xs font-semibold uppercase tracking-wider text-warning px-1 pb-1 pt-3">
                  Warnings · {warningAlerts.length}
                </p>
                {warningAlerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    expanded={expandedId === alert.id}
                    onToggle={() =>
                      setExpandedId(expandedId === alert.id ? null : alert.id)
                    }
                    onAcknowledge={() => acknowledgeMutation.mutate(alert.id)}
                    onResolve={() => resolveMutation.mutate(alert.id)}
                    onAssign={(assignee) =>
                      assignMutation.mutate({ id: alert.id, assignee })
                    }
                  />
                ))}
              </div>
            )}

            {/* Info/Predictive alerts */}
            {infoAlerts.length > 0 && (
              <div className="space-y-1" data-testid="info-section">
                <p className="text-xs font-semibold uppercase tracking-wider text-info px-1 pb-1 pt-3">
                  Predictive · {infoAlerts.length}
                </p>
                {infoAlerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    expanded={expandedId === alert.id}
                    onToggle={() =>
                      setExpandedId(expandedId === alert.id ? null : alert.id)
                    }
                    onAcknowledge={() => acknowledgeMutation.mutate(alert.id)}
                    onResolve={() => resolveMutation.mutate(alert.id)}
                    onAssign={(assignee) =>
                      assignMutation.mutate({ id: alert.id, assignee })
                    }
                  />
                ))}
              </div>
            )}

            {/* Resolved section */}
            {recentResolved.length > 0 && (
              <div className="space-y-1 pt-4" data-testid="resolved-section">
                <p className="text-xs font-semibold uppercase tracking-wider text-success px-1 pb-1 flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" />
                  Recently Resolved
                </p>
                {recentResolved.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    expanded={expandedId === alert.id}
                    onToggle={() =>
                      setExpandedId(expandedId === alert.id ? null : alert.id)
                    }
                    onAcknowledge={() => {}}
                    onResolve={() => {}}
                    onAssign={() => {}}
                    resolved
                  />
                ))}
              </div>
            )}

            {sortedAlerts.length === 0 && !alertsLoading && (
              <div className="text-center py-20 text-muted-foreground" data-testid="empty-state">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
                <p className="text-lg font-medium text-foreground">All clear</p>
                <p className="text-sm">No active alerts across your portfolio.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
