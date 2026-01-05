class Api::V1::HealthController < Api::V1::BaseController
  skip_before_action :authenticate!
  def show
    render json: { status: "ok", time: Time.current }
  end
end
