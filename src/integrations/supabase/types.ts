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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
      account_identities: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          identity_type: string
          owner_user_id: string
          status: string
          subject_user_id: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          identity_type: string
          owner_user_id: string
          status?: string
          subject_user_id?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          identity_type?: string
          owner_user_id?: string
          status?: string
          subject_user_id?: string | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      account_identity_preferences: {
        Row: {
          active_identity_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_identity_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_identity_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_identity_preferences_active_identity_id_fkey"
            columns: ["active_identity_id"]
            isOneToOne: false
            referencedRelation: "account_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_access_audit: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          details: Json
          id: number
          invitation_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          details?: Json
          id?: never
          invitation_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          details?: Json
          id?: never
          invitation_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_access_audit_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "admin_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_invitation_roles: {
        Row: {
          created_at: string
          invitation_id: string
          role_code: string
        }
        Insert: {
          created_at?: string
          invitation_id: string
          role_code: string
        }
        Update: {
          created_at?: string
          invitation_id?: string
          role_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_invitation_roles_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "admin_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_invitation_roles_role_code_fkey"
            columns: ["role_code"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["code"]
          },
        ]
      }
      admin_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          delivered_at: string | null
          delivery_error_code: string | null
          delivery_status: string
          email_normalized: string
          expires_at: string
          id: string
          issued_by: string
          recipient_name: string | null
          revoked_at: string | null
          revoked_by: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_error_code?: string | null
          delivery_status?: string
          email_normalized: string
          expires_at?: string
          id?: string
          issued_by: string
          recipient_name?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_error_code?: string | null
          delivery_status?: string
          email_normalized?: string
          expires_at?: string
          id?: string
          issued_by?: string
          recipient_name?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          token_hash?: string
        }
        Relationships: []
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
      admin_permissions: {
        Row: {
          code: string
          created_at: string
          description: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          name?: string
        }
        Relationships: []
      }
      admin_role_permissions: {
        Row: {
          created_at: string
          permission_code: string
          role_code: string
        }
        Insert: {
          created_at?: string
          permission_code: string
          role_code: string
        }
        Update: {
          created_at?: string
          permission_code?: string
          role_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_permissions_permission_code_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "admin_role_permissions_role_code_fkey"
            columns: ["role_code"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["code"]
          },
        ]
      }
      admin_roles: {
        Row: {
          code: string
          created_at: string
          description: string
          is_system: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          is_system?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      admin_team_member_roles: {
        Row: {
          assigned_at: string
          assigned_by: string
          role_code: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          role_code: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          role_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_team_member_roles_role_code_fkey"
            columns: ["role_code"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "admin_team_member_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_team_members"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_team_members: {
        Row: {
          activated_at: string
          added_by: string
          created_at: string
          revoked_at: string | null
          status: string
          suspended_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          added_by: string
          created_at?: string
          revoked_at?: string | null
          status?: string
          suspended_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          added_by?: string
          created_at?: string
          revoked_at?: string | null
          status?: string
          suspended_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_approvals: {
        Row: {
          created_at: string
          decision: string
          generation_id: string
          id: string
          policy_version: string
          reason: string | null
          reviewed_at: string
          reviewer_role: Database["public"]["Enums"]["app_role"]
          reviewer_subject: string
          reviewer_user_id: string | null
        }
        Insert: {
          created_at?: string
          decision: string
          generation_id: string
          id?: string
          policy_version: string
          reason?: string | null
          reviewed_at?: string
          reviewer_role?: Database["public"]["Enums"]["app_role"]
          reviewer_subject: string
          reviewer_user_id?: string | null
        }
        Update: {
          created_at?: string
          decision?: string
          generation_id?: string
          id?: string
          policy_version?: string
          reason?: string | null
          reviewed_at?: string
          reviewer_role?: Database["public"]["Enums"]["app_role"]
          reviewer_subject?: string
          reviewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_approvals_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: true
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generations: {
        Row: {
          created_at: string
          estimated_cost_usd: number
          failure_code: string | null
          failure_message: string | null
          id: string
          input_hash: string
          input_tokens: number
          latency_ms: number | null
          model: string
          output_schema_version: string
          output_tokens: number
          policy_escalation_approved: boolean
          policy_version: string
          pricing_version: string
          prompt_version: string
          provider: string
          provider_request_id: string | null
          reasoning_effort: string
          request_id: string
          service_tier: string
          status: string
          structured_output: Json | null
          version_number: number
        }
        Insert: {
          created_at?: string
          estimated_cost_usd?: number
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          input_hash: string
          input_tokens?: number
          latency_ms?: number | null
          model: string
          output_schema_version: string
          output_tokens?: number
          policy_escalation_approved?: boolean
          policy_version: string
          pricing_version: string
          prompt_version: string
          provider?: string
          provider_request_id?: string | null
          reasoning_effort?: string
          request_id: string
          service_tier: string
          status: string
          structured_output?: Json | null
          version_number: number
        }
        Update: {
          created_at?: string
          estimated_cost_usd?: number
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          input_hash?: string
          input_tokens?: number
          latency_ms?: number | null
          model?: string
          output_schema_version?: string
          output_tokens?: number
          policy_escalation_approved?: boolean
          policy_version?: string
          pricing_version?: string
          prompt_version?: string
          provider?: string
          provider_request_id?: string | null
          reasoning_effort?: string
          request_id?: string
          service_tier?: string
          status?: string
          structured_output?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ai_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_request_sources: {
        Row: {
          added_by_subject: string
          added_by_user_id: string | null
          authorization_scope: string
          campaign_id: string | null
          campaign_report_id: string | null
          created_at: string
          creative_id: string | null
          id: string
          offer_id: string | null
          partner_document_id: string | null
          request_id: string
          source_deleted_at: string | null
          source_kind: string
          source_record_id: string
          source_snapshot_hash: string
          source_state: string
          source_updated_at: string | null
        }
        Insert: {
          added_by_subject: string
          added_by_user_id?: string | null
          authorization_scope: string
          campaign_id?: string | null
          campaign_report_id?: string | null
          created_at?: string
          creative_id?: string | null
          id?: string
          offer_id?: string | null
          partner_document_id?: string | null
          request_id: string
          source_deleted_at?: string | null
          source_kind: string
          source_record_id: string
          source_snapshot_hash: string
          source_state?: string
          source_updated_at?: string | null
        }
        Update: {
          added_by_subject?: string
          added_by_user_id?: string | null
          authorization_scope?: string
          campaign_id?: string | null
          campaign_report_id?: string | null
          created_at?: string
          creative_id?: string | null
          id?: string
          offer_id?: string | null
          partner_document_id?: string | null
          request_id?: string
          source_deleted_at?: string | null
          source_kind?: string
          source_record_id?: string
          source_snapshot_hash?: string
          source_state?: string
          source_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_request_sources_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "business_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_request_sources_campaign_report_id_fkey"
            columns: ["campaign_report_id"]
            isOneToOne: false
            referencedRelation: "business_campaign_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_request_sources_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "business_campaign_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_request_sources_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "business_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_request_sources_partner_document_id_fkey"
            columns: ["partner_document_id"]
            isOneToOne: false
            referencedRelation: "business_partner_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_request_sources_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ai_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_requests: {
        Row: {
          actor_role: Database["public"]["Enums"]["app_role"]
          actor_subject: string
          actor_user_id: string | null
          authorization_context: Json
          business_id: string
          completed_at: string | null
          created_at: string
          default_model: string
          default_reasoning_effort: string
          emergency_stop_cost_usd: number
          expires_at: string | null
          id: string
          idempotency_expires_at: string
          input_hash: string
          invocation_idempotency_key: string
          invocation_idempotency_namespace: string
          invocation_idempotency_scope: string
          max_estimated_cost_usd: number
          max_generations: number
          max_input_tokens: number
          max_luna_output_tokens: number
          max_terra_output_tokens: number
          pilot_context_used: boolean
          pilot_id: string | null
          policy_snapshot: Json
          policy_version: string
          purpose: string
          request_payload: Json
          requested_at: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actor_role: Database["public"]["Enums"]["app_role"]
          actor_subject: string
          actor_user_id?: string | null
          authorization_context?: Json
          business_id: string
          completed_at?: string | null
          created_at?: string
          default_model?: string
          default_reasoning_effort?: string
          emergency_stop_cost_usd?: number
          expires_at?: string | null
          id?: string
          idempotency_expires_at: string
          input_hash: string
          invocation_idempotency_key: string
          invocation_idempotency_namespace?: string
          invocation_idempotency_scope: string
          max_estimated_cost_usd?: number
          max_generations?: number
          max_input_tokens?: number
          max_luna_output_tokens?: number
          max_terra_output_tokens?: number
          pilot_context_used?: boolean
          pilot_id?: string | null
          policy_snapshot: Json
          policy_version: string
          purpose: string
          request_payload?: Json
          requested_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actor_role?: Database["public"]["Enums"]["app_role"]
          actor_subject?: string
          actor_user_id?: string | null
          authorization_context?: Json
          business_id?: string
          completed_at?: string | null
          created_at?: string
          default_model?: string
          default_reasoning_effort?: string
          emergency_stop_cost_usd?: number
          expires_at?: string | null
          id?: string
          idempotency_expires_at?: string
          input_hash?: string
          invocation_idempotency_key?: string
          invocation_idempotency_namespace?: string
          invocation_idempotency_scope?: string
          max_estimated_cost_usd?: number
          max_generations?: number
          max_input_tokens?: number
          max_luna_output_tokens?: number
          max_terra_output_tokens?: number
          pilot_context_used?: boolean
          pilot_id?: string | null
          policy_snapshot?: Json
          policy_version?: string
          purpose?: string
          request_payload?: Json
          requested_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "business_pilot_records"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_retention_records: {
        Row: {
          approval_id: string | null
          changed_by_subject: string
          changed_by_user_id: string
          created_at: string
          deleted_at: string | null
          deletion_status: string
          generation_id: string | null
          id: string
          last_checked_at: string | null
          legal_hold: boolean
          legal_hold_reason: string | null
          provider_retention_status: string
          request_id: string
          retain_until: string | null
          retention_class: string
          safety_event_id: string | null
          source_deletion_state: string
          target_type: string
          updated_at: string
          usage_ledger_id: string | null
          user_decision_id: string | null
        }
        Insert: {
          approval_id?: string | null
          changed_by_subject: string
          changed_by_user_id: string
          created_at?: string
          deleted_at?: string | null
          deletion_status?: string
          generation_id?: string | null
          id?: string
          last_checked_at?: string | null
          legal_hold?: boolean
          legal_hold_reason?: string | null
          provider_retention_status?: string
          request_id: string
          retain_until?: string | null
          retention_class: string
          safety_event_id?: string | null
          source_deletion_state?: string
          target_type: string
          updated_at?: string
          usage_ledger_id?: string | null
          user_decision_id?: string | null
        }
        Update: {
          approval_id?: string | null
          changed_by_subject?: string
          changed_by_user_id?: string
          created_at?: string
          deleted_at?: string | null
          deletion_status?: string
          generation_id?: string | null
          id?: string
          last_checked_at?: string | null
          legal_hold?: boolean
          legal_hold_reason?: string | null
          provider_retention_status?: string
          request_id?: string
          retain_until?: string | null
          retention_class?: string
          safety_event_id?: string | null
          source_deletion_state?: string
          target_type?: string
          updated_at?: string
          usage_ledger_id?: string | null
          user_decision_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_retention_records_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "ai_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_retention_records_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_retention_records_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ai_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_retention_records_safety_event_id_fkey"
            columns: ["safety_event_id"]
            isOneToOne: false
            referencedRelation: "ai_safety_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_retention_records_usage_ledger_id_fkey"
            columns: ["usage_ledger_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_retention_records_user_decision_id_fkey"
            columns: ["user_decision_id"]
            isOneToOne: false
            referencedRelation: "ai_user_decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_safety_events: {
        Row: {
          created_at: string
          details: Json
          disposition: string
          escalation_status: string
          generation_id: string | null
          id: string
          minimal_excerpt: string | null
          recorded_by_subject: string
          recorded_by_user_id: string
          request_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by_subject: string | null
          resolved_by_user_id: string | null
          rule_id: string
          severity: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: Json
          disposition: string
          escalation_status?: string
          generation_id?: string | null
          id?: string
          minimal_excerpt?: string | null
          recorded_by_subject: string
          recorded_by_user_id: string
          request_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_subject?: string | null
          resolved_by_user_id?: string | null
          rule_id: string
          severity: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: Json
          disposition?: string
          escalation_status?: string
          generation_id?: string | null
          id?: string
          minimal_excerpt?: string | null
          recorded_by_subject?: string
          recorded_by_user_id?: string
          request_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_subject?: string | null
          resolved_by_user_id?: string | null
          rule_id?: string
          severity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_safety_events_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_safety_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ai_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_ledger: {
        Row: {
          business_id: string
          correction_of_ledger_id: string | null
          cost_state: string
          cost_usd: number
          created_at: string
          currency: string
          generation_id: string | null
          id: string
          input_units: number
          model: string
          occurred_at: string
          output_units: number
          pricing_version: string
          provider: string
          provider_billable: boolean
          request_id: string
          service_tier: string
        }
        Insert: {
          business_id: string
          correction_of_ledger_id?: string | null
          cost_state: string
          cost_usd?: number
          created_at?: string
          currency?: string
          generation_id?: string | null
          id?: string
          input_units?: number
          model: string
          occurred_at?: string
          output_units?: number
          pricing_version: string
          provider?: string
          provider_billable?: boolean
          request_id: string
          service_tier: string
        }
        Update: {
          business_id?: string
          correction_of_ledger_id?: string | null
          cost_state?: string
          cost_usd?: number
          created_at?: string
          currency?: string
          generation_id?: string | null
          id?: string
          input_units?: number
          model?: string
          occurred_at?: string
          output_units?: number
          pricing_version?: string
          provider?: string
          provider_billable?: boolean
          request_id?: string
          service_tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_ledger_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_ledger_correction_of_ledger_id_fkey"
            columns: ["correction_of_ledger_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_ledger_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_ledger_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ai_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_user_decisions: {
        Row: {
          actor_subject: string
          actor_user_id: string | null
          created_at: string
          decided_at: string
          decision: string
          decision_sequence: number
          generation_id: string
          id: string
          reason: string | null
          save_idempotency_key: string | null
          save_idempotency_namespace: string | null
          save_idempotency_scope: string | null
          saved_campaign_id: string | null
          saved_creative_id: string | null
          saved_offer_id: string | null
        }
        Insert: {
          actor_subject: string
          actor_user_id?: string | null
          created_at?: string
          decided_at?: string
          decision: string
          decision_sequence: number
          generation_id: string
          id?: string
          reason?: string | null
          save_idempotency_key?: string | null
          save_idempotency_namespace?: string | null
          save_idempotency_scope?: string | null
          saved_campaign_id?: string | null
          saved_creative_id?: string | null
          saved_offer_id?: string | null
        }
        Update: {
          actor_subject?: string
          actor_user_id?: string | null
          created_at?: string
          decided_at?: string
          decision?: string
          decision_sequence?: number
          generation_id?: string
          id?: string
          reason?: string | null
          save_idempotency_key?: string | null
          save_idempotency_namespace?: string | null
          save_idempotency_scope?: string | null
          saved_campaign_id?: string | null
          saved_creative_id?: string | null
          saved_offer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_user_decisions_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_user_decisions_saved_campaign_id_fkey"
            columns: ["saved_campaign_id"]
            isOneToOne: false
            referencedRelation: "business_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_user_decisions_saved_creative_id_fkey"
            columns: ["saved_creative_id"]
            isOneToOne: false
            referencedRelation: "business_campaign_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_user_decisions_saved_offer_id_fkey"
            columns: ["saved_offer_id"]
            isOneToOne: false
            referencedRelation: "business_offers"
            referencedColumns: ["id"]
          },
        ]
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
      creator_audio_masters: {
        Row: {
          bit_depth: number | null
          content_type: string
          created_at: string
          creator_id: string
          id: string
          original_filename: string
          sample_rate_hz: number | null
          size_bytes: number
          storage_bucket: string
          storage_path: string
          track_id: string
          updated_at: string
        }
        Insert: {
          bit_depth?: number | null
          content_type: string
          created_at?: string
          creator_id: string
          id?: string
          original_filename: string
          sample_rate_hz?: number | null
          size_bytes: number
          storage_bucket?: string
          storage_path: string
          track_id: string
          updated_at?: string
        }
        Update: {
          bit_depth?: number | null
          content_type?: string
          created_at?: string
          creator_id?: string
          id?: string
          original_filename?: string
          sample_rate_hz?: number | null
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_audio_masters_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_epk_assets: {
        Row: {
          alt_text: string
          asset_type: string
          caption: string
          content_type: string
          created_at: string
          creator_id: string
          display_order: number
          id: string
          is_featured: boolean
          is_public: boolean
          orientation: string | null
          original_filename: string
          size_bytes: number
          storage_bucket: string
          storage_path: string
          title: string
          updated_at: string
        }
        Insert: {
          alt_text?: string
          asset_type: string
          caption?: string
          content_type: string
          created_at?: string
          creator_id: string
          display_order?: number
          id?: string
          is_featured?: boolean
          is_public?: boolean
          orientation?: string | null
          original_filename: string
          size_bytes: number
          storage_bucket?: string
          storage_path: string
          title?: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          asset_type?: string
          caption?: string
          content_type?: string
          created_at?: string
          creator_id?: string
          display_order?: number
          id?: string
          is_featured?: boolean
          is_public?: boolean
          orientation?: string | null
          original_filename?: string
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_epk_featured_tracks: {
        Row: {
          apple_music_url: string
          bandcamp_url: string
          created_at: string
          creator_id: string
          display_order: number
          include_credits: boolean
          include_lyrics: boolean
          is_public: boolean
          spotify_url: string
          track_id: string
          updated_at: string
        }
        Insert: {
          apple_music_url?: string
          bandcamp_url?: string
          created_at?: string
          creator_id: string
          display_order?: number
          include_credits?: boolean
          include_lyrics?: boolean
          is_public?: boolean
          spotify_url?: string
          track_id: string
          updated_at?: string
        }
        Update: {
          apple_music_url?: string
          bandcamp_url?: string
          created_at?: string
          creator_id?: string
          display_order?: number
          include_credits?: boolean
          include_lyrics?: boolean
          is_public?: boolean
          spotify_url?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_epk_featured_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_epk_press_highlights: {
        Row: {
          asset_id: string | null
          created_at: string
          creator_id: string
          display_order: number
          highlight_type: string
          id: string
          is_public: boolean
          occurred_on: string | null
          quote_text: string
          source_name: string
          source_url: string
          title: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          creator_id: string
          display_order?: number
          highlight_type: string
          id?: string
          is_public?: boolean
          occurred_on?: string | null
          quote_text?: string
          source_name?: string
          source_url?: string
          title: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          creator_id?: string
          display_order?: number
          highlight_type?: string
          id?: string
          is_public?: boolean
          occurred_on?: string | null
          quote_text?: string
          source_name?: string
          source_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_epk_press_highlights_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "creator_epk_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_epk_profiles: {
        Row: {
          accent_color: string
          bandcamp_url: string
          booking_contact_name: string
          booking_email: string
          booking_phone: string
          business_email: string
          created_at: string
          creator_id: string
          long_bio: string
          management_email: string
          management_name: string
          medium_bio: string
          primary_color: string
          public_booking_email: boolean
          public_booking_phone: boolean
          public_business_email: boolean
          public_management_contact: boolean
          public_publicist_contact: boolean
          publicist_email: string
          publicist_name: string
          published_at: string | null
          secondary_color: string
          short_bio: string
          slug: string | null
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          accent_color?: string
          bandcamp_url?: string
          booking_contact_name?: string
          booking_email?: string
          booking_phone?: string
          business_email?: string
          created_at?: string
          creator_id: string
          long_bio?: string
          management_email?: string
          management_name?: string
          medium_bio?: string
          primary_color?: string
          public_booking_email?: boolean
          public_booking_phone?: boolean
          public_business_email?: boolean
          public_management_contact?: boolean
          public_publicist_contact?: boolean
          publicist_email?: string
          publicist_name?: string
          published_at?: string | null
          secondary_color?: string
          short_bio?: string
          slug?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          accent_color?: string
          bandcamp_url?: string
          booking_contact_name?: string
          booking_email?: string
          booking_phone?: string
          business_email?: string
          created_at?: string
          creator_id?: string
          long_bio?: string
          management_email?: string
          management_name?: string
          medium_bio?: string
          primary_color?: string
          public_booking_email?: boolean
          public_booking_phone?: boolean
          public_business_email?: boolean
          public_management_contact?: boolean
          public_publicist_contact?: boolean
          publicist_email?: string
          publicist_name?: string
          published_at?: string | null
          secondary_color?: string
          short_bio?: string
          slug?: string | null
          status?: string
          updated_at?: string
          visibility?: string
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
      creator_organization_members: {
        Row: {
          created_at: string
          creator_user_id: string | null
          department: string | null
          display_order: number
          featured: boolean
          genres: string[]
          id: string
          name: string
          organization_id: string
          photo_url: string | null
          role: string
          short_bio: string | null
          status: string
        }
        Insert: {
          created_at?: string
          creator_user_id?: string | null
          department?: string | null
          display_order?: number
          featured?: boolean
          genres?: string[]
          id?: string
          name: string
          organization_id: string
          photo_url?: string | null
          role: string
          short_bio?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          creator_user_id?: string | null
          department?: string | null
          display_order?: number
          featured?: boolean
          genres?: string[]
          id?: string
          name?: string
          organization_id?: string
          photo_url?: string | null
          role?: string
          short_bio?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "creator_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_organization_relationships: {
        Row: {
          created_at: string
          id: string
          member_id: string
          organization_id: string
          relationship_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          organization_id: string
          relationship_type: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          organization_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_organization_relationships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "creator_organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_organization_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "creator_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_organizations: {
        Row: {
          biography: string | null
          brand_story: string | null
          contact_email: string | null
          created_at: string
          creator_type: string
          id: string
          identity_id: string | null
          logo_url: string | null
          mission_statement: string | null
          name: string
          owner_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          biography?: string | null
          brand_story?: string | null
          contact_email?: string | null
          created_at?: string
          creator_type: string
          id?: string
          identity_id?: string | null
          logo_url?: string | null
          mission_statement?: string | null
          name: string
          owner_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          biography?: string | null
          brand_story?: string | null
          contact_email?: string | null
          created_at?: string
          creator_type?: string
          id?: string
          identity_id?: string | null
          logo_url?: string | null
          mission_statement?: string | null
          name?: string
          owner_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_organizations_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: true
            referencedRelation: "account_identities"
            referencedColumns: ["id"]
          },
        ]
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
      creator_track_credits: {
        Row: {
          created_at: string
          creator_id: string
          credit_role: string
          credited_name: string
          details: string
          display_order: number
          id: string
          track_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          credit_role: string
          credited_name: string
          details?: string
          display_order?: number
          id?: string
          track_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          credit_role?: string
          credited_name?: string
          details?: string
          display_order?: number
          id?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_track_credits_track_id_fkey"
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
      engagement_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_identity_id: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_identity_id: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_identity_id?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_reports_reporter_identity_id_fkey"
            columns: ["reporter_identity_id"]
            isOneToOne: false
            referencedRelation: "account_identities"
            referencedColumns: ["id"]
          },
        ]
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
      identity_action_audit: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: number
          identity_id: string
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: never
          identity_id: string
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: never
          identity_id?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_action_audit_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "account_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_comments: {
        Row: {
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          identity_id: string
          parent_comment_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          identity_id: string
          parent_comment_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          identity_id?: string
          parent_comment_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_comments_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "account_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "identity_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_follows: {
        Row: {
          created_at: string
          follower_identity_id: string
          id: string
          target_identity_id: string
        }
        Insert: {
          created_at?: string
          follower_identity_id: string
          id?: string
          target_identity_id: string
        }
        Update: {
          created_at?: string
          follower_identity_id?: string
          id?: string
          target_identity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_follows_follower_identity_id_fkey"
            columns: ["follower_identity_id"]
            isOneToOne: false
            referencedRelation: "account_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_follows_target_identity_id_fkey"
            columns: ["target_identity_id"]
            isOneToOne: false
            referencedRelation: "account_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_notifications: {
        Row: {
          actor_identity_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          notification_type: string
          payload: Json
          read_at: string | null
          recipient_identity_id: string
        }
        Insert: {
          actor_identity_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          notification_type: string
          payload?: Json
          read_at?: string | null
          recipient_identity_id: string
        }
        Update: {
          actor_identity_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          notification_type?: string
          payload?: Json
          read_at?: string | null
          recipient_identity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_notifications_actor_identity_id_fkey"
            columns: ["actor_identity_id"]
            isOneToOne: false
            referencedRelation: "account_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_notifications_recipient_identity_id_fkey"
            columns: ["recipient_identity_id"]
            isOneToOne: false
            referencedRelation: "account_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_reactions: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          identity_id: string
          reaction_type: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          identity_id: string
          reaction_type: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          identity_id?: string
          reaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_reactions_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "account_identities"
            referencedColumns: ["id"]
          },
        ]
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
      play_content_items: {
        Row: {
          content_key: string
          created_at: string
          created_by: string
          difficulty: string
          discovery_url: string | null
          experience_type: string
          explanation: string
          game_pack_id: string | null
          genre: string
          id: string
          payload: Json
          position: number | null
          prompt: string
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          rights_status: string
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          source_title: string | null
          source_url: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string
          verification_notes: string
          version: number
          visibility: string
        }
        Insert: {
          content_key: string
          created_at?: string
          created_by?: string
          difficulty?: string
          discovery_url?: string | null
          experience_type: string
          explanation?: string
          game_pack_id?: string | null
          genre?: string
          id?: string
          payload?: Json
          position?: number | null
          prompt: string
          published_at?: string | null
          published_by?: string | null
          reviewed_by?: string | null
          rights_status?: string
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          source_title?: string | null
          source_url?: string | null
          status?: string
          title: string
          updated_at?: string
          updated_by?: string
          verification_notes?: string
          version?: number
          visibility?: string
        }
        Update: {
          content_key?: string
          created_at?: string
          created_by?: string
          difficulty?: string
          discovery_url?: string | null
          experience_type?: string
          explanation?: string
          game_pack_id?: string | null
          genre?: string
          id?: string
          payload?: Json
          position?: number | null
          prompt?: string
          published_at?: string | null
          published_by?: string | null
          reviewed_by?: string | null
          rights_status?: string
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          source_title?: string | null
          source_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string
          verification_notes?: string
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "play_content_items_game_pack_id_fkey"
            columns: ["game_pack_id"]
            isOneToOne: false
            referencedRelation: "play_game_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      play_content_revisions: {
        Row: {
          change_reason: string
          changed_at: string
          changed_by: string | null
          content_item_id: string
          id: number
          snapshot: Json
          version: number
        }
        Insert: {
          change_reason?: string
          changed_at?: string
          changed_by?: string | null
          content_item_id: string
          id?: number
          snapshot: Json
          version: number
        }
        Update: {
          change_reason?: string
          changed_at?: string
          changed_by?: string | null
          content_item_id?: string
          id?: number
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "play_content_revisions_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "play_content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      play_game_pack_revisions: {
        Row: {
          change_reason: string
          changed_at: string
          changed_by: string | null
          game_pack_id: string
          id: number
          snapshot: Json
          version: number
        }
        Insert: {
          change_reason?: string
          changed_at?: string
          changed_by?: string | null
          game_pack_id: string
          id?: number
          snapshot: Json
          version: number
        }
        Update: {
          change_reason?: string
          changed_at?: string
          changed_by?: string | null
          game_pack_id?: string
          id?: number
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "play_game_pack_revisions_game_pack_id_fkey"
            columns: ["game_pack_id"]
            isOneToOne: false
            referencedRelation: "play_game_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      play_game_packs: {
        Row: {
          created_at: string
          created_by: string
          description: string
          game_type: string
          genre: string
          id: string
          pack_key: string
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string
          version: number
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string
          game_type: string
          genre?: string
          id?: string
          pack_key: string
          published_at?: string | null
          published_by?: string | null
          reviewed_by?: string | null
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          status?: string
          title: string
          updated_at?: string
          updated_by?: string
          version?: number
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          game_type?: string
          genre?: string
          id?: string
          pack_key?: string
          published_at?: string | null
          published_by?: string | null
          reviewed_by?: string | null
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string
          version?: number
          visibility?: string
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
      accept_admin_invitation_v24_28: {
        Args: { _token: string }
        Returns: string
      }
      active_creator_plan: { Args: { _user_id: string }; Returns: string }
      allocate_ai_generation_version: {
        Args: { target_request_id: string }
        Returns: number
      }
      allocate_ai_user_decision_sequence: {
        Args: { target_generation_id: string }
        Returns: number
      }
      can_access_business_ai: {
        Args: { target_business_id: string }
        Returns: boolean
      }
      can_read_ai_request: {
        Args: { target_request_id: string }
        Returns: boolean
      }
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
      create_admin_invitation_v24_28: {
        Args: {
          _email: string
          _expires_in_days?: number
          _recipient_name?: string
          _role_codes: string[]
        }
        Returns: {
          expires_at: string
          invitation_id: string
          invitation_token: string
        }[]
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
      create_my_business_campaign_draft_v24_27_1: {
        Args: {
          p_disclosure_text?: string
          p_ends_at?: string
          p_name: string
          p_objective: string
          p_starts_at?: string
          p_target_audience?: string
          p_target_genres?: string[]
          p_target_regions?: string[]
        }
        Returns: string
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
      ensure_my_identities: {
        Args: never
        Returns: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          identity_type: string
          owner_user_id: string
          status: string
          subject_user_id: string | null
          updated_at: string
          verified: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "account_identities"
          isOneToOne: false
          isSetofReturn: true
        }
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
      get_admin_team_dashboard_v24_28: { Args: never; Returns: Json }
      get_admin_work_queue_summary: { Args: never; Returns: Json }
      get_business_pilot_dashboard: { Args: never; Returns: Json }
      get_my_admin_access_v24_28: { Args: never; Returns: Json }
      get_my_creator_membership: { Args: never; Returns: Json }
      has_admin_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      inspect_admin_invitation_v24_28: {
        Args: { _token: string }
        Returns: {
          expires_at: string
          invitation_status: string
          recipient_name: string
          role_names: string[]
        }[]
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
      mark_admin_invitation_delivery_v24_28: {
        Args: {
          _delivery_error_code?: string
          _delivery_status: string
          _invitation_id: string
        }
        Returns: undefined
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
      revoke_admin_invitation_v24_28: {
        Args: { _invitation_id: string }
        Returns: undefined
      }
      save_play_content_item_v24_32: {
        Args: {
          _content_key: string
          _difficulty?: string
          _discovery_url?: string
          _experience_type: string
          _explanation?: string
          _genre?: string
          _id: string
          _payload?: Json
          _prompt: string
          _rights_status?: string
          _scheduled_end_at?: string
          _scheduled_start_at?: string
          _source_title?: string
          _source_url?: string
          _title: string
          _verification_notes?: string
          _visibility?: string
        }
        Returns: {
          content_key: string
          created_at: string
          created_by: string
          difficulty: string
          discovery_url: string | null
          experience_type: string
          explanation: string
          game_pack_id: string | null
          genre: string
          id: string
          payload: Json
          position: number | null
          prompt: string
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          rights_status: string
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          source_title: string | null
          source_url: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string
          verification_notes: string
          version: number
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "play_content_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_play_game_pack_v24_33: {
        Args: {
          _description?: string
          _game_type: string
          _genre?: string
          _id: string
          _pack_key: string
          _scheduled_end_at?: string
          _scheduled_start_at?: string
          _title: string
          _visibility?: string
        }
        Returns: {
          created_at: string
          created_by: string
          description: string
          game_type: string
          genre: string
          id: string
          pack_key: string
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string
          version: number
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "play_game_packs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_play_pack_item_v24_33: {
        Args: {
          _content_key: string
          _difficulty?: string
          _discovery_url?: string
          _explanation?: string
          _game_pack_id: string
          _id: string
          _payload?: Json
          _position: number
          _prompt: string
          _rights_status?: string
          _source_title?: string
          _source_url?: string
          _title: string
          _verification_notes?: string
        }
        Returns: {
          content_key: string
          created_at: string
          created_by: string
          difficulty: string
          discovery_url: string | null
          experience_type: string
          explanation: string
          game_pack_id: string | null
          genre: string
          id: string
          payload: Json
          position: number | null
          prompt: string
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          rights_status: string
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          source_title: string | null
          source_url: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string
          verification_notes: string
          version: number
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "play_content_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      select_initial_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      set_admin_member_roles_v24_28: {
        Args: { _role_codes: string[]; _target_user_id: string }
        Returns: undefined
      }
      set_admin_member_status_v24_28: {
        Args: { _status: string; _target_user_id: string }
        Returns: undefined
      }
      set_my_active_identity: {
        Args: { p_identity_id: string }
        Returns: undefined
      }
      set_play_content_rights_status_v24_32: {
        Args: {
          _id: string
          _rights_status: string
          _verification_notes?: string
        }
        Returns: {
          content_key: string
          created_at: string
          created_by: string
          difficulty: string
          discovery_url: string | null
          experience_type: string
          explanation: string
          game_pack_id: string | null
          genre: string
          id: string
          payload: Json
          position: number | null
          prompt: string
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          rights_status: string
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          source_title: string | null
          source_url: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string
          verification_notes: string
          version: number
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "play_content_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_play_content_status_v24_32: {
        Args: { _id: string; _status: string }
        Returns: {
          content_key: string
          created_at: string
          created_by: string
          difficulty: string
          discovery_url: string | null
          experience_type: string
          explanation: string
          game_pack_id: string | null
          genre: string
          id: string
          payload: Json
          position: number | null
          prompt: string
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          rights_status: string
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          source_title: string | null
          source_url: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string
          verification_notes: string
          version: number
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "play_content_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_play_game_pack_status_v24_33: {
        Args: { _id: string; _status: string }
        Returns: {
          created_at: string
          created_by: string
          description: string
          game_type: string
          genre: string
          id: string
          pack_key: string
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string
          version: number
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "play_game_packs"
          isOneToOne: true
          isSetofReturn: false
        }
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
      submit_my_business_campaign_v24_27_1: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      sync_business_pilot_notifications: { Args: never; Returns: undefined }
      update_my_business_campaign_draft_v24_27_1: {
        Args: {
          p_campaign_id: string
          p_disclosure_text?: string
          p_ends_at?: string
          p_name: string
          p_objective: string
          p_starts_at?: string
          p_target_audience?: string
          p_target_genres?: string[]
          p_target_regions?: string[]
        }
        Returns: undefined
      }
      upsert_my_business_campaign_offer_v24_27_1: {
        Args: {
          p_campaign_id: string
          p_description: string
          p_ends_at?: string
          p_max_redemptions?: number
          p_starts_at?: string
          p_terms?: string
          p_title: string
        }
        Returns: string
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["creator", "supporter", "admin", "business"],
      content_status: ["draft", "published"],
    },
  },
} as const
