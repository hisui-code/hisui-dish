# API: device_settings のバリデーション（全項目を必須に）
class DeviceSetting < ApplicationRecord
  belongs_to :device

  # 全項目必須　1以上
  with_options presence: true,
               numericality: { only_integer: true, greater_than: 0 } do
    validates :stable_duration_sec
    validates :max_session_sec
    validates :tare_weight
    validates :stability_epsilon_g
    validates :sampling_hz
    validates :moving_avg_window
    validates :gross_weight_limit_g
  end
end
