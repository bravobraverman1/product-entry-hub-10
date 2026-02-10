import { NavLink } from "react-router-dom";
import { Coffee, ClipboardList, Truck, Settings, PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Form", icon: ClipboardList, end: true },
  { to: "/loading-dock", label: "Loading Dock", icon: Truck },
  { to: "/product-options", label: "Product Options", icon: PackageSearch },
  { to: "/admin", label: "Admin", icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3 justify-center">
          <Coffee className="h-5 w-5 text-primary shrink-0" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Lighting Style Data Entry
            </h1>
            <p className="text-xs text-muted-foreground">
              Product catalog management
            </p>
          </div>
        </div>
        {/* Tab Navigation */}
        <nav className="max-w-5xl mx-auto px-4 flex gap-0 border-t border-border">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="max-w-5xl mx-auto px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            One SKU per submission • Required fields marked with *
          </p>
        </div>
      </footer>
    </div>
  );
}
