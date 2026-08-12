import { useState, useEffect } from 'react'
import { API_URL } from '../utils/config'
import styles from './SuggestPage.module.css'

const REPORT_TYPES = [
  { value: 'hours', label: '🕐 Hours Changed' },
  { value: 'address', label: '📍 Address Changed' },
  { value: 'closed', label: '🚫 Permanently Closed' },
  { value: 'other', label: '✏️ Other' },
]

export default function SuggestPage() {
  const [mode, setMode] = useState('new')

  // ── New shop suggestion state ──
  const [form, setForm] = useState({ shop_name: '', address: '', city: '', region: '', notes: '', facebook_url: '', instagram_url: '' })

  // ── Report a change state ──
  const [shops, setShops] = useState([])
  const [shopSearch, setShopSearch] = useState('')
  const [selectedShop, setSelectedShop] = useState(null)
  const [reportType, setReportType] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/shops/`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setShops(data) })
      .catch(() => {})
  }, [])

  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.shop_name.trim()) { setError('Shop name is required.'); return }
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
          facebook_url: form.facebook_url.trim() || null,
          instagram_url: form.instagram_url.trim() || null,
        })
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
      setForm({ shop_name: '', address: '', city: '', region: '', notes: '', facebook_url: '', instagram_url: '' })
    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  async function handleReportSubmit(e) {
    e.preventDefault()
    if (!selectedShop) { setError('Please select which shop this is about.'); return }
    if (!reportType) { setError('Please select what changed.'); return }
    if (reportType === 'other' && !reportDetails.trim()) {
      setError('Please add a few details for "Other".')
      return
    }
    setError(''); setReportLoading(true)
    try {
      const res = await fetch(`${API_URL}/shop-reports/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: selectedShop.id,
          report_type: reportType,
          details: reportDetails.trim() || null,
        })
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
      setSelectedShop(null)
      setShopSearch('')
      setReportType('')
      setReportDetails('')
    } catch { setError('Something went wrong. Please try again.') }
    setReportLoading(false)
  }

  const filteredShops = shopSearch.trim()
    ? shops.filter(s => s.name.toLowerCase().includes(shopSearch.trim().toLowerCase())).slice(0, 6)
    : []

  if (success) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.successTitle}>{mode === 'report' ? 'Thanks for letting us know!' : 'Thanks for the tip!'}</h2>
        <p className={styles.successSub}>
          {mode === 'report'
            ? "We'll review your report and update the shop info soon."
            : "We'll review your suggestion and may add it to the list soon."}
        </p>
        <button className={styles.anotherBtn} onClick={() => setSuccess(false)}>
          {mode === 'report' ? 'Report another change' : 'Suggest another shop'}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Suggest a Shop ☕</h1>
      <p className={styles.sub}>Know a great specialty coffee shop we're missing, or spotted an error on one we already list? Let us know!</p>

      <div className={styles.tabRow}>
        <button
          type="button"
          className={`${styles.tabBtn} ${mode === 'new' ? styles.tabBtnActive : ''}`}
          onClick={() => { setMode('new'); setError('') }}
        >
          New Shop
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${mode === 'report' ? styles.tabBtnActive : ''}`}
          onClick={() => { setMode('report'); setError('') }}
        >
          Report a Change
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {mode === 'new' ? (
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
          <textarea className={styles.input + ' ' + styles.textarea} name="notes" value={form.notes} onChange={handleChange} placeholder="Tell us what makes this shop special..." rows={4} />

          <label className={styles.label}>Facebook Page (optional)</label>
          <input className={styles.input} name="facebook_url" value={form.facebook_url} onChange={handleChange} placeholder="https://facebook.com/theshop" />

          <label className={styles.label}>Instagram Profile (optional)</label>
          <input className={styles.input} name="instagram_url" value={form.instagram_url} onChange={handleChange} placeholder="https://instagram.com/theshop" />

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReportSubmit}>
          <label className={styles.label}>Which shop?</label>
          {!selectedShop ? (
            <>
              <input
                className={styles.input}
                style={{ marginBottom: filteredShops.length > 0 ? 8 : 16 }}
                value={shopSearch}
                onChange={e => setShopSearch(e.target.value)}
                placeholder="Search by shop name..."
              />
              {shopSearch.trim().length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {filteredShops.map(s => (
                    <div
                      key={s.id}
                      className={styles.shopResultItem}
                      onClick={() => { setSelectedShop(s); setShopSearch('') }}
                    >
                      <div>
                        <div className={styles.shopResultText}>{s.name}</div>
                        <div className={styles.shopResultSub}>{s.city}{s.region ? ` · ${s.region}` : ''}</div>
                      </div>
                      <span>›</span>
                    </div>
                  ))}
                  {filteredShops.length === 0 && (
                    <div className={styles.shopResultSub}>No shops found.</div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.selectedShopChip}>
              <div>
                <div className={styles.shopResultText}>{selectedShop.name}</div>
                <div className={styles.shopResultSub}>{selectedShop.city}{selectedShop.region ? ` · ${selectedShop.region}` : ''}</div>
              </div>
              <button type="button" className={styles.clearShopBtn} onClick={() => setSelectedShop(null)}>✕</button>
            </div>
          )}

          <label className={styles.label}>What changed?</label>
          <div className={styles.reportTypeRow}>
            {REPORT_TYPES.map(rt => (
              <button
                type="button"
                key={rt.value}
                className={`${styles.reportTypeChip} ${reportType === rt.value ? styles.reportTypeChipActive : ''}`}
                onClick={() => setReportType(rt.value)}
              >
                {rt.label}
              </button>
            ))}
          </div>

          <label className={styles.label}>Details {reportType === 'other' ? '*' : '(optional)'}</label>
          <textarea
            className={styles.input + ' ' + styles.textarea}
            value={reportDetails}
            onChange={e => setReportDetails(e.target.value)}
            placeholder="e.g. Now open until 11pm on weekends"
            rows={4}
          />

          <button className={styles.submitBtn} type="submit" disabled={reportLoading}>
            {reportLoading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      )}
    </div>
  )
}
