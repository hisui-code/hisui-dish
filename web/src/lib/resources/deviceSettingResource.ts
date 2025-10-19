import createResource from '../suspense'
import { getDeviceSetting } from '../api'
import type { DeviceSetting } from '../../types/deviceSettings'

// DeviceSetting用の Suspense Resource を生成する
export function makeDeviceSettingResource(deviceId: string) {
  return createResource<DeviceSetting>(getDeviceSetting(deviceId))
}
