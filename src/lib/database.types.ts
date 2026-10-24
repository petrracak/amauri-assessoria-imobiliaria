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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      features: {
        Row: {
          grupo: string
          icone: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          grupo?: string
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          grupo?: string
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          anotacoes: string | null
          consentimento: boolean
          created_at: string
          email: string | null
          id: string
          mensagem: string | null
          nome: string
          origem: string | null
          property_id: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          utm: Json | null
          whatsapp: string
        }
        Insert: {
          anotacoes?: string | null
          consentimento?: boolean
          created_at?: string
          email?: string | null
          id?: string
          mensagem?: string | null
          nome: string
          origem?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          utm?: Json | null
          whatsapp: string
        }
        Update: {
          anotacoes?: string | null
          consentimento?: boolean
          created_at?: string
          email?: string | null
          id?: string
          mensagem?: string | null
          nome?: string
          origem?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          utm?: Json | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          autor_id: string | null
          capa_path: string | null
          capa_url: string | null
          categoria: string | null
          conteudo: string | null
          created_at: string
          id: string
          meta_description: string | null
          meta_title: string | null
          publicado_em: string | null
          resumo: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          titulo: string
          updated_at: string
          visualizacoes: number
        }
        Insert: {
          autor_id?: string | null
          capa_path?: string | null
          capa_url?: string | null
          categoria?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          publicado_em?: string | null
          resumo?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          titulo: string
          updated_at?: string
          visualizacoes?: number
        }
        Update: {
          autor_id?: string | null
          capa_path?: string | null
          capa_url?: string | null
          categoria?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          publicado_em?: string | null
          resumo?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          titulo?: string
          updated_at?: string
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          created_at: string
          creci: string | null
          email: string | null
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
          updated_at: string
          usuario: string | null
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          creci?: string | null
          email?: string | null
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
          usuario?: string | null
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
          usuario?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          alto_padrao: boolean
          area_privativa: number | null
          area_total: number | null
          badge: string | null
          bairro: string | null
          banheiros: number | null
          busca: unknown
          cidade: string
          cliques_whatsapp: number
          condominio: number | null
          created_at: string
          created_by: string | null
          descricao: string | null
          destaque: boolean
          dormitorios: number | null
          endereco: string | null
          id: string
          iptu: number | null
          latitude: number | null
          listing: Database["public"]["Enums"]["listing_kind"]
          longitude: number | null
          meta_description: string | null
          meta_title: string | null
          mobiliado: string | null
          mostrar_endereco: boolean
          ordem: number
          preco: number | null
          preco_anterior: number | null
          preco_sob_consulta: boolean
          ref: string
          slug: string
          stage: Database["public"]["Enums"]["construction_stage"] | null
          status: Database["public"]["Enums"]["property_status"]
          subtitulo: string | null
          suites: number | null
          tipo: string
          titulo: string
          uf: string
          updated_at: string
          vagas: number | null
          visualizacoes: number
        }
        Insert: {
          alto_padrao?: boolean
          area_privativa?: number | null
          area_total?: number | null
          badge?: string | null
          bairro?: string | null
          banheiros?: number | null
          busca?: unknown
          cidade?: string
          cliques_whatsapp?: number
          condominio?: number | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          destaque?: boolean
          dormitorios?: number | null
          endereco?: string | null
          id?: string
          iptu?: number | null
          latitude?: number | null
          listing?: Database["public"]["Enums"]["listing_kind"]
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          mobiliado?: string | null
          mostrar_endereco?: boolean
          ordem?: number
          preco?: number | null
          preco_anterior?: number | null
          preco_sob_consulta?: boolean
          ref: string
          slug: string
          stage?: Database["public"]["Enums"]["construction_stage"] | null
          status?: Database["public"]["Enums"]["property_status"]
          subtitulo?: string | null
          suites?: number | null
          tipo: string
          titulo: string
          uf?: string
          updated_at?: string
          vagas?: number | null
          visualizacoes?: number
        }
        Update: {
          alto_padrao?: boolean
          area_privativa?: number | null
          area_total?: number | null
          badge?: string | null
          bairro?: string | null
          banheiros?: number | null
          busca?: unknown
          cidade?: string
          cliques_whatsapp?: number
          condominio?: number | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          destaque?: boolean
          dormitorios?: number | null
          endereco?: string | null
          id?: string
          iptu?: number | null
          latitude?: number | null
          listing?: Database["public"]["Enums"]["listing_kind"]
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          mobiliado?: string | null
          mostrar_endereco?: boolean
          ordem?: number
          preco?: number | null
          preco_anterior?: number | null
          preco_sob_consulta?: boolean
          ref?: string
          slug?: string
          stage?: Database["public"]["Enums"]["construction_stage"] | null
          status?: Database["public"]["Enums"]["property_status"]
          subtitulo?: string | null
          suites?: number | null
          tipo?: string
          titulo?: string
          uf?: string
          updated_at?: string
          vagas?: number | null
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_features: {
        Row: {
          feature_id: string
          property_id: string
        }
        Insert: {
          feature_id: string
          property_id: string
        }
        Update: {
          feature_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_features_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          alt: string | null
          altura: number | null
          blur_hash: string | null
          capa: boolean
          created_at: string
          id: string
          largura: number | null
          ordem: number
          path: string | null
          property_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          altura?: number | null
          blur_hash?: string | null
          capa?: boolean
          created_at?: string
          id?: string
          largura?: number | null
          ordem?: number
          path?: string | null
          property_id: string
          url: string
        }
        Update: {
          alt?: string | null
          altura?: number | null
          blur_hash?: string | null
          capa?: boolean
          created_at?: string
          id?: string
          largura?: number | null
          ordem?: number
          path?: string | null
          property_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          chave: string
          descricao: string | null
          publico: boolean
          updated_at: string
          updated_by: string | null
          valor: Json
        }
        Insert: {
          chave: string
          descricao?: string | null
          publico?: boolean
          updated_at?: string
          updated_by?: string | null
          valor?: Json
        }
        Update: {
          chave?: string
          descricao?: string | null
          publico?: boolean
          updated_at?: string
          updated_by?: string | null
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      f_unaccent: { Args: { "": string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      construction_stage: "lancamento" | "em_construcao" | "pronto"
      lead_status: "novo" | "em_contato" | "convertido" | "descartado"
      listing_kind: "venda" | "aluguel"
      post_status: "rascunho" | "publicado"
      property_status: "rascunho" | "publicado" | "arquivado"
      user_role: "admin" | "corretor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      construction_stage: ["lancamento", "em_construcao", "pronto"],
      lead_status: ["novo", "em_contato", "convertido", "descartado"],
      listing_kind: ["venda", "aluguel"],
      post_status: ["rascunho", "publicado"],
      property_status: ["rascunho", "publicado", "arquivado"],
      user_role: ["admin", "corretor"],
    },
  },
} as const
