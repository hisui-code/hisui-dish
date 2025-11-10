class BowlSnapshot < ApplicationRecord
  # belongs_to :device

  scope :in_month, ->(year, month) {
    from = Time.zone.local(year, month, 1).beginning_of_day
    to   = from.end_of_month.end_of_day
    where(recorded_at: from..to)
  }

  scope :today, -> {
    where(recorded_at: Time.zone.today.all_day)
  }
end
