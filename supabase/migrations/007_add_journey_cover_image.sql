-- Add cover image support to clarity journeys
-- Adds storage bucket and column to store journey cover images

-- ============================================================================
-- 1. ADD COVER_IMAGE_URL COLUMN TO CLARITY_JOURNEYS
-- ============================================================================
ALTER TABLE public.clarity_journeys
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

COMMENT ON COLUMN public.clarity_journeys.cover_image_url IS 'Public URL of the journey cover image stored in Supabase storage';

-- ============================================================================
-- 2. CREATE STORAGE BUCKET FOR JOURNEY COVERS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journey-covers',
  'journey-covers',
  true, -- Public bucket so images can be displayed without auth
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. STORAGE POLICIES FOR JOURNEY-COVERS BUCKET
-- ============================================================================
-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can upload journey covers for their journeys" ON storage.objects;
DROP POLICY IF EXISTS "Users can update journey covers for their journeys" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete journey covers for their journeys" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view journey covers" ON storage.objects;

-- Path format: journey-covers/{user_id}/{journey_id}/{filename}
-- Users can upload images for their own journeys
CREATE POLICY "Users can upload journey covers for their journeys"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'journey-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own journey covers
CREATE POLICY "Users can update journey covers for their journeys"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'journey-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'journey-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own journey covers
CREATE POLICY "Users can delete journey covers for their journeys"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'journey-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can view journey covers (public bucket)
CREATE POLICY "Anyone can view journey covers"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'journey-covers');

