# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DeviceSetting, type: :model do
  # バリデーション検証用の関連デバイスをセットアップ
  let!(:device) { Device.create!(id: SecureRandom.uuid, code: 'rpi5-hisui-01', name: 'hisui') }

  it "すべての設定値が正しく入力されていれば有効になる" do
    setting = DeviceSetting.new(
      device: device,
      stable_duration_sec: 3,
      max_session_sec: 600,
      tare_weight: 250,
      stability_epsilon_g: 5,
      sampling_hz: 10,
      moving_avg_window: 5,
      gross_weight_limit_g: 10_000
    )
    expect(setting).to be_valid # 正常値を満たしたインスタンスは有効と判定される
  end
end
