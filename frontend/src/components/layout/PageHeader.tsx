import type { ReactNode } from 'react'

/**
 * @description ページ共通ヘッダーの表示オプション
 * タイトルや説明文、アイコン、右側アクションを画面ごとに差し替える
 */
type PageHeaderProps = {
  title: string
  icon?: ReactNode
  right?: ReactNode
  titleClassName?: string
}

/**
 * @description 設定・ログ・ユーザー管理などで共通利用するページヘッダー
 */
export function PageHeader({
  title,
  icon,
  right,
  titleClassName = 'text-xl font-semibold text-emerald-600',
}: PageHeaderProps) {
  return (
    // 左側にタイトル群、右側に任意アクションを配置する共通レイアウト
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {/* 画面固有のヘッダーアイコンを差し込む */}
          {icon ? <span className="text-emerald-500">{icon}</span> : null}
          <h1 className={titleClassName}>{title}</h1>
        </div>
      </div>
      {/* 右上のボタン群や補助情報を差し込む領域 */}
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  )
}
