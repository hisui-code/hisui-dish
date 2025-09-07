class ApplicationController < ActionController::API
  # API は CSRF 検証を無効化
  skip_before_action :verify_authenticity_token, raise: false

  # 本番かつ API_TOKEN 設定時のみ適用
  before_action :require_api_token, if: -> { Rails.env.production? && ENV["API_TOKEN"].present? }

  private

  # X-Api-Token を検証（不一致なら 403）
  def require_api_token
    expected = ENV["API_TOKEN"].to_s
    provided = request.headers["X-Api-Token"].to_s
    head :forbidden unless ActiveSupport::SecurityUtils.secure_compare(provided, expected)
  end
end
