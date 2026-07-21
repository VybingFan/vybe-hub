ALTER TABLE public.listener_connections
  ADD COLUMN is_favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN category text NOT NULL DEFAULT 'supporter'
    CHECK (category IN ('supporter', 'superfan', 'collaborator', 'business', 'venue', 'media', 'merch_interest', 'event_interest', 'other')),
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}'
    CHECK (cardinality(tags) <= 10),
  ADD COLUMN private_notes text
    CHECK (private_notes IS NULL OR char_length(private_notes) <= 1000);

ALTER TABLE public.listener_connections
  DROP CONSTRAINT listener_connections_status_check;
ALTER TABLE public.listener_connections
  ADD CONSTRAINT listener_connections_status_check
  CHECK (status IN ('new', 'follow_up', 'contacted', 'archived'));
