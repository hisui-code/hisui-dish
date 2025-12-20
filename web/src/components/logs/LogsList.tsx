import { motion, AnimatePresence } from 'framer-motion'

import type { LogGroup } from '@/types/logs'
import LogRow from './LogRow'
import LogsEmptyState from './LogsEmptyState'

type LogsListProps = {
  groups: LogGroup[]
  onDelete: (id: string) => void
  month: string
}

export default function LogsList({ groups, onDelete, month }: LogsListProps) {
  if (groups.length === 0) return <LogsEmptyState month={month} />
  return (
    <div className="mt-5 space-y-4">
      {groups.map((g) => (
        <div key={g.dayKey} className="rounded-3xl bg-card shadow-sm ">
          <div className="px-4 py-3">
            <div className="text-sm font-medium text-muted-foreground">{g.dayLabel}</div>
          </div>

          <div className="pt-1 bg-muted/30 p-2">
            <AnimatePresence initial={false}>
              {g.items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="px-1 mb-2">
                    <LogRow item={item} onDelete={onDelete} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  )
}
