import time

from calibration_store import save_calibration
from config import (
    CALIBRATION_FILE,
    DOUT_PIN,
    KNOWN_WEIGHT_G,
    PD_SCK_PIN,
    SAMPLE_COUNT,
    SAMPLE_SLEEP_SEC,
)
from hx711_reader import cleanup_gpio, create_sensor, read_raw_once


SENSOR = create_sensor(dout_pin=DOUT_PIN, pd_sck_pin=PD_SCK_PIN)


def read_raw_average(n: int = SAMPLE_COUNT, sleep_sec: float = SAMPLE_SLEEP_SEC) -> float:
    """
    @description 生データを複数回読み取り平均化する
    """
    values: list[float] = []
    for _ in range(n):
        values.append(read_raw_once(SENSOR))
        time.sleep(sleep_sec)
    return sum(values) / len(values)


def main() -> None:
    """
    @description 空状態と既知重りからoffset/scaleを求めて保存する
    """
    print('=== HX711 calibration ===')
    print(f'known weight: {KNOWN_WEIGHT_G}g')

    # 空状態でゼロ点を取得する
    input('空の状態で Enter')
    offset = read_raw_average()
    print(f'offset(raw avg): {offset}')

    # 既知重りでスケールを取得する
    input(f'{KNOWN_WEIGHT_G}g を載せて Enter')
    raw_with_weight = read_raw_average()
    print(f'raw_with_weight(raw avg): {raw_with_weight}')

    delta = raw_with_weight - offset
    if delta == 0:
        raise RuntimeError('差分が0のためscaleを算出できない')

    scale = delta / KNOWN_WEIGHT_G
    print(f'scale(raw per g): {scale}')

    save_calibration(
        path=CALIBRATION_FILE,
        offset=offset,
        scale=scale,
        known_weight_g=KNOWN_WEIGHT_G,
        sample_count=SAMPLE_COUNT,
        sample_sleep_sec=SAMPLE_SLEEP_SEC,
    )
    print(f'saved: {CALIBRATION_FILE}')

    print('=== live check (Ctrl+Cで終了) ===')
    while True:
        raw = read_raw_average(n=10, sleep_sec=0.02)
        grams = (raw - offset) / scale
        print(f'{grams:.2f} g')
        time.sleep(0.2)


if __name__ == '__main__':
    try:
        main()
    finally:
        # プロセス終了時にGPIO状態を開放する
        cleanup_gpio()
