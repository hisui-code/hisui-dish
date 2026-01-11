import React from 'react'

export default function Field({
  label,
  help,
  error,
  children,
  htmlFor,
}: {
  label: string
  help?: string
  error?: string
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <div className="grid gap-1">
      <label htmlFor={htmlFor} className="text-[13px] text-neutral-700">
        {label}
      </label>
      {children}
      <div className="min-h-[18px] text-[12px] ">
        {error ? (
          <span className="text-rose-600">{error}</span>
        ) : help ? (
          <span className="text-neutral-500">{help}</span>
        ) : null}
      </div>
    </div>
  )
}
