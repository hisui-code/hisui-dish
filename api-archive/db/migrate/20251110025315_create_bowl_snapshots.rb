class CreateBowlSnapshots < ActiveRecord::Migration[8.0]
  def change
    create_table :bowl_snapshots, id: :uuid do |t|
      t.references :device, type: :uuid, null: false, foreign_key: true
      t.integer :weight_g,  null: false
      t.datetime :recorded_at, null: false
      t.timestamps
    end

    add_index :bowl_snapshots, [ :device_id, :recorded_at ]
    add_index :bowl_snapshots, :recorded_at
  end
end
