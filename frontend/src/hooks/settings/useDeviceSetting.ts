import { useQuery } from '@tanstack/react-query'
import { getDeviceSetting } from '@/lib/api/deviceSettings'
import type { DeviceSetting } from '@/types/deviceSettings'

/**
 * @description デバイス設定の取得状態を返す
 */
export default function useDeviceSetting(deviceId: string) {
  return useQuery<DeviceSetting, Error>({
    queryKey: ['deviceSetting', deviceId],
    queryFn: () => getDeviceSetting(deviceId),
    retry: false,
  })
}
