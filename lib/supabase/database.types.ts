export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_user: {
        Row: {
          created_at: string
          email: string
          id: string
          status: string
          telefone: string | null
          two_factor_configured: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          status?: string
          telefone?: string | null
          two_factor_configured?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          status?: string
          telefone?: string | null
          two_factor_configured?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          acao: string
          created_at: string
          diff: Json | null
          entidade: string
          id: string
          registro_id: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          diff?: Json | null
          entidade: string
          id?: string
          registro_id?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          diff?: Json | null
          entidade?: string
          id?: string
          registro_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      marquee: {
        Row: {
          created_at: string
          id: string
          nome: string
          props_visuais: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          props_visuais?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          props_visuais?: Json
          updated_at?: string
        }
        Relationships: []
      }
      marquee_item: {
        Row: {
          created_at: string
          id: string
          imagem: string | null
          marquee_id: string
          ordem: number
          tela_destino_id: string | null
          tipo_nav: string
          titulo: string
          updated_at: string
          url_externa: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          imagem?: string | null
          marquee_id: string
          ordem?: number
          tela_destino_id?: string | null
          tipo_nav: string
          titulo: string
          updated_at?: string
          url_externa?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          imagem?: string | null
          marquee_id?: string
          ordem?: number
          tela_destino_id?: string | null
          tipo_nav?: string
          titulo?: string
          updated_at?: string
          url_externa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marquee_item_marquee_id_fkey"
            columns: ["marquee_id"]
            isOneToOne: false
            referencedRelation: "marquee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marquee_item_tela_destino_id_fkey"
            columns: ["tela_destino_id"]
            isOneToOne: false
            referencedRelation: "tela"
            referencedColumns: ["id"]
          },
        ]
      }
      marquee_tela: {
        Row: {
          created_at: string
          id: string
          marquee_id: string
          tela_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          marquee_id: string
          tela_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          marquee_id?: string
          tela_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marquee_tela_marquee_id_fkey"
            columns: ["marquee_id"]
            isOneToOne: false
            referencedRelation: "marquee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marquee_tela_tela_id_fkey"
            columns: ["tela_id"]
            isOneToOne: false
            referencedRelation: "tela"
            referencedColumns: ["id"]
          },
        ]
      }
      tela: {
        Row: {
          created_at: string
          id: string
          nome: string
          rota: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          rota: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          rota?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_active_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
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
