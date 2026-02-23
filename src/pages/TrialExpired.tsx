import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Clock, Sparkles, Shield, BarChart3, PawPrint, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import farmBackground from "@/assets/farm-background.jpg";

export default function TrialExpired() {
  const { user, signOut } = useAuth();
  const { subscription, loading, isActive } = useSubscription();

  if (!user) return <Navigate to="/auth" replace />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  // If subscription is active, send them to dashboard
  if (isActive) return <Navigate to="/dashboard" replace />;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${farmBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-primary">🐄 HerdSync</h1>
        </div>

        {/* Main card */}
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-destructive" />
          </div>

          <h2 className="text-2xl font-bold font-display text-foreground mb-2">
            Your Free Trial Has Ended
          </h2>
          <p className="text-muted-foreground mb-8">
            Thank you for trying HerdSync! Your 14-day trial period has expired.
            Subscribe to a plan to continue managing your farm and access all your data.
          </p>

          {/* Benefits reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
              <PawPrint className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground text-center">Livestock Management</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground text-center">Reports & Analytics</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground text-center">Compliance Tools</span>
            </div>
          </div>

          {/* CTA */}
          <Link to="/pricing" className="block mb-4">
            <Button className="w-full bg-gradient-primary gap-2 text-lg py-6">
              <Sparkles className="w-5 h-5" />
              View Plans & Subscribe
            </Button>
          </Link>

          <p className="text-xs text-muted-foreground mb-6">
            Your data is safe and waiting for you. Subscribe to pick up right where you left off.
          </p>

          {/* Sign out */}
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
