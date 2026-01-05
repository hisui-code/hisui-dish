class CreateDevices < ActiveRecord::Migration[8.0]
  def change
    create_table :devices, id: :uuid do |t|
      t.string :name
      t.string :code, null: false
      t.datetime :last_seen_at
      t.timestamps
    end
    add_index :devices, :code, unique: true
  end
end
