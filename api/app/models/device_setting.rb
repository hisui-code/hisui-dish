class DeviceSetting < ApplicationRecord
  belongs_to :device
  with_options presence: true, numericality: { only_integer: true, greater_than: 0 } do
    # 計測の基準となる必須時間をサニタイズ
    validates :stable_duration_sec
    validates :max_session_sec
  end

  with_options allow_nil: true, numericality: { only_integer: true, greater_than: 0 } do
    # 任意設定だが正の整数のみ許可
    validates :tare_weight, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  end
end
