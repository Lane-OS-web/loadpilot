-- ============================================================================
-- LoadPilot — Phase 1 schema
-- Multi-tenant by company_id. Every table (except companies) carries
-- company_id + RLS so one carrier can never see another's data.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- COMPANIES (tenant root) + PROFILES (auth.users extension)
-- ---------------------------------------------------------------------------
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  mc_number text,
  dot_number text,
  created_at timestamptz not null default now()
);

create type user_role as enum ('owner', 'dispatcher', 'driver');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  role user_role not null default 'dispatcher',
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

-- Helper used by every RLS policy below: which company is the current user in.
create or replace function auth_company_id()
returns uuid
language sql stable
as $$
  select company_id from profiles where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- TRUCKS
-- ---------------------------------------------------------------------------
create type truck_status as enum ('active', 'maintenance', 'inactive');

create table trucks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  unit_number text not null,
  vin text,
  make text,
  model text,
  year int,
  plate text,
  eld_device_id text,               -- links to Motive/Samsara/Geotab feed
  status truck_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (company_id, unit_number)
);

-- ---------------------------------------------------------------------------
-- DRIVERS
-- ---------------------------------------------------------------------------
create type driver_status as enum ('active', 'on_load', 'off_duty', 'inactive');

create table drivers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null, -- null until driver accepts app invite
  full_name text not null,
  phone text,
  email text,
  cdl_number text,
  cdl_state text,
  cdl_expires_on date,
  medical_card_expires_on date,
  home_terminal text,
  assigned_truck_id uuid references trucks(id) on delete set null,
  status driver_status not null default 'active',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- FACILITIES (shippers/receivers — shared reference data with per-carrier notes)
-- ---------------------------------------------------------------------------
create table facilities (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  address_line1 text,
  city text,
  state text,
  zip text,
  lat numeric(9,6),
  lng numeric(9,6),
  facility_type text,                     -- 'shipper' | 'receiver' | 'both'
  avg_detention_minutes numeric,          -- rolled up from detention_events, updated by trigger/job
  detention_incident_rate numeric,        -- % of visits that hit detention
  appointment_required boolean default false,
  dock_notes text,                        -- driver-facing: "use door 14, check in at guard shack"
  created_at timestamptz not null default now(),
  unique (company_id, name, city, state)
);

-- ---------------------------------------------------------------------------
-- BROKERS (CRM)
-- ---------------------------------------------------------------------------
create table brokers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  mc_number text,
  credit_rating text,                 -- 'A' | 'B' | 'C' | 'D' pulled from a credit API in Phase 4
  avg_days_to_pay numeric,
  contact_name text,
  contact_email text,
  contact_phone text,
  factoring_approved boolean default false,
  notes text,
  loads_booked_count int not null default 0,
  total_revenue numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

-- ---------------------------------------------------------------------------
-- LOADS (the spine of the product)
-- ---------------------------------------------------------------------------
create type load_status as enum (
  'booked', 'dispatched', 'at_pickup', 'in_transit',
  'at_delivery', 'delivered', 'invoiced', 'paid', 'cancelled'
);

create table loads (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  load_number text not null,              -- e.g. LP-48213, human-facing
  broker_id uuid references brokers(id) on delete set null,
  driver_id uuid references drivers(id) on delete set null,
  truck_id uuid references trucks(id) on delete set null,

  origin_facility_id uuid references facilities(id) on delete set null,
  destination_facility_id uuid references facilities(id) on delete set null,
  pickup_appointment timestamptz,
  delivery_appointment timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,

  equipment_type text,                    -- 'reefer' | 'dry_van' | 'flatbed'
  weight_lbs int,
  miles numeric,

  rate_confirmed numeric(10,2),           -- from rate-con parser, source of truth
  rate_invoiced numeric(10,2),            -- what was actually billed
  rate_paid numeric(10,2),                -- what actually landed — drives revenue recovery
  detention_free_minutes int default 120,
  detention_rate_per_hour numeric(8,2),

  status load_status not null default 'booked',
  booked_via text default 'manual',       -- 'manual' | 'autopilot' | 'email_parsed'
  source_board text,                      -- 'DAT' | 'Truckstop' | 'direct'
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, load_number)
);

create index idx_loads_company_status on loads(company_id, status);
create index idx_loads_driver on loads(driver_id);

-- ---------------------------------------------------------------------------
-- DOCUMENTS (rate cons, BOLs, PODs, lumper receipts — AI-tagged)
-- ---------------------------------------------------------------------------
create type document_type as enum (
  'rate_confirmation', 'bill_of_lading', 'proof_of_delivery',
  'lumper_receipt', 'invoice', 'other'
);
create type document_status as enum ('processing', 'filed', 'needs_review', 'missing');

