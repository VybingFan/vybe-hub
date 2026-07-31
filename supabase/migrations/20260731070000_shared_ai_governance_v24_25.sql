-- ============================================================================
-- VYBE V24.25 SHARED AI GOVERNANCE
-- NEWLY REGENERATED COMPLETE REVIEW-ONLY MIGRATION
--
-- Baseline:
--   V24.24.1 Type and Configuration Alignment
--   Branch: vybe-type-configuration-alignment-v24-24-1
--   Commit: ebfd7e2
--   Supabase project: jqpzjbxazsiczngaqepc
--   Authoritative schema: VYBE_SUPABASE_TYPES_V24_24.ts
--
-- CONTROLLED IMPLEMENTATION MIGRATION:
--   Apply only through the authorized V24.25 migration workflow.
--   Governance schema only; no AI provider execution is enabled.
--   DO NOT ADD PROVIDER CREDENTIALS.
--   This migration begins a transaction and ends with COMMIT.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. TABLES
-- --------------------------------------------------------------------------

CREATE TABLE public.ai_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_subject text NOT NULL,
  actor_role public.app_role NOT NULL CHECK (actor_role IN ('business', 'admin')),

  business_id uuid NOT NULL
    REFERENCES public.business_profiles(id) ON DELETE RESTRICT,
  pilot_id uuid
    REFERENCES public.business_pilot_records(id) ON DELETE SET NULL,
  pilot_context_used boolean NOT NULL DEFAULT false,

  purpose text NOT NULL CHECK (purpose IN (
    'business_campaign_preview',
    'campaign_copy_revision',
    'offer_draft_preview',
    'creative_brief_preview',
    'partner_document_summary',
    'analytics_explanation'
  )),

  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued',
    'running',
    'completed',
    'failed',
    'blocked',
    'cancelled',
    'expired'
  )),

  input_hash text NOT NULL,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  authorization_context jsonb NOT NULL DEFAULT '{}'::jsonb,

  policy_version text NOT NULL,
  policy_snapshot jsonb NOT NULL,

  default_model text NOT NULL DEFAULT 'gpt-5.6-luna'
    CHECK (default_model = 'gpt-5.6-luna'),
  default_reasoning_effort text NOT NULL DEFAULT 'low'
    CHECK (default_reasoning_effort = 'low'),
  max_input_tokens integer NOT NULL DEFAULT 12000
    CHECK (max_input_tokens BETWEEN 1 AND 12000),
  max_luna_output_tokens integer NOT NULL DEFAULT 3000
    CHECK (max_luna_output_tokens BETWEEN 1 AND 3000),
  max_terra_output_tokens integer NOT NULL DEFAULT 2000
    CHECK (max_terra_output_tokens BETWEEN 1 AND 2000),
  max_generations integer NOT NULL DEFAULT 3
    CHECK (max_generations BETWEEN 1 AND 3),
  max_estimated_cost_usd numeric(12,6) NOT NULL DEFAULT 0.05
    CHECK (max_estimated_cost_usd > 0 AND max_estimated_cost_usd <= 0.05),
  emergency_stop_cost_usd numeric(12,6) NOT NULL DEFAULT 0.10
    CHECK (
      emergency_stop_cost_usd >= max_estimated_cost_usd
      AND emergency_stop_cost_usd <= 0.10
    ),

  invocation_idempotency_namespace text NOT NULL DEFAULT 'openai_text_v1',
  invocation_idempotency_key text NOT NULL,
  invocation_idempotency_scope text NOT NULL,
  idempotency_expires_at timestamptz NOT NULL,

  requested_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_requests_actor_subject_nonblank
    CHECK (length(trim(actor_subject)) > 0),
  CONSTRAINT ai_requests_input_hash_nonblank
    CHECK (length(trim(input_hash)) > 0),
  CONSTRAINT ai_requests_policy_version_nonblank
    CHECK (length(trim(policy_version)) > 0),
  CONSTRAINT ai_requests_idempotency_nonblank
    CHECK (
      length(trim(invocation_idempotency_namespace)) > 0
      AND length(trim(invocation_idempotency_key)) > 0
      AND length(trim(invocation_idempotency_scope)) > 0
    ),
  CONSTRAINT ai_requests_provider_idempotency_unique
    UNIQUE (
      actor_subject,
      business_id,
      purpose,
      invocation_idempotency_namespace,
      invocation_idempotency_scope,
      invocation_idempotency_key
    ),
  CONSTRAINT ai_requests_pilot_state_consistency
    CHECK (
      (pilot_id IS NULL)
      OR (pilot_id IS NOT NULL AND pilot_context_used = true)
    ),
  CONSTRAINT ai_requests_time_consistency
    CHECK (
      (started_at IS NULL OR started_at >= requested_at)
      AND (completed_at IS NULL OR completed_at >= requested_at)
      AND (expires_at IS NULL OR expires_at >= requested_at)
      AND idempotency_expires_at >= requested_at
    )
);

COMMENT ON TABLE public.ai_requests IS
  'One authorized AI operation inside one VYBE business boundary. Does not store campaign, offer, creative, document, or report source IDs.';

CREATE TABLE public.ai_request_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  request_id uuid NOT NULL
    REFERENCES public.ai_requests(id) ON DELETE RESTRICT,

  source_kind text NOT NULL CHECK (source_kind IN (
    'campaign',
    'offer',
    'creative',
    'partner_document',
    'campaign_report'
  )),

  campaign_id uuid
    REFERENCES public.business_campaigns(id) ON DELETE SET NULL,
  offer_id uuid
    REFERENCES public.business_offers(id) ON DELETE SET NULL,
  creative_id uuid
    REFERENCES public.business_campaign_creatives(id) ON DELETE SET NULL,
  partner_document_id uuid
    REFERENCES public.business_partner_documents(id) ON DELETE SET NULL,
  campaign_report_id uuid
    REFERENCES public.business_campaign_reports(id) ON DELETE SET NULL,

  source_record_id uuid NOT NULL,
  source_state text NOT NULL DEFAULT 'present' CHECK (source_state IN (
    'present',
    'stale',
    'deleted',
    'restricted',
    'legally_retained'
  )),
  source_updated_at timestamptz,
  source_snapshot_hash text NOT NULL,
  source_deleted_at timestamptz,

  authorization_scope text NOT NULL CHECK (authorization_scope IN (
    'business_owner',
    'administrator',
    'partner_visible',
    'released_report'
  )),

  added_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  added_by_subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_request_sources_actor_subject_nonblank
    CHECK (length(trim(added_by_subject)) > 0),
  CONSTRAINT ai_request_sources_snapshot_hash_nonblank
    CHECK (length(trim(source_snapshot_hash)) > 0),

  CONSTRAINT ai_request_sources_exactly_one_live_source CHECK (
    (
      source_state <> 'deleted'
      AND source_deleted_at IS NULL
      AND num_nonnulls(
        campaign_id,
        offer_id,
        creative_id,
        partner_document_id,
        campaign_report_id
      ) = 1
    )
    OR (
      source_state = 'deleted'
      AND source_deleted_at IS NOT NULL
      AND num_nonnulls(
        campaign_id,
        offer_id,
        creative_id,
        partner_document_id,
        campaign_report_id
      ) = 0
    )
  ),

  CONSTRAINT ai_request_sources_kind_matches_reference CHECK (
    source_state = 'deleted'
    OR (source_kind = 'campaign' AND campaign_id IS NOT NULL)
    OR (source_kind = 'offer' AND offer_id IS NOT NULL)
    OR (source_kind = 'creative' AND creative_id IS NOT NULL)
    OR (source_kind = 'partner_document' AND partner_document_id IS NOT NULL)
    OR (source_kind = 'campaign_report' AND campaign_report_id IS NOT NULL)
  ),

  CONSTRAINT ai_request_sources_tombstone_identity_unique
    UNIQUE (request_id, source_kind, source_record_id)
);

COMMENT ON TABLE public.ai_request_sources IS
  'Typed exactly-one-source references with same-business validation and deletion tombstones.';

CREATE TABLE public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  request_id uuid NOT NULL
    REFERENCES public.ai_requests(id) ON DELETE RESTRICT,
  version_number integer NOT NULL
    CHECK (version_number BETWEEN 1 AND 3),

  provider text NOT NULL DEFAULT 'openai'
    CHECK (provider = 'openai'),
  model text NOT NULL
    CHECK (model IN ('gpt-5.6-luna', 'gpt-5.6-terra')),
  policy_escalation_approved boolean NOT NULL DEFAULT false,
  reasoning_effort text NOT NULL DEFAULT 'low'
    CHECK (reasoning_effort = 'low'),
  service_tier text NOT NULL,

  prompt_version text NOT NULL,
  output_schema_version text NOT NULL,
  policy_version text NOT NULL,
  pricing_version text NOT NULL,
  input_hash text NOT NULL,

  structured_output jsonb,
  status text NOT NULL CHECK (status IN (
    'completed',
    'failed',
    'blocked'
  )),

  provider_request_id text,
  input_tokens integer NOT NULL DEFAULT 0
    CHECK (input_tokens BETWEEN 0 AND 12000),
  output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(12,6) NOT NULL DEFAULT 0
    CHECK (estimated_cost_usd >= 0 AND estimated_cost_usd <= 0.10),
  latency_ms integer CHECK (latency_ms IS NULL OR latency_ms >= 0),

  failure_code text,
  failure_message text,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_generations_request_version_unique
    UNIQUE (request_id, version_number),
  CONSTRAINT ai_generations_model_escalation CHECK (
    model = 'gpt-5.6-luna'
    OR (model = 'gpt-5.6-terra' AND policy_escalation_approved = true)
  ),
  CONSTRAINT ai_generations_model_output_limit CHECK (
    (model = 'gpt-5.6-luna' AND output_tokens BETWEEN 0 AND 3000)
    OR (model = 'gpt-5.6-terra' AND output_tokens BETWEEN 0 AND 2000)
  ),
  CONSTRAINT ai_generations_nonblank_versions CHECK (
    length(trim(service_tier)) > 0
    AND length(trim(prompt_version)) > 0
    AND length(trim(output_schema_version)) > 0
    AND length(trim(policy_version)) > 0
    AND length(trim(pricing_version)) > 0
    AND length(trim(input_hash)) > 0
  ),
  CONSTRAINT ai_generations_status_output_consistency CHECK (
    (
      status = 'completed'
      AND structured_output IS NOT NULL
      AND failure_code IS NULL
    )
    OR status IN ('failed', 'blocked')
  )
);

