import { useLocation, Link } from "wouter";
import { Bell, Building2, History, Settings } from "lucide-react";

export function DesktopNav() {
  const [location] = useLocation();

  const tabs = [
    { path: "/", label: "Today", icon: Bell },
    { path: "/properties", label: "Properties", icon: Building2 },
    { path: "/history", label: "History", icon: History },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/" || location === "";
    return location.startsWith(path);
  };

  return (
    <nav className="hidden md:flex items-center gap-1" data-testid="desktop-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.path);
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            data-testid={`desktop-nav-${tab.label.toLowerCase()}`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
