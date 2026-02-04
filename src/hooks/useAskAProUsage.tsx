import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useFarm } from "./useFarm";
import { useSubscription } from "./useSubscription";

// Daily question limits per tier
const TIER_LIMITS = {
  basic: 5,
  starter: 20,
  pro: Infinity, // Unlimited
};

interface AskAProUsage {
  questionsUsed: number;
  questionsRemaining: number;
  dailyLimit: number;
  canAsk: boolean;
  isUnlimited: boolean;
  loading: boolean;
  incrementUsage: () => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useAskAProUsage(): AskAProUsage {
  const { user } = useAuth();
  const { farm } = useFarm();
  const { subscription, isActive } = useSubscription();
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const tier = subscription?.tier || "basic";
  const dailyLimit = TIER_LIMITS[tier] || TIER_LIMITS.basic;
  const isUnlimited = tier === "pro";
  const questionsRemaining = isUnlimited ? Infinity : Math.max(0, dailyLimit - questionsUsed);
  const canAsk = isActive && (isUnlimited || questionsRemaining > 0);

  const fetchUsage = useCallback(async () => {
    if (!user || !farm) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("ask_a_pro_usage")
        .select("question_count")
        .eq("user_id", user.id)
        .eq("farm_id", farm.id)
        .eq("usage_date", today)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching usage:", error);
      }

      setQuestionsUsed(data?.question_count || 0);
    } catch (err) {
      console.error("Usage fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, farm]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!user || !farm) return false;
    if (!canAsk) return false;

    const today = new Date().toISOString().split("T")[0];

    try {
      // Try to upsert the usage record
      const { data: existing } = await supabase
        .from("ask_a_pro_usage")
        .select("id, question_count")
        .eq("user_id", user.id)
        .eq("farm_id", farm.id)
        .eq("usage_date", today)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const newCount = existing.question_count + 1;
        
        // Check limit before updating (for non-pro users)
        if (!isUnlimited && newCount > dailyLimit) {
          return false;
        }

        const { error } = await supabase
          .from("ask_a_pro_usage")
          .update({ question_count: newCount })
          .eq("id", existing.id);

        if (error) throw error;
        setQuestionsUsed(newCount);
      } else {
        // Insert new record
        const { error } = await supabase
          .from("ask_a_pro_usage")
          .insert({
            user_id: user.id,
            farm_id: farm.id,
            usage_date: today,
            question_count: 1,
          });

        if (error) throw error;
        setQuestionsUsed(1);
      }

      return true;
    } catch (err) {
      console.error("Failed to increment usage:", err);
      return false;
    }
  }, [user, farm, canAsk, isUnlimited, dailyLimit]);

  return {
    questionsUsed,
    questionsRemaining,
    dailyLimit,
    canAsk,
    isUnlimited,
    loading,
    incrementUsage,
    refetch: fetchUsage,
  };
}
