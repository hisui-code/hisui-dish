<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
ALTER TABLE ar_internal_metadata
    ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC'
SQL);

        DB::statement(<<<'SQL'
ALTER TABLE users
    ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC'
SQL);

        DB::statement(<<<'SQL'
ALTER TABLE devices
    ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC',
    ALTER COLUMN last_seen_at TYPE timestamptz USING last_seen_at AT TIME ZONE 'UTC'
SQL);

        DB::statement(<<<'SQL'
ALTER TABLE device_settings
    ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC'
SQL);

        DB::statement(<<<'SQL'
ALTER TABLE bowl_snapshots
    ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC',
    ALTER COLUMN recorded_at TYPE timestamptz USING recorded_at AT TIME ZONE 'Asia/Tokyo'
SQL);
    }

    public function down(): void
    {
        DB::statement(<<<'SQL'
ALTER TABLE ar_internal_metadata
    ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC'
SQL);

        DB::statement(<<<'SQL'
ALTER TABLE users
    ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC'
SQL);

        DB::statement(<<<'SQL'
ALTER TABLE devices
    ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC',
    ALTER COLUMN last_seen_at TYPE timestamp USING last_seen_at AT TIME ZONE 'UTC'
SQL);

        DB::statement(<<<'SQL'
ALTER TABLE device_settings
    ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC'
SQL);

        DB::statement(<<<'SQL'
ALTER TABLE bowl_snapshots
    ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC',
    ALTER COLUMN recorded_at TYPE timestamp USING recorded_at AT TIME ZONE 'Asia/Tokyo'
SQL);
    }
};
