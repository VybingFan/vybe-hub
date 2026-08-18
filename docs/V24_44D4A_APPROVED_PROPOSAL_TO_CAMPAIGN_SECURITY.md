# V24.44D4A — Approved Proposal to Campaign Security

## Base
`35ad02f3`

## Purpose
Create a controlled bridge from an approved Business Portal campaign proposal into VYBE Operations campaign inventory.

## Rules
- Only `campaign_proposal` submissions qualify.
- The submission must already be `approved`.
- The business must still be `verified`.
- Only staff with `admin.business.manage` can convert it.
- One proposal can create only one campaign.
- The new campaign is created through a `SECURITY DEFINER` RPC.
- The proposal stores its resulting `linked_campaign_id`.
- An immutable conversion event records the submission, business, campaign, staff actor, and timestamp.
- The Business Portal never receives campaign-creation authority.

## Next
After D4A is deployed and verified, D4B adds the Operations UI control to create the draft campaign.
