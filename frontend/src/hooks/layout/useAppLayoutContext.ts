import { useOutletContext } from 'react-router-dom'
import type { UserListItem } from '@/types/users'

/**
 * @description AppLayout から子ルートへ渡す共通レイアウト情報
 * me はログインユーザー情報、isAdmin は権限制御に使う
 */
export type AppLayoutOutletContext = {
  me: UserListItem | undefined
  isAdmin: boolean
}

/**
 * @description AppLayout の Outlet context を型付きで取得する
 * 各ページやhookで useMeQuery を重複実行しないための入口として使う
 * @returns レイアウト共有情報
 */
export function useAppLayoutContext() {
  return useOutletContext<AppLayoutOutletContext>()
}
