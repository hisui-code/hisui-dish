import { Suspense, useMemo, useState } from 'react'
import DeviceSettingsForm from '../components/settings/DeviceSettingsForm'
import { makeDeviceSettingResource } from '../lib/resources/deviceSettingResource'
import SettingsSkeleton from '../components/skeletons/SettingsSkeleton'

// 環境変数からデバイスIDを取得
const DEVICE_ID = import.meta.env.VITE_DEVICE_ID as string

// デバイス設定ページ（親コンポーネント）
export default function Settings() {
  // 再読み込み用のバージョン番号。値を変えるとリソースが再生成される
  const [ver, setVer] = useState(0)

  // Suspense用のデータリソースを生成（verが変わるたびに再作成される）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resource = useMemo(() => makeDeviceSettingResource(DEVICE_ID), [ver])

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Device Settings</h1>

      {/* データ取得中は Skeletonを表示 */}
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsBody
          key={ver} // keyを変えることでReactが再マウントする（再読込対策）
          resource={resource} // Suspense対応のデータリソース
          onReload={() => setVer((v) => v + 1)} // 再読み込み用の関数
        />
      </Suspense>
    </div>
  )
}

// 実際の設定フォームを描画する部分
function SettingsBody({
  resource,
  onReload,
}: {
  resource: ReturnType<typeof makeDeviceSettingResource>
  onReload: () => void
}) {
  // Suspenseの仕組みにより、ここでデータが未取得ならthrowされ、fallbackが表示される
  const data = resource.read()

  // データ取得後にフォームを表示
  return <DeviceSettingsForm initial={data} onReload={onReload} />
}
