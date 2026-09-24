insert into auth.users(id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');

do $$
declare
  a uuid := '00000000-0000-4000-8000-000000000001';
  b uuid := '00000000-0000-4000-8000-000000000002';
  op uuid := '10000000-0000-4000-8000-000000000001';
  photo uuid := '20000000-0000-4000-8000-000000000001';
  result jsonb;
begin
  if has_table_privilege('authenticated', 'public.game_states', 'SELECT') then raise exception 'browser read granted'; end if;
  if has_table_privilege('anon', 'public.photo_assets', 'INSERT') then raise exception 'browser photo write granted'; end if;
  if has_function_privilege('authenticated', 'public.bootstrap_game(uuid,jsonb)', 'EXECUTE') then raise exception 'browser bootstrap granted'; end if;
  if has_function_privilege('anon', 'public.commit_game_command(uuid,uuid,text,text,bigint,jsonb,jsonb,uuid,text)', 'EXECUTE') then raise exception 'browser commit granted'; end if;
  if not (select relrowsecurity from pg_class where oid = 'public.game_states'::regclass) then raise exception 'RLS disabled'; end if;
  if (select public from storage.buckets where id = 'meal-photos') then raise exception 'public photo bucket'; end if;
  set local role service_role;
  result := public.bootstrap_game(a, '{"coins":120}');
  if result->>'revision' <> '0' then raise exception 'wrong initial revision'; end if;
  perform public.bootstrap_game(a, '{"coins":999}');
  perform public.bootstrap_game(b, '{"coins":120}');
  if (select state->>'coins' from public.game_states where user_id = a) <> '120' then raise exception 'bootstrap overwrote save'; end if;
  result := public.commit_game_command(a, op, repeat('a',64), 'feed', 0, '{"coins":150}', '{"coins":30}');
  if result->>'status' <> 'applied' then raise exception 'first commit failed'; end if;
  result := public.commit_game_command(a, op, repeat('a',64), 'feed', 0, '{"coins":180}', '{"coins":99}');
  if result->>'status' <> 'replayed' or result#>>'{receipt,coins}' <> '30' then raise exception 'replay changed receipt'; end if;
  if result#>>'{snapshot,state,coins}' <> '150' or result#>>'{snapshot,revision}' <> '1' then raise exception 'replay mutated state'; end if;
  result := public.commit_game_command(a, op, repeat('b',64), 'feed', 1, '{"coins":999}', null);
  if result->>'status' <> 'operation_mismatch' then raise exception 'operation collision accepted'; end if;
  result := public.commit_game_command(a, '10000000-0000-4000-8000-000000000002', repeat('b',64), 'feed', 0, '{"coins":999}', null);
  if result->>'status' <> 'conflict' then raise exception 'stale write accepted'; end if;
  insert into public.photo_assets(id,user_id,object_key,bytes,mime,content_hash,status)
    values(photo,b,b::text||'/'||photo::text,100,'image/png',repeat('c',64),'uploaded');
  result := public.commit_game_command(a, '10000000-0000-4000-8000-000000000003', repeat('c',64), 'feed', 1, '{"coins":180}', null, photo, 'meal-a');
  if result->>'status' <> 'invalid_photo' then raise exception 'foreign photo accepted'; end if;
  if (select revision from public.game_states where user_id=a) <> 1 then raise exception 'invalid photo partially committed'; end if;
  result := public.commit_game_command(b, op, repeat('a',64), 'feed', 0, '{"coins":150}', null, photo, 'meal-b');
  if result->>'status' <> 'applied' then raise exception 'owned photo rejected'; end if;
  if (select meal_id from public.photo_assets where id=photo) <> 'meal-b' then raise exception 'photo not linked'; end if;
  result := public.commit_game_command(b, '10000000-0000-4000-8000-000000000002', repeat('d',64), 'feed', 1, '{"coins":180}', null, photo, 'another-meal');
  if result->>'status' <> 'invalid_photo' then raise exception 'photo reused'; end if;
  -- A failed transaction must roll back both state and photo linkage.
  insert into public.photo_assets(id,user_id,object_key,bytes,mime,content_hash,status)
    values('20000000-0000-4000-8000-000000000002',a,a::text||'/20000000-0000-4000-8000-000000000002',100,'image/png',repeat('f',64),'uploaded');
  begin
    perform public.commit_game_command(a, '10000000-0000-4000-8000-000000000004', 'invalid-hash', 'feed', 1, '{"coins":999}', null, '20000000-0000-4000-8000-000000000002', 'rolled-back-meal');
    raise exception 'invalid hash accepted';
  exception when check_violation then null;
  end;
  if (select state->>'coins' from public.game_states where user_id=a) <> '150' then raise exception 'transaction did not roll back'; end if;
  if (select meal_id from public.photo_assets where id='20000000-0000-4000-8000-000000000002') is not null then raise exception 'photo linkage did not roll back'; end if;
end;
$$;
