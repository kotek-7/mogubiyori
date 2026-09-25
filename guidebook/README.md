# もぐ日和 世界の案内帖

八つの章、54ページでナロ諸島をめぐる独立したガイドブックサイト。六島の地誌、42種のもぐ、六つの新しい寄り道先、六つの郷土料理、五人の人物紹介、八篇の短編、用語集を収録する。

## 起動と検証

Node.js 22.18以降を使用。追加パッケージのインストールは不要。

```sh
cd guidebook
pnpm build
pnpm check
pnpm dev
```

`http://127.0.0.1:4317/` で開く。`GUIDEBOOK_PORT=4320 pnpm dev` でポートを変更できる。`dev` は起動時にビルドし、ソースを変更したら別のターミナルで `pnpm build` を実行してブラウザを再読み込みする。ビルド済みの内容だけを表示する場合は `pnpm preview`。

`dist/` 全体を静的ホストへ配置できる。通常のリンクで各 HTML を開く構成で、JavaScript がなくても本文・章・関連ページを読める。JavaScript は目次ダイアログ、短編の絞り込み、読書の進捗線だけを担当する。存在しないページには `404.html` を配信する。

## 独立性

ゲームの起動、認証、保存データ、Supabase、Cloudflare Worker、ゲームの CSS や実行時モジュールを参照しない。既存素材はこのディレクトリへ複製し、書体もローカル配信する。フォルダ全体を単独でコピーしてビルド・配信できる。ゲーム本体への導線や登録・購入操作は置いていない。

## 構造と編集

- `SITE_MAP.md`：章とページの役割。
- `src/chapters.mjs`：章立て・扉の紹介。
- `src/world-data.ts`：既存世界設定をもとにした地誌・生態・人物・食文化。
- `src/stories.mjs`：新作短編8篇、新しい寄り道先6件、世界の概要。
- `src/details.mjs`：人物と料理の追加原稿、新たな日常の挿話。
- `src/book.mjs`：静的ページの組み立て、総目次、章内の前後移動、関連リンク。
- `src/style.css`：誌面、レスポンシブ表示、印刷、動きを減らす設定。
- `public/art/`：挿絵、複製したもぐの SVG、食卓の絵。
- `scripts/check.mjs`：生成した全ページのリンク、図版、フォント、到達可能性、原稿の充足を検査。

バックボーンはリポジトリの `docs/world.md` と `docs/world/`。短編・寄り道先・細部の挿話は、その設定を土台にこの案内帖向けに創作した。ゲーム本体やバックボーン文書への自動同期は行わない。

## 図版

村の見開き、諸島の絵地図、生態図譜、ニカの市場、カヤの冬の夜、ウネの茶畑の道の6点を imagegen で新規制作。絵地図は位置関係と風景を表す案内用の図で、航海用の縮尺図ではない。生態図譜は上段の三種だけを誌面の扉に使用する。詳細な成長図は既存 `CompanionArt.tsx` を React の静的描画で SVG 化したスナップショットで、生成後は React に依存しない。追加36種の SVG と食卓絵も本体素材のスナップショット。

Noto Sans JP Variable のライセンスは `public/fonts/OFL.txt`。外部の画像・フォントサービスへのアクセスは不要。

## 公開

配信先は `https://guide.mogubiyori.kotek7.com/`。Sites の既定URLは `https://mogubiyori-world-guide.kotek7.chatgpt.site/`。閲覧範囲は Sites のアクセス設定で管理する。

Sites の静的サイトとして配信する。識別子と出力先のみ `.openai/hosting.json` に記録し、認証情報は保存しない。開発時のチェックは `pnpm build && pnpm check`。公開時はこのフォルダのみを独立したソースとして送り、検証済み `dist/` をパッケージする。

独自ドメインは Cloudflare の `kotek7.com` ゾーンで管理する。`guide.mogubiyori` の CNAME は `custom-domains.chatgpt.site` を参照し、プロキシは「DNS のみ」。`_openai-site-verification.guide.mogubiyori` の TXT には Sites が返した所有確認の値を設定する。DNS とドメインの関連付けは再デプロイ時も維持する。
