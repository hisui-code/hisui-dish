class DeviceSetting < ApplicationRecord
  belongs_to :device
  # 空白NG / 整数のみ / ０より大きい
  validates :stable_duration_sec, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :max_session_sec, presence: true, numericality: { only_integer: true, greater_than: 0 }
end
