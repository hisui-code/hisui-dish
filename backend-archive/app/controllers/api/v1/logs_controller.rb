class Api::V1::LogsController < Api::V1::BaseController
  def index
    month = params[:month].presence || Time.zone.today.strftime("%Y-%m")

    month_start = Time.zone.parse("#{month}-01")&.beginning_of_month
    return render json: { error: "invalid month" }, status: :bad_request unless month_start

    month_end = month_start.end_of_month.end_of_day

    device_id = params[:device_id].presence || Device.first&.id
    return render json: { error: "device not found" }, status: :not_found unless device_id

    # 降順
    rel = BowlSnapshot
          .where(device_id: device_id, recorded_at: month_start..month_end)
          .order(recorded_at: :desc, id: :desc)

    render json: {
      logs: rel.map { |x|
        {
          id: x.id,
          recordedAtIso: x.recorded_at.in_time_zone("Asia/Tokyo").iso8601,
          grams: x.weight_g
        }
      }
    }
  end
end
