# 実行環境とクラウド接続

この構成は、スマートフォン・PCのブラウザで利用するWebアプリを対象とする。画面はReact/ViteのSPA、HTTP APIはCloudflare Workers、認証・ゲーム保存・非公開写真はSupabaseを使う。初期利用はハッカソンや限定体験の数十人を想定する。

Supabaseは無料プランの`mogubiyori`（project ref: `haocdgtvhhyrbavntrym`、Tokyo）を使用する。匿名認証とDB・private Storageは設定済み。Google OAuth clientは別途設定する。公開フロントエンドのcloud切替と実際の利用枠は接続先ごとに確認する。

実装前の費用試算・運用案は[2026-09-24の設計記録](./decisions/infrastructure-2026-09-24.md)に保存している。現在の実装範囲と接続手順は本書を参照する。

## 実行する場所

| 処理                                           | 実行場所                 |
| ---------------------------------------------- | ------------------------ |
| Reactの描画、DOM/SVG、写真の縮小、食事の下書き | 利用者のブラウザ         |
| JavaScript・CSS・画像・フォントの配信          | Workers Static Assets    |
| `/api/*`、認証確認、料理認識、ゲーム操作の計算 | Cloudflare Worker        |
| ログイン・セッション更新・Google identity連携  | Supabase Auth            |
| 育成状態、操作の再送記録、写真の所有者情報     | Supabase PostgreSQL      |
| 写真本体                                       | Supabase private Storage |
| 料理写真の推論                                 | Workers AI               |

サーバーでReactを描画するSSRや常駐Node.jsサーバーは用意しない。Node.jsとpnpmは開発・ビルド用であり、本番APIのランタイムはWorkerである。WorkerとSupabaseの接続はHTTP APIとDB関数の呼び出しを使う。PostgreSQLのTCP接続やORMは追加していない。

`wrangler.jsonc`はSPA fallbackと`/api`だけの`run_worker_first`を指定する。通常の静的配信までAPI処理を経由させない。Supabaseの地域は日本の利用者向けにTokyoを第一候補とするが、WorkerやAIを含む全処理の国内限定を表すものではない。

## localとcloud

| 設定                   | 保存先                    | 認証                             | 利用目的                               |
| ---------------------- | ------------------------- | -------------------------------- | -------------------------------------- |
| `VITE_GAME_MODE=local` | ブラウザの`mogubiyori-v1` | 不要                             | 既存セーブを使うローカル体験・UI開発   |
| `VITE_GAME_MODE=cloud` | Supabase                  | 自動の匿名認証・任意のGoogle連携 | 複数端末での継続・サーバーでの操作確定 |

`VITE_GAME_MODE`を省略すると、SupabaseのURLと公開キーがある環境はcloud、どちらもない開発環境はlocalになる。片方だけの設定はエラーとして扱う。`VITE_GAME_MODE=local`の明示はSupabase設定より優先する。

localでもAPIを利用できれば写真認識を呼べる。認識できないときは手動選択で進める。cloudの設定不足やサービス障害ではエラーを表示し、localへ自動で切り替えない。日付送り、試用ジェム追加、セーブリセットはlocalだけに表示する。

`VITE_*`はビルド時にブラウザ向けコードへ取り込まれる。localからcloudへ切り替えた公開物を作る場合は、環境変数を設定して再ビルドする。

## 開発環境

Node.jsとpnpmの条件は`package.json`にある。依存をインストールした後、`pnpm dev`でViteとWorkerを起動する。Cloudflare Vite pluginが同じ開発サーバーにAPIを接続するため、ViteとWranglerを別ターミナルで起動する必要はない。8787番を使う場合は`pnpm dev:cloudflare`を使う。

ブラウザ用設定は`.env.example`を参考に`.env.local`へ、Worker用設定は`.dev.vars.example`を参考に`.dev.vars`へ置く。秘密値をGitへ追加しない。

`AI` bindingは`remote: true`を指定しているが、通常の`pnpm dev`ではpluginのリモートbindingを無効にする。`pnpm dev:cloudflare`または`CLOUDFLARE_REMOTE_BINDINGS=true pnpm dev`で実モデルへ接続したときは、Cloudflareアカウント側で推論が行われる。E2E用のVite test modeはCloudflare pluginを外し、認識APIをmockにする。

## Supabaseの準備

Supabase CLIはdevDependencyにバージョンを固定している。原則CLIで管理し、`pnpm exec supabase`を使う。認証は`pnpm exec supabase login`で行い、アクセストークンやDBパスワードをGitに追加しない。project linkは作業ディレクトリごとの`supabase/.temp/`に保存され、Gitの対象外になる。

