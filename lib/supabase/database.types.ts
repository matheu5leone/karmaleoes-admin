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
          senha_temporaria: boolean
          status: string
          telefone: string | null
          two_factor_configured: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          senha_temporaria?: boolean
          status?: string
          telefone?: string | null
          two_factor_configured?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          senha_temporaria?: boolean
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
          antes: Json | null
          created_at: string
          depois: Json | null
          diff: Json | null
          entidade: string
          id: string
          registro_id: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          diff?: Json | null
          entidade: string
          id?: string
          registro_id?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          diff?: Json | null
          entidade?: string
          id?: string
          registro_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banner: {
        Row: {
          created_at: string
          id: string
          imagem: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          imagem: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          imagem?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      banner_tela: {
        Row: {
          banner_id: string
          created_at: string
          id: string
          status: string
          tela_id: string
          updated_at: string
        }
        Insert: {
          banner_id: string
          created_at?: string
          id?: string
          status?: string
          tela_id: string
          updated_at?: string
        }
        Update: {
          banner_id?: string
          created_at?: string
          id?: string
          status?: string
          tela_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banner_tela_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banner_tela_tela_id_fkey"
            columns: ["tela_id"]
            isOneToOne: false
            referencedRelation: "tela"
            referencedColumns: ["id"]
          },
        ]
      }
      categoria_conteudo: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      category: {
        Row: {
          created_at: string
          id: string
          lifecycle: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifecycle?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lifecycle?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      colaborador: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      colecao: {
        Row: {
          cover_image: string | null
          created_at: string
          data_lancamento: string | null
          descricao: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          data_lancamento?: string | null
          descricao?: string | null
          id?: string
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          data_lancamento?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      conteudo: {
        Row: {
          categoria_id: string | null
          created_at: string
          data: string | null
          descricao: string | null
          destaque: boolean
          id: string
          link: string
          ordem: number
          plataforma: string | null
          status: string
          thumbnail: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          data?: string | null
          descricao?: string | null
          destaque?: boolean
          id?: string
          link: string
          ordem?: number
          plataforma?: string | null
          status?: string
          thumbnail?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          data?: string | null
          descricao?: string | null
          destaque?: boolean
          id?: string
          link?: string
          ordem?: number
          plataforma?: string | null
          status?: string
          thumbnail?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categoria_conteudo"
            referencedColumns: ["id"]
          },
        ]
      }
      evento: {
        Row: {
          category_id: string | null
          created_at: string
          data: string
          descricao: string | null
          enable: boolean
          horario: string | null
          id: string
          lifecycle: string
          link_externo: string | null
          local: string | null
          nome: string
          nova_data: string | null
          obs_encerramento: string | null
          organizador: string | null
          prioridade: number
          status_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          data: string
          descricao?: string | null
          enable?: boolean
          horario?: string | null
          id?: string
          lifecycle?: string
          link_externo?: string | null
          local?: string | null
          nome: string
          nova_data?: string | null
          obs_encerramento?: string | null
          organizador?: string | null
          prioridade?: number
          status_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          enable?: boolean
          horario?: string | null
          id?: string
          lifecycle?: string
          link_externo?: string | null
          local?: string | null
          nome?: string
          nova_data?: string | null
          obs_encerramento?: string | null
          organizador?: string | null
          prioridade?: number
          status_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_evento"
            referencedColumns: ["id"]
          },
        ]
      }
      icons: {
        Row: {
          created_at: string
          extension: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          extension: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          extension?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      link_plataforma: {
        Row: {
          colecao_id: string | null
          created_at: string
          id: string
          musica_id: string | null
          plataforma: string
          updated_at: string
          url: string
        }
        Insert: {
          colecao_id?: string | null
          created_at?: string
          id?: string
          musica_id?: string | null
          plataforma: string
          updated_at?: string
          url: string
        }
        Update: {
          colecao_id?: string | null
          created_at?: string
          id?: string
          musica_id?: string | null
          plataforma?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_plataforma_colecao_id_fkey"
            columns: ["colecao_id"]
            isOneToOne: false
            referencedRelation: "colecao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_plataforma_musica_id_fkey"
            columns: ["musica_id"]
            isOneToOne: false
            referencedRelation: "musica"
            referencedColumns: ["id"]
          },
        ]
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
          icon_id: string | null
          id: string
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
          icon_id?: string | null
          id?: string
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
          icon_id?: string | null
          id?: string
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
            foreignKeyName: "marquee_item_icon_id_fkey"
            columns: ["icon_id"]
            isOneToOne: false
            referencedRelation: "icons"
            referencedColumns: ["id"]
          },
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
      musica: {
        Row: {
          colecao_id: string | null
          cover_image: string | null
          created_at: string
          data_lancamento: string | null
          duracao: number | null
          id: string
          isrc: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          colecao_id?: string | null
          cover_image?: string | null
          created_at?: string
          data_lancamento?: string | null
          duracao?: number | null
          id?: string
          isrc?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          colecao_id?: string | null
          cover_image?: string | null
          created_at?: string
          data_lancamento?: string | null
          duracao?: number | null
          id?: string
          isrc?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "musica_colecao_id_fkey"
            columns: ["colecao_id"]
            isOneToOne: false
            referencedRelation: "colecao"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_colaborador: {
        Row: {
          colaborador_id: string
          colecao_id: string | null
          created_at: string
          id: string
          musica_id: string | null
          role_id: string
          updated_at: string
        }
        Insert: {
          colaborador_id: string
          colecao_id?: string | null
          created_at?: string
          id?: string
          musica_id?: string | null
          role_id: string
          updated_at?: string
        }
        Update: {
          colaborador_id?: string
          colecao_id?: string | null
          created_at?: string
          id?: string
          musica_id?: string | null
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_colaborador_colecao_id_fkey"
            columns: ["colecao_id"]
            isOneToOne: false
            referencedRelation: "colecao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_colaborador_musica_id_fkey"
            columns: ["musica_id"]
            isOneToOne: false
            referencedRelation: "musica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_colaborador_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id"]
          },
        ]
      }
      role: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      status_evento: {
        Row: {
          created_at: string
          id: string
          lifecycle_id: string
          nome: string
          protegido: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifecycle_id: string
          nome: string
          protegido?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lifecycle_id?: string
          nome?: string
          protegido?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_evento_lifecycle_id_fkey"
            columns: ["lifecycle_id"]
            isOneToOne: false
            referencedRelation: "status_lifecycles"
            referencedColumns: ["id"]
          },
        ]
      }
      status_lifecycles: {
        Row: {
          created_at: string
          id: string
          lifecycle: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifecycle: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          lifecycle?: string
          name?: string
        }
        Relationships: []
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
      eventos_view: {
        Row: {
          category_id: string | null
          category_name: string | null
          created_at: string | null
          data: string | null
          data_referencia: string | null
          descricao: string | null
          enable: boolean | null
          enable_efetivo: boolean | null
          expirado: boolean | null
          horario: string | null
          id: string | null
          lifecycle: string | null
          link_externo: string | null
          local: string | null
          nome: string | null
          nova_data: string | null
          obs_encerramento: string | null
          organizador: string | null
          prioridade: number | null
          status_efetivo: string | null
          status_id: string | null
          status_lifecycle: string | null
          status_nome: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_evento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_active_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      publicar_banner_tela: { Args: { assoc_id: string }; Returns: undefined }
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
