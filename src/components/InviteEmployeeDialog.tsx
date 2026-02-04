import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, Copy, CheckCircle2, ChevronDown, AlertCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  farmId: string;
  onSuccess: () => void;
}

interface Permissions {
  can_view_livestock: boolean;
  can_view_feeding: boolean;
  can_add_feeding: boolean;
  can_view_health: boolean;
  can_add_health: boolean;
  can_view_inventory: boolean;
  can_add_inventory_usage: boolean;
  can_view_chemicals: boolean;
  can_add_chemical_usage: boolean;
  can_view_documents: boolean;
  can_upload_documents: boolean;
  can_view_tracking: boolean;
}

const defaultPermissions: Permissions = {
  can_view_livestock: true,
  can_view_feeding: true,
  can_add_feeding: true,
  can_view_health: true,
  can_add_health: true,
  can_view_inventory: true,
  can_add_inventory_usage: true,
  can_view_chemicals: true,
  can_add_chemical_usage: true,
  can_view_documents: false,
  can_upload_documents: false,
  can_view_tracking: true,
};

const generatePassword = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const generateUsernameSuggestions = (fullName: string): string[] => {
  const nameParts = fullName.toLowerCase().trim().split(/\s+/);
  if (nameParts.length === 0 || !nameParts[0]) return [];

  const firstName = nameParts[0].replace(/[^a-z]/g, "");
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].replace(/[^a-z]/g, "") : "";

  const suggestions: string[] = [];

  if (firstName && lastName) {
    suggestions.push(`${firstName}.${lastName}`);
    suggestions.push(`${firstName}_${lastName}`);
    suggestions.push(`${firstName[0]}${lastName}`);
    suggestions.push(`${firstName}${lastName[0]}`);
    suggestions.push(`${lastName}.${firstName}`);
  } else if (firstName) {
    suggestions.push(firstName);
    suggestions.push(`${firstName}1`);
  }

  return [...new Set(suggestions)].slice(0, 5);
};

