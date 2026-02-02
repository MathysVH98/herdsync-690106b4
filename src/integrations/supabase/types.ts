export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_packs: {
        Row: {
          audit_type: Database["public"]["Enums"]["audit_type"]
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          document_ids: string[] | null
          farm_id: string
          generated_by: string | null
          id: string
          notes: string | null
        }
        Insert: {
          audit_type: Database["public"]["Enums"]["audit_type"]
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          document_ids?: string[] | null
          farm_id: string
          generated_by?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          audit_type?: Database["public"]["Enums"]["audit_type"]
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          document_ids?: string[] | null
          farm_id?: string
          generated_by?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_packs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      chemical_applications: {
        Row: {
          animal_id: string | null
          application_date: string
          attachment_url: string | null
          batch_no: string | null
          created_at: string
          dosage: number
          farm_id: string
          id: string
          location_or_paddock: string | null
          notes: string | null
          operator_name: string
          product_name: string
          target: Database["public"]["Enums"]["chemical_target"]
          unit: string
          updated_at: string
        }
        Insert: {
          animal_id?: string | null
          application_date?: string
          attachment_url?: string | null
          batch_no?: string | null
          created_at?: string
          dosage: number
          farm_id: string
          id?: string
          location_or_paddock?: string | null
          notes?: string | null
          operator_name: string
          product_name: string
          target?: Database["public"]["Enums"]["chemical_target"]
          unit?: string
          updated_at?: string
        }
        Update: {
          animal_id?: string | null
          application_date?: string
          attachment_url?: string | null
          batch_no?: string | null
          created_at?: string
          dosage?: number
          farm_id?: string
          id?: string
          location_or_paddock?: string | null
          notes?: string | null
          operator_name?: string
          product_name?: string
          target?: Database["public"]["Enums"]["chemical_target"]
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chemical_applications_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      chemicals_inventory: {
        Row: {
          active_ingredient: string | null
          batch_no: string | null
          created_at: string
          expiry_date: string | null
          farm_id: string
          id: string
          notes: string | null
          product_name: string
          quantity: number
          storage_location: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          active_ingredient?: string | null
          batch_no?: string | null
          created_at?: string
          expiry_date?: string | null
          farm_id: string
          id?: string
          notes?: string | null
          product_name: string
          quantity?: number
          storage_location?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          active_ingredient?: string | null
          batch_no?: string | null
          created_at?: string
          expiry_date?: string | null
          farm_id?: string
          id?: string
          notes?: string | null
          product_name?: string
          quantity?: number
          storage_location?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chemicals_inventory_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      commodities: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          unit: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          unit?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "commodities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "commodity_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      commodity_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      commodity_prices: {
        Row: {
          commodity_id: string
          created_at: string
          id: string
          price: number
          price_date: string
          source: string | null
          updated_at: string
        }
        Insert: {
          commodity_id: string
          created_at?: string
          id?: string
          price: number
          price_date?: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          commodity_id?: string
          created_at?: string
          id?: string
          price?: number
          price_date?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commodity_prices_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "commodities"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          date_of_document: string | null
          farm_id: string
          file_name: string
          file_url: string
          id: string
          notes: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string
          date_of_document?: string | null
          farm_id: string
          file_name: string
          file_url: string
          id?: string
          notes?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          date_of_document?: string | null
          farm_id?: string
          file_name?: string
          file_url?: string
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_members: {
        Row: {
          created_at: string
          farm_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_members_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          province: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          province?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          province?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          action_taken: string | null
          closed: boolean
          created_at: string
          description: string
          farm_id: string
          id: string
          incident_date: string
          severity: Database["public"]["Enums"]["incident_severity"]
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          closed?: boolean
          created_at?: string
          description: string
          farm_id: string
          id?: string
          incident_date?: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          closed?: boolean
          created_at?: string
          description?: string
          farm_id?: string
          id?: string
          incident_date?: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      ppe_issues: {
        Row: {
          created_at: string
          employee_name: string
          farm_id: string
          id: string
          issue_date: string
          next_due_date: string | null
          notes: string | null
          ppe_item: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_name: string
          farm_id: string
          id?: string
          issue_date?: string
          next_due_date?: string | null
          notes?: string | null
          ppe_item: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_name?: string
          farm_id?: string
          id?: string
          issue_date?: string
          next_due_date?: string | null
          notes?: string | null
          ppe_item?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppe_issues_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          animal_limit: number
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          farm_id: string
          id: string
          payment_provider:
            | Database["public"]["Enums"]["payment_provider"]
            | null
          payment_reference: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string
          trial_started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          animal_limit?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          farm_id: string
          id?: string
          payment_provider?:
            | Database["public"]["Enums"]["payment_provider"]
            | null
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string
          trial_started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          animal_limit?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          farm_id?: string
          id?: string
          payment_provider?:
            | Database["public"]["Enums"]["payment_provider"]
            | null
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string
          trial_started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: true
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      training_records: {
        Row: {
          certificate_url: string | null
          created_at: string
          employee_name: string
          farm_id: string
          id: string
          notes: string | null
          provider: string | null
          training_date: string
          training_type: string
          updated_at: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          employee_name: string
          farm_id: string
          id?: string
          notes?: string | null
          provider?: string | null
          training_date: string
          training_type: string
          updated_at?: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          employee_name?: string
          farm_id?: string
          id?: string
          notes?: string | null
          provider?: string | null
          training_date?: string
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_subscription_status: {
        Args: { _farm_id: string }
        Returns: {
          animal_limit: number
          days_remaining: number
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string
        }[]
      }
      has_active_subscription: {
        Args: { _farm_id: string; _user_id: string }
        Returns: boolean
      }
      is_farm_member: {
        Args: { _farm_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      audit_type:
        | "department_of_labour"
        | "ohs"
        | "livestock_traceability"
        | "chemical_records"
        | "custom"
      chemical_target: "animal" | "land" | "other"
      document_category:
        | "uif"
        | "coida"
        | "payslips_payroll"
        | "employment_contracts"
        | "ohs_risk_assessments"
        | "ppe_register"
        | "incident_register"
        | "first_aid"
        | "animal_id_ownership"
        | "movement_records"
        | "vet_letters"
        | "chemical_purchase_invoices"
        | "chemical_stock_records"
        | "chemical_application_records"
        | "water_use_authorisation"
        | "borehole_abstraction_logs"
        | "abattoir_meat_safety"
        | "other"
      incident_severity: "minor" | "moderate" | "serious" | "critical"
      payment_provider: "paypal" | "yoco"
      subscription_status:
        | "trialing"
        | "active"
        | "cancelled"
        | "expired"
        | "past_due"
      subscription_tier: "basic" | "starter" | "pro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      audit_type: [
        "department_of_labour",
        "ohs",
        "livestock_traceability",
        "chemical_records",
        "custom",
      ],
      chemical_target: ["animal", "land", "other"],
      document_category: [
        "uif",
        "coida",
        "payslips_payroll",
        "employment_contracts",
        "ohs_risk_assessments",
        "ppe_register",
        "incident_register",
        "first_aid",
        "animal_id_ownership",
        "movement_records",
        "vet_letters",
        "chemical_purchase_invoices",
        "chemical_stock_records",
        "chemical_application_records",
        "water_use_authorisation",
        "borehole_abstraction_logs",
        "abattoir_meat_safety",
        "other",
      ],
      incident_severity: ["minor", "moderate", "serious", "critical"],
      payment_provider: ["paypal", "yoco"],
      subscription_status: [
        "trialing",
        "active",
        "cancelled",
        "expired",
        "past_due",
      ],
      subscription_tier: ["basic", "starter", "pro"],
    },
  },
} as const
