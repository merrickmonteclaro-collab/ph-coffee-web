import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_URL } from '../utils/config'
import styles from './ShopPage.module.css'

export default function ShopPage() {
  const { id } = useParams()
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/shops/${id}`)
      .then(r => r.json())
      .then(data => { setShop(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (!shop) return <div className={styles.loading}>Shop not found.</div>

  const offerings = shop.coffee_offerings
    ? shop.coffee_offerings.split(',').map(o => o.trim()).filter(Boolean)
    : []

  const mapsUrl = shop.latitude && shop.longitude
    ? 'https://www.google.com/maps/search/?api=1&query=' + shop.latitude + ',' + shop.longitude
    : null

  return (
    <div className={styles.page}>
      <div className={styles.back}>
        <Link to="/" className={styles.backLink}>← Back to shops</Link>
      </div>

      {shop.photo_url && shop.photo_url !== 'string' ? (
        <img src={shop.photo_url} alt={shop.name} className={styles.hero} />
      ) : (
        <div className={styles.heroPlaceholder}>☕</div>
      )}

      <div className={styles.content}>
        <h1 className={styles.name}>{shop.name}</h1>
        <p className={styles.location}>📍 {[shop.address, shop.city, shop.region].filter(Boolean).join(', ')}</p>

        {offerings.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Coffee Offerings</div>
            <div className={styles.offeringTags}>
              {offerings.map(o => (
                <span key={o} className={styles.offeringTag}>{o}</span>
              ))}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Amenities</div>
          <div className={styles.amenities}>
            <div className={styles.amenity + ' ' + (shop.has_wifi ? styles.yes : styles.no)}>📶 WiFi</div>
            <div className={styles.amenity + ' ' + (shop.is_work_friendly ? styles.yes : styles.no)}>💻 Work Friendly</div>
            <div className={styles.amenity + ' ' + (shop.is_pet_friendly ? styles.yes : styles.no)}>🐾 Pet Friendly</div>
            <div className={styles.amenity + ' ' + (shop.has_meals ? styles.yes : styles.no)}>🍽️ Full Meals</div>
            <div className={styles.amenity + ' ' + (shop.has_pastries ? styles.yes : styles.no)}>🥐 Pastries</div>
          </div>
        </div>

         <div className={styles.section}>
          <div className={styles.sectionTitle}>Parking</div>
          <div className={styles.amenities}>
            <div className={styles.amenity + ' ' + (shop.has_car_parking ? styles.yes : styles.no)}>🚗 Car Parking</div>
            <div className={styles.amenity + ' ' + (shop.has_bike_parking ? styles.yes : styles.no)}>🚲 Bike Parking</div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Payments</div>
          <div className={styles.amenities}>
            <div className={styles.amenity + ' ' + (shop.accepts_cards ? styles.yes : styles.no)}>💳 Cards Accepted</div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Comfort Room</div>
          <div className={styles.amenities}>
            <div className={styles.amenity + ' ' + (shop.has_toilet_bidet ? styles.yes : styles.no)}>🚿 Toilet Bidet</div>
          </div>
        </div>

        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapsBtn}>
            Open in Google Maps →
          </a>
        )}
      </div>
    </div>
  )
}
