import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const WELCOME_DISMISSED_KEY = "herdsync_welcome_dismissed";

export function WelcomeDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if user has already dismissed the welcome dialog
    const dismissed = localStorage.getItem(`${WELCOME_DISMISSED_KEY}_${user.id}`);
    if (dismissed) return;

    // Check if user was created recently (within last 5 minutes) — new registration
    const createdAt = new Date(user.created_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (createdAt > fiveMinutesAgo) {
      setOpen(true);
    }
  }, [user]);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`${WELCOME_DISMISSED_KEY}_${user.id}`, "true");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-display">
            Welcome to HerdSync! 🎉
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Thank you for choosing HerdSync as your farm management partner. We're thrilled to have you on board!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Free Trial Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">Free Trial</Badge>
              <span className="text-sm font-medium text-foreground">14 Days — No Card Required</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Explore all HerdSync features free for 14 days. Manage your livestock, track health records, monitor feeding schedules, and much more.
            </p>
            <Link to="/pricing" onClick={handleDismiss}>
              <Button className="w-full gap-2">
                Start Your Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Have questions, suggestions, or ideas for improvement? We'd love to hear from you:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <a href="mailto:syncherd@gmail.com" className="text-primary hover:underline">
                  syncherd@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <a href="tel:+27783186923" className="text-primary hover:underline">
                  +27 78 318 6923
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  685 Keet Avenue, Les Marais, Pretoria, 0084
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button variant="ghost" onClick={handleDismiss}>
            Skip for now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
