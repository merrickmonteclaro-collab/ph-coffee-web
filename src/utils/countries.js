// Web port of mobile's utils/countries.ts. Kept in sync manually — if you
// add a country here, add it there too (and vice versa).
//
// Note: centers use { lat, lng } (not { latitude, longitude }) to match
// the Google Maps JS API's coordinate object shape used throughout the
// web app, unlike the mobile version which matches react-native-maps.

export const COUNTRIES = [
  { code: 'PH', label: 'Philippines', flag: '🇵🇭', center: { lat: 14.5995, lng: 120.9842 } },
  { code: 'SG', label: 'Singapore', flag: '🇸🇬', center: { lat: 1.3521, lng: 103.8198 } },
  { code: 'HK', label: 'Hong Kong', flag: '🇭🇰', center: { lat: 22.3193, lng: 114.1694 } },
  { code: 'TW', label: 'Taiwan', flag: '🇹🇼', center: { lat: 23.6978, lng: 120.9605 } },
]

export const DEFAULT_COUNTRY = 'PH'

export function getCountryInfo(code) {
  return COUNTRIES.find(c => c.code === code) || COUNTRIES[0]
}

// Simple bounding-box check rather than a reverse-geocoding API call —
// supported countries don't overlap in lat/lng, so this is free, instant,
// and accurate enough for country-level detection. Mirrors mobile exactly.
export function detectCountry(lat, lng) {
  if (lat >= 4.5 && lat <= 21 && lng >= 116 && lng <= 127) return 'PH'
  if (lat >= 1.1 && lat <= 1.5 && lng >= 103.5 && lng <= 104.1) return 'SG'
  if (lat >= 22.1 && lat <= 22.6 && lng >= 113.8 && lng <= 114.5) return 'HK'
  if (lat >= 21.8 && lat <= 25.4 && lng >= 119.3 && lng <= 122.1) return 'TW'
  return DEFAULT_COUNTRY
}
