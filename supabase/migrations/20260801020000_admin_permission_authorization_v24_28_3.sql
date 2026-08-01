-- VYBE V24.28.3 -- database authorization hardening
-- Replaces broad legacy-admin authorization with operational permissions.

BEGIN;

-- Memberships and work queue.
DROP POLICY IF EXISTS "Admins can view all entitlements" ON public.account_entitlements;
CREATE POLICY "Authorized administrators view entitlements" ON public.account_entitlements
  FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.accounts.read')
    OR public.has_admin_permission(auth.uid(), 'admin.finance.read')
    OR public.has_admin_permission(auth.uid(), 'admin.creator.membership'));

DROP POLICY IF EXISTS "Admins update work queue notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admins view work queue notifications" ON public.admin_notifications;
CREATE POLICY "Authorized administrators view work queue notifications" ON public.admin_notifications
  FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.work_queue.read'));
CREATE POLICY "Authorized administrators update work queue notifications" ON public.admin_notifications
  FOR UPDATE TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.work_queue.manage'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.work_queue.manage'));

-- RBAC catalogs remain Super Administrator only.
DROP POLICY IF EXISTS "Administrators read permission catalog" ON public.admin_permissions;
DROP POLICY IF EXISTS "Administrators read role permission map" ON public.admin_role_permissions;
DROP POLICY IF EXISTS "Administrators read role catalog" ON public.admin_roles;
CREATE POLICY "Super administrators read permission catalog" ON public.admin_permissions
  FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read role permission map" ON public.admin_role_permissions
  FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read role catalog" ON public.admin_roles
  FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));

-- Shared AI remains Super Administrator only until an AI-specific operational role is approved.
DROP POLICY IF EXISTS "Administrators read all AI approvals" ON public.ai_approvals;
DROP POLICY IF EXISTS "Administrators read all AI generations" ON public.ai_generations;
DROP POLICY IF EXISTS "Administrators read all AI request sources" ON public.ai_request_sources;
DROP POLICY IF EXISTS "Administrators read all AI requests" ON public.ai_requests;
DROP POLICY IF EXISTS "Administrators read all AI retention records" ON public.ai_retention_records;
DROP POLICY IF EXISTS "Administrators read all AI safety events" ON public.ai_safety_events;
DROP POLICY IF EXISTS "Administrators read all AI usage ledger rows" ON public.ai_usage_ledger;
DROP POLICY IF EXISTS "Administrators read all AI user decisions" ON public.ai_user_decisions;
CREATE POLICY "Super administrators read AI approvals" ON public.ai_approvals FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read AI generations" ON public.ai_generations FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read AI request sources" ON public.ai_request_sources FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read AI requests" ON public.ai_requests FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read AI retention records" ON public.ai_retention_records FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read AI safety events" ON public.ai_safety_events FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read AI usage ledger" ON public.ai_usage_ledger FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read AI user decisions" ON public.ai_user_decisions FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));

-- Rights processing and matching.
DROP POLICY IF EXISTS "Creators view own fingerprint records" ON public.audio_fingerprints;
CREATE POLICY "Creators and rights administrators view fingerprints" ON public.audio_fingerprints
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR public.has_admin_permission(auth.uid(), 'admin.rights.read'));
DROP POLICY IF EXISTS "Admins manage match candidates" ON public.audio_match_candidates;
CREATE POLICY "Rights administrators view match candidates" ON public.audio_match_candidates
  FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.rights.review'));
CREATE POLICY "Rights administrators manage match candidates" ON public.audio_match_candidates
  FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.rights.resolve'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.rights.resolve'));
DROP POLICY IF EXISTS "Creators view own processing jobs" ON public.audio_processing_jobs;
CREATE POLICY "Creators and rights administrators view processing jobs" ON public.audio_processing_jobs
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR public.has_admin_permission(auth.uid(), 'admin.rights.read'));

-- Business operations.
DROP POLICY IF EXISTS "Admins add business audit log" ON public.business_audit_log;
DROP POLICY IF EXISTS "Admins view business audit log" ON public.business_audit_log;
CREATE POLICY "Business administrators add audit log" ON public.business_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.manage'));
CREATE POLICY "Business administrators view audit log" ON public.business_audit_log
  FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.read'));

DROP POLICY IF EXISTS "Admins manage business creatives" ON public.business_campaign_creatives;
CREATE POLICY "Business administrators view creatives" ON public.business_campaign_creatives
  FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.read'));
CREATE POLICY "Business administrators manage creatives" ON public.business_campaign_creatives
  FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.manage'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.manage'));

DROP POLICY IF EXISTS "Admins manage business campaign events" ON public.business_campaign_events;
CREATE POLICY "Reporting administrators view campaign events" ON public.business_campaign_events
  FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.analytics.read') OR public.has_admin_permission(auth.uid(), 'admin.business.read'));
CREATE POLICY "Business administrators manage campaign events" ON public.business_campaign_events
  FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.manage'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.manage'));

DROP POLICY IF EXISTS "Admins manage business placements" ON public.business_campaign_placements;
CREATE POLICY "Business administrators view placements" ON public.business_campaign_placements
  FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.read'));
