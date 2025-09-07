class CreateDeviceSettings < ActiveRecord::Migration[8.0]
  def change
    create_table :device_settings, id: :uuid do |t|
      t.references :device,
                   null: false,
                   foreign_key: { on_delete: :cascade },
                   type: :uuid,
                   index: { unique: true }     # ← ここでUnique Indexを付与

      t.integer :stable_duration_sec, null: false, default: 180
      t.integer :max_session_sec,     null: false, default: 600
      t.integer :lock_version,        null: false, default: 0
      t.timestamps
    end
  end
end
