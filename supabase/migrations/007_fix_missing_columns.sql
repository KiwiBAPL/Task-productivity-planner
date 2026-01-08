-- Fix missing step completion flags if migration 006 wasn't run
-- This migration is idempotent and safe to run multiple times

-- Add step completion flags to clarity_journeys table if they don't exist
DO $$ 
BEGIN
  -- Add tools_done column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clarity_journeys' 
    AND column_name = 'tools_done'
  ) THEN
    ALTER TABLE public.clarity_journeys
      ADD COLUMN tools_done BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Add wheel_done column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clarity_journeys' 
    AND column_name = 'wheel_done'
  ) THEN
    ALTER TABLE public.clarity_journeys
      ADD COLUMN wheel_done BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Add swot_done column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clarity_journeys' 
    AND column_name = 'swot_done'
  ) THEN
    ALTER TABLE public.clarity_journeys
      ADD COLUMN swot_done BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Add vision_done column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clarity_journeys' 
    AND column_name = 'vision_done'
  ) THEN
    ALTER TABLE public.clarity_journeys
      ADD COLUMN vision_done BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Add big5_done column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clarity_journeys' 
    AND column_name = 'big5_done'
  ) THEN
    ALTER TABLE public.clarity_journeys
      ADD COLUMN big5_done BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add comments to document the purpose of these flags
COMMENT ON COLUMN public.clarity_journeys.tools_done IS 'Indicates whether the tool selection step has been completed';
COMMENT ON COLUMN public.clarity_journeys.wheel_done IS 'Indicates whether the Wheel of Life exercise has been completed or skipped';
COMMENT ON COLUMN public.clarity_journeys.swot_done IS 'Indicates whether the SWOT analysis has been completed or skipped';
COMMENT ON COLUMN public.clarity_journeys.vision_done IS 'Indicates whether the Vision Board has been completed or skipped';
COMMENT ON COLUMN public.clarity_journeys.big5_done IS 'Indicates whether the Big 5 & OKRs step has been completed';

