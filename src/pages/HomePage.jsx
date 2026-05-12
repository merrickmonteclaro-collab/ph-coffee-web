import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../utils/config'
import styles from './HomePage.module.css'

const FILTERS = [
  { key: 'has_wifi', label: '📶 WiFi' },
  { key: 'is_work_friendly', label: '💻 Work Friendly' },
  { key: 'is_pet_friendly', label: '🐾 Pet Friendly' },
  { key: 'has_meals', label: '🍽️ Meals' },
  { key: 'has_pastries', label: '🥐 Pastries' },
]

export default function HomePage() {
  const [shops, setShops] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/shops`)
      .then(r => r.json())
      .then(data => { setShops(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = [...shops]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.region || '').toLowerCase().includes(q)
      )
    }
    activeFilters.forEach(f => {
      result = result.filter(s => s[f] === true)
    })
    setFiltered(result)
  }, [shops, search, activeFilters])

  function toggleFilter(key) {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Specialty Coffee in the Philippines</h1>
        <p className={styles.heroSub}>Discover the best specialty coffee shops near you</p>
        <input
          className={styles.search}
          placeholder="Search by name, city, or region..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.chip} ${activeFilters.includes(f.key) ? styles.chipActive : ''}`}
              onClick={() => toggleFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Loading shops...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No shops match your search.</div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(shop => (
              <Link to={`/shop/${shop.id}`} key={shop.id} className={styles.card}>
                {shop.photo_url && shop.photo_url !== 'string' ? (
                  <img src={shop.photo_url} alt={shop.name} className={styles.cardImg} />
                ) : (
                  <div className={styles.cardImgPlaceholder}>☕</div>
                )}
                <div className={styles.cardBody}>
                  <div className={styles.cardName}>{shop.name}</div>
                  <div className={styles.cardLocation}>{shop.city} · {shop.region}</div>
                  <div className={styles.cardTags}>
                    {shop.has_wifi && <span className={styles.tag}>📶 WiFi</span>}
                    {shop.is_work_friendly && <span className={styles.tag}>💻 Work</span>}
                    {shop.is_pet_friendly && <span className={styles.tag}>🐾 Pet</span>}
                    {shop.has_meals && <span className={styles.tag}>🍽️ Meals</span>}
                    {shop.has_pastries && <span className={styles.tag}>🥐 Pastries</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
