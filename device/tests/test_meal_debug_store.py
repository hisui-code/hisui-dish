import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path


sys.path.append(str(Path(__file__).resolve().parents[1]))

from meal_debug_store import MealDebugStore  # noqa: E402


class MealDebugStoreTest(unittest.TestCase):
    def test_saves_pre_session_post_samples_per_meal(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            store = MealDebugStore(
                directory=Path(tmp_dir) / 'meal_debug',
                window_seconds=3.0,
                retention_days=90,
            )

            # 食事開始前の直近3サンプルを pre として残したい
            store.append_sample(
                now=0.0,
                recorded_at='2026-03-14T00:00:00+00:00',
                state='IDLE',
                grams=100.0,
                avg_grams=100.0,
                start_baseline=0.0,
                idle_ref=100.0,
            )
            store.append_sample(
                now=1.0,
                recorded_at='2026-03-14T00:00:01+00:00',
                state='IDLE',
                grams=99.8,
                avg_grams=99.9,
                start_baseline=0.0,
                idle_ref=100.0,
            )
            store.append_sample(
                now=2.0,
                recorded_at='2026-03-14T00:00:02+00:00',
                state='IDLE',
                grams=99.7,
                avg_grams=99.8,
                start_baseline=0.0,
                idle_ref=100.0,
            )

            store.begin_capture(now=2.5)

            store.append_sample(
                now=2.6,
                recorded_at='2026-03-14T00:00:02.600000+00:00',
                state='MEASURING',
                grams=98.0,
                avg_grams=98.5,
                start_baseline=0.0,
                idle_ref=100.0,
            )
            store.append_sample(
                now=2.7,
                recorded_at='2026-03-14T00:00:02.700000+00:00',
                state='MEASURING',
                grams=97.2,
                avg_grams=97.9,
                start_baseline=0.0,
                idle_ref=100.0,
            )

            store.finish_capture(
                now=2.8,
                event_line='event=eat_finished idle_last=100.00 finish=95.00 eaten=5.00',
                recorded_at='2026-03-14T00:00:03+00:00',
            )

            store.append_sample(
                now=3.0,
                recorded_at='2026-03-14T00:00:03+00:00',
                state='IDLE',
                grams=95.1,
                avg_grams=95.2,
                start_baseline=0.0,
                idle_ref=95.0,
            )
            store.append_sample(
                now=5.9,
                recorded_at='2026-03-14T00:00:05.900000+00:00',
                state='IDLE',
                grams=95.0,
                avg_grams=95.0,
                start_baseline=0.0,
                idle_ref=95.0,
            )

            saved_path = store.flush_ready_capture(now=6.0)

            self.assertIsNotNone(saved_path)
            assert saved_path is not None
            payload = json.loads(saved_path.read_text(encoding='utf-8'))
            self.assertEqual('eat_finished', payload['event_summary']['event'])
            self.assertEqual(3, len(payload['pre_samples']))
            self.assertEqual(2, len(payload['session_samples']))
            self.assertEqual(2, len(payload['post_samples']))

    def test_cleanup_expired_deletes_files_older_than_retention(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            directory = Path(tmp_dir) / 'meal_debug'
            directory.mkdir()
            old_path = directory / '2025-11-01T00-00-00.000000Z_eat_finished.json'
            new_path = directory / '2026-03-01T00-00-00.000000Z_eat_finished.json'
            old_path.write_text('{}', encoding='utf-8')
            new_path.write_text('{}', encoding='utf-8')

            store = MealDebugStore(
                directory=directory,
                window_seconds=180.0,
                retention_days=90,
            )

            deleted_count = store.cleanup_expired(
                now_utc=datetime(2026, 3, 14, tzinfo=timezone.utc)
            )

            self.assertEqual(1, deleted_count)
            self.assertFalse(old_path.exists())
            self.assertTrue(new_path.exists())


if __name__ == '__main__':
    unittest.main()
