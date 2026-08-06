-- =============================================================================
-- VYBE V24.35.1
-- Secure Media Gateway Core
--
-- Purpose:
--   Creates the media access audit table used by the Secure Media Gateway.
--
-- Safe to commit to Git.
-- Do NOT run again if you have already executed this migration successfully
-- in Supabase.
-- =============================================================================

BEGIN;

-- =============================================================================
-- Media Access Events
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.media_access_events (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    resource_type TEXT NOT NULL
        CHECK (
            resource_type IN (
                'playlist',
                'track',
                'album',
                'video',
                'epk',
                'document'
            )
        ),

    resource_id UUID,

    listener_user_id UUID
        REFERENCES auth.users(id)
        ON DELETE SET NULL,

    access_mode TEXT,

    outcome TEXT NOT NULL
        CHECK (
            outcome IN (
                'granted',
                'denied'
            )
        ),

    reason_code TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS media_access_events_resource_idx
ON public.media_access_events
(
    resource_type,
    resource_id,
    created_at DESC
);

CREATE INDEX IF NOT EXISTS media_access_events_listener_idx
ON public.media_access_events
(
    listener_user_id,
    created_at DESC
);

-- =============================================================================
-- Security
-- =============================================================================

ALTER TABLE public.media_access_events
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
"Creators view access events for own playlists"
ON public.media_access_events;

CREATE POLICY
"Creators view access events for own playlists"
ON public.media_access_events
FOR SELECT
TO authenticated
USING
(
    resource_type = 'playlist'

    AND EXISTS
    (
        SELECT 1
        FROM public.playlists p
        WHERE
            p.id = resource_id
        AND
            p.creator_id = auth.uid()
    )
);

-- =============================================================================
-- Permissions
-- =============================================================================

GRANT SELECT
ON public.media_access_events
TO authenticated;

GRANT ALL
ON public.media_access_events
TO service_role;

GRANT USAGE, SELECT
ON SEQUENCE public.media_access_events_id_seq
TO service_role;

COMMIT;

-- =============================================================================
-- End of Migration
-- =============================================================================