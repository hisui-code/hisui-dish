import HealthLogDeleteDialog from '@/components/healthlog/HealthLogDeleteDialog'
import HealthLogFilters from '@/components/healthlog/HealthLogFilters'
import HealthLogFormModal from '@/components/healthlog/HealthLogFormModal'
import HealthLogPhotoModal from '@/components/healthlog/HealthLogPhotoModal'
import HealthLogSummaryCards from '@/components/healthlog/HealthLogSummaryCards'
import HealthLogTimeline from '@/components/healthlog/HealthLogTimeline'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useHealthLogPageViewModel } from '@/hooks/healthlog/useHealthLogPageViewModel'
import { BsFillHeartPulseFill } from 'react-icons/bs'
import { FaPlus } from 'react-icons/fa'

/**
 * @description 健康記録ページの表示
 * サマリー、フィルター、タイムライン、モーダルを配置
 */
export default function HealthLog() {
  const viewModel = useHealthLogPageViewModel()

  return (
    <div className="px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6">
        <PageHeader
          icon={<BsFillHeartPulseFill className="h-5 w-5" />}
          title="健康記録"
          right={
            <Button
              type="button"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={viewModel.onOpenCreate}
            >
              <FaPlus className="h-3.5 w-3.5" />
              記録を追加
            </Button>
          }
        />

        {/* サマリーカード */}
        <HealthLogSummaryCards {...viewModel.summaryCards} />

        {/* フィルター */}
        <HealthLogFilters {...viewModel.filters} />

        {/* タイムライン */}
        {viewModel.errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {viewModel.errorMessage}
          </div>
        ) : null}

        {viewModel.isLoading ? (
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            健康記録を読み込んでいます
          </div>
        ) : (
          <HealthLogTimeline {...viewModel.timeline} />
        )}
      </div>
      {/* モーダル */}
      <HealthLogFormModal {...viewModel.formModal} />
      {/* 削除確認モーダル */}
      <HealthLogDeleteDialog {...viewModel.deleteDialog} />
      {/* 写真モーダル */}
      <HealthLogPhotoModal {...viewModel.photoModal} />
    </div>
  )
}
