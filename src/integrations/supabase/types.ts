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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendants: {
        Row: {
          created_by: string | null
          created_on: string | null
          deleted_by: string | null
          deleted_on: string | null
          id: string
          is_deleted: boolean | null
          location_id: string | null
          status: string | null
          updated_by: string | null
          updated_on: string | null
          user_id: string
        }
        Insert: {
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          id?: string
          is_deleted?: boolean | null
          location_id?: string | null
          status?: string | null
          updated_by?: string | null
          updated_on?: string | null
          user_id: string
        }
        Update: {
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          id?: string
          is_deleted?: boolean | null
          location_id?: string | null
          status?: string | null
          updated_by?: string | null
          updated_on?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendants_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          allowed_attendants_per_location: number | null
          allowed_locations: number | null
          company_name: string | null
          contact_number: string | null
          created_by: string | null
          created_on: string | null
          deleted_by: string | null
          deleted_on: string | null
          id: string
          is_deleted: boolean | null
          rates_2wheeler: Json | null
          rates_4wheeler: Json | null
          status: string | null
          updated_by: string | null
          updated_on: string | null
          user_id: string
        }
        Insert: {
          allowed_attendants_per_location?: number | null
          allowed_locations?: number | null
          company_name?: string | null
          contact_number?: string | null
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          id?: string
          is_deleted?: boolean | null
          rates_2wheeler?: Json | null
          rates_4wheeler?: Json | null
          status?: string | null
          updated_by?: string | null
          updated_on?: string | null
          user_id: string
        }
        Update: {
          allowed_attendants_per_location?: number | null
          allowed_locations?: number | null
          company_name?: string | null
          contact_number?: string | null
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          id?: string
          is_deleted?: boolean | null
          rates_2wheeler?: Json | null
          rates_4wheeler?: Json | null
          status?: string | null
          updated_by?: string | null
          updated_on?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_locations: {
        Row: {
          address: string
          city: string | null
          contractor_id: string
          created_by: string | null
          created_on: string | null
          deleted_by: string | null
          deleted_on: string | null
          id: string
          is_deleted: boolean | null
          locations_name: string
          occupied_slots: number | null
          pincode: string | null
          state: string | null
          status: string | null
          total_slots: number | null
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          address: string
          city?: string | null
          contractor_id: string
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          id?: string
          is_deleted?: boolean | null
          locations_name: string
          occupied_slots?: number | null
          pincode?: string | null
          state?: string | null
          status?: string | null
          total_slots?: number | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          contractor_id?: string
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          id?: string
          is_deleted?: boolean | null
          locations_name?: string
          occupied_slots?: number | null
          pincode?: string | null
          state?: string | null
          status?: string | null
          total_slots?: number | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_locations_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          attendant_name: string | null
          contractor_name: string | null
          created_by: string | null
          created_on: string | null
          deleted_by: string | null
          deleted_on: string | null
          device_fingerprint: string | null
          email: string
          id: string
          is_deleted: boolean | null
          is_first_login: boolean | null
          phone_number: string | null
          role: string
          status: string | null
          subscription_plan_id: string | null
          subscription_start_date: string | null
          subscription_end_date: string | null
          subscription_status: string | null
          updated_by: string | null
          updated_on: string | null
          user_name: string
        }
        Insert: {
          attendant_name?: string | null
          contractor_name?: string | null
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          device_fingerprint?: string | null
          email: string
          id: string
          is_deleted?: boolean | null
          is_first_login?: boolean | null
          phone_number?: string | null
          role: string
          status?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          updated_by?: string | null
          updated_on?: string | null
          user_name: string
        }
        Update: {
          attendant_name?: string | null
          contractor_name?: string | null
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          device_fingerprint?: string | null
          email?: string
          id?: string
          is_deleted?: boolean | null
          is_first_login?: boolean | null
          phone_number?: string | null
          role?: string
          status?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          updated_by?: string | null
          updated_on?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_by: string | null
          created_on: string | null
          deleted_by: string | null
          deleted_on: string | null
          gate_in_id: string
          gate_out_id: string | null
          id: string
          is_deleted: boolean | null
          location_id: string
          payment_amount: number | null
          payment_status: string | null
          status: string | null
          time_in: string
          time_out: string | null
          updated_by: string | null
          updated_on: string | null
          vehicle_id: string
        }
        Insert: {
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          gate_in_id: string
          gate_out_id?: string | null
          id?: string
          is_deleted?: boolean | null
          location_id: string
          payment_amount?: number | null
          payment_status?: string | null
          status?: string | null
          time_in: string
          time_out?: string | null
          updated_by?: string | null
          updated_on?: string | null
          vehicle_id: string
        }
        Update: {
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          gate_in_id?: string
          gate_out_id?: string | null
          id?: string
          is_deleted?: boolean | null
          location_id?: string
          payment_amount?: number | null
          payment_status?: string | null
          status?: string | null
          time_in?: string
          time_out?: string | null
          updated_by?: string | null
          updated_on?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_on: string | null
          features: Json | null
          id: string
          is_deleted: boolean | null
          max_attendants: number
          max_locations: number
          name: string
          price: number
          updated_on: string | null
        }
        Insert: {
          created_on?: string | null
          features?: Json | null
          id?: string
          is_deleted?: boolean | null
          max_attendants: number
          max_locations: number
          name: string
          price: number
          updated_on?: string | null
        }
        Update: {
          created_on?: string | null
          features?: Json | null
          id?: string
          is_deleted?: boolean | null
          max_attendants?: number
          max_locations?: number
          name?: string
          price?: number
          updated_on?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          contractor_id: string
          created_by: string | null
          created_on: string | null
          deleted_by: string | null
          deleted_on: string | null
          gate_in_id: string | null
          gate_out_id: string | null
          id: string
          is_deleted: boolean | null
          location_id: string
          payment_amount: number | null
          payment_status: string | null
          plate_number: string
          receipt_id: string | null
          session_id: string | null
          updated_by: string | null
          updated_on: string | null
          vehicle_type: string
        }
        Insert: {
          check_in_time: string
          check_out_time?: string | null
          contractor_id: string
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          gate_in_id?: string | null
          gate_out_id?: string | null
          id?: string
          is_deleted?: boolean | null
          location_id: string
          payment_amount?: number | null
          payment_status?: string | null
          plate_number: string
          receipt_id?: string | null
          session_id?: string | null
          updated_by?: string | null
          updated_on?: string | null
          vehicle_type: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          contractor_id?: string
          created_by?: string | null
          created_on?: string | null
          deleted_by?: string | null
          deleted_on?: string | null
          gate_in_id?: string | null
          gate_out_id?: string | null
          id?: string
          is_deleted?: boolean | null
          location_id?: string
          payment_amount?: number | null
          payment_status?: string | null
          plate_number?: string
          receipt_id?: string | null
          session_id?: string | null
          updated_by?: string | null
          updated_on?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          vehicle_id: string
          location_id: string
          contractor_id: string
          attendant_id: string | null
          amount: number
          payment_method: string
          payment_status: string
          duration_hours: number | null
          hourly_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          location_id: string
          contractor_id: string
          attendant_id?: string | null
          amount: number
          payment_method: string
          payment_status: string
          duration_hours?: number | null
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          location_id?: string
          contractor_id?: string
          attendant_id?: string | null
          amount?: number
          payment_method?: string
          payment_status?: string
          duration_hours?: number | null
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "attendants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
