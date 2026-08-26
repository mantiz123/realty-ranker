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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          creado_en: string
          estado: string
          id: string
          monto: number
          realtor_id: string
        }
        Insert: {
          creado_en?: string
          estado: string
          id?: string
          monto?: number
          realtor_id: string
        }
        Update: {
          creado_en?: string
          estado?: string
          id?: string
          monto?: number
          realtor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_realtor_id_fkey"
            columns: ["realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["id"]
          },
        ]
      }
      billboard_slots: {
        Row: {
          clics: number
          creado_en: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          realtor_id: string
          video_id: string | null
        }
        Insert: {
          clics?: number
          creado_en?: string
          estado: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          realtor_id: string
          video_id?: string | null
        }
        Update: {
          clics?: number
          creado_en?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          realtor_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billboard_slots_realtor_id_fkey"
            columns: ["realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billboard_slots_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          creado_en: string
          estado: string
          id: string
          realtor_id: string | null
          tipo: Database["public"]["Enums"]["view_type"]
        }
        Insert: {
          creado_en?: string
          estado: string
          id?: string
          realtor_id?: string | null
          tipo: Database["public"]["Enums"]["view_type"]
        }
        Update: {
          creado_en?: string
          estado?: string
          id?: string
          realtor_id?: string | null
          tipo?: Database["public"]["Enums"]["view_type"]
        }
        Relationships: [
          {
            foreignKeyName: "page_views_realtor_id_fkey"
            columns: ["realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["id"]
          },
        ]
      }
      realtors: {
        Row: {
          creado_en: string
          email: string
          estado: string
          foto_url: string | null
          id: string
          inmobiliaria: string | null
          licencia_numero: string | null
          nombre: string
          telefono: string | null
          verificado: boolean
        }
        Insert: {
          creado_en?: string
          email: string
          estado: string
          foto_url?: string | null
          id?: string
          inmobiliaria?: string | null
          licencia_numero?: string | null
          nombre: string
          telefono?: string | null
          verificado?: boolean
        }
        Update: {
          creado_en?: string
          email?: string
          estado?: string
          foto_url?: string | null
          id?: string
          inmobiliaria?: string | null
          licencia_numero?: string | null
          nombre?: string
          telefono?: string | null
          verificado?: boolean
        }
        Relationships: []
      }
      videos: {
        Row: {
          creado_en: string
          estado_generacion: Database["public"]["Enums"]["generation_status"]
          fotos_urls: string[]
          id: string
          realtor_id: string | null
          tier: Database["public"]["Enums"]["video_tier"]
          video_url: string | null
        }
        Insert: {
          creado_en?: string
          estado_generacion?: Database["public"]["Enums"]["generation_status"]
          fotos_urls?: string[]
          id?: string
          realtor_id?: string | null
          tier?: Database["public"]["Enums"]["video_tier"]
          video_url?: string | null
        }
        Update: {
          creado_en?: string
          estado_generacion?: Database["public"]["Enums"]["generation_status"]
          fotos_urls?: string[]
          id?: string
          realtor_id?: string | null
          tier?: Database["public"]["Enums"]["video_tier"]
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_realtor_id_fkey"
            columns: ["realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      generation_status: "procesando" | "listo" | "error"
      video_tier: "basico" | "pro"
      view_type: "ranking_click" | "billboard_view"
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
      generation_status: ["procesando", "listo", "error"],
      video_tier: ["basico", "pro"],
      view_type: ["ranking_click", "billboard_view"],
    },
  },
} as const
