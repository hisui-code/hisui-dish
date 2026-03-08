# Device Measurement Flow

## 目的

猫がごはんを食べた出来事を、Device がどの順番で処理するかを全体の流れとして整理する。

## 前提

- Device は起動中、止まるまでこの処理を繰り返す

## 監視処理

1. Device が重量を読み続ける
   - 詳細: `11_weight_measurement.md`
2. Device が皿あり / 皿なしを見続ける
   - 詳細: `12_bowl_detection.md`
3. Device が食事判定に使えない異常値を除外する
   - 詳細: `13_sample_validation.md`
4. Device がイベントをローカルに記録し、送信対象をキューへ積む
   - 詳細: `16_event_queue.md`
5. Device が送信失敗分の再送を行う
   - 詳細: `18_retry_queue.md`
6. Device が DeviceSettings を同期する
   - 詳細: `19_settings_sync.md`

## 食事イベント発生時の流れ

1. 猫がごはんを食べる
2. 皿の上のごはん重量が変化する
3. Device がその変化を食事の可能性がある変化として捉える
4. Device が食事開始 / 食事終了を判定する
   - 詳細: `14_meal_detection.md`
5. Device が 1 セッションの食事量を算出する
   - 詳細: `15_amount_calculation.md`
6. Device がイベントと残量をキューへ積む
   - 詳細: `16_event_queue.md`
7. Device が API へ送信する
    - 詳細: `17_api_send.md`

## 補足

- 閾値一覧は `30_thresholds.md` を参照する
