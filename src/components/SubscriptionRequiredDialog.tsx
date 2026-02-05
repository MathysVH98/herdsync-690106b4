 import { Link } from "react-router-dom";
 import { Lock, Sparkles, Crown } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 
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
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader className="text-center sm:text-center">
           <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
             <Lock className="w-8 h-8 text-primary" />
           </div>
           <DialogTitle className="text-xl font-display">
             Upgrade to {tierLabels[requiredTier]}
           </DialogTitle>
           <DialogDescription className="text-center">
             {description || `${featureName} requires a ${tierLabels[requiredTier]} subscription or higher.`}
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="bg-muted/50 rounded-lg p-4 border border-border">
             <div className="flex items-center gap-3 mb-2">
               <Crown className="w-5 h-5 text-primary" />
               <span className="font-semibold">{tierLabels[requiredTier]} Plan</span>
             </div>
             <p className="text-sm text-muted-foreground">
               {tierDescriptions[requiredTier]}
             </p>
           </div>
 
           <div className="flex flex-col gap-2">
             <Link to="/pricing" className="w-full">
               <Button className="w-full bg-gradient-primary gap-2">
                 <Sparkles className="w-4 h-4" />
                 View Plans & Upgrade
               </Button>
             </Link>
             <Button 
               variant="ghost" 
               onClick={() => onOpenChange(false)}
               className="w-full"
             >
               Maybe Later
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }