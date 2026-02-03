import { getDeviceSetting } from '@/lib/api/deviceSettings'
import type { DeviceSetting } from '@/types/deviceSettings'
import { useSuspenseQuery } from '@tanstack/react-query'

/**
 * @description デバイス設定を取得するSuspense対応フック
 * @param deviceId デバイスID
 * @param reloadKey 再読み込みを識別するキー
 * @returns デバイス設定データ
 */
export default function useDeviceSetting(deviceId: string, reloadKey: number) {
  const { data } = useSuspenseQuery<DeviceSetting>({
    queryKey: ['deviceSetting', deviceId, reloadKey],
    queryFn: () => getDeviceSetting(deviceId),
  })
  return data
}
