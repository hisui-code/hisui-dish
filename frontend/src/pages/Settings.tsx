import { Suspense, useState } from 'react'
import DeviceSettingsForm from '../components/settings/DeviceSettingsForm'
import SettingsSkeleton from '../components/skeletons/SettingsSkeleton'
import { resolveDeviceId } from '@/lib/api/config'
import useDeviceSetting from '@/hooks/settings/useDeviceSetting'
import { PageHeader } from '@/components/layout/PageHeader'
import { FaCog } from 'react-icons/fa'

const deviceId = resolveDeviceId()

/**
 * @description 設定画面の中身を表示する
 * @returns 設定画面の中身
 */
function SettingsInner() {
  const [ver, setVer] = useState(0)
  const data = useDeviceSetting(deviceId, ver)

  return (
    <div className="w-full max-w-2xl">
      <DeviceSettingsForm initial={data} onReload={() => setVer((v) => v + 1)} />
    </div>
  )
}

/**
 * @description 設定画面をサスペンス付きで表示する
 * @returns 設定画面
 */
export default function Settings() {
  return (
    <div className="px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto w-full max-w-4xl space-y-4 md:space-y-6">
        <PageHeader icon={<FaCog className="h-5 w-5" />} title="デバイス設定" />
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsInner />
        </Suspense>
      </div>
    </div>
  )
}
