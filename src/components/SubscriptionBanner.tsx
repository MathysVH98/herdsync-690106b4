import { Link } from "react-router-dom";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

export function SubscriptionBanner() {
  const { user } = useAuth();
  const { subscription, isActive, isTrialing, daysRemaining, loading } = useSubscription();

  if (loading || !user || !subscription) return null;

  // Show upgrade prompt for trialing users with less than 7 days left
  if (isTrialing && daysRemaining <= 7 && daysRemaining > 0) {
    return (
      <div className="bg-accent border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">
                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left in your free trial
              </p>
              <p className="text-sm text-muted-foreground">
                Upgrade now to keep all your data and features
              </p>
            </div>
          </div>
          <Link to="/pricing">
            <Button size="sm" className="bg-gradient-primary">
              <Sparkles className="w-4 h-4 mr-2" />
              View Plans
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show expired trial warning
  if (!isActive && subscription.status === "expired") {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Your trial has expired</p>
              <p className="text-sm text-destructive/80">
                Subscribe to continue managing your farm
              </p>
            </div>
          </div>
          <Link to="/pricing">
            <Button size="sm" variant="destructive">
              Subscribe Now
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show trial badge for active trials with more than 7 days
  if (isTrialing && daysRemaining > 7) {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm">
            <span className="font-medium">🎉 Free Trial</span> —{" "}
            <span className="text-muted-foreground">
              {daysRemaining} days remaining
            </span>
          </p>
          <Link to="/pricing" className="text-sm text-primary hover:underline">
            View plans →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
