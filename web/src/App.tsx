import { useEffect, useState } from 'react'
import { getHealth } from './lib/api'
import DeviceSettingsPage from './pages/DeviceSettingsPage'
import DeviceSettingsDebugPage from './pages/DeviceSettingsDebugPage'

export default function App() {
  const [status, setStatus] = useState<string>('(checking...)')

  useEffect(() => {
    getHealth()
      .then((r) => setStatus(r.status))
      .catch((e) => setStatus(`error: ${e.message}`))
  }, [])

  return (
    <div className="p-6 text-center bg-red-100">
      <h1 className="text-2xl font-bold">Health Check</h1>
      <p className="mt-4">{status}</p>
      <DeviceSettingsPage />
      <DeviceSettingsDebugPage />
    </div>
  )
}
