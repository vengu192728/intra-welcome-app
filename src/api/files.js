import { getSession } from '../lib/session'

const API_BASE = (import.meta.env.VITE_AUTH_API_URL ?? '').replace(/\/$/, '')
const MAX_FILE_SIZE = 10 * 1024 * 1024

function adminHeaders() {
  const session = getSession()
  if (!session || session.role !== 'admin') {
    throw new Error('Admin access required')
  }
  return {
    'X-Intranet-Role': session.role,
    'X-Intranet-Username': session.username,
  }
}

export function validateFile(file) {
  if (!file) {
    throw new Error('Please choose a file to upload')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must not exceed 10 MB')
  }
}

export async function uploadFile(file) {
  validateFile(file)

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/api/files/upload`, {
    method: 'POST',
    headers: adminHeaders(),
    body: formData,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Upload failed')
  }

  return data.file
}

export async function listUploadedFiles() {
  const response = await fetch(`${API_BASE}/api/files`, {
    headers: adminHeaders(),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Could not load uploaded files')
  }

  return data.files ?? []
}
