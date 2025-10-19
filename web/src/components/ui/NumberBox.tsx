export default function NumberBox({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <input
      className="w-full rounded border px-3 py-2 text-left"
      type="number"
      inputMode="numeric"
      min={1}
      step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}
