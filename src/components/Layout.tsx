import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PawPrint,
  Clock,
  Package,
  Stethoscope,
  BarChart3,
  MapPin,
  Menu,
  X,
  Wheat,
  ClipboardCheck,
  Shield,
  FileText,
  Users,
  Beaker,
  LogOut,
  TrendingUp,
  CreditCard,
  UserCog,
  ArrowLeft,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { FarmSwitcher } from "@/components/FarmSwitcher";
import farmBackground from "@/assets/farm-background.jpg";

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Livestock", href: "/livestock", icon: PawPrint },
  { name: "Employees", href: "/employees", icon: UserCog },
  { name: "Feeding Schedule", href: "/feeding", icon: Clock },
  { name: "Farm Inventory", href: "/inventory", icon: Package },
  { name: "Health Records", href: "/health", icon: Stethoscope },
  { name: "Farm Expenses", href: "/expenses", icon: Receipt },
  { name: "Market Area", href: "/market", icon: TrendingUp },
  { name: "Animal Sale", href: "/animal-sale", icon: CreditCard },
  { name: "Audit & Compliance", href: "/audit", icon: ClipboardCheck },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Tracking", href: "/tracking", icon: MapPin },
  { name: "Pricing & Plans", href: "/pricing", icon: CreditCard },
];

const complianceNavigation = [
  { name: "Compliance Dashboard", href: "/compliance", icon: Shield },
  { name: "Document Vault", href: "/compliance/documents", icon: FileText },
  { name: "Labour & OHS", href: "/compliance/labour-ohs", icon: Users },
  { name: "Chemicals & Remedies", href: "/compliance/chemicals", icon: Beaker },
];

// Routes that are in the sidebar navigation (main pages)
const mainNavigationPaths = [
  "/",
  "/livestock",
  "/employees", 
  "/feeding",
  "/inventory",
  "/health",
  "/expenses",
  "/market",
  "/animal-sale",
  "/audit",
  "/reports",
  "/tracking",
  "/pricing",
  "/compliance",
  "/compliance/documents",
  "/compliance/labour-ohs",
  "/compliance/chemicals",
  "/auth",
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { farm } = useFarm();
  
  // Only show back button on sub-pages (not main navigation pages)
  const showBackButton = !mainNavigationPaths.includes(location.pathname);

  return (
    <div 
      className="min-h-screen flex farm-background"
      style={{ '--farm-bg-image': `url(${farmBackground})` } as React.CSSProperties}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-sidebar transform transition-transform duration-300 ease-in-out lg:transform-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <Wheat className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-sidebar-foreground font-display">
                FarmTrack
              </h1>
              <FarmSwitcher />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn("sidebar-nav-item", isActive && "active")}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}

            {/* Compliance Section */}
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                Compliance (SA)
              </p>
              {complianceNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn("sidebar-nav-item", isActive && "active")}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-sidebar-border">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <span className="text-sm font-semibold text-sidebar-foreground">
                    {user.email?.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Wheat className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg font-display">FarmTrack</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8">
            <SubscriptionBanner />
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
