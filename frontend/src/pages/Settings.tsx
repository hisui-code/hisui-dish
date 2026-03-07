import SettingsSkeleton from '../components/skeletons/SettingsSkeleton'
import { resolveDeviceId } from '@/lib/api/config'
import useDeviceSetting from '@/hooks/settings/useDeviceSetting'
import { PageHeader } from '@/components/layout/PageHeader'
import { FaCog } from 'react-icons/fa'
import GenericErrorPage from '@/components/layout/GenericErrorPage'
import DeviceSettingsForm from '@/components/settings/DeviceSettingsForm'

const deviceId = resolveDeviceId()

/**
 * @description 設定画面の中身を表示する
 */
function SettingsInner() {
  const query = useDeviceSetting(deviceId)

  // 取得中はローディング表示を出す
  if (query.isLoading) {
    return <SettingsSkeleton />
  }

  // 取得失敗時は汎用エラーページを表示する
  if (query.isError || !query.data) {
    return <GenericErrorPage onRetry={() => void query.refetch()} />
  }

  return (
    <div className="w-full max-w-2xl">
      <DeviceSettingsForm
        key={query.data.lock_version}
        initial={query.data}
        onReload={() => void query.refetch()}
      />
    </div>
  )
}

/**
 * 設定画面を表示する
 */
export default function Settings() {
  return (
    <div className="px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto w-full max-w-4xl space-y-4 md:space-y-6">
        <PageHeader icon={<FaCog className="h-5 w-5" />} title="デバイス設定" />
        <SettingsInner />
      </div>
    </div>
  )
}
