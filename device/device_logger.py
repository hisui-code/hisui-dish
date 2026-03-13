from typing import Any

import structlog


def _format_log_value(value: Any) -> str:
    """
    @description ログ出力用に値を key=value 文字列へ整形する
    """
    if isinstance(value, float):
        return f'{value:.2f}'

    if value is None:
        return 'NA'

    return str(value)


def _render_key_value_log(_: Any, __: str, event_dict: dict[str, Any]) -> str:
    """
    @description structlog の event_dict を既存互換の key=value 形式へ変換する
    """
    rendered_parts: list[str] = []
    event_name = event_dict.pop('event_name', None)
    state_name = event_dict.pop('state', None)
    message = event_dict.pop('event', None)

    if event_name not in (None, ''):
        rendered_parts.append(f'event={_format_log_value(event_name)}')
    elif state_name not in (None, ''):
        rendered_parts.append(f'state={_format_log_value(state_name)}')
    elif message not in (None, ''):
        rendered_parts.append(str(message))

    if event_name not in (None, '') and state_name not in (None, ''):
        rendered_parts.append(f'state={_format_log_value(state_name)}')
    elif state_name not in (None, '') and message not in (None, ''):
        rendered_parts.append(f'message={_format_log_value(message)}')
    elif message not in (None, '') and event_name not in (None, ''):
        rendered_parts.append(f'message={_format_log_value(message)}')

    for key, value in event_dict.items():
        rendered_parts.append(f'{key}={_format_log_value(value)}')

    return ' '.join(rendered_parts)


def configure_logging() -> None:
    """
    @description device で使う structlog を key=value 形式で初期化する
    """
    if structlog.is_configured():
        return

    structlog.configure(
        processors=[
            _render_key_value_log,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(0),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger() -> structlog.typing.FilteringBoundLogger:
    """
    @description device 共通 logger を返す
    """
    configure_logging()
    return structlog.get_logger()


def log_event(logger: structlog.typing.FilteringBoundLogger, event: str, **fields: Any) -> None:
    """
    @description event 名と付帯情報を key=value で出力する
    """
    logger.info('', event_name=event, **fields)


def log_state(logger: structlog.typing.FilteringBoundLogger, state: str, **fields: Any) -> None:
    """
    @description 状態監視ログを key=value で出力する
    """
    logger.info('', state=state, **fields)


def log_fields(logger: structlog.typing.FilteringBoundLogger, **fields: Any) -> None:
    """
    @description event 名を持たない設定ダンプを key=value で出力する
    """
    logger.info('', **fields)
