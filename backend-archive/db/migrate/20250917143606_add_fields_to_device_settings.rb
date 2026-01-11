class AddFieldsToDeviceSettings < ActiveRecord::Migration[8.0]
  def change
    change_table :device_settings, bulk: true do |t|
      t.integer :tare_weight,          null: false, default: 250
      t.integer :stability_epsilon_g,  null: false, default: 5
      t.integer :sampling_hz,          null: false, default: 10
      t.integer :moving_avg_window,    null: false, default: 5
      t.integer :gross_weight_limit_g, null: false, default: 10000
    end
    add_check_constraint :device_settings,
      "tare_weight > 0",
      name: "chk_device_settings_tare_weight_positive"

    add_check_constraint :device_settings,
      "stability_epsilon_g > 0",
      name: "chk_device_settings_stability_epsilon_g_positive"

    add_check_constraint :device_settings,
      "sampling_hz > 0",
      name: "chk_device_settings_sampling_hz_positive"

    add_check_constraint :device_settings,
      "moving_avg_window > 0",
      name: "chk_device_settings_moving_avg_window_positive"

    add_check_constraint :device_settings,
      "gross_weight_limit_g > 0",
      name: "chk_device_settings_gross_weight_limit_g_positive"
  end
end