CREATE POLICY "Business administrators manage placements" ON public.business_campaign_placements
  FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.manage'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.manage'));

DROP POLICY IF EXISTS "Admins create campaign reports" ON public.business_campaign_reports;
DROP POLICY IF EXISTS "Admins view campaign reports" ON public.business_campaign_reports;
CREATE POLICY "Reporting administrators view campaign reports" ON public.business_campaign_reports
  FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.analytics.read') OR public.has_admin_permission(auth.uid(), 'admin.business.read'));
CREATE POLICY "Authorized administrators create campaign reports" ON public.business_campaign_reports
  FOR INSERT TO authenticated WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.reports.release'));

DROP POLICY IF EXISTS "Admins manage business campaigns" ON public.business_campaigns;
CREATE POLICY "Reporting administrators view campaigns" ON public.business_campaigns
  FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.analytics.read') OR public.has_admin_permission(auth.uid(), 'admin.business.read'));
CREATE POLICY "Business administrators manage campaigns" ON public.business_campaigns
  FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.manage'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.manage'));

DROP POLICY IF EXISTS "Admins manage business redemptions" ON public.business_offer_redemptions;
CREATE POLICY "Reporting administrators view redemptions" ON public.business_offer_redemptions
  FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.analytics.read') OR public.has_admin_permission(auth.uid(), 'admin.business.read'));
CREATE POLICY "Business administrators manage redemptions" ON public.business_offer_redemptions
  FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.manage'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.manage'));

DROP POLICY IF EXISTS "Admins manage business offers" ON public.business_offers;
CREATE POLICY "Business administrators view offers" ON public.business_offers FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.read'));
CREATE POLICY "Business administrators manage offers" ON public.business_offers FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.manage')) WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.manage'));
DROP POLICY IF EXISTS "Admins manage business packages" ON public.business_packages;
CREATE POLICY "Business administrators view packages" ON public.business_packages FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.read'));
CREATE POLICY "Business administrators manage packages" ON public.business_packages FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.manage')) WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.manage'));
DROP POLICY IF EXISTS "Admins manage partner documents" ON public.business_partner_documents;
CREATE POLICY "Business administrators view partner documents" ON public.business_partner_documents FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.read'));
CREATE POLICY "Business administrators manage partner documents" ON public.business_partner_documents FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.manage')) WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.manage'));
DROP POLICY IF EXISTS "Admins manage business profiles" ON public.business_profiles;
CREATE POLICY "Business administrators view profiles" ON public.business_profiles FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.read'));
CREATE POLICY "Business administrators manage profiles" ON public.business_profiles FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.manage')) WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.manage'));

DROP POLICY IF EXISTS "Admins manage business pilot activities" ON public.business_pilot_activities;
CREATE POLICY "Pilot administrators view pilot activities" ON public.business_pilot_activities FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.pilot'));
CREATE POLICY "Pilot administrators manage pilot activities" ON public.business_pilot_activities FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.pilot')) WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.pilot'));
DROP POLICY IF EXISTS "Admins manage business pilot records" ON public.business_pilot_records;
CREATE POLICY "Pilot administrators view pilot records" ON public.business_pilot_records FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.pilot'));
CREATE POLICY "Pilot administrators manage pilot records" ON public.business_pilot_records FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.business.pilot')) WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.pilot'));

-- Creator, rights, and moderation operations.
DROP POLICY IF EXISTS "Admins manage copyright reports" ON public.copyright_reports;
CREATE POLICY "Rights administrators view copyright reports" ON public.copyright_reports FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.rights.read'));
CREATE POLICY "Rights administrators manage copyright reports" ON public.copyright_reports FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.rights.resolve')) WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.rights.resolve'));
DROP POLICY IF EXISTS "Admins can revoke creator invitations" ON public.creator_invites;
DROP POLICY IF EXISTS "Admins can view creator invitations" ON public.creator_invites;
CREATE POLICY "Creator administrators view invitations" ON public.creator_invites FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.creator.read'));
CREATE POLICY "Creator administrators revoke invitations" ON public.creator_invites FOR UPDATE TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.creator.manage')) WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.creator.manage'));

DROP POLICY IF EXISTS "Admins manage rights documents" ON public.creator_rights_documents;
DROP POLICY IF EXISTS "Creators view own rights documents" ON public.creator_rights_documents;
CREATE POLICY "Creators and rights administrators view rights documents" ON public.creator_rights_documents
  FOR SELECT TO authenticated USING (creator_id = auth.uid() OR public.has_admin_permission(auth.uid(), 'admin.rights.read'));
CREATE POLICY "Rights administrators manage rights documents" ON public.creator_rights_documents
  FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.rights.resolve')) WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.rights.resolve'));

DROP POLICY IF EXISTS "Admins manage moderation cases" ON public.moderation_cases;
DROP POLICY IF EXISTS "Admins view moderation cases" ON public.moderation_cases;
CREATE POLICY "Content administrators view moderation cases" ON public.moderation_cases FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.content.read'));
CREATE POLICY "Content administrators manage moderation cases" ON public.moderation_cases FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.content.moderate')) WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.content.moderate'));
DROP POLICY IF EXISTS "Admins view moderation events" ON public.moderation_events;
CREATE POLICY "Content administrators view moderation events" ON public.moderation_events FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.content.read'));

