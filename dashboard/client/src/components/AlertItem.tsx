import { useState, useRef } from "react";
import type { Alert } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Property } from "@shared/schema";
import {
  Droplets,
  Thermometer,
  Fan,
  Zap,
  WifiOff,
  AlertTriangle,
  ChevronRight,
  Clock,
  CheckCircle,
  UserPlus,
  ClipboardList,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ALERT_ICONS: Record<string, typeof Droplets> = {
  leak: Droplets,
  temperature: Thermometer,
  humidity: Droplets,
  hvac: Fan,
  power: Zap,
  offline: WifiOff,
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

interface AlertItemProps {
  alert: Alert;
  expanded: boolean;
  onToggle: () => void;
  onAcknowledge: () => void;
  onResolve: () => void;
  onAssign: (assignee: string) => void;
  resolved?: boolean;
}

export function AlertItem({
  alert,
  expanded,
  onToggle,
  onAcknowledge,
  onResolve,
  onAssign,
  resolved = false,
}: AlertItemProps) {
  const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });
  const property = properties?.find((p) => p.id === alert.propertyId);

  const severityConfig = {
    critical: {
      border: "border-l-destructive",
      dot: "bg-destructive animate-pulse-dot",
      bg: resolved ? "bg-card/50" : "bg-card",
    },
    warning: {
      border: "border-l-warning",
      dot: "bg-warning",
      bg: resolved ? "bg-card/50" : "bg-card",
    },
    info: {
      border: "border-l-info",
      dot: "bg-info",
      bg: resolved ? "bg-card/50" : "bg-card",
    },
  };

  const config = severityConfig[alert.severity];

  // Touch handling for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - touchStartX.current;
    touchDeltaX.current = delta;
    // Limit swipe range
    const clamped = Math.max(-80, Math.min(80, delta));
    setSwipeOffset(clamped);
  };

  const handleTouchEnd = () => {
    if (touchDeltaX.current > 60 && !resolved) {
      // Swipe right = Acknowledge
      onAcknowledge();
    } else if (touchDeltaX.current < -60 && !resolved) {
      // Swipe left = Resolve
      onResolve();
    }
    setSwipeOffset(0);
    touchDeltaX.current = 0;
  };

  const team = ["Mike (maintenance)", "Sarah (maintenance)", "Tony (plumber)", "Jen (electrician)"];

  return (
    <div className="relative overflow-hidden rounded-lg" data-testid={`alert-item-${alert.id}`}>
      {/* Swipe action backgrounds */}
      {!resolved && (
        <>
          <div
            className="absolute inset-y-0 left-0 w-20 flex items-center justify-center bg-primary text-primary-foreground rounded-l-lg"
            style={{ opacity: swipeOffset > 20 ? 1 : 0 }}
          >
            <Eye className="w-5 h-5" />
          </div>
          <div
            className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-success text-success-foreground rounded-r-lg"
            style={{ opacity: swipeOffset < -20 ? 1 : 0 }}
          >
            <CheckCircle className="w-5 h-5" />
          </div>
        </>
      )}

      <div
        className={`relative border-l-[3px] ${config.border} ${config.bg} rounded-lg transition-transform duration-150 ease-out`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main row — always visible */}
        <button
          onClick={onToggle}
          className={`w-full text-left px-3 py-3 flex items-center gap-3 touch-target ${
            resolved ? "opacity-60" : ""
          }`}
          data-testid={`alert-toggle-${alert.id}`}
        >
          {/* Severity dot + icon */}
          <div className="flex-shrink-0 relative">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              resolved ? "bg-success/10" : 
              alert.severity === "critical" ? "bg-destructive/10" :
              alert.severity === "warning" ? "bg-warning/10" :
              "bg-info/10"
            }`}>
              {resolved ? (
                <CheckCircle className="w-4.5 h-4.5 text-success" />
              ) : (
                <Icon className={`w-4.5 h-4.5 ${
                  alert.severity === "critical" ? "text-destructive" :
                  alert.severity === "warning" ? "text-warning" :
                  "text-info"
                }`} />
              )}
            </div>
            {!resolved && alert.severity === "critical" && (
              <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${config.dot} ring-2 ring-card`} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold leading-tight truncate ${resolved ? "line-through decoration-muted-foreground/30" : ""}`}>
              {alert.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground truncate">
                {property?.name || "—"}
              </span>
              {alert.assignedTo && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                  {alert.assignedTo}
                </Badge>
              )}
            </div>
          </div>

          {/* Right side: time + chevron */}
          <div className="flex-shrink-0 flex items-center gap-1.5 text-muted-foreground">
            <span className="text-xs tabular-nums">
              {resolved ? timeAgo(alert.resolvedAt!) : timeAgo(alert.createdAt)}
            </span>
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-150 ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div
            className="px-3 pb-3 border-t border-border/50 mx-3 pt-3 space-y-3"
            data-testid={`alert-detail-${alert.id}`}
          >
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {alert.description}
            </p>

            {/* Recommendation */}
            <div className="bg-muted/50 rounded-md p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Recommendation
              </p>
              <p className="text-sm leading-relaxed">{alert.recommendation}</p>
            </div>

            {/* Status info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Created {timeAgo(alert.createdAt)}
              </span>
              {alert.acknowledgedAt && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Acknowledged {timeAgo(alert.acknowledgedAt)}
                </span>
              )}
              {alert.resolvedAt && (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle className="w-3 h-3" />
                  Resolved {timeAgo(alert.resolvedAt)}
                </span>
              )}
            </div>

            {/* Action buttons */}
            {!resolved && (
              <div className="flex items-center gap-2 flex-wrap">
                {!alert.acknowledgedAt && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcknowledge();
                    }}
                    className="h-8 text-xs"
                    data-testid={`acknowledge-${alert.id}`}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Acknowledge
                  </Button>
                )}
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAssignDialog(!showAssignDialog);
                    }}
                    className="h-8 text-xs"
                    data-testid={`assign-${alert.id}`}
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Assign
                  </Button>
                  {showAssignDialog && (
                    <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[180px]">
                      {team.map((person) => (
                        <button
                          key={person}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssign(person);
                            setShowAssignDialog(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md"
                          data-testid={`assign-option-${person.split(" ")[0].toLowerCase()}`}
                        >
                          {person}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs opacity-50"
                  disabled
                  data-testid={`work-order-${alert.id}`}
                >
                  <ClipboardList className="w-3 h-3 mr-1" />
                  Work Order
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve();
                  }}
                  className="h-8 text-xs bg-success hover:bg-success/90 text-success-foreground"
                  data-testid={`resolve-${alert.id}`}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Resolve
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
