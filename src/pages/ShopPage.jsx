import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../utils/config'
import { getToken, authFetch } from '../utils/auth'
import AmenityIcon from '../components/AmenityIcon'
import styles from './ShopPage.module.css'

// Inserts Cloudinary transformation params into an upload URL so the CDN
// serves an already-resized, compressed image instead of the original.
// Falls back to the raw url unchanged if it isn't a Cloudinary /upload/ URL.
// NOTE: width/height passed in should already be scaled for pixel density —
// dpr_auto depends on Client Hints headers that aren't reliably supported
// across browsers (notably Safari), so we compute pixel dimensions ourselves.
function getOptimizedImageUrl(url, width, height) {
  if (!url || !url.includes('/upload/')) return url
  const transform = `w_${width},h_${height},c_fill,g_auto,q_auto:good,f_auto`
  return url.replace('/upload/', `/upload/${transform}/`)
}

// .hero / .galleryImg are width: 100%, so request based on actual viewport
// width rather than a guessed fixed size — keeps desktop crisp without
// over-fetching on mobile.
const DPR = Math.min(window.devicePixelRatio || 1, 3)
const PHOTO_WIDTH = Math.round(Math.min(window.innerWidth, 1600) * DPR)
const HERO_HEIGHT = Math.round(240 * DPR)
const GALLERY_HEIGHT = Math.round(240 * DPR)

