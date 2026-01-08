-- Simplify Clarity Wizard workflow by removing legacy tool selection flags
-- These fields are no longer needed as the workflow is now linear (all users go through all tools)

-- Remove tool selection flags (no longer needed)
ALTER TABLE public.clarity_journeys
  DROP COLUMN IF EXISTS tools_wheel_of_life,
  DROP COLUMN IF EXISTS tools_swot,
  DROP COLUMN IF EXISTS tools_vision_board,
  DROP COLUMN IF EXISTS tools_done;

-- Keep completion flags (wheel_done, swot_done, vision_done, big5_done)
-- These can be used for future analytics/progress tracking but don't control navigation

-- Add comment explaining the simplified workflow
COMMENT ON TABLE public.clarity_journeys IS 'Main table for Clarity Wizard journeys. Linear workflow: Period → Tools → Wheel of Life → SWOT → Vision Board → Big 5. Completion flags track progress but do not control navigation.';

