-- Create ENUMs for document categories and other types
CREATE TYPE public.document_category AS ENUM (
  'uif',
  'coida',
  'payslips_payroll',
  'employment_contracts',
  'ohs_risk_assessments',
  'ppe_register',
  'incident_register',
  'first_aid',
  'animal_id_ownership',
  'movement_records',
  'vet_letters',
  'chemical_purchase_invoices',
  'chemical_stock_records',
  'chemical_application_records',
  'water_use_authorisation',
  'borehole_abstraction_logs',
  'abattoir_meat_safety',
  'other'
);

CREATE TYPE public.audit_type AS ENUM (
  'department_of_labour',
  'ohs',
  'livestock_traceability',
  'chemical_records',
  'custom'
);

CREATE TYPE public.chemical_target AS ENUM (
  'animal',
  'land',
  'other'
);

CREATE TYPE public.incident_severity AS ENUM (
  'minor',
  'moderate',
  'serious',
  'critical'
);

-- Create farms table (for multi-farm support)
CREATE TABLE public.farms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address TEXT,
  province TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create farm_members table for access control
CREATE TABLE public.farm_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(farm_id, user_id)
);

-- Document Vault table
CREATE TABLE public.compliance_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category public.document_category NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date_of_document DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PPE Issues table
CREATE TABLE public.ppe_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  employee_name TEXT NOT NULL,
  ppe_item TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Training Records table
CREATE TABLE public.training_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  employee_name TEXT NOT NULL,
  training_type TEXT NOT NULL,
  training_date DATE NOT NULL,
  provider TEXT,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Incidents table
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  severity public.incident_severity NOT NULL DEFAULT 'minor',
  action_taken TEXT,
  closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chemicals Inventory table
CREATE TABLE public.chemicals_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  active_ingredient TEXT,
  batch_no TEXT,
  expiry_date DATE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'L',
  storage_location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chemical Applications table
CREATE TABLE public.chemical_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product_name TEXT NOT NULL,
  batch_no TEXT,
  dosage DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'mL',
  target public.chemical_target NOT NULL DEFAULT 'animal',
  animal_id TEXT,
  location_or_paddock TEXT,
  operator_name TEXT NOT NULL,
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit Packs table (to track generated audit packs)
CREATE TABLE public.audit_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  audit_type public.audit_type NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  document_ids UUID[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppe_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chemicals_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chemical_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_packs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check farm membership
CREATE OR REPLACE FUNCTION public.is_farm_member(_user_id UUID, _farm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farms WHERE id = _farm_id AND owner_id = _user_id
    UNION
    SELECT 1 FROM public.farm_members WHERE farm_id = _farm_id AND user_id = _user_id
  )
$$;

-- RLS Policies for farms
CREATE POLICY "Users can view their own farms" ON public.farms
  FOR SELECT USING (owner_id = auth.uid() OR public.is_farm_member(auth.uid(), id));

CREATE POLICY "Users can create farms" ON public.farms
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their farms" ON public.farms
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their farms" ON public.farms
  FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for farm_members
CREATE POLICY "Farm members can view membership" ON public.farm_members
  FOR SELECT USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm owners can manage members" ON public.farm_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
  );

-- RLS Policies for compliance_documents
CREATE POLICY "Farm members can view documents" ON public.compliance_documents
  FOR SELECT USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create documents" ON public.compliance_documents
  FOR INSERT WITH CHECK (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update documents" ON public.compliance_documents
  FOR UPDATE USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete documents" ON public.compliance_documents
  FOR DELETE USING (public.is_farm_member(auth.uid(), farm_id));

-- RLS Policies for ppe_issues
CREATE POLICY "Farm members can view PPE issues" ON public.ppe_issues
  FOR SELECT USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create PPE issues" ON public.ppe_issues
  FOR INSERT WITH CHECK (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update PPE issues" ON public.ppe_issues
  FOR UPDATE USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete PPE issues" ON public.ppe_issues
  FOR DELETE USING (public.is_farm_member(auth.uid(), farm_id));

-- RLS Policies for training_records
CREATE POLICY "Farm members can view training" ON public.training_records
  FOR SELECT USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create training" ON public.training_records
  FOR INSERT WITH CHECK (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update training" ON public.training_records
  FOR UPDATE USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete training" ON public.training_records
  FOR DELETE USING (public.is_farm_member(auth.uid(), farm_id));

-- RLS Policies for incidents
CREATE POLICY "Farm members can view incidents" ON public.incidents
  FOR SELECT USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create incidents" ON public.incidents
  FOR INSERT WITH CHECK (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update incidents" ON public.incidents
  FOR UPDATE USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete incidents" ON public.incidents
  FOR DELETE USING (public.is_farm_member(auth.uid(), farm_id));

-- RLS Policies for chemicals_inventory
CREATE POLICY "Farm members can view chemicals" ON public.chemicals_inventory
  FOR SELECT USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create chemicals" ON public.chemicals_inventory
  FOR INSERT WITH CHECK (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update chemicals" ON public.chemicals_inventory
  FOR UPDATE USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete chemicals" ON public.chemicals_inventory
  FOR DELETE USING (public.is_farm_member(auth.uid(), farm_id));

-- RLS Policies for chemical_applications
CREATE POLICY "Farm members can view applications" ON public.chemical_applications
  FOR SELECT USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create applications" ON public.chemical_applications
  FOR INSERT WITH CHECK (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update applications" ON public.chemical_applications
  FOR UPDATE USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete applications" ON public.chemical_applications
  FOR DELETE USING (public.is_farm_member(auth.uid(), farm_id));

-- RLS Policies for audit_packs
CREATE POLICY "Farm members can view audit packs" ON public.audit_packs
  FOR SELECT USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create audit packs" ON public.audit_packs
  FOR INSERT WITH CHECK (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete audit packs" ON public.audit_packs
  FOR DELETE USING (public.is_farm_member(auth.uid(), farm_id));

-- Create storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance-documents', 'compliance-documents', false);

-- Storage policies for compliance documents
CREATE POLICY "Authenticated users can upload compliance documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'compliance-documents');

CREATE POLICY "Users can view their farm documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'compliance-documents');

CREATE POLICY "Users can delete their uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'compliance-documents');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_documents_updated_at BEFORE UPDATE ON public.compliance_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ppe_issues_updated_at BEFORE UPDATE ON public.ppe_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_records_updated_at BEFORE UPDATE ON public.training_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chemicals_inventory_updated_at BEFORE UPDATE ON public.chemicals_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chemical_applications_updated_at BEFORE UPDATE ON public.chemical_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();