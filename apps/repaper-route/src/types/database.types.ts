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
      board_actions: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          payload: Json
          reason: string | null
          scheduled_date: string
          source_app: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          payload: Json
          reason?: string | null
          scheduled_date: string
          source_app?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          payload?: Json
          reason?: string | null
          scheduled_date?: string
          source_app?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      board_exceptions: {
        Row: {
          actor_id: string | null
          after_state: Json
          before_state: Json
          created_at: string | null
          exception_type: string
          id: string
          job_id: string | null
          promote_requested: boolean | null
          reason_free_text: string | null
          reason_master_id: string | null
          route_date: string
        }
        Insert: {
          actor_id?: string | null
          after_state: Json
          before_state: Json
          created_at?: string | null
          exception_type: string
          id?: string
          job_id?: string | null
          promote_requested?: boolean | null
          reason_free_text?: string | null
          reason_master_id?: string | null
          route_date: string
        }
        Update: {
          actor_id?: string | null
          after_state?: Json
          before_state?: Json
          created_at?: string | null
          exception_type?: string
          id?: string
          job_id?: string | null
          promote_requested?: boolean | null
          reason_free_text?: string | null
          reason_master_id?: string | null
          route_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_exceptions_reason_master_id_fkey"
            columns: ["reason_master_id"]
            isOneToOne: false
            referencedRelation: "exception_reason_masters"
            referencedColumns: ["id"]
          },
        ]
      }
      board_templates: {
        Row: {
          absent_count: number
          created_at: string
          day_of_week: number
          description: string | null
          id: string
          is_active: boolean
          jobs_json: Json
          name: string
          nth_week: number | null
          updated_at: string
        }
        Insert: {
          absent_count?: number
          created_at?: string
          day_of_week?: number
          description?: string | null
          id?: string
          is_active?: boolean
          jobs_json?: Json
          name: string
          nth_week?: number | null
          updated_at?: string
        }
        Update: {
          absent_count?: number
          created_at?: string
          day_of_week?: number
          description?: string | null
          id?: string
          is_active?: boolean
          jobs_json?: Json
          name?: string
          nth_week?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          contribution_type: string
          created_at: string | null
          created_by: string | null
          id: string
          note: string | null
          points: number
          staff_id: string
          target_date: string
        }
        Insert: {
          contribution_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
          points?: number
          staff_id: string
          target_date: string
        }
        Update: {
          contribution_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
          points?: number
          staff_id?: string
          target_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staffs"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assignments: {
        Row: {
          assigned_date: string
          course_id: string
          created_at: string | null
          id: string
          staff_id: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          assigned_date: string
          course_id: string
          created_at?: string | null
          id?: string
          staff_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          assigned_date?: string
          course_id?: string
          created_at?: string | null
          id?: string
          staff_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "master_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          display_color: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_color?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_color?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_item_defaults: {
        Row: {
          created_at: string
          customer_id: string
          item_id: string
          legacy_customer_id: string | null
          legacy_item_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          item_id: string
          legacy_customer_id?: string | null
          legacy_item_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          item_id?: string
          legacy_customer_id?: string | null
          legacy_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_item_defaults_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_item_defaults_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
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
          legacy_id: string | null
          lng: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          created_at?: string | null
          default_duration?: number | null
          id?: string
          lat?: number | null
          legacy_id?: string | null
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
          legacy_id?: string | null
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
      event_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          decision_id: string | null
          id: string
          state_after: Json | null
          state_before: Json | null
          table_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          decision_id?: string | null
          id?: string
          state_after?: Json | null
          state_before?: Json | null
          table_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          decision_id?: string | null
          id?: string
          state_after?: Json | null
          state_before?: Json | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_logs_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      exception_reason_masters: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          label: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          created_at: string | null
          id: string
          legacy_id: string | null
          name: string
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          legacy_id?: string | null
          name: string
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          legacy_id?: string | null
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
          job_id: string
          note: string | null
          quantity: number | null
          updated_at: string | null
        }
        Insert: {
          actual_weight_kg?: number | null
          created_at?: string | null
          expected_weight_kg?: number | null
          id?: string
          item_id?: string | null
          job_id: string
          note?: string | null
          quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_weight_kg?: number | null
          created_at?: string | null
          expected_weight_kg?: number | null
          id?: string
          item_id?: string | null
          job_id?: string
          note?: string | null
          quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_contents_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "master_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_contents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_time: string | null
          address: string | null
          area: string | null
          bucket_type: string | null
          course_id: string | null
          created_at: string | null
          creation_reason: string | null
          customer_id: string | null
          customer_name: string | null
          duration_minutes: number | null
          id: string
          is_admin_forced: boolean | null
          is_skipped: boolean | null
          is_spot: boolean | null
          item_category: string | null
          job_title: string | null
          location_id: string | null
          note: string | null
          scheduled_date: string
          sort_order: number | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          visit_slot: string | null
          weight_kg: number | null
        }
        Insert: {
          actual_time?: string | null
          address?: string | null
          area?: string | null
          bucket_type?: string | null
          course_id?: string | null
          created_at?: string | null
          creation_reason?: string | null
          customer_id?: string | null
          customer_name?: string | null
          duration_minutes?: number | null
          id?: string
          is_admin_forced?: boolean | null
          is_skipped?: boolean | null
          is_spot?: boolean | null
          item_category?: string | null
          job_title?: string | null
          location_id?: string | null
          note?: string | null
          scheduled_date: string
          sort_order?: number | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          visit_slot?: string | null
          weight_kg?: number | null
        }
        Update: {
          actual_time?: string | null
          address?: string | null
          area?: string | null
          bucket_type?: string | null
          course_id?: string | null
          created_at?: string | null
          creation_reason?: string | null
          customer_id?: string | null
          customer_name?: string | null
          duration_minutes?: number | null
          id?: string
          is_admin_forced?: boolean | null
          is_skipped?: boolean | null
          is_spot?: boolean | null
          item_category?: string | null
          job_title?: string | null
          location_id?: string | null
          note?: string | null
          scheduled_date?: string
          sort_order?: number | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          visit_slot?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_v4: {
        Row: {
          actual_start_time: string | null
          created_at: string | null
          created_by: string | null
          decision_id: string | null
          driver_id: string | null
          duration_minutes: number
          id: string
          is_admin_forced: boolean | null
          is_latest: boolean | null
          job_id: string
          legacy_driver_id: string | null
          legacy_point_id: string | null
          legacy_vehicle_id: string | null
          point_id: string
          preferred_start_time: string | null
          status: string
          vehicle_id: string | null
          version: number
        }
        Insert: {
          actual_start_time?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_id?: string | null
          driver_id?: string | null
          duration_minutes?: number
          id?: string
          is_admin_forced?: boolean | null
          is_latest?: boolean | null
          job_id: string
          legacy_driver_id?: string | null
          legacy_point_id?: string | null
          legacy_vehicle_id?: string | null
          point_id: string
          preferred_start_time?: string | null
          status?: string
          vehicle_id?: string | null
          version?: number
        }
        Update: {
          actual_start_time?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_id?: string | null
          driver_id?: string | null
          duration_minutes?: number
          id?: string
          is_admin_forced?: boolean | null
          is_latest?: boolean | null
          job_id?: string
          legacy_driver_id?: string | null
          legacy_point_id?: string | null
          legacy_vehicle_id?: string | null
          point_id?: string
          preferred_start_time?: string | null
          status?: string
          vehicle_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_v4_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_v4_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_v4_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "master_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_event_id: string | null
          legacy_id: string | null
          name: string
          updated_at: string | null
          weighing_allowed: boolean | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_event_id?: string | null
          legacy_id?: string | null
          name: string
          updated_at?: string | null
          weighing_allowed?: boolean | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_event_id?: string | null
          legacy_id?: string | null
          name?: string
          updated_at?: string | null
          weighing_allowed?: boolean | null
        }
        Relationships: []
      }
      logic_policies: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      manual_injection_reasons: {
        Row: {
          created_at: string | null
          id: string
          last_used_at: string | null
          reason_text: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          reason_text: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          reason_text?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      master_collection_points: {
        Row: {
          address: string | null
          area: string | null
          collection_days: Json | null
          company_phone: string | null
          contractor_id: string | null
          created_at: string
          default_route_code: string | null
          display_name: string | null
          entry_instruction: string | null
          furigana: string | null
          id: string | null
          internal_note: string | null
          is_active: boolean | null
          is_spot: boolean | null
          is_spot_only: boolean | null
          latitude: number | null
          legacy_restricted_vehicle_id: string | null
          location_id: string
          longitude: number | null
          manager_phone: string | null
          name: string
          note: string | null
          recurrence_pattern: string | null
          restricted_vehicle_id: string | null
          safety_note: string | null
          site_contact_phone: string | null
          special_type: string | null
          target_item_category: string | null
          time_constraint_type: string | null
          time_range_end: string | null
          time_range_start: string | null
          updated_at: string
          vehicle_restriction_type: string | null
          visit_slot: string | null
          weighing_site_id: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          collection_days?: Json | null
          company_phone?: string | null
          contractor_id?: string | null
          created_at?: string
          default_route_code?: string | null
          display_name?: string | null
          entry_instruction?: string | null
          furigana?: string | null
          id?: string | null
          internal_note?: string | null
          is_active?: boolean | null
          is_spot?: boolean | null
          is_spot_only?: boolean | null
          latitude?: number | null
          legacy_restricted_vehicle_id?: string | null
          location_id: string
          longitude?: number | null
          manager_phone?: string | null
          name: string
          note?: string | null
          recurrence_pattern?: string | null
          restricted_vehicle_id?: string | null
          safety_note?: string | null
          site_contact_phone?: string | null
          special_type?: string | null
          target_item_category?: string | null
          time_constraint_type?: string | null
          time_range_end?: string | null
          time_range_start?: string | null
          updated_at?: string
          vehicle_restriction_type?: string | null
          visit_slot?: string | null
          weighing_site_id?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          collection_days?: Json | null
          company_phone?: string | null
          contractor_id?: string | null
          created_at?: string
          default_route_code?: string | null
          display_name?: string | null
          entry_instruction?: string | null
          furigana?: string | null
          id?: string | null
          internal_note?: string | null
          is_active?: boolean | null
          is_spot?: boolean | null
          is_spot_only?: boolean | null
          latitude?: number | null
          legacy_restricted_vehicle_id?: string | null
          location_id?: string
          longitude?: number | null
          manager_phone?: string | null
          name?: string
          note?: string | null
          recurrence_pattern?: string | null
          restricted_vehicle_id?: string | null
          safety_note?: string | null
          site_contact_phone?: string | null
          special_type?: string | null
          target_item_category?: string | null
          time_constraint_type?: string | null
          time_range_end?: string | null
          time_range_start?: string | null
          updated_at?: string
          vehicle_restriction_type?: string | null
          visit_slot?: string | null
          weighing_site_id?: string | null
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
        ]
      }
      master_contractors: {
        Row: {
          contractor_id: string
          created_at: string
          furigana: string | null
          name: string
          note: string | null
          payee_id: string | null
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          furigana?: string | null
          name: string
          note?: string | null
          payee_id?: string | null
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          furigana?: string | null
          name?: string
          note?: string | null
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
          furigana: string | null
          id: string
          is_active: boolean | null
          name: string
          note: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          furigana?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          note?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          furigana?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          note?: string | null
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
          furigana: string | null
          id: string
          is_active: boolean | null
          legacy_id: string | null
          max_payload: number | null
          note: string | null
          number: string
          updated_at: string | null
        }
        Insert: {
          callsign?: string | null
          created_at?: string | null
          furigana?: string | null
          id?: string
          is_active?: boolean | null
          legacy_id?: string | null
          max_payload?: number | null
          note?: string | null
          number: string
          updated_at?: string | null
        }
        Update: {
          callsign?: string | null
          created_at?: string | null
          furigana?: string | null
          id?: string
          is_active?: boolean | null
          legacy_id?: string | null
          max_payload?: number | null
          note?: string | null
          number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payers: {
        Row: {
          closing_date: number | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_event_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          closing_date?: number | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_event_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          closing_date?: number | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_event_id?: string | null
          name?: string
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
          {
            foreignKeyName: "point_access_permissions_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "view_master_points"
            referencedColumns: ["location_id"]
          },
        ]
      }
      profiles: {
        Row: {
          can_edit_board: boolean | null
          created_at: string
          device_mode: string | null
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
          device_mode?: string | null
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
          device_mode?: string | null
          id?: string
          name?: string
          role?: string
          updated_at?: string
          user_id?: string | null
          vehicle_info?: string | null
        }
        Relationships: []
      }
      proto_board_snapshots: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          snapshot: Json
          target_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          snapshot: Json
          target_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          snapshot?: Json
          target_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      proto_colleagues: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      proto_contributions: {
        Row: {
          contribution_type: string
          created_at: string
          driver_id: string
          id: string
          points: number
          target_date: string
        }
        Insert: {
          contribution_type: string
          created_at?: string
          driver_id: string
          id?: string
          points?: number
          target_date: string
        }
        Update: {
          contribution_type?: string
          created_at?: string
          driver_id?: string
          id?: string
          points?: number
          target_date?: string
        }
        Relationships: []
      }
      proto_courses: {
        Row: {
          color_class: string
          course_name: string
          created_at: string | null
          driver_name: string
          id: string
          order_index: number | null
          vehicle_name: string
        }
        Insert: {
          color_class: string
          course_name: string
          created_at?: string | null
          driver_name: string
          id?: string
          order_index?: number | null
          vehicle_name: string
        }
        Update: {
          color_class?: string
          course_name?: string
          created_at?: string | null
          driver_name?: string
          id?: string
          order_index?: number | null
          vehicle_name?: string
        }
        Relationships: []
      }
      proto_customers: {
        Row: {
          address: string | null
          area: string | null
          created_at: string | null
          default_duration: number | null
          id: string
          lat: number | null
          legacy_id: string | null
          lng: number | null
          name: string
          required_vehicle: string | null
          updated_at: string | null
          visits: Json | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          created_at?: string | null
          default_duration?: number | null
          id?: string
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          name: string
          required_vehicle?: string | null
          updated_at?: string | null
          visits?: Json | null
        }
        Update: {
          address?: string | null
          area?: string | null
          created_at?: string | null
          default_duration?: number | null
          id?: string
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          name?: string
          required_vehicle?: string | null
          updated_at?: string | null
          visits?: Json | null
        }
        Relationships: []
      }
      proto_daily_jobs: {
        Row: {
          actual_duration_minutes: number | null
          actual_start_time: string | null
          bucket: string | null
          created_at: string | null
          customer: string | null
          driver_id: string | null
          estimated_weight_kg: number | null
          id: string
          plan_duration_minutes: number | null
          plan_start_time: string | null
          status: string
          target_date: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          actual_start_time?: string | null
          bucket?: string | null
          created_at?: string | null
          customer?: string | null
          driver_id?: string | null
          estimated_weight_kg?: number | null
          id?: string
          plan_duration_minutes?: number | null
          plan_start_time?: string | null
          status?: string
          target_date: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          actual_start_time?: string | null
          bucket?: string | null
          created_at?: string | null
          customer?: string | null
          driver_id?: string | null
          estimated_weight_kg?: number | null
          id?: string
          plan_duration_minutes?: number | null
          plan_start_time?: string | null
          status?: string
          target_date?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proto_daily_jobs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "proto_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_event_logs: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          job_id: string | null
          reason: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          reason: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          reason?: string
          user_id?: string | null
        }
        Relationships: []
      }
      proto_job_actuals: {
        Row: {
          actual_driver_id: string | null
          actual_duration_minutes: number | null
          actual_start_time: string | null
          actual_vehicle_id: string | null
          actual_weight_kg: number | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          job_id: string
          photo_path: string | null
          updated_at: string | null
        }
        Insert: {
          actual_driver_id?: string | null
          actual_duration_minutes?: number | null
          actual_start_time?: string | null
          actual_vehicle_id?: string | null
          actual_weight_kg?: number | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          job_id: string
          photo_path?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_driver_id?: string | null
          actual_duration_minutes?: number | null
          actual_start_time?: string | null
          actual_vehicle_id?: string | null
          actual_weight_kg?: number | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          job_id?: string
          photo_path?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proto_job_actuals_actual_vehicle_id_fkey"
            columns: ["actual_vehicle_id"]
            isOneToOne: false
            referencedRelation: "proto_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_job_actuals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "proto_daily_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_job_templates: {
        Row: {
          base_template_id: string | null
          base_template_name: string | null
          created_at: string | null
          day_of_week: string | null
          id: string
          jobs_data: Json
          name: string
          tags: string[] | null
          week_number: number | null
        }
        Insert: {
          base_template_id?: string | null
          base_template_name?: string | null
          created_at?: string | null
          day_of_week?: string | null
          id?: string
          jobs_data: Json
          name: string
          tags?: string[] | null
          week_number?: number | null
        }
        Update: {
          base_template_id?: string | null
          base_template_name?: string | null
          created_at?: string | null
          day_of_week?: string | null
          id?: string
          jobs_data?: Json
          name?: string
          tags?: string[] | null
          week_number?: number | null
        }
        Relationships: []
      }
      proto_spot_requests: {
        Row: {
          bucket: string | null
          created_at: string | null
          customer_id: string | null
          details: string | null
          estimated_duration_minutes: number | null
          id: string
          status: string
          target_date: string
          time_window: string | null
          title: string | null
        }
        Insert: {
          bucket?: string | null
          created_at?: string | null
          customer_id?: string | null
          details?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          status?: string
          target_date: string
          time_window?: string | null
          title?: string | null
        }
        Update: {
          bucket?: string | null
          created_at?: string | null
          customer_id?: string | null
          details?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          status?: string
          target_date?: string
          time_window?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proto_spot_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "proto_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_vehicles: {
        Row: {
          color: string | null
          course_name: string | null
          created_at: string | null
          driver_name: string | null
          id: string
          is_active: boolean | null
          max_weight_kg: number | null
          name: string | null
          vehicle_number: string | null
        }
        Insert: {
          color?: string | null
          course_name?: string | null
          created_at?: string | null
          driver_name?: string | null
          id?: string
          is_active?: boolean | null
          max_weight_kg?: number | null
          name?: string | null
          vehicle_number?: string | null
        }
        Update: {
          color?: string | null
          course_name?: string | null
          created_at?: string | null
          driver_name?: string | null
          id?: string
          is_active?: boolean | null
          max_weight_kg?: number | null
          name?: string | null
          vehicle_number?: string | null
        }
        Relationships: []
      }
      rama_alert_rules: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          rule_name: string
          rule_type: string
          target_type: string
          threshold: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          rule_name: string
          rule_type: string
          target_type: string
          threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          rule_name?: string
          rule_type?: string
          target_type?: string
          threshold?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rama_inbound_logs: {
        Row: {
          amount: number | null
          car_number: string | null
          created_at: string | null
          id: number
          item_code: string | null
          item_name: string | null
          log_date: string
          log_time: string | null
          medium_category: string | null
          net_weight_kg: number
          net_weight_t: number
          partner_code: string | null
          partner_name: string | null
          quantity: number | null
          remarks: string | null
          slip_number: string | null
          tax_excluded_amount: number | null
          transaction_type: string | null
          transaction_type_code: string | null
          unit: string | null
          unit_price: number | null
          weather: string | null
          yard_code: string | null
          yard_name: string | null
        }
        Insert: {
          amount?: number | null
          car_number?: string | null
          created_at?: string | null
          id?: number
          item_code?: string | null
          item_name?: string | null
          log_date: string
          log_time?: string | null
          medium_category?: string | null
          net_weight_kg: number
          net_weight_t: number
          partner_code?: string | null
          partner_name?: string | null
          quantity?: number | null
          remarks?: string | null
          slip_number?: string | null
          tax_excluded_amount?: number | null
          transaction_type?: string | null
          transaction_type_code?: string | null
          unit?: string | null
          unit_price?: number | null
          weather?: string | null
          yard_code?: string | null
          yard_name?: string | null
        }
        Update: {
          amount?: number | null
          car_number?: string | null
          created_at?: string | null
          id?: number
          item_code?: string | null
          item_name?: string | null
          log_date?: string
          log_time?: string | null
          medium_category?: string | null
          net_weight_kg?: number
          net_weight_t?: number
          partner_code?: string | null
          partner_name?: string | null
          quantity?: number | null
          remarks?: string | null
          slip_number?: string | null
          tax_excluded_amount?: number | null
          transaction_type?: string | null
          transaction_type_code?: string | null
          unit?: string | null
          unit_price?: number | null
          weather?: string | null
          yard_code?: string | null
          yard_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rama_inbound_logs_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "rama_master_items"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "rama_inbound_logs_partner_code_fkey"
            columns: ["partner_code"]
            isOneToOne: false
            referencedRelation: "rama_master_partners"
            referencedColumns: ["partner_code"]
          },
        ]
      }
      rama_master_items: {
        Row: {
          category_code: string | null
          created_at: string | null
          item_code: string
          item_name: string
          major_category: string
          packing_style_flag: string
        }
        Insert: {
          category_code?: string | null
          created_at?: string | null
          item_code: string
          item_name: string
          major_category?: string
          packing_style_flag?: string
        }
        Update: {
          category_code?: string | null
          created_at?: string | null
          item_code?: string
          item_name?: string
          major_category?: string
          packing_style_flag?: string
        }
        Relationships: []
      }
      rama_master_partners: {
        Row: {
          created_at: string | null
          is_self_partner: boolean | null
          partner_code: string
          partner_name: string
        }
        Insert: {
          created_at?: string | null
          is_self_partner?: boolean | null
          partner_code: string
          partner_name: string
        }
        Update: {
          created_at?: string | null
          is_self_partner?: boolean | null
          partner_code?: string
          partner_name?: string
        }
        Relationships: []
      }
      rama_outbound_logs: {
        Row: {
          amount: number | null
          car_number: string | null
          created_at: string | null
          id: number
          item_code: string | null
          item_name: string | null
          log_date: string
          log_time: string | null
          medium_category: string | null
          net_weight_kg: number
          net_weight_t: number
          partner_code: string | null
          partner_name: string | null
          quantity: number | null
          remarks: string | null
          slip_number: string | null
          tax_excluded_amount: number | null
          transaction_type_code: string | null
          unit: string | null
          unit_price: number | null
          weather: string | null
          yard_code: string | null
          yard_name: string | null
        }
        Insert: {
          amount?: number | null
          car_number?: string | null
          created_at?: string | null
          id?: number
          item_code?: string | null
          item_name?: string | null
          log_date: string
          log_time?: string | null
          medium_category?: string | null
          net_weight_kg: number
          net_weight_t: number
          partner_code?: string | null
          partner_name?: string | null
          quantity?: number | null
          remarks?: string | null
          slip_number?: string | null
          tax_excluded_amount?: number | null
          transaction_type_code?: string | null
          unit?: string | null
          unit_price?: number | null
          weather?: string | null
          yard_code?: string | null
          yard_name?: string | null
        }
        Update: {
          amount?: number | null
          car_number?: string | null
          created_at?: string | null
          id?: number
          item_code?: string | null
          item_name?: string | null
          log_date?: string
          log_time?: string | null
          medium_category?: string | null
          net_weight_kg?: number
          net_weight_t?: number
          partner_code?: string | null
          partner_name?: string | null
          quantity?: number | null
          remarks?: string | null
          slip_number?: string | null
          tax_excluded_amount?: number | null
          transaction_type_code?: string | null
          unit?: string | null
          unit_price?: number | null
          weather?: string | null
          yard_code?: string | null
          yard_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rama_outbound_logs_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "rama_master_items"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "rama_outbound_logs_partner_code_fkey"
            columns: ["partner_code"]
            isOneToOne: false
            referencedRelation: "rama_master_partners"
            referencedColumns: ["partner_code"]
          },
        ]
      }
      routes: {
        Row: {
          confirmed_at: string | null
          confirmed_snapshot: Json | null
          data: Json | null
          edit_locked_at: string | null
          edit_locked_by: string | null
          last_activity_at: string | null
          scheduled_date: string
          source_app: string | null
          updated_at: string | null
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_snapshot?: Json | null
          data?: Json | null
          edit_locked_at?: string | null
          edit_locked_by?: string | null
          last_activity_at?: string | null
          scheduled_date: string
          source_app?: string | null
          updated_at?: string | null
        }
        Update: {
          confirmed_at?: string | null
          confirmed_snapshot?: Json | null
          data?: Json | null
          edit_locked_at?: string | null
          edit_locked_by?: string | null
          last_activity_at?: string | null
          scheduled_date?: string
          source_app?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scale_ai_inference_logs: {
        Row: {
          attempts_payload: Json | null
          created_at: string
          id: number
          inferred_empty_weight: number | null
          inferred_net_weight: number | null
          inferred_total_weight: number | null
          ocr_raw_text: string | null
          pdf_file_name: string
          processing_time_seconds: number | null
        }
        Insert: {
          attempts_payload?: Json | null
          created_at?: string
          id?: number
          inferred_empty_weight?: number | null
          inferred_net_weight?: number | null
          inferred_total_weight?: number | null
          ocr_raw_text?: string | null
          pdf_file_name: string
          processing_time_seconds?: number | null
        }
        Update: {
          attempts_payload?: Json | null
          created_at?: string
          id?: number
          inferred_empty_weight?: number | null
          inferred_net_weight?: number | null
          inferred_total_weight?: number | null
          ocr_raw_text?: string | null
          pdf_file_name?: string
          processing_time_seconds?: number | null
        }
        Relationships: []
      }
      scale_raw_purchases: {
        Row: {
          amount: number | null
          created_at: string
          id: number
          item_name: string | null
          net_weight: number | null
          raw_payload: Json | null
          slip_no: string
          supplier_code: string | null
          supplier_name: string | null
          vehicle_no: string | null
          weigh_date: string | null
          weigh_time: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: number
          item_name?: string | null
          net_weight?: number | null
          raw_payload?: Json | null
          slip_no: string
          supplier_code?: string | null
          supplier_name?: string | null
          vehicle_no?: string | null
          weigh_date?: string | null
          weigh_time?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: number
          item_name?: string | null
          net_weight?: number | null
          raw_payload?: Json | null
          slip_no?: string
          supplier_code?: string | null
          supplier_name?: string | null
          vehicle_no?: string | null
          weigh_date?: string | null
          weigh_time?: string | null
        }
        Relationships: []
      }
      scale_raw_sales: {
        Row: {
          amount: number | null
          created_at: string
          customer_code: string | null
          customer_name: string | null
          id: number
          item_name: string | null
          net_weight: number | null
          raw_payload: Json | null
          sales_date: string | null
          shipping_date: string | null
          slip_no: string
          vehicle_no: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          customer_code?: string | null
          customer_name?: string | null
          id?: number
          item_name?: string | null
          net_weight?: number | null
          raw_payload?: Json | null
          sales_date?: string | null
          shipping_date?: string | null
          slip_no: string
          vehicle_no?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          customer_code?: string | null
          customer_name?: string | null
          id?: number
          item_name?: string | null
          net_weight?: number | null
          raw_payload?: Json | null
          sales_date?: string | null
          shipping_date?: string | null
          slip_no?: string
          vehicle_no?: string | null
        }
        Relationships: []
      }
      scale_reconciled_records: {
        Row: {
          ai_net_weight: number | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          csv_net_weight: number | null
          id: number
          notes: string | null
          record_type: string
          slip_no: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_net_weight?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          csv_net_weight?: number | null
          id?: number
          notes?: string | null
          record_type: string
          slip_no: string
          status: string
          updated_at?: string
        }
        Update: {
          ai_net_weight?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          csv_net_weight?: number | null
          id?: number
          notes?: string | null
          record_type?: string
          slip_no?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      special_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          driver_id: string | null
          end_time: string
          id: string
          is_active: boolean | null
          legacy_vehicle_id: string | null
          lock_driver: boolean | null
          lock_vehicle: boolean | null
          sdr_id: string | null
          start_time: string
          vehicle_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          driver_id?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          legacy_vehicle_id?: string | null
          lock_driver?: boolean | null
          lock_vehicle?: boolean | null
          sdr_id?: string | null
          start_time: string
          vehicle_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          driver_id?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          legacy_vehicle_id?: string | null
          lock_driver?: boolean | null
          lock_vehicle?: boolean | null
          sdr_id?: string | null
          start_time?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_activities_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_activities_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_activities_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "master_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      splitters: {
        Row: {
          created_at: string | null
          driver_id: string
          id: string
          is_active: boolean | null
          note: string | null
          split_time: string
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          id?: string
          is_active?: boolean | null
          note?: string | null
          split_time: string
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          id?: string
          is_active?: boolean | null
          note?: string | null
          split_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "splitters_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staffs: {
        Row: {
          allowed_apps: Json | null
          auth_uid: string | null
          can_edit_board: boolean | null
          created_at: string | null
          device_mode: string | null
          id: string
          is_active: boolean | null
          name: string
          phone_number: string | null
          role: string | null
          updated_at: string | null
          vehicle_info: string | null
        }
        Insert: {
          allowed_apps?: Json | null
          auth_uid?: string | null
          can_edit_board?: boolean | null
          created_at?: string | null
          device_mode?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone_number?: string | null
          role?: string | null
          updated_at?: string | null
          vehicle_info?: string | null
        }
        Update: {
          allowed_apps?: Json | null
          auth_uid?: string | null
          can_edit_board?: boolean | null
          created_at?: string | null
          device_mode?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone_number?: string | null
          role?: string | null
          updated_at?: string | null
          vehicle_info?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_event_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_event_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_event_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      proto_pending_jobs_view: {
        Row: {
          estimated_duration_minutes: number | null
          source_id: string | null
          source_type: string | null
          status: string | null
          target_date: string | null
        }
        Relationships: []
      }
      rama_v_monthly_summary: {
        Row: {
          inbound_amount: number | null
          inbound_row_count: number | null
          inbound_weight_kg: number | null
          inbound_weight_t: number | null
          outbound_amount: number | null
          outbound_row_count: number | null
          outbound_weight_kg: number | null
          outbound_weight_t: number | null
          year_month: string | null
        }
        Relationships: []
      }
      view_master_points: {
        Row: {
          address: string | null
          area: string | null
          collection_days: Json | null
          company_phone: string | null
          contractor_id: string | null
          contractor_name: string | null
          created_at: string | null
          display_name: string | null
          furigana: string | null
          id: string | null
          internal_note: string | null
          is_active: boolean | null
          is_spot_only: boolean | null
          latitude: number | null
          location_id: string | null
          longitude: number | null
          manager_phone: string | null
          name: string | null
          note: string | null
          payee_id: string | null
          recurrence_pattern: string | null
          restricted_vehicle_id: string | null
          site_contact_phone: string | null
          special_type: string | null
          target_item_category: string | null
          time_constraint_type: string | null
          updated_at: string | null
          vehicle_restriction_type: string | null
          visit_slot: string | null
          weighing_site_id: string | null
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
      get_dynamic_eta: {
        Args: { p_bucket: string; p_customer: string }
        Returns: number
      }
      get_multidimensional_scores: { Args: { p_date: string }; Returns: Json }
      rama_get_inbound_partners: {
        Args: never
        Returns: {
          partner_code: string
          partner_name: string
        }[]
      }
      rama_get_supplier_weight: {
        Args: {
          p_end_date?: string
          p_item_code?: string
          p_partner_code?: string
          p_site_id?: string
          p_start_date?: string
        }
        Returns: {
          item_name: string
          partner_name: string
          total_weight_t: number
        }[]
      }
      rpc_commit_commander_plan: {
        Args: { p_date: string; p_plan_data: Json }
        Returns: Json
      }
      rpc_debug_echo: { Args: { p_data: Json }; Returns: Json }
      rpc_execute_board_update: {
        Args: {
          p_client_meta?: Json
          p_date: string
          p_decision_type?: string
          p_ext_data?: Json
          p_new_state: Json
          p_reason?: string
          p_user_id?: string
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
      rpc_fetch_periodic_points_by_date: {
        Args: { p_target_date: string }
        Returns: {
          address: string | null
          area: string | null
          collection_days: Json | null
          company_phone: string | null
          contractor_id: string | null
          created_at: string
          default_route_code: string | null
          display_name: string | null
          entry_instruction: string | null
          furigana: string | null
          id: string | null
          internal_note: string | null
          is_active: boolean | null
          is_spot: boolean | null
          is_spot_only: boolean | null
          latitude: number | null
          legacy_restricted_vehicle_id: string | null
          location_id: string
          longitude: number | null
          manager_phone: string | null
          name: string
          note: string | null
          recurrence_pattern: string | null
          restricted_vehicle_id: string | null
          safety_note: string | null
          site_contact_phone: string | null
          special_type: string | null
          target_item_category: string | null
          time_constraint_type: string | null
          time_range_end: string | null
          time_range_start: string | null
          updated_at: string
          vehicle_restriction_type: string | null
          visit_slot: string | null
          weighing_site_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "master_collection_points"
          isOneToOne: false
          isSetofReturn: true
        }
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
