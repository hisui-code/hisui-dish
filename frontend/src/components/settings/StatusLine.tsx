// src/components/settings/StatusLine.tsx
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa'

type Props = {
  msg: string
  hasError: boolean
  dirty: boolean
}

export default function StatusLine({ msg, hasError, dirty }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {msg ? (
        <>
          <FaCheckCircle className="text-emerald-600" />
          <span className="text-emerald-700">{msg}</span>
        </>
      ) : hasError ? (
        <>
          <FaExclamationTriangle className="text-rose-600" />
          <span className="text-rose-600">未入力/不正な値があります</span>
        </>
      ) : dirty ? (
        <>
          <FaInfoCircle className="text-amber-500" />
          <span className="text-amber-600">未保存の変更があります</span>
        </>
      ) : (
        <span className="text-neutral-500">すべての値は範囲内の整数</span>
      )}
    </div>
  )
}
