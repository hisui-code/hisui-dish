# Device が食事開始 / 食事終了を判定する

## 目的

皿がある状態の重さの変化から、食事開始と食事終了を判定する。

## 入力

- `net_grams`
- 平均を取った後の `avg_grams`
- `tracking_baseline`
- `start_reference_weight`
- 時刻

## 出力

- `eat_started`
- `eat_stabilizing`
- `eat_finished`
- `eat_aborted`
- `eat_discarded`

## 処理内容

1. `net_grams` を移動平均で平滑化する
2. 待機中は `tracking_baseline` を少しずつ今の重さへ近づける
3. ただし、上方向の大きな変化はすぐ `tracking_baseline` に反映しない
4. `tracking_baseline` からの減少量を見て、開始候補に入るかを決める
5. 開始候補に入ったら、その時点の安定した重さを `start_reference_weight` として固定する
6. `start_reference_weight` からの減少が一定量、一定時間続いたら開始確定する
7. 開始が決まったら、その後の最小重量を追う
8. 安定した状態が `stable_duration_sec` 秒続いたら終了候補に入る
9. 終了候補に入ったあと、さらに最終安定が続いたら終了確定する
10. 長すぎるセッションは中断する

## なぜ必要か

- 生の重さは揺れるため、そのままでは食事開始 / 終了を決められないため
- 開始、終了、異常中断を分けて扱う必要があるため
- 食べ終わった直後の小さな揺れを吸収してから確定したいため
- 待機中の重さの中心を追う基準と、食べ始め直前の基準を分けないと誤判定しやすいため
- 皿の置き直しや接触スパイクのあとに、待機用の基準がずれたまま開始判定すると誤検知しやすいため

## 補足

- `tracking_baseline` は待機中の重さの中心をゆっくり追うための値
- `start_reference_weight` は食事開始直前の安定した重さを固定した値
- `stable_duration_sec` は、安定した状態がどれだけ続いたら終了候補に入るかを決める値
- 終了候補に入ったあとも、すぐには確定せず、最後の確認時間を置いてから `eat_finished` にする
