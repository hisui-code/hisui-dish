import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { BsFillHeartPulseFill } from 'react-icons/bs'
import { FaPlus } from 'react-icons/fa'
import type { HealthLogFilterType } from '@/types/healthLog'
import { mockHealthLogs } from '@/lib/health-log/mock'
import { formatHealthLogDate, jst } from '@/lib/date'
import HealthLogFormModal from '@/components/healthlog/HealthLogFormModal'
import { useHealthLogFormModal } from '@/hooks/healthlog/useHealthLogFormModal'
import HealthLogSummaryCards from '@/components/healthlog/HealthLogSummaryCards'
import HealthLogTimeline from '@/components/healthlog/HealthLogTimeline'
import HealthLogFilters from '@/components/healthlog/HealthLogFilters'

/**
 * @description 健康記録ページの静的な骨組みを表示する
 * サマリー、フィルター、タイムラインの配置を確認するための段階
 */
export default function HealthLog() {
  const latestHospitalVisit = mockHealthLogs.find((log) => log.type === 'hospital_visit')
  const latestWeight = mockHealthLogs.find((log) => log.type === 'weight')
  const [selectedType, setSelectedType] = useState<HealthLogFilterType>('all')
  const [selectedMonth, setSelectedMonth] = useState('2026-03')

  const latestHospitalVisitDate = formatHealthLogDate(latestHospitalVisit?.occurredAt)
  const latestWeightDate = formatHealthLogDate(latestWeight?.occurredAt)
  const latestWeightValue = latestWeight?.weightKg ? `${latestWeight.weightKg}kg` : '-'

  const formModal = useHealthLogFormModal()

  const filteredLogs = mockHealthLogs.filter((log) => {
    const matchesType = selectedType === 'all' || log.type === selectedType
    const matchesMonth = jst(log.occurredAt).format('YYYY-MM') === selectedMonth

    return matchesType && matchesMonth
  })
  const monthlyLogCount = filteredLogs.length

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
              onClick={formModal.openForCreate}
            >
              <FaPlus className="h-3.5 w-3.5" />
              記録を追加
            </Button>
          }
        />

        {/* サマリーカード */}
        <HealthLogSummaryCards
          monthlyLogCount={monthlyLogCount}
          latestHospitalVisitDate={latestHospitalVisitDate}
          latestWeightValue={latestWeightValue}
          latestWeightDate={latestWeightDate}
        />

        {/* フィルター */}
        <HealthLogFilters
          selectedType={selectedType}
          selectedMonth={selectedMonth}
          onChangeType={setSelectedType}
          onChangeMonth={setSelectedMonth}
        />

        {/* タイムライン */}
        <HealthLogTimeline logs={filteredLogs} onEdit={formModal.openForEdit} />
      </div>
      {/* モーダル */}
      <HealthLogFormModal
        open={formModal.isOpen}
        title={formModal.editingLog ? '健康記録を編集' : '健康記録を追加'}
        selectedRecordType={formModal.selectedRecordType}
        occurredDate={formModal.occurredDate}
        occurredTime={formModal.occurredTime}
        note={formModal.note}
        weightKg={formModal.weightKg}
        onClose={formModal.close}
        onChangeRecordType={formModal.setSelectedRecordType}
        onChangeOccurredDate={formModal.setOccurredDate}
        onChangeOccurredTime={formModal.setOccurredTime}
        onChangeNote={formModal.setNote}
        onChangeWeightKg={formModal.setWeightKg}
      />
    </div>
  )
}
