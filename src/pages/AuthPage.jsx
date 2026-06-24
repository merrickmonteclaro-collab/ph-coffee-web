import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../utils/config'
import { saveToken } from '../utils/auth'
import styles from './AuthPage.module.css'

export default function AuthPage() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let res
      if (isLogin) {
        const form = new URLSearchParams()
        form.append('username', email)
        form.append('password', password)
        res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString()
        })
      } else {
        res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, password, full_name: fullName, city })
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Something went wrong')
      saveToken(data.access_token)
      navigate('/account')
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>☕ Brewpack</h1>
        <p className={styles.subtitle}>{isLogin ? 'Welcome back!' : 'Create an account'}</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label className={styles.label}>Full Name</label>
              <input className={styles.input} type="text" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} />
              <label className={styles.label}>Username</label>
              <input className={styles.input} type="text" placeholder="username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
              <label className={styles.label}>City of Residence</label>
              <input className={styles.input} type="text" placeholder="e.g. Quezon City" value={city} onChange={e => setCity(e.target.value)} />
            </>
          )}

          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />

          <label className={styles.label}>Password</label>
          <input className={styles.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Register'}
          </button>
        </form>

        <button className={styles.toggle} onClick={() => { setIsLogin(!isLogin); setError('') }}>
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}
