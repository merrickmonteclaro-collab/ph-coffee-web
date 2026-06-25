import { useEffect, useRef, useState } from 'react'
import { API_URL, GOOGLE_MAPS_KEY } from '../utils/config'
import { getToken, authFetch } from '../utils/auth'
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
  const [visitedShopIds, setVisitedShopIds] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/shops/`)
      .then(r => r.json())
      .then(setShops)
    if (getToken()) {
      authFetch(`${API_URL}/visited/`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setVisitedShopIds(data.map(v => v.shop_id)) })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!shops.length) return
    if (window.google && window.google.maps) { initMap(); return }
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + GOOGLE_MAPS_KEY
    script.onload = () => initMap()
    document.head.appendChild(script)
    return () => {
      const el = document.getElementById('google-maps-script')
      if (el) document.head.removeChild(el)
    }
  }, [shops])

  function getBeanIcon(visited) {
    const fill = visited ? '%237a3a1a' : '%237ab648'
    const stroke = visited ? '%232a1008' : '%233a6820'
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 100 100">' +
      '<path d="M50 8 C28 8 12 24 12 50 C12 76 28 92 50 92 C72 92 88 76 88 50 C88 24 72 8 50 8 Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="5"/>' +
      '<path d="M50 10 C44 20 36 28 36 40 C36 52 56 58 56 70 C56 82 50 88 50 90" fill="none" stroke="' + stroke + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M50 10 C44 20 36 28 36 40 C36 52 56 58 56 70 C56 82 50 88 50 90" fill="none" stroke="%23ffffff" stroke-width="3.5" stroke-linecap="round"/>' +
      '</svg>'
    return {
      url: 'data:image/svg+xml,' + svg,
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16),
    }
  }

  function initMap() {
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 12.8797, lng: 121.7740 },
      zoom: 6,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
    })
    mapInstanceRef.current = map
    shops.filter(s => s.latitude && s.longitude).forEach(shop => {
      const marker = new google.maps.Marker({
        position: { lat: shop.latitude, lng: shop.longitude },
        map,
        title: shop.name,
        icon: getBeanIcon(visitedShopIds.includes(shop.id)),
      })
      const iw = new google.maps.InfoWindow({
        content: '<div style="font-family:DM Sans,sans-serif;padding:4px;max-width:180px">' +
          '<div style="font-weight:600;font-size:13px;color:#5C3D2E;margin-bottom:3px">' + shop.name + '</div>' +
          '<div style="font-size:11px;color:#9B7B6A;margin-bottom:6px">' + shop.city + ' · ' + shop.region + '</div>' +
          '<a href="/shop/' + shop.id + '" style="font-size:12px;color:#C8603A;font-weight:600">View details →</a>' +
          '</div>'
      })
      marker.addListener('click', () => iw.open(map, marker))
    })
  }

  function findNearMe() {
    setLocationError('')
    setNearestShop(null)
    if (!navigator.geolocation) { setLocationError('Geolocation not supported.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords
      const map = mapInstanceRef.current
      if (!map) return
      if (userMarkerRef.current) userMarkerRef.current.setMap(null)
      userMarkerRef.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        title: 'Your location',
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#C8603A', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
        zIndex: 999,
      })
      map.setCenter({ lat: latitude, lng: longitude })
      map.setZoom(13)
      const pinned = shops.filter(s => s.latitude && s.longitude)
      if (pinned.length > 0) {
        const sorted = [...pinned].sort((a, b) =>
          getDistance(latitude, longitude, a.latitude, a.longitude) -
          getDistance(latitude, longitude, b.latitude, b.longitude)
        )
        const nearest = sorted[0]
        const dist = getDistance(latitude, longitude, nearest.latitude, nearest.longitude)
        setNearestShop({ name: nearest.name, dist: dist < 1 ? Math.round(dist * 1000) + 'm' : dist.toFixed(1) + 'km' })
      }
      setLocating(false)
    }, () => { setLocating(false); setLocationError('Could not get your location.') }, { enableHighAccuracy: true, timeout: 10000 })
  }

  return (
    <div className={styles.page}>
      <div className={styles.overlay}>
        {nearestShop && (
          <div className={styles.nearestBadge}>📍 Nearest: <strong>{nearestShop.name}</strong> · {nearestShop.dist}</div>
        )}
        {locationError && <div className={styles.error}>{locationError}</div>}
        <button className={styles.locateBtn} onClick={findNearMe} disabled={locating}>
          {locating ? 'Locating...' : '📡 Find shops near me'}
        </button>
      </div>
      <div ref={mapRef} className={styles.map} />
    </div>
  )
}