```sh
pnpm exec supabase login
pnpm exec supabase link --project-ref haocdgtvhhyrbavntrym
pnpm exec supabase db push --linked --dry-run
pnpm exec supabase db push --linked
pnpm exec supabase config diff --project-ref haocdgtvhhyrbavntrym
pnpm exec supabase config push --project-ref haocdgtvhhyrbavntrym
```

[migration](../supabase/migrations/20260925000000_game.sql)は上記projectへ適用済み。以後の変更は新しいmigrationを追加し、dry-runで対象を確認してから適用する。初期SQLをSQL Editorで繰り返し実行しない。

[config.toml](../supabase/config.toml)は公開origin、callback、匿名認証、identity linking、匿名登録の上限だけを宣言する。固定したCLIでは未宣言のリモート設定を維持するため、`supabase init`の全既定値で既存設定を上書きしない。push前にdiffの`update`を確認する。同じ会場Wi-Fiで数十人が開始できるよう、匿名登録の上限は100回/IP/時にしている。

migrationは次を作成する。

| 対象                  | 内容                                                                     |
| --------------------- | ------------------------------------------------------------------------ |
| `game_states`         | ユーザーごとの状態JSON、revision、schema/rules version                   |
| `game_operations`     | 操作IDと入力hash、確定revision、給餌receipt                              |
| `photo_assets`        | 所有者、object key、サイズ、形式、hash、アップロード状態、食事への紐付け |
| `bootstrap_game`      | 未作成のゲームを競合なく初期化                                           |
| `commit_game_command` | revision・操作ID・写真を確認して一括確定                                 |
| `meal-photos` bucket  | private、2MiB以下、JPEG・PNG・WebP                                       |

アプリのテーブルはRLSを有効にし、`anon`/`authenticated`からの直接アクセスと保存RPCの実行権限を外す。Workerはservice-role keyを使い、Bearer tokenの`auth.getUser`で確認したUUIDを所有者として扱う。リクエスト本文からユーザーIDを受け取らない。

Workerのservice-role keyはRLSを迂回できるため、WorkerとRPCの所有者確認が認可の境界になる。ブラウザにはservice-role keyを渡さない。

### 接続値

| 変数                            | 配置                                | 内容                        |
| ------------------------------- | ----------------------------------- | --------------------------- |
| `VITE_GAME_MODE`                | ブラウザのビルド環境                | `local`または`cloud`        |
| `VITE_SUPABASE_URL`             | ブラウザのビルド環境                | cloudのSupabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ブラウザのビルド環境                | 公開可能なキー              |
| `VITE_GOOGLE_AUTH_ENABLED`      | ブラウザのビルド環境                | Google設定後だけ`true`      |
| `SUPABASE_URL`                  | Worker環境                          | 同じSupabase projectのURL   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Worker Secret / ローカル`.dev.vars` | サーバー専用キー            |
| `SUPABASE_PHOTO_BUCKET`         | Worker環境                          | 既定`meal-photos`           |

本番のサーバー専用キーはWranglerのSecretへ登録する。別bucketを指定する場合は、migrationが作るbucketとは別にprivate設定・サイズ制限・形式制限を揃える。

### Authの設定

