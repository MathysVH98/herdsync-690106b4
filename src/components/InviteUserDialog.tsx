 import { useState } from "react";
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
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Mail, Crown, AlertCircle } from "lucide-react";
 import { useInvitedUsers } from "@/hooks/useInvitedUsers";
 import { useSubscription } from "@/hooks/useSubscription";
 import { Link } from "react-router-dom";
 
 interface InviteUserDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
   const [email, setEmail] = useState("");
   const [role, setRole] = useState("viewer");
   const { subscription } = useSubscription();
   const { canInvite, remainingSlots, limit, inviteUser, isInviting } = useInvitedUsers();
 
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !canInvite) return;
      
      inviteUser({ email: email.trim(), role }, {
        onSuccess: () => {
          setEmail("");
          setRole("viewer");
          onOpenChange(false);
        },
      });
    };
 
   const isStarterTier = subscription?.tier === "starter";
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Mail className="w-5 h-5" />
             Invite User
           </DialogTitle>
           <DialogDescription>
             Invite someone to access your farm with the same features as your current plan.
           </DialogDescription>
         </DialogHeader>
 
         {isStarterTier ? (
           <div className="py-6 text-center space-y-4">
             <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
               <Crown className="w-8 h-8 text-amber-600" />
             </div>
             <div>
               <h3 className="font-semibold text-lg">Upgrade to Invite Users</h3>
               <p className="text-sm text-muted-foreground mt-1">
                 The Starter plan doesn't include additional users. Upgrade to Basic (5 users) or Pro (unlimited) to invite others.
               </p>
             </div>
             <Button asChild className="w-full">
               <Link to="/pricing">View Pricing Plans</Link>
             </Button>
           </div>
         ) : (
           <form onSubmit={handleSubmit} className="space-y-4">
             {!canInvite && (
               <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                 <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                 <div>
                   <p className="font-medium">User limit reached</p>
                   <p className="text-xs opacity-80">
                     You've reached the maximum of {limit} users for your plan.{" "}
                     <Link to="/pricing" className="underline">
                       Upgrade to add more
                     </Link>
                   </p>
                 </div>
               </div>
             )}
 
             <div className="space-y-2">
               <Label htmlFor="email">Email Address</Label>
               <Input
                 id="email"
                 type="email"
                 placeholder="user@example.com"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 disabled={!canInvite}
               />
               <p className="text-xs text-muted-foreground">
                 {remainingSlots === 999999
                   ? "You can invite unlimited users with your Pro plan"
                   : `${remainingSlots} invitation${remainingSlots !== 1 ? "s" : ""} remaining on your plan`}
               </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={!canInvite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer — Can view farm data</SelectItem>
                    <SelectItem value="manager">Farm Manager — Can view all tasks & employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

             <DialogFooter>
               <Button
                 type="button"
                 variant="outline"
                 onClick={() => onOpenChange(false)}
               >
                 Cancel
               </Button>
               <Button type="submit" disabled={!email.trim() || !canInvite || isInviting}>
                 {isInviting ? "Sending..." : "Send Invitation"}
               </Button>
             </DialogFooter>
           </form>
         )}
       </DialogContent>
     </Dialog>
   );
 }