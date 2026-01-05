class Device < ApplicationRecord
  has_one :device_setting, dependent: :destroy
  validates :code, presence: true, uniqueness: true
end
