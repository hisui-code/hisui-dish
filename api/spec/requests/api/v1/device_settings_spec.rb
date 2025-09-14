require 'rails_helper'

RSpec.describe "DeviceSettings API", type: :request do
  let!(:device) { Device.create!(id: SecureRandom.uuid, code: 'rpi5-hisui-01', name: 'hisui') }
  let(:path) { "/api/v1/device_settings/#{device.id}" }

  def fetch_current
    get path
    expect(response).to have_http_status(:ok)
    JSON.parse(response.body)
  end

  describe "GET /api/v1/device_settings/:device_id" do
    it "設定が存在しなくても、デフォルトで自動生成されて返る" do
      json = fetch_current
      expect(json["device_id"]).to eq(device.id)
      expect(json["stable_duration_sec"]).to be > 0
      expect(json["max_session_sec"]).to be > 0
      expect(json["lock_version"]).to be >= 0
      expect(Time.parse(json["updated_at"])).to be_a(Time)
    end
  end

  describe "PUT /api/v1/device_settings/:device_id" do
    context "現在の lock_version を使う場合（正常系）" do
      it "現在の lock_version を使えば更新できる" do
        cur = fetch_current
        payload = {
          device_setting: {
            stable_duration_sec: cur["stable_duration_sec"] + 10,
            max_session_sec: cur["max_session_sec"] + 10,
            lock_version: cur["lock_version"]
          }
        }
        put path, params: payload
        # ステータス200（OK）で返り、lock_version+1
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["stable_duration_sec"]).to eq(payload[:device_setting][:stable_duration_sec])
        expect(json["max_session_sec"]).to eq(payload[:device_setting][:max_session_sec])
        expect(json["lock_version"]).to eq(cur["lock_version"] + 1)
      end
    end

    context "古い lock_versionを使う場合（コンフリクト）" do
      it "lock_version が古いと 409 を返す" do
        cur = fetch_current

        payload = {
          device_setting: {
            stable_duration_sec: cur["stable_duration_sec"] + 10,
            max_session_sec: cur["max_session_sec"] + 10,
            lock_version: cur["lock_version"] - 1
          }
        }
        put path, params: payload
        expect(response).to have_http_status(:conflict)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("conflict")
        expect(json["current_version"]).to be >= cur["lock_version"]
      end
    end

    context "パラメーターが不正な場合（バリデーション）" do
      it "負の値など不正値なら 422 を返す（仕様に合わせて調整）" do
        cur = fetch_current

        payload = {
          device_setting: {
            stable_duration_sec: 0,
            max_session_sec: -1,
            lock_version: cur["lock_version"]
          }
        }

        put path, params: payload
        expect(response.status).to be_between(400, 422).inclusive
      end
    end
  end
end
