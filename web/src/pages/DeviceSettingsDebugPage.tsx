import { useEffect, useState } from 'react'
import { fetchDeviceSettings } from '../api/deviceSettings'
import type { DeviceSetting } from '../types/deviceSettings'

export default function DeviceSettingsDebugPage() {
  const [data, setData] = useState<DeviceSetting | null>(null)
  const [error, setError] = useState<string>('')

  const base = import.meta.env.VITE_API_BASE as string
  const id = import.meta.env.VITE_DEVICE_ID as string

  useEffect(() => {
    const run = async () => {
      setError('')
      setData(null)
      try {
        const res = await fetchDeviceSettings(base, id)
        setData(res)
      } catch (e) {
        setError((e as Error).message)
      }
    }
    run()
  }, [base, id])

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <h1 className="text-lg font-bold mb-2">GET 疎通確認</h1>
        <p>エラー: {error}</p>
        <div className="p-2 text-xs text-gray-500">
          base: [{import.meta.env.VITE_API_BASE}]<br />
          id: [{import.meta.env.VITE_DEVICE_ID}]
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-4 text-gray-600">Loading...</div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">GET 疎通確認ページ</h1>
      <pre className="bg-gray-100 p-2 rounded text-sm">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
