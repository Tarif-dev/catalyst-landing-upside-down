-- ============================================================
-- Volunteers table — people who can scan QR codes but not admin
-- (Created FIRST because checkins RLS references it)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.volunteers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- Only admins can manage volunteers
CREATE POLICY "Admins manage volunteers"
  ON public.volunteers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Volunteers can read their own row (to verify they have access)
CREATE POLICY "Volunteers read own row"
  ON public.volunteers FOR SELECT
  USING (id = auth.uid());


-- ============================================================
-- Checkins table — tracks gate entry, check-in, and meal usage
-- Only verified (paid) participants should have rows (enforced by app logic)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_code text NOT NULL UNIQUE REFERENCES public.profiles(pass_code) ON DELETE CASCADE,
  gate_entry boolean NOT NULL DEFAULT false,
  checked_in boolean NOT NULL DEFAULT false,
  meal_1 boolean NOT NULL DEFAULT false,
  meal_2 boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only admins and volunteers can read/write
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on checkins"
  ON public.checkins FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.volunteers WHERE id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.volunteers WHERE id = auth.uid())
  );

-- Fast lookup by pass_code
CREATE INDEX IF NOT EXISTS idx_checkins_pass_code ON public.checkins(pass_code);
