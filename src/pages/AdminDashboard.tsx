 import { useState, useEffect } from "react";
 import { Layout } from "@/components/Layout";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Shield, Clock, Users, Building, Plus, Minus } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAdmin } from "@/hooks/useAdmin";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { useNavigate } from "react-router-dom";
 import type { Database } from "@/integrations/supabase/types";
 
 type SubscriptionTier = Database["public"]["Enums"]["subscription_tier"];
 type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
 
 interface SubscriptionWithFarm {
   id: string;
   tier: SubscriptionTier;
   status: SubscriptionStatus;
   trial_ends_at: string;
   current_period_end: string | null;
   animal_limit: number;
   farm_id: string;
   user_id: string;
   farm_name: string | null;
   owner_email: string | null;
 }
 
 export default function AdminDashboard() {
   const { isAdmin, loading: adminLoading } = useAdmin();
   const { user, loading: authLoading } = useAuth();
   const { toast } = useToast();
   const navigate = useNavigate();
   
   const [subscriptions, setSubscriptions] = useState<SubscriptionWithFarm[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithFarm | null>(null);
   const [extendDays, setExtendDays] = useState<number>(7);
   const [newTier, setNewTier] = useState<SubscriptionTier>("basic");
   const [dialogOpen, setDialogOpen] = useState(false);
 
   useEffect(() => {
     if (!authLoading && !adminLoading) {
       if (!user) {
         navigate("/auth");
         return;
       }
       if (!isAdmin) {
         navigate("/dashboard");
         toast({
           title: "Access Denied",
           description: "You don't have permission to access the admin dashboard.",
           variant: "destructive",
         });
         return;
       }
       fetchSubscriptions();
     }
   }, [isAdmin, adminLoading, user, authLoading, navigate]);
 
   const fetchSubscriptions = async () => {
     setLoading(true);
     try {
       // Get all subscriptions with farm and user info
       const { data: subs, error } = await supabase
         .from("subscriptions")
         .select(`
           *,
           farms!inner(name, owner_id)
         `)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
 
       // Get user emails
       const userIds = [...new Set(subs?.map(s => s.user_id) || [])];
       
       const subscriptionsWithInfo: SubscriptionWithFarm[] = (subs || []).map(sub => ({
         id: sub.id,
         tier: sub.tier,
         status: sub.status,
         trial_ends_at: sub.trial_ends_at,
         current_period_end: sub.current_period_end,
         animal_limit: sub.animal_limit,
         farm_id: sub.farm_id,
         user_id: sub.user_id,
         farm_name: (sub.farms as { name: string })?.name || "Unknown",
         owner_email: null, // We can't access auth.users directly
       }));
 
       setSubscriptions(subscriptionsWithInfo);
     } catch (error) {
       console.error("Error fetching subscriptions:", error);
       toast({
         title: "Error",
         description: "Failed to load subscriptions",
         variant: "destructive",
       });
     }
     setLoading(false);
   };
 
   const handleExtendSubscription = async () => {
     if (!selectedSubscription) return;
 
     try {
       const currentEnd = selectedSubscription.current_period_end 
         ? new Date(selectedSubscription.current_period_end)
         : new Date(selectedSubscription.trial_ends_at);
       
       const newEnd = new Date(currentEnd);
       newEnd.setDate(newEnd.getDate() + extendDays);
 
       const { error } = await supabase
         .from("subscriptions")
         .update({
           current_period_end: newEnd.toISOString(),
           status: "active",
         })
         .eq("id", selectedSubscription.id);
 
       if (error) throw error;
 
       toast({
         title: "Subscription Extended",
         description: `Extended by ${extendDays} days until ${newEnd.toLocaleDateString()}`,
       });
 
       setDialogOpen(false);
       fetchSubscriptions();
     } catch (error) {
       console.error("Error extending subscription:", error);
       toast({
         title: "Error",
         description: "Failed to extend subscription",
         variant: "destructive",
       });
     }
   };
 
   const handleChangeTier = async () => {
     if (!selectedSubscription) return;
 
     const tierLimits: Record<SubscriptionTier, number> = {
       starter: 0,
       basic: 80,
       pro: 999999,
     };
 
     try {
       const { error } = await supabase
         .from("subscriptions")
         .update({
           tier: newTier,
           animal_limit: tierLimits[newTier],
           status: "active",
         })
         .eq("id", selectedSubscription.id);
 
       if (error) throw error;
 
       toast({
         title: "Tier Updated",
         description: `Changed tier to ${newTier}`,
       });
 
       setDialogOpen(false);
       fetchSubscriptions();
     } catch (error) {
       console.error("Error changing tier:", error);
       toast({
         title: "Error",
         description: "Failed to change tier",
         variant: "destructive",
       });
     }
   };
 
   const getStatusBadge = (status: SubscriptionStatus) => {
     switch (status) {
       case "active":
         return <Badge className="bg-green-500">Active</Badge>;
       case "trialing":
         return <Badge variant="secondary">Trial</Badge>;
       case "expired":
         return <Badge variant="destructive">Expired</Badge>;
       case "cancelled":
         return <Badge variant="outline">Cancelled</Badge>;
       default:
         return <Badge variant="outline">{status}</Badge>;
     }
   };
 
   const getTierBadge = (tier: SubscriptionTier) => {
     switch (tier) {
       case "pro":
         return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">Pro</Badge>;
       case "basic":
         return <Badge variant="secondary">Basic</Badge>;
       default:
         return <Badge variant="outline">Starter</Badge>;
     }
   };
 
   if (authLoading || adminLoading) {
     return (
       <Layout>
         <div className="flex items-center justify-center h-64">
           <p className="text-muted-foreground">Loading...</p>
         </div>
       </Layout>
     );
   }
 
   if (!isAdmin) {
     return null;
   }
 
   return (
     <Layout>
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
             <Shield className="w-8 h-8 text-primary" />
             Admin Dashboard
           </h1>
           <p className="text-muted-foreground">Manage user subscriptions and access</p>
         </div>
 
         {/* Stats Cards */}
         <div className="grid gap-4 md:grid-cols-4">
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Total Farms</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold flex items-center gap-2">
                 <Building className="w-5 h-5 text-primary" />
                 {subscriptions.length}
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold flex items-center gap-2">
                 <Users className="w-5 h-5 text-green-500" />
                 {subscriptions.filter(s => s.status === "active").length}
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">On Trial</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold flex items-center gap-2">
                 <Clock className="w-5 h-5 text-blue-500" />
                 {subscriptions.filter(s => s.status === "trialing").length}
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Pro Users</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold flex items-center gap-2">
                 <Shield className="w-5 h-5 text-amber-500" />
                 {subscriptions.filter(s => s.tier === "pro").length}
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Subscriptions Table */}
         <Card>
           <CardHeader>
             <CardTitle>All Subscriptions</CardTitle>
             <CardDescription>Manage subscription tiers and extend access periods</CardDescription>
           </CardHeader>
           <CardContent>
             {loading ? (
               <p className="text-center py-8 text-muted-foreground">Loading subscriptions...</p>
             ) : subscriptions.length === 0 ? (
               <p className="text-center py-8 text-muted-foreground">No subscriptions found</p>
             ) : (
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Farm</TableHead>
                     <TableHead>Tier</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Animal Limit</TableHead>
                     <TableHead>Expires</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {subscriptions.map((sub) => (
                     <TableRow key={sub.id}>
                       <TableCell className="font-medium">{sub.farm_name}</TableCell>
                       <TableCell>{getTierBadge(sub.tier)}</TableCell>
                       <TableCell>{getStatusBadge(sub.status)}</TableCell>
                       <TableCell>
                         {sub.animal_limit === 999999 ? "Unlimited" : sub.animal_limit}
                       </TableCell>
                       <TableCell>
                         {sub.current_period_end 
                           ? new Date(sub.current_period_end).toLocaleDateString()
                           : new Date(sub.trial_ends_at).toLocaleDateString()
                         }
                       </TableCell>
                       <TableCell className="text-right">
                         <Dialog open={dialogOpen && selectedSubscription?.id === sub.id} onOpenChange={(open) => {
                           setDialogOpen(open);
                           if (open) {
                             setSelectedSubscription(sub);
                             setNewTier(sub.tier);
                           }
                         }}>
                           <DialogTrigger asChild>
                             <Button variant="outline" size="sm">
                               Manage
                             </Button>
                           </DialogTrigger>
                           <DialogContent>
                             <DialogHeader>
                               <DialogTitle>Manage Subscription</DialogTitle>
                               <DialogDescription>
                                 {sub.farm_name} - Current tier: {sub.tier}
                               </DialogDescription>
                             </DialogHeader>
                             
                             <div className="space-y-6 py-4">
                               {/* Extend Period */}
                               <div className="space-y-3">
                                 <Label className="text-base font-semibold">Extend Subscription Period</Label>
                                 <div className="flex items-center gap-3">
                                   <Button 
                                     variant="outline" 
                                     size="icon"
                                     onClick={() => setExtendDays(Math.max(1, extendDays - 1))}
                                   >
                                     <Minus className="w-4 h-4" />
                                   </Button>
                                   <Input
                                     type="number"
                                     value={extendDays}
                                     onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value) || 1))}
                                     className="w-20 text-center"
                                   />
                                   <Button 
                                     variant="outline" 
                                     size="icon"
                                     onClick={() => setExtendDays(extendDays + 1)}
                                   >
                                     <Plus className="w-4 h-4" />
                                   </Button>
                                   <span className="text-muted-foreground">days</span>
                                 </div>
                                 <div className="flex gap-2">
                                   <Button variant="secondary" size="sm" onClick={() => setExtendDays(7)}>+1 Week</Button>
                                   <Button variant="secondary" size="sm" onClick={() => setExtendDays(14)}>+2 Weeks</Button>
                                   <Button variant="secondary" size="sm" onClick={() => setExtendDays(30)}>+1 Month</Button>
                                 </div>
                                 <Button onClick={handleExtendSubscription} className="w-full">
                                   Extend by {extendDays} days
                                 </Button>
                               </div>
 
                               <div className="border-t pt-4">
                                 {/* Change Tier */}
                                 <div className="space-y-3">
                                   <Label className="text-base font-semibold">Change Subscription Tier</Label>
                                   <Select value={newTier} onValueChange={(v) => setNewTier(v as SubscriptionTier)}>
                                     <SelectTrigger>
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="starter">Starter (0 animals)</SelectItem>
                                       <SelectItem value="basic">Basic (80 animals)</SelectItem>
                                       <SelectItem value="pro">Pro (Unlimited)</SelectItem>
                                     </SelectContent>
                                   </Select>
                                   <Button onClick={handleChangeTier} variant="outline" className="w-full">
                                     Update Tier to {newTier}
                                   </Button>
                                 </div>
                               </div>
                             </div>
 
                             <DialogFooter>
                               <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                                 Close
                               </Button>
                             </DialogFooter>
                           </DialogContent>
                         </Dialog>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             )}
           </CardContent>
         </Card>
       </div>
     </Layout>
   );
 }