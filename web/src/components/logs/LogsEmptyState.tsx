import { Utensils } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

type LogsEmptyStateProps = {
  month: string
}

export default function LogsEmptyState({ month }: LogsEmptyStateProps) {
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardContent className="py-10">
        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-muted">
            <Utensils className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 text-base font-semibold">まだログがないよ</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {month}の記録は見つかりませんでした。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
