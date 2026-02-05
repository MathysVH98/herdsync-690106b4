 import { useState } from "react";
 import { Layout } from "@/components/Layout";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Settings as SettingsIcon, Users, Building, CreditCard, Crown } from "lucide-react";
 import { useFarm } from "@/hooks/useFarm";
 import { useSubscription } from "@/hooks/useSubscription";
 import { useAuth } from "@/hooks/useAuth";
 import { InvitedUsersManager } from "@/components/InvitedUsersManager";
 import { Link } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 export default function Settings() {
   const { farm } = useFarm();
   const { subscription } = useSubscription();
   const { user } = useAuth();
   const { toast } = useToast();
   const [farmName, setFarmName] = useState(farm?.name || "");
   const [isSaving, setIsSaving] = useState(false);
 
   const handleSaveFarm = async () => {
     if (!farm?.id || !farmName.trim()) return;
     setIsSaving(true);
     
     const { error } = await supabase
       .from("farms")
       .update({ name: farmName.trim() })
       .eq("id", farm.id);
 
     if (error) {
       toast({
         title: "Error updating farm",
         description: error.message,
         variant: "destructive",
       });
     } else {
       toast({ title: "Farm name updated" });
     }
     setIsSaving(false);
   };
 
   const getTierBadge = () => {
     switch (subscription?.tier) {
       case "pro":
         return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">Pro</Badge>;
       case "basic":
         return <Badge variant="secondary">Basic</Badge>;
       default:
         return <Badge variant="outline">Starter</Badge>;
     }
   };
 
   return (
     <Layout>
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
             <SettingsIcon className="w-8 h-8" />
             Settings
           </h1>
           <p className="text-muted-foreground">Manage your farm and account settings</p>
         </div>
 
         <Tabs defaultValue="users" className="w-full">
           <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
             <TabsTrigger value="users" className="flex items-center gap-2">
               <Users className="w-4 h-4" />
               <span className="hidden sm:inline">Users</span>
             </TabsTrigger>
             <TabsTrigger value="farm" className="flex items-center gap-2">
               <Building className="w-4 h-4" />
               <span className="hidden sm:inline">Farm</span>
             </TabsTrigger>
             <TabsTrigger value="subscription" className="flex items-center gap-2">
               <CreditCard className="w-4 h-4" />
               <span className="hidden sm:inline">Subscription</span>
             </TabsTrigger>
           </TabsList>
 
           <TabsContent value="users" className="mt-6">
             <InvitedUsersManager />
           </TabsContent>
 
           <TabsContent value="farm" className="mt-6">
             <Card>
               <CardHeader>
                 <CardTitle>Farm Details</CardTitle>
                 <CardDescription>Update your farm information</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="farmName">Farm Name</Label>
                   <Input
                     id="farmName"
                     value={farmName}
                     onChange={(e) => setFarmName(e.target.value)}
                     placeholder="My Farm"
                   />
                 </div>
                 <Button onClick={handleSaveFarm} disabled={isSaving || !farmName.trim()}>
                   {isSaving ? "Saving..." : "Save Changes"}
                 </Button>
               </CardContent>
             </Card>
           </TabsContent>
 
           <TabsContent value="subscription" className="mt-6">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center justify-between">
                   <span>Your Subscription</span>
                   {getTierBadge()}
                 </CardTitle>
                 <CardDescription>Manage your subscription and billing</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-1">
                     <p className="text-sm text-muted-foreground">Current Plan</p>
                     <p className="font-medium capitalize">{subscription?.tier || "None"}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-sm text-muted-foreground">Status</p>
                     <p className="font-medium capitalize">{subscription?.status || "Unknown"}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-sm text-muted-foreground">Animal Limit</p>
                     <p className="font-medium">
                       {subscription?.animal_limit === 999999 ? "Unlimited" : subscription?.animal_limit || 0}
                     </p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-sm text-muted-foreground">Days Remaining</p>
                     <p className="font-medium">{subscription?.days_remaining || 0} days</p>
                   </div>
                 </div>
 
                 {subscription?.tier !== "pro" && (
                   <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
                     <div className="flex items-start gap-3">
                       <Crown className="w-5 h-5 text-amber-600 mt-0.5" />
                       <div className="space-y-2">
                         <p className="font-medium">Upgrade to Pro</p>
                         <p className="text-sm text-muted-foreground">
                           Get unlimited animals, unlimited users, and access to all premium features.
                         </p>
                         <Button asChild size="sm">
                           <Link to="/pricing">View Plans</Link>
                         </Button>
                       </div>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </div>
     </Layout>
   );
 }