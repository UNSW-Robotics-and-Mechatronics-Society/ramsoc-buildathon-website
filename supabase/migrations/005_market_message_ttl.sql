-- ──────────────────────────────────────── black market messages, nothing kept ──
-- The Black Market now hard-deletes any message older than
-- MARKET_MESSAGE_TTL_MS (3 hours, see src/app/2026/_data/market.ts) the next
-- time anyone visits or polls the room — opportunistic, not a scheduled job.
-- This index is what keeps that delete cheap as the table grows.

create index if not exists market_messages_created_at_idx
  on market_messages (created_at);
