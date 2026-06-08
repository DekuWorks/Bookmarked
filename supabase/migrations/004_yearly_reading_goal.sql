-- Yearly reading goal on profiles

alter table public.profiles
  add column if not exists yearly_reading_goal integer
  check (
    yearly_reading_goal is null
    or (yearly_reading_goal >= 1 and yearly_reading_goal <= 500)
  );
