-- Add step completion flags to clarity_journeys table
-- These flags track whether each step in the Clarity Wizard has been marked as done

ALTER TABLE public.clarity_journeys
  ADD COLUMN IF NOT EXISTS tools_done BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS wheel_done BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS swot_done BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS vision_done BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS big5_done BOOLEAN DEFAULT false NOT NULL;

-- Add comments to document the purpose of these flags
COMMENT ON COLUMN public.clarity_journeys.tools_done IS 'Indicates whether the tool selection step has been completed';
COMMENT ON COLUMN public.clarity_journeys.wheel_done IS 'Indicates whether the Wheel of Life exercise has been completed or skipped';
COMMENT ON COLUMN public.clarity_journeys.swot_done IS 'Indicates whether the SWOT analysis has been completed or skipped';
COMMENT ON COLUMN public.clarity_journeys.vision_done IS 'Indicates whether the Vision Board has been completed or skipped';
COMMENT ON COLUMN public.clarity_journeys.big5_done IS 'Indicates whether the Big 5 & OKRs step has been completed';

