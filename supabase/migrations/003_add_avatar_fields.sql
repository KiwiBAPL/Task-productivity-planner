-- Add avatar fields to profiles table
-- avatar_type: 'preset' or 'upload'
-- avatar_preset: identifier for preset avatar (only used when avatar_type is 'preset')
-- avatar_url: already exists, used for uploaded avatars (when avatar_type is 'upload')

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_type TEXT CHECK (avatar_type IN ('preset', 'upload')),
  ADD COLUMN IF NOT EXISTS avatar_preset TEXT;

-- Update comments
COMMENT ON COLUMN public.profiles.avatar_type IS 'Type of avatar: preset or upload';
COMMENT ON COLUMN public.profiles.avatar_preset IS 'Preset avatar identifier (only used when avatar_type is preset)';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to uploaded avatar image (only used when avatar_type is upload)';

