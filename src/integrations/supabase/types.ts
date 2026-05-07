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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_code: string
          id: string
          issued_at: string
          kind: string
          recipient_name: string
          team_id: string
          user_id: string
        }
        Insert: {
          certificate_code?: string
          id?: string
          issued_at?: string
          kind?: string
          recipient_name: string
          team_id: string
          user_id: string
        }
        Update: {
          certificate_code?: string
          id?: string
          issued_at?: string
          kind?: string
          recipient_name?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          college: string | null
          course: string | null
          created_at: string
          dietary_restrictions: string | null
          dob: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          github_url: string | null
          id: string
          is_complete: boolean
          last_name: string | null
          linkedin_url: string | null
          pass_code: string
          payment_ref: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone: string | null
          resume_url: string | null
          tshirt_size: string | null
          updated_at: string
          user_id: string
          year_of_study: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          college?: string | null
          course?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_complete?: boolean
          last_name?: string | null
          linkedin_url?: string | null
          pass_code?: string
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          resume_url?: string | null
          tshirt_size?: string | null
          updated_at?: string
          user_id: string
          year_of_study?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          college?: string | null
          course?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_complete?: boolean
          last_name?: string | null
          linkedin_url?: string | null
          pass_code?: string
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          resume_url?: string | null
          tshirt_size?: string | null
          updated_at?: string
          user_id?: string
          year_of_study?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          attachment_url: string | null
          demo_url: string | null
          description: string
          id: string
          problem_statement: string | null
          repo_url: string | null
          screenshots: string[] | null
          solution_approach: string | null
          submitted_at: string
          team_id: string
          tech_stack: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          attachment_url?: string | null
          demo_url?: string | null
          description: string
          id?: string
          problem_statement?: string | null
          repo_url?: string | null
          screenshots?: string[] | null
          solution_approach?: string | null
          submitted_at?: string
          team_id: string
          tech_stack?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          attachment_url?: string | null
          demo_url?: string | null
          description?: string
          id?: string
          problem_statement?: string | null
          repo_url?: string | null
          screenshots?: string[] | null
          solution_approach?: string | null
          submitted_at?: string
          team_id?: string
          tech_stack?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          college: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["member_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          college?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          team_id: string
          user_id: string
        }
        Update: {
          college?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          is_winner: boolean
          leader_id: string
          name: string
          pass_code: string
          payment_ref: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          tagline: string | null
          track: Database["public"]["Enums"]["track_kind"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_winner?: boolean
          leader_id: string
          name: string
          pass_code?: string
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          tagline?: string | null
          track: Database["public"]["Enums"]["track_kind"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_winner?: boolean
          leader_id?: string
          name?: string
          pass_code?: string
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          tagline?: string | null
          track?: Database["public"]["Enums"]["track_kind"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      change_team_leader: {
        Args: { p_new_leader_id: string }
        Returns: undefined
      }
      change_team_track: {
        Args: { p_new_track: Database["public"]["Enums"]["track_kind"] }
        Returns: undefined
      }
      delete_team: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_leader: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      join_team_by_code: { Args: { p_code: string }; Returns: string }
      leave_team: { Args: never; Returns: undefined }
      verify_participant_pass: {
        Args: { p_code: string }
        Returns: {
          issued_at: string
          participant_name: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          team_name: string
          track: Database["public"]["Enums"]["track_kind"]
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "participant"
      member_role: "leader" | "member"
      payment_status: "unpaid" | "pending" | "paid" | "refunded"
      track_kind:
        | "healthcare"
        | "fintech"
        | "sustainability"
        | "education"
        | "open"
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
      app_role: ["admin", "participant"],
      member_role: ["leader", "member"],
      payment_status: ["unpaid", "pending", "paid", "refunded"],
      track_kind: [
        "healthcare",
        "fintech",
        "sustainability",
        "education",
        "open",
      ],
    },
  },
} as const
