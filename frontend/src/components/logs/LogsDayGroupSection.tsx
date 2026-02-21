import { motion, AnimatePresence } from 'framer-motion'
import type { LogGroup, LogItem } from '@/types/logs'
import LogRow from './LogRow'

type LogsDayGroupSectionProps = {
  group: LogGroup
  onDelete: (item: LogItem) => void
}

/**
 * @description 1日分のロググループを表示する
 */
export default function LogsDayGroupSection({ group, onDelete }: LogsDayGroupSectionProps) {
  return (
    <div key={group.dayKey} className="rounded-3xl bg-card shadow-sm ">
      <div className="px-4 py-3">
        <div className="text-sm font-medium text-muted-foreground">{group.dayLabel}</div>
      </div>

      <div className="pt-1 bg-muted/30 p-2">
        <AnimatePresence initial={false}>
          {group.items.map((item) => (
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
  )
}
