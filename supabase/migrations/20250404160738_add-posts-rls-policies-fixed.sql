-- RLS aktivieren
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- SELECT: alle authentifizierten dürfen lesen
CREATE POLICY select_all_posts ON public.posts
FOR SELECT TO authenticated
USING (true);

-- INSERT: nur eigene Profile
CREATE POLICY insert_own_post ON public.posts
FOR INSERT TO authenticated
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

-- UPDATE: nur eigene Posts
CREATE POLICY update_own_post ON public.posts
FOR UPDATE TO authenticated
USING (
  profile_id IN (
    SELECT id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

-- DELETE: nur eigene Posts
CREATE POLICY delete_own_post ON public.posts
FOR DELETE TO authenticated
USING (
  profile_id IN (
    SELECT id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);
