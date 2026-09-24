#!/usr/bin/env bash
set -euo pipefail
repo_dir="$(cd "$(dirname "$0")/../.." && pwd)"
pg_bin="${POSTGRES_BIN:-}"
if [ -z "$pg_bin" ]; then
  if command -v mise >/dev/null 2>&1 && mise which postgres >/dev/null 2>&1; then
    pg_bin="$(dirname "$(mise which postgres)")"
  else
    pg_bin="$(dirname "$(command -v postgres)")"
  fi
fi
test_dir="$(mktemp -d "${TMPDIR:-/tmp}/mogubiyori-postgres.XXXXXX")"
cleanup() {
  "$pg_bin/pg_ctl" -D "$test_dir/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$test_dir"
}
trap cleanup EXIT
"$pg_bin/initdb" -D "$test_dir/data" --auth=trust --no-locale >"$test_dir/init.log"
"$pg_bin/pg_ctl" -D "$test_dir/data" -l "$test_dir/server.log" -o "-k $test_dir -h '' -p 55438" -w start >/dev/null
sql=("$pg_bin/psql" -h "$test_dir" -p 55438 -d postgres -v ON_ERROR_STOP=1 -X -q)
"${sql[@]}" -f "$repo_dir/supabase/tests/bootstrap.sql"
"${sql[@]}" -f "$repo_dir/supabase/migrations/20260925000000_game.sql"
"${sql[@]}" -f "$repo_dir/supabase/tests/game.sql"
# The first session holds the user row lock while the second sends the same
# operation. Exactly one commit and one replay must result.
commit="select public.commit_game_command('00000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',repeat('e',64),'feed',1,'{\"coins\":180}',null)->>'status';"
"${sql[@]}" -At -c "begin; set local role service_role; $commit select pg_sleep(0.2); commit;" >"$test_dir/first" &
first_pid=$!
"${sql[@]}" -At -c "set role service_role; $commit" >"$test_dir/second" &
second_pid=$!
wait "$first_pid"
wait "$second_pid"
results="$(cat "$test_dir/first" "$test_dir/second" | sed '/^$/d' | sort)"
test "$results" = $'applied\nreplayed'
"${sql[@]}" -c "do \$\$ begin if (select revision from public.game_states where user_id='00000000-0000-4000-8000-000000000001') <> 2 then raise exception 'concurrent duplicate changed revision'; end if; end \$\$;"
printf '%s\n' 'PostgreSQL migration, permissions, atomicity, photo ownership, and concurrent idempotency passed.'
