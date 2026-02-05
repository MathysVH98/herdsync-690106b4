 import { useState } from "react";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { UserPlus, Users, Mail, Clock, XCircle, Trash2, Crown } from "lucide-react";
 import { format, isPast } from "date-fns";
 import { useInvitedUsers } from "@/hooks/useInvitedUsers";
 import { useSubscription } from "@/hooks/useSubscription";
 import { InviteUserDialog } from "./InviteUserDialog";
 import { Link } from "react-router-dom";
 
 export function InvitedUsersManager() {
   const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
   const [userToRemove, setUserToRemove] = useState<string | null>(null);
   const [invitationToRevoke, setInvitationToRevoke] = useState<string | null>(null);
   
   const { subscription } = useSubscription();
   const {
     invitations,
     invitedUsers,
     isLoading,
     limit,
     currentCount,
     canInvite,
     revokeInvitation,
     isRevoking,
     removeUser,
     isRemoving,
   } = useInvitedUsers();
 
   const pendingInvitations = invitations.filter(
     (inv) => inv.status === "pending" && !isPast(new Date(inv.expires_at))
   );
   const expiredInvitations = invitations.filter(
     (inv) => inv.status === "expired" || (inv.status === "pending" && isPast(new Date(inv.expires_at)))
   );
 
   const getStatusBadge = (status: string, expiresAt: string) => {
     if (status === "pending" && isPast(new Date(expiresAt))) {
       return <Badge variant="secondary">Expired</Badge>;
     }
     switch (status) {
       case "pending":
         return <Badge variant="outline" className="border-amber-500 text-amber-600">Pending</Badge>;
       case "accepted":
         return <Badge variant="default" className="bg-success">Accepted</Badge>;
       case "revoked":
         return <Badge variant="destructive">Revoked</Badge>;
       default:
         return <Badge variant="secondary">{status}</Badge>;
     }
   };
 
   const tierLabel = subscription?.tier === "starter" 
     ? "Starter (0 users)" 
     : subscription?.tier === "basic" 
       ? "Basic (5 users)" 
       : "Pro (Unlimited)";
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
           <h2 className="text-xl font-semibold flex items-center gap-2">
             <Users className="w-5 h-5" />
             Invited Users
           </h2>
           <p className="text-sm text-muted-foreground">
             Invite others to access your farm • {tierLabel}
           </p>
         </div>
         <Button onClick={() => setIsInviteDialogOpen(true)} disabled={!canInvite && subscription?.tier !== "starter"}>
           <UserPlus className="w-4 h-4 mr-2" />
           Invite User
         </Button>
       </div>
 
       {/* Usage Card */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-base">User Slots</CardTitle>
           <CardDescription>
             {subscription?.tier === "starter" ? (
               <span className="flex items-center gap-1">
                 <Crown className="w-4 h-4 text-amber-500" />
                 <Link to="/pricing" className="text-primary hover:underline">
                   Upgrade your plan to invite users
                 </Link>
               </span>
             ) : limit === 999999 ? (
               "Unlimited users with Pro plan"
             ) : (
               `${currentCount} of ${limit} slots used`
             )}
           </CardDescription>
         </CardHeader>
         {subscription?.tier !== "starter" && limit !== 999999 && (
           <CardContent>
             <div className="h-2 bg-muted rounded-full overflow-hidden">
               <div
                 className="h-full bg-primary transition-all"
                 style={{ width: `${Math.min(100, (currentCount / limit) * 100)}%` }}
               />
             </div>
           </CardContent>
         )}
       </Card>
 
       {/* Tabs */}
       <Tabs defaultValue="active" className="w-full">
         <TabsList>
           <TabsTrigger value="active">
             Active Users ({invitedUsers.length})
           </TabsTrigger>
           <TabsTrigger value="pending">
             Pending ({pendingInvitations.length})
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="active">
           <Card>
             <CardContent className="pt-6">
               {isLoading ? (
                 <p className="text-center text-muted-foreground py-8">Loading...</p>
               ) : invitedUsers.length === 0 ? (
                 <div className="text-center py-8 space-y-2">
                   <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
                   <p className="text-muted-foreground">No invited users yet</p>
                   {canInvite && (
                     <Button variant="outline" size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                       <UserPlus className="w-4 h-4 mr-2" />
                       Invite your first user
                     </Button>
                   )}
                 </div>
               ) : (
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>User</TableHead>
                       <TableHead>Joined</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {invitedUsers.map((user) => (
                       <TableRow key={user.id}>
                         <TableCell>
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                               <Users className="w-4 h-4 text-primary" />
                             </div>
                             <span className="text-sm">User #{user.user_id.slice(0, 8)}</span>
                           </div>
                         </TableCell>
                         <TableCell>
                           {format(new Date(user.created_at), "dd MMM yyyy")}
                         </TableCell>
                         <TableCell className="text-right">
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => setUserToRemove(user.user_id)}
                           >
                             <Trash2 className="w-4 h-4 text-destructive" />
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               )}
             </CardContent>
           </Card>
         </TabsContent>
 
         <TabsContent value="pending">
           <Card>
             <CardContent className="pt-6">
               {pendingInvitations.length === 0 ? (
                 <p className="text-center text-muted-foreground py-8">No pending invitations</p>
               ) : (
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Email</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Expires</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {pendingInvitations.map((invitation) => (
                       <TableRow key={invitation.id}>
                         <TableCell>
                           <div className="flex items-center gap-2">
                             <Mail className="w-4 h-4 text-muted-foreground" />
                             {invitation.email}
                           </div>
                         </TableCell>
                         <TableCell>
                           {getStatusBadge(invitation.status, invitation.expires_at)}
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-1 text-sm text-muted-foreground">
                             <Clock className="w-3 h-3" />
                             {format(new Date(invitation.expires_at), "dd MMM yyyy")}
                           </div>
                         </TableCell>
                         <TableCell className="text-right">
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => setInvitationToRevoke(invitation.id)}
                           >
                             <XCircle className="w-4 h-4 text-destructive" />
                           </Button>
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
 
       {/* Invite Dialog */}
       <InviteUserDialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} />
 
       {/* Remove User Confirmation */}
       <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Remove User</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to remove this user from your farm? They will no longer have access to any farm data.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={() => {
                 if (userToRemove) {
                   removeUser(userToRemove);
                   setUserToRemove(null);
                 }
               }}
               disabled={isRemoving}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               Remove
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
 
       {/* Revoke Invitation Confirmation */}
       <AlertDialog open={!!invitationToRevoke} onOpenChange={() => setInvitationToRevoke(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to revoke this invitation? The recipient will no longer be able to use it to join your farm.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={() => {
                 if (invitationToRevoke) {
                   revokeInvitation(invitationToRevoke);
                   setInvitationToRevoke(null);
                 }
               }}
               disabled={isRevoking}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               Revoke
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }