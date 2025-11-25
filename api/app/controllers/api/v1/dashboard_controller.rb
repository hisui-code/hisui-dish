class Api::V1::DashboardController < Api::V1::BaseController
  def index
    # 例: "2025-11"
    month = params[:month].presence || Time.zone.today.strftime("%Y-%m")
    month_start = Time.zone.parse("#{month}-01").beginning_of_month
    month_end   = month_start.end_of_month.end_of_day

    # 暫定: device_id は param 優先、なければ最初のデバイス
    device_id = params[:device_id].presence || Device.first&.id
    return render json: { error: "device not found" }, status: 404 unless device_id

    rel = BowlSnapshot.where(device_id: device_id, recorded_at: month_start..month_end)

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

    render json: {
      todayEvents: today_events,
      dailySeries: daily_series,
      todayTotal:  today_total,
      bowlRemaining: 28.5 # TODO: 実装時に置き換え
    }
  end
end
