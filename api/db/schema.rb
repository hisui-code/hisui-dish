# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_09_17_143606) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "device_settings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "device_id", null: false
    t.integer "stable_duration_sec", default: 180, null: false
    t.integer "max_session_sec", default: 600, null: false
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "tare_weight", default: 250, null: false
    t.integer "stability_epsilon_g", default: 5, null: false
    t.integer "sampling_hz", default: 10, null: false
    t.integer "moving_avg_window", default: 5, null: false
    t.integer "gross_weight_limit_g", default: 10000, null: false
    t.index ["device_id"], name: "index_device_settings_on_device_id", unique: true
    t.check_constraint "gross_weight_limit_g > 0", name: "chk_device_settings_gross_weight_limit_g_positive"
    t.check_constraint "moving_avg_window > 0", name: "chk_device_settings_moving_avg_window_positive"
    t.check_constraint "sampling_hz > 0", name: "chk_device_settings_sampling_hz_positive"
    t.check_constraint "stability_epsilon_g > 0", name: "chk_device_settings_stability_epsilon_g_positive"
    t.check_constraint "tare_weight > 0", name: "chk_device_settings_tare_weight_positive"
  end

  create_table "devices", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name"
    t.string "code", null: false
    t.datetime "last_seen_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_devices_on_code", unique: true
  end

  add_foreign_key "device_settings", "devices", on_delete: :cascade
end