CREATE UNIQUE INDEX ai_generations_provider_request_unique_idx
  ON public.ai_generations(provider, provider_request_id)
  WHERE provider_request_id IS NOT NULL;

COMMENT ON TABLE public.ai_generations IS
  'Append-only provider output versions. Luna is default; Terra requires explicit policy escalation and a 2,000-token output maximum.';

CREATE TABLE public.ai_user_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  generation_id uuid NOT NULL
    REFERENCES public.ai_generations(id) ON DELETE RESTRICT,
  decision_sequence integer NOT NULL
    CHECK (decision_sequence > 0),

  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_subject text NOT NULL,

  decision text NOT NULL CHECK (decision IN (
    'accepted',
    'rejected',
    'changes_requested',
    'saved_as_draft'
  )),
  reason text,

  saved_campaign_id uuid
    REFERENCES public.business_campaigns(id) ON DELETE RESTRICT,
  saved_offer_id uuid
    REFERENCES public.business_offers(id) ON DELETE RESTRICT,
  saved_creative_id uuid
    REFERENCES public.business_campaign_creatives(id) ON DELETE RESTRICT,

  save_idempotency_namespace text,
  save_idempotency_scope text,
  save_idempotency_key text,

  decided_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_user_decisions_actor_subject_nonblank
    CHECK (length(trim(actor_subject)) > 0),
  CONSTRAINT ai_user_decisions_generation_sequence_unique
    UNIQUE (generation_id, decision_sequence),
  CONSTRAINT ai_user_decisions_saved_target_consistency CHECK (
    (
      decision <> 'saved_as_draft'
      AND num_nonnulls(
        saved_campaign_id,
        saved_offer_id,
        saved_creative_id
      ) = 0
      AND save_idempotency_namespace IS NULL
      AND save_idempotency_scope IS NULL
      AND save_idempotency_key IS NULL
    )
    OR (
      decision = 'saved_as_draft'
      AND num_nonnulls(
        saved_campaign_id,
        saved_offer_id,
        saved_creative_id
      ) = 1
      AND length(trim(save_idempotency_namespace)) > 0
      AND length(trim(save_idempotency_scope)) > 0
      AND length(trim(save_idempotency_key)) > 0
    )
  )
);

CREATE UNIQUE INDEX ai_user_decisions_save_idempotency_unique_idx
  ON public.ai_user_decisions(
    actor_subject,
    save_idempotency_namespace,
    save_idempotency_scope,
    save_idempotency_key
  )
  WHERE decision = 'saved_as_draft';

COMMENT ON TABLE public.ai_user_decisions IS
  'Append-only business acceptance and future draft-save provenance. Separate from administrator governance approval.';

CREATE TABLE public.ai_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  generation_id uuid NOT NULL UNIQUE
    REFERENCES public.ai_generations(id) ON DELETE RESTRICT,

  reviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_subject text NOT NULL,
  reviewer_role public.app_role NOT NULL DEFAULT 'admin'
    CHECK (reviewer_role = 'admin'),

  decision text NOT NULL CHECK (decision IN (
    'approved',
    'rejected',
    'changes_requested',
    'expired'
  )),
  reason text,

  policy_version text NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_approvals_reviewer_subject_nonblank
    CHECK (length(trim(reviewer_subject)) > 0),
  CONSTRAINT ai_approvals_policy_version_nonblank
    CHECK (length(trim(policy_version)) > 0)
);

COMMENT ON TABLE public.ai_approvals IS
  'Administrator-only governance decision for one exact generation. Does not approve an underlying VYBE record.';

CREATE TABLE public.ai_safety_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  request_id uuid NOT NULL
    REFERENCES public.ai_requests(id) ON DELETE RESTRICT,
  generation_id uuid
    REFERENCES public.ai_generations(id) ON DELETE RESTRICT,

  rule_id text NOT NULL,
  severity text NOT NULL CHECK (severity IN (
    'low',
    'medium',
    'high',
    'critical'
  )),
  disposition text NOT NULL CHECK (disposition IN (
    'allowed',
    'warned',
    'blocked',
    'escalated'
  )),
  escalation_status text NOT NULL DEFAULT 'not_required' CHECK (
    escalation_status IN (
      'not_required',
      'pending',
      'reviewed',
      'resolved'
    )
  ),

  minimal_excerpt text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,

  recorded_by_user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE RESTRICT,
  recorded_by_subject text NOT NULL,

  resolution_notes text,
  resolved_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by_subject text,
  resolved_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_safety_events_rule_nonblank
    CHECK (length(trim(rule_id)) > 0),
  CONSTRAINT ai_safety_events_recorded_subject_nonblank
    CHECK (length(trim(recorded_by_subject)) > 0),

  CONSTRAINT ai_safety_events_disposition_escalation_consistency CHECK (
    (disposition = 'escalated' AND escalation_status IN (
      'pending', 'reviewed', 'resolved'
    ))
    OR (disposition = 'allowed' AND escalation_status = 'not_required')
    OR (disposition = 'warned' AND escalation_status IN (
      'not_required', 'pending', 'reviewed', 'resolved'
    ))
    OR (disposition = 'blocked' AND escalation_status IN (
      'pending', 'reviewed', 'resolved'
    ))
  ),
  CONSTRAINT ai_safety_events_resolution_consistency CHECK (
    (
      escalation_status <> 'resolved'
      AND resolved_by_user_id IS NULL
      AND resolved_by_subject IS NULL
      AND resolution_notes IS NULL
      AND resolved_at IS NULL
    )
    OR (
      escalation_status = 'resolved'
      AND resolved_by_user_id IS NOT NULL
      AND resolved_by_subject IS NOT NULL
      AND length(trim(resolved_by_subject)) > 0
      AND nullif(trim(resolution_notes), '') IS NOT NULL
      AND resolved_at IS NOT NULL
    )
  )
);

COMMENT ON TABLE public.ai_safety_events IS
  'Minimal safety, truthfulness, blocking, and escalation records with validated request/generation relationships.';

CREATE TABLE public.ai_usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  request_id uuid NOT NULL
    REFERENCES public.ai_requests(id) ON DELETE RESTRICT,
  generation_id uuid
    REFERENCES public.ai_generations(id) ON DELETE RESTRICT,
  business_id uuid NOT NULL
    REFERENCES public.business_profiles(id) ON DELETE RESTRICT,

  provider text NOT NULL DEFAULT 'openai'
    CHECK (provider = 'openai'),
  model text NOT NULL
    CHECK (model IN ('gpt-5.6-luna', 'gpt-5.6-terra')),
  service_tier text NOT NULL,
  pricing_version text NOT NULL,

  cost_state text NOT NULL CHECK (cost_state IN (
    'estimated',
    'reconciled',
    'corrected'
  )),

  input_units bigint NOT NULL DEFAULT 0 CHECK (input_units >= 0),
  output_units bigint NOT NULL DEFAULT 0 CHECK (output_units >= 0),
  cost_usd numeric(12,6) NOT NULL DEFAULT 0 CHECK (cost_usd >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  provider_billable boolean NOT NULL DEFAULT false,

  correction_of_ledger_id uuid
    REFERENCES public.ai_usage_ledger(id) ON DELETE RESTRICT,

  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_usage_ledger_nonblank_policy CHECK (
    length(trim(service_tier)) > 0
    AND length(trim(pricing_version)) > 0
  ),
  CONSTRAINT ai_usage_ledger_correction_consistency CHECK (
    (
      cost_state <> 'corrected'
      AND correction_of_ledger_id IS NULL
    )
    OR (
      cost_state = 'corrected'
      AND correction_of_ledger_id IS NOT NULL
    )
  )
);

COMMENT ON TABLE public.ai_usage_ledger IS
  'Append-only usage and estimated/reconciled/corrected cost accounting.';

