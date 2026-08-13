import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../utils/config'
import { getToken, authFetch } from '../utils/auth'
import styles from './FavoritesPage.module.css'

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
      fetch(`${API_URL}/shops/`).then(r => r.json()),
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
                <img src={shop.photo_url} alt={shop.name} className={styles.cardImg} loading="lazy" />
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
