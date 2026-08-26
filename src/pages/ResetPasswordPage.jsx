import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { API_URL } from '../utils/config'
import styles from './AuthPage.module.css'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Something went wrong')

      setSuccess(true)
      setTimeout(() => navigate('/auth'), 2500)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>☕ Brewpack</h1>
          <div className={styles.error}>This reset link is invalid or incomplete.</div>
          <Link to="/forgot-password" className={styles.toggle}>
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>☕ Brewpack</h1>
        <p className={styles.subtitle}>Set a new password</p>

        {error && <div className={styles.error}>{error}</div>}

        {success ? (
          <div
            style={{
              background: '#d8f3dc',
              color: '#2d6a4f',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              marginBottom: 12
            }}
          >
            Password updated! Redirecting you to log in...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className={styles.label}>New Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <label className={styles.label}>Confirm New Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <button className={styles.btn} type="submit" disabled={loading}>
              {loading ? 'Please wait...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