Supabaseで[匿名サインイン](https://supabase.com/docs/guides/auth/auth-anonymous)を有効にする。cloudの起動時には保存済みセッションを復元し、セッションがなければ自動で匿名ユーザーを作成する。初回の認証方法選択やGoogleログインは通常のプレイ動線に置かない。匿名ユーザーも`auth.users`に登録され、同じユーザーIDでDBの記録を読み書きする。SQLの`anon`ロールによる未認証アクセスとは異なる。

Googleでの引き継ぎを使う場合は、次を設定する。匿名認証とDB保存はGoogle未設定でも利用できる。`VITE_GOOGLE_AUTH_ENABLED`は未指定・空・`false`でGoogleの説明と操作を非表示にし、`true`で表示する。それ以外の値はビルド時にエラーになる。

1. [Google providerの公式手順](https://supabase.com/docs/guides/auth/social-login/auth-google)に従い、Google CloudでWeb applicationのOAuth clientを作成し、Client IDとClient SecretをSupabaseのGoogle providerへ登録する。GoogleのAuthorized redirect URIsには、Supabaseが表示する`https://<project-ref>.supabase.co/auth/v1/callback`を設定する。
2. SupabaseのAuth設定で[manual identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking#manual-linking-beta)を有効にする。設定画面の「Googleと連携する」は`linkIdentity`でGoogleを現在のユーザーに追加するため、匿名で育てた記録のユーザーIDは変わらない。
3. Supabaseの[redirect allowlist](https://supabase.com/docs/guides/auth/redirect-urls)には、ゲームへ戻る`https://mogubiyori.kotek7.com/auth/callback`と、使用する開発originの`/auth/callback`を登録する。Google側のcallbackと、ゲームへ戻るURLは別々に設定する。
4. Google providerの接続を確認してから、`VITE_GOOGLE_AUTH_ENABLED=true`で再ビルドする。公開環境はGitHubの同名リポジトリ変数も変更する。

ブラウザ側はSupabase SDKのPKCE、callbackのセッション復元、トークン更新を使う。別端末などで既存のGoogleアカウントの記録を開く場合は、設定画面の「Googleで続きから」で`signInWithOAuth`を使う。Google identityが既に別ユーザーへ紐付いている場合も、匿名ユーザーとそのアカウントの記録を自動で合算しない。Google連携済みユーザーがログアウトすると、新しい匿名ユーザーで始まる。

匿名ユーザーにはブラウザ外から復帰する認証手段がないため、引き継ぐときにGoogleを連携する。Turnstileの画面・captcha token送信は未実装なので、Bot対策を必須にする設定はその対応と合わせて行う。

## APIと写真の経路

| API                          | 内容                                           |
| ---------------------------- | ---------------------------------------------- |
| `GET /api/game`              | 認証したユーザーのsnapshot                     |
| `POST /api/game/commands`    | 操作の検証、サーバーでのルール計算、DBでの確定 |
| `POST /api/photos`           | `X-Operation-Id`付き画像アップロード           |
| `POST /api/photos/read-urls` | 自分の写真IDに対する期限付きURL                |
| `POST /api/recognize-food`   | 写真から採用済みレシピの候補を取得             |

ゲームと保存写真のAPIはBearer tokenを要求する。認識APIは現在、同一originの検査とサイズ・形式の制限を持ち、local体験からも利用できる。APIの応答は`no-store`とする。

写真はブラウザで縮小してから送る。Workerは2MiB上限をストリーム読込時にも適用し、MIMEとファイル先頭を確認する。画像全体をWorkerで再エンコードする実装や、1枚300KBに必ず収める実装はない。

アップロードIDを`photoId`として使い、object keyは`ユーザーUUID/photoId`に固定する。同じIDへの再送は保存済みhashと形式を検査する。写真の紐付けはゲーム操作と同じDBトランザクションで確認し、他ユーザーの写真や使用済み写真を新しい食事に使わない。

表示時のURLは5分有効。private bucketの画像は、Workerで所有者を確認した後にURLを発行する。URL自体はセーブやreceiptへ保存しない。写真アップロードと食事保存は別HTTP処理なので、アップロード済みで食事未確定の写真が残る場合がある。

## 検証と公開

`pnpm test`はルール・移行・machine・API・adapterを、`pnpm test:e2e`はlocalのブラウザ動作を、`pnpm test:cloud`はAuthとAPIをmockにしたcloudのブラウザ動作を検証する。DBの確認には`pnpm test:db`を使う。このスクリプトはPostgreSQLの実行ファイルが必要で、非rootユーザーで実行する。隔離した一時DBへAuth/Storage用の最小テーブルとロールを作り、migrationと権限・原子性・同時再送を検証する。必要なら`POSTGRES_BIN`で実行ファイルのディレクトリを指定する。

このDBテストはSupabase Auth/StorageのHTTPサービスを起動しない。Google認証、実際のprivate写真、Workers AI、端末を替えた続きからの再開は、設定済み環境で別に確認する。

GitHub Actionsの[CI/CD](../.github/workflows/ci.yml)はNode.js 24、`packageManager`指定のpnpm、固定したlockfileを使い、lint・format・unit test・build・local/cloudのE2E・隔離PostgreSQLの検証を行う。検証jobには`CLOUDFLARE_REMOTE_BINDINGS=false`と`VITE_GAME_MODE=local`を設定し、外部認証情報や実AIを使わない。失敗時のブラウザtraceは7日間保存する。

Cloudflare Vite pluginによるビルド結果は、静的ファイルが`dist/client/`、Worker本体と生成したWrangler設定が`dist/mogubiyori/`へ出力される。生成した設定はビルドごとに更新されるため、手で編集しない。リモート接続を使わずビルドする場合は`CLOUDFLARE_REMOTE_BINDINGS=false pnpm build`を使う。

ビルド・公開手順は [README](../README.md) と`package.json`のscriptsを正本とする。現在の公開は端末内保存の`local`モードを使う。`cloud`へ切り替える場合は、ビルド時の環境変数とWorker Secret、DB migration、Auth redirectを準備する。

### GitHub Actionsの自動公開

`kotek-7/mogubiyori`の`main`へのpushで、全検証が成功した後に`production`環境からCloudflare Worker `mogubiyori`へ公開する。PRや他のブランチ、別リポジトリでは公開しない。公開前にGitHubの`main`と実行中のコミットを照合し、古いコミットの再実行による巻き戻しを避ける。進行中の本番公開は後続のpushで中断しない。

検証jobはlocalのビルドと全テストを終えた後、公開対象のmainについてリポジトリ変数の`VITE_*`を使って本番用の`dist/`を再ビルドする。`VITE_GAME_MODE`の変数が未設定なら本番はlocalを維持する。cloudを指定したのにURLまたは公開キーがない場合は、公開前に失敗させる。テストでは引き続きlocalの明示とcloud用のmock設定を使い、本番データには接続しない。

本番用`dist/`を7日間のartifactとして渡し、公開jobでは再ビルドせず`wrangler deploy --config dist/mogubiyori/wrangler.json`を実行する。Vite pluginの設定切替用ファイルは別jobへ引き継がれないため、生成した設定を直接指定する。公開後はHTTPSで取得したHTMLがビルド結果と一致することと、認識APIのGETが405を返すことを確認する。AI推論や本番データの書き込みは行わない。

GitHubのリポジトリ設定「Secrets and variables → Actions」に以下を登録する。

| 種類     | 名前                            | 内容                                       |
| -------- | ------------------------------- | ------------------------------------------ |
| Secret   | `CLOUDFLARE_API_TOKEN`          | 本番Workerを更新できるCloudflare API token |
| Variable | `CLOUDFLARE_ACCOUNT_ID`         | `769b391d51df077598b7d91579605fe2`         |
| Variable | `VITE_GAME_MODE`                | `cloud`でDB保存へ切替。未設定は`local`     |
| Variable | `VITE_SUPABASE_URL`             | cloudで使うSupabase project URL            |
| Variable | `VITE_SUPABASE_PUBLISHABLE_KEY` | cloudで使う公開可能なキー                  |
| Variable | `VITE_GOOGLE_AUTH_ENABLED`      | Google provider設定後だけ`true`にする      |

この表のVariableはリポジトリ変数として登録する。本番用ビルドは`production`環境の公開jobより前に実行するため、environment変数だけでは参照できない。Workerの`SUPABASE_URL`と`SUPABASE_SERVICE_ROLE_KEY`は別途CloudflareのWorker Secretへ登録する。service-role keyやGoogle Client SecretをGitHubの`VITE_*`変数へ入れない。cloudへの切替は、DB migration・匿名サインイン・Worker接続を準備してから行う。Google providerとidentity linkingは任意の引き継ぎ機能用に設定する。

トークンはCloudflareの[API Tokens](https://dash.cloudflare.com/profile/api-tokens)で作成し、対象アカウントのWorkers Scripts編集と、`kotek7.com`のZone読み取り・Workers Routes編集を許可する。Workers AIのbindingを含むためWorkers AI読み取りも許可する。[CloudflareのGitHub Actions手順](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)も参照。端末のWrangler OAuth tokenは有効期限が短いため、GitHubには登録しない。

CLIで登録する場合は、以下のSecret入力欄にtokenを入力する。コマンド引数やファイルにtokenを記載する必要はない。

```sh
gh secret set CLOUDFLARE_API_TOKEN --repo kotek-7/mogubiyori
gh variable set CLOUDFLARE_ACCOUNT_ID --repo kotek-7/mogubiyori --body 769b391d51df077598b7d91579605fe2
```

手動でやり直す場合は、GitHub Actionsの「CI/CD → Run workflow」で`main`を選ぶか、`gh workflow run ci.yml --ref main --repo kotek-7/mogubiyori`を実行する。検証から再実行し、成功後に公開する。

## 現在の範囲

既存localセーブのcloud取込、アカウント削除API、未使用写真の定期清掃、容量監視、自動バックアップ、IndexedDBへの下書き保存、プッシュ通知、実決済は未実装である。常設公開へ移るときは、利用人数・写真量・復旧要件に応じて追加する。

無料枠だけで運用できるかは、接続先アカウントの使用状況と現行プランで確認する。AI推論と写真の保存・配信も利用量に含まれるため、コード内で月額0円を保証する前提にはしない。
