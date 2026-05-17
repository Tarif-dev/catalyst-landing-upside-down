-- Add gender column to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text DEFAULT NULL;

-- Normalize any older draft value before tightening the constraint.
UPDATE public.profiles
SET gender = CASE lower(gender)
  WHEN 'male' THEN 'male'
  WHEN 'female' THEN 'female'
  WHEN 'other' THEN 'others'
  WHEN 'others' THEN 'others'
  ELSE gender
END
WHERE gender IS NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_gender_check;

-- Add a CHECK constraint to restrict values
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_gender_check
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'others'));
