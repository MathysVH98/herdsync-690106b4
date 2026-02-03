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
      alerts: {
        Row: {
          created_at: string
          dismissed: boolean
          farm_id: string
          id: string
          message: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          dismissed?: boolean
          farm_id: string
          id?: string
          message: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          dismissed?: boolean
          farm_id?: string
          id?: string
          message?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_sale_items: {
        Row: {
          animal_id: string
          animal_sale_id: string
          created_at: string
          id: string
          notes: string | null
          unit_price: number | null
        }
        Insert: {
          animal_id: string
          animal_sale_id: string
          created_at?: string
          id?: string
          notes?: string | null
          unit_price?: number | null
        }
        Update: {
          animal_id?: string
          animal_sale_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_sale_items_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_sale_items_animal_sale_id_fkey"
            columns: ["animal_sale_id"]
            isOneToOne: false
            referencedRelation: "animal_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_sales: {
        Row: {
          balance_due_date: string | null
          buyer_address: string | null
          buyer_email: string | null
          buyer_id_or_reg: string | null
          buyer_name: string
          buyer_phone: string | null
          buyer_signature_date: string | null
          buyer_signature_name: string | null
          buyer_vat_number: string | null
          created_at: string
          delivery_details: string | null
          deposit_amount: number | null
          farm_id: string
          health_declaration: string | null
          id: string
          lot_price_total: number | null
          ownership_passes:
            | Database["public"]["Enums"]["ownership_passes"]
            | null
          ownership_passes_custom: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          pdf_document_id: string | null
          price_per_animal: number | null
          price_type: Database["public"]["Enums"]["price_type"]
          risk_passes: Database["public"]["Enums"]["risk_passes"] | null
          risk_passes_custom: string | null
          sale_date: string
          sale_location: string | null
          sale_number: string
          sale_status: Database["public"]["Enums"]["sale_status"]
          seller_address: string | null
          seller_email: string | null
          seller_id_or_reg: string | null
          seller_name: string
          seller_phone: string | null
          seller_signature_date: string | null
          seller_signature_name: string | null
          seller_vat_number: string | null
          special_conditions: string | null
          subtotal: number | null
          total_amount: number | null
          transport_responsibility:
            | Database["public"]["Enums"]["transport_responsibility"]
            | null
          transport_responsibility_custom: string | null
          updated_at: string
          vat_amount: number | null
          vat_applicable: boolean
          vat_rate: number
          warranty_clause: string | null
          witness1_name: string | null
          witness1_signature: string | null
          witness2_name: string | null
          witness2_signature: string | null
        }
        Insert: {
          balance_due_date?: string | null
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_id_or_reg?: string | null
          buyer_name: string
          buyer_phone?: string | null
          buyer_signature_date?: string | null
          buyer_signature_name?: string | null
          buyer_vat_number?: string | null
          created_at?: string
          delivery_details?: string | null
          deposit_amount?: number | null
          farm_id: string
          health_declaration?: string | null
          id?: string
          lot_price_total?: number | null
          ownership_passes?:
            | Database["public"]["Enums"]["ownership_passes"]
            | null
          ownership_passes_custom?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          pdf_document_id?: string | null
          price_per_animal?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          risk_passes?: Database["public"]["Enums"]["risk_passes"] | null
          risk_passes_custom?: string | null
          sale_date?: string
          sale_location?: string | null
          sale_number: string
          sale_status?: Database["public"]["Enums"]["sale_status"]
          seller_address?: string | null
          seller_email?: string | null
          seller_id_or_reg?: string | null
          seller_name: string
          seller_phone?: string | null
          seller_signature_date?: string | null
          seller_signature_name?: string | null
          seller_vat_number?: string | null
          special_conditions?: string | null
          subtotal?: number | null
          total_amount?: number | null
          transport_responsibility?:
            | Database["public"]["Enums"]["transport_responsibility"]
            | null
          transport_responsibility_custom?: string | null
          updated_at?: string
          vat_amount?: number | null
          vat_applicable?: boolean
          vat_rate?: number
          warranty_clause?: string | null
          witness1_name?: string | null
          witness1_signature?: string | null
          witness2_name?: string | null
          witness2_signature?: string | null
        }
        Update: {
          balance_due_date?: string | null
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_id_or_reg?: string | null
          buyer_name?: string
          buyer_phone?: string | null
          buyer_signature_date?: string | null
          buyer_signature_name?: string | null
          buyer_vat_number?: string | null
          created_at?: string
          delivery_details?: string | null
          deposit_amount?: number | null
          farm_id?: string
          health_declaration?: string | null
          id?: string
          lot_price_total?: number | null
          ownership_passes?:
            | Database["public"]["Enums"]["ownership_passes"]
            | null
          ownership_passes_custom?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          pdf_document_id?: string | null
          price_per_animal?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          risk_passes?: Database["public"]["Enums"]["risk_passes"] | null
          risk_passes_custom?: string | null
          sale_date?: string
          sale_location?: string | null
          sale_number?: string
          sale_status?: Database["public"]["Enums"]["sale_status"]
          seller_address?: string | null
          seller_email?: string | null
          seller_id_or_reg?: string | null
          seller_name?: string
          seller_phone?: string | null
          seller_signature_date?: string | null
          seller_signature_name?: string | null
          seller_vat_number?: string | null
          special_conditions?: string | null
          subtotal?: number | null
          total_amount?: number | null
          transport_responsibility?:
            | Database["public"]["Enums"]["transport_responsibility"]
            | null
          transport_responsibility_custom?: string | null
          updated_at?: string
          vat_amount?: number | null
          vat_applicable?: boolean
          vat_rate?: number
          warranty_clause?: string | null
          witness1_name?: string | null
          witness1_signature?: string | null
          witness2_name?: string | null
          witness2_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_sales_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          animal_tag_id: string
          brand_mark: string | null
          breed: string | null
          color_markings: string | null
          created_at: string
          dob_or_age: string | null
          farm_id: string
          health_notes: string | null
          id: string
          microchip_number: string | null
          sex: string | null
          species: string
          status: Database["public"]["Enums"]["animal_status"]
          updated_at: string
        }
        Insert: {
          animal_tag_id: string
          brand_mark?: string | null
          breed?: string | null
          color_markings?: string | null
          created_at?: string
          dob_or_age?: string | null
          farm_id: string
          health_notes?: string | null
          id?: string
          microchip_number?: string | null
          sex?: string | null
          species: string
          status?: Database["public"]["Enums"]["animal_status"]
          updated_at?: string
        }
        Update: {
          animal_tag_id?: string
          brand_mark?: string | null
          breed?: string | null
          color_markings?: string | null
          created_at?: string
          dob_or_age?: string | null
          farm_id?: string
          health_notes?: string | null
          id?: string
          microchip_number?: string | null
          sex?: string | null
          species?: string
          status?: Database["public"]["Enums"]["animal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "animals_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
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
      employees: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          end_date: string | null
          farm_id: string
          first_name: string
          id: string
          id_number: string | null
          last_name: string
          notes: string | null
          phone: string | null
          role: string
          salary: number | null
          start_date: string
          status: string
          tax_number: string | null
          uif_registered: boolean | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          end_date?: string | null
          farm_id: string
          first_name: string
          id?: string
          id_number?: string | null
          last_name: string
          notes?: string | null
          phone?: string | null
          role?: string
          salary?: number | null
          start_date?: string
          status?: string
          tax_number?: string | null
          uif_registered?: boolean | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          end_date?: string | null
          farm_id?: string
          first_name?: string
          id?: string
          id_number?: string | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          role?: string
          salary?: number | null
          start_date?: string
          status?: string
          tax_number?: string | null
          uif_registered?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_equipment: {
        Row: {
          condition: string | null
          created_at: string
          current_value: number | null
          equipment_type: string
          farm_id: string
          id: string
          location: string | null
          make: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_cost: number
          purchase_date: string | null
          serial_number: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          condition?: string | null
          created_at?: string
          current_value?: number | null
          equipment_type: string
          farm_id: string
          id?: string
          location?: string | null
          make?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_cost?: number
          purchase_date?: string | null
          serial_number?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          condition?: string | null
          created_at?: string
          current_value?: number | null
          equipment_type?: string
          farm_id?: string
          id?: string
          location?: string | null
          make?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_cost?: number
          purchase_date?: string | null
          serial_number?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_equipment_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          farm_id: string
          id: string
          notes: string | null
          receipt_reference: string | null
          supplier_vendor: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description: string
          expense_date?: string
          farm_id: string
          id?: string
          notes?: string | null
          receipt_reference?: string | null
          supplier_vendor?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          farm_id?: string
          id?: string
          notes?: string | null
          receipt_reference?: string | null
          supplier_vendor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_expenses_farm_id_fkey"
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
      feed_inventory: {
        Row: {
          cost_per_unit: number
          created_at: string
          farm_id: string
          id: string
          last_restocked: string | null
          name: string
          notes: string | null
          quantity: number
          reorder_level: number
          type: string
          unit: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          farm_id: string
          id?: string
          last_restocked?: string | null
          name: string
          notes?: string | null
          quantity?: number
          reorder_level?: number
          type: string
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          farm_id?: string
          id?: string
          last_restocked?: string | null
          name?: string
          notes?: string | null
          quantity?: number
          reorder_level?: number
          type?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_inventory_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_schedule: {
        Row: {
          animal_type: string
          created_at: string
          farm_id: string
          feed_type: string
          id: string
          notes: string | null
          period: string
          time: string
          updated_at: string
        }
        Insert: {
          animal_type: string
          created_at?: string
          farm_id: string
          feed_type: string
          id?: string
          notes?: string | null
          period?: string
          time: string
          updated_at?: string
        }
        Update: {
          animal_type?: string
          created_at?: string
          farm_id?: string
          feed_type?: string
          id?: string
          notes?: string | null
          period?: string
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeding_schedule_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          animal_id: string | null
          animal_name: string
          created_at: string
          date: string
          farm_id: string
          id: string
          next_due: string | null
          notes: string | null
          provider: string | null
          type: string
          updated_at: string
        }
        Insert: {
          animal_id?: string | null
          animal_name: string
          created_at?: string
          date?: string
          farm_id: string
          id?: string
          next_due?: string | null
          notes?: string | null
          provider?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          animal_id?: string | null
          animal_name?: string
          created_at?: string
          date?: string
          farm_id?: string
          id?: string
          next_due?: string | null
          notes?: string | null
          provider?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
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
      inventory: {
        Row: {
          category: string
          cost_per_unit: number
          created_at: string
          farm_id: string
          id: string
          last_restocked: string | null
          name: string
          notes: string | null
          quantity: number
          reorder_level: number
          storage_location: string | null
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          cost_per_unit?: number
          created_at?: string
          farm_id: string
          id?: string
          last_restocked?: string | null
          name: string
          notes?: string | null
          quantity?: number
          reorder_level?: number
          storage_location?: string | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          cost_per_unit?: number
          created_at?: string
          farm_id?: string
          id?: string
          last_restocked?: string | null
          name?: string
          notes?: string | null
          quantity?: number
          reorder_level?: number
          storage_location?: string | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_usage_log: {
        Row: {
          created_at: string
          farm_id: string
          id: string
          inventory_id: string
          notes: string | null
          quantity_used: number
          reason: string
          usage_date: string
          used_by: string | null
        }
        Insert: {
          created_at?: string
          farm_id: string
          id?: string
          inventory_id: string
          notes?: string | null
          quantity_used: number
          reason: string
          usage_date?: string
          used_by?: string | null
        }
        Update: {
          created_at?: string
          farm_id?: string
          id?: string
          inventory_id?: string
          notes?: string | null
          quantity_used?: number
          reason?: string
          usage_date?: string
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_usage_log_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_log_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock: {
        Row: {
          age: string | null
          breed: string | null
          created_at: string
          farm_id: string
          feed_type: string | null
          id: string
          last_fed: string | null
          name: string
          notes: string | null
          purchase_cost: number | null
          sale_price: number | null
          sold_at: string | null
          sold_to: string | null
          status: string
          tag: string
          type: string
          updated_at: string
          weight: string | null
        }
        Insert: {
          age?: string | null
          breed?: string | null
          created_at?: string
          farm_id: string
          feed_type?: string | null
          id?: string
          last_fed?: string | null
          name: string
          notes?: string | null
          purchase_cost?: number | null
          sale_price?: number | null
          sold_at?: string | null
          sold_to?: string | null
          status?: string
          tag: string
          type: string
          updated_at?: string
          weight?: string | null
        }
        Update: {
          age?: string | null
          breed?: string | null
          created_at?: string
          farm_id?: string
          feed_type?: string | null
          id?: string
          last_fed?: string | null
          name?: string
          notes?: string | null
          purchase_cost?: number | null
          sale_price?: number | null
          sold_at?: string | null
          sold_to?: string | null
          status?: string
          tag?: string
          type?: string
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "livestock_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_compliance_checklists: {
        Row: {
          category_id: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          farm_id: string
          id: string
          item_id: string
          item_text: string
          month_year: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          farm_id: string
          id?: string
          item_id: string
          item_text: string
          month_year: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          farm_id?: string
          id?: string
          item_id?: string
          item_text?: string
          month_year?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_compliance_checklists_farm_id_fkey"
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
      user_roles: {
        Row: {
          assigned_tier: Database["public"]["Enums"]["subscription_tier"] | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_renew_admin_subscription: {
        Args: { _user_id: string }
        Returns: undefined
      }
      get_admin_tier: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_farm_member: {
        Args: { _farm_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      animal_status: "available" | "sold" | "deceased" | "transferred"
      app_role: "admin" | "user"
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
        | "sales"
      incident_severity: "minor" | "moderate" | "serious" | "critical"
      ownership_passes: "on_full_payment" | "on_signature" | "custom"
      payment_method: "eft" | "cash" | "other"
      payment_provider: "paypal" | "yoco"
      price_type: "per_animal" | "per_lot"
      risk_passes: "on_loading" | "on_handover" | "on_delivery" | "custom"
      sale_status: "draft" | "finalized"
      subscription_status:
        | "trialing"
        | "active"
        | "cancelled"
        | "expired"
        | "past_due"
      subscription_tier: "basic" | "starter" | "pro"
      transport_responsibility: "buyer" | "seller" | "split" | "custom"
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
      animal_status: ["available", "sold", "deceased", "transferred"],
      app_role: ["admin", "user"],
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
        "sales",
      ],
      incident_severity: ["minor", "moderate", "serious", "critical"],
      ownership_passes: ["on_full_payment", "on_signature", "custom"],
      payment_method: ["eft", "cash", "other"],
      payment_provider: ["paypal", "yoco"],
      price_type: ["per_animal", "per_lot"],
      risk_passes: ["on_loading", "on_handover", "on_delivery", "custom"],
      sale_status: ["draft", "finalized"],
      subscription_status: [
        "trialing",
        "active",
        "cancelled",
        "expired",
        "past_due",
      ],
      subscription_tier: ["basic", "starter", "pro"],
      transport_responsibility: ["buyer", "seller", "split", "custom"],
    },
  },
} as const
