create table posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  title text not null,
  content text,
  created_at timestamp with time zone default now(),

  constraint fk_profile foreign key (profile_id)
    references user_profiles(id)
    on delete cascade
);
