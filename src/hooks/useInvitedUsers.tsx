 import { useState } from "react";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useFarm } from "./useFarm";
 import { useSubscription } from "./useSubscription";
 import { useToast } from "./use-toast";
 
 interface FarmInvitation {
   id: string;
   email: string;
   status: "pending" | "accepted" | "expired" | "revoked";
   expires_at: string;
   created_at: string;
 }
 
 interface InvitedUser {
   id: string;
   user_id: string;
   created_at: string;
   user_email?: string;
 }
 
 export function useInvitedUsers() {
   const { farm } = useFarm();
   const { subscription } = useSubscription();
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   // Get tier limits
  const getTierLimit = (): number => {
    if (!subscription) return 0;
    switch (subscription.tier) {
      case "basic":
        return 5;
      case "starter":
        return 20;
      case "pro":
        return 999999;
      default:
        return 0;
    }
  };
 
   // Fetch pending invitations
   const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
     queryKey: ["farm-invitations", farm?.id],
     queryFn: async () => {
       if (!farm?.id) return [];
       const { data, error } = await supabase
         .from("farm_invitations")
         .select("id, email, status, expires_at, created_at")
         .eq("farm_id", farm.id)
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data as FarmInvitation[];
     },
     enabled: !!farm?.id,
   });
 
   // Fetch accepted/active invited users
   const { data: invitedUsers = [], isLoading: usersLoading } = useQuery({
     queryKey: ["farm-invited-users", farm?.id],
     queryFn: async () => {
       if (!farm?.id) return [];
       const { data, error } = await supabase
         .from("farm_invited_users")
         .select("id, user_id, created_at")
         .eq("farm_id", farm.id)
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data as InvitedUser[];
     },
     enabled: !!farm?.id,
   });
 
   const limit = getTierLimit();
   const currentCount = invitedUsers.length;
   const canInvite = currentCount < limit;
   const remainingSlots = Math.max(0, limit - currentCount);
 
   // Send invitation mutation
    const inviteMutation = useMutation({
      mutationFn: async ({ email, role = "viewer" }: { email: string; role?: string }) => {
        if (!farm?.id) throw new Error("No farm selected");
        if (!canInvite) throw new Error("User limit reached for your plan");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase.from("farm_invitations").insert({
          farm_id: farm.id,
          invited_by: user.id,
          email: email.toLowerCase(),
          role,
        });
 
       if (error) {
         if (error.code === "23505") {
           throw new Error("This email has already been invited");
         }
         throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["farm-invitations", farm?.id] });
       toast({
         title: "Invitation sent",
         description: "The user will receive an email with instructions to join your farm.",
       });
     },
     onError: (error) => {
       toast({
         title: "Failed to send invitation",
         description: error.message,
         variant: "destructive",
       });
     },
   });
 
   // Revoke invitation mutation
   const revokeMutation = useMutation({
     mutationFn: async (invitationId: string) => {
       const { error } = await supabase
         .from("farm_invitations")
         .update({ status: "revoked" as const })
         .eq("id", invitationId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["farm-invitations", farm?.id] });
       toast({ title: "Invitation revoked" });
     },
     onError: (error) => {
       toast({
         title: "Failed to revoke invitation",
         description: error.message,
         variant: "destructive",
       });
     },
   });
 
   // Remove user mutation
   const removeUserMutation = useMutation({
     mutationFn: async (userId: string) => {
       if (!farm?.id) throw new Error("No farm selected");
       const { error } = await supabase
         .from("farm_invited_users")
         .delete()
         .eq("farm_id", farm.id)
         .eq("user_id", userId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["farm-invited-users", farm?.id] });
       toast({ title: "User removed from farm" });
     },
     onError: (error) => {
       toast({
         title: "Failed to remove user",
         description: error.message,
         variant: "destructive",
       });
     },
   });
 
   return {
     invitations,
     invitedUsers,
     isLoading: invitationsLoading || usersLoading,
     limit,
     currentCount,
     canInvite,
     remainingSlots,
     inviteUser: inviteMutation.mutate,
     isInviting: inviteMutation.isPending,
     revokeInvitation: revokeMutation.mutate,
     isRevoking: revokeMutation.isPending,
     removeUser: removeUserMutation.mutate,
     isRemoving: removeUserMutation.isPending,
   };
 }