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
      customer_item_defaults: {
        Row: {
          created_at: string
          customer_id: string
          item_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          item_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_item_defaults_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "master_collection_points"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "customer_item_defaults_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_master_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_item_defaults_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "master_items"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          area: string | null
          created_at: string | null
          default_duration: number | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          created_at?: string | null
          default_duration?: number | null
          id: string
          lat?: number | null
          lng?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          created_at?: string | null
          default_duration?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      decision_proposals: {
        Row: {
          created_at: string | null
          current_value: Json | null
          id: string
          proposal_type: string
          proposed_value: Json | null
          proposer_id: string | null
          reason: string | null
          status: string | null
          target_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: Json | null
          id?: string
          proposal_type: string
          proposed_value?: Json | null
          proposer_id?: string | null
          reason?: string | null
          status?: string | null
          target_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: Json | null
          id?: string
          proposal_type?: string
          proposed_value?: Json | null
          proposer_id?: string | null
          reason?: string | null
          status?: string | null
          target_id?: string | null
        }
        Relationships: []
      }
      decisions: {
        Row: {
          comment: string | null
          created_at: string | null
          decided_at: string | null
          decider_id: string | null
          decision: string | null
          id: string
          proposal_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          decided_at?: string | null
          decider_id?: string | null
          decision?: string | null
          id?: string
          proposal_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          decided_at?: string | null
          decider_id?: string | null
          decision?: string | null
          id?: string
          proposal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "decision_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          default_split_driver_name: string | null
          default_split_time: string | null
          default_split_vehicle_number: string | null
          display_color: string | null
          display_order: number | null
          driver_name: string
          id: string
          is_active: boolean
          route_name: string | null
          updated_at: string
          user_id: string | null
          vehicle_number: string | null
        }
        Insert: {
          created_at?: string
          default_split_driver_name?: string | null
          default_split_time?: string | null
          default_split_vehicle_number?: string | null
          display_color?: string | null
          display_order?: number | null
          driver_name: string
          id: string
          is_active?: boolean
          route_name?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_number?: string | null
        }
        Update: {
          created_at?: string
          default_split_driver_name?: string | null
          default_split_time?: string | null
          default_split_vehicle_number?: string | null
          display_color?: string | null
          display_order?: number | null
          driver_name?: string
          id?: string
          is_active?: boolean
          route_name?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_drivers_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string | null
          id: string
          name: string
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          unit?: string | null
        }
        Relationships: []
      }
      job_contents: {
        Row: {
          actual_weight_kg: number | null
          created_at: string | null
          expected_weight_kg: number | null
          id: string
          item_id: string | null
          job_id: string | null
          note: string | null
        }
        Insert: {
          actual_weight_kg?: number | null
          created_at?: string | null
          expected_weight_kg?: number | null
          id?: string
          item_id?: string | null
          job_id?: string | null
          note?: string | null
        }
        Update: {
          actual_weight_kg?: number | null
          created_at?: string | null
          expected_weight_kg?: number | null
          id?: string
          item_id?: string | null
          job_id?: string | null
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_contents_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          area: string | null
          bucket_type: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          driver_id: string | null
          driver_name: string | null
          duration_minutes: number
          id: string
          is_spot: boolean | null
          is_synced_to_sheet: boolean | null
          item_category: string | null
          job_title: string | null
          note: string | null
          required_vehicle: string | null
          special_notes: string | null
          start_time: string | null
          status: string | null
          task_details: Json | null
          task_type: string | null
          time_constraint: Json | null
          vehicle_lock: string | null
          vehicle_name: string | null
          weight_kg: number | null
          work_type: string | null
        }
        Insert: {
          area?: string | null
          bucket_type?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          driver_id?: string | null
          driver_name?: string | null
          duration_minutes?: number
          id?: string
          is_spot?: boolean | null
          is_synced_to_sheet?: boolean | null
          item_category?: string | null
          job_title?: string | null
          note?: string | null
          required_vehicle?: string | null
          special_notes?: string | null
          start_time?: string | null
          status?: string | null
          task_details?: Json | null
          task_type?: string | null
          time_constraint?: Json | null
          vehicle_lock?: string | null
          vehicle_name?: string | null
          weight_kg?: number | null
          work_type?: string | null
        }
        Update: {
          area?: string | null
          bucket_type?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          driver_id?: string | null
          driver_name?: string | null
          duration_minutes?: number
          id?: string
          is_spot?: boolean | null
          is_synced_to_sheet?: boolean | null
          item_category?: string | null
          job_title?: string | null
          note?: string | null
          required_vehicle?: string | null
          special_notes?: string | null
          start_time?: string | null
          status?: string | null
          task_details?: Json | null
          task_type?: string | null
          time_constraint?: Json | null
          vehicle_lock?: string | null
          vehicle_name?: string | null
          weight_kg?: number | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_vehicle_attrs: {
        Row: {
          empty_vehicle_weight: number | null
          fuel_type: string | null
          max_payload: number | null
          updated_at: string | null
          vehicle_id: string
          vehicle_type: string | null
        }
        Insert: {
          empty_vehicle_weight?: number | null
          fuel_type?: string | null
          max_payload?: number | null
          updated_at?: string | null
          vehicle_id: string
          vehicle_type?: string | null
        }
        Update: {
          empty_vehicle_weight?: number | null
          fuel_type?: string | null
          max_payload?: number | null
          updated_at?: string | null
          vehicle_id?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_vehicle_attrs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "master_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_vehicle_attrs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_collection_points: {
        Row: {
          address: string | null
          collection_days: Json | null
          contractor_id: string | null
          created_at: string
          default_route_code: string | null
          display_name: string | null
          entry_instruction: string | null
          id: string | null
          is_active: boolean | null
          is_spot: boolean | null
          latitude: number | null
          location_id: string
          longitude: number | null
          name: string
          note: string | null
          restricted_vehicle_id: string | null
          safety_note: string | null
          site_contact_phone: string | null
          target_item_category: string | null
          time_constraint_type: string | null
          time_range_end: string | null
          time_range_start: string | null
          updated_at: string
          vehicle_restriction_type: string | null
          visit_slot: string | null
        }
        Insert: {
          address?: string | null
          collection_days?: Json | null
          contractor_id?: string | null
          created_at?: string
          default_route_code?: string | null
          display_name?: string | null
          entry_instruction?: string | null
          id?: string | null
          is_active?: boolean | null
          is_spot?: boolean | null
          latitude?: number | null
          location_id: string
          longitude?: number | null
          name: string
          note?: string | null
          restricted_vehicle_id?: string | null
          safety_note?: string | null
          site_contact_phone?: string | null
          target_item_category?: string | null
          time_constraint_type?: string | null
          time_range_end?: string | null
          time_range_start?: string | null
          updated_at?: string
          vehicle_restriction_type?: string | null
          visit_slot?: string | null
        }
        Update: {
          address?: string | null
          collection_days?: Json | null
          contractor_id?: string | null
          created_at?: string
          default_route_code?: string | null
          display_name?: string | null
          entry_instruction?: string | null
          id?: string | null
          is_active?: boolean | null
          is_spot?: boolean | null
          latitude?: number | null
          location_id?: string
          longitude?: number | null
          name?: string
          note?: string | null
          restricted_vehicle_id?: string | null
          safety_note?: string | null
          site_contact_phone?: string | null
          target_item_category?: string | null
          time_constraint_type?: string | null
          time_range_end?: string | null
          time_range_start?: string | null
          updated_at?: string
          vehicle_restriction_type?: string | null
          visit_slot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_collection_points_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "master_contractors"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "master_collection_points_restricted_vehicle_id_fkey"
            columns: ["restricted_vehicle_id"]
            isOneToOne: false
            referencedRelation: "master_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_collection_points_restricted_vehicle_id_fkey"
            columns: ["restricted_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_contractors: {
        Row: {
          contractor_id: string
          created_at: string
          name: string
          payee_id: string | null
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          name: string
          payee_id?: string | null
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          name?: string
          payee_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_contractors_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "master_payees"
            referencedColumns: ["payee_id"]
          },
        ]
      }
      master_items: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          name: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      master_payees: {
        Row: {
          created_at: string
          name: string
          payee_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          name: string
          payee_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          name?: string
          payee_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      master_vehicles: {
        Row: {
          callsign: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          number: string
          updated_at: string | null
        }
        Insert: {
          callsign?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          number: string
          updated_at?: string | null
        }
        Update: {
          callsign?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      point_access_permissions: {
        Row: {
          created_at: string | null
          driver_id: string
          id: string
          is_active: boolean | null
          note: string | null
          point_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          id?: string
          is_active?: boolean | null
          note?: string | null
          point_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          id?: string
          is_active?: boolean | null
          note?: string | null
          point_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_access_permissions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_access_permissions_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "master_collection_points"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "point_access_permissions_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "view_master_points"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          can_edit_board: boolean | null
          created_at: string
          id: string
          name: string
          role: string
          updated_at: string
          user_id: string | null
          vehicle_info: string | null
        }
        Insert: {
          can_edit_board?: boolean | null
          created_at?: string
          id: string
          name: string
          role: string
          updated_at?: string
          user_id?: string | null
          vehicle_info?: string | null
        }
        Update: {
          can_edit_board?: boolean | null
          created_at?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
          user_id?: string | null
          vehicle_info?: string | null
        }
        Relationships: []
      }
      routes: {
        Row: {
          date: string
          drivers: Json | null
          edit_locked_at: string | null
          edit_locked_by: string | null
          jobs: Json | null
          last_activity_at: string | null
          pending: Json | null
          splits: Json | null
          updated_at: string | null
        }
        Insert: {
          date: string
          drivers?: Json | null
          edit_locked_at?: string | null
          edit_locked_by?: string | null
          jobs?: Json | null
          last_activity_at?: string | null
          pending?: Json | null
          splits?: Json | null
          updated_at?: string | null
        }
        Update: {
          date?: string
          drivers?: Json | null
          edit_locked_at?: string | null
          edit_locked_by?: string | null
          jobs?: Json | null
          last_activity_at?: string | null
          pending?: Json | null
          splits?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      splits: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          replacement_driver_name: string
          replacement_vehicle_number: string
          split_time: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id: string
          replacement_driver_name: string
          replacement_vehicle_number: string
          split_time: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          replacement_driver_name?: string
          replacement_vehicle_number?: string
          split_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "splits_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vehicles: {
        Row: {
          callsign: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          number: string | null
          updated_at: string | null
          vehicle_type: string | null
        }
        Relationships: []
      }
      view_master_points: {
        Row: {
          address: string | null
          contractor_id: string | null
          contractor_name: string | null
          created_at: string | null
          id: string | null
          internal_note: string | null
          is_active: boolean | null
          name: string | null
          payee_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_collection_points_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "master_contractors"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "master_contractors_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "master_payees"
            referencedColumns: ["payee_id"]
          },
        ]
      }
    }
    Functions: {
      rpc_execute_board_update: {
        Args: {
          p_date: string
          p_decision_type?: string
          p_new_state: Json
          p_reason?: string
        }
        Returns: Json
      }
      rpc_execute_master_update: {
        Args: {
          p_core_data?: Json
          p_decision_type?: string
          p_ext_data?: Json
          p_id?: string
          p_reason?: string
          p_table_name: string
          p_user_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
