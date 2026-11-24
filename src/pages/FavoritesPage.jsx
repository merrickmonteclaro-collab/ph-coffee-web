import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../utils/config'
import { getToken, authFetch } from '../utils/auth'
import styles from './FavoritesPage.module.css'

// Inserts Cloudinary transformation params into an upload URL so the CDN
// serves an already-resized, compressed image instead of the original.
function getOptimizedImageUrl(url, width, height) {
  if (!url || !url.includes('/upload/')) return url
  const transform = `w_${width},h_${height},c_fill,g_auto,q_auto:good,f_auto`
  return url.replace('/upload/', `/upload/${transform}/`)
}
const DPR = Math.min(window.devicePixelRatio || 1, 3)

// Last list seen this session (tagged with the token, so one account's list
// is never shown to another). Lets a revisit paint instantly while the fresh
// list loads in the background.
let lastFavorites = { token: null, shops: null }

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

    // Revisit: show the last known list immediately, refresh underneath.
    if (lastFavorites.token === token && lastFavorites.shops) {
      setFavorites(lastFavorites.shops)
      setLoading(false)
    }

    // One request returns the user's favorite shops with full details,
    // whatever country they're in.
    authFetch(`${API_URL}/shops/favorites`)
      .then(r => r.json())
      .then(shops => {
        const list = Array.isArray(shops) ? shops : []
        lastFavorites = { token, shops: list }
        if (!cancelled) {
          setFavorites(list)
          setLoading(false)
        }
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
