class Api::V1::DashboardController < Api::V1::BaseController
  def show
    month = params[:month].presence || Time.zone.today.strftime("%Y-%m")
    month_start = Time.zone.parse("#{month}-01").beginning_of_month
    month_end   = month_start.end_of_month.end_of_day

    # 暫定: device_id は param 優先、なければ最初のデバイス
    device_id = params[:device_id].presence || Device.first&.id
    return render json: { error: "device not found" }, status: 404 unless device_id

    rel = BowlSnapshot.where(device_id: device_id, recorded_at: month_start..month_end)

    #  残りのごはんを取得
    last_snapshot = BowlSnapshot.where(device_id: device_id).order(recorded_at: :desc).first
    bowl_remaining = last_snapshot&.weight_g.to_f

    # === 今月の日別合計（0 埋め含む） ===
    # DATE(recorded_at) ごとに SUM(weight_g)
    raw_daily = rel
                .select("DATE(recorded_at) AS d, SUM(weight_g) AS total")
                .group("DATE(recorded_at)")
                .order("d")

    # 既存日の結果を { '1' => 24, ... } に
    daily_map = raw_daily.index_by { |r| r.d.day.to_s }

    # 1..末日 を 0 埋めで並べる
    days = (month_start.to_date..month_start.end_of_month).map(&:day).map(&:to_s)
    daily_series = days.map { |d| { day: d, total: (daily_map[d]&.total || 0).to_i } }

    # === 今日のイベント ===
    today_start = Time.zone.today.beginning_of_day
    today_end   = Time.zone.today.end_of_day
    today_rel   = BowlSnapshot.where(device_id: device_id, recorded_at: today_start..today_end)

    today_events = today_rel
                   .order(:recorded_at)
                   .pluck(:recorded_at, :weight_g)
                   .map { |t, g| { time: t.strftime("%H:%M"), g: g.to_f } }

    today_total = today_rel.sum(:weight_g).to_f

    # 過去最大3ヶ月分を対象に1日あたりの平均摂取量(g/日)を算出
    average_daily_intake_last_3_months =
      calculate_average_daily_intake_last_3_months(
        device_id: device_id,
        month_start: month_start,
        month_end: month_end
      )

    render json: {
      todayEvents: today_events,
      dailySeries: daily_series,
      todayTotal:  today_total,
      bowlRemaining: bowl_remaining,
      averageDailyIntakeLast3Months: average_daily_intake_last_3_months
    }
  end

  private


  # 過去最大3ヶ月分を対象に1日あたりの平均摂取量(g/日)を返す
  def calculate_average_daily_intake_last_3_months(device_id:, month_start:, month_end:)
    # 対象期間: 指定月から過去３ヶ月前まで
    period_start = (month_start - 3.months).beginning_of_month
    period_end   = (month_start - 1.month).end_of_month

    # BowlSnapshot の recorded_at をもとに期間内のデータを絞り込む
    scope = BowlSnapshot.where(device_id: device_id, recorded_at: period_start..period_end)
    return 0.0 if scope.blank?

    # DATE(recorded_at) ごとに weight_g を合計し、日別の総量を求める
    daily_totals = scope.group("DATE(recorded_at)").sum(:weight_g)

    return 0.0 if daily_totals.empty?

    total_grams     = daily_totals.values.sum          # 期間内の総摂取量（g）
    days_with_meals = daily_totals.keys.size           # 摂取があった日数

    # 過去最大3ヶ月分を対象にした1日あたりの平均摂取量（g/日）
    (total_grams.to_f / days_with_meals).round(1)
  end
end
