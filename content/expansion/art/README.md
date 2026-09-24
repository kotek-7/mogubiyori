# アート素材の取り扱い

- `public/expansion/assets/recipes/*.svg`：料理300品の器、料理の形、具材を組み合わせた決定的なベクター描画。元データは各レシピの `art`。
- `public/expansion/assets/characters/*.svg`：なかま36種の成長3段階。透明背景。
- `public/expansion/assets/items/*.svg`：透明背景の帽子36点、ひろばの背景36点。
- `public/expansion/assets/scenes/neighborhood-table.png`：内蔵 imagegen で生成したキービジュアル。対応プロンプトは同じディレクトリの `neighborhood-table.prompt.txt`。

SVG はブラウザやベクター編集ソフトで拡大しても輪郭が劣化しない。各ファイルの色・形を独立して編集できる。画像の説明は設定データに持ち、図中に料理名やIDを書き込まない。

SVG を再生成するコマンドと編集元は [追加コンテンツの仕様](../../../docs/content-expansion.md) を参照。原稿編集と生成出力への手修正を混在させない。

版画の色面を参考にするが、毎回の印刷ノイズ、ランダムなテクスチャ、パステルの光沢は使用しない。色覚や縮小表示でも判別できるように、キャラの形と料理の盛り付けで違いを作る。
