import { getSession } from '../lib/session'

const API_BASE = (import.meta.env.VITE_AUTH_API_URL ?? '').replace(/\/$/, '')

function sessionHeaders() {
  const session = getSession()
  if (!session) {
    throw new Error('Sign in required')
  }
  return {
    'Content-Type': 'application/json',
    'X-Intranet-Role': session.role,
    'X-Intranet-Username': session.username,
  }
}

function queryString(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export async function listFoods(search = '') {
  const response = await fetch(`${API_BASE}/api/calories/foods${queryString({ search })}`, {
    headers: sessionHeaders(),
  })
  const data = await response.json().catch(() => [])

  if (!response.ok) {
    throw new Error(data.message || 'Could not load foods')
  }

  return data
}

export async function listMealLogs(date) {
  const response = await fetch(`${API_BASE}/api/calories/logs${queryString({ date })}`, {
    headers: sessionHeaders(),
  })
  const data = await response.json().catch(() => [])

  if (!response.ok) {
    throw new Error(data.message || 'Could not load meal logs')
  }

  return data
}

export async function createMealLog(payload) {
  const response = await fetch(`${API_BASE}/api/calories/logs`, {
    method: 'POST',
    headers: sessionHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Could not add meal')
  }

  return data
}

export async function deleteMealLog(id) {
  const response = await fetch(`${API_BASE}/api/calories/logs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: sessionHeaders(),
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Could not delete meal')
  }
}

export async function fetchMealSummary(date) {
  const response = await fetch(`${API_BASE}/api/calories/summary${queryString({ date })}`, {
    headers: sessionHeaders(),
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Could not load calorie summary')
  }

  return data
}
