import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../utils/config'
import styles from './AuthPage.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Something went wrong')
      }

      // Backend always returns a generic success message whether or not
      // the email exists, so we just show it.
      setSent(true)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>☕ Brewpack</h1>
        <p className={styles.subtitle}>Reset your password</p>

        {error && <div className={styles.error}>{error}</div>}

        {sent ? (
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
            If that email is registered, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <button className={styles.btn} type="submit" disabled={loading}>
              {loading ? 'Please wait...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <Link to="/auth" className={styles.toggle}>
          Back to log in
        </Link>
      </div>
    </div>
  )
}
