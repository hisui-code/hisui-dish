import json
import time
from pathlib import Path


def load_calibration(path: Path) -> tuple[float, float]:
    """
    @description calibration.jsonからoffsetとscaleを読み込む
    """
    if not path.exists():
        raise RuntimeError(f'校正値ファイルが見つからない: {path}')

    data = json.loads(path.read_text(encoding='utf-8'))
    offset = float(data['offset'])
    scale = float(data['scale'])

    if scale == 0:
        raise RuntimeError('scaleが0のためg変換できない')

    return offset, scale


def save_calibration(
    path: Path,
    offset: float,
    scale: float,
    known_weight_g: float,
    sample_count: int,
    sample_sleep_sec: float,
) -> None:
    """
    @description 算出した校正値をJSONで保存する
    """
    payload = {
        'offset': offset,
        'scale': scale,
        'known_weight_g': known_weight_g,
        'sample_count': sample_count,
        'sample_sleep_sec': sample_sleep_sec,
        'updated_at_unix': int(time.time()),
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
