# Device が皿あり / 皿なしを判定する

## 目的

皿を置いた時と外した時を見分けて、皿がある時だけ食事判定を動かす。

## 入力

- `grams`
- `tare_weight`
- 時刻

## 出力

- `NO_BOWL`
- 皿あり状態

## 処理内容

1. `tare_weight` に皿あり margin を足した重さ以上かを見る
2. 一定時間続いたら皿ありと判定する
3. `tare_weight` に皿なし margin を足した重さ以下かを見る
4. 一定時間続いたら皿なしへ戻す
5. 皿なしへ戻る時は、待機追従用の基準と開始判定用の履歴をクリアする

## 既定値

- `BOWL_PRESENT_MARGIN_G = 5.0`
- `BOWL_ABSENT_MARGIN_G = 3.0`
- `BOWL_PRESENT_CONFIRM_SECONDS = 1.0`
- `BOWL_ABSENT_CONFIRM_SECONDS = 1.0`

少量のフードが残った皿でも `NO_BOWL` から復帰しやすくするため、
皿あり margin は `tare_weight + 5g` を既定にする

## なぜ必要か

- 皿を置く、外す時の重さの変化を、食事と区別するため
- 皿がない時まで食事判定すると、誤判定しやすいため
- 空皿の重さは器ごとに違うため、固定値より `tare_weight` 基準の方が実機差を吸収しやすいため
