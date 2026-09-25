# もぐ日和 発表素材キット

完成品は `artifacts/presentation-kit/`、一括配布用は `artifacts/mogubiyori-presentation-kit.zip` にあります。`index.html` をブラウザーで開くと、ネット接続なしで日本語検索・用途や比率による絞り込み・拡大表示・動画再生ができます。

## 収録内容

| 素材                             |      数量 | 形式・サイズ                                      |
| -------------------------------- | --------: | ------------------------------------------------- |
| ゲーム画面                       |      96枚 | スマホ50枚・横長46枚。主に780×1688／1920×1080     |
| 操作動画                         |      22本 | 11操作×縦横。MP4、720×1280／1440×810、30fps、無音 |
| もぐ・料理・アイテム・背景・ロゴ | 1,019種類 | 各PNG＋SVG。667種類が背景透過                     |
| キービジュアル・挿絵・本文背景   |      16枚 | 表紙7・透過挿絵6・余白背景3。横長・縦長・正方形   |
| 原画・画面を並べたレイアウト     |    25種類 | 各PNG＋SVG。16:9・4:3・縦長。14種類が背景透過     |
| 提出デモ用の料理写真             |       1枚 | 生成したカレー写真、1448×1086                     |

形式違いをまとめると **1,179種類**。このほか、代表素材の一覧画像、CSV／JSON索引、撮影条件と生成プロンプトを同梱します。

## 選び方

- **表紙**：`04-visuals/keyvisual-picnic.png` は左に余白、`keyvisual-seaside-left.png` は右に余白、`keyvisual-community-bottom.png` は上に余白。縦長・正方形もあります。
- **サービスの流れ**：`02-videos/` の写真提出→候補選択→食卓→食事→カード獲得。横長はスライド全体へ、縦長は説明文の横へ配置できます。
- **機能説明**：`01-screenshots/` にひろば6背景、ずかん、もぐの説明、ショップ、きせかえ、記録、設定、成長や連続記録の報酬を収録。
- **成長・収集の魅力**：`06-layouts/` の成長5段階、6体集合、30姿一覧、きせかえ比較。`03-assets/companions-core/` から単体でも取り出せます。
- **本文の挿絵**：`04-visuals/spot-*.png` は透過。ごはん、写真、ずかん、成長、やすらぎを題材にしています。
- **料理や装飾**：`03-assets/recipes-cutout/` の料理300種、`items-game/`、`brand-and-ui/`。白いロゴは濃い背景で使います。
- **締め**：`keyvisual-evening.png`、`background-night-corner.png`。背景に応じて紺または白の文字を重ねられます。

PNGはそのままスライドに挿入できます。SVGはベクター編集に向きますが、スライドアプリの埋め込みフォント対応に差があるため、表示が変わる場合はPNGを使ってください。生成イラストは原寸（横長1672×941、縦長941×1672、正方形1254×1254）を保持しています。文字や見出しは重ねて使う想定です。

## 撮影条件と由来

画面・動画はローカルモードの実アプリを操作して収録しています。成長・所持品・食事記録などは独立した発表用デモデータです。写真判定の応答は固定の撮影用データで、生成した料理写真を入力にしています。利用者のアカウントやクラウドの保存データは使用していません。

原画素材はソースのReact SVGと配布SVGから書き出しています。「拡張カタログ」「旧版」の素材も明確に分類しています。これらの点数を、ゲーム内で利用できる種類数として扱わないでください。

イラストは **built-in image_gen** で生成し、既存キャラクターを参照しました。実画面とは別の発表向け表現です。プロンプトは [image-prompts.json](image-prompts.json) と [extra-image-prompts.json](extra-image-prompts.json)。フォントとUIアイコンのライセンスはキットの `03-assets/licenses/` にあります。

## 再生成

プロジェクトの依存関係とPlaywright Chromium、`ffmpeg`／`ffprobe`、`zip` が必要です。料理写真・生成イラストは完成キットから配置するか、保存したプロンプトをbuilt-in image_genに渡して各指定パスへ保存してください。画像生成APIを呼ぶスクリプトやAPIキーは必要ありません。

```sh
node scripts/presentation/export-assets.mjs
pnpm exec playwright test --config scripts/presentation/capture-screens.config.ts
pnpm exec playwright test --config scripts/presentation/capture-videos.config.ts
node scripts/presentation/compose-layouts.mjs
node scripts/presentation/index-visuals.mjs
node scripts/presentation/package-kit.mjs
```

画面撮影と動画収録は別ターミナルで並列実行できます。専用ポートは4201と4202です。変更する場合は `PRESENTATION_SCREEN_PORT`／`PRESENTATION_VIDEO_PORT` を指定します。写真がない場合、写真を使う動画はスキップされます。

完成済みの動画を保ち、未収録分だけ追加する場合：

```sh
PRESENTATION_VIDEO_ONLY_MISSING=1 pnpm exec playwright test --config scripts/presentation/capture-videos.config.ts
```

`PRESENTATION_VIDEO_ORIENTATION=portrait` または `landscape` で向きを限定できます。

## 検証と保存

96画面・22操作の撮影成功を確認しました。全原画PNGの寸法・透明度、SVGの外部参照なし、全動画のデコードと映像形式、代表画像と動画の冒頭・末尾を確認しています。素材一覧も検索・絞り込み・拡大・動画表示を確認し、ZIPは整合性検査を通しています。

大量の画像・動画・ZIPはGit管理から除外し、書き出しスクリプト・この手順・プロンプトをコミットします。完成キットとZIPはローカルの `main` 作業ディレクトリの `artifacts/` にも保存します。
