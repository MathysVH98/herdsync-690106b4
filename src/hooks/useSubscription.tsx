import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useFarm } from "./useFarm";

type SubscriptionTier = "basic" | "starter" | "pro";
type SubscriptionStatus = "trialing" | "active" | "cancelled" | "expired" | "past_due";

interface Subscription {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trial_ends_at: string;
  animal_limit: number;
  days_remaining: number;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isActive: boolean;
  isTrialing: boolean;
  daysRemaining: number;
  refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: true,
  isActive: false,
  isTrialing: false,
  daysRemaining: 0,
  refetch: async () => {},
});

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  basic: 80,
  starter: 250,
  pro: 999999, // Unlimited
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { farm } = useFarm();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user || !farm) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      // First check if subscription exists
      const { data: existingData, error: existingError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("farm_id", farm.id)
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        console.error("Error fetching subscription:", existingError);
        setLoading(false);
        return;
      }

      // If no subscription exists, create one with trial
      if (!existingData) {
        const { data: newSub, error: createError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: user.id,
            farm_id: farm.id,
            tier: "basic",
            status: "trialing",
            animal_limit: TIER_LIMITS.basic,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating subscription:", createError);
          setLoading(false);
          return;
        }

        const daysRemaining = Math.max(
          0,
          Math.ceil(
            (new Date(newSub.trial_ends_at).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        );

        setSubscription({
          id: newSub.id,
          tier: newSub.tier as SubscriptionTier,
          status: newSub.status as SubscriptionStatus,
          trial_ends_at: newSub.trial_ends_at,
          animal_limit: newSub.animal_limit,
          days_remaining: daysRemaining,
        });
      } else {
        const daysRemaining = Math.max(
          0,
          Math.ceil(
            (new Date(existingData.trial_ends_at).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        );

        // Check if trial has expired and update status
        if (
          existingData.status === "trialing" &&
          new Date(existingData.trial_ends_at) < new Date()
        ) {
          await supabase
            .from("subscriptions")
            .update({ status: "expired" })
            .eq("id", existingData.id);

          existingData.status = "expired";
        }

        setSubscription({
          id: existingData.id,
          tier: existingData.tier as SubscriptionTier,
          status: existingData.status as SubscriptionStatus,
          trial_ends_at: existingData.trial_ends_at,
          animal_limit: existingData.animal_limit,
          days_remaining: daysRemaining,
        });
      }
    } catch (error) {
      console.error("Subscription error:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSubscription();
  }, [user, farm]);

  const isActive =
    subscription?.status === "active" ||
    (subscription?.status === "trialing" && subscription.days_remaining > 0);
  
  const isTrialing = subscription?.status === "trialing" && subscription.days_remaining > 0;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        isActive,
        isTrialing,
        daysRemaining: subscription?.days_remaining || 0,
        refetch: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