export function InviteEmployeeDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  farmId,
  onSuccess,
}: InviteEmployeeDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"setup" | "success">("setup");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [copied, setCopied] = useState(false);

  // Fetch existing usernames to check for duplicates
  const { data: existingUsernames = [] } = useQuery({
    queryKey: ["employee-usernames", farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_users")
        .select("username");
      if (error) throw error;
      return data.map((u) => u.username.toLowerCase());
    },
    enabled: open,
  });

  // Generate suggestions based on employee name
  const usernameSuggestions = useMemo(() => {
    return generateUsernameSuggestions(employeeName);
  }, [employeeName]);

  // Check if username is already taken
  const isUsernameTaken = useMemo(() => {
    return existingUsernames.includes(username.toLowerCase().trim());
  }, [username, existingUsernames]);

  // Filter suggestions to show availability
  const suggestionsWithAvailability = useMemo(() => {
    return usernameSuggestions.map((suggestion) => ({
      username: suggestion,
      available: !existingUsernames.includes(suggestion.toLowerCase()),
    }));
  }, [usernameSuggestions, existingUsernames]);

  const handleClose = () => {
    setStep("setup");
    setUsername("");
    setPassword(generatePassword());
    setPermissions(defaultPermissions);
    setCopied(false);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!username.trim()) {
      toast({ title: "Username required", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.functions.invoke("create-employee-user", {
      body: {
        employee_id: employeeId,
        username: username.toLowerCase().trim(),
        password: password,
        farm_id: farmId,
        permissions: permissions,
      },
    });

    setLoading(false);

    if (error || data?.error) {
      toast({
        title: "Failed to create account",
        description: data?.error || error?.message,
        variant: "destructive",
      });
      return;
    }

    setStep("success");
    onSuccess();
  };

  const copyCredentials = () => {
    const text = `Username: ${username}\nPassword: ${password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Credentials copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const permissionGroups = [
    {
      title: "Livestock",
      permissions: [
        { key: "can_view_livestock" as keyof Permissions, label: "View livestock (no financial data)" },
      ],
    },
    {
      title: "Feeding",
      permissions: [
        { key: "can_view_feeding" as keyof Permissions, label: "View feeding schedule & logs" },
        { key: "can_add_feeding" as keyof Permissions, label: "Log feedings" },
      ],
    },
    {
      title: "Health Records",
      permissions: [
        { key: "can_view_health" as keyof Permissions, label: "View health records" },
        { key: "can_add_health" as keyof Permissions, label: "Add health records" },
      ],
    },
    {
      title: "Inventory & Supplies",
      permissions: [
        { key: "can_view_inventory" as keyof Permissions, label: "View inventory" },
        { key: "can_add_inventory_usage" as keyof Permissions, label: "Log inventory usage" },
      ],
    },
    {
      title: "Chemicals & Remedies",
      permissions: [
        { key: "can_view_chemicals" as keyof Permissions, label: "View chemicals" },
        { key: "can_add_chemical_usage" as keyof Permissions, label: "Log chemical applications" },
      ],
    },
    {
      title: "Documents",
      permissions: [
        { key: "can_view_documents" as keyof Permissions, label: "View documents" },
        { key: "can_upload_documents" as keyof Permissions, label: "Upload documents" },
      ],
    },
    {
      title: "Tracking",
      permissions: [
        { key: "can_view_tracking" as keyof Permissions, label: "View GPS tracking" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "setup" ? `Create Login for ${employeeName}` : "Account Created!"}
          </DialogTitle>
          <DialogDescription>
            {step === "setup"
              ? "Set up a username and choose what this employee can access."
              : "Share these credentials with the employee. They can use them to log in."}
          </DialogDescription>
        </DialogHeader>

        {step === "setup" && (
          <>
            <div className="space-y-6 py-4">
              {/* Credentials */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Based on: <span className="font-medium">{employeeName}</span>
                  </p>
                  
                  {/* Suggestions Popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between mb-2" type="button">
                        {username ? (
                          <span className="font-mono">{username}</span>
                        ) : (
                          <span className="text-muted-foreground">Select a suggested username...</span>
                        )}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]">
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                        Suggested usernames for {employeeName}
                      </div>
                      <div className="py-1">
                        {suggestionsWithAvailability.length > 0 ? (
                          suggestionsWithAvailability.map(({ username: suggestion, available }) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                if (available) {
                                  setUsername(suggestion);
                                }
                              }}
                              disabled={!available}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent ${
                                !available ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                              }`}
                            >
                              <span className="font-mono">{suggestion}</span>
                              <span className={`text-xs ${available ? "text-primary" : "text-destructive"}`}>
                                {available ? "✓ Available" : "✗ Taken"}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No suggestions available
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Manual input option */}
                  <div className="relative">
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
                      placeholder="Or type a custom username..."
                      className={isUsernameTaken && username ? "border-destructive pr-8" : ""}
                    />
                    {isUsernameTaken && username && (
                      <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                    )}
                  </div>
                  {isUsernameTaken && username ? (
                    <p className="text-xs text-destructive mt-1">
                      This username is already taken. Please choose another.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Letters, numbers, dots, underscores, and hyphens only
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setPassword(generatePassword())}
                  >
                    Generate new password
                  </Button>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Permissions</h4>
                <p className="text-xs text-muted-foreground">
                  Note: Employees cannot see any financial data (prices, costs, salaries, etc.)
                </p>

                {permissionGroups.map((group) => (
                  <div key={group.title} className="border rounded-lg p-3 space-y-2">
                    <h5 className="text-sm font-medium">{group.title}</h5>
                    {group.permissions.map((perm) => (
                      <div key={perm.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={perm.key}
                          checked={permissions[perm.key]}
                          onCheckedChange={(checked) =>
                            setPermissions((prev) => ({ ...prev, [perm.key]: checked === true }))
                          }
                        />
                        <Label htmlFor={perm.key} className="text-sm font-normal cursor-pointer">
                          {perm.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !username.trim() || isUsernameTaken}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Account
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "success" && (
          <div className="py-6 space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Username:</span>
                <span className="font-mono font-medium">{username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Password:</span>
                <span className="font-mono font-medium">{password}</span>
              </div>
            </div>

            <Button onClick={copyCredentials} variant="outline" className="w-full">
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Credentials
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Make sure to save these credentials. The password cannot be recovered later.
            </p>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
