-- Update profiles table to use first_name and last_name instead of full_name

-- Add new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrate existing data if full_name exists (split by first space)
-- Only update if full_name column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    UPDATE public.profiles
    SET 
      first_name = SPLIT_PART(full_name, ' ', 1),
      last_name = CASE 
        WHEN POSITION(' ' IN full_name) > 0 
        THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
        ELSE ''
      END
    WHERE full_name IS NOT NULL AND full_name != '';
  END IF;
END $$;

-- Remove full_name column
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS full_name;

-- Update the handle_new_user function to not use full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NULL, -- first_name will be set later via ProfileSetupModal
    NULL  -- last_name will be set later via ProfileSetupModal
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comments
COMMENT ON COLUMN public.profiles.first_name IS 'User first name';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name';

