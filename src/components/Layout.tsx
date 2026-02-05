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
  MessageSquare,
  Info,
  FileText as FileTextIcon,
  AlertCircle,
  Sparkles,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import { useSubscription } from "@/hooks/useSubscription";
 import { useAdmin } from "@/hooks/useAdmin";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { FarmSwitcher } from "@/components/FarmSwitcher";
import farmBackground from "@/assets/farm-background.jpg";

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Animal Sale", href: "/animal-sale", icon: CreditCard },
  { name: "Ask a Pro", href: "/ask-a-pro", icon: Sparkles },
  { name: "Audit & Compliance", href: "/audit", icon: ClipboardCheck },
  { name: "Employees", href: "/employees", icon: UserCog },
  { name: "Farm Expenses", href: "/expenses", icon: Receipt },
  { name: "Farm Inventory", href: "/inventory", icon: Package },
  { name: "Feeding Schedule", href: "/feeding", icon: Clock },
  { name: "Health Records", href: "/health", icon: Stethoscope },
  { name: "Livestock", href: "/livestock", icon: PawPrint },
  { name: "Market Area", href: "/market", icon: TrendingUp },
  { name: "Reports", href: "/reports", icon: BarChart3 },
   { name: "Tracking", href: "/tracking", icon: MapPin, proOnly: true },
];


const settingsNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

 const adminNavigation = [
   { name: "Admin Dashboard", href: "/admin", icon: Shield },
 ];
 
const complianceNavigation = [
  { name: "Chemicals & Remedies", href: "/compliance/chemicals", icon: Beaker },
  { name: "Compliance Dashboard", href: "/compliance", icon: Shield },
  { name: "Document Vault", href: "/compliance/documents", icon: FileText },
  { name: "Labour & OHS", href: "/compliance/labour-ohs", icon: Users },
];

const informationNavigation = [
  { name: "About Us", href: "/about", icon: Info },
  { name: "Contact Us", href: "/contact", icon: MessageSquare },
  { name: "Disclaimer", href: "/disclaimer", icon: AlertCircle },
  { name: "Pricing & Plans", href: "/pricing", icon: CreditCard },
  { name: "Terms of Service", href: "/terms", icon: FileTextIcon },
];

// Routes that are in the sidebar navigation (main pages)
const mainNavigationPaths = [
  "/dashboard",
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
  "/ask-a-pro",
  "/compliance",
  "/compliance/documents",
  "/compliance/labour-ohs",
  "/compliance/chemicals",
  "/compliance/audit-pack",
  "/settings",
   "/admin",
  "/about",
  "/contact",
  "/terms",
  "/disclaimer",
  "/auth",
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { farm } = useFarm();
  const { subscription, isActive } = useSubscription();
   const { isAdmin } = useAdmin();
  
  // Only show back button on sub-pages (not main navigation pages)
  const showBackButton = !mainNavigationPaths.includes(location.pathname);

  // Preserve sidebar scroll position across navigations
  const navRef = useRef<HTMLElement>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    // Restore scroll position after navigation
    if (navRef.current) {
      navRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [location.pathname]);

  const handleNavClick = () => {
    // Save current scroll position before navigation
    if (navRef.current) {
      scrollPositionRef.current = navRef.current.scrollTop;
    }
    setSidebarOpen(false);
  };

  return (
    <div 
      className="h-screen flex overflow-hidden farm-background"
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
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-300 ease-in-out lg:transform-none overflow-hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo - Links to home/dashboard */}
          <Link 
            to={user ? "/dashboard" : "/"} 
            className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border flex-shrink-0 hover:bg-sidebar-accent/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Wheat className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-sidebar-foreground font-display">
                HerdSync
              </h1>
              <FarmSwitcher />
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSidebarOpen(false);
              }}
              className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </Link>

          {/* Navigation */}
          <nav ref={navRef} className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleNavClick}
                  className={cn("sidebar-nav-item", isActive && "active")}
                >
                  <item.icon className="w-5 h-5" />
                   <span className="font-medium">{item.name}</span>
                   {item.proOnly && (
                     <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                       PRO
                     </Badge>
                   )}
                </Link>
              );
            })}

            {/* Settings Section */}
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                Account
              </p>
              {settingsNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={handleNavClick}
                    className={cn("sidebar-nav-item", isActive && "active")}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
               {isAdmin && adminNavigation.map((item) => {
                 const isActiveNav = location.pathname === item.href;
                 return (
                   <Link
                     key={item.name}
                     to={item.href}
                      onClick={handleNavClick}
                     className={cn("sidebar-nav-item", isActiveNav && "active")}
                   >
                     <item.icon className="w-5 h-5 text-primary" />
                     <span className="font-medium">{item.name}</span>
                   </Link>
                 );
               })}
            </div>

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
                    onClick={handleNavClick}
                    className={cn("sidebar-nav-item", isActive && "active")}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Information Section */}
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                Information
              </p>
              {informationNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={handleNavClick}
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
          <div className="px-4 py-3 border-t border-sidebar-border flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <span className="text-xs font-semibold text-sidebar-foreground">
                    {user.email?.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">
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
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <Wheat className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg font-display">HerdSync</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
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
