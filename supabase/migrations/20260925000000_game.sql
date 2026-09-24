-- Game writes are performed by the authenticated Worker using service_role.
-- Browser anon/authenticated roles have neither table access nor RPC execution.
create table public.game_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  schema_version integer not null default 1,
  rules_version integer not null default 2,
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);

create table public.game_operations (
  user_id uuid not null references public.game_states(user_id) on delete cascade,
  operation_id uuid not null,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  kind text not null,
  receipt jsonb,
  committed_revision bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);

create table public.photo_assets (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  object_key text not null unique,
  bytes integer not null check (bytes > 0 and bytes <= 2097152),
  mime text not null check (mime in ('image/jpeg', 'image/png', 'image/webp')),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  status text not null check (status in ('uploading', 'uploaded')),
  meal_id text,
  created_at timestamptz not null default now(),
  check (object_key = user_id::text || '/' || id::text)
);
create index photo_assets_user_id_idx on public.photo_assets(user_id);

alter table public.game_states enable row level security;
alter table public.game_operations enable row level security;
alter table public.photo_assets enable row level security;
revoke all on public.game_states, public.game_operations, public.photo_assets from public, anon, authenticated;
grant select, insert, update, delete on public.game_states, public.game_operations, public.photo_assets to service_role;

create function public.bootstrap_game(p_user_id uuid, p_state jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_game public.game_states%rowtype;
begin
  insert into public.game_states(user_id, state) values (p_user_id, p_state)
    on conflict (user_id) do nothing;
  select * into strict v_game from public.game_states where user_id = p_user_id;
  return jsonb_build_object('state', v_game.state, 'revision', v_game.revision);
end;
$$;

create function public.commit_game_command(
  p_user_id uuid,
  p_operation_id uuid,
  p_request_hash text,
  p_kind text,
  p_expected_revision bigint,
  p_state jsonb,
  p_receipt jsonb,
  p_photo_id uuid default null,
  p_meal_id text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_game public.game_states%rowtype;
  v_operation public.game_operations%rowtype;
  v_photo public.photo_assets%rowtype;
begin
  -- Serialize each user's commits. Duplicate checks happen after this lock,
  -- so simultaneous deliveries cannot both award rewards.
  select * into v_game from public.game_states where user_id = p_user_id for update;
  if not found then return jsonb_build_object('status', 'conflict'); end if;
  select * into v_operation from public.game_operations
    where user_id = p_user_id and operation_id = p_operation_id;
  if found then
    if v_operation.request_hash <> p_request_hash then
      return jsonb_build_object('status', 'operation_mismatch');
    end if;
    return jsonb_build_object('status', 'replayed',
      'snapshot', jsonb_build_object('state', v_game.state, 'revision', v_game.revision),
      'receipt', v_operation.receipt);
  end if;
  if v_game.revision <> p_expected_revision then
    return jsonb_build_object('status', 'conflict');
  end if;
  if p_photo_id is not null then
    select * into v_photo from public.photo_assets
      where id = p_photo_id and user_id = p_user_id for update;
    if not found or v_photo.status <> 'uploaded' or v_photo.meal_id is not null or p_meal_id is null then
      return jsonb_build_object('status', 'invalid_photo');
    end if;
    update public.photo_assets set meal_id = p_meal_id where id = p_photo_id and user_id = p_user_id;
  end if;
  update public.game_states set state = p_state, revision = revision + 1, updated_at = now()
    where user_id = p_user_id returning * into v_game;
  insert into public.game_operations(user_id, operation_id, request_hash, kind, receipt, committed_revision)
    values (p_user_id, p_operation_id, p_request_hash, p_kind, p_receipt, v_game.revision);
  return jsonb_build_object('status', 'applied',
    'snapshot', jsonb_build_object('state', v_game.state, 'revision', v_game.revision),
    'receipt', p_receipt);
end;
$$;

revoke all on function public.bootstrap_game(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.commit_game_command(uuid, uuid, text, text, bigint, jsonb, jsonb, uuid, text) from public, anon, authenticated;
grant execute on function public.bootstrap_game(uuid, jsonb) to service_role;
grant execute on function public.commit_game_command(uuid, uuid, text, text, bigint, jsonb, jsonb, uuid, text) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);
-- No browser storage policies are created. Upload and short-lived read URLs
-- are issued by the Worker after checking the authenticated user's ownership.
