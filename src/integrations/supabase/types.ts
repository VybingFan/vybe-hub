export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          cover_url: string | null
          created_at: string
          creator_id: string
          description: string
          genre: string
          id: string
          release_date: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          creator_id: string
          description?: string
          genre?: string
          id?: string
          release_date?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string
          genre?: string
          id?: string
          release_date?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_profiles: {
        Row: {
          apple_music: string | null
          artist_name: string
          avatar_url: string | null
          avatar_path: string | null
          bio: string
          cover_url: string | null
          cover_path: string | null
          created_at: string
          display_name: string
          facebook: string | null
          genre: string
          genres: string[]
          instagram: string | null
          location: string
          merch_url: string | null
          personal_links: Json
          spotify: string | null
          tiktok: string | null
          updated_at: string
          user_id: string
          username: string | null
          website: string | null
          x: string | null
          youtube: string | null
        }
        Insert: {
          apple_music?: string | null
          artist_name?: string
          avatar_url?: string | null
          avatar_path?: string | null
          bio?: string
          cover_url?: string | null
          cover_path?: string | null
          created_at?: string
          display_name?: string
          facebook?: string | null
          genre?: string
          genres?: string[]
          instagram?: string | null
          location?: string
          merch_url?: string | null
          personal_links?: Json
          spotify?: string | null
          tiktok?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          website?: string | null
          x?: string | null
          youtube?: string | null
        }
        Update: {
          apple_music?: string | null
          artist_name?: string
          avatar_url?: string | null
          avatar_path?: string | null
          bio?: string
          cover_url?: string | null
          cover_path?: string | null
          created_at?: string
          display_name?: string
          facebook?: string | null
          genre?: string
          genres?: string[]
          instagram?: string | null
          location?: string
          merch_url?: string | null
          personal_links?: Json
          spotify?: string | null
          tiktok?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website?: string | null
          x?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          creator_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          follower_id?: string
        }
        Relationships: []
      }
      merch_products: {
        Row: { id: string; creator_id: string; title: string; description: string; category: string; image_url: string | null; price_cents: number | null; currency: string; purchase_url: string | null; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; creator_id: string; title: string; description?: string; category?: string; image_url?: string | null; price_cents?: number | null; currency?: string; purchase_url?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; creator_id?: string; title?: string; description?: string; category?: string; image_url?: string | null; price_cents?: number | null; currency?: string; purchase_url?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      playlists: {
        Row: {
          created_at: string
          creator_id: string
          description: string
          id: string
          is_published: boolean
          occasion: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string
          id?: string
          is_published?: boolean
          occasion?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string
          id?: string
          is_published?: boolean
          occasion?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      playlist_tracks: {
        Row: {
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          playlist_id: string
          position: number
          track_id: string
        }
        Update: {
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      supporter_profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          favorite_artists: string[]
          favorite_genres: string[]
          instagram: string | null
          location: string
          personal_links: Json
          tiktok: string | null
          updated_at: string
          user_id: string
          username: string
          website: string | null
          x: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          favorite_artists?: string[]
          favorite_genres?: string[]
          instagram?: string | null
          location?: string
          personal_links?: Json
          tiktok?: string | null
          updated_at?: string
          user_id: string
          username: string
          website?: string | null
          x?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          favorite_artists?: string[]
          favorite_genres?: string[]
          instagram?: string | null
          location?: string
          personal_links?: Json
          tiktok?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          website?: string | null
          x?: string | null
        }
        Relationships: []
      }
      track_likes: {
        Row: {
          created_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          album_id: string | null
          audio_url: string
          cover_url: string | null
          created_at: string
          creator_id: string
          description: string
          duration_sec: number
          genre: string
          id: string
          is_featured: boolean
          release_date: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          track_number: number | null
          updated_at: string
        }
        Insert: {
          album_id?: string | null
          audio_url: string
          cover_url?: string | null
          created_at?: string
          creator_id: string
          description?: string
          duration_sec?: number
          genre?: string
          id?: string
          is_featured?: boolean
          release_date?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          track_number?: number | null
          updated_at?: string
        }
        Update: {
          album_id?: string | null
          audio_url?: string
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string
          duration_sec?: number
          genre?: string
          id?: string
          is_featured?: boolean
          release_date?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          track_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "creator" | "supporter" | "admin"
      content_status: "draft" | "published"
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
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
      app_role: ["creator", "supporter", "admin"],
      content_status: ["draft", "published"],
    },
  },
} as const