CREATE TABLE public.ai_retention_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  request_id uuid NOT NULL
    REFERENCES public.ai_requests(id) ON DELETE RESTRICT,

  target_type text NOT NULL CHECK (target_type IN (
    'preview_content',
    'request_metadata',
    'user_decision',
    'admin_approval',
    'safety_event',
    'usage_ledger',
    'legal_hold'
  )),

  generation_id uuid
    REFERENCES public.ai_generations(id) ON DELETE RESTRICT,
  user_decision_id uuid
    REFERENCES public.ai_user_decisions(id) ON DELETE RESTRICT,
  approval_id uuid
    REFERENCES public.ai_approvals(id) ON DELETE RESTRICT,
  safety_event_id uuid
    REFERENCES public.ai_safety_events(id) ON DELETE RESTRICT,
  usage_ledger_id uuid
    REFERENCES public.ai_usage_ledger(id) ON DELETE RESTRICT,

  retention_class text NOT NULL CHECK (retention_class IN (
    'failed_or_abandoned_30d',
    'unsaved_success_90d',
    'saved_draft_180d',
    'request_metadata_1y',
    'governance_decision_1y',
    'safety_after_resolution_1y',
    'usage_ledger_2y',
    'legal_hold'
  )),

  retain_until timestamptz,
  deletion_status text NOT NULL DEFAULT 'active' CHECK (
    deletion_status IN (
      'active',
      'eligible',
      'queued',
      'content_redacted',
      'deleted',
      'restricted',
      'held',
      'failed'
    )
  ),

  provider_retention_status text NOT NULL DEFAULT 'unknown',
  source_deletion_state text NOT NULL DEFAULT 'present' CHECK (
    source_deletion_state IN (
      'present',
      'stale',
      'partially_deleted',
      'deleted',
      'restricted',
      'legally_retained',
      'unknown'
    )
  ),

  legal_hold boolean NOT NULL DEFAULT false,
  legal_hold_reason text,

  changed_by_user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE RESTRICT,
  changed_by_subject text NOT NULL,

  last_checked_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_retention_records_target_shape CHECK (
    (target_type = 'preview_content'
      AND user_decision_id IS NULL
      AND approval_id IS NULL
      AND safety_event_id IS NULL
      AND usage_ledger_id IS NULL
      AND (
        generation_id IS NULL
        OR generation_id IS NOT NULL
      ))
    OR (target_type = 'request_metadata'
      AND num_nonnulls(
        generation_id, user_decision_id, approval_id,
        safety_event_id, usage_ledger_id
      ) = 0)
    OR (target_type = 'user_decision'
      AND user_decision_id IS NOT NULL
      AND num_nonnulls(
        generation_id, approval_id, safety_event_id, usage_ledger_id
      ) = 0)
    OR (target_type = 'admin_approval'
      AND approval_id IS NOT NULL
      AND num_nonnulls(
        generation_id, user_decision_id, safety_event_id, usage_ledger_id
      ) = 0)
    OR (target_type = 'safety_event'
      AND safety_event_id IS NOT NULL
      AND num_nonnulls(
        generation_id, user_decision_id, approval_id, usage_ledger_id
      ) = 0)
    OR (target_type = 'usage_ledger'
      AND usage_ledger_id IS NOT NULL
      AND num_nonnulls(
        generation_id, user_decision_id, approval_id, safety_event_id
      ) = 0)
    OR (target_type = 'legal_hold'
      AND num_nonnulls(
        generation_id, user_decision_id, approval_id,
        safety_event_id, usage_ledger_id
      ) = 0)
  ),


  CONSTRAINT ai_retention_records_type_class_compatibility CHECK (
    (target_type = 'preview_content'
      AND retention_class IN (
        'failed_or_abandoned_30d',
        'unsaved_success_90d',
        'saved_draft_180d'
      ))
    OR (target_type = 'request_metadata'
      AND retention_class = 'request_metadata_1y')
    OR (target_type = 'user_decision'
      AND retention_class = 'governance_decision_1y')
    OR (target_type = 'admin_approval'
      AND retention_class = 'governance_decision_1y')
    OR (target_type = 'safety_event'
      AND retention_class = 'safety_after_resolution_1y')
    OR (target_type = 'usage_ledger'
      AND retention_class = 'usage_ledger_2y')
    OR (target_type = 'legal_hold'
      AND retention_class = 'legal_hold')
  ),

  CONSTRAINT ai_retention_records_hold_consistency CHECK (
    (
      legal_hold = false
      AND legal_hold_reason IS NULL
      AND target_type <> 'legal_hold'
    )
    OR (
      legal_hold = true
      AND target_type = 'legal_hold'
      AND retention_class = 'legal_hold'
      AND length(trim(legal_hold_reason)) > 0
    )
  ),

  CONSTRAINT ai_retention_records_time_consistency CHECK (
    retain_until IS NULL OR retain_until >= created_at
  ),

  CONSTRAINT ai_retention_records_changed_subject_nonblank
    CHECK (length(trim(changed_by_subject)) > 0)
);

CREATE UNIQUE INDEX ai_retention_request_metadata_unique_idx
  ON public.ai_retention_records(request_id)
  WHERE target_type = 'request_metadata';

CREATE UNIQUE INDEX ai_retention_preview_generation_unique_idx
  ON public.ai_retention_records(request_id, generation_id)
  WHERE target_type = 'preview_content' AND generation_id IS NOT NULL;

CREATE UNIQUE INDEX ai_retention_preview_request_unique_idx
  ON public.ai_retention_records(request_id)
  WHERE target_type = 'preview_content' AND generation_id IS NULL;

CREATE UNIQUE INDEX ai_retention_user_decision_unique_idx
  ON public.ai_retention_records(user_decision_id)
  WHERE target_type = 'user_decision';

CREATE UNIQUE INDEX ai_retention_admin_approval_unique_idx
  ON public.ai_retention_records(approval_id)
  WHERE target_type = 'admin_approval';

CREATE UNIQUE INDEX ai_retention_safety_event_unique_idx
  ON public.ai_retention_records(safety_event_id)
  WHERE target_type = 'safety_event';

CREATE UNIQUE INDEX ai_retention_usage_ledger_unique_idx
  ON public.ai_retention_records(usage_ledger_id)
  WHERE target_type = 'usage_ledger';

CREATE UNIQUE INDEX ai_retention_legal_hold_unique_idx
  ON public.ai_retention_records(request_id)
  WHERE target_type = 'legal_hold' AND legal_hold = true;

COMMENT ON TABLE public.ai_retention_records IS
  'Target-scoped retention records supporting simultaneous deadlines for preview content, request metadata, decisions, approvals, safety, usage, and legal holds.';

-- --------------------------------------------------------------------------
-- 2. INDEXES
-- --------------------------------------------------------------------------

CREATE INDEX ai_requests_business_created_idx
  ON public.ai_requests(business_id, created_at DESC);

CREATE INDEX ai_requests_actor_created_idx
  ON public.ai_requests(actor_subject, created_at DESC);

CREATE INDEX ai_requests_status_created_idx
  ON public.ai_requests(status, created_at DESC);

CREATE INDEX ai_requests_pilot_idx
  ON public.ai_requests(pilot_id)
  WHERE pilot_id IS NOT NULL;

CREATE INDEX ai_requests_idempotency_expiry_idx
  ON public.ai_requests(idempotency_expires_at);

CREATE INDEX ai_request_sources_request_kind_idx
  ON public.ai_request_sources(request_id, source_kind);

CREATE UNIQUE INDEX ai_request_sources_live_campaign_unique_idx
  ON public.ai_request_sources(request_id, campaign_id)
  WHERE campaign_id IS NOT NULL AND source_state <> 'deleted';

CREATE UNIQUE INDEX ai_request_sources_live_offer_unique_idx
  ON public.ai_request_sources(request_id, offer_id)
  WHERE offer_id IS NOT NULL AND source_state <> 'deleted';

CREATE UNIQUE INDEX ai_request_sources_live_creative_unique_idx
  ON public.ai_request_sources(request_id, creative_id)
  WHERE creative_id IS NOT NULL AND source_state <> 'deleted';

CREATE UNIQUE INDEX ai_request_sources_live_document_unique_idx
  ON public.ai_request_sources(request_id, partner_document_id)
  WHERE partner_document_id IS NOT NULL AND source_state <> 'deleted';

CREATE UNIQUE INDEX ai_request_sources_live_report_unique_idx
  ON public.ai_request_sources(request_id, campaign_report_id)
  WHERE campaign_report_id IS NOT NULL AND source_state <> 'deleted';

CREATE INDEX ai_request_sources_state_idx
  ON public.ai_request_sources(source_state, created_at DESC);

CREATE INDEX ai_generations_request_version_idx
  ON public.ai_generations(request_id, version_number DESC);

CREATE INDEX ai_generations_status_created_idx
  ON public.ai_generations(status, created_at DESC);

CREATE INDEX ai_user_decisions_generation_idx
  ON public.ai_user_decisions(generation_id, decision_sequence DESC);

CREATE INDEX ai_user_decisions_actor_created_idx
  ON public.ai_user_decisions(actor_subject, created_at DESC);

CREATE INDEX ai_approvals_reviewer_created_idx
  ON public.ai_approvals(reviewer_subject, created_at DESC);

CREATE INDEX ai_safety_events_request_created_idx
  ON public.ai_safety_events(request_id, created_at DESC);

CREATE INDEX ai_safety_events_pending_idx
  ON public.ai_safety_events(escalation_status, severity, created_at DESC)
  WHERE escalation_status IN ('pending', 'reviewed');