export default function ShopPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState([])
  const [isVisited, setIsVisited] = useState(false)
  const [visitLoading, setVisitLoading] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    // The route is reused when going from one shop to another, so clear the
    // previous shop first, or its details would show while the new one loads.
    let cancelled = false
    setLoading(true)
    setShop(null)
    setPhotos([])
    setIsVisited(false)
    setIsFavorited(false)

    fetch(`${API_URL}/shops/${id}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        // A 404 comes back as { detail: ... }, which isn't a shop.
        if (!data || !data.id) { setLoading(false); return }
        setShop(data)
        setLoading(false)
        fetch(`${API_URL}/photos/shop/${data.id}`)
          .then(r => r.json())
          .then(p => { if (!cancelled && Array.isArray(p)) setPhotos(p) })
          .catch(() => {})
        if (getToken()) {
          authFetch(`${API_URL}/visited/`)
            .then(r => r.json())
            .then(visited => {
              if (!cancelled && Array.isArray(visited)) setIsVisited(visited.some(v => v.shop_id === data.id))
            })
            .catch(() => {})
          authFetch(`${API_URL}/favorites/`)
            .then(r => r.json())
            .then(favorites => {
              if (!cancelled && Array.isArray(favorites)) setIsFavorited(favorites.some(f => f.shop_id === data.id))
            })
            .catch(() => {})
        }
      })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (!shop) return <div className={styles.loading}>Shop not found.</div>

  const offerings = shop.coffee_offerings
    ? shop.coffee_offerings.split(',').map(o => o.trim()).filter(Boolean)
    : []

  const mapsUrl = shop.latitude && shop.longitude
    ? 'https://www.google.com/maps/search/?api=1&query=' + shop.latitude + ',' + shop.longitude
    : null

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  function getOpenStatus() {
    if (!shop.operating_hours) return null;
    try {
      const hours = JSON.parse(shop.operating_hours);
      // Get Philippine time directly using UTC offset +8
      const now = new Date();
      const phOffset = 8 * 60; // PH is UTC+8
      const utcMins = now.getUTCHours() * 60 + now.getUTCMinutes();
      const phTotalMins = utcMins + phOffset;
      const phHours = Math.floor(phTotalMins / 60) % 24;
      const phMinutes = phTotalMins % 60;
      // Get PH day of week
      const utcDay = now.getUTCDay();
      const phDay = phTotalMins >= 24 * 60 ? (utcDay + 1) % 7 : utcDay;
      const dayMap = [6, 0, 1, 2, 3, 4, 5]; // Sun=0→6, Mon=1→0...
      const today = DAYS[dayMap[phDay]];
      const todayHours = hours[today];
      if (!todayHours || todayHours.closed) return { isOpen: false, today, hours: todayHours };
      const [openH, openM] = todayHours.open.split(':').map(Number);
      const [closeH, closeM] = todayHours.close.split(':').map(Number);
      const currentMins = phHours * 60 + phMinutes;
      const openMins = openH * 60 + openM;
      let closeMins = closeH * 60 + closeM;
      let adjustedCurrentMins = currentMins;
      // Closing time at/before opening time means it rolls past midnight
      // (e.g. "close": "00:00" really means end-of-day, not 12:00 AM start-of-day).
      // Push it 24h later for comparison purposes.
      if (closeMins <= openMins) {
        closeMins += 24 * 60;
      }
      if (adjustedCurrentMins < openMins && closeMins > 24 * 60) {
        adjustedCurrentMins += 24 * 60;
      }
      return { isOpen: adjustedCurrentMins >= openMins && adjustedCurrentMins < closeMins, today, hours: todayHours };
    } catch { return null; }
  }

  function formatTime(time) {
    if (!time) return ''
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return hour + ':' + m.toString().padStart(2, '0') + ' ' + ampm
  }

  // The button only flips once the server confirms, so it never claims
  // something that didn't actually save.
  async function toggleVisited() {
    setVisitLoading(true)
    try {
      const res = await authFetch(`${API_URL}/visited/${shop.id}`, { method: isVisited ? 'DELETE' : 'POST' })
      if (res.ok) setIsVisited(!isVisited)
    } catch { /* leave the button as it was */ }
    setVisitLoading(false)
  }

  async function toggleFavorite() {
    setFavoriteLoading(true)
    try {
      const res = await authFetch(`${API_URL}/favorites/${shop.id}`, { method: isFavorited ? 'DELETE' : 'POST' })
      if (res.ok) setIsFavorited(!isFavorited)
    } catch { /* leave the button as it was */ }
    setFavoriteLoading(false)
  }

  const openStatus = getOpenStatus()
  const parsedHours = shop.operating_hours ? (() => { try { return JSON.parse(shop.operating_hours) } catch { return null } })() : null
  
  // `key` picks the outline icon in AmenityIcon; labels match the Home filters.
  const allAmenities = [
    { key: 'has_wifi', label: 'WiFi', value: shop.has_wifi },
    { key: 'is_work_friendly', label: 'Work friendly', value: shop.is_work_friendly },
    { key: 'is_pet_friendly', label: 'Pet friendly', value: shop.is_pet_friendly },
    { key: 'has_meals', label: 'Meals', value: shop.has_meals },
    { key: 'has_pastries', label: 'Pastries', value: shop.has_pastries },
    { key: 'has_car_parking', label: 'Car parking', value: shop.has_car_parking },
    { key: 'has_bike_parking', label: 'Bike parking', value: shop.has_bike_parking },
    { key: 'accepts_cards', label: 'Cards accepted', value: shop.accepts_cards },
    { key: 'has_toilet_bidet', label: 'Toilet bidet', value: shop.has_toilet_bidet },
  ].filter(a => a.value)

  return (
    <div className={styles.page}>
      <div className={styles.heroWrap}>
      <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      </button>
      {photos.length > 0 ? (
        <div className={styles.photoGallery}>
          {photos.map(p => (
            <img
              key={p.id}
              src={getOptimizedImageUrl(p.photo_url, PHOTO_WIDTH, GALLERY_HEIGHT)}
              alt={shop.name}
              className={styles.galleryImg}
              loading="lazy"
            />
          ))}
        </div>
      ) : shop.photo_url && shop.photo_url !== 'string' ? (
        <img
          src={getOptimizedImageUrl(shop.photo_url, PHOTO_WIDTH, HERO_HEIGHT)}
          alt={shop.name}
          className={styles.hero}
        />
      ) : (
        <div className={styles.heroPlaceholder} />
      )}
      </div>

      <div className={styles.content}>
        <h1 className={styles.name}>{shop.name}</h1>
        <p className={styles.address}>{shop.address}</p>
        <p className={styles.cityRegion}>{shop.city} · {shop.region}</p>

        {getToken() && (
          <div className={styles.actionRow}>
            <button
              className={styles.visitedBtn + ' ' + (isVisited ? styles.visitedBtnActive : '')}
              onClick={toggleVisited}
              disabled={visitLoading}
            >
              {isVisited ? '✓ Visited' : 'Mark as Visited'}
            </button>
          </div>
        )}

        {(shop.facebook_url || shop.instagram_url || shop.website_url) && (
          <div className={styles.socialRow}>
            {shop.facebook_url && (
              <a href={shop.facebook_url} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>Facebook</a>
            )}
            {shop.instagram_url && (
              <a href={shop.instagram_url} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>Instagram</a>
            )}
            {shop.website_url && (
              <a href={shop.website_url} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>Website</a>
            )}
          </div>
        )}

        {parsedHours && (
          <div className={styles.section}>
            <div className={styles.hoursHeader}>
              <div className={styles.sectionTitle}>Hours</div>
              {openStatus && (
                <div className={styles.openBadge + ' ' + (openStatus.isOpen ? styles.openBadgeOpen : styles.openBadgeClosed)}>
                  <span className={styles.openDot} aria-hidden="true" />
                  {openStatus.isOpen ? 'Open now' : 'Closed'}
                </div>
              )}
            </div>
            {DAYS.map(day => {
              const d = parsedHours[day]
              if (!d) return null
              const isToday = openStatus?.today === day
              return (
                <div key={day} className={styles.hoursRow}>
                  <span className={styles.hoursDay + ' ' + (isToday ? styles.hoursDayToday : '')}>{day}</span>
                  <span className={styles.hoursTime + ' ' + (isToday ? styles.hoursTimeToday : '')}>
                    {d.closed ? 'Closed' : formatTime(d.open) + ' – ' + formatTime(d.close)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {offerings.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Coffee offerings</div>
            <div className={styles.offeringTags}>
              {offerings.map(o => <span key={o} className={styles.offeringTag}>{o}</span>)}
            </div>
          </div>
        )}

        {allAmenities.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Amenities</div>
            <div className={styles.amenityGrid}>
              {allAmenities.map(a => (
                <div key={a.key} className={styles.amenityItem}>
                  <AmenityIcon name={a.key} size={28} />
                  <span>{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapsBtn}>Open in Google Maps</a>
        )}

        {getToken() && (
          <button
            className={styles.favoritesBtn + ' ' + (isFavorited ? styles.favoritesBtnActive : '')}
            onClick={toggleFavorite}
            disabled={favoriteLoading}
          >
            {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
        )}

        {/* Opens the Suggest page on "Report a Change" with this shop preselected. */}
        <p className={styles.reportPrompt}>Is the shop information outdated? Let us know!</p>
        <button
          className={styles.reportBtn}
          onClick={() => navigate('/suggest', {
            state: { reportShop: { id: shop.id, name: shop.name, city: shop.city, region: shop.region } }
          })}
        >
          Report a Change
        </button>
      </div>
    </div>
  )
}
