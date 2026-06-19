-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── niche_templates ──────────────────────────────────────────────────────────
create table if not exists niche_templates (
  id                 uuid primary key default gen_random_uuid(),
  niche_key          text not null unique,
  display_name       text not null,
  first_message      text not null,
  system_prompt      text not null,
  services           text[] not null default '{}',
  faqs               jsonb not null default '[]',
  booking_categories text[] not null default '{}'
);

-- ── demo_requests ─────────────────────────────────────────────────────────────
create table if not exists demo_requests (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  niche_key     text not null references niche_templates(niche_key) on update cascade,
  phone_number  text not null,
  consent_given boolean not null default false,
  call_status   text not null default 'queued'
                  check (call_status in ('queued', 'in-progress', 'completed', 'failed')),
  transcript    text,
  booked_demo   boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists demo_requests_niche_key_idx on demo_requests(niche_key);
create index if not exists demo_requests_created_at_idx on demo_requests(created_at desc);
