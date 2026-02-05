-- Add indexes to speed up common farm-related queries
CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON public.farms(owner_id);

-- Add index on farm_invited_users for user_id lookups
CREATE INDEX IF NOT EXISTS idx_farm_invited_users_user_id ON public.farm_invited_users(user_id);

-- Add index on livestock for farm_id lookups (critical for dashboard)
CREATE INDEX IF NOT EXISTS idx_livestock_farm_id ON public.livestock(farm_id);

-- Add indexes for other commonly queried tables
CREATE INDEX IF NOT EXISTS idx_health_records_farm_id ON public.health_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_feeding_schedule_farm_id ON public.feeding_schedule(farm_id);
CREATE INDEX IF NOT EXISTS idx_alerts_farm_id ON public.alerts(farm_id);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_farm_id ON public.feed_inventory(farm_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);