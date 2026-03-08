# Device が DeviceSettings を同期する

## 目的

Web 側で更新した DeviceSettings を、再起動なしで Device へ反映する。

## 入力

- version API の結果
- DeviceSettings API の結果

## 出力

- 実行時設定
- 適用済み `lock_version`

## 処理内容

1. 起動時に version API を確認する
2. `lock_version` が新しければ設定本体を取得する
3. 実行時設定へ変換して適用する
4. 実行中も一定間隔で version を確認する
5. 更新があれば今の判定設定へ反映する
6. API に失敗した時は、前回保存した設定または既定値を使う

## なぜ必要か

- 実機を止めずに判定値を調整したいため
- 毎回設定全体を取りに行くより、軽く同期したいため

## 補足

- `DEVICE_ID` が無い時は同期しない
- version API に失敗した時は、前回保存した設定があればそれを使う
- 前回設定も使えない時はローカル既定値で動かす
- 取得した設定の形がおかしい時は採用しない
- DeviceSettings で変えられる値と、Device 側の固定値は分かれている
- たとえば `stable_duration_sec` などは同期対象だが、`START_THRESHOLD_G` などはローカル定数を使う
