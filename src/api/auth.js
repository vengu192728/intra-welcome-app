const API_BASE = (import.meta.env.VITE_AUTH_API_URL ?? '').replace(/\/$/, '')

export async function login(username, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Invalid username or password')
  }

  return {
    username: data.username,
    role: data.role,
  }
}
