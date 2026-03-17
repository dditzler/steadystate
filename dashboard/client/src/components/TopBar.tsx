import { SteadyStateLogo } from "./SteadyStateLogo";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortfolioStats } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { DesktopNav } from "./DesktopNav";

function formatDate() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface TopBarProps {
  stats?: PortfolioStats;
  isLoading?: boolean;
}

export function TopBar({ stats, isLoading }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm"
      data-testid="top-bar"
    >
      <div className="max-w-2xl mx-auto px-4 py-3 md:max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Logo + brand */}
          <div className="flex items-center gap-2.5">
            <SteadyStateLogo className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none">
                SteadyState
              </h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5 hidden sm:block">
                {formatDate()} · {formatTime()}
              </p>
            </div>
          </div>

          {/* Center: Desktop nav */}
          <DesktopNav />

          {/* Right: Stats + theme toggle */}
          <div className="flex items-center gap-3">
            {/* Portfolio health summary */}
            {isLoading ? (
              <Skeleton className="h-5 w-40 hidden sm:block" />
            ) : stats ? (
              <div
                className="hidden sm:flex items-center gap-2 text-xs font-medium"
                data-testid="portfolio-stats"
              >
                {stats.criticalCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse-dot" />
                    <span className="text-destructive">{stats.criticalCount} Critical</span>
                  </span>
                )}
                {stats.warningCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    <span className="text-warning">{stats.warningCount} Warnings</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-success">{stats.normalCount} Normal</span>
                </span>
              </div>
            ) : null}

            {/* Mobile compact stats */}
            {stats && (
              <div
                className="flex sm:hidden items-center gap-1.5 text-[10px] font-bold"
                data-testid="mobile-stats"
              >
                {stats.criticalCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse-dot" />
                    <span className="text-destructive">{stats.criticalCount}</span>
                  </span>
                )}
                {stats.warningCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                    <span className="text-warning">{stats.warningCount}</span>
                  </span>
                )}
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="text-success">{stats.normalCount}</span>
                </span>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-8 h-8"
              data-testid="theme-toggle"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
