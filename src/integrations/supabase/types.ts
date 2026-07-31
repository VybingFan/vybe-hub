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
      account_entitlements: {
        Row: {
          adjustment_ends_at: string | null
          billing_customer_ref: string | null
          billing_interval: string | null
          billing_provider: string | null
          billing_subscription_ref: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          expires_at: string | null
          granted_by: string | null
          last_billing_event_created: number
          plan_code: string
          recognition_code: string | null
          scheduled_plan_code: string | null
          source_invite_id: string | null
          starts_at: string
          status: string
          stripe_subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adjustment_ends_at?: string | null
          billing_customer_ref?: string | null
          billing_interval?: string | null
          billing_provider?: string | null
          billing_subscription_ref?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          expires_at?: string | null
          granted_by?: string | null
          last_billing_event_created?: number
          plan_code: string
          recognition_code?: string | null
          scheduled_plan_code?: string | null
          source_invite_id?: string | null
          starts_at?: string
          status?: string
          stripe_subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adjustment_ends_at?: string | null
          billing_customer_ref?: string | null
          billing_interval?: string | null
          billing_provider?: string | null
          billing_subscription_ref?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          expires_at?: string | null
          granted_by?: string | null
          last_billing_event_created?: number
          plan_code?: string
          recognition_code?: string | null
          scheduled_plan_code?: string | null
          source_invite_id?: string | null
          starts_at?: string
          status?: string
          stripe_subscription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_entitlements_source_invite_id_fkey"
            columns: ["source_invite_id"]
            isOneToOne: false
            referencedRelation: "creator_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          action_path: string
          assigned_to: string | null
          category: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          priority: string
          read_at: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
        }
        Insert: {
          action_path: string
          assigned_to?: string | null
          category: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          priority?: string
          read_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
        }
        Update: {
          action_path?: string
          assigned_to?: string | null
          category?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          priority?: string
          read_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
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
      audio_fingerprints: {
        Row: {
          bitrate: number | null
          chromaprint: string | null
          chromaprint_algorithm: number | null
          created_at: string
          creator_id: string
          duration_sec: number | null
          embedded_album: string | null
          embedded_artist: string | null
          embedded_title: string | null
          file_type: string | null
          id: string
          isrc: string | null
          metadata: Json
          processor_version: string
          sample_rate: number | null
          sha256: string
          track_id: string
          upc: string | null
          updated_at: string
        }
        Insert: {
          bitrate?: number | null
          chromaprint?: string | null
          chromaprint_algorithm?: number | null
          created_at?: string
          creator_id: string
          duration_sec?: number | null
          embedded_album?: string | null
          embedded_artist?: string | null
          embedded_title?: string | null
          file_type?: string | null
          id?: string
          isrc?: string | null
          metadata?: Json
          processor_version: string
          sample_rate?: number | null
          sha256: string
          track_id: string
          upc?: string | null
          updated_at?: string
        }
        Update: {
          bitrate?: number | null
          chromaprint?: string | null
          chromaprint_algorithm?: number | null
          created_at?: string
          creator_id?: string
          duration_sec?: number | null
          embedded_album?: string | null
          embedded_artist?: string | null
          embedded_title?: string | null
          file_type?: string | null
          id?: string
          isrc?: string | null
          metadata?: Json
          processor_version?: string
          sample_rate?: number | null
          sha256?: string
          track_id?: string
          upc?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_fingerprints_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_match_candidates: {
        Row: {
          candidate_track_id: string
          combined_risk_score: number
          created_at: string
          exact_hash_match: boolean
          fingerprint_score: number | null
          id: string
          metadata_score: number | null
          reason_codes: string[]
          reviewed_at: string | null
          reviewed_by: string | null
          source_track_id: string
          status: string
        }
        Insert: {
          candidate_track_id: string
          combined_risk_score?: number
          created_at?: string
          exact_hash_match?: boolean
          fingerprint_score?: number | null
          id?: string
          metadata_score?: number | null
          reason_codes?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_track_id: string
          status?: string
        }
        Update: {
          candidate_track_id?: string
          combined_risk_score?: number
          created_at?: string
          exact_hash_match?: boolean
          fingerprint_score?: number | null
          id?: string
          metadata_score?: number | null
          reason_codes?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_track_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_match_candidates_candidate_track_id_fkey"
            columns: ["candidate_track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_match_candidates_source_track_id_fkey"
            columns: ["source_track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_processing_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          creator_id: string
          id: string
          last_error: string | null
          processor_version: string | null
          queued_at: string
          started_at: string | null
          status: string
          track_id: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          creator_id: string
          id?: string
          last_error?: string | null
          processor_version?: string | null
          queued_at?: string
          started_at?: string | null
          status?: string
          track_id: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          last_error?: string | null
          processor_version?: string | null
          queued_at?: string
          started_at?: string | null
          status?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_processing_jobs_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      business_audit_log: {
        Row: {
          action: string
          actor_user_id: string
          business_id: string | null
          campaign_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_user_id?: string
          business_id?: string | null
          campaign_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: number
        }
        Update: {
          action?: string
          actor_user_id?: string
          business_id?: string | null
          campaign_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_audit_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_audit_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "business_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      business_campaign_creatives: {
        Row: {
          alt_text: string | null
          approved_at: string | null
          approved_by: string | null
          body: string
          call_to_action: string | null
          campaign_id: string
          created_at: string
          destination_url: string | null
          format: string
          headline: string
          id: string
          image_path: string | null
          status: string
          updated_at: string
          video_path: string | null
        }
        Insert: {
          alt_text?: string | null
          approved_at?: string | null
          approved_by?: string | null
          body: string
          call_to_action?: string | null
          campaign_id: string
          created_at?: string
          destination_url?: string | null
          format: string
          headline: string
          id?: string
          image_path?: string | null
          status?: string
          updated_at?: string
          video_path?: string | null
        }
        Update: {
          alt_text?: string | null
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          call_to_action?: string | null
          campaign_id?: string
          created_at?: string
          destination_url?: string | null
          format?: string
          headline?: string
          id?: string
          image_path?: string | null
          status?: string
          updated_at?: string
          video_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_campaign_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "business_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      business_campaign_events: {
        Row: {
          attribution_code: string | null
          business_id: string
          campaign_id: string
          creative_id: string | null
          device_category: string | null
          event_type: string
          id: number
          invalid_reason: string | null
          is_internal: boolean
          is_valid: boolean
          occurred_at: string
          placement_id: string | null
          referrer_path: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          attribution_code?: string | null
          business_id: string
          campaign_id: string
          creative_id?: string | null
          device_category?: string | null
          event_type: string
          id?: number
          invalid_reason?: string | null
          is_internal?: boolean
          is_valid?: boolean
          occurred_at?: string
          placement_id?: string | null
          referrer_path?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          attribution_code?: string | null
          business_id?: string
          campaign_id?: string
          creative_id?: string | null
          device_category?: string | null
          event_type?: string
          id?: number
          invalid_reason?: string | null
          is_internal?: boolean
          is_valid?: boolean
          occurred_at?: string
          placement_id?: string | null
          referrer_path?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_campaign_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "business_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_events_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "business_campaign_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_events_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "business_campaign_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      business_campaign_placements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campaign_id: string
          created_at: string
          creative_id: string
          ends_at: string
          frequency_cap_per_day: number | null
          id: string
          slot_key: string
          starts_at: string
          status: string
          surface: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id: string
          created_at?: string
          creative_id: string
          ends_at: string
          frequency_cap_per_day?: number | null
          id?: string
          slot_key: string
          starts_at: string
          status?: string
          surface: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string
          created_at?: string
          creative_id?: string
          ends_at?: string
          frequency_cap_per_day?: number | null
          id?: string
          slot_key?: string
          starts_at?: string
          status?: string
          surface?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_campaign_placements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "business_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_placements_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "business_campaign_creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      business_campaign_reports: {
        Row: {
          business_id: string
          campaign_id: string
          created_at: string
          id: string
          methodology: Json
          metrics: Json
          prepared_by: string
          range_end: string
          range_start: string
          released_at: string | null
          released_by: string | null
          status: string
        }
        Insert: {
          business_id: string
          campaign_id: string
          created_at?: string
          id?: string
          methodology?: Json
          metrics: Json
          prepared_by?: string
          range_end: string
          range_start: string
          released_at?: string | null
          released_by?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          campaign_id?: string
          created_at?: string
          id?: string
          methodology?: Json
          metrics?: Json
          prepared_by?: string
          range_end?: string
          range_start?: string
          released_at?: string | null
          released_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_campaign_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "business_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      business_campaigns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_id: string
          conversion_tracking_status: string
          created_at: string
          created_by: string
          disclosure_text: string
          ends_at: string | null
          id: string
          internal_notes: string | null
          name: string
          objective: string
          offer_id: string | null
          package_code: string | null
          starts_at: string | null
          status: string
          target_audience: string | null
          target_genres: string[]
          target_regions: string[]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          conversion_tracking_status?: string
          created_at?: string
          created_by?: string
          disclosure_text?: string
          ends_at?: string | null
          id?: string
          internal_notes?: string | null
          name: string
          objective: string
          offer_id?: string | null
          package_code?: string | null
          starts_at?: string | null
          status?: string
          target_audience?: string | null
          target_genres?: string[]
          target_regions?: string[]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          conversion_tracking_status?: string
          created_at?: string
          created_by?: string
          disclosure_text?: string
          ends_at?: string | null
          id?: string
          internal_notes?: string | null
          name?: string
          objective?: string
          offer_id?: string | null
          package_code?: string | null
          starts_at?: string | null
          status?: string
          target_audience?: string | null
          target_genres?: string[]
          target_regions?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaigns_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "business_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaigns_package_code_fkey"
            columns: ["package_code"]
            isOneToOne: false
            referencedRelation: "business_packages"
            referencedColumns: ["code"]
          },
        ]
      }
      business_offer_redemptions: {
        Row: {
          business_id: string
          created_at: string
          id: string
          offer_id: string
          redemption_code: string | null
          session_id: string | null
          status: string
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          offer_id: string
          redemption_code?: string | null
          session_id?: string | null
          status?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          offer_id?: string
          redemption_code?: string | null
          session_id?: string | null
          status?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_offer_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_offer_redemptions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "business_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_offers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_id: string
          created_at: string
          description: string
          destination_url: string | null
          ends_at: string | null
          id: string
          max_redemptions: number | null
          offer_code: string | null
          redemption_instructions: string | null
          starts_at: string | null
          status: string
          terms: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          created_at?: string
          description: string
          destination_url?: string | null
          ends_at?: string | null
          id?: string
          max_redemptions?: number | null
          offer_code?: string | null
          redemption_instructions?: string | null
          starts_at?: string | null
          status?: string
          terms?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          created_at?: string
          description?: string
          destination_url?: string | null
          ends_at?: string | null
          id?: string
          max_redemptions?: number | null
          offer_code?: string | null
          redemption_instructions?: string | null
          starts_at?: string | null
          status?: string
          terms?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_offers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_packages: {
        Row: {
          active_campaign_limit: number
          billing_interval: string
          code: string
          created_at: string
          duration_days: number | null
          is_public: boolean
          name: string
          price_cents: number
          sponsored_experience_limit: number
          spotlight_limit: number
          updated_at: string
        }
        Insert: {
          active_campaign_limit?: number
          billing_interval: string
          code: string
          created_at?: string
          duration_days?: number | null
          is_public?: boolean
          name: string
          price_cents?: number
          sponsored_experience_limit?: number
          spotlight_limit?: number
          updated_at?: string
        }
        Update: {
          active_campaign_limit?: number
          billing_interval?: string
          code?: string
          created_at?: string
          duration_days?: number | null
          is_public?: boolean
          name?: string
          price_cents?: number
          sponsored_experience_limit?: number
          spotlight_limit?: number
          updated_at?: string
        }
        Relationships: []
      }
      business_partner_documents: {
        Row: {
          business_id: string
          campaign_id: string | null
          created_at: string
          document_type: string
          effective_at: string | null
          expires_at: string | null
          external_url: string | null
          id: string
          status: string
          storage_path: string | null
          title: string
          updated_at: string
          uploaded_by: string
          version_label: string | null
          visibility: string
        }
        Insert: {
          business_id: string
          campaign_id?: string | null
          created_at?: string
          document_type: string
          effective_at?: string | null
          expires_at?: string | null
          external_url?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string
          version_label?: string | null
          visibility?: string
        }
        Update: {
          business_id?: string
          campaign_id?: string | null
          created_at?: string
          document_type?: string
          effective_at?: string | null
          expires_at?: string | null
          external_url?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          version_label?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_partner_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_partner_documents_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "business_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      business_pilot_activities: {
        Row: {
          activity_type: string
          business_id: string
          created_at: string
          created_by: string
          follow_up_at: string | null
          id: string
          next_action: string | null
          occurred_at: string
          pilot_id: string
          summary: string
        }
        Insert: {
          activity_type: string
          business_id: string
          created_at?: string
          created_by?: string
          follow_up_at?: string | null
          id?: string
          next_action?: string | null
          occurred_at?: string
          pilot_id: string
          summary: string
        }
        Update: {
          activity_type?: string
          business_id?: string
          created_at?: string
          created_by?: string
          follow_up_at?: string | null
          id?: string
          next_action?: string | null
          occurred_at?: string
          pilot_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_pilot_activities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_pilot_activities_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "business_pilot_records"
            referencedColumns: ["id"]
          },
        ]
      }
      business_pilot_records: {
        Row: {
          assigned_to: string | null
          blockers: string | null
          business_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          decisions: string | null
          follow_up_at: string | null
          id: string
          next_action: string | null
          onboarding_status: string
          outcomes: string | null
          paused_declined_reason: string | null
          pilot_notes: string | null
          qualification_status: string
          stage: string
          started_at: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          blockers?: string | null
          business_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          decisions?: string | null
          follow_up_at?: string | null
          id?: string
          next_action?: string | null
          onboarding_status?: string
          outcomes?: string | null
          paused_declined_reason?: string | null
          pilot_notes?: string | null
          qualification_status?: string
          stage?: string
          started_at?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          blockers?: string | null
          business_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          decisions?: string | null
          follow_up_at?: string | null
          id?: string
          next_action?: string | null
          onboarding_status?: string
          outcomes?: string | null
          paused_declined_reason?: string | null
          pilot_notes?: string | null
          qualification_status?: string
          stage?: string
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_pilot_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          category: string
          contact_email: string
          contact_name: string | null
          contact_phone: string | null
          cover_path: string | null
          created_at: string
          created_by: string
          description: string | null
          founding_partner: boolean
          id: string
          internal_notes: string | null
          legal_name: string | null
          logo_path: string | null
          owner_user_id: string | null
          package_code: string | null
          package_ends_at: string | null
          package_started_at: string | null
          partner_status: string
          public_name: string
          service_area: string | null
          slug: string
          target_audience: string | null
          updated_at: string
          verification_status: string
          website_url: string | null
        }
        Insert: {
          category: string
          contact_email: string
          contact_name?: string | null
          contact_phone?: string | null
          cover_path?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          founding_partner?: boolean
          id?: string
          internal_notes?: string | null
          legal_name?: string | null
          logo_path?: string | null
          owner_user_id?: string | null
          package_code?: string | null
          package_ends_at?: string | null
          package_started_at?: string | null
          partner_status?: string
          public_name: string
          service_area?: string | null
          slug: string
          target_audience?: string | null
          updated_at?: string
          verification_status?: string
          website_url?: string | null
        }
        Update: {
          category?: string
          contact_email?: string
          contact_name?: string | null
          contact_phone?: string | null
          cover_path?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          founding_partner?: boolean
          id?: string
          internal_notes?: string | null
          legal_name?: string | null
          logo_path?: string | null
          owner_user_id?: string | null
          package_code?: string | null
          package_ends_at?: string | null
          package_started_at?: string | null
          partner_status?: string
          public_name?: string
          service_area?: string | null
          slug?: string
          target_audience?: string | null
          updated_at?: string
          verification_status?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_package_code_fkey"
            columns: ["package_code"]
            isOneToOne: false
            referencedRelation: "business_packages"
            referencedColumns: ["code"]
          },
        ]
      }
      copyright_reports: {
        Row: {
          accuracy_statement: boolean
          content_url: string
          created_at: string
          good_faith_statement: boolean
          id: string
          internal_notes: string
          original_work_description: string
          reporter_email: string
          reporter_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          rights_owner_name: string
          signature: string
          status: string
        }
        Insert: {
          accuracy_statement: boolean
          content_url: string
          created_at?: string
          good_faith_statement: boolean
          id?: string
          internal_notes?: string
          original_work_description: string
          reporter_email: string
          reporter_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rights_owner_name: string
          signature: string
          status?: string
        }
        Update: {
          accuracy_statement?: boolean
          content_url?: string
          created_at?: string
          good_faith_statement?: boolean
          id?: string
          internal_notes?: string
          original_work_description?: string
          reporter_email?: string
          reporter_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rights_owner_name?: string
          signature?: string
          status?: string
        }
        Relationships: []
      }
      creator_invites: {
        Row: {
          assigned_plan: string
          created_at: string
          email_normalized: string
          expires_at: string
          id: string
          internal_note: string | null
          issued_by: string
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          assigned_plan?: string
          created_at?: string
          email_normalized: string
          expires_at?: string
          id?: string
          internal_note?: string | null
          issued_by: string
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          assigned_plan?: string
          created_at?: string
          email_normalized?: string
          expires_at?: string
          id?: string
          internal_note?: string | null
          issued_by?: string
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: []
      }
      creator_music_rights_certifications: {
        Row: {
          certification_statement: boolean
          certified_at: string
          certified_track_count: number
          creator_id: string
          default_rights_basis: string
          id: string
          policy_version: string
          renewal_interval: number
          revoked_at: string | null
        }
        Insert: {
          certification_statement: boolean
          certified_at?: string
          certified_track_count: number
          creator_id: string
          default_rights_basis: string
          id?: string
          policy_version: string
          renewal_interval?: number
          revoked_at?: string | null
        }
        Update: {
          certification_statement?: boolean
          certified_at?: string
          certified_track_count?: number
          creator_id?: string
          default_rights_basis?: string
          id?: string
          policy_version?: string
          renewal_interval?: number
          revoked_at?: string | null
        }
        Relationships: []
      }
      creator_plan_definitions: {
        Row: {
          active_connection_limit: number
          adjustment_period_days: number
          ai_action_limit: number
          analytics_history_days: number | null
          annual_price_cents: number
          billing_state: string
          created_at: string
          description: string
          hosted_video_limit: number
          is_public: boolean
          max_audio_bytes: number
          max_track_duration_sec: number
          merch_item_limit: number
          monthly_price_cents: number
          pioneer_annual_price_cents: number | null
          pioneer_monthly_price_cents: number | null
          plan_code: string
          playlist_track_limit: number
          public_name: string
          published_playlist_limit: number
          published_track_limit: number
          sort_order: number
          team_member_limit: number
          updated_at: string
          uploaded_track_limit: number
          video_storage_minutes: number
          written_post_limit: number
        }
        Insert: {
          active_connection_limit: number
          adjustment_period_days?: number
          ai_action_limit?: number
          analytics_history_days?: number | null
          annual_price_cents?: number
          billing_state?: string
          created_at?: string
          description: string
          hosted_video_limit?: number
          is_public?: boolean
          max_audio_bytes: number
          max_track_duration_sec: number
          merch_item_limit: number
          monthly_price_cents?: number
          pioneer_annual_price_cents?: number | null
          pioneer_monthly_price_cents?: number | null
          plan_code: string
          playlist_track_limit: number
          public_name: string
          published_playlist_limit: number
          published_track_limit: number
          sort_order?: number
          team_member_limit?: number
          updated_at?: string
          uploaded_track_limit: number
          video_storage_minutes?: number
          written_post_limit?: number
        }
        Update: {
          active_connection_limit?: number
          adjustment_period_days?: number
          ai_action_limit?: number
          analytics_history_days?: number | null
          annual_price_cents?: number
          billing_state?: string
          created_at?: string
          description?: string
          hosted_video_limit?: number
          is_public?: boolean
          max_audio_bytes?: number
          max_track_duration_sec?: number
          merch_item_limit?: number
          monthly_price_cents?: number
          pioneer_annual_price_cents?: number | null
          pioneer_monthly_price_cents?: number | null
          plan_code?: string
          playlist_track_limit?: number
          public_name?: string
          published_playlist_limit?: number
          published_track_limit?: number
          sort_order?: number
          team_member_limit?: number
          updated_at?: string
          uploaded_track_limit?: number
          video_storage_minutes?: number
          written_post_limit?: number
        }
        Relationships: []
      }
      creator_profiles: {
        Row: {
          apple_music: string | null
          artist_name: string
          avatar_path: string | null
          avatar_url: string | null
          bio: string
          cover_path: string | null
          cover_url: string | null
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
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string
          cover_path?: string | null
          cover_url?: string | null
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
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string
          cover_path?: string | null
          cover_url?: string | null
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
      creator_rights_documents: {
        Row: {
          content_type: string
          creator_id: string
          document_date: string | null
          document_type: string
          expires_at: string | null
          id: string
          original_filename: string
          review_notes: string
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          size_bytes: number
          storage_path: string
          submitted_at: string
          track_id: string | null
        }
        Insert: {
          content_type: string
          creator_id: string
          document_date?: string | null
          document_type: string
          expires_at?: string | null
          id?: string
          original_filename: string
          review_notes?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes: number
          storage_path: string
          submitted_at?: string
          track_id?: string | null
        }
        Update: {
          content_type?: string
          creator_id?: string
          document_date?: string | null
          document_type?: string
          expires_at?: string | null
          id?: string
          original_filename?: string
          review_notes?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number
          storage_path?: string
          submitted_at?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_rights_documents_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_videos: {
        Row: {
          created_at: string
          creator_id: string
          description: string
          duration_sec: number | null
          id: string
          is_featured: boolean
          provider: string
          provider_video_id: string
          rights_confirmed: boolean
          source_url: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_type: string
          visibility: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string
          duration_sec?: number | null
          id?: string
          is_featured?: boolean
          provider: string
          provider_video_id: string
          rights_confirmed?: boolean
          source_url?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_type?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string
          duration_sec?: number | null
          id?: string
          is_featured?: boolean
          provider?: string
          provider_video_id?: string
          rights_confirmed?: boolean
          source_url?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_type?: string
          visibility?: string
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
      listener_connections: {
        Row: {
          category: string
          consent_share: boolean
          consent_updates: boolean
          created_at: string
          creator_id: string
          display_name: string | null
          email: string
          id: string
          is_favorite: boolean
          message: string | null
          playlist_id: string
          private_notes: string | null
          social_handle: string | null
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          category?: string
          consent_share: boolean
          consent_updates?: boolean
          created_at?: string
          creator_id: string
          display_name?: string | null
          email: string
          id?: string
          is_favorite?: boolean
          message?: string | null
          playlist_id: string
          private_notes?: string | null
          social_handle?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          consent_share?: boolean
          consent_updates?: boolean
          created_at?: string
          creator_id?: string
          display_name?: string | null
          email?: string
          id?: string
          is_favorite?: boolean
          message?: string | null
          playlist_id?: string
          private_notes?: string | null
          social_handle?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listener_connections_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      merch_products: {
        Row: {
          availability: string
          category: string
          created_at: string
          creator_id: string
          currency: string
          description: string
          id: string
          image_path: string | null
          image_url: string | null
          is_active: boolean
          price_cents: number | null
          purchase_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          availability?: string
          category?: string
          created_at?: string
          creator_id: string
          currency?: string
          description?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean
          price_cents?: number | null
          purchase_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          availability?: string
          category?: string
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean
          price_cents?: number | null
          purchase_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      moderation_cases: {
        Row: {
          assigned_to: string | null
          case_type: string
          closed_at: string | null
          copyright_report_id: string | null
          created_at: string
          creator_id: string | null
          decision: string | null
          id: string
          internal_notes: string
          match_candidate_id: string | null
          reason_codes: string[]
          risk_score: number | null
          severity: string
          status: string
          summary: string
          track_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          case_type: string
          closed_at?: string | null
          copyright_report_id?: string | null
          created_at?: string
          creator_id?: string | null
          decision?: string | null
          id?: string
          internal_notes?: string
          match_candidate_id?: string | null
          reason_codes?: string[]
          risk_score?: number | null
          severity?: string
          status?: string
          summary?: string
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          case_type?: string
          closed_at?: string | null
          copyright_report_id?: string | null
          created_at?: string
          creator_id?: string | null
          decision?: string | null
          id?: string
          internal_notes?: string
          match_candidate_id?: string | null
          reason_codes?: string[]
          risk_score?: number | null
          severity?: string
          status?: string
          summary?: string
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_cases_copyright_report_id_fkey"
            columns: ["copyright_report_id"]
            isOneToOne: false
            referencedRelation: "copyright_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_match_candidate_id_fkey"
            columns: ["match_candidate_id"]
            isOneToOne: false
            referencedRelation: "audio_match_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_events: {
        Row: {
          actor_user_id: string | null
          case_id: string
          created_at: string
          event_type: string
          from_status: string | null
          id: string
          metadata: Json
          note: string
          to_status: string | null
        }
        Insert: {
          actor_user_id?: string | null
          case_id: string
          created_at?: string
          event_type: string
          from_status?: string | null
          id?: string
          metadata?: Json
          note?: string
          to_status?: string | null
        }
        Update: {
          actor_user_id?: string | null
          case_id?: string
          created_at?: string
          event_type?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          note?: string
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      play_activity_progress: {
        Row: {
          activity_key: string
          client_updated_at: string
          created_at: string
          id: string
          pack_version: string
          progress: Json
          synced_at: string
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          activity_key: string
          client_updated_at: string
          created_at?: string
          id?: string
          pack_version: string
          progress?: Json
          synced_at?: string
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          activity_key?: string
          client_updated_at?: string
          created_at?: string
          id?: string
          pack_version?: string
          progress?: Json
          synced_at?: string
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
      playlist_activity: {
        Row: {
          created_at: string
          creator_id: string
          event_type: string
          id: string
          playlist_id: string
          session_id: string
          track_id: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          event_type: string
          id?: string
          playlist_id: string
          session_id: string
          track_id?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          event_type?: string
          id?: string
          playlist_id?: string
          session_id?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlist_activity_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_activity_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
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
      playlists: {
        Row: {
          cover_path: string | null
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
          cover_path?: string | null
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
          cover_path?: string | null
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
      stripe_webhook_events: {
        Row: {
          event_created: number
          event_id: string
          event_type: string
          outcome: string
          processed_at: string
        }
        Insert: {
          event_created: number
          event_id: string
          event_type: string
          outcome: string
          processed_at?: string
        }
        Update: {
          event_created?: number
          event_id?: string
          event_type?: string
          outcome?: string
          processed_at?: string
        }
        Relationships: []
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
      track_lyrics: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          refined_lyrics: string
          reviewed_at: string | null
          track_id: string
          transcript_draft: string
          transcription_completed_at: string | null
          transcription_error: string
          transcription_requested_at: string | null
          transcription_status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          refined_lyrics?: string
          reviewed_at?: string | null
          track_id: string
          transcript_draft?: string
          transcription_completed_at?: string | null
          transcription_error?: string
          transcription_requested_at?: string | null
          transcription_status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          refined_lyrics?: string
          reviewed_at?: string | null
          track_id?: string
          transcript_draft?: string
          transcription_completed_at?: string | null
          transcription_error?: string
          transcription_requested_at?: string | null
          transcription_status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_lyrics_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          album_id: string | null
          artist_credit_search: string
          audio_url: string
          cover_url: string | null
          created_at: string
          creator_id: string
          description: string
          discovery_metadata: Json
          duration_sec: number
          featured_artist_names: string[]
          genre: string
          id: string
          is_featured: boolean
          primary_artist_name: string
          release_date: string | null
          rights_basis: string
          rights_confirmed: boolean
          rights_confirmed_at: string | null
          rights_policy_version: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          track_number: number | null
          updated_at: string
        }
        Insert: {
          album_id?: string | null
          artist_credit_search?: string
          audio_url: string
          cover_url?: string | null
          created_at?: string
          creator_id: string
          description?: string
          discovery_metadata?: Json
          duration_sec?: number
          featured_artist_names?: string[]
          genre?: string
          id?: string
          is_featured?: boolean
          primary_artist_name?: string
          release_date?: string | null
          rights_basis?: string
          rights_confirmed?: boolean
          rights_confirmed_at?: string | null
          rights_policy_version?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          track_number?: number | null
          updated_at?: string
        }
        Update: {
          album_id?: string | null
          artist_credit_search?: string
          audio_url?: string
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string
          discovery_metadata?: Json
          duration_sec?: number
          featured_artist_names?: string[]
          genre?: string
          id?: string
          is_featured?: boolean
          primary_artist_name?: string
          release_date?: string | null
          rights_basis?: string
          rights_confirmed?: boolean
          rights_confirmed_at?: string | null
          rights_policy_version?: string | null
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
      user_policy_acceptances: {
        Row: {
          acceptance_source: string
          accepted_at: string
          id: string
          policy_key: string
          policy_version: string
          user_id: string
        }
        Insert: {
          acceptance_source?: string
          accepted_at?: string
          id?: string
          policy_key: string
          policy_version: string
          user_id: string
        }
        Update: {
          acceptance_source?: string
          accepted_at?: string
          id?: string
          policy_key?: string
          policy_version?: string
          user_id?: string
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
      active_creator_plan: { Args: { _user_id: string }; Returns: string }
      certify_creator_music_rights: {
        Args: {
          requested_default_basis: string
          requested_policy_version: string
          statement_confirmed: boolean
        }
        Returns: {
          certification_statement: boolean
          certified_at: string
          certified_track_count: number
          creator_id: string
          default_rights_basis: string
          id: string
          policy_version: string
          renewal_interval: number
          revoked_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "creator_music_rights_certifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_audio_processing_job: {
        Args: { worker_version: string }
        Returns: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          creator_id: string
          id: string
          last_error: string | null
          processor_version: string | null
          queued_at: string
          started_at: string | null
          status: string
          track_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "audio_processing_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      complete_audio_processing_job: {
        Args: {
          audio_chromaprint: string
          audio_chromaprint_algorithm: number
          embedded_metadata: Json
          file_sha256: string
          measured_bitrate: number
          measured_duration: number
          measured_file_type: string
          measured_sample_rate: number
          target_job_id: string
          worker_version: string
        }
        Returns: undefined
      }
      create_creator_invite: {
        Args: {
          _assigned_plan?: string
          _email: string
          _expires_in_days?: number
          _internal_note?: string
          _recipient_name?: string
        }
        Returns: {
          expires_at: string
          invite_id: string
          invite_token: string
        }[]
      }
      creator_music_rights_status: {
        Args: never
        Returns: {
          active: boolean
          certified_at: string
          default_rights_basis: string
          policy_version: string
          uploads_since_certification: number
          uploads_until_renewal: number
        }[]
      }
      creator_plan_limit: {
        Args: { _limit_name: string; _user_id: string }
        Returns: number
      }
      fail_audio_processing_job: {
        Args: { failure: string; target_job_id: string }
        Returns: undefined
      }
      get_admin_back_office_summary: { Args: never; Returns: Json }
      get_admin_business_summary: { Args: never; Returns: Json }
      get_admin_campaign_analytics: {
        Args: {
          requested_campaign_id: string
          requested_end: string
          requested_start: string
        }
        Returns: Json
      }
      get_admin_creator_directory: {
        Args: { result_limit?: number; search_text?: string }
        Returns: {
          display_name: string
          email: string
          entitlement_status: string
          joined_at: string
          merch_count: number
          plan_code: string
          playlist_count: number
          published_track_count: number
          roles: string[]
          track_count: number
          user_id: string
          video_count: number
        }[]
      }
      get_admin_work_queue_summary: { Args: never; Returns: Json }
      get_business_pilot_dashboard: { Args: never; Returns: Json }
      get_my_creator_membership: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      inspect_creator_invite: {
        Args: { _token: string }
        Returns: {
          assigned_plan: string
          expires_at: string
          invitation_status: string
          recipient_hint: string
        }[]
      }
      queue_track_lyrics_transcription: {
        Args: { target_track_id: string }
        Returns: {
          created_at: string
          creator_id: string
          id: string
          refined_lyrics: string
          reviewed_at: string | null
          track_id: string
          transcript_draft: string
          transcription_completed_at: string | null
          transcription_error: string
          transcription_requested_at: string | null
          transcription_status: string
          updated_at: string
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "track_lyrics"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      queue_track_rights_processing: {
        Args: { target_track_id: string }
        Returns: string
      }
      record_business_campaign_event: {
        Args: {
          p_attribution_code?: string
          p_device_category?: string
          p_event_type: string
          p_placement_id: string
          p_referrer_path?: string
          p_session_id: string
        }
        Returns: boolean
      }
      record_shared_playlist_event: {
        Args: {
          p_event_type: string
          p_session_id: string
          p_slug: string
          p_track_id?: string
        }
        Returns: undefined
      }
      redeem_creator_invite: { Args: { _token: string }; Returns: string }
      replace_playlist_tracks: {
        Args: { _playlist_id: string; _track_ids: string[] }
        Returns: undefined
      }
      select_initial_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      set_profile_lead_track: { Args: { _track_id?: string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_listener_connection: {
        Args: {
          p_consent_share?: boolean
          p_consent_updates?: boolean
          p_display_name?: string
          p_email: string
          p_message?: string
          p_slug: string
          p_social_handle?: string
        }
        Returns: boolean
      }
      sync_business_pilot_notifications: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "creator" | "supporter" | "admin" | "business"
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
      app_role: ["creator", "supporter", "admin", "business"],
      content_status: ["draft", "published"],
    },
  },
} as const
