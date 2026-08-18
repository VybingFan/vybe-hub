# V24.44D4B R3 - Create Draft Campaign from Approved Proposal UI

Base: 364e09e16b3a955fdb906e5e86e31f9da52755c7

This bundle adds the Operations-side Create Draft Campaign action for an
approved campaign proposal. It uses the already-deployed D4A
create_campaign_from_business_submission(uuid) RPC.

The installer validates every source pattern before writing either source
file, so an anchor mismatch leaves the project unchanged.

No Supabase migration is included.
