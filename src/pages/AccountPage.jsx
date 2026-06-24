import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../utils/config'
import { authFetch, getToken, removeToken } from '../utils/auth'
import styles from './AccountPage.module.css'

export default function AccountPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    if (!getToken()) { navigate('/auth'); return }
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    try {
      const res = await authFetch(`${API_URL}/auth/me`)
      if (!res.ok) { removeToken(); navigate('/auth'); return }
      const data = await res.json()
      setUsername(data.username || '')
      setEmail(data.email || '')
      setCreatedAt(data.created_at || '')
      setFullName(data.full_name || '')
      setCity(data.city || '')
    } catch { setError('Could not load your profile.') }
    setLoading(false)
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await authFetch(`${API_URL}/auth/me`, {
        method: 'PATCH',
        body: JSON.stringify({ full_name: fullName, city })
      })
      if (!res.ok) throw new Error('Update failed')
      setSuccess('Profile updated!')
      setEditing(false)
    } catch { setError('Could not save changes. Please try again.') }
    setSaving(false)
  }

  function handleLogout() {
    removeToken()
    navigate('/')
  }

  function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) return <div className={styles.loading}>Loading...</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.headerTitle}>My Account</h1>
      </div>

      <div className={styles.content}>
        {/* Avatar */}
        <div className={styles.avatarRow}>
          <div className={styles.avatar}>
            <span className={styles.avatarText}>{(fullName || username || '?').charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className={styles.displayName}>{fullName || username}</div>
            <div className={styles.joinDate}>Member since {formatDate(createdAt)}</div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.successMsg}>{success}</div>}

        <form onSubmit={saveProfile}>
          <div className={styles.label}>Full Name</div>
          {editing
            ? <input className={styles.input} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
            : <div className={styles.displayBox}>{fullName || '—'}</div>
          }

          <div className={styles.label}>Username</div>
          <div className={styles.displayBox}>{username}</div>

          <div className={styles.label}>Email</div>
          <div className={styles.displayBox}>{email}</div>

          <div className={styles.label}>City of Residence</div>
          {editing
            ? <input className={styles.input} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Quezon City" />
            : <div className={styles.displayBox}>{city || '—'}</div>
          }

          {editing ? (
            <div className={styles.btnRow}>
              <button type="button" className={styles.btnSecondary} onClick={() => { setEditing(false); loadProfile() }}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          ) : (
            <button type="button" className={styles.btnPrimary} style={{ marginTop: 20 }} onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </form>

        <button className={styles.logoutBtn} onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  )
}
