# デバイス設定 API（取得/更新）
module Api
  module V1
    # デバイス設定の取得・更新用コントローラ
    class DeviceSettingsController < ApplicationController
      # レコード未検出時に 404 を返す想定
      rescue_from ActiveRecord::RecordNotFound do
        render json: { error: "not_found" }, status: :not_found
      end

      # 楽観的ロック競合などの更新衝突時に 409 を返す想定
      rescue_from ActiveRecord::StaleObjectError do
        render json: { error: "conflict", current_version: @setting.reload.lock_version }, status: :conflict
      end

      # バリデーションNGは 422 にする
      rescue_from ActiveRecord::RecordInvalid do |e|
        render json: { error: "unprocessable_entity", messages: e.record.errors.full_messages }, status: :unprocessable_content
      end

      # GET /api/v1/device_settings/:device_id
      # 指定デバイスの設定を返す。存在しなければ作成して返す。
      def show
        device = Device.find(params[:device_id])
        setting = device.device_setting || device.create_device_setting!
        render json: serialize(setting)
      end

      # PUT /api/v1/device_settings/:device_id
      # 設定を作成（未作成時）または更新。`lock_version` による楽観的ロックを想定。
      def update
        device = Device.find(params[:device_id])
        @setting = device.device_setting || device.create_device_setting!
        @setting.update!(device_setting_params)
        render json: serialize(@setting)
      end

      private

      # Strong Parameters: 受け付けるキーを限定
      def device_setting_params
        params.require(:device_setting).permit(:stable_duration_sec, :max_session_sec, :lock_version)
      end

      def serialize(s)
        # レスポンスとして返す項目だけを整形
        {
          device_id: s.device_id,
          stable_duration_sec: s.stable_duration_sec,
          max_session_sec: s.max_session_sec,
          lock_version: s.lock_version,
          updated_at: s.updated_at
        }
      end
    end
  end
end
