-- Clarity Wizard Database Schema Foundation
-- Creates all tables, RLS policies, storage bucket, indexes, and triggers

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CLARITY JOURNEYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clarity_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  tools_wheel_of_life BOOLEAN DEFAULT true NOT NULL,
  tools_swot BOOLEAN DEFAULT true NOT NULL,
  tools_vision_board BOOLEAN DEFAULT true NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add constraint to ensure period_end is after period_start
ALTER TABLE public.clarity_journeys
  ADD CONSTRAINT period_end_after_start CHECK (period_end > period_start);

-- Enable RLS on clarity_journeys table
ALTER TABLE public.clarity_journeys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clarity_journeys
CREATE POLICY "Users can view their own journeys"
  ON public.clarity_journeys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journeys"
  ON public.clarity_journeys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journeys"
  ON public.clarity_journeys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journeys"
  ON public.clarity_journeys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for clarity_journeys
CREATE INDEX IF NOT EXISTS clarity_journeys_user_id_idx ON public.clarity_journeys(user_id);
CREATE INDEX IF NOT EXISTS clarity_journeys_status_idx ON public.clarity_journeys(status);
CREATE INDEX IF NOT EXISTS clarity_journeys_created_at_idx ON public.clarity_journeys(created_at DESC);

-- Unique constraint: Only one draft journey per user
CREATE UNIQUE INDEX IF NOT EXISTS clarity_journeys_one_draft_per_user 
ON public.clarity_journeys(user_id) 
WHERE status = 'draft';

