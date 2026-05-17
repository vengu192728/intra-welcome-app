import { useState } from 'react'
import { login } from './api/auth'
import { clearSession, getSession, saveSession } from './lib/session'
import FileUploadTab from './components/FileUploadTab'
import StorageTab from './components/StorageTab'
import './App.css'

function App() {
  const [session, setSession] = useState(() => getSession())
  const [activeTab, setActiveTab] = useState('home')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isAdmin = session?.role === 'admin'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(username.trim(), password)
      const nextSession = { username: result.username, role: result.role }
      saveSession(nextSession)
      setSession(nextSession)
      setActiveTab('home')
      setPassword('')
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSignOut() {
    clearSession()
    setSession(null)
    setActiveTab('home')
    setUsername('')
    setPassword('')
    setError('')
  }

  return (
    <main className="welcome">
      <div className="welcome__card" aria-labelledby="welcome-heading">
        <div className="welcome__icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="16" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2.5" />
            <path d="M8 24h48" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="16" cy="20" r="2" fill="currentColor" />
            <circle cx="24" cy="20" r="2" fill="currentColor" />
            <circle cx="32" cy="20" r="2" fill="currentColor" />
          </svg>
        </div>

        {session ? (
          <>
            <p className="welcome__badge" data-role={session.role}>
              {session.role}
            </p>

            {isAdmin ? (
              <nav className="welcome__tabs" aria-label="Main navigation">
                <button
                  type="button"
                  className={`welcome__tab${activeTab === 'home' ? ' welcome__tab--active' : ''}`}
                  onClick={() => setActiveTab('home')}
                >
                  Home
                </button>
                <button
                  type="button"
                  className={`welcome__tab${activeTab === 'upload' ? ' welcome__tab--active' : ''}`}
                  onClick={() => setActiveTab('upload')}
                >
                  File upload
                </button>
                <button
                  type="button"
                  className={`welcome__tab${activeTab === 'storage' ? ' welcome__tab--active' : ''}`}
                  onClick={() => setActiveTab('storage')}
                >
                  Storage
                </button>
              </nav>
            ) : null}

            {activeTab === 'upload' && isAdmin ? (
              <FileUploadTab />
            ) : activeTab === 'storage' && isAdmin ? (
              <StorageTab />
            ) : (
              <>
                <h1 id="welcome-heading" className="welcome__title">
                  Hello, {session.username}
                </h1>
                <p className="welcome__subtitle">
                  {session.role === 'admin'
                    ? 'You have administrator access to the intranet.'
                    : 'You are signed in. Internal resources and services are now available.'}
                </p>
              </>
            )}

            <button type="button" className="welcome__button welcome__button--secondary" onClick={handleSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <h1 id="welcome-heading" className="welcome__title">
              Welcome to the intranet
            </h1>
            <p className="welcome__subtitle">
              Sign in with your username and password to continue.
            </p>

            <form className="welcome__form" onSubmit={handleSubmit} noValidate>
              <div className="welcome__field">
                <label className="welcome__label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="welcome__input"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="welcome__field">
                <label className="welcome__label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="welcome__input"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {error ? (
                <p className="welcome__error" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="welcome__button" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}

export default App
