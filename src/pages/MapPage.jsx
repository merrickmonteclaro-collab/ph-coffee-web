import { useEffect, useRef, useState } from 'react'
import { API_URL, GOOGLE_MAPS_KEY } from '../utils/config'
import styles from './MapPage.module.css'

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function MapPage() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const userMarkerRef = useRef(null)
  const [shops, setShops] = useState([])
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [nearestShop, setNearestShop] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/shops/`)
      .then(r => r.json())
      .then(setShops)
  }, [])

  useEffect(() => {
    if (!shops.length) return

    // Avoid loading the script twice
    if (window.google && window.google.maps) {
      initMap()
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + GOOGLE_MAPS_KEY
    script.onload = () => initMap()
    document.head.appendChild(script)

    return () => {
      const existing = document.getElementById('google-maps-script')
      if (existing) document.head.removeChild(existing)
    }
  }, [shops])

  function initMap() {
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 12.8797, lng: 121.7740 },
      zoom: 6,
      mapTypeControl: false,
      streetViewControl: false,
    })

    mapInstanceRef.current = map

    shops
      .filter(s => s.latitude && s.longitude)
      .forEach(shop => {
        const marker = new google.maps.Marker({
          position: { lat: shop.latitude, lng: shop.longitude },
          map,
          title: shop.name,
        })

        const infoWindow = new google.maps.InfoWindow({
          content:
            '<div style="font-family:\'DM Sans\',sans-serif;padding:4px;max-width:200px">' +
            '<div style="font-weight:600;font-size:14px;margin-bottom:4px">' + shop.name + '</div>' +
            '<div style="font-size:12px;color:#9b8474;margin-bottom:8px">' + shop.city + ' · ' + shop.region + '</div>' +
            '<a href="/shop/' + shop.id + '" style="font-size:12px;color:#c2714f;font-weight:600">View details →</a>' +
            '</div>'
        })

        marker.addListener('click', () => infoWindow.open(map, marker))
      })
  }

  function findNearMe() {
    setLocationError('')
    setNearestShop(null)

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }

    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const map = mapInstanceRef.current
        if (!map) return

        // Remove old user marker
        if (userMarkerRef.current) userMarkerRef.current.setMap(null)

        // Add blue dot for user location
        userMarkerRef.current = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map,
          title: 'Your location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4A90D9',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          zIndex: 999,
        })

        // Center and zoom map to user location
        map.setCenter({ lat: latitude, lng: longitude })
        map.setZoom(13)

        // Find nearest shop
        const pinned = shops.filter(s => s.latitude && s.longitude)
        if (pinned.length > 0) {
          const sorted = [...pinned].sort((a, b) =>
            getDistance(latitude, longitude, a.latitude, a.longitude) -
            getDistance(latitude, longitude, b.latitude, b.longitude)
          )
          const nearest = sorted[0]
          const dist = getDistance(latitude, longitude, nearest.latitude, nearest.longitude)
          setNearestShop({
            name: nearest.name,
            city: nearest.city,
            dist: dist < 1 ? Math.round(dist * 1000) + 'm' : dist.toFixed(1) + 'km'
          })
        }

        setLocating(false)
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) {
          setLocationError('Location access denied. Please allow location in your browser settings.')
        } else {
          setLocationError('Could not get your location. Please try again.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const pinnedCount = shops.filter(s => s.latitude && s.longitude).length

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Shop Map</h2>
          <p className={styles.sub}>{pinnedCount} shops pinned</p>
        </div>
        <div className={styles.headerRight}>
          {nearestShop && (
            <div className={styles.nearestBadge}>
              📍 Nearest: <strong>{nearestShop.name}</strong> · {nearestShop.dist}
            </div>
          )}
          {locationError && (
            <div className={styles.locationError}>{locationError}</div>
          )}
          <button
            className={styles.locateBtn}
            onClick={findNearMe}
            disabled={locating}
          >
            {locating ? 'Locating...' : '📡 Find shops near me'}
          </button>
        </div>
      </div>
      <div ref={mapRef} className={styles.map} />
    </div>
  )
}
