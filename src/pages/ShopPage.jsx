import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../utils/config'
import styles from './ShopPage.module.css'

export default function ShopPage() {
  const { id } = useParams()
  const navigate = useNavigate()
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

  const amenities = [
    { label: 'WiFi', value: shop.has_wifi },
    { label: 'Work Friendly', value: shop.is_work_friendly },
    { label: 'Pet Friendly', value: shop.is_pet_friendly },
  ]

  const food = [
    { label: 'Full Meals', value: shop.has_meals },
    { label: 'Pastries', value: shop.has_pastries },
  ]

  const parking = [
    { label: 'Car Parking', value: shop.has_car_parking },
    { label: 'Bike Parking', value: shop.has_bike_parking },
  ]

  const payments = [{ label: 'Accepts Cards', value: shop.accepts_cards }]
  const comfort = [{ label: 'Toilet Bidet', value: shop.has_toilet_bidet }]

  function AmenityGrid({ items }) {
    return (
      <div className={styles.amenityGrid}>
        {items.map(item => (
          <div key={item.label} className={styles.amenityItem + ' ' + (item.value ? styles.yes : styles.no)}>
            <span className={styles.amenityDot}>{item.value ? '✓' : '✗'}</span>
            <span className={styles.amenityLabel}>{item.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {shop.photo_url && shop.photo_url !== 'string' ? (
        <img src={shop.photo_url} alt={shop.name} className={styles.hero} />
      ) : (
        <div className={styles.heroPlaceholder}>☕</div>
      )}

      <div className={styles.content}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>

        <h1 className={styles.name}>{shop.name}</h1>
        <p className={styles.address}>📍 {shop.address}</p>
        <p className={styles.cityRegion}>{shop.city} · {shop.region}</p>

        {offerings.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>☕ Coffee Offerings</div>
            <div className={styles.offeringTags}>
              {offerings.map(o => <span key={o} className={styles.offeringTag}>{o}</span>)}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionTitle}>🍽️ Food</div>
          <AmenityGrid items={food} />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>🏠 Amenities</div>
          <AmenityGrid items={amenities} />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>🚗 Parking</div>
          <AmenityGrid items={parking} />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>💳 Payments</div>
          <AmenityGrid items={payments} />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>🚿 Comfort Room</div>
          <AmenityGrid items={comfort} />
        </div>

        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapsBtn}>Open in Google Maps →</a>
        )}
      </div>
    </div>
  )
}
