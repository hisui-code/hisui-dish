# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "DeviceSettings API (normal case)", type: :request do
  let!(:device) { Device.create!(id: SecureRandom.uuid, code: 'rpi5-hisui-01', name: 'hisui') }

  let!(:user) do
    User.create!(
      email: "device-settings@example.com",
      password: "password",
      password_confirmation: "password"
    )
  end

  let(:headers) do
    # ランダムトークンを発行し、HTTPヘッダー(Authorization ヘッダー)を作成
    user.regenerate_auth_token if user.auth_token.blank?
    { "Authorization" => "Bearer #{user.auth_token}" }
  end

  let(:path) { "/api/v1/device_settings/#{device.id}" }

  def json!
    JSON.parse(response.body)
  end

  # React -> Rails
  describe "GET /api/v1/device_settings/:device_id" do
    context "設定が存在する場合" do
      before do
        DeviceSetting.create!(
          device: device,
          stable_duration_sec: 3,
          max_session_sec: 600,
          tare_weight: 250,
          stability_epsilon_g: 5,
          sampling_hz: 10,
          moving_avg_window: 5,
          gross_weight_limit_g: 10_000
        )
      end

      it "200 を返し、設定内容を返す" do
        get path, headers: headers
        expect(response).to have_http_status(:ok)
        body = json!
        expect(body["device_id"]).to eq(device.id)
        expect(body["stable_duration_sec"]).to eq(3)
        expect(body["max_session_sec"]).to eq(600)
      end
    end

    context "設定が存在しない場合" do
      it "404 を返し、エラーキーを含む" do
        # 念のため該当デバイスの設定をクリア
        DeviceSetting.where(device: device).delete_all
        get path, headers: headers
        expect(response).to have_http_status(:not_found)
        body = json!
        expect(body).to include("error" => "not_found")
      end
    end
  end

  # Rails -> DB
  describe "PUT /api/v1/device_settings/:device_id" do
    context "設定が存在しない場合" do
      it "404 を返し、エラーキーを含む" do
        # 念のため該当デバイスの設定をクリア
        DeviceSetting.where(device: device).delete_all

        payload = {
          device_setting: {
            stable_duration_sec: 5,
            max_session_sec: 500,
            lock_version: 0
          }
        }

        put path, params: payload, headers: headers, as: :json
        expect(response).to have_http_status(:not_found)
        body = json!
        expect(body).to include("error" => "not_found")
      end
    end
    context "設定が存在する場合（正常更新）" do
      before do
        @setting = DeviceSetting.create!(
          device: device,
          stable_duration_sec: 3,
          max_session_sec: 600,
          tare_weight: 250,
          stability_epsilon_g: 5,
          sampling_hz: 10,
          moving_avg_window: 5,
          gross_weight_limit_g: 10_000
        )
      end

      it "200 を返し、lock_version が +1 される" do
        payload = {
          device_setting: {
            stable_duration_sec: 4,
            max_session_sec: 601,
            tare_weight: 260,
            stability_epsilon_g: 6,
            sampling_hz: 12,
            moving_avg_window: 6,
            gross_weight_limit_g: 12_000,
            lock_version: @setting.lock_version
          }
        }
        put path, params: payload, headers: headers, as: :json
        expect(response).to have_http_status(:ok)
        body = json!
        expect(body["lock_version"]).to eq(@setting.lock_version + 1)
        expect(body["tare_weight"]).to eq(260)
        expect(body["sampling_hz"]).to eq(12)
      end
    end
    context "不正な値を送った場合（422）" do
      before do
        @setting = DeviceSetting.create!(
          device: device,
          stable_duration_sec: 3,
          max_session_sec: 600,
          tare_weight: 250,
          stability_epsilon_g: 5,
          sampling_hz: 10,
          moving_avg_window: 5,
          gross_weight_limit_g: 10_000
        )
      end

      it "422 を返し、エラー内容を含む" do
        payload = {
          device_setting: {
            stable_duration_sec: 0,
            max_session_sec: -1,
            tare_weight: 250,
            stability_epsilon_g: 5,
            sampling_hz: 10,
            moving_avg_window: 5,
            gross_weight_limit_g: 10_000,
            lock_version: @setting.lock_version
          }
        }

        put path, params: payload, headers: headers, as: :json
        expect(response).to have_http_status(:unprocessable_content)
        body = json!
        expect(body["error"]).to eq("unprocessable_entity")
      end
    end

    context "lock_version が古い場合（409）" do
      before do
        @setting = DeviceSetting.create!(
          device: device,
          stable_duration_sec: 3,
          max_session_sec: 600,
          tare_weight: 250,
          stability_epsilon_g: 5,
          sampling_hz: 10,
          moving_avg_window: 5,
          gross_weight_limit_g: 10_000
        )
      end

      it "409 を返し、current_version を含む" do
        payload = {
          device_setting: {
            stable_duration_sec: 4,
            max_session_sec: 601,
            tare_weight: 260,
            stability_epsilon_g: 6,
            sampling_hz: 12,
            moving_avg_window: 6,
            gross_weight_limit_g: 12_000,
            lock_version: @setting.lock_version - 1 # ← 古いバージョン
          }
        }

        put path, params: payload, headers: headers, as: :json
        expect(response).to have_http_status(:conflict)
        body = json!
        expect(body["error"]).to eq("conflict")
        expect(body["current_version"]).to be >= @setting.lock_version
      end
    end
  end
end