DROP POLICY IF EXISTS "Admins manage track lyrics" ON public.track_lyrics;
CREATE POLICY "Content administrators view track lyrics" ON public.track_lyrics FOR SELECT TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.content.read'));
CREATE POLICY "Content administrators manage track lyrics" ON public.track_lyrics FOR ALL TO authenticated USING (public.has_admin_permission(auth.uid(), 'admin.content.publish')) WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.content.publish'));
DROP POLICY IF EXISTS "Admins view tracks for moderation" ON public.tracks;
CREATE POLICY "Authorized administrators view tracks" ON public.tracks FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.creator.read') OR public.has_admin_permission(auth.uid(), 'admin.content.read') OR public.has_admin_permission(auth.uid(), 'admin.rights.read'));
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Account administrators view user roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.accounts.read') OR public.has_admin_permission(auth.uid(), 'admin.team.manage'));

-- Rewrite callable SECURITY DEFINER functions without copying or weakening their bodies.
DO $migration$
DECLARE
  replacement record;
  original_definition text;
  revised_definition text;
BEGIN
  FOR replacement IN
    SELECT * FROM (VALUES
      ('public.active_creator_plan(uuid)'::regprocedure, $old$public.has_role(_user_id, 'admin')$old$, $new$public.has_admin_permission(_user_id, 'admin.creator.membership')$new$),
      ('public.can_access_business_ai(uuid)'::regprocedure, $old$public.has_role(auth.uid(), 'admin'::public.app_role)$old$, $new$public.has_admin_permission(auth.uid(), 'admin.team.manage')$new$),
      ('public.can_read_ai_request(uuid)'::regprocedure, $old$public.has_role(auth.uid(), 'admin'::public.app_role)$old$, $new$public.has_admin_permission(auth.uid(), 'admin.team.manage')$new$),
      ('public.create_creator_invite(text,text,text,integer,text)'::regprocedure, $old$public.has_role(auth.uid(), 'admin')$old$, $new$public.has_admin_permission(auth.uid(), 'admin.creator.manage')$new$),
      ('public.get_admin_back_office_summary()'::regprocedure, $old$public.has_role(auth.uid(), 'admin')$old$, $new$public.has_admin_permission(auth.uid(), 'admin.team.manage')$new$),
      ('public.get_admin_business_summary()'::regprocedure, $old$public.has_role(auth.uid(), 'admin')$old$, $new$public.has_admin_permission(auth.uid(), 'admin.business.read')$new$),
      ('public.get_admin_campaign_analytics(uuid,timestamp with time zone,timestamp with time zone)'::regprocedure, $old$public.has_role(auth.uid(), 'admin')$old$, $new$public.has_admin_permission(auth.uid(), 'admin.analytics.read')$new$),
      ('public.get_admin_creator_directory(text,integer)'::regprocedure, $old$public.has_role(auth.uid(), 'admin')$old$, $new$public.has_admin_permission(auth.uid(), 'admin.creator.read')$new$),
      ('public.get_admin_work_queue_summary()'::regprocedure, $old$public.has_role(auth.uid(), 'admin')$old$, $new$public.has_admin_permission(auth.uid(), 'admin.work_queue.read')$new$),
      ('public.get_business_pilot_dashboard()'::regprocedure, $old$public.has_role(auth.uid(), 'admin')$old$, $new$public.has_admin_permission(auth.uid(), 'admin.business.pilot')$new$),
      ('public.queue_track_rights_processing(uuid)'::regprocedure, $old$public.has_role(auth.uid(), 'admin')$old$, $new$public.has_admin_permission(auth.uid(), 'admin.rights.review')$new$),
      ('public.sync_business_pilot_notifications()'::regprocedure, $old$public.has_role(auth.uid(), 'admin')$old$, $new$public.has_admin_permission(auth.uid(), 'admin.business.pilot')$new$)
    ) AS changes(function_oid, old_guard, new_guard)
  LOOP
    original_definition := pg_get_functiondef(replacement.function_oid);
    revised_definition := replace(original_definition, replacement.old_guard, replacement.new_guard);
    IF revised_definition = original_definition THEN
      RAISE EXCEPTION 'Expected legacy guard not found in %', replacement.function_oid;
    END IF;
    EXECUTE revised_definition;
  END LOOP;
END;
$migration$;

-- Fail closed if any policy still contains the legacy broad administrator test.
DO $verification$
DECLARE
  legacy_policy_count integer;
BEGIN
  SELECT count(*) INTO legacy_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (coalesce(qual, '') ILIKE '%has_role%admin%'
      OR coalesce(with_check, '') ILIKE '%has_role%admin%');
  IF legacy_policy_count <> 0 THEN
    RAISE EXCEPTION 'V24.28.3 left % broad administrator policies', legacy_policy_count;
  END IF;
END;
$verification$;

COMMIT;
