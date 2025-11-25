class Api::V1::BaseController < ApplicationController
  # API は CSRF 検証を無効化
  skip_before_action :verify_authenticity_token, raise: false

  # 本番かつ API_TOKEN 設定時のみ適用
  before_action :require_api_token, if: -> { Rails.env.production? && ENV["API_TOKEN"].present? }
  before_action :authenticate!

  private

  # X-Api-Token を検証（不一致なら 403）
  def require_api_token
    expected = ENV["API_TOKEN"].to_s
    provided = request.headers["X-Api-Token"].to_s
    head :forbidden unless ActiveSupport::SecurityUtils.secure_compare(provided, expected)
  end

  private

  # Authorization ヘッダーからトークンを取り出し現在のユーザーを取得
  def current_user
    auth = request.headers["Authorization"].to_s
    token = auth.split(" ").last
    @current_user ||= User.find_by(auth_token: token) if token.present?
  end

  # current_user がいなければ 401 を返す
  def authenticate!
    render json: { error: "unauthorized" }, status: :unauthorized unless current_user
  end

  def require_login
  end
end
