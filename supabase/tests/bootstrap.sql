-- Minimal Supabase-owned objects for testing our SQL on stock PostgreSQL.
-- This does not emulate Supabase Auth or Storage HTTP services.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key);
create schema storage;
create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
grant usage on schema public to service_role, anon, authenticated;
