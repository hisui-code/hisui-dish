import { Suspense, useState } from 'react'
import DeviceSettingsForm from '../components/settings/DeviceSettingsForm'
import SettingsSkeleton from '../components/skeletons/SettingsSkeleton'
import { resolveDeviceId } from '@/lib/api/config'
import useDeviceSetting from '@/hooks/useDeviceSetting'

const deviceId = resolveDeviceId()

/**
 * @description 設定画面の中身を表示する
 * @returns 設定画面の中身
 */
function SettingsInner() {
  // 再読み込み用のバージョン番号。値を変えると再取得される
  const [ver, setVer] = useState(0)

  const data = useDeviceSetting(deviceId, ver)

  // データ取得後にフォームを表示
  return (
    <div className="flex min-w-0 justify-center p-3">
      <div className="w-full max-w-2xl space-y-4">
        <DeviceSettingsForm initial={data} onReload={() => setVer((v) => v + 1)} />
      </div>
    </div>
  )
}

/**
 * @description 設定画面をサスペンス付きで表示する
 * @returns 設定画面
 */
export default function Settings() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsInner />
    </Suspense>
  )
}
