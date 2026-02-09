-- Create priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create task status enum
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create employee tasks table
CREATE TABLE public.employee_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'pending',
  completed_by UUID REFERENCES public.employees(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_tasks ENABLE ROW LEVEL SECURITY;

-- Farm owners can manage all tasks
CREATE POLICY "Farm owners can manage tasks"
ON public.employee_tasks
FOR ALL
USING (is_farm_owner(auth.uid(), farm_id))
WITH CHECK (is_farm_owner(auth.uid(), farm_id));

-- Create trigger for updated_at
CREATE TRIGGER update_employee_tasks_updated_at
BEFORE UPDATE ON public.employee_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();