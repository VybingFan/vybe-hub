-- VYBE V24.79A2
-- Grant only the table privileges required by creator/admin support ticket RLS.

BEGIN;

REVOKE ALL ON TABLE public.creator_support_requests FROM anon;
REVOKE ALL ON TABLE public.creator_support_messages FROM anon;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.creator_support_requests
TO authenticated;

GRANT SELECT, INSERT
ON TABLE public.creator_support_messages
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.creator_support_requests
TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.creator_support_messages
TO service_role;

COMMIT;