CREATE INDEX ai_usage_ledger_business_time_idx
  ON public.ai_usage_ledger(business_id, occurred_at DESC);

CREATE INDEX ai_usage_ledger_request_time_idx
  ON public.ai_usage_ledger(request_id, occurred_at DESC);

CREATE INDEX ai_usage_ledger_generation_idx
  ON public.ai_usage_ledger(generation_id)
  WHERE generation_id IS NOT NULL;

CREATE INDEX ai_retention_due_idx
  ON public.ai_retention_records(deletion_status, retain_until)
  WHERE legal_hold = false;

-- --------------------------------------------------------------------------
-- 3. ACCESS HELPERS
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_access_business_ai(
  target_business_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR (
        public.has_role(auth.uid(), 'business'::public.app_role)
        AND EXISTS (
          SELECT 1
          FROM public.business_profiles b
          WHERE b.id = target_business_id
            AND b.owner_user_id = auth.uid()
        )
      )
    );
$$;

COMMENT ON FUNCTION public.can_access_business_ai(uuid) IS
  'Uses auth.uid(), business ownership, the business role, and administrator override through has_role.';

REVOKE ALL ON FUNCTION public.can_access_business_ai(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_business_ai(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_access_business_ai(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_business_ai(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.can_read_ai_request(
  target_request_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ai_requests r
    WHERE r.id = target_request_id
      AND public.can_access_business_ai(r.business_id)
      AND (
        r.pilot_context_used = false
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_ai_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_read_ai_request(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_read_ai_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_ai_request(uuid) TO service_role;

-- --------------------------------------------------------------------------
-- 4. REQUEST VALIDATION AND STATUS PROTECTION
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_ai_request_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pilot_business_id uuid;
BEGIN
  IF NEW.actor_user_id IS NULL
     OR NEW.actor_subject <> NEW.actor_user_id::text THEN
    RAISE EXCEPTION 'Request actor subject must match the verified actor UUID';
  END IF;

  IF NEW.actor_role = 'business' THEN
    IF NEW.actor_user_id IS NULL THEN
      RAISE EXCEPTION 'Business AI request requires an authenticated actor';
    END IF;

    IF NOT public.has_role(NEW.actor_user_id, 'business'::public.app_role) THEN
      RAISE EXCEPTION 'AI request actor does not have the business role';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.business_profiles b
      WHERE b.id = NEW.business_id
        AND b.owner_user_id = NEW.actor_user_id
    ) THEN
      RAISE EXCEPTION 'AI request actor does not own the target business';
    END IF;

    IF NEW.pilot_id IS NOT NULL OR NEW.pilot_context_used = true THEN
      RAISE EXCEPTION 'Pilot context is administrator-only';
    END IF;
  END IF;

  IF NEW.actor_role = 'admin' THEN
    IF NEW.actor_user_id IS NULL
       OR NOT public.has_role(
         NEW.actor_user_id,
         'admin'::public.app_role
       ) THEN
      RAISE EXCEPTION 'AI request actor is not an administrator';
    END IF;
  END IF;

  IF NEW.pilot_id IS NOT NULL THEN
    SELECT p.business_id
    INTO pilot_business_id
    FROM public.business_pilot_records p
    WHERE p.id = NEW.pilot_id;

    IF pilot_business_id IS NULL
       OR pilot_business_id <> NEW.business_id THEN
      RAISE EXCEPTION 'Pilot record does not belong to the AI request business';
    END IF;

    NEW.pilot_context_used := true;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_ai_request_context() FROM PUBLIC;

CREATE TRIGGER ai_requests_validate_context_bi
  BEFORE INSERT
  ON public.ai_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_request_context();

CREATE OR REPLACE FUNCTION public.restrict_ai_request_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Permit only FK-driven pilot deletion, status/lifecycle changes,
  -- and retention-safe redaction of request_payload.
  IF OLD.pilot_id IS NOT NULL
     AND NEW.pilot_id IS NULL
     AND OLD.pilot_context_used = true
     AND NEW.pilot_context_used = true THEN
    NULL;
  ELSIF NEW.pilot_id IS DISTINCT FROM OLD.pilot_id
        OR NEW.pilot_context_used IS DISTINCT FROM OLD.pilot_context_used THEN
    RAISE EXCEPTION 'Pilot context fields are immutable except for FK-driven deletion';
  END IF;

  IF NEW.actor_user_id IS DISTINCT FROM OLD.actor_user_id
     AND NOT (OLD.actor_user_id IS NOT NULL AND NEW.actor_user_id IS NULL) THEN
    RAISE EXCEPTION 'Actor user ID is immutable except for account deletion';
  END IF;

  IF NEW.actor_subject IS DISTINCT FROM OLD.actor_subject
     OR NEW.actor_role IS DISTINCT FROM OLD.actor_role
     OR NEW.business_id IS DISTINCT FROM OLD.business_id
     OR NEW.purpose IS DISTINCT FROM OLD.purpose
     OR NEW.input_hash IS DISTINCT FROM OLD.input_hash
     OR NEW.authorization_context IS DISTINCT FROM OLD.authorization_context
     OR NEW.policy_version IS DISTINCT FROM OLD.policy_version
     OR NEW.policy_snapshot IS DISTINCT FROM OLD.policy_snapshot
     OR NEW.default_model IS DISTINCT FROM OLD.default_model
     OR NEW.default_reasoning_effort IS DISTINCT FROM OLD.default_reasoning_effort
     OR NEW.max_input_tokens IS DISTINCT FROM OLD.max_input_tokens
     OR NEW.max_luna_output_tokens IS DISTINCT FROM OLD.max_luna_output_tokens
     OR NEW.max_terra_output_tokens IS DISTINCT FROM OLD.max_terra_output_tokens
     OR NEW.max_generations IS DISTINCT FROM OLD.max_generations
     OR NEW.max_estimated_cost_usd IS DISTINCT FROM OLD.max_estimated_cost_usd
     OR NEW.emergency_stop_cost_usd IS DISTINCT FROM OLD.emergency_stop_cost_usd
     OR NEW.invocation_idempotency_namespace IS DISTINCT FROM OLD.invocation_idempotency_namespace
     OR NEW.invocation_idempotency_key IS DISTINCT FROM OLD.invocation_idempotency_key
     OR NEW.invocation_idempotency_scope IS DISTINCT FROM OLD.invocation_idempotency_scope
     OR NEW.idempotency_expires_at IS DISTINCT FROM OLD.idempotency_expires_at
     OR NEW.requested_at IS DISTINCT FROM OLD.requested_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'AI request authorization, policy, input, and idempotency fields are immutable';
  END IF;

  IF NEW.request_payload IS DISTINCT FROM OLD.request_payload THEN
    IF NEW.request_payload <> '{}'::jsonb THEN
      RAISE EXCEPTION 'Request payload may only be redacted to an empty object';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.restrict_ai_request_update() FROM PUBLIC;

CREATE TRIGGER ai_requests_restrict_update_bu
  BEFORE UPDATE
  ON public.ai_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_ai_request_update();

CREATE OR REPLACE FUNCTION public.enforce_ai_request_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'queued'
      AND NEW.status IN ('running', 'blocked', 'cancelled', 'expired'))
    OR
    (OLD.status = 'running'
      AND NEW.status IN (
        'completed',
        'failed',
        'blocked',
        'cancelled',
        'expired'
      ))
    OR
    (OLD.status = 'completed' AND NEW.status = 'expired')
  ) THEN
    RAISE EXCEPTION
      'Invalid AI request status transition: % -> %',
      OLD.status,
      NEW.status;
  END IF;

  IF NEW.status = 'running' AND NEW.started_at IS NULL THEN
    NEW.started_at := now();
  END IF;

  IF NEW.status IN (
    'completed',
    'failed',
    'blocked',
    'cancelled',
    'expired'
  ) AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_ai_request_status_transition() FROM PUBLIC;

CREATE TRIGGER ai_requests_status_transition_bu
  BEFORE UPDATE OF status
  ON public.ai_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_ai_request_status_transition();

-- --------------------------------------------------------------------------
-- 5. SOURCE TOMBSTONES AND VALIDATION
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mark_ai_request_source_deleted()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF num_nonnulls(
       OLD.campaign_id,
       OLD.offer_id,
       OLD.creative_id,
       OLD.partner_document_id,
       OLD.campaign_report_id
     ) = 1
     AND num_nonnulls(
       NEW.campaign_id,
       NEW.offer_id,
       NEW.creative_id,
       NEW.partner_document_id,
       NEW.campaign_report_id
     ) = 0 THEN
    NEW.source_state := 'deleted';
    NEW.source_deleted_at := now();
    RETURN NEW;
  END IF;

  IF NEW.source_record_id IS DISTINCT FROM OLD.source_record_id THEN
    RAISE EXCEPTION 'Source tombstone identity is immutable';
  END IF;

  IF NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'AI request source rows are immutable except for FK-driven deletion';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_ai_request_source_deleted() FROM PUBLIC;

CREATE TRIGGER ai_request_sources_a_tombstone_bu
  BEFORE UPDATE
  ON public.ai_request_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_ai_request_source_deleted();

CREATE OR REPLACE FUNCTION public.validate_ai_request_source()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_business_id uuid;
  request_actor_role public.app_role;
  request_purpose text;
  source_business_id uuid;
  source_visibility text;
  report_released_at timestamptz;
BEGIN
  IF NEW.source_state = 'deleted' THEN
    RETURN NEW;
  END IF;

  SELECT
    r.business_id,
    r.actor_role,
    r.purpose
  INTO
    request_business_id,
    request_actor_role,
    request_purpose
  FROM public.ai_requests r
  WHERE r.id = NEW.request_id;

  IF request_business_id IS NULL THEN
    RAISE EXCEPTION 'AI request not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.ai_generations g
    WHERE g.request_id = NEW.request_id
  ) OR EXISTS (
    SELECT 1
    FROM public.ai_requests r
    WHERE r.id = NEW.request_id
      AND r.status <> 'queued'
  ) THEN
    RAISE EXCEPTION
      'AI request sources are frozen after generation begins';
  END IF;

  IF NEW.added_by_user_id IS NULL
     OR NEW.added_by_subject <> NEW.added_by_user_id::text THEN
    RAISE EXCEPTION
      'Source actor subject must match the verified actor UUID';
  END IF;

  CASE NEW.source_kind
    WHEN 'campaign' THEN
      SELECT c.business_id, c.updated_at
      INTO source_business_id, NEW.source_updated_at
      FROM public.business_campaigns c
      WHERE c.id = NEW.campaign_id;
      NEW.source_record_id := NEW.campaign_id;

    WHEN 'offer' THEN
      SELECT o.business_id, o.updated_at
      INTO source_business_id, NEW.source_updated_at
      FROM public.business_offers o
      WHERE o.id = NEW.offer_id;
      NEW.source_record_id := NEW.offer_id;

    WHEN 'creative' THEN
      SELECT c.business_id, cr.updated_at
      INTO source_business_id, NEW.source_updated_at
      FROM public.business_campaign_creatives cr
      JOIN public.business_campaigns c
        ON c.id = cr.campaign_id
      WHERE cr.id = NEW.creative_id;
      NEW.source_record_id := NEW.creative_id;

    WHEN 'partner_document' THEN
      SELECT d.business_id, d.updated_at, d.visibility
      INTO
        source_business_id,
        NEW.source_updated_at,
        source_visibility
      FROM public.business_partner_documents d
      WHERE d.id = NEW.partner_document_id;
      NEW.source_record_id := NEW.partner_document_id;

      IF request_actor_role = 'business'
         AND source_visibility IS DISTINCT FROM 'partner' THEN
        RAISE EXCEPTION
          'Business callers may use only partner-visible documents';
      END IF;

    WHEN 'campaign_report' THEN
      SELECT
        rp.business_id,
        rp.created_at,
        rp.released_at,
        rp.status
      INTO
        source_business_id,
        NEW.source_updated_at,
        report_released_at,
        source_visibility
      FROM public.business_campaign_reports rp
      JOIN public.business_campaigns c
        ON c.id = rp.campaign_id
       AND c.business_id = rp.business_id
      WHERE rp.id = NEW.campaign_report_id;
      NEW.source_record_id := NEW.campaign_report_id;

      IF request_actor_role = 'business'
         AND (
           source_visibility IS DISTINCT FROM 'released'
           OR report_released_at IS NULL
         ) THEN
        RAISE EXCEPTION
          'Business callers may use only currently released campaign reports';
      END IF;

      IF request_purpose <> 'analytics_explanation' THEN
        RAISE EXCEPTION
          'Campaign reports are permitted only for analytics explanations';
      END IF;

    ELSE
      RAISE EXCEPTION 'Unsupported AI source kind';
  END CASE;

  IF source_business_id IS NULL
     OR source_business_id <> request_business_id THEN
    RAISE EXCEPTION
      'AI source does not belong to the request business';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_ai_request_source() FROM PUBLIC;

CREATE TRIGGER ai_request_sources_b_validate_bi
  BEFORE INSERT
  ON public.ai_request_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_request_source();

CREATE TRIGGER ai_request_sources_b_validate_bu
  BEFORE UPDATE
  ON public.ai_request_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_request_source();

-- --------------------------------------------------------------------------
-- 6. ATOMIC VERSION AND DECISION SEQUENCE ALLOCATION
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.allocate_ai_generation_version(
  target_request_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_version integer;
  allowed_max integer;
BEGIN
  SELECT r.max_generations
  INTO allowed_max
  FROM public.ai_requests r
  WHERE r.id = target_request_id;

  IF allowed_max IS NULL THEN
    RAISE EXCEPTION 'AI request not found';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(target_request_id::text, 0)
  );

  SELECT COALESCE(MAX(g.version_number), 0) + 1
  INTO next_version
  FROM public.ai_generations g
  WHERE g.request_id = target_request_id;

  IF next_version > allowed_max THEN
    RAISE EXCEPTION 'Maximum generations per request exceeded';
  END IF;

  RETURN next_version;
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_ai_generation_version(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.allocate_ai_generation_version(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.allocate_ai_generation_version(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_ai_generation_version(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.allocate_ai_user_decision_sequence(
  target_generation_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_sequence integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.ai_generations g
    WHERE g.id = target_generation_id
  ) THEN
    RAISE EXCEPTION 'AI generation not found';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(target_generation_id::text, 1)
  );

  SELECT COALESCE(MAX(d.decision_sequence), 0) + 1
  INTO next_sequence
  FROM public.ai_user_decisions d
  WHERE d.generation_id = target_generation_id;

  RETURN next_sequence;
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_ai_user_decision_sequence(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.allocate_ai_user_decision_sequence(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.allocate_ai_user_decision_sequence(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_ai_user_decision_sequence(uuid) TO service_role;


CREATE OR REPLACE FUNCTION public.assign_ai_generation_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.version_number :=
    public.allocate_ai_generation_version(NEW.request_id);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_ai_generation_version() FROM PUBLIC;

CREATE TRIGGER ai_generations_assign_version_bi
  BEFORE INSERT
  ON public.ai_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_ai_generation_version();

CREATE OR REPLACE FUNCTION public.assign_ai_user_decision_sequence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.decision_sequence :=
    public.allocate_ai_user_decision_sequence(NEW.generation_id);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_ai_user_decision_sequence() FROM PUBLIC;

CREATE TRIGGER ai_user_decisions_assign_sequence_bi
  BEFORE INSERT
  ON public.ai_user_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_ai_user_decision_sequence();

-- --------------------------------------------------------------------------
-- 7. GENERATION, DECISION, APPROVAL, SAFETY, USAGE, RETENTION VALIDATION
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_ai_generation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_row public.ai_requests%ROWTYPE;
BEGIN
  SELECT *
  INTO request_row
  FROM public.ai_requests r
  WHERE r.id = NEW.request_id;

  IF request_row.id IS NULL THEN
    RAISE EXCEPTION 'AI request not found';
  END IF;

  IF request_row.status NOT IN ('running', 'completed') THEN
    RAISE EXCEPTION 'AI request is not eligible for a generation';
  END IF;

  IF NEW.input_hash <> request_row.input_hash THEN
    RAISE EXCEPTION 'Generation input hash does not match request input hash';
  END IF;

  IF NEW.policy_version <> request_row.policy_version THEN
    RAISE EXCEPTION 'Generation policy version does not match request policy';
  END IF;

  IF NEW.input_tokens > request_row.max_input_tokens THEN
    RAISE EXCEPTION 'Generation input exceeds request token limit';
  END IF;

  IF NEW.model = 'gpt-5.6-luna'
     AND NEW.output_tokens > request_row.max_luna_output_tokens THEN
    RAISE EXCEPTION 'Luna output exceeds request token limit';
  END IF;

  IF NEW.model = 'gpt-5.6-terra' THEN
    IF NEW.policy_escalation_approved = false THEN
      RAISE EXCEPTION 'Terra requires controlled policy escalation';
    END IF;

    IF NEW.output_tokens > request_row.max_terra_output_tokens THEN
      RAISE EXCEPTION 'Terra output exceeds request token limit';
    END IF;
  END IF;

  IF NEW.estimated_cost_usd > request_row.emergency_stop_cost_usd THEN
    RAISE EXCEPTION 'Generation exceeds emergency cost stop';
  END IF;

  IF NEW.status = 'completed'
     AND NEW.estimated_cost_usd > request_row.max_estimated_cost_usd THEN
    RAISE EXCEPTION 'Completed generation exceeds normal invocation ceiling';
  END IF;

  IF NEW.version_number > request_row.max_generations THEN
    RAISE EXCEPTION 'Generation version exceeds request maximum';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_ai_generation() FROM PUBLIC;

CREATE TRIGGER ai_generations_validate_bi
  BEFORE INSERT
  ON public.ai_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_generation();

CREATE OR REPLACE FUNCTION public.validate_ai_user_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_row public.ai_requests%ROWTYPE;
  generation_status text;
  target_business_id uuid;
BEGIN
  SELECT r.*
  INTO request_row
  FROM public.ai_generations g
  JOIN public.ai_requests r
    ON r.id = g.request_id
  WHERE g.id = NEW.generation_id;

  SELECT g.status
  INTO generation_status
  FROM public.ai_generations g
  WHERE g.id = NEW.generation_id;

  IF request_row.id IS NULL THEN
    RAISE EXCEPTION 'AI generation not found';
  END IF;

  IF request_row.pilot_context_used = true THEN
    RAISE EXCEPTION
      'Business decisions cannot be recorded for pilot-context requests';
  END IF;

  IF NEW.actor_user_id IS NULL
     OR NEW.actor_subject <> NEW.actor_user_id::text
     OR NOT public.has_role(
       NEW.actor_user_id,
       'business'::public.app_role
     )
     OR NOT EXISTS (
       SELECT 1
       FROM public.business_profiles b
       WHERE b.id = request_row.business_id
         AND b.owner_user_id = NEW.actor_user_id
     ) THEN
    RAISE EXCEPTION 'Decision actor is not the authorized business owner';
  END IF;

  IF request_row.status <> 'completed'
     OR generation_status <> 'completed'
     OR (
       request_row.expires_at IS NOT NULL
       AND request_row.expires_at <= now()
     ) THEN
    RAISE EXCEPTION 'Generation is not eligible for a business decision';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.ai_safety_events s
    WHERE s.request_id = request_row.id
      AND (
        s.generation_id IS NULL
        OR s.generation_id = NEW.generation_id
      )
      AND s.disposition = 'blocked'
  ) THEN
    RAISE EXCEPTION 'Blocked generation is not eligible for a business decision';
  END IF;

  IF NEW.decision = 'saved_as_draft' THEN
    RAISE EXCEPTION
      'Draft saving is prohibited by V24.25 database policy';
  END IF;

  IF NEW.saved_campaign_id IS NOT NULL THEN
    SELECT c.business_id
    INTO target_business_id
    FROM public.business_campaigns c
    WHERE c.id = NEW.saved_campaign_id
      AND c.status = 'draft';

  ELSIF NEW.saved_offer_id IS NOT NULL THEN
    SELECT o.business_id
    INTO target_business_id
    FROM public.business_offers o
    WHERE o.id = NEW.saved_offer_id
      AND o.status = 'draft';

  ELSIF NEW.saved_creative_id IS NOT NULL THEN
    SELECT c.business_id
    INTO target_business_id
    FROM public.business_campaign_creatives cr
    JOIN public.business_campaigns c
      ON c.id = cr.campaign_id
    WHERE cr.id = NEW.saved_creative_id
      AND cr.status = 'draft';
  END IF;

  IF NEW.decision = 'saved_as_draft' THEN
    IF target_business_id IS NULL
       OR target_business_id <> request_row.business_id THEN
      RAISE EXCEPTION
        'Saved draft target is invalid or belongs to another business';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_ai_user_decision() FROM PUBLIC;

CREATE TRIGGER ai_user_decisions_validate_bi
  BEFORE INSERT
  ON public.ai_user_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_user_decision();

CREATE OR REPLACE FUNCTION public.validate_ai_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id_value uuid;
  request_status text;
  request_expires_at timestamptz;
  generation_status text;
BEGIN
  IF NEW.reviewer_user_id IS NULL
     OR NEW.reviewer_subject <> NEW.reviewer_user_id::text
     OR NOT public.has_role(
       NEW.reviewer_user_id,
       'admin'::public.app_role
     ) THEN
    RAISE EXCEPTION 'AI governance approval requires an administrator';
  END IF;

  SELECT
    g.request_id,
    r.status,
    r.expires_at,
    g.status
  INTO
    request_id_value,
    request_status,
    request_expires_at,
    generation_status
  FROM public.ai_generations g
  JOIN public.ai_requests r
    ON r.id = g.request_id
  WHERE g.id = NEW.generation_id;

  IF request_id_value IS NULL THEN
    RAISE EXCEPTION 'AI generation not found';
  END IF;

  IF NEW.decision = 'approved' THEN
    IF request_status <> 'completed'
       OR generation_status <> 'completed'
       OR (
         request_expires_at IS NOT NULL
         AND request_expires_at <= now()
       ) THEN
      RAISE EXCEPTION 'Generation is not eligible for governance approval';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.ai_safety_events s
      WHERE s.request_id = request_id_value
        AND (
          s.generation_id IS NULL
          OR s.generation_id = NEW.generation_id
        )
        AND s.disposition = 'blocked'
    ) THEN
      RAISE EXCEPTION 'Blocked generation cannot be approved';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_ai_approval() FROM PUBLIC;

CREATE TRIGGER ai_approvals_validate_bi
  BEFORE INSERT
  ON public.ai_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_approval();

CREATE OR REPLACE FUNCTION public.validate_ai_safety_relationship()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.recorded_by_subject <> NEW.recorded_by_user_id::text THEN
    RAISE EXCEPTION
      'Safety recorder subject must match the verified recorder UUID';
  END IF;

  IF NEW.disposition IN ('escalated', 'blocked')
     AND NEW.escalation_status <> 'pending' THEN
    RAISE EXCEPTION
      'Escalated and blocked safety events must begin pending review';
  END IF;

  IF NEW.generation_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.ai_generations g
       WHERE g.id = NEW.generation_id
         AND g.request_id = NEW.request_id
     ) THEN
    RAISE EXCEPTION
      'Safety event generation does not belong to the request';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_ai_safety_relationship() FROM PUBLIC;

CREATE TRIGGER ai_safety_events_validate_bi
  BEFORE INSERT
  ON public.ai_safety_events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_safety_relationship();

CREATE OR REPLACE FUNCTION public.validate_ai_usage_relationship()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.ai_requests r
    WHERE r.id = NEW.request_id
      AND r.business_id = NEW.business_id
  ) THEN
    RAISE EXCEPTION 'Usage business does not match the request';
  END IF;

  IF NEW.generation_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.ai_generations g
       WHERE g.id = NEW.generation_id
         AND g.request_id = NEW.request_id
         AND g.provider = NEW.provider
         AND g.model = NEW.model
         AND g.service_tier = NEW.service_tier
         AND g.pricing_version = NEW.pricing_version
     ) THEN
    RAISE EXCEPTION
      'Usage generation, provider, model, tier, or pricing version does not match';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_ai_usage_relationship() FROM PUBLIC;

CREATE TRIGGER ai_usage_ledger_validate_bi
  BEFORE INSERT
  ON public.ai_usage_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_usage_relationship();

CREATE OR REPLACE FUNCTION public.validate_ai_retention_relationship()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  related_request_id uuid;
BEGIN
  IF NEW.changed_by_subject <> NEW.changed_by_user_id::text
     OR NOT public.has_role(
       NEW.changed_by_user_id,
       'admin'::public.app_role
     ) THEN
    RAISE EXCEPTION
      'Retention changes require a verified administrator identity';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.ai_requests r
    WHERE r.id = NEW.request_id
  ) THEN
    RAISE EXCEPTION 'Retention request does not exist';
  END IF;

  IF NEW.generation_id IS NOT NULL THEN
    SELECT g.request_id INTO related_request_id
    FROM public.ai_generations g
    WHERE g.id = NEW.generation_id;
  ELSIF NEW.user_decision_id IS NOT NULL THEN
    SELECT g.request_id INTO related_request_id
    FROM public.ai_user_decisions d
    JOIN public.ai_generations g ON g.id = d.generation_id
    WHERE d.id = NEW.user_decision_id;
  ELSIF NEW.approval_id IS NOT NULL THEN
    SELECT g.request_id INTO related_request_id
    FROM public.ai_approvals a
    JOIN public.ai_generations g ON g.id = a.generation_id
    WHERE a.id = NEW.approval_id;
  ELSIF NEW.safety_event_id IS NOT NULL THEN
    SELECT s.request_id INTO related_request_id
    FROM public.ai_safety_events s
    WHERE s.id = NEW.safety_event_id;
  ELSIF NEW.usage_ledger_id IS NOT NULL THEN
    SELECT u.request_id INTO related_request_id
    FROM public.ai_usage_ledger u
    WHERE u.id = NEW.usage_ledger_id;
  ELSE
    related_request_id := NEW.request_id;
  END IF;

  IF related_request_id IS DISTINCT FROM NEW.request_id THEN
    RAISE EXCEPTION
      'Retention target does not belong to the request';
  END IF;

  IF NEW.legal_hold = true THEN
    NEW.deletion_status := 'held';
    NEW.retain_until := NULL;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_ai_retention_relationship() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.restrict_ai_retention_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_rank integer;
  new_rank integer;
BEGIN
  IF NEW.changed_by_subject <> NEW.changed_by_user_id::text
     OR NOT public.has_role(
       NEW.changed_by_user_id,
       'admin'::public.app_role
     ) THEN
    RAISE EXCEPTION
      'Retention updates require a verified administrator identity';
  END IF;

  IF NEW.request_id IS DISTINCT FROM OLD.request_id
     OR NEW.target_type IS DISTINCT FROM OLD.target_type
     OR NEW.generation_id IS DISTINCT FROM OLD.generation_id
     OR NEW.user_decision_id IS DISTINCT FROM OLD.user_decision_id
     OR NEW.approval_id IS DISTINCT FROM OLD.approval_id
     OR NEW.safety_event_id IS DISTINCT FROM OLD.safety_event_id
     OR NEW.usage_ledger_id IS DISTINCT FROM OLD.usage_ledger_id
     OR NEW.retention_class IS DISTINCT FROM OLD.retention_class
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION
      'Retention target and class are immutable';
  END IF;

  IF OLD.legal_hold = true AND NEW.legal_hold = false THEN
    RAISE EXCEPTION
      'Legal holds cannot be removed without a separately approved audited release workflow';
  END IF;

  IF NEW.legal_hold = true AND OLD.legal_hold = false
     AND NEW.target_type <> 'legal_hold' THEN
    RAISE EXCEPTION
      'Legal holds require a dedicated legal_hold target row';
  END IF;

  IF OLD.retain_until IS NOT NULL
     AND NEW.retain_until IS NOT NULL
     AND NEW.retain_until < OLD.retain_until THEN
    RAISE EXCEPTION 'Retention deadlines cannot be shortened';
  END IF;

  old_rank := CASE OLD.deletion_status
    WHEN 'active' THEN 1
    WHEN 'eligible' THEN 2
    WHEN 'queued' THEN 3
    WHEN 'content_redacted' THEN 4
    WHEN 'restricted' THEN 4
    WHEN 'held' THEN 4
    WHEN 'deleted' THEN 5
    WHEN 'failed' THEN 3
  END;

  new_rank := CASE NEW.deletion_status
    WHEN 'active' THEN 1
    WHEN 'eligible' THEN 2
    WHEN 'queued' THEN 3
    WHEN 'content_redacted' THEN 4
    WHEN 'restricted' THEN 4
    WHEN 'held' THEN 4
    WHEN 'deleted' THEN 5
    WHEN 'failed' THEN 3
  END;

  IF new_rank < old_rank THEN
    RAISE EXCEPTION
      'Retention deletion status cannot move backward';
  END IF;

  IF OLD.deletion_status = 'deleted' THEN
    IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
       OR NEW.provider_retention_status IS DISTINCT FROM OLD.provider_retention_status
       OR NEW.source_deletion_state IS DISTINCT FROM OLD.source_deletion_state THEN
      RAISE EXCEPTION
        'Deletion evidence is immutable after completion';
    END IF;
  END IF;

  IF NEW.deletion_status = 'deleted'
     AND NEW.deleted_at IS NULL THEN
    RAISE EXCEPTION
      'Deleted retention rows require deletion evidence';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.restrict_ai_retention_update() FROM PUBLIC;

CREATE TRIGGER ai_retention_records_validate_bi
  BEFORE INSERT
  ON public.ai_retention_records
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_retention_relationship();

CREATE TRIGGER ai_retention_records_a_restrict_bu
  BEFORE UPDATE
  ON public.ai_retention_records
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_ai_retention_update();

CREATE TRIGGER ai_retention_records_b_validate_bu
  BEFORE UPDATE
  ON public.ai_retention_records
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_retention_relationship();

-- --------------------------------------------------------------------------
-- 8. IMMUTABILITY AND APPEND-ONLY PROTECTIONS
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_ai_append_only_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only and cannot be updated or deleted',
    TG_TABLE_NAME;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_ai_append_only_change() FROM PUBLIC;

CREATE TRIGGER ai_generations_append_only_bud
  BEFORE UPDATE OR DELETE
  ON public.ai_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ai_append_only_change();

CREATE TRIGGER ai_user_decisions_append_only_bud
  BEFORE UPDATE OR DELETE
  ON public.ai_user_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ai_append_only_change();

CREATE TRIGGER ai_approvals_append_only_bud
  BEFORE UPDATE OR DELETE
  ON public.ai_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ai_append_only_change();

CREATE TRIGGER ai_usage_ledger_append_only_bud
  BEFORE UPDATE OR DELETE
  ON public.ai_usage_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ai_append_only_change();

CREATE OR REPLACE FUNCTION public.restrict_ai_safety_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.escalation_status = 'resolved' THEN
    RAISE EXCEPTION
      'Resolved safety events are immutable; reopening requires a separately approved audited workflow';
  END IF;

  IF NEW.request_id IS DISTINCT FROM OLD.request_id
     OR NEW.generation_id IS DISTINCT FROM OLD.generation_id
     OR NEW.rule_id IS DISTINCT FROM OLD.rule_id
     OR NEW.severity IS DISTINCT FROM OLD.severity
     OR NEW.disposition IS DISTINCT FROM OLD.disposition
     OR NEW.minimal_excerpt IS DISTINCT FROM OLD.minimal_excerpt
     OR NEW.details IS DISTINCT FROM OLD.details
     OR NEW.recorded_by_user_id IS DISTINCT FROM OLD.recorded_by_user_id
     OR NEW.recorded_by_subject IS DISTINCT FROM OLD.recorded_by_subject
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION
      'Only authorized safety resolution fields may change';
  END IF;

  IF NOT (
    (OLD.escalation_status = 'pending'
      AND NEW.escalation_status IN ('reviewed', 'resolved'))
    OR
    (OLD.escalation_status = 'reviewed'
      AND NEW.escalation_status = 'resolved')
    OR
    (OLD.escalation_status = 'not_required'
      AND NEW.escalation_status = 'not_required')
  ) THEN
    RAISE EXCEPTION
      'Invalid safety escalation transition: % -> %',
      OLD.escalation_status,
      NEW.escalation_status;
  END IF;

  IF NEW.escalation_status = 'resolved' THEN
    IF NEW.resolved_by_user_id IS NULL
       OR NEW.resolved_by_subject IS DISTINCT FROM NEW.resolved_by_user_id::text
       OR NOT public.has_role(
         NEW.resolved_by_user_id,
         'admin'::public.app_role
       )
       OR NEW.resolved_at IS NULL
       OR nullif(trim(NEW.resolution_notes), '') IS NULL THEN
      RAISE EXCEPTION
        'Resolved safety events require a verified administrator, matching subject, notes, and timestamp';
    END IF;
  ELSE
    IF NEW.resolved_by_user_id IS NOT NULL
       OR NEW.resolved_by_subject IS NOT NULL
       OR NEW.resolved_at IS NOT NULL THEN
      RAISE EXCEPTION
        'Resolver identity and timestamp are permitted only for final resolution';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.restrict_ai_safety_update() FROM PUBLIC;

CREATE TRIGGER ai_safety_events_restrict_update_bu
  BEFORE UPDATE
  ON public.ai_safety_events
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_ai_safety_update();

CREATE OR REPLACE FUNCTION public.prevent_ai_request_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION
    'AI requests cannot be deleted directly; use the approved retention workflow';
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_ai_request_delete() FROM PUBLIC;

CREATE TRIGGER ai_requests_prevent_delete_bd
  BEFORE DELETE
  ON public.ai_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ai_request_delete();

-- --------------------------------------------------------------------------
-- 9. BUSINESS AUDIT LOG INTEGRATION
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.audit_ai_governance_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_business_id uuid;
  audit_campaign_id uuid;
  audit_actor_user_id uuid;
  audit_action text;
  audit_entity_type text;
  audit_entity_id text;
  audit_details jsonb;
BEGIN
  IF TG_TABLE_NAME = 'ai_requests' THEN
    audit_business_id := NEW.business_id;
    audit_campaign_id := NULL;
    audit_actor_user_id := NEW.actor_user_id;
    audit_action := 'ai_request_created';
    audit_entity_type := 'ai_request';
    audit_entity_id := NEW.id::text;
    audit_details := jsonb_build_object(
      'actor_subject', NEW.actor_subject,
      'purpose', NEW.purpose,
      'policy_version', NEW.policy_version,
      'pilot_context_used', NEW.pilot_context_used
    );

  ELSIF TG_TABLE_NAME = 'ai_user_decisions' THEN
    SELECT r.business_id
    INTO audit_business_id
    FROM public.ai_generations g
    JOIN public.ai_requests r ON r.id = g.request_id
    WHERE g.id = NEW.generation_id;

    audit_campaign_id := NEW.saved_campaign_id;
    audit_actor_user_id := NEW.actor_user_id;
    audit_action := 'ai_user_decision_recorded';
    audit_entity_type := 'ai_generation';
    audit_entity_id := NEW.generation_id::text;
    audit_details := jsonb_build_object(
      'actor_subject', NEW.actor_subject,
      'decision', NEW.decision,
      'decision_sequence', NEW.decision_sequence,
      'saved_campaign_id', NEW.saved_campaign_id,
      'saved_offer_id', NEW.saved_offer_id,
      'saved_creative_id', NEW.saved_creative_id
    );

  ELSIF TG_TABLE_NAME = 'ai_approvals' THEN
    SELECT r.business_id
    INTO audit_business_id
    FROM public.ai_generations g
    JOIN public.ai_requests r ON r.id = g.request_id
    WHERE g.id = NEW.generation_id;

    audit_campaign_id := NULL;
    audit_actor_user_id := NEW.reviewer_user_id;
    audit_action := 'ai_admin_approval_recorded';
    audit_entity_type := 'ai_generation';
    audit_entity_id := NEW.generation_id::text;
    audit_details := jsonb_build_object(
      'reviewer_subject', NEW.reviewer_subject,
      'decision', NEW.decision,
      'policy_version', NEW.policy_version
    );

  ELSIF TG_TABLE_NAME = 'ai_safety_events' THEN
    SELECT r.business_id
    INTO audit_business_id
    FROM public.ai_requests r
    WHERE r.id = NEW.request_id;

    audit_campaign_id := NULL;
    audit_actor_user_id := NEW.recorded_by_user_id;
    audit_action := 'ai_safety_event_recorded';
    audit_entity_type := 'ai_safety_event';
    audit_entity_id := NEW.id::text;
    audit_details := jsonb_build_object(
      'recorded_by_subject', NEW.recorded_by_subject,
      'rule_id', NEW.rule_id,
      'severity', NEW.severity,
      'disposition', NEW.disposition
    );
  ELSE
    RAISE EXCEPTION 'Unsupported AI audit table';
  END IF;

  IF audit_actor_user_id IS NULL THEN
    RAISE EXCEPTION
      'Business audit log requires a verified UUID actor';
  END IF;

  INSERT INTO public.business_audit_log (
    business_id,
    campaign_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    audit_business_id,
    audit_campaign_id,
    audit_actor_user_id,
    audit_action,
    audit_entity_type,
    audit_entity_id,
    audit_details
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_ai_governance_event() FROM PUBLIC;

CREATE TRIGGER ai_requests_audit_ai
  AFTER INSERT
  ON public.ai_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_ai_governance_event();

CREATE TRIGGER ai_user_decisions_audit_ai
  AFTER INSERT
  ON public.ai_user_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_ai_governance_event();

CREATE TRIGGER ai_approvals_audit_ai
  AFTER INSERT
  ON public.ai_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_ai_governance_event();

CREATE TRIGGER ai_safety_events_audit_ai
  AFTER INSERT
  ON public.ai_safety_events
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_ai_governance_event();

-- --------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY
-- --------------------------------------------------------------------------

ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_request_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_user_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_safety_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_retention_records ENABLE ROW LEVEL SECURITY;

-- ai_requests
CREATE POLICY "Business owners read non-pilot AI requests"
  ON public.ai_requests
  FOR SELECT
  TO authenticated
  USING (
    pilot_context_used = false
    AND public.has_role(auth.uid(), 'business'::public.app_role)
    AND EXISTS (
      SELECT 1
      FROM public.business_profiles b
      WHERE b.id = ai_requests.business_id
        AND b.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Administrators read all AI requests"
  ON public.ai_requests
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- ai_request_sources
CREATE POLICY "Business owners read own AI request sources"
  ON public.ai_request_sources
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_requests r
      JOIN public.business_profiles b
        ON b.id = r.business_id
      WHERE r.id = ai_request_sources.request_id
        AND r.pilot_context_used = false
        AND b.owner_user_id = auth.uid()
        AND public.has_role(
          auth.uid(),
          'business'::public.app_role
        )
    )
  );

CREATE POLICY "Administrators read all AI request sources"
  ON public.ai_request_sources
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- ai_generations
CREATE POLICY "Business owners read own AI generations"
  ON public.ai_generations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_requests r
      JOIN public.business_profiles b
        ON b.id = r.business_id
      WHERE r.id = ai_generations.request_id
        AND r.pilot_context_used = false
        AND b.owner_user_id = auth.uid()
        AND public.has_role(
          auth.uid(),
          'business'::public.app_role
        )
    )
  );

CREATE POLICY "Administrators read all AI generations"
  ON public.ai_generations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- ai_user_decisions
CREATE POLICY "Business owners read own AI user decisions"
  ON public.ai_user_decisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_generations g
      JOIN public.ai_requests r
        ON r.id = g.request_id
      JOIN public.business_profiles b
        ON b.id = r.business_id
      WHERE g.id = ai_user_decisions.generation_id
        AND r.pilot_context_used = false
        AND b.owner_user_id = auth.uid()
        AND public.has_role(
          auth.uid(),
          'business'::public.app_role
        )
    )
  );