-- ============================================================================
-- 2. WHEEL OF LIFE AREAS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wheel_of_life_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.clarity_journeys(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on wheel_of_life_areas table
ALTER TABLE public.wheel_of_life_areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wheel_of_life_areas
-- Users can only access areas for their own journeys
CREATE POLICY "Users can view wheel of life areas for their journeys"
  ON public.wheel_of_life_areas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = wheel_of_life_areas.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert wheel of life areas for their journeys"
  ON public.wheel_of_life_areas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = wheel_of_life_areas.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update wheel of life areas for their journeys"
  ON public.wheel_of_life_areas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = wheel_of_life_areas.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = wheel_of_life_areas.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete wheel of life areas for their journeys"
  ON public.wheel_of_life_areas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = wheel_of_life_areas.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

-- Indexes for wheel_of_life_areas
CREATE INDEX IF NOT EXISTS wheel_of_life_areas_journey_id_idx ON public.wheel_of_life_areas(journey_id);

-- ============================================================================
-- 3. SWOT ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.swot_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.clarity_journeys(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('strength', 'weakness', 'opportunity', 'threat')),
  content TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on swot_entries table
ALTER TABLE public.swot_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for swot_entries
CREATE POLICY "Users can view SWOT entries for their journeys"
  ON public.swot_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = swot_entries.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert SWOT entries for their journeys"
  ON public.swot_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = swot_entries.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update SWOT entries for their journeys"
  ON public.swot_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = swot_entries.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = swot_entries.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete SWOT entries for their journeys"
  ON public.swot_entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = swot_entries.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

-- Indexes for swot_entries
CREATE INDEX IF NOT EXISTS swot_entries_journey_id_idx ON public.swot_entries(journey_id);
CREATE INDEX IF NOT EXISTS swot_entries_type_idx ON public.swot_entries(type);

-- ============================================================================
-- 4. VISION BOARD VERSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vision_board_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.clarity_journeys(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  is_current BOOLEAN DEFAULT true NOT NULL,
  is_committed BOOLEAN DEFAULT false NOT NULL
);

-- Enable RLS on vision_board_versions table
ALTER TABLE public.vision_board_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vision_board_versions
CREATE POLICY "Users can view vision board versions for their journeys"
  ON public.vision_board_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = vision_board_versions.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vision board versions for their journeys"
  ON public.vision_board_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = vision_board_versions.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vision board versions for their journeys"
  ON public.vision_board_versions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = vision_board_versions.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = vision_board_versions.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vision board versions for their journeys"
  ON public.vision_board_versions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = vision_board_versions.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

-- Indexes for vision_board_versions
CREATE INDEX IF NOT EXISTS vision_board_versions_journey_id_idx ON public.vision_board_versions(journey_id);
CREATE INDEX IF NOT EXISTS vision_board_versions_is_committed_idx ON public.vision_board_versions(is_committed);
CREATE INDEX IF NOT EXISTS vision_board_versions_is_current_idx ON public.vision_board_versions(is_current);

-- ============================================================================
-- 5. VISION BOARD IMAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vision_board_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.vision_board_versions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  position_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on vision_board_images table
ALTER TABLE public.vision_board_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vision_board_images
CREATE POLICY "Users can view vision board images for their journeys"
  ON public.vision_board_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vision_board_versions
      JOIN public.clarity_journeys ON clarity_journeys.id = vision_board_versions.journey_id
      WHERE vision_board_versions.id = vision_board_images.version_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vision board images for their journeys"
  ON public.vision_board_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vision_board_versions
      JOIN public.clarity_journeys ON clarity_journeys.id = vision_board_versions.journey_id
      WHERE vision_board_versions.id = vision_board_images.version_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vision board images for their journeys"
  ON public.vision_board_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vision_board_versions
      JOIN public.clarity_journeys ON clarity_journeys.id = vision_board_versions.journey_id
      WHERE vision_board_versions.id = vision_board_images.version_id
      AND clarity_journeys.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vision_board_versions
      JOIN public.clarity_journeys ON clarity_journeys.id = vision_board_versions.journey_id
      WHERE vision_board_versions.id = vision_board_images.version_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vision board images for their journeys"
  ON public.vision_board_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vision_board_versions
      JOIN public.clarity_journeys ON clarity_journeys.id = vision_board_versions.journey_id
      WHERE vision_board_versions.id = vision_board_images.version_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

-- Indexes for vision_board_images
CREATE INDEX IF NOT EXISTS vision_board_images_version_id_idx ON public.vision_board_images(version_id);
CREATE INDEX IF NOT EXISTS vision_board_images_position_index_idx ON public.vision_board_images(version_id, position_index);

-- ============================================================================
-- 6. BIG5 BUCKETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.big5_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.clarity_journeys(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL CHECK (order_index >= 0 AND order_index <= 4),
  title TEXT NOT NULL,
  statement TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  -- Ensure unique order_index per journey
  UNIQUE(journey_id, order_index)
);

-- Enable RLS on big5_buckets table
ALTER TABLE public.big5_buckets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for big5_buckets
CREATE POLICY "Users can view Big 5 buckets for their journeys"
  ON public.big5_buckets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = big5_buckets.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Big 5 buckets for their journeys"
  ON public.big5_buckets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = big5_buckets.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update Big 5 buckets for their journeys"
  ON public.big5_buckets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = big5_buckets.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = big5_buckets.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete Big 5 buckets for their journeys"
  ON public.big5_buckets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clarity_journeys
      WHERE clarity_journeys.id = big5_buckets.journey_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

-- Indexes for big5_buckets
CREATE INDEX IF NOT EXISTS big5_buckets_journey_id_idx ON public.big5_buckets(journey_id);
CREATE INDEX IF NOT EXISTS big5_buckets_order_index_idx ON public.big5_buckets(journey_id, order_index);

-- ============================================================================
-- 7. BIG5 OKRS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.big5_okrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id UUID NOT NULL REFERENCES public.big5_buckets(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('boolean', 'number', 'percentage', 'other')),
  target_value_number NUMERIC,
  target_value_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on big5_okrs table
ALTER TABLE public.big5_okrs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for big5_okrs
CREATE POLICY "Users can view OKRs for their journeys"
  ON public.big5_okrs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.big5_buckets
      JOIN public.clarity_journeys ON clarity_journeys.id = big5_buckets.journey_id
      WHERE big5_buckets.id = big5_okrs.bucket_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert OKRs for their journeys"
  ON public.big5_okrs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.big5_buckets
      JOIN public.clarity_journeys ON clarity_journeys.id = big5_buckets.journey_id
      WHERE big5_buckets.id = big5_okrs.bucket_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update OKRs for their journeys"
  ON public.big5_okrs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.big5_buckets
      JOIN public.clarity_journeys ON clarity_journeys.id = big5_buckets.journey_id
      WHERE big5_buckets.id = big5_okrs.bucket_id
      AND clarity_journeys.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.big5_buckets
      JOIN public.clarity_journeys ON clarity_journeys.id = big5_buckets.journey_id
      WHERE big5_buckets.id = big5_okrs.bucket_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete OKRs for their journeys"
  ON public.big5_okrs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.big5_buckets
      JOIN public.clarity_journeys ON clarity_journeys.id = big5_buckets.journey_id
      WHERE big5_buckets.id = big5_okrs.bucket_id
      AND clarity_journeys.user_id = auth.uid()
    )
  );

