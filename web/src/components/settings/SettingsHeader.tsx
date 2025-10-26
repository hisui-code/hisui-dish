// src/components/settings/SettingsHeader.tsx
import { FaCog } from 'react-icons/fa'

type Props = {
  deviceId: string
  lockVersion: number
  updatedAt: string
}

export default function SettingsHeader({ deviceId, lockVersion, updatedAt }: Props) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-[18px] font-semibold tracking-tight text-emerald-700">
        <FaCog className="text-emerald-500" />
        デバイス設定
      </h2>
      <div className="mt-3 space-y-1 rounded-md border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-xs">
        <div className="text-neutral-700">
          Device ID: <span className="font-mono">{deviceId}</span>
        </div>
        <div className="text-neutral-600">lock_version: {lockVersion}</div>
        <div className="text-neutral-600">updated_at: {new Date(updatedAt).toLocaleString()}</div>
      </div>
    </div>
  )
}
