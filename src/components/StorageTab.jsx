import { useCallback, useEffect, useState } from 'react'
import { fetchDiskSpace } from '../api/files'

function formatBytes(bytes) {
  if (bytes == null || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function usageLevel(percent) {
  if (percent >= 90) return 'critical'
  if (percent >= 75) return 'warning'
  return 'ok'
}

export default function StorageTab() {
  const [disk, setDisk] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchDiskSpace()
      if (!data.success) {
        throw new Error('Could not read disk space')
      }
      setDisk(data)
    } catch (err) {
      setError(err.message || 'Could not load storage information')
      setDisk(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const level = disk ? usageLevel(disk.usedPercent) : 'ok'
  const freePercent = disk && disk.totalBytes > 0
    ? Math.round((disk.usableBytes / disk.totalBytes) * 1000) / 10
    : 0

  return (
    <div className="storage-tab">
      <h2 className="storage-tab__heading">Server storage</h2>
      <p className="storage-tab__hint">
        Disk space for the volume where intranet uploads are stored on this server.
      </p>

      {error ? (
        <p className="welcome__error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="storage-tab__empty">Loading storage info…</p>
      ) : disk ? (
        <>
          <div
            className={`storage-tab__meter storage-tab__meter--${level}`}
            aria-hidden="true"
          >
            <div
              className="storage-tab__meter-fill"
              style={{ width: `${Math.min(100, disk.usedPercent)}%` }}
            />
          </div>

          <p className="storage-tab__summary">
            <strong>{formatBytes(disk.usableBytes)}</strong> free of{' '}
            <strong>{formatBytes(disk.totalBytes)}</strong> ({freePercent}% available)
          </p>

          <dl className="storage-tab__stats">
            <div className="storage-tab__stat">
              <dt>Mount path</dt>
              <dd>{disk.path}</dd>
            </div>
            <div className="storage-tab__stat">
              <dt>Used</dt>
              <dd>
                {formatBytes(disk.usedBytes)} ({disk.usedPercent}%)
              </dd>
            </div>
            <div className="storage-tab__stat">
              <dt>Free (unallocated)</dt>
              <dd>{formatBytes(disk.freeBytes)}</dd>
            </div>
            <div className="storage-tab__stat">
              <dt>Available to apps</dt>
              <dd>{formatBytes(disk.usableBytes)}</dd>
            </div>
            <div className="storage-tab__stat">
              <dt>Uploaded files</dt>
              <dd>
                {disk.uploadCount} file{disk.uploadCount === 1 ? '' : 's'} ·{' '}
                {formatBytes(disk.uploadsBytes)}
              </dd>
            </div>
          </dl>
        </>
      ) : null}

      <button
        type="button"
        className="welcome__button welcome__button--secondary storage-tab__refresh"
        onClick={load}
        disabled={loading}
      >
        Refresh
      </button>
    </div>
  )
}
