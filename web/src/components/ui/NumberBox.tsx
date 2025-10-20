import { Input } from './input'

export default function NumberBox({
  id,
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  unit,
}: {
  id?: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}) {
  const hasUnit = Boolean(unit)
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
        onChange={(e) => onChange(Number(e.target.value))}
        className={hasUnit ? 'rounded-2xl pr-16' : 'rounded-2xl'}
      />
      {unit && (
        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-neutral-500 ">
          {unit}
        </span>
      )}
    </div>
  )
}
