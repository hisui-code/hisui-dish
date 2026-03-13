import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


sys.path.append(str(Path(__file__).resolve().parents[1]))

from queue_store import enqueue_bowl_snapshot, enqueue_finished_event, flush_queue  # noqa: E402


class QueueStoreTest(unittest.TestCase):
    def test_enqueue_finished_event_ignores_non_finished_record(self) -> None:
        # queue には集計対象の eat_finished だけを積む
        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / 'queue.jsonl'

            queued = enqueue_finished_event(
                path=path,
                record={'event': 'eat_discarded', 'eaten': 1.0},
                device_id='device-1',
            )

            self.assertFalse(queued)
            self.assertFalse(path.exists())

    def test_enqueue_finished_event_writes_pending_queue_item(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir, patch('queue_store.uuid4', return_value='session-1'):
            path = Path(tmp_dir) / 'queue.jsonl'

            queued = enqueue_finished_event(
                path=path,
                record={
                    'event': 'eat_finished',
                    'eaten': 12.5,
                    'recorded_at': '2026-03-13T00:00:00+00:00',
                },
                device_id='device-1',
            )

            self.assertTrue(queued)
            saved = json.loads(path.read_text(encoding='utf-8').strip())
            self.assertEqual('pending', saved['status'])
            self.assertEqual('session-1', saved['payload']['session_id'])
            self.assertEqual(12.5, saved['payload']['eaten'])

    def test_flush_queue_marks_success_as_sent(self) -> None:
        # sender の結果だけで queue 状態が sent に遷移することを固定する
        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / 'queue.jsonl'
            path.write_text(
                json.dumps(
                    {
                        'status': 'pending',
                        'attempt_count': 0,
                        'next_retry_at': 0,
                        'payload': {'event': 'eat_finished'},
                    },
                    ensure_ascii=False,
                ) + '\n',
                encoding='utf-8',
            )

            stats = flush_queue(
                path=path,
                retry_interval_sec=60,
                max_retry_count=3,
                sender=lambda payload: (True, 'HTTP 200'),
            )

            self.assertEqual({'sent': 1, 'retried': 0, 'failed': 0}, stats)
            saved = json.loads(path.read_text(encoding='utf-8').strip())
            self.assertEqual('sent', saved['status'])

    def test_flush_queue_marks_failed_after_max_retry(self) -> None:
        # max retry 到達時に pending のまま残らないことを固定する
        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / 'queue.jsonl'
            path.write_text(
                json.dumps(
                    {
                        'status': 'pending',
                        'attempt_count': 2,
                        'next_retry_at': 0,
                        'payload': {'event': 'eat_finished'},
                    },
                    ensure_ascii=False,
                ) + '\n',
                encoding='utf-8',
            )

            stats = flush_queue(
                path=path,
                retry_interval_sec=60,
                max_retry_count=3,
                sender=lambda payload: (False, 'NETWORK timeout'),
            )

            self.assertEqual({'sent': 0, 'retried': 0, 'failed': 1}, stats)
            saved = json.loads(path.read_text(encoding='utf-8').strip())
            self.assertEqual('failed', saved['status'])

    def test_enqueue_bowl_snapshot_rounds_weight(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir, patch('queue_store.uuid4', return_value='snapshot-1'):
            path = Path(tmp_dir) / 'queue.jsonl'

            queued = enqueue_bowl_snapshot(
                path=path,
                device_id='device-1',
                weight_g=12.345,
            )

            self.assertTrue(queued)
            saved = json.loads(path.read_text(encoding='utf-8').strip())
            self.assertEqual(12.35, saved['payload']['weight_g'])
