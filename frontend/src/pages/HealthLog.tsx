import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { BsFillHeartPulseFill } from 'react-icons/bs'
import { FaPlus } from 'react-icons/fa'
import HealthLogFormModal from '@/components/healthlog/HealthLogFormModal'
import { useHealthLogFormModal } from '@/hooks/healthlog/useHealthLogFormModal'
import HealthLogSummaryCards from '@/components/healthlog/HealthLogSummaryCards'
import HealthLogTimeline from '@/components/healthlog/HealthLogTimeline'
import HealthLogFilters from '@/components/healthlog/HealthLogFilters'
import { useHealthLogPage } from '@/hooks/healthlog/useHealthLogPage'
import HealthLogDeleteDialog from '@/components/healthlog/HealthLogDeleteDialog'
import useHealthLogDeleteDialog from '@/hooks/healthlog/useHealthLogDeleteDialog'
import HealthLogPhotoModal from '@/components/healthlog/HealthLogPhotoModal'
import useHealthLogPhotoModal from '@/hooks/healthlog/useHealthLogPhotoModal'
import { jst } from '@/lib/date'
import type { HealthLogSavePayload } from '@/types/healthLog'
import { createHealthLog, deleteHealthLog, updateHealthLog } from '@/lib/api/healthLogsApi'

/**
 * @description 健康記録ページの静的な骨組みを表示する
 * サマリー、フィルター、タイムラインの配置を確認するための段階
 */
export default function HealthLog() {
  const healthLogPage = useHealthLogPage()
  const formModal = useHealthLogFormModal()
  const deleteDialog = useHealthLogDeleteDialog()
  const photoModal = useHealthLogPhotoModal()

  // 削除確認ダイアログを表示
  const handleRequestDeleteFromForm = () => {
    if (!formModal.editingLog) return

    deleteDialog.openDeleteDialog(formModal.editingLog)
  }

  // 追加・更新
  const handleSaveHealthLog = async () => {
    if (!formModal.occurredDate) return
    if (!formModal.occurredTime) return

    if (formModal.selectedRecordType === 'weight') {
      const parsedWeightKg = Number(formModal.weightKg)

      if (!formModal.weightKg) return
      if (Number.isNaN(parsedWeightKg)) return
      if (parsedWeightKg <= 0) return
    }

    const payload = buildHealthLogPayload()

    if (formModal.editingLog) {
      await updateHealthLog(formModal.editingLog.id, payload)
      formModal.close()
      return
    }

    await createHealthLog(payload)
    formModal.close()
  }

  // 削除
  const handleConfirmDeleteHealthLog = async () => {
    if (!deleteDialog.deleteTarget) return

    await deleteHealthLog(deleteDialog.deleteTarget.id)
    deleteDialog.confirmDelete()
    formModal.close()
  }

  // payload
  const buildHealthLogPayload = (): HealthLogSavePayload => {
    const occurredAt = jst(`${formModal.occurredDate} ${formModal.occurredTime}`).format(
      'YYYY-MM-DDTHH:mm:ss'
    )
    const trimmedNote = formModal.note.trim()
    const parsedWeightKg =
      formModal.selectedRecordType === 'weight' && formModal.weightKg
        ? Number(formModal.weightKg)
        : undefined

    return {
      type: formModal.selectedRecordType,
      occurredAt,
      note: trimmedNote || undefined,
      weightKg: parsedWeightKg,
      photos: [],
    }
  }

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
          monthlyLogCount={healthLogPage.monthlyLogCount}
          latestHospitalVisitDate={healthLogPage.latestHospitalVisitDate}
          latestWeightValue={healthLogPage.latestWeightValue}
          latestWeightDate={healthLogPage.latestWeightDate}
        />

        {/* フィルター */}
        <HealthLogFilters
          selectedType={healthLogPage.selectedType}
          selectedMonth={healthLogPage.selectedMonth}
          onChangeType={healthLogPage.setSelectedType}
          onChangeMonth={healthLogPage.setSelectedMonth}
        />

        {/* タイムライン */}
        <HealthLogTimeline
          logs={healthLogPage.filteredLogs}
          onEdit={formModal.openForEdit}
          onOpenPhoto={photoModal.openPhotoModal}
        />
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
        showDelete={formModal.editingLog !== null}
        onSave={handleSaveHealthLog}
        onDelete={handleRequestDeleteFromForm}
        onClose={formModal.close}
        onChangeRecordType={formModal.setSelectedRecordType}
        onChangeOccurredDate={formModal.setOccurredDate}
        onChangeOccurredTime={formModal.setOccurredTime}
        onChangeNote={formModal.setNote}
        onChangeWeightKg={formModal.setWeightKg}
      />
      {/* 削除確認モーダル */}
      <HealthLogDeleteDialog
        open={deleteDialog.deleteTarget !== null}
        target={deleteDialog.deleteTarget}
        onCancel={deleteDialog.closeDeleteDialog}
        onConfirm={handleConfirmDeleteHealthLog}
      />
      {/* 写真モーダル */}
      <HealthLogPhotoModal
        open={photoModal.selectedPhoto !== null}
        photo={photoModal.selectedPhoto}
        onClose={photoModal.closePhotoModal}
      />
    </div>
  )
}
