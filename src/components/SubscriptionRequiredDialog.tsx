import { Link } from "react-router-dom";
import { Lock, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

type SubscriptionTier = "basic" | "starter" | "pro";

interface SubscriptionRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  requiredTier: SubscriptionTier;
  description?: string;
}

const tierLabels: Record<SubscriptionTier, string> = {
  basic: "Basic",
  starter: "Starter",
  pro: "Pro",
};

const tierDescriptions: Record<SubscriptionTier, string> = {
  basic: "Get started with essential farm management features.",
  starter: "Unlock more capacity and advanced features for growing farms.",
  pro: "Full access to all features including RFID tracking and unlimited usage.",
};

export function SubscriptionRequiredDialog({
  open,
  onOpenChange,
  featureName,
  requiredTier,
  description,
}: SubscriptionRequiredDialogProps) {
  if (!open) return null;

  return (
    <>
      {/* Semi-transparent backdrop that allows clicking through to sidebar */}
      <div 
        className="fixed inset-0 z-[10000] pointer-events-none"
        aria-hidden="true"
      >
        {/* Only dim the main content area, not the sidebar */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      </div>
      
      {/* Dialog positioned in center with highest z-index */}
      <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none">
        <div 
          className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 pointer-events-auto"
          role="dialog"
          aria-modal="false"
          aria-labelledby="subscription-dialog-title"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 id="subscription-dialog-title" className="text-xl font-bold font-display text-foreground">
              Upgrade to {tierLabels[requiredTier]}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {description || `${featureName} requires a ${tierLabels[requiredTier]} subscription or higher.`}
            </p>
          </div>

          {/* Plan info */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">{tierLabels[requiredTier]} Plan</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {tierDescriptions[requiredTier]}
            </p>
          </div>

          {/* Action button */}
          <Link to="/pricing" className="block">
            <Button className="w-full bg-gradient-primary gap-2">
              <Sparkles className="w-4 h-4" />
              View Plans & Upgrade
            </Button>
          </Link>
          
          {/* Helper text */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            You can still navigate using the sidebar menu
          </p>
        </div>
      </div>
    </>
  );
}
