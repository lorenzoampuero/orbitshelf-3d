-- 0002: photo-set and text-to-3D generation, plus apparel and footwear categories.
-- Additive: existing rows keep working (new columns are nullable or have defaults).

-- Categories: add apparel and footwear (shops selling clothing and shoes are the main audience).
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('apparel', 'footwear', 'furniture', 'home-decor', 'lighting', 'accessories', 'other'));

-- How a paid job starts: one photo, several photos of the same object, or a text description.
ALTER TABLE public.asset_jobs
  ADD COLUMN IF NOT EXISTS input_kind text CHECK (input_kind IN ('image', 'multi-image', 'text')),
  ADD COLUMN IF NOT EXISTS prompt text CHECK (prompt IS NULL OR char_length(prompt) BETWEEN 10 AND 1000);

-- A text job has a prompt and no photos; the other kinds have no prompt.
ALTER TABLE public.asset_jobs
  ADD CONSTRAINT asset_jobs_prompt_matches_kind
  CHECK ((input_kind = 'text') = (prompt IS NOT NULL)) NOT VALID;

-- Which side of the product each uploaded photo shows. Existing uploads are front photos.
ALTER TABLE public.asset_uploads
  ADD COLUMN IF NOT EXISTS view text NOT NULL DEFAULT 'front' CHECK (view IN ('front', 'left', 'back', 'right'));
