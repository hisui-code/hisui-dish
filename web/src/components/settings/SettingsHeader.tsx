// src/components/settings/SettingsHeader.tsx
import { FaCog } from 'react-icons/fa'

type Props = {
  deviceId: string
  lockVersion: number
  updatedAt: string
}

export default function SettingsHeader({ lockVersion, updatedAt }: Props) {
  return (
    <div>
      <h2 className="flex justify-between items-center text-[18px] font-semibold tracking-tight text-emerald-700">
        <span className="flex items-center gap-2">
          <FaCog className="text-emerald-500" />
          デバイス設定
        </span>
        <span className="text-xs text-neutral-600 flex gap-4">
          <span>lock_version: {lockVersion}</span>
          <span>updated_at: {new Date(updatedAt).toLocaleString()}</span>
        </span>
      </h2>
    </div>
  )
}
