-- ============================================================================
-- GutTracker — Esquema de base de datos + seguridad + storage
-- Ejecutar en Supabase: SQL Editor → New query → pegar todo → Run.
-- Es idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

-- ───────────────────────────── Tablas ─────────────────────────────

create table if not exists public.days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  stress int check (stress between 1 and 5),
  notes text,
  created_at timestamptz default now(),
  unique (user_id, date)
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days(id) on delete cascade,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','extra')),
  name text,
  feel text check (feel in ('bien','mal')),
  stomach_intensity int check (stomach_intensity between 0 and 5),
  taste_intensity int check (taste_intensity between 0 and 5),
  symptom_time text,        -- 'Inmediato' | '1–2 h' | '3–6 h' | 'Día siguiente'
  extra_symptoms text,
  photo_url text,           -- ruta del objeto en el bucket meal-photos
  created_at timestamptz default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  source text check (source in ('manual','ai_extracted')),
  created_at timestamptz default now()
);

-- Índices para consultas por día / por comida.
create index if not exists idx_days_user_date on public.days(user_id, date);
create index if not exists idx_meals_day on public.meals(day_id);
create index if not exists idx_ingredients_meal on public.ingredients(meal_id);

-- ──────────────────── Row Level Security (RLS) ────────────────────
-- Cada usuario solo puede ver/editar SUS propios datos.

alter table public.days enable row level security;
alter table public.meals enable row level security;
alter table public.ingredients enable row level security;

-- days: propiedad directa por user_id.
drop policy if exists "days_owner" on public.days;
create policy "days_owner" on public.days
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- meals: pertenecen al usuario dueño del día.
drop policy if exists "meals_owner" on public.meals;
create policy "meals_owner" on public.meals
  for all to authenticated
  using (exists (
    select 1 from public.days d
    where d.id = meals.day_id and d.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.days d
    where d.id = meals.day_id and d.user_id = auth.uid()
  ));

-- ingredients: pertenecen al usuario dueño de la comida → del día.
drop policy if exists "ingredients_owner" on public.ingredients;
create policy "ingredients_owner" on public.ingredients
  for all to authenticated
  using (exists (
    select 1 from public.meals m
    join public.days d on d.id = m.day_id
    where m.id = ingredients.meal_id and d.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.meals m
    join public.days d on d.id = m.day_id
    where m.id = ingredients.meal_id and d.user_id = auth.uid()
  ));

-- ───────────────────────── Storage (fotos) ─────────────────────────
-- Bucket privado. Las fotos se guardan en una carpeta por usuario:
--   meal-photos/<user_id>/<uuid>.<ext>

insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

-- Solo el dueño (primera carpeta = su user_id) puede operar sobre sus fotos.
drop policy if exists "meal_photos_select" on storage.objects;
create policy "meal_photos_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "meal_photos_insert" on storage.objects;
create policy "meal_photos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "meal_photos_update" on storage.objects;
create policy "meal_photos_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "meal_photos_delete" on storage.objects;
create policy "meal_photos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
