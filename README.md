# もぐ日和

**きみのごはんで、なかまが育つ。**

公開先：[mogubiyori.kotek7.com](https://mogubiyori.kotek7.com/)。現在は端末内保存モードで、育成記録と写真は利用中のブラウザに保存します。

自分で作った料理を、小さななかまと分けあう育成ゲームです。写真を届けると成長し、大きく育った子のもとには新しいお客さんがやってきます。

**なかまと出会う → 写真を選ぶ → 食卓へ → ごはんをあげる → ひろばへ。**

## 起動

Node.js 22.12以降とpnpm 12.5.1を使います。依存の正本は`pnpm-lock.yaml`です。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Reactの画面とCloudflare Workerを、Vite pluginで同じサーバーから動かします。別のAPIサーバーやプロキシ設定は不要です。Supabase未設定の開発環境は`local`モードで、これまでのブラウザ内の記録を引き継ぎます。

スマートフォンではPCと同じネットワークに接続し、`pnpm dev --host 0.0.0.0`で表示されるNetwork URLを開きます。端末間通信が制限されたゲストWi-Fiでは接続できません。

写真の自動判定にはCloudflareログインが必要です。Workers AIは開発中もアカウントの利用枠を使います。

```sh
pnpm exec wrangler login
pnpm dev:cloudflare
```

8787番で画面・APIを起動し、リモートのWorkers AIへ接続します。通常の`pnpm dev`ではリモートbindingを無効にしているため、Cloudflareへログインせずに起動できます。判定できないときも料理の手動選択と写真なしの体験は使えます。

## 認証・クラウド保存

`.env.example`を参考にSupabaseのURLと公開キーを設定すると、`cloud`モードになります。初回は自動で匿名ユーザーを作り、次回から同じセッションを復元します。認証方法を選ぶ画面を挟まずに遊べて、育成記録はユーザーごとにDBへ、写真はprivate Storageへ保存します。`VITE_GAME_MODE=local`を明示すると端末内保存で開発できます。

Google OAuthを設定した環境では、設定画面から任意で連携できます。設定は最初のなかまを選ぶ前にも開けます。「Googleと連携する」は現在の匿名ユーザーにGoogleを追加し、そのままの記録を引き継ぎます。別端末などで既存の記録を開くときは「Googleで続きから」を使います。現在の記録とGoogle側の記録は自動で合算しません。未設定の環境ではGoogleの操作を表示しません。匿名のままブラウザのサイトデータを消すと同じユーザーへ戻れなくなります。

Worker用のローカル設定は`.dev.vars.example`を参照してください。DB migration、Authの設定、公開時のSecretは[実行環境と接続手順](docs/infrastructure.md)に記載しています。クラウド接続に失敗した場合はエラーを表示し、端末内の別ゲームへ自動で切り替えません。

## ビルド・公開

```sh
pnpm build
pnpm preview
# 公開先・DB・認証・Secretの準備後に実行
pnpm deploy
```

ビルドは画面を`dist/client/`、Workerと生成設定を`dist/mogubiyori/`へ出力します。`wrangler deploy`はCloudflare Vite pluginの生成設定を使い、Workerと静的ファイルをまとめて配信します。ブラウザ用の`VITE_*`設定はビルド時に確定します。通常のNode.jsサーバーは本番で起動しません。[Cloudflare Vite pluginの構成](https://developers.cloudflare.com/workers/vite-plugin/tutorial/)

## 写真から料理を選ぶ（Gemma 4）

Cloudflare Workers AIの`@cf/google/gemma-4-26b-a4b-it`で料理候補を最大3件取得します。違う場合は候補や「料理を選ぶ」の検索一覧から変更できます。カードは「ごはんをあげる」の保存成功時に確定します。

認識対象は`shared/content/recipes.ts`の310種のレシピと、`shared/content/dishes.ts`の16種の料理です。具体的なレシピを特定できなくても、パスタ・カレー・チャーハン・ハンバーグなどの種類で記録できます。「料理を選ぶ」から手動でも選べます。種類での記録は通常の経験値と毎日の報酬を獲得し、料理カードは具体的なレシピを選んだ場合に獲得します。

写真の検出中は文章の横で三点リーダが控えめに明滅し、食卓へ進んでも表示を続けます。動きを減らす設定では点を静止させます。通信失敗や判定待ちでも手動で進められ、手動で選んだ料理・入力した名前を遅い判定で上書きしません。写真は端末で縮小してからWorkerへ送信します。

[Gemma 4のモデル仕様](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/)、[Workers AIの料金](https://developers.cloudflare.com/workers-ai/platform/pricing/)

## あそびかた

- **ひろば**：最初のなかまを選び、料理の写真でごはんをあげます。5段階で体形が変わり、新しいお客さんがフィールドに訪れます。お客さんを直接タップしてごはんをあげると、なかまになります。
- **ふれあい**：なかまをタップでつつく、指を滑らせてなでる、左右にこすってくすぐる、長押しで寄り添う、上にはじくと跳ねる、と触り方で反応が変わります。マウスでも同じ操作ができ、キーボードやボタンからも遊べます。性格・成長段階・満腹やおやすみの状態も表情と動きに反映されます。
- **ずかん**：育てたなかまと、初めての料理カードを集めます。全310種から名前・材料で検索し、種類・調理時間・難しさ・獲得状態で絞り込めます。未獲得の料理も材料と手順を読んで食卓へ進めます。
- **おみせ**：コインやジェムで帽子・首元・かばん・ひろばの背景を購入します。帽子と首元とかばんは同時に身につけ、部位ごとにきせかえできます。
- **毎日のごほうび**：ログイン、自炊、料理カード、継続日数に応じてコインを獲得します。

最初の成長は早くても3食目。初めての食事の後も「うまれたて」の姿を保ち、出会った姿はプロフィールで見返せます。

最初のなかまを迎えたら、チュートリアルで操作を練習できます。練習は本編の報酬や記録を変更せず、途中で休んで後から再開できます。写真選択・食卓・食事は、それぞれ独立した画面です。成長や新しいカードは一つずつお祝いします。食後のXP獲得や連続記録の更新は、結果を確認してボタンを押すまで表示します。

写真がないときはサンプルでも体験できます。料理の選択と名前は任意です。写真選択へ戻っても入力は保たれ、ごはんをあげる前なら中止できます。ローカルモードのジェム追加は試用操作であり、実際の請求はありません。

ローカルモードの設定の「成長・出会いを体験」では、次のごはんで成長と来客を試せます。「最初から育てる」は記録を初期化し、なかま選びから始めます。日付を進めると翌日の空腹や連続記録の変化を確認できます。

## 保存と実装範囲

`local`では記録・縮小写真・育成・購入状態を、このブラウザの`localStorage`（`mogubiyori-v1`）に保存します。再読み込み後も残りますが、端末間では共有されません。既存セーブは移行処理を通して読み込みます。

`cloud`では匿名ユーザーも含めてSupabaseへ保存し、操作IDによる再送処理とrevisionによる同時更新の検査を行います。XP・コイン・カードはWorkerが計算し、保存が確定した結果から演出します。Google連携後は別端末から同じアカウントで続けられる構成です。実際のGoogle認証と端末間の確認には接続先の準備が必要です。localの既存記録はそのまま端末に残り、cloudへ自動で取り込みません。

日付は日本時間を使い、ローカルの試用操作だけ日付を進められます。自炊したかどうかは自己申告です。既存ローカルセーブのクラウド取込、下書きの再読み込み後の復元、プッシュ通知、実決済は未実装です。

## コードの配置

画面・固有部品・CSS・単体テストは`src/features/<機能>/`にまとめています。`src/app/`はアプリの構成、route、dialogの切り替えを担当し、保存セッションとlocal/cloudの接続は`src/app/game/`に置きます。複数機能で使う描画や画面枠は`src/ui/`で共有します。

ブラウザとWorkerに共通のルールは`shared/game/`、採用コンテンツは`shared/content/`です。Worker側のゲーム操作とSupabase接続は`worker/game/`、料理認識は`worker/recognition/`に置きます。CSSは各機能の近くに置き、既存の適用順を保つため`src/app/styles.ts`から明示した順に読み込みます。

単体テストは実装に隣接し、機能や保存境界を横断するテストは`tests/integration/`、ブラウザ全体の検証は`tests/e2e/`と`tests/cloud/`に置きます。詳しい責務と開発時のルールは[アーキテクチャ](docs/architecture.md)を参照してください。

## 検証

```sh
pnpm test
pnpm lint
pnpm build
pnpm format:check
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:cloud
# PostgreSQLの実行ファイルがある環境
pnpm test:db
```

通常のE2Eは4173番（`E2E_PORT`で変更可能）、cloud用E2Eは4190番で専用サーバーを起動します。Auth・ゲームAPI・認識はmockを使い、実クラウドへアクセスしません。DBテストは隔離した一時PostgreSQLへmigrationを適用し、権限と同時更新を確認します。

GitHub Actionsの[CI/CD](https://github.com/kotek-7/mogubiyori/actions/workflows/ci.yml)で型検査・lint・format・unit・build・E2E・DB検証を行います。`kotek-7/mogubiyori`の`main`へpushすると、全検証に成功したビルドを[mogubiyori.kotek7.com](https://mogubiyori.kotek7.com/)へ自動公開します。PRと他のブランチは検証のみです。初期設定と再実行の手順は[実行環境とクラウド接続](docs/infrastructure.md#github-actionsの自動公開)を参照してください。

- [アーキテクチャと開発境界](docs/architecture.md)
- [実行環境とクラウド接続](docs/infrastructure.md)
- [プロダクト仕様](docs/product.md)
- [世界設定](docs/world.md)
- [体験検証](docs/experiments.md)

## ずかんと追加コンテンツ

追加300種のレシピは、本体の「ずかん → 料理カード」に統合しています。食卓でも同じ検索一覧から料理を選べ、初めてごはんをあげるとカードと報酬を獲得します。既存カードと食事記録はそのまま残ります。

追加予定のなかま36種・帽子と背景72種は、開発サーバーの `/expansion/index.html` で成長段階ときせかえをプレビューできます。このページの「料理カード」は本体のずかんへ移動します。帽子6点は本体のおみせで購入できます。残りの拡張アイテムの購入と、追加のなかまの加入は未接続です。素材の再生成・検証と採用状況は[追加コンテンツの仕様](docs/content-expansion.md)を参照してください。
