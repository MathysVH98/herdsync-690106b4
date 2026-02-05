 import { useState, useEffect, useMemo } from "react";
 import { Layout } from "@/components/Layout";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Shield, Clock, Users, Building, Plus, Minus, Mail, Calendar, Search } from "lucide-react";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { supabase } from "@/integrations/supabase/client";
 import { useAdmin } from "@/hooks/useAdmin";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { useNavigate } from "react-router-dom";
 import type { Database } from "@/integrations/supabase/types";
 
 type SubscriptionTier = Database["public"]["Enums"]["subscription_tier"];
 type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
 
 interface UserFarm {
   id: string;
   name: string;
   province: string | null;
   created_at: string;
 }
 
 interface UserSubscription {
   id: string;
   farm_id: string;
   farm_name: string;
   tier: SubscriptionTier;
   status: SubscriptionStatus;
   trial_ends_at: string;
   current_period_end: string | null;
   animal_limit: number;
 }
 
 interface UserWithDetails {
   id: string;
   email: string;
   created_at: string;
   last_sign_in_at: string | null;
   email_confirmed_at: string | null;
   farms: UserFarm[];
   subscriptions: UserSubscription[];
 }
 
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
 }
 
 export default function AdminDashboard() {
   const { isAdmin, loading: adminLoading } = useAdmin();
   const { user, loading: authLoading } = useAuth();
   const { toast } = useToast();
   const navigate = useNavigate();
   
   const [subscriptions, setSubscriptions] = useState<SubscriptionWithFarm[]>([]);
   const [loading, setLoading] = useState(true);
   const [users, setUsers] = useState<UserWithDetails[]>([]);
   const [usersLoading, setUsersLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithFarm | null>(null);
   const [selectedUserSubscription, setSelectedUserSubscription] = useState<UserSubscription | null>(null);
   const [extendDays, setExtendDays] = useState<number>(7);
   const [newTier, setNewTier] = useState<SubscriptionTier>("basic");
   const [dialogOpen, setDialogOpen] = useState(false);
   const [userDialogOpen, setUserDialogOpen] = useState(false);
 
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
       fetchUsers();
     }
   }, [isAdmin, adminLoading, user, authLoading, navigate]);
 
   const fetchUsers = async () => {
     setUsersLoading(true);
     try {
       const { data: sessionData } = await supabase.auth.getSession();
       const response = await supabase.functions.invoke("admin-get-users", {
         headers: {
           Authorization: `Bearer ${sessionData.session?.access_token}`,
         },
       });
 
       if (response.error) throw response.error;
       setUsers(response.data.users || []);
     } catch (error) {
       console.error("Error fetching users:", error);
       toast({
         title: "Error",
         description: "Failed to load users",
         variant: "destructive",
       });
     }
     setUsersLoading(false);
   };
 
   const fetchSubscriptions = async () => {
     setLoading(true);
     try {
       const { data: subs, error } = await supabase
         .from("subscriptions")
         .select(`*, farms!inner(name, owner_id)`)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
 
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
         .update({ current_period_end: newEnd.toISOString(), status: "active" })
         .eq("id", selectedSubscription.id);
 
       if (error) throw error;
 
       toast({
         title: "Subscription Extended",
         description: `Extended by ${extendDays} days until ${newEnd.toLocaleDateString()}`,
       });
 
       setDialogOpen(false);
       fetchSubscriptions();
       fetchUsers();
     } catch (error) {
       console.error("Error extending subscription:", error);
       toast({ title: "Error", description: "Failed to extend subscription", variant: "destructive" });
     }
   };
 
   const handleChangeTier = async () => {
     if (!selectedSubscription) return;
 
     const tierLimits: Record<SubscriptionTier, number> = { starter: 0, basic: 80, pro: 999999 };
 
     try {
       const { error } = await supabase
         .from("subscriptions")
         .update({ tier: newTier, animal_limit: tierLimits[newTier], status: "active" })
         .eq("id", selectedSubscription.id);
 
       if (error) throw error;
 
       toast({ title: "Tier Updated", description: `Changed tier to ${newTier}` });
 
       setDialogOpen(false);
       fetchSubscriptions();
       fetchUsers();
     } catch (error) {
       console.error("Error changing tier:", error);
       toast({ title: "Error", description: "Failed to change tier", variant: "destructive" });
     }
   };
 
   const handleExtendUserSubscription = async () => {
     if (!selectedUserSubscription) return;
 
     try {
       const currentEnd = selectedUserSubscription.current_period_end 
         ? new Date(selectedUserSubscription.current_period_end)
         : new Date(selectedUserSubscription.trial_ends_at);
       
       const newEnd = new Date(currentEnd);
       newEnd.setDate(newEnd.getDate() + extendDays);
 
       const { error } = await supabase
         .from("subscriptions")
         .update({ current_period_end: newEnd.toISOString(), status: "active" })
         .eq("id", selectedUserSubscription.id);
 
       if (error) throw error;
 
       toast({
         title: "Subscription Extended",
         description: `Extended by ${extendDays} days until ${newEnd.toLocaleDateString()}`,
       });
 
       setUserDialogOpen(false);
       fetchUsers();
       fetchSubscriptions();
     } catch (error) {
       console.error("Error extending subscription:", error);
       toast({ title: "Error", description: "Failed to extend subscription", variant: "destructive" });
     }
   };
 
   const handleChangeUserTier = async () => {
     if (!selectedUserSubscription) return;
 
     const tierLimits: Record<SubscriptionTier, number> = { starter: 0, basic: 80, pro: 999999 };
 
     try {
       const { error } = await supabase
         .from("subscriptions")
         .update({ tier: newTier, animal_limit: tierLimits[newTier], status: "active" })
         .eq("id", selectedUserSubscription.id);
 
       if (error) throw error;
 
       toast({ title: "Tier Updated", description: `Changed tier to ${newTier}` });
 
       setUserDialogOpen(false);
       fetchUsers();
       fetchSubscriptions();
     } catch (error) {
       console.error("Error changing tier:", error);
       toast({ title: "Error", description: "Failed to change tier", variant: "destructive" });
     }
   };
 
   const filteredUsers = useMemo(() => {
     if (!searchTerm) return users;
     const term = searchTerm.toLowerCase();
     return users.filter(u => 
       u.email?.toLowerCase().includes(term) ||
       u.farms.some(f => f.name.toLowerCase().includes(term))
     );
   }, [users, searchTerm]);
 
   const getStatusBadge = (status: SubscriptionStatus) => {
     switch (status) {
       case "active":
         return <Badge className="bg-primary text-primary-foreground">Active</Badge>;
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
         return <Badge className="bg-accent text-accent-foreground">Pro</Badge>;
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
 
         <div className="grid gap-4 md:grid-cols-4">
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold flex items-center gap-2">
                 <Users className="w-5 h-5 text-primary" />
                 {users.length}
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Total Farms</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold flex items-center gap-2">
                 <Building className="w-5 h-5 text-primary" />
                 {users.reduce((acc, u) => acc + u.farms.length, 0)}
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold flex items-center gap-2">
                 <Clock className="w-5 h-5 text-primary" />
                 {users.reduce((acc, u) => acc + u.subscriptions.filter(s => s.status === "active").length, 0)}
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Pro Users</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold flex items-center gap-2">
                 <Shield className="w-5 h-5 text-primary" />
                 {users.reduce((acc, u) => acc + u.subscriptions.filter(s => s.tier === "pro").length, 0)}
               </div>
             </CardContent>
           </Card>
         </div>
 
         <Tabs defaultValue="users" className="w-full">
           <TabsList className="grid w-full grid-cols-2 max-w-md">
             <TabsTrigger value="users">All Users</TabsTrigger>
             <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
           </TabsList>
 
           <TabsContent value="users">
             <Card>
               <CardHeader>
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                   <div>
                     <CardTitle className="flex items-center gap-2">
                       <Users className="w-5 h-5" />
                       Registered Users ({users.length})
                     </CardTitle>
                     <CardDescription>All accounts registered on HerdSync</CardDescription>
                   </div>
                   <div className="relative w-full sm:w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       placeholder="Search by email or farm..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="pl-9"
                     />
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 {usersLoading ? (
                   <p className="text-center py-8 text-muted-foreground">Loading users...</p>
                 ) : filteredUsers.length === 0 ? (
                   <p className="text-center py-8 text-muted-foreground">
                     {searchTerm ? "No users match your search" : "No users found"}
                   </p>
                 ) : (
                   <div className="overflow-x-auto">
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Email</TableHead>
                           <TableHead>Farms</TableHead>
                           <TableHead>Subscription</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead>Registered</TableHead>
                           <TableHead>Last Sign In</TableHead>
                           <TableHead className="text-right">Actions</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {filteredUsers.map((u) => (
                           <TableRow key={u.id}>
                             <TableCell>
                               <div className="flex items-center gap-2">
                                 <Mail className="w-4 h-4 text-muted-foreground" />
                                 <span className="font-medium">{u.email}</span>
                                 {u.email_confirmed_at && (
                                   <Badge variant="outline" className="text-xs">Verified</Badge>
                                 )}
                               </div>
                             </TableCell>
                             <TableCell>
                               {u.farms.length === 0 ? (
                                 <span className="text-muted-foreground text-sm">No farms</span>
                               ) : (
                                 <div className="flex flex-col gap-1">
                                   {u.farms.map(f => (
                                     <span key={f.id} className="text-sm">{f.name}</span>
                                   ))}
                                 </div>
                               )}
                             </TableCell>
                             <TableCell>
                               {u.subscriptions.length === 0 ? (
                                 <span className="text-muted-foreground text-sm">None</span>
                               ) : (
                                 <div className="flex flex-col gap-1">
                                   {u.subscriptions.map(s => (
                                     <div key={s.id}>{getTierBadge(s.tier)}</div>
                                   ))}
                                 </div>
                               )}
                             </TableCell>
                             <TableCell>
                               {u.subscriptions.length === 0 ? (
                                 <span className="text-muted-foreground text-sm">—</span>
                               ) : (
                                 <div className="flex flex-col gap-1">
                                   {u.subscriptions.map(s => (
                                     <div key={s.id}>{getStatusBadge(s.status)}</div>
                                   ))}
                                 </div>
                               )}
                             </TableCell>
                             <TableCell>
                               <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                 <Calendar className="w-3 h-3" />
                                 {new Date(u.created_at).toLocaleDateString()}
                               </div>
                             </TableCell>
                             <TableCell>
                               {u.last_sign_in_at ? (
                                 <span className="text-sm text-muted-foreground">
                                   {new Date(u.last_sign_in_at).toLocaleDateString()}
                                 </span>
                               ) : (
                                 <span className="text-sm text-muted-foreground">Never</span>
                               )}
                             </TableCell>
                             <TableCell className="text-right">
                               {u.subscriptions.length > 0 && (
                                 <Dialog 
                                   open={userDialogOpen && selectedUserSubscription?.id === u.subscriptions[0]?.id} 
                                   onOpenChange={(open) => {
                                     setUserDialogOpen(open);
                                     if (open && u.subscriptions[0]) {
                                       setSelectedUserSubscription(u.subscriptions[0]);
                                       setNewTier(u.subscriptions[0].tier);
                                     }
                                   }}
                                 >
                                   <DialogTrigger asChild>
                                     <Button variant="outline" size="sm">Manage</Button>
                                   </DialogTrigger>
                                   <DialogContent>
                                     <DialogHeader>
                                       <DialogTitle>Manage User Subscription</DialogTitle>
                                       <DialogDescription>
                                         {u.email} — {u.subscriptions[0]?.farm_name}
                                       </DialogDescription>
                                     </DialogHeader>
                                     
                                     <div className="space-y-6 py-4">
                                       <div className="space-y-3">
                                         <Label className="text-base font-semibold">Extend Subscription Period</Label>
                                         <div className="flex items-center gap-3">
                                           <Button variant="outline" size="icon" onClick={() => setExtendDays(Math.max(1, extendDays - 1))}>
                                             <Minus className="w-4 h-4" />
                                           </Button>
                                           <Input
                                             type="number"
                                             value={extendDays}
                                             onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value) || 1))}
                                             className="w-20 text-center"
                                           />
                                           <Button variant="outline" size="icon" onClick={() => setExtendDays(extendDays + 1)}>
                                             <Plus className="w-4 h-4" />
                                           </Button>
                                           <span className="text-muted-foreground">days</span>
                                         </div>
                                         <div className="flex gap-2">
                                           <Button variant="secondary" size="sm" onClick={() => setExtendDays(7)}>+1 Week</Button>
                                           <Button variant="secondary" size="sm" onClick={() => setExtendDays(14)}>+2 Weeks</Button>
                                           <Button variant="secondary" size="sm" onClick={() => setExtendDays(30)}>+1 Month</Button>
                                         </div>
                                         <Button onClick={handleExtendUserSubscription} className="w-full">
                                           Extend by {extendDays} days
                                         </Button>
                                       </div>
 
                                       <div className="border-t pt-4 space-y-3">
                                         <Label className="text-base font-semibold">Change Subscription Tier</Label>
                                         <Select value={newTier} onValueChange={(v) => setNewTier(v as SubscriptionTier)}>
                                           <SelectTrigger><SelectValue /></SelectTrigger>
                                           <SelectContent>
                                             <SelectItem value="starter">Starter (0 animals)</SelectItem>
                                             <SelectItem value="basic">Basic (80 animals)</SelectItem>
                                             <SelectItem value="pro">Pro (Unlimited)</SelectItem>
                                           </SelectContent>
                                         </Select>
                                         <Button onClick={handleChangeUserTier} variant="outline" className="w-full">
                                           Update Tier to {newTier}
                                         </Button>
                                       </div>
                                     </div>
 
                                     <DialogFooter>
                                       <Button variant="ghost" onClick={() => setUserDialogOpen(false)}>Close</Button>
                                     </DialogFooter>
                                   </DialogContent>
                                 </Dialog>
                               )}
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
 
           <TabsContent value="subscriptions">
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
                                 <Button variant="outline" size="sm">Manage</Button>
                               </DialogTrigger>
                               <DialogContent>
                                 <DialogHeader>
                                   <DialogTitle>Manage Subscription</DialogTitle>
                                   <DialogDescription>{sub.farm_name} - Current tier: {sub.tier}</DialogDescription>
                                 </DialogHeader>
                                 
                                 <div className="space-y-6 py-4">
                                   <div className="space-y-3">
                                     <Label className="text-base font-semibold">Extend Subscription Period</Label>
                                     <div className="flex items-center gap-3">
                                       <Button variant="outline" size="icon" onClick={() => setExtendDays(Math.max(1, extendDays - 1))}>
                                         <Minus className="w-4 h-4" />
                                       </Button>
                                       <Input
                                         type="number"
                                         value={extendDays}
                                         onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value) || 1))}
                                         className="w-20 text-center"
                                       />
                                       <Button variant="outline" size="icon" onClick={() => setExtendDays(extendDays + 1)}>
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
 
                                   <div className="border-t pt-4 space-y-3">
                                     <Label className="text-base font-semibold">Change Subscription Tier</Label>
                                     <Select value={newTier} onValueChange={(v) => setNewTier(v as SubscriptionTier)}>
                                       <SelectTrigger><SelectValue /></SelectTrigger>
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
 
                                 <DialogFooter>
                                   <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
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
           </TabsContent>
         </Tabs>
       </div>
     </Layout>
   );
 }