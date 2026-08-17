-- VYBE V24.42B2A2A - allow the anonymous public video policy to evaluate
-- membership without exposing private video rows or restoring Free video access.
begin;

grant execute on function public.creator_has_feature_v24_42b2a2(uuid,text) to anon;

commit;
