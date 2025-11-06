# api/app/controllers/api/v1/dashboard_controller.rb
module Api
  module V1
    class DashboardController < ApplicationController
      def show
        year, month = parse_month(params[:month])
        monthly = BowlSnapshot.in_month(year, month)

        # 日別合計（1..末日で並び替え）
        daily_series = monthly
                       .group_by { |r| r.created_at.day }
                       .map { |day, rs| { day: day.to_s, total: rs.sum(&:weight_g) } }
                       .sort_by { |h| h[:day].to_i }

        # 今日のイベント
        today_events = BowlSnapshot.today.order(:created_at).map { |r|
          { time: r.created_at.strftime("%H:%M"), g: r.weight_g }
        }


        render json: {
          todayEvents: today_events,
          dailySeries: daily_series,
          todayTotal: today_events.sum { _1[:g] },
          bowlRemaining: 28.5
        }
      end

      private

      # "YYYY-MM" → [year, month]（不正/未指定は今月）
      def parse_month(str)
        if str.present? && str.match?(/\A\d{4}-\d{2}\z/)
          y, m = str.split("-").map!(&:to_i)
          m.between?(1, 12) ? [ y, m ] : now_pair
        else
          now_pair
        end
      end

      def now_pair
        now = Time.zone.today
        [ now.year, now.month ]
      end
    end
  end
end