-- Indexes for big5_okrs
CREATE INDEX IF NOT EXISTS big5_okrs_bucket_id_idx ON public.big5_okrs(bucket_id);
CREATE INDEX IF NOT EXISTS big5_okrs_order_index_idx ON public.big5_okrs(bucket_id, order_index);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
-- Reuse existing handle_updated_at function if it exists, otherwise create it
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all tables that have it
DROP TRIGGER IF EXISTS on_clarity_journey_updated ON public.clarity_journeys;
CREATE TRIGGER on_clarity_journey_updated
  BEFORE UPDATE ON public.clarity_journeys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_wheel_of_life_area_updated ON public.wheel_of_life_areas;
CREATE TRIGGER on_wheel_of_life_area_updated
  BEFORE UPDATE ON public.wheel_of_life_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_swot_entry_updated ON public.swot_entries;
CREATE TRIGGER on_swot_entry_updated
  BEFORE UPDATE ON public.swot_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_big5_bucket_updated ON public.big5_buckets;
CREATE TRIGGER on_big5_bucket_updated
  BEFORE UPDATE ON public.big5_buckets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_big5_okr_updated ON public.big5_okrs;
CREATE TRIGGER on_big5_okr_updated
  BEFORE UPDATE ON public.big5_okrs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- STORAGE BUCKET: VISION BOARD
-- ============================================================================
-- Create storage bucket for vision board images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vision-board',
  'vision-board',
  false, -- Private bucket (users can only access their own images)
  10485760, -- 10MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can upload vision board images for their journeys" ON storage.objects;
DROP POLICY IF EXISTS "Users can update vision board images for their journeys" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete vision board images for their journeys" ON storage.objects;
DROP POLICY IF EXISTS "Users can view vision board images for their journeys" ON storage.objects;

-- Storage policies for vision-board bucket
-- Path format: vision-board/{user_id}/{journey_id}/{filename}
-- Users can upload images for their own journeys
CREATE POLICY "Users can upload vision board images for their journeys"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'vision-board' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own vision board images
CREATE POLICY "Users can update vision board images for their journeys"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'vision-board' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'vision-board' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own vision board images
CREATE POLICY "Users can delete vision board images for their journeys"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'vision-board' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own vision board images
CREATE POLICY "Users can view vision board images for their journeys"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'vision-board' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- GRANTS
-- ============================================================================
-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clarity_journeys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wheel_of_life_areas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.swot_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vision_board_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vision_board_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.big5_buckets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.big5_okrs TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE public.clarity_journeys IS 'Main table for Clarity Wizard journeys. Each journey represents a user-defined focus period with selected tools.';
COMMENT ON COLUMN public.clarity_journeys.status IS 'Journey status: draft (in progress), completed (finished), archived (hidden)';
COMMENT ON TABLE public.wheel_of_life_areas IS 'Life areas and scores for the Wheel of Life exercise. Each area is rated 1-10.';
COMMENT ON TABLE public.swot_entries IS 'SWOT analysis entries. Type can be strength, weakness, opportunity, or threat.';
COMMENT ON TABLE public.vision_board_versions IS 'Version control for vision boards. Draft versions (is_committed=false) are autosaved. Committed versions (is_committed=true) are explicitly saved and used elsewhere.';
COMMENT ON TABLE public.vision_board_images IS 'Images associated with vision board versions. Storage path references files in the vision-board storage bucket.';
COMMENT ON TABLE public.big5_buckets IS 'The 5 main outcome buckets for a journey. Each has a title and statement following the template: "[Who] will [change] so that [benefit]".';
COMMENT ON TABLE public.big5_okrs IS 'Key Results (OKRs) for each Big 5 bucket. Each bucket can have multiple OKRs with different metric types.';