create table documents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  load_id uuid references loads(id) on delete set null,
  uploaded_by uuid references profiles(id) on delete set null,

  doc_type document_type not null default 'other',
  status document_status not null default 'processing',
  storage_path text not null,             -- Supabase Storage object path
  file_name text,
  mime_type text,

  ai_extracted_fields jsonb,              -- raw structured output from the parser
  ai_confidence numeric,                  -- 0–1
  ai_model text,                          -- which model/version parsed it, for audit

  created_at timestamptz not null default now()
);

create index idx_documents_load on documents(load_id);
create index idx_documents_status on documents(company_id, status);

-- ---------------------------------------------------------------------------
-- DETENTION EVENTS (geofence-driven timers feeding revenue recovery)
-- ---------------------------------------------------------------------------
create table detention_events (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  load_id uuid not null references loads(id) on delete cascade,
  facility_id uuid references facilities(id) on delete set null,
  check_in_at timestamptz not null,
  check_out_at timestamptz,
  free_minutes int not null default 120,
  billable_minutes int generated always as (
    greatest(0, extract(epoch from (coalesce(check_out_at, now()) - check_in_at)) / 60 - free_minutes)
  ) stored,
  rate_per_hour numeric(8,2),
  claim_status text default 'accruing',   -- 'accruing' | 'ready_to_bill' | 'submitted' | 'approved' | 'denied'
  created_at timestamptz not null default now()
);

create index idx_detention_load on detention_events(load_id);

-- ---------------------------------------------------------------------------
-- REVENUE RECOVERY ITEMS (short pays, unbilled accessorials, denied detention)
-- ---------------------------------------------------------------------------
create type recovery_type as enum ('short_pay', 'unbilled_detention', 'unbilled_accessorial', 'duplicate_deduction');
create type recovery_status as enum ('flagged', 'disputed', 'recovered', 'written_off');

create table revenue_recovery_items (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  load_id uuid not null references loads(id) on delete cascade,
  type recovery_type not null,
  expected_amount numeric(10,2) not null,
  actual_amount numeric(10,2) not null,
  variance numeric(10,2) generated always as (expected_amount - actual_amount) stored,
  status recovery_status not null default 'flagged',
  detected_by text default 'system',      -- 'system' | user id
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- EMAIL PARSE LOG (inbound broker emails → structured load/rate-con data)
-- ---------------------------------------------------------------------------
create type email_parse_status as enum ('received', 'parsed', 'needs_review', 'linked', 'discarded');

create table email_parse_log (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  from_address text,
  subject text,
  raw_body text,
  ai_extracted jsonb,
  ai_confidence numeric,
  status email_parse_status not null default 'received',
  linked_load_id uuid references loads(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger for loads
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_loads_updated_at
  before update on loads
  for each row execute function set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY — every table scoped to the caller's company_id
-- ============================================================================
alter table companies enable row level security;
alter table profiles enable row level security;
alter table trucks enable row level security;
alter table drivers enable row level security;
alter table facilities enable row level security;
alter table brokers enable row level security;
alter table loads enable row level security;
alter table documents enable row level security;
alter table detention_events enable row level security;
alter table revenue_recovery_items enable row level security;
alter table email_parse_log enable row level security;

create policy "own company row" on profiles for select using (company_id = auth_company_id());
create policy "own company row" on trucks for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create policy "own company row" on drivers for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create policy "own company row" on facilities for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create policy "own company row" on brokers for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create policy "own company row" on loads for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create policy "own company row" on documents for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create policy "own company row" on detention_events for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create policy "own company row" on revenue_recovery_items for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create policy "own company row" on email_parse_log for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());

-- A user may read their own company row (needed to bootstrap after signup).
create policy "read own company" on companies for select using (
  id = auth_company_id()
);

-- ---------------------------------------------------------------------------
-- New-user bootstrap: signup creates a company + owner profile atomically.
-- Called from the Next.js signup route via rpc(), not client-side inserts,
-- so a new user can never insert into an arbitrary company_id.
-- ---------------------------------------------------------------------------
create or replace function create_company_and_owner(company_name text, owner_full_name text)
returns uuid
language plpgsql security definer as $$
declare
  new_company_id uuid;
begin
  insert into companies (name) values (company_name) returning id into new_company_id;
  insert into profiles (id, company_id, role, full_name)
    values (auth.uid(), new_company_id, 'owner', owner_full_name);
  return new_company_id;
end;
$$;
