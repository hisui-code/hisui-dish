import json
from datetime import datetime, timezone
from pathlib import Path


def load_applied_state(path: Path) -> dict:
    """
    @description 適用済みDeviceSettings状態を読み込む
    """
    # 初回起動でファイルが無いのは正常
    if not path.exists():
        return {}

    text = path.read_text(encoding='utf-8').strip()
    if not text:
        return {}

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # 壊れたJSONでも処理は止めない
        return {}

    if not isinstance(data, dict):
        return {}

    return data


def save_applied_state(*, path: Path, lock_version: int, settings: dict) -> None:
    """
    @description 適用済みDeviceSettings状態を保存する
    """
    payload = {
        # 次回起動時の比較に使うversion
        'applied_lock_version': lock_version,
        # いつ反映したかを記録
        'applied_at': datetime.now(timezone.utc).isoformat(),
        # API不達時の予備として設定を保存
        'settings': settings,
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')


def load_applied_lock_version(path: Path) -> int:
    """
    @description 適用済みlock_versionを返す 未適用時は-1を返す
    """
    state = load_applied_state(path)
    lock_version = state.get('applied_lock_version')
    if isinstance(lock_version, int):
        return lock_version
    # -1 は未適用扱い
    return -1
