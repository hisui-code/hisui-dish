# Device が API へ送信する

## 目的

キューに積んだイベントを API へ送信する。

## 入力

- session event の送信データ
- bowl snapshot の送信データ

## 出力

- API 送信結果

## 処理内容

1. session event 用キューと bowl snapshot 用キューを別々に処理する
2. queue から送る対象を取り出す
3. session event API または bowl snapshot API へ送る
4. 成功したら sent にする
5. 失敗したら再送用の情報を更新する

## なぜ必要か

- Device から Backend へデータを渡す最終段階だから
- API 側で保存できる形式へ揃えて送る必要があるため

## 補足

- session event は `session_id` を冪等キーとして送る
- bowl snapshot は `snapshot_id` を冪等キーとして送る