CREATE POLICY "Administrators read all AI user decisions"
  ON public.ai_user_decisions
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- ai_approvals
CREATE POLICY "Business owners read own AI approval outcomes"
  ON public.ai_approvals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_generations g
      JOIN public.ai_requests r
        ON r.id = g.request_id
      JOIN public.business_profiles b
        ON b.id = r.business_id
      WHERE g.id = ai_approvals.generation_id
        AND r.pilot_context_used = false
        AND b.owner_user_id = auth.uid()
        AND public.has_role(
          auth.uid(),
          'business'::public.app_role
        )
    )
  );

CREATE POLICY "Administrators read all AI approvals"
  ON public.ai_approvals
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- ai_safety_events
CREATE POLICY "Administrators read all AI safety events"
  ON public.ai_safety_events
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- ai_usage_ledger
CREATE POLICY "Administrators read all AI usage ledger rows"
  ON public.ai_usage_ledger
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- ai_retention_records
CREATE POLICY "Administrators read all AI retention records"
  ON public.ai_retention_records
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- No authenticated INSERT, UPDATE, or DELETE policies are created.

-- --------------------------------------------------------------------------
-- 11. LEAST-PRIVILEGE GRANTS AND REVOKES
-- --------------------------------------------------------------------------

REVOKE ALL ON public.ai_requests FROM anon, authenticated;
REVOKE ALL ON public.ai_request_sources FROM anon, authenticated;
REVOKE ALL ON public.ai_generations FROM anon, authenticated;
REVOKE ALL ON public.ai_user_decisions FROM anon, authenticated;
REVOKE ALL ON public.ai_approvals FROM anon, authenticated;
REVOKE ALL ON public.ai_safety_events FROM anon, authenticated;
REVOKE ALL ON public.ai_usage_ledger FROM anon, authenticated;
REVOKE ALL ON public.ai_retention_records FROM anon, authenticated;

