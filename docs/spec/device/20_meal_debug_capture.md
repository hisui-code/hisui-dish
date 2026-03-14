# Device が食事イベント前後の debug capture を保存する

## 目的

食事イベント前後の重量推移を device 本体へ限定保存し、`idle_ref` に食前ノイズが入ったかを後から確認できるようにする。

## 入力

- `recorded_at`
- `state`
- `grams`
- `avg_grams`
- `start_baseline`
- `idle_ref`
- `eat_started`
- `eat_finished`
- `eat_discarded`
- `eat_aborted`

## 出力

- `device/meal_debug/*.json`

## 処理内容

1. 常時ループでは、直近3分ぶんの要約サンプルをメモリ上のリングバッファへ保持する
2. 1サンプルに保存する項目は、食前ノイズ確認に必要な最小限へ絞る
3. `eat_started` が出たら、その時点の直近3分を `pre_samples` として固定する
4. `eat_started` 以降のサンプルは `session_samples` として保持する
5. `eat_finished` `eat_discarded` `eat_aborted` のいずれかが出たら、終了イベント要約を固定する
6. 終了イベントのあと3分ぶんを `post_samples` として追加で保持する
7. 終了から3分経過したら、`event_summary` `pre_samples` `session_samples` `post_samples` を1ファイルへ保存する
8. 保存ファイル名はイベント時刻を含む形にし、後から時系列順に追いやすくする
9. debug capture は backend へ送らず、device ローカル保存だけにする
10. 起動時と定期実行で保存先を走査し、3か月を超えた debug ファイルは自動削除する

## なぜ必要か

- `session_events.jsonl` だけでは `idle_last` がどう作られたかは追えないため
- `journalctl` は保持期間や取得タイミング次第で、食前の詳細ログが残らないことがあるため
- 常時ファイルへ書き続けると SD カードへの書き込みが増えやすいため
- 食事イベント前後だけを保存すれば、原因調査に必要な情報と保存量のバランスを取りやすいため

## 補足

- 保存対象は debug 用ローカルファイルだけで、既存の `session_events.jsonl` と送信キューには影響させない
- `post_samples` は未来データなので、終了直後ではなく3分後に保存完了する
- 保持期間の3か月は debug capture にだけ適用し、食事イベント本体の保存方法は変えない
