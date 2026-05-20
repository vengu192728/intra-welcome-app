import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadUploadedFile, listUploadedFiles, uploadFile, validateFile } from '../api/files'

const ACCEPT_TYPES =
  'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function FileUploadTab() {
  const inputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [files, setFiles] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [downloadingFileId, setDownloadingFileId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadFiles = useCallback(async () => {
    setLoadingList(true)
    setError('')
    try {
      const list = await listUploadedFiles()
      setFiles(list)
    } catch (err) {
      setError(err.message || 'Could not load files')
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setError('')
    setSuccess('')
    if (file) {
      try {
        validateFile(file)
      } catch (err) {
        setError(err.message)
        setSelectedFile(null)
        event.target.value = ''
      }
    }
  }

  async function handleUpload(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      validateFile(selectedFile)
    } catch (err) {
      setError(err.message)
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadFile(selectedFile)
      setSuccess(`"${uploaded.originalName}" uploaded successfully.`)
      setSelectedFile(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      await loadFiles()
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(file) {
    setError('')
    setSuccess('')
    setDownloadingFileId(file.id)
    try {
      await downloadUploadedFile(file)
    } catch (err) {
      setError(err.message || 'Download failed')
    } finally {
      setDownloadingFileId('')
    }
  }

  return (
    <div className="upload-tab">
      <h2 className="upload-tab__heading">File upload</h2>
      <p className="upload-tab__hint">
        Photos, PDFs, and documents up to 10&nbsp;MB. Works on phone, tablet, and laptop.
      </p>

      <form className="upload-tab__form" onSubmit={handleUpload}>
        <label className="upload-tab__picker" htmlFor="file-input">
          <span className="upload-tab__picker-label">Choose file</span>
          <input
            ref={inputRef}
            id="file-input"
            type="file"
            accept={ACCEPT_TYPES}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <span className="upload-tab__picker-name">
            {selectedFile ? selectedFile.name : 'No file selected'}
          </span>
          {selectedFile ? (
            <span className="upload-tab__picker-size">{formatSize(selectedFile.size)}</span>
          ) : null}
        </label>

        {error ? (
          <p className="welcome__error" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="upload-tab__success" role="status">
            {success}
          </p>
        ) : null}

        <button type="submit" className="welcome__button" disabled={uploading || !selectedFile}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <section className="upload-tab__list" aria-labelledby="uploaded-files-heading">
        <div className="upload-tab__list-header">
          <h3 id="uploaded-files-heading">Uploaded files</h3>
          <button
            type="button"
            className="welcome__button welcome__button--secondary upload-tab__refresh"
            onClick={loadFiles}
            disabled={loadingList}
          >
            Refresh
          </button>
        </div>

        {loadingList ? (
          <p className="upload-tab__empty">Loading…</p>
        ) : files.length === 0 ? (
          <p className="upload-tab__empty">No files uploaded yet.</p>
        ) : (
          <ul className="upload-tab__files">
            {files.map((file) => (
              <li key={file.id} className="upload-tab__file">
                <div className="upload-tab__file-details">
                  <span className="upload-tab__file-name">{file.originalName}</span>
                  <span className="upload-tab__file-meta">
                    {formatSize(file.size)} · {file.uploadedBy} · {formatDate(file.uploadedAt)}
                  </span>
                </div>
                <button
                  type="button"
                  className="welcome__button welcome__button--secondary upload-tab__download"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingFileId === file.id}
                >
                  {downloadingFileId === file.id ? 'Downloading…' : 'Download'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
