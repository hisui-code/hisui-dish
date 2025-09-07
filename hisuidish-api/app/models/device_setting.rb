class DeviceSetting < ApplicationRecord
  belongs_to :device
  validates :stable_duration_sec, :max_session_sec,
            presence: true, numericality: { only_integer: true, greater_than: 0 }
end
