import sys
import unittest
from pathlib import Path


sys.path.append(str(Path(__file__).resolve().parents[1]))

from eating_state_machine import EatingDetector, EatingDetectorConfig  # noqa: E402


class EatingDetectorTest(unittest.TestCase):
    def setUp(self) -> None:
        self.detector = EatingDetector(
            EatingDetectorConfig(
                start_threshold_g=5.0,
                start_confirm_seconds=0.2,
                idle_up_spike_ignore_g=3.0,
                idle_reference_up_update_threshold_g=8.0,
                idle_reference_up_update_seconds=0.6,
                stability_epsilon_g=0.5,
                end_stable_seconds=0.2,
                finalize_seconds=0.2,
                max_session_seconds=10.0,
                min_consumed_g=1.0,
            )
        )

    def feed(self, samples: list[float], *, start_at: float = 0.0, step: float = 0.1) -> list[str]:
        events: list[str] = []
        now = start_at
        for sample in samples:
            events.extend(
                self.detector.step(
                    avg_grams=sample,
                    gross_avg_grams=sample,
                    now=now,
                )
            )
            now += step
        return events

    def test_finished_uses_stable_finish_weight_instead_of_minimum(self) -> None:
        self.feed([100.0, 100.0, 100.0, 100.0], start_at=0.0)

        events = self.feed(
            [94.0, 90.0, 90.0, 60.0, 86.0, 86.0, 86.0, 86.0, 86.0, 86.0, 86.0],
            start_at=0.4,
        )

        self.assertIn(
            'event=eat_finished idle_last=100.00 finish=86.00 eaten=14.00',
            events,
        )
        self.assertNotIn(
            'event=eat_finished idle_last=100.00 finish=60.00 eaten=40.00',
            events,
        )

    def test_discarded_when_finish_is_heavier_than_idle(self) -> None:
        self.feed([100.0, 100.0, 100.0, 100.0], start_at=0.0)

        self.feed([94.0, 90.0, 90.0, 90.0], start_at=0.4)
        events = self.feed(
            [103.0, 103.0, 103.0, 103.0, 103.0, 103.0],
            start_at=0.8,
        )

        self.assertIn(
            'event=eat_discarded reason=finish_heavier_than_idle '
            'idle_last=100.00 finish=103.00 eaten=-3.00',
            events,
        )

    def test_temporary_upward_load_does_not_replace_idle_reference(self) -> None:
        self.feed([178.5, 178.5, 178.5, 178.5], start_at=0.0)

        # 一時的な荷重は大きくても短時間なら idle_ref にしない
        self.feed([198.7, 198.7, 198.7, 198.7], start_at=0.4)
        self.feed([178.5, 178.5, 178.5, 178.5], start_at=0.8)

        events = self.feed(
            [172.0, 168.5, 168.5, 168.5, 168.5, 168.5, 168.5],
            start_at=1.2,
        )

        self.assertIn(
            'event=eat_finished idle_last=178.50 finish=168.50 eaten=10.00',
            events,
        )

    def test_sustained_upward_increase_can_promote_idle_reference(self) -> None:
        self.feed([178.5, 178.5, 178.5, 178.5], start_at=0.0)

        self.feed(
            [190.0, 190.0, 190.0, 190.0, 190.0, 190.0, 190.0, 190.0, 190.0, 190.0],
            start_at=0.4,
        )

        self.assertAlmostEqual(self.detector.idle_reference_gross_grams or 0.0, 190.0, places=2)


if __name__ == '__main__':
    unittest.main()
