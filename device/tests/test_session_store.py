import json
import sys
import tempfile
import unittest
from pathlib import Path


sys.path.append(str(Path(__file__).resolve().parents[1]))

from session_store import append_session_event, build_session_record  # noqa: E402


class SessionStoreTest(unittest.TestCase):
    def test_build_session_record_includes_finished_event_fields(self) -> None:
        # backend へ渡す基本レコードが崩れていないことを固定する
        record = build_session_record(
            'event=eat_finished idle_last=100.00 finish=86.00 eaten=14.00'
        )

        self.assertIsNotNone(record)
        assert record is not None
        self.assertEqual('eat_finished', record['event'])
        self.assertEqual(100.0, record['idle_last'])
        self.assertEqual(86.0, record['finish'])
        self.assertEqual(14.0, record['eaten'])
        self.assertIn('recorded_at', record)

    def test_build_session_record_keeps_non_numeric_values_as_string(self) -> None:
        # 壊れたログ値が来ても保存処理で例外にせず、原因追跡できる形で残す
        record = build_session_record(
            'event=eat_discarded reason=finish_heavier_than_idle '
            'idle_last=100.00 finish=abc eaten=-3.00'
        )

        self.assertIsNotNone(record)
        assert record is not None
        self.assertEqual('abc', record['finish'])
        self.assertEqual(-3.0, record['eaten'])
        self.assertEqual('finish_heavier_than_idle', record['reason'])

    def test_build_session_record_ignores_aborted_event(self) -> None:
        # 集計対象外イベントが session record に混ざらないことを固定する
        self.assertIsNone(build_session_record('event=eat_aborted reason=bowl_removed'))

    def test_append_session_event_writes_jsonl_record(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / 'session_events.jsonl'

            record = append_session_event(
                path=path,
                event_line='event=eat_finished idle_last=100.00 finish=86.00 eaten=14.00',
            )

            self.assertIsNotNone(record)
            lines = path.read_text(encoding='utf-8').splitlines()
            self.assertEqual(1, len(lines))
            saved = json.loads(lines[0])
            self.assertEqual('eat_finished', saved['event'])
            self.assertEqual(14.0, saved['eaten'])
