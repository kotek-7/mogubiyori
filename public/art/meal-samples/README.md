# 食事のサンプル写真

写真を用意せずに体験するときに使うサンプル画像。
このディレクトリの 2 点に加え、既存の `public/art/tutorial/sample-curry.jpg` をカレーのサンプルとして再利用する。

| ファイル             | 内容       | 寸法         | 形式 |
| -------------------- | ---------- | ------------ | ---- |
| `sample-omurice.jpg` | オムライス | 800 × 800 px | JPEG |
| `sample-salmon.jpg`  | 焼き鮭定食 | 800 × 800 px | JPEG |

## 生成元

- 生成日: 2026-09-26
- OpenAI の組み込み `image_gen` ツールで生成した写真風画像。外部サイトの写真は使用していない。
- 生成した PNG を Pillow で 800 × 800 px に縮小し、JPEG（品質 85、最適化・プログレッシブ形式）に変換した。画像の合成・内容の加工は行っていない。
- 人物・文字・ロゴが含まれず、それぞれの料理を判別できることを目視確認した。

## 生成プロンプト

### `sample-omurice.jpg`

```text
Use case: photorealistic-natural
Asset type: meal sample photograph for a Japanese food app.
Primary request: a natural realistic photograph of Japanese omurice on a plain white ceramic plate.
Scene/backdrop: simple light wooden dining table in daylight.
Subject: soft yellow egg omelet covering fried rice, a modest red ketchup drizzle, and a small side of lettuce and cherry tomatoes on the same plate.
Style/medium: authentic appetizing casual food photography, realistic food textures and colors.
Composition/framing: square composition, slightly elevated three-quarter view, entire plate visible with a little table around it, dish centered.
Lighting/mood: soft natural window light.
Constraints: no people, no hands, no letters or text, no logo, no watermark, no frame, no collage.
```

### `sample-salmon.jpg`

```text
Use case: photorealistic-natural
Asset type: meal sample photograph for a Japanese food app.
Primary request: a natural realistic photograph of a Japanese grilled salmon set meal.
Scene/backdrop: simple light wooden dining table in daylight.
Subject: one grilled salmon fillet on a small ceramic plate, a bowl of white rice, a bowl of miso soup, and a small dish of pickled vegetables arranged as a compact set meal.
Style/medium: authentic appetizing casual food photography, realistic fish and rice textures and natural colors.
Composition/framing: square composition, elevated three-quarter view, complete compact arrangement visible with a little table around it, salmon clearly visible.
Lighting/mood: soft natural window light.
Constraints: no people, no hands, no letters or text, no logo, no watermark, no frame, no collage.
```
