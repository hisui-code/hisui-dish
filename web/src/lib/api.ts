const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'

export async function getHealth() {
  const res = await fetch(`${BASE}/api/v1/health`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Health NG: ${res.status} ${res.statusText} ${body}`)
  }
  return res.json() as Promise<{ status: string }>
}
