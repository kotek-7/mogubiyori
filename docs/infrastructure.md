# 実行環境とクラウド接続

この構成は、スマートフォン・PCのブラウザで利用するWebアプリを対象とする。画面はReact/ViteのSPA、HTTP APIはCloudflare Workers、認証・ゲーム保存・非公開写真はSupabaseを使う。初期利用はハッカソンや限定体験の数十人を想定する。

このリポジトリにある設定・実装・migrationは、外部アカウントの作成や公開デプロイの完了を意味しない。公開URL、Supabase project、OAuth設定、実際の利用枠は接続先ごとに確認する。

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

| 設定                           | 保存先                    | 認証                 | 利用目的                               |
| ------------------------------ | ------------------------- | -------------------- | -------------------------------------- |
| `VITE_GAME_MODE=local`（既定） | ブラウザの`mogubiyori-v1` | 不要                 | 既存セーブを使うローカル体験・UI開発   |
| `VITE_GAME_MODE=cloud`         | Supabase                  | 匿名開始またはGoogle | 複数端末での継続・サーバーでの操作確定 |

localでもAPIを利用できれば写真認識を呼べる。認識できないときは手動選択で進める。cloudの設定不足やサービス障害ではエラーを表示し、localへ自動で切り替えない。日付送り、試用ジェム追加、セーブリセットはlocalだけに表示する。

`VITE_*`はビルド時にブラウザ向けコードへ取り込まれる。localからcloudへ切り替えた公開物を作る場合は、環境変数を設定して再ビルドする。

## 開発環境

Node.jsとpnpmの条件は`package.json`にある。依存をインストールした後、`pnpm dev`でViteとWorkerを起動する。Cloudflare Vite pluginが同じ開発サーバーにAPIを接続するため、ViteとWranglerを別ターミナルで起動する必要はない。8787番を使う場合は`pnpm dev:cloudflare`を使う。

ブラウザ用設定は`.env.example`を参考に`.env.local`へ、Worker用設定は`.dev.vars.example`を参考に`.dev.vars`へ置く。秘密値をGitへ追加しない。

`AI` bindingは`remote: true`なので、通常の開発サーバーから実モデルを使うとCloudflareアカウント側で推論が行われる。これは完全なオフライン開発ではない。`CLOUDFLARE_REMOTE_BINDINGS=false pnpm dev`でリモートbindingを無効化でき、その場合は実モデルによる認識を利用できない。E2E用のVite test modeはCloudflare pluginを外し、認識APIをmockにする。

## Supabaseの準備

このリポジトリにはSupabase CLIのproject linkや`config.toml`を含めていない。Supabase projectを用意し、[migration](../supabase/migrations/20260925000000_game.sql)をSQL Editor、または別途設定したCLI環境から適用する。このmigrationは新規環境向けなので、適用済みSQLをそのまま繰り返して実行しない。

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
| `SUPABASE_URL`                  | Worker環境                          | 同じSupabase projectのURL   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Worker Secret / ローカル`.dev.vars` | サーバー専用キー            |
| `SUPABASE_PHOTO_BUCKET`         | Worker環境                          | 既定`meal-photos`           |

本番のサーバー専用キーはWranglerのSecretへ登録する。別bucketを指定する場合は、migrationが作るbucketとは別にprivate設定・サイズ制限・形式制限を揃える。

### Authの設定

Supabaseで匿名サインイン、Google provider、manual identity linkingを有効にする。ブラウザ側はSupabase SDKのPKCEとセッション更新を使う。匿名開始からのGoogle連携は`linkIdentity`、既存アカウントへのログインはGoogleサインインで扱う。

Google側にはSupabaseが表示するOAuth callbackを設定する。Supabaseのredirect allowlistには、利用するoriginの`/auth/callback`を登録する。ローカル開発と公開環境で使用するURLをそれぞれ確認する。Google identityが既に別ユーザーへ紐付いている場合のデータ自動合算は行わない。

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

GitHub Actionsの[CI](../.github/workflows/ci.yml)はNode.js 24、`packageManager`指定のpnpm、固定したlockfileを使い、lint・format・unit test・build・local/cloudのE2E・隔離PostgreSQLの検証を行う。`CLOUDFLARE_REMOTE_BINDINGS=false`を設定し、外部認証情報や実AIを使わない。CIにはデプロイ処理を含めない。

Cloudflare Vite pluginによるビルド結果は、静的ファイルが`dist/client/`、Worker本体と生成したWrangler設定が`dist/mogubiyori/`へ出力される。生成した設定はビルドごとに更新されるため、手で編集しない。リモート接続を使わずビルドする場合は`CLOUDFLARE_REMOTE_BINDINGS=false pnpm build`を使う。

ビルド・公開手順は [README](../README.md) と`package.json`のscriptsを正本とする。cloud用の環境変数とWorker Secret、DB migration、Auth redirectの準備後に公開する。デプロイコマンドが存在するだけでは、公開済み・接続確認済みとは扱わない。

## 現在の範囲

既存localセーブのcloud取込、アカウント削除API、未使用写真の定期清掃、容量監視、自動バックアップ、IndexedDBへの下書き保存、プッシュ通知、実決済は未実装である。常設公開へ移るときは、利用人数・写真量・復旧要件に応じて追加する。

無料枠だけで運用できるかは、接続先アカウントの使用状況と現行プランで確認する。AI推論と写真の保存・配信も利用量に含まれるため、コード内で月額0円を保証する前提にはしない。
