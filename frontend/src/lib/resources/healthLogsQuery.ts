import { resolveDeviceId } from '@/lib/api/config'

/**
 * @description React Query の健康記録一覧キャッシュキーを生成する
 * 月単位かつ端末単位で健康記録一覧を共有する
 */
export const healthLogsQueryKey = (month: string) => {
  const deviceId = resolveDeviceId()

  return ['healthLogs', deviceId, month] as const
}
