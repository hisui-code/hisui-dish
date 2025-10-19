import React from 'react'
export default function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-left">
      <span className="text-sm">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </label>
  )
}
