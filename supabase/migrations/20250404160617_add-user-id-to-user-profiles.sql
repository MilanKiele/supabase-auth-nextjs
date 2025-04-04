alter table public.user_profiles
add column user_id uuid references auth.users(id) on delete cascade;
