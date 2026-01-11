import { req } from './client'

// HealthチェックAPI
export type Health = { status: string }
export function getHealth() {
  return req<Health>('/api/v1/health')
}
