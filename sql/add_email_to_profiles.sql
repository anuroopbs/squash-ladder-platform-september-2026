-- ============================================================================
-- ADD EMAIL COLUMN TO PROFILES + BACKFILL
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/2aa03c76-3a39-48de-86d1-372d1ca5cbcd
-- ============================================================================

-- Step 1: Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Update the handle_new_user trigger to capture email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Backfill existing users (this runs as postgres, bypasses RLS)
-- WARNING: This updates ALL profiles. Run only once.
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND p.email IS NULL;

-- Step 4: Verify
SELECT display_name, email, phone
FROM public.profiles
WHERE email IS NOT NULL
ORDER BY display_name;
