import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { API_URL, GOOGLE_MAPS_KEY } from '../utils/config'
import { getToken, authFetch } from '../utils/auth'
import { getShops } from '../utils/shopsCache'
import { COUNTRIES, DEFAULT_COUNTRY, detectCountry, getCountryInfo } from '../utils/countries'
import styles from './HomePage.module.css'

const FILTERS = [
  { key: 'has_wifi', label: '📶 WiFi' },
  { key: 'is_work_friendly', label: '💻 Work Friendly' },
  { key: 'is_pet_friendly', label: '🐾 Pet Friendly' },
  { key: 'has_meals', label: '🍽️ Meals' },
  { key: 'has_pastries', label: '🥐 Pastries' },
  { key: 'has_car_parking', label: '🚗 Car Parking' },
  { key: 'has_bike_parking', label: '🚲 Bike Parking' },
  { key: 'accepts_cards', label: '💳 Cards Accepted' },
  { key: 'has_toilet_bidet', label: '🚿 Toilet Bidet' },
]

// Snap point layout mirrors the mobile app's bottom sheet:
// TOP = fully open, HALF = default resting position, PEEK = mostly collapsed.
const SNAP_TOP_OFFSET = 80 // px from top of container when fully open
const SNAP_PEEK_VISIBLE = 155 // px of sheet visible above the tab bar when collapsed

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

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

// Cap at 3x — going higher rarely improves visible quality and just
// inflates payload size unnecessarily.
const DPR = Math.min(window.devicePixelRatio || 1, 3)

