# 料理カタログ拡充の写真確認（2026-09-26）

ユーザー指定の `~/Pictures/food-test` の30枚を確認した。写真は料理名や材料の正解ラベルとして扱わず、画像を目視して判別できる範囲で確認する。写真そのものはリポジトリへ含めていない。

## 拡充前のAPI結果

`https://mogubiyori.kotek7.com/api/recognize-food` に、縦横を補正して長辺800px以下・JPEG品質72に変換した画像を送信した。ブラウザと同じ寸法・品質だが、縮小アルゴリズムはPillowのため画素の完全一致は保証しない。

30枚すべてHTTP 200。候補が1件以上返ったのは16枚、空配列は14枚だった。この数字は**認識率ではない**。ビリヤニがチキンジャンバラヤ、バーガーがハンバーグ、寿司が丼ものに寄る例があり、候補があるだけでは適切な認識と評価できない。応答時間の中央値は2.14秒（この1回の測定のみ）。

| ファイル               | 拡充前の候補ID                              |
| ---------------------- | ------------------------------------------- |
| `biryani15.jpg`        | `r-chicken-jambalaya`                       |
| `biryani17.jpg`        | `r-chicken-jambalaya`                       |
| `biryani73.jpg`        | `r-chicken-jambalaya`                       |
| `burger25.jpg`         | なし                                        |
| `burger32.jpg`         | なし                                        |
| `burger49.jpg`         | `generic-hamburg`                           |
| `butter-chicken10.jpg` | `generic-curry`                             |
| `butter-chicken14.jpg` | `generic-curry`                             |
| `butter-chicken17.jpg` | `generic-curry`、`curry`                    |
| `curry-rice.jpg`       | `generic-curry`、`curry`                    |
| `dessert18.jpg`        | `r-berry-yogurt-granola`                    |
| `dessert22.jpg`        | なし                                        |
| `dessert25.jpg`        | なし                                        |
| `dosa42.jpg`           | なし                                        |
| `dosa81.jpg`           | なし                                        |
| `idly45.jpg`           | なし                                        |
| `idly70.jpg`           | なし                                        |
| `pasta10.jpg`          | `tomato-pasta`                              |
| `pasta15.jpg`          | `generic-pasta`                             |
| `pasta5.jpg`           | `tomato-pasta`                              |
| `pizza44.jpg`          | なし                                        |
| `pizza79.jpg`          | なし                                        |
| `pizza87.jpg`          | なし                                        |
| `ramen.jpg`            | `r-chicken-shio-ramen`、`generic-ramen`     |
| `rice26.jpg`           | `r-pork-kimchi-rice`                        |
| `rice7.jpg`            | `r-chicken-jambalaya`、`generic-fried-rice` |
| `samosa15.jpg`         | なし                                        |
| `samosa16.jpg`         | なし                                        |
| `samosa20.jpg`         | なし                                        |
| `sushi.jpg`            | `generic-donburi`                           |

## 拡充で補った範囲

ビリヤニ、ドーサ、イドゥリ、サモサ、丸いピザ、ハンバーガーの具体的レシピと料理分類を追加。デザート、米料理、盛り合わせなどの広い分類も用意した。既存の料理ID・カード・食事履歴は保持する。

`dessert18.jpg` の白い層だけでヨーグルトや生クリームの材料を決めない。`dosa81.jpg` のように形だけでは細かな料理名が難しい写真や、混ざった米料理は、広い種類で記録できればよい。候補名と食品群・量は別々に扱い、不明な食品群は空配列、量は `unknown`、推定値は未確認のままユーザーが編集できる。

## 拡充後の実モデル評価の制限

拡充後のモデル呼び出しは Workers AI のエラー4006（1日10,000 neuronsの無料割当を消費）により、推論結果を受け取る前に失敗した。ローカルのremote bindingと本番が同じCloudflare accountを選ぶことを確認し、本番APIもHTTP 502となることを確認した。課金設定は変更していない。したがって、拡充後の実写真に対する精度・応答時間や改善率は未測定である。

API、料理分類、保存・復元、カード報酬、検索UIの自動テストは別途実施する。モックによるブラウザテストを、画像モデルの正解率として数えない。

## 再実行

Pillowが入ったPythonで実行する。実際のWorkers AI利用枠を消費するため、まず少数の画像で動作を確認する。画像は指定endpointへ送信するが、リポジトリには保存しない。

```sh
python3 scripts/recognition/evaluate-photos.py ~/Pictures/food-test \
  --endpoint https://mogubiyori.kotek7.com/api/recognize-food \
  --limit 3 --output /tmp/food-recognition-smoke.json

python3 scripts/recognition/evaluate-photos.py ~/Pictures/food-test \
  --endpoint https://mogubiyori.kotek7.com/api/recognize-food \
  --output /tmp/food-recognition-expanded.json
```

再測定では各画像の候補・品目を目視比較し、「適切な種類」「広いが妥当な種類」「別料理への誤分類」「候補なし」「API失敗」を区別する。ファイル名の料理名に一致したかだけで採点しない。
