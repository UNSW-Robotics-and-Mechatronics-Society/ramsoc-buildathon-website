-- ───────────────────────────────────────────── bring old tickets onto the new tiers ──
-- The egg tiers were retuned mid-event and two eggs were retired. Tickets store
-- their class on the row at mint time, so everything already out there is still
-- on the old scale. This puts every ticket on the current one, so two people
-- holding "the same" ticket are holding the same thing.
--
--   logo6        A -> B   six taps on the logo
--   typewriter   B -> C   the typewriter slip
--   cornerRambo  B -> C   retired egg, matched to what it was last worth
--   typeRambo    C -> C   retired egg, already correct
--   rambo        B        unchanged
--   67, faq17    C        unchanged
--
-- Nothing is deleted: tickets from the two retired eggs keep working and keep
-- trading, they just lose their title in the UI.

update tickets t
set class = v.class
from (values
  ('logo6',       'B'),
  ('rambo',       'B'),
  ('67',          'C'),
  ('faq17',       'C'),
  ('typewriter',  'C'),
  ('cornerRambo', 'C'),
  ('typeRambo',   'C')
) as v (source, class)
where t.source = v.source
  and t.class <> v.class;

-- The class letter is also the first character of the serial, which is what a
-- volunteer at the stall actually reads off the phone. Left alone, a retiered
-- ticket would show a big "C" beside a serial starting "A". Only the prefix
-- moves; the rest of the serial is untouched, so it is still recognisably the
-- same ticket.
--
-- serial is unique. A rewrite colliding with an existing serial would abort
-- this migration rather than corrupt anything, and the odds of that are
-- vanishingly small (the body is 4 chars from a 32-char alphabet plus 2
-- digits), but if it ever did happen, re-running after re-minting the clash is
-- the fix.
update tickets
set serial = class || substring(serial from 2)
where substring(serial from 1 for 1) <> class;
