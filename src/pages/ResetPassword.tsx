import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wheat, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Updated!",
        description: "Your password has been successfully reset. You can now log in.",
      });
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <Link to="/" className="flex items-center justify-center gap-3 mb-8 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Wheat className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">HerdSync</h1>
              <p className="text-xs text-muted-foreground">Farm Management Made Simple</p>
            </div>
          </Link>
          <div className="card-elevated p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Invalid or Expired Link</h2>
            <p className="text-muted-foreground text-sm">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth">Back to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 hover:opacity-80 transition-opacity">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Wheat className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">HerdSync</h1>
            <p className="text-xs text-muted-foreground">Farm Management Made Simple</p>
          </div>
        </Link>

        <div className="card-elevated p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Set New Password</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter your new password below.</p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-primary text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
