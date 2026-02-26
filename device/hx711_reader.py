import RPi.GPIO as GPIO
from hx711 import HX711


def create_sensor(dout_pin: int, pd_sck_pin: int) -> HX711:
    """
    @description HX711を初期化して返す
    """
    # DOUT/PD_SCKはBCM番号で扱う
    GPIO.setmode(GPIO.BCM)
    return HX711(dout_pin=dout_pin, pd_sck_pin=pd_sck_pin)


def read_raw_once(sensor: HX711) -> float:
    """
    @description HX711から生データを1回取得する
    """
    # ライブラリ差分を吸収して1サンプルを取得する
    if hasattr(sensor, 'get_raw_data_mean'):
        value = sensor.get_raw_data_mean(readings=1)
    elif hasattr(sensor, 'get_raw_data'):
        data = sensor.get_raw_data(1)
        value = data[0] if data else None
    elif hasattr(sensor, 'read'):
        value = sensor.read()
    else:
        raise RuntimeError('HX711の読み取りAPIが見つからない')

    if value is None:
        raise RuntimeError('HX711の読み取りに失敗')

    return float(value)


def convert_raw_to_grams(raw: float, offset: float, scale: float) -> float:
    """
    @description 生データをgに変換する
    """
    return (raw - offset) / scale


def cleanup_gpio() -> None:
    """
    @description GPIOを開放する
    """
    GPIO.cleanup()
