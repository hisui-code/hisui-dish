import { Input } from './input'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  id?: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}

export default function NumberBox({
  id,
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  unit,
  className,
  ...props
}: Props) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? (value as number) : ''}
        min={min}
        {...(max !== undefined ? { max } : {})}
        step={step}
        onChange={(e) => {
          const raw = e.target.value
          // 空文字なら NaN を親に渡し、表示は空欄を維持
          if (raw === '') {
            onChange(Number.NaN)
            return
          }
          onChange(Number(raw))
        }}
        className={`rounded-2xl pr-16 ${className ?? ''}`}
        {...props}
      />
      {unit && (
        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-neutral-500">
          {unit}
        </span>
      )}
    </div>
  )
}
