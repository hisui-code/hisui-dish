# frozen_string_literal: true

puts "🧪 Seeding bowl_snapshots for 2 months..."
puts "🧪 Seeding users..."

# ===== Users =====
User.delete_all
User.create!(
  email: ENV["ADMIN_EMAIL"],
  password: ENV["ADMIN_PASSWORD"],
  auth_token: SecureRandom.hex(32)
)
puts "✅ Done: User.count=#{User.count}"

ActiveRecord::Base.transaction do
  # 1) スナップショット削除
  BowlSnapshot.delete_all

  # 2) DEVICE_ID が指定されていなければ固定IDを使用
  device_id = ENV["DEVICE_ID"].presence || "70812440-1965-4193-934d-d21e078da956"

  # 3) Device の作成
  device = Device.find_or_create_by!(id: device_id) do |d|
    d.code = "hisuidish-rpi5"   # <-- ★追加（必須）
    d.name = "HisuiDish Pi 1" if d.respond_to?(:name)
  end

  puts "  Device created: id=#{device.id}, code=#{device.code}"

  # ===== BowlSnapshot の生成 =====

  tz_today = Time.zone.today
  months = [
    tz_today.beginning_of_month,
    (tz_today - 1.month).beginning_of_month
  ]

  months.each do |month_begin|
    month_end = month_begin.end_of_month

    (month_begin..month_end).each do |d|
      rand(1..3).times do
        time = Time.zone.local(
          d.year, d.month, d.day,
          rand(6..22),
          [ 0, 10, 20, 30, 40, 50 ].sample
        )

        BowlSnapshot.create!(
          device_id: device.id,
          weight_g:  [ 6, 8, 10, 12, 14 ].sample,
          recorded_at: time
        )
      end
    end
  end
end

puts "✅ Done: BowlSnapshot.count=#{BowlSnapshot.count}"
