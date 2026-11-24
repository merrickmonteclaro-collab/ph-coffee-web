import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../utils/config'
import { getToken, authFetch } from '../utils/auth'
import { getShops, getCachedShops, isCountryCached } from '../utils/shopsCache'
import { COUNTRIES } from '../utils/countries'
import styles from './FavoritesPage.module.css'

// Inserts Cloudinary transformation params into an upload URL so the CDN
// serves an already-resized, compressed image instead of the original.
function getOptimizedImageUrl(url, width, height) {
  if (!url || !url.includes('/upload/')) return url
  const transform = `w_${width},h_${height},c_fill,g_auto,q_auto:good,f_auto`
  return url.replace('/upload/', `/upload/${transform}/`)
}
const DPR = Math.min(window.devicePixelRatio || 1, 3)

// Last favorite IDs seen this session (tagged with the token, so one account's
// list is never shown to another). Lets a revisit paint instantly while the
// fresh list loads in the background.
let lastFavorites = { token: null, ids: null }

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const isLoggedIn = !!getToken()

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    let cancelled = false
    const token = getToken()

    // Shops already in memory (e.g. the country list Home loaded), filtered
    // to the given favorite IDs.
    const knownFavorites = ids => getCachedShops().filter(s => ids.includes(s.id))

    // Revisit: show the last known list immediately, refresh underneath.
    if (lastFavorites.token === token && lastFavorites.ids) {
      setFavorites(knownFavorites(lastFavorites.ids))
      setLoading(false)
    }

    authFetch(`${API_URL}/favorites/`)
      .then(r => r.json())
      .then(favRecords => {
        const ids = Array.isArray(favRecords) ? favRecords.map(f => f.shop_id) : []
        lastFavorites = { token, ids }
        const known = knownFavorites(ids)
        if (!cancelled) setFavorites(known)

        // Everything is already in memory (or there are no favorites): done,
        // and the big all-countries shop download is skipped entirely.
        if (known.length === ids.length) {
          if (!cancelled) setLoading(false)
          return
        }

        // Some favorites live in a country that isn't cached yet. Fetch only
        // the missing countries, in parallel, and show favorites as each one
        // arrives. The results land in the same per-country cache Home uses,
        // so the country switcher there benefits too.
        const refresh = () => {
          const found = knownFavorites(ids)
          if (!cancelled) setFavorites(found)
          return found.length === ids.length
        }
        const missing = COUNTRIES.filter(c => !isCountryCached(c.code))
        return Promise.allSettled(
          missing.map(c => getShops({ country: c.code }).then(() => {
            if (refresh() && !cancelled) setLoading(false)
          }))
        ).then(() => {
          refresh()
          if (!cancelled) setLoading(false)
        })
      })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>Favorites</div>
        <div className={styles.empty}>
          Log in to save and view your favorite shops.
          <Link to="/auth" className={styles.loginLink}>Log In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>Favorites</div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>Loading favorites...</div>
        ) : favorites.length === 0 ? (
          <div className={styles.empty}>No favorites yet. Open a shop and tap “Add to Favorites” to save it here.</div>
        ) : (
          favorites.map(shop => (
            <Link to={'/shop/' + shop.id} key={shop.id} className={styles.card}>
              {shop.photo_url && shop.photo_url !== 'string' ? (
                <img
                  src={getOptimizedImageUrl(shop.photo_url, Math.round(56 * DPR), Math.round(56 * DPR))}
                  alt=""
                  className={styles.cardImg}
                  loading="lazy"
                />
              ) : (
                <div className={styles.cardImgPlaceholder} />
              )}
              <div className={styles.cardBody}>
                <div className={styles.cardName}>{shop.name}</div>
                <div className={styles.cardLocation}>{shop.city} · {shop.region}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
