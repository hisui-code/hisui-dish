# 90 Decisions (ADR-lite)

- YYYY-MM-DD: DB は UTC 保存に統一。表示/集計は JST 境界 →UTC 変換でクエリする。

  - 理由: サーバ/環境差異でズレない。集計の一貫性が担保できる。
  - 影響: クエリに境界変換が必要。UI 側の「今日」定義も JST 基準。

- YYYY-MM-DD: RasPi→API は REST Push。失敗時は退避 → 再送。
  - 理由: リアルタイム必須ではない。堅牢性重視。
