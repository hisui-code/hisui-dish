import { Card, CardContent } from '@/components/ui/card'

/**
 * @description 全画面のローディング表示を行う
 * 認証判定中などの真っ白画面を防ぐ
 */
export function FullScreenLoading() {
  return (
    <div className="min-h-screen grid place-items-center bg-neutral-50">
      <Card className="w-[220px]">
        <CardContent className="flex items-center justify-center py-8">
          {/* 点滅ドットで読み込み中を視覚的に示す */}
          <div className="flex items-center gap-2" aria-label="loading">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.2s]" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.1s]" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-bounce" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
