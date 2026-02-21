import ConfirmDeleteLogDialog from './ConfirmDeleteLogDialog'
import LogsEmptyState from './LogsEmptyState'
import LogsDayGroupSection from './LogsDayGroupSection'
import { useLogsDeleteDialog } from '@/hooks/logs/useLogsDeleteDialog'
import type { LogGroup } from '@/types/logs'

type LogsListProps = {
  groups: LogGroup[]
  month: string
}

/**
 * @description 日付グループ化されたログ一覧を表示する
 */
export default function LogsList({ groups, month }: LogsListProps) {
  const deleteDialog = useLogsDeleteDialog(month)

  if (groups.length === 0) return <LogsEmptyState month={month} />

  return (
    <>
      <div className="mt-5 space-y-4">
        {groups.map((group) => (
          <LogsDayGroupSection
            key={group.dayKey}
            group={group}
            onDelete={deleteDialog.onRequestDelete}
          />
        ))}
      </div>
      <ConfirmDeleteLogDialog
        open={deleteDialog.deleteTarget !== null}
        target={deleteDialog.deleteTarget}
        isSubmitting={deleteDialog.isSubmitting}
        onCancel={deleteDialog.onCancelDelete}
        onConfirm={deleteDialog.onConfirmDelete}
      />
    </>
  )
}
