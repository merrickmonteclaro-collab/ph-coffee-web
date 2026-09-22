import { API_URL } from './config'

// Shop data doesn't change often enough to justify a fresh network round-trip
// on every page visit — cache it for a minute and let pages share one copy.
const CACHE_TTL = 60 * 1000

// One cache entry per country code, plus a special 'ALL' key for callers
// that don't pass a country (unfiltered /shops/ — kept for backward
// compatibility with any existing callers). Keyed this way so switching
// countries doesn't discard another country's already-cached shops.
const cache = {}      // { [key]: { shops, fetchedAt } }
const pendingFetches = {} // { [key]: Promise }

/**
 * Returns cached shops for the given country if fresh, otherwise fetches
 * once and caches the result. Concurrent callers for the same country share
 * the same in-flight request instead of firing duplicate network calls.
 *
 * @param {{ country?: string, forceRefresh?: boolean }} [options]
 *   country: e.g. 'PH', 'SG'. Omit to fetch all shops (old behavior).
 */
export function getShops({ country, forceRefresh = false } = {}) {
  const key = country || 'ALL'
  const entry = cache[key]
  const isFresh = entry && (Date.now() - entry.fetchedAt < CACHE_TTL)
  if (isFresh && !forceRefresh) {
    return Promise.resolve(entry.shops)
  }
  if (pendingFetches[key]) {
    return pendingFetches[key]
  }
  const url = country ? `${API_URL}/shops?country=${country}` : `${API_URL}/shops/`
  pendingFetches[key] = fetch(url)
    .then(r => r.json())
    .then(data => {
      const shops = Array.isArray(data) ? data : []
      cache[key] = { shops, fetchedAt: Date.now() }
      delete pendingFetches[key]
      return shops
    })
    .catch(err => {
      delete pendingFetches[key]
      throw err
    })
  return pendingFetches[key]
}

// Call after an action that changes shop data (e.g. admin edit propagating,
// or a future in-app edit flow) to force the next getShops() call to refetch.
// Pass a country to invalidate just that country's cache, or omit to clear all.
export function invalidateShopsCache(country) {
  if (country) {
    delete cache[country]
  } else {
    for (const key in cache) delete cache[key]
  }
}
