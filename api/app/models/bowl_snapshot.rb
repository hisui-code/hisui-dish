class BowlSnapshot < ApplicationRecord
  scope :today,      -> { where(created_at: Time.zone.today.all_day) }
  scope :on,         ->(date) { where(created_at: date.in_time_zone.all_day) }
  scope :in_month,   ->(year, month) {
    from = Time.zone.local(year, month, 1).beginning_of_day
    to   = from.end_of_month.end_of_day
    where(created_at: from..to)
  }
end
