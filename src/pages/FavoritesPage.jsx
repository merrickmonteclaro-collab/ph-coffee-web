import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../utils/config'
import { getToken, authFetch } from '../utils/auth'
import { getShops } from '../utils/shopsCache'
import styles from './FavoritesPage.module.css'

// Inserts Cloudinary transformation params into an upload URL so the CDN
// serves an already-resized, compressed image instead of the original.
function getOptimizedImageUrl(url, width, height) {
  if (!url || !url.includes('/upload/')) return url
  const transform = `w_${width},h_${height},c_fill,g_auto,q_auto:good,f_auto`
  return url.replace('/upload/', `/upload/${transform}/`)
}
const DPR = Math.min(window.devicePixelRatio || 1, 3)

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const isLoggedIn = !!getToken()

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    Promise.all([
      getShops(),
      authFetch(`${API_URL}/favorites/`).then(r => r.json()),
    ])
      .then(([shops, favRecords]) => {
        const favoriteIds = Array.isArray(favRecords) ? favRecords.map(f => f.shop_id) : []
        setFavorites(Array.isArray(shops) ? shops.filter(s => favoriteIds.includes(s.id)) : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
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
          <div className={styles.empty}>No favorites yet. Tap the heart on a shop to save it here.</div>
        ) : (
          favorites.map(shop => (
            <Link to={'/shop/' + shop.id} key={shop.id} className={styles.card}>
              {shop.photo_url && shop.photo_url !== 'string' ? (
                <img
                  src={getOptimizedImageUrl(shop.photo_url, Math.round(72 * DPR), Math.round(76 * DPR))}
                  alt={shop.name}
                  className={styles.cardImg}
                  loading="lazy"
                />
              ) : (
                <div className={styles.cardImgPlaceholder}>☕</div>
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
