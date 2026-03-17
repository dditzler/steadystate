import { TopBar } from "@/components/TopBar";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import type { PortfolioStats } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  Bell,
  Moon,
  Sun,
  User,
  Shield,
  MessageSquare,
  HelpCircle,
  Upload,
  ChevronRight,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  const { data: stats, isLoading: statsLoading } = useQuery<PortfolioStats>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="min-h-screen" data-testid="settings-page">
      <TopBar stats={stats} isLoading={statsLoading} />

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-4">
        <h2 className="text-lg font-bold mb-4" data-testid="settings-heading">Settings</h2>

        {/* Profile section */}
        <div className="bg-card rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Property Manager</p>
              <p className="text-xs text-muted-foreground">demo@steadystate.io</p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-card rounded-lg divide-y divide-border">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Appearance
            </p>
          </div>
          <div className="px-4 py-3 flex items-center justify-between touch-target">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Sun className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-sm">Dark Mode</span>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              data-testid="dark-mode-switch"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-lg divide-y divide-border mt-3">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notifications
            </p>
          </div>
          <div className="px-4 py-3 flex items-center justify-between touch-target">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-sm">Critical Alerts</span>
                <p className="text-xs text-muted-foreground">Push + SMS for water leaks, power outages</p>
              </div>
            </div>
            <Switch defaultChecked data-testid="critical-notifications" />
          </div>
          <div className="px-4 py-3 flex items-center justify-between touch-target">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-sm">Warning Alerts</span>
                <p className="text-xs text-muted-foreground">Push notification for HVAC issues, sensors</p>
              </div>
            </div>
            <Switch defaultChecked data-testid="warning-notifications" />
          </div>
          <div className="px-4 py-3 flex items-center justify-between touch-target">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-sm">Daily Summary</span>
                <p className="text-xs text-muted-foreground">Morning email digest at 7 AM</p>
              </div>
            </div>
            <Switch defaultChecked data-testid="daily-summary" />
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-card rounded-lg divide-y divide-border mt-3">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data Management
            </p>
          </div>
          <Link href="/import">
            <div className="px-4 py-3 flex items-center justify-between touch-target hover:bg-muted/50 transition-colors cursor-pointer" data-testid="settings-import-properties">
              <div className="flex items-center gap-3">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm">Import Properties</span>
                  <p className="text-xs text-muted-foreground">Import from AppFolio, Buildium, or CSV</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        </div>

        {/* About */}
        <div className="bg-card rounded-lg divide-y divide-border mt-3">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              About
            </p>
          </div>
          <div className="px-4 py-3 flex items-center gap-3 touch-target">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="text-sm">SteadyState v0.1.0</span>
              <p className="text-xs text-muted-foreground">Property monitoring dashboard</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-3 touch-target">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Help & Support</span>
          </div>
        </div>
      </main>
    </div>
  );
}
