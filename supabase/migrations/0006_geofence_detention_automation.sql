-- ---------------------------------------------------------------------------
-- ELD LOCATION PINGS (raw truck GPS feed, laying groundwork for
-- geofence-driven detention automation — nothing consumes this table
-- yet, no trigger/cron/edge function processes pings into
-- detention_events. This migration is schema-only scaffolding.)
-- ---------------------------------------------------------------------------
create table eld_location_pings (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  truck_id uuid not null references trucks(id) on delete cascade,
  lat numeric(9,6) not null,
  lng numeric(9,6) not null,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_eld_pings_truck_time on eld_location_pings(truck_id, recorded_at desc);

alter table eld_location_pings enable row level security;
create policy "own company row" on eld_location_pings for all
  using (company_id = auth_company_id()) with check (company_id = auth_company_id());

-- ---------------------------------------------------------------------------
-- detention_events.billable_minutes: switch from a GENERATED ALWAYS
-- STORED column to a plain column populated by a BEFORE INSERT/UPDATE
-- trigger, so future automation can write detention_events rows without
-- fighting Postgres's "cannot insert into generated column" restriction.
-- ---------------------------------------------------------------------------
alter table detention_events alter column billable_minutes drop expression;
alter table detention_events alter column billable_minutes set default 0;

create or replace function compute_detention_billable_minutes()
returns trigger language plpgsql set search_path = public as $$
begin
  new.billable_minutes := greatest(
    0,
    floor(extract(epoch from (coalesce(new.check_out_at, now()) - new.check_in_at)) / 60) - new.free_minutes
  );
  return new;
end;
$$;

create trigger trg_detention_billable_minutes
  before insert or update on detention_events
  for each row execute function compute_detention_billable_minutes();
