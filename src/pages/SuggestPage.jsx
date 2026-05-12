import { useState } from 'react'
import { API_URL } from '../utils/config'
import styles from './SuggestPage.module.css'

export default function SuggestPage() {
  const [form, setForm] = useState({ shop_name: '', address: '', city: '', region: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.shop_name.trim()) { setError('Shop name is required.'); return; }
    setError(''); setLoading(true)

    try {
      const res = await fetch(`${API_URL}/suggestions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: form.shop_name.trim(),
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          region: form.region.trim() || null,
          notes: form.notes.trim() || null,
        })
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
      setForm({ shop_name: '', address: '', city: '', region: '', notes: '' })
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>Thanks for the tip!</h2>
          <p className={styles.successSub}>We'll review your suggestion and may add it to the list soon.</p>
          <button className={styles.anotherBtn} onClick={() => setSuccess(false)}>Suggest another shop</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Suggest a Shop ☕</h1>
        <p className={styles.sub}>Know a great specialty coffee shop we're missing? Let us know!</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className={styles.label}>Shop Name *</label>
          <input className={styles.input} name="shop_name" value={form.shop_name} onChange={handleChange} placeholder="e.g. Curious Coffee Co." />

          <label className={styles.label}>Address</label>
          <input className={styles.input} name="address" value={form.address} onChange={handleChange} placeholder="e.g. 123 Aguirre St., BF Homes" />

          <div className={styles.row}>
            <div style={{ flex: 1 }}>
              <label className={styles.label}>City</label>
              <input className={styles.input} name="city" value={form.city} onChange={handleChange} placeholder="e.g. Parañaque" />
            </div>
            <div style={{ flex: 1 }}>
              <label className={styles.label}>Region</label>
              <input className={styles.input} name="region" value={form.region} onChange={handleChange} placeholder="e.g. Metro Manila" />
            </div>
          </div>

          <label className={styles.label}>Why should we add it?</label>
          <textarea className={`${styles.input} ${styles.textarea}`} name="notes" value={form.notes} onChange={handleChange} placeholder="Tell us what makes this shop special..." rows={4} />

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </form>
      </div>
    </div>
  )
}
