
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Farm owners can insert notifications for their farm members
CREATE POLICY "Farm owners can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farms
    WHERE id = notifications.farm_id AND owner_id = auth.uid()
  )
);

-- Also allow the employee_tasks RLS: farm managers who are employees can see all tasks
-- Add RLS policy for daily_tasks so managers can view all daily tasks
CREATE POLICY "Farm managers can view all daily tasks"
ON public.daily_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id = daily_tasks.farm_id AND user_id = auth.uid() AND role = 'manager'
  )
);

-- Add RLS policy for daily_task_completions so managers can view all completions
CREATE POLICY "Farm managers can view all daily task completions"
ON public.daily_task_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.daily_tasks dt
    JOIN public.farm_members fm ON fm.farm_id = dt.farm_id
    WHERE dt.id = daily_task_completions.daily_task_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'manager'
  )
);