GRANT SELECT ON public.ai_requests TO authenticated;
GRANT SELECT ON public.ai_request_sources TO authenticated;
GRANT SELECT ON public.ai_generations TO authenticated;
GRANT SELECT ON public.ai_user_decisions TO authenticated;
GRANT SELECT ON public.ai_approvals TO authenticated;
GRANT SELECT ON public.ai_safety_events TO authenticated;
GRANT SELECT ON public.ai_usage_ledger TO authenticated;
GRANT SELECT ON public.ai_retention_records TO authenticated;

GRANT ALL ON public.ai_requests TO service_role;
GRANT ALL ON public.ai_request_sources TO service_role;
GRANT ALL ON public.ai_generations TO service_role;
GRANT ALL ON public.ai_user_decisions TO service_role;
GRANT ALL ON public.ai_approvals TO service_role;
GRANT ALL ON public.ai_safety_events TO service_role;
GRANT ALL ON public.ai_usage_ledger TO service_role;
GRANT ALL ON public.ai_retention_records TO service_role;

-- --------------------------------------------------------------------------
-- 12. REVIEW ASSERTIONS
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.business_profiles') IS NULL
     OR to_regclass('public.business_pilot_records') IS NULL
     OR to_regclass('public.business_campaigns') IS NULL
     OR to_regclass('public.business_offers') IS NULL
     OR to_regclass('public.business_campaign_creatives') IS NULL
     OR to_regclass('public.business_partner_documents') IS NULL
     OR to_regclass('public.business_campaign_reports') IS NULL
     OR to_regclass('public.business_audit_log') IS NULL THEN
    RAISE EXCEPTION
      'Authoritative V24.24.1 business schema is incomplete';
  END IF;

  IF to_regprocedure(
    'public.has_role(uuid,public.app_role)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Authoritative has_role(uuid, app_role) helper is unavailable';
  END IF;
END;
$$;

-- --------------------------------------------------------------------------
-- 13. FUTURE AUTHORIZED ROLLBACK ORDER
-- --------------------------------------------------------------------------
--
-- 1. Disable all AI routes/provider calls.
-- 2. Preserve records subject to retention or legal hold.
-- 3. Drop audit triggers:
--      ai_safety_events_audit_ai
--      ai_approvals_audit_ai
--      ai_user_decisions_audit_ai
--      ai_requests_audit_ai
-- 4. Drop all RLS policies on the eight tables.
-- 5. Drop validation/immutability triggers in reverse dependency order.
-- 6. Drop functions:
--      public.audit_ai_governance_event()
--      public.prevent_ai_request_delete()
--      public.restrict_ai_safety_update()
--      public.prevent_ai_append_only_change()
--      public.restrict_ai_retention_update()
--      public.validate_ai_retention_relationship()
--      public.validate_ai_usage_relationship()
--      public.validate_ai_safety_relationship()
--      public.validate_ai_approval()
--      public.validate_ai_user_decision()
--      public.validate_ai_generation()
--      public.assign_ai_user_decision_sequence()
--      public.assign_ai_generation_version()
--      public.allocate_ai_user_decision_sequence(uuid)
--      public.allocate_ai_generation_version(uuid)
--      public.validate_ai_request_source()
--      public.mark_ai_request_source_deleted()
--      public.enforce_ai_request_status_transition()
--      public.restrict_ai_request_update()
--      public.validate_ai_request_context()
--      public.can_read_ai_request(uuid)
--      public.can_access_business_ai(uuid)
-- 7. Drop tables in this order:
--      public.ai_retention_records
--      public.ai_usage_ledger
--      public.ai_safety_events
--      public.ai_approvals
--      public.ai_user_decisions
--      public.ai_generations
--      public.ai_request_sources
--      public.ai_requests
-- 8. Leave all pre-existing VYBE objects unchanged.
--
-- Controlled V24.25 implementation migration.
-- This file persists the reviewed governance schema when executed.

COMMIT;
