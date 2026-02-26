import RPi.GPIO as GPIO
from hx711 import HX711

import json
import time
from pathlib import Path

# 既知重りの重量
KNOWN_WEIGHT_G = 100.0

# GPIOピン
DOUT_PIN = 5
PD_SCK_PIN = 6

# 平均化設定
SAMPLE_COUNT = 30
SAMPLE_SLEEP_SEC = 0.05

# 校正値保存先
OUT_FILE = Path(__file__).resolve().parent / "calibration.json"


def create_sensor() -> HX711:
    """
    @description HX711を初期化して返す
    """
    # DOUT/PD_SCKはBCM番号で指定しているためBCMモードを使う
    GPIO.setmode(GPIO.BCM)
    return HX711(dout_pin=DOUT_PIN, pd_sck_pin=PD_SCK_PIN)


SENSOR = create_sensor()


def read_raw_once() -> float:
    """
    @description HX711から生データを1回取得する
    """
    if hasattr(SENSOR, "get_raw_data_mean"):
        value = SENSOR.get_raw_data_mean(readings=1)
    elif hasattr(SENSOR, "get_raw_data"):
        data = SENSOR.get_raw_data(1)
        value = data[0] if data else None
    elif hasattr(SENSOR, "read"):
        value = SENSOR.read()
    else:
        raise RuntimeError("HX711の読み取りAPIが見つからない")

    if value is None:
        raise RuntimeError("HX711の読み取りに失敗")
    return float(value)


def read_raw_average(n: int = SAMPLE_COUNT, sleep_sec: float = SAMPLE_SLEEP_SEC) -> float:
    """
    @description 生データを複数回読み取り平均化する
    """
    values: list[float] = []
    for _ in range(n):
        values.append(read_raw_once())
        time.sleep(sleep_sec)
    return sum(values) / len(values)


def save_calibration(offset: float, scale: float) -> None:
    """
    @description 算出した校正値をJSONで保存する
    """
    payload = {
        "offset": offset,
        "scale": scale,
        "known_weight_g": KNOWN_WEIGHT_G,
        "sample_count": SAMPLE_COUNT,
        "sample_sleep_sec": SAMPLE_SLEEP_SEC,
        "updated_at_unix": int(time.time()),
    }
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    """
    @description 空状態と既知重りからoffset/scaleを求めて保存する
    """
    print("=== HX711 calibration ===")
    print(f"known weight: {KNOWN_WEIGHT_G}g")

    # 空状態でゼロ点を取得する
    input("空の状態で Enter")
    offset = read_raw_average()
    print(f"offset(raw avg): {offset}")

    # 既知重りでスケールを取得する
    input(f"{KNOWN_WEIGHT_G}g を載せて Enter")
    raw_with_weight = read_raw_average()
    print(f"raw_with_weight(raw avg): {raw_with_weight}")

    delta = raw_with_weight - offset
    if delta == 0:
        raise RuntimeError("差分が0のためscaleを算出できない")

    scale = delta / KNOWN_WEIGHT_G
    print(f"scale(raw per g): {scale}")

    save_calibration(offset=offset, scale=scale)
    print(f"saved: {OUT_FILE}")

    print("=== live check (Ctrl+Cで終了) ===")
    while True:
        raw = read_raw_average(n=10, sleep_sec=0.02)
        grams = (raw - offset) / scale
        print(f"{grams:.2f} g")
        time.sleep(0.2)


if __name__ == "__main__":
    try:
        main()
    finally:
        # プロセス終了時にGPIO状態を開放する
        GPIO.cleanup()
