# frozen_string_literal: true

puts "🧪 Seeding bowl_snapshots for 2 months..."

puts "🧪 Seeding users..."

User.delete_all

User.create!(
  email: ENV["ADMIN_EMAIL"],
  password: ENV["ADMIN_PASSWORD"],
  auth_token: SecureRandom.hex(32)
)

puts "✅ Done: User.count=#{User.count}"

ActiveRecord::Base.transaction do
  # 1) 参照テーブルの用意（先にスナップショット削除）
  BowlSnapshot.delete_all

  # 2) フロントの DEVICE_ID と合わせる: 環境変数があればそれを使い、無ければ固定 or 生成
  #    例: `DEVICE_ID=70812440-1965-4193-934d-d21e078da956 rails db:seed`
  device_id = ENV["DEVICE_ID"].presence || "70812440-1965-4193-934d-d21e078da956"

  # 3) devices に存在しなければ作る（存在すれば取得）
  device = Device.find_by(id: device_id)
  unless device
    device = Device.new(id: device_id)
    # name カラム等があればセット（無ければスキップ）
    device.name = "HisuiDish Pi 1" if device.respond_to?(:name)
    device.save!
  end

  tz_today = Time.zone.today
  months = [
    tz_today.beginning_of_month,            # 今月
    (tz_today - 1.month).beginning_of_month # 先月
  ]

  months.each do |month_begin|
    month_end = month_begin.end_of_month

    (month_begin..month_end).each do |d|
      # 1日あたり 1〜3回 食べたことにする
      rand(1..3).times do
        time = Time.zone.local(d.year, d.month, d.day, rand(6..22), [ 0, 10, 20, 30, 40, 50 ].sample)
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