export default function HomePage() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const userMarkerRef = useRef(null)
  const containerRef = useRef(null)
  const sheetRef = useRef(null)

  const [shops, setShops] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState([])
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState(null)
  const [visitedShopIds, setVisitedShopIds] = useState([])
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [countryPickerOpen, setCountryPickerOpen] = useState(false)
  // The country detected from the user's real position on load. Used to
  // decide whether the map should follow their live location (home country)
  // or stay put on a country's default center (browsing elsewhere via the
  // switcher) — mirrors the distinction mobile makes between the initial
  // GPS-based center and a manual country switch.
  const homeCountryRef = useRef(DEFAULT_COUNTRY)

  // ── Draggable bottom sheet ──
  const [snapPoints, setSnapPoints] = useState(null) // { top, half, peek }
  const [translateY, setTranslateY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragState = useRef({ startY: 0, startTranslate: 0, lastY: 0, lastTime: 0, velocity: 0 })

  // Measure container height on mount/resize to compute snap points,
  // mirroring mobile's SCREEN_HEIGHT-based SNAP_TOP/HALF/PEEK constants.
  useEffect(() => {
    function measure() {
      const h = containerRef.current?.clientHeight || window.innerHeight
      const points = {
        top: SNAP_TOP_OFFSET,
        half: h * 0.5,
        peek: h - SNAP_PEEK_VISIBLE,
      }
      setSnapPoints(points)
      setTranslateY(prev => (prev === 0 ? points.half : prev))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const snapTo = useCallback((point) => {
    setDragging(false)
    setTranslateY(point)
  }, [])

  const handlePointerDown = useCallback((e) => {
    if (!snapPoints) return
    dragState.current = {
      startY: e.clientY,
      startTranslate: translateY,
      lastY: e.clientY,
      lastTime: Date.now(),
      velocity: 0,
    }
    setDragging(true)
    e.target.setPointerCapture?.(e.pointerId)
  }, [snapPoints, translateY])

  const handlePointerMove = useCallback((e) => {
    if (!dragging || !snapPoints) return
    const now = Date.now()
    const dt = now - dragState.current.lastTime
    if (dt > 0) {
      dragState.current.velocity = (e.clientY - dragState.current.lastY) / dt // px/ms
    }
    dragState.current.lastY = e.clientY
    dragState.current.lastTime = now

    const delta = e.clientY - dragState.current.startY
    const next = Math.max(
      snapPoints.top,
      Math.min(snapPoints.peek, dragState.current.startTranslate + delta)
    )
    setTranslateY(next)
  }, [dragging, snapPoints])

  const handlePointerUp = useCallback(() => {
    if (!dragging || !snapPoints) return
    const velocity = dragState.current.velocity // px/ms, positive = moving down
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight

    // Fast flick wins over position, same thresholds as mobile (±500px/s = ±0.5px/ms)
    if (velocity < -0.5 || translateY < containerHeight * 0.3) {
      snapTo(snapPoints.top)
    } else if (velocity > 0.5 || translateY > containerHeight * 0.7) {
      snapTo(snapPoints.peek)
    } else {
      snapTo(snapPoints.half)
    }
  }, [dragging, snapPoints, translateY, snapTo])

  useEffect(() => {
    if (getToken()) {
      authFetch(`${API_URL}/visited/`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setVisitedShopIds(data.map(v => v.shop_id)) })
        .catch(() => {})
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setLocation(coords)
          const detected = detectCountry(coords.lat, coords.lng)
          homeCountryRef.current = detected
          setCountry(detected)
          loadShops(detected)
        },
        () => {
          setLocationError('Location permission denied. Showing shops for the default country.')
          loadShops(DEFAULT_COUNTRY)
        }
      )
    } else {
      loadShops(DEFAULT_COUNTRY)
    }
  }, [])

  function loadShops(countryCode) {
    setLoading(true)
    getShops({ country: countryCode })
      .then(data => { setShops(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  function handleSelectCountry(countryCode) {
    setCountryPickerOpen(false)
    if (countryCode === country) return
    setCountry(countryCode)
    loadShops(countryCode)
    // initMap (triggered by the shops update above) recenters the map on
    // this country's default view once the new data comes back.
  }

  useEffect(() => {
    // Wait for the current country's fetch to resolve rather than gating on
    // shop count — a country with zero shops yet (e.g. HK/TW pre-launch)
    // should still get an initialized, correctly-centered empty map.
    if (loading) return
    // Skip re-loading the SDK if it's already present — reloading the entire
    // Google Maps script on every Home page visit was the main cause of
    // slow page-to-page navigation.
    if (window.google && window.google.maps) { initMap(); return }
    if (document.getElementById('google-maps-script')) return // already loading
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + GOOGLE_MAPS_KEY
    script.onload = () => initMap()
    document.head.appendChild(script)
    // Intentionally not removing the script on unmount — keeping it loaded
    // lets revisiting this page skip the SDK download entirely.
  }, [shops, visitedShopIds, loading, country])

  function handleLocateMe() {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported on this browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setLocating(false)
        setLocationError('Could not get your location.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => {
    if (mapInstanceRef.current && location) {
      // Only recenter on the user's live position while they're browsing
      // their detected home country — while browsing another country via
      // the switcher, recentering here would fight that country's view.
      if (country === homeCountryRef.current) {
        mapInstanceRef.current.setCenter(location)
        mapInstanceRef.current.setZoom(13)
      }

      // Place/move the user's own location pin — a filled circle, matching
      // the style previously used on the standalone Map page.
      if (userMarkerRef.current) {
        userMarkerRef.current.setPosition(location)
      } else {
        userMarkerRef.current = new google.maps.Marker({
          position: location,
          map: mapInstanceRef.current,
          title: 'Your location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#C8603A',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          zIndex: 999,
        })
      }
    }
  }, [location, country])

  function getBeanIcon(visited) {
    if (!visited) return null
    return {
      url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      labelOrigin: new google.maps.Point(0, -10),
    }
  }

  function initMap() {
    const atHome = location && country === homeCountryRef.current
    const center = atHome ? location : getCountryInfo(country).center
    const map = new google.maps.Map(mapRef.current, {
      center, zoom: atHome ? 13 : 7,
      mapTypeControl: false, streetViewControl: false,
      fullscreenControl: false, zoomControl: false,
    })
    mapInstanceRef.current = map

    // A single shared InfoWindow, reused across all markers. Opening it on a
    // new marker automatically moves it away from wherever it was previously
    // shown, so only one popup can ever be visible at a time.
    const infoWindow = new google.maps.InfoWindow()

    shops.filter(s => s.latitude && s.longitude).forEach(shop => {
      const marker = new google.maps.Marker({
        position: { lat: shop.latitude, lng: shop.longitude },
        map,
        title: shop.name,
        icon: visitedShopIds.includes(shop.id) ? { url: 'https://maps.google.com/mapfiles/ms/icons/flag.png' } : undefined,
      })
      const content = '<div style="font-family:DM Sans,sans-serif;padding:4px;min-width:160px">' +
          '<div style="font-weight:700;font-size:14px;color:#542916;margin-bottom:3px">' + shop.name + '</div>' +
          '<div style="font-size:11px;color:#88b8ce;margin-bottom:8px">' + shop.city + ' · ' + shop.region + '</div>' +
          '<div style="display:flex;gap:6px">' +
            '<a href="/shop/' + shop.id + '" style="flex:1;background:#542916;color:#FFEEBC;border-radius:6px;padding:5px 8px;font-size:11px;font-weight:600;text-align:center;text-decoration:none">View Shop</a>' +
            '<a href="https://www.google.com/maps/dir/?api=1&destination=' + shop.latitude + ',' + shop.longitude + '" target="_blank" style="flex:1;background:#88b8ce;color:#FFEEBC;border-radius:6px;padding:5px 8px;font-size:11px;font-weight:600;text-align:center;text-decoration:none">Navigate</a>' +
          '</div>' +
        '</div>'
      marker.addListener('click', () => {
        infoWindow.setContent(content)
        infoWindow.open(map, marker)
      })
    })
  }

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
    activeFilters.forEach(f => { result = result.filter(s => s[f] === true) })
    if (location) {
      result = result
        .filter(s => s.latitude && s.longitude)
        .sort((a, b) =>
          getDistance(location.lat, location.lng, a.latitude, a.longitude) -
          getDistance(location.lat, location.lng, b.latitude, b.longitude)
        )
    }
    setFiltered(result)
  }, [shops, search, activeFilters, location])

  function toggleFilter(key) {
    setActiveFilters(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key])
  }

  function formatDistance(shop) {
    if (!location || !shop.latitude || !shop.longitude) return null
    const d = getDistance(location.lat, location.lng, shop.latitude, shop.longitude)
    return d < 1 ? Math.round(d * 1000) + 'm away' : d.toFixed(1) + 'km away'
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div ref={mapRef} className={styles.map} />

      <div className={styles.mapOverlay}>
        {locationError && <div className={styles.locationError}>{locationError}</div>}
        <div className={styles.countryRow}>
          <button className={styles.locateBtn} onClick={handleLocateMe} disabled={locating}>
            {locating ? 'Locating...' : '📍 Find my location'}
          </button>

          {/* Country switcher — mirrors the mobile app's flag+code button */}
          <div className={styles.countryWrap}>
            <button
              className={styles.locateBtn}
              onClick={() => setCountryPickerOpen(o => !o)}
            >
              {getCountryInfo(country).flag} {country} ▾
            </button>
            {countryPickerOpen && (
              <>
                {/* Invisible backdrop to close the menu on outside click,
                    matching the mobile picker's tap-to-dismiss overlay. */}
                <div
                  className={styles.countryBackdrop}
                  onClick={() => setCountryPickerOpen(false)}
                />
                <div className={styles.countryMenu}>
                  {COUNTRIES.map(c => (
                    <button
                      key={c.code}
                      onClick={() => handleSelectCountry(c.code)}
                      className={`${styles.countryOption} ${c.code === country ? styles.countryOptionActive : ''}`}
                    >
                      <span>{c.flag} {c.label}</span>
                      {c.code === country && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        ref={sheetRef}
        className={styles.bottomSheet}
        style={{
          transform: `translateY(${translateY}px)`,
          transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div
          className={styles.handleArea}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className={styles.handle} />

          {/* Brewpack header */}
          <div className={styles.brandRow}>
            <div>
              <div className={styles.brandName}>Brewpack</div>
              <div className={styles.brandTagline}>find. sip. explore.</div>
            </div>
          </div>
        </div>

        <input
          className={styles.search}
          placeholder="Search shops..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => snapPoints && snapTo(snapPoints.top)}
        />

        <div className={styles.filterScroll}>
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

        <div className={styles.sectionLabel}>NEARBY SHOPS</div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.empty}>Loading shops...</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>No shops match your filters.</div>
          ) : (
            filtered.map(shop => (
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
                  <div className={styles.cardTags}>
                    {shop.has_wifi && <span className={styles.tag}>📶</span>}
                    {shop.is_work_friendly && <span className={styles.tag}>💻</span>}
                    {shop.is_pet_friendly && <span className={styles.tag}>🐾</span>}
                    {shop.has_meals && <span className={styles.tag}>🍽️</span>}
                    {shop.has_pastries && <span className={styles.tag}>🥐</span>}
                    {shop.has_car_parking && <span className={styles.tag}>🚗</span>}
                    {shop.has_bike_parking && <span className={styles.tag}>🚲</span>}
                    {shop.accepts_cards && <span className={styles.tag}>💳</span>}
                    {shop.has_toilet_bidet && <span className={styles.tag}>🚿</span>}
                  </div>
                </div>
                {formatDistance(shop) && (
                  <div className={styles.distance}>{formatDistance(shop)}</div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
