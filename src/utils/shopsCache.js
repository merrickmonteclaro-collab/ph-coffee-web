import { API_URL } from './config'

let cachedShops = null
let lastFetchedAt = 0
let pendingFetch = null

// Shop data doesn't change often enough to justify a fresh network round-trip
// on every page visit — cache it for a minute and let pages share one copy.
const CACHE_TTL = 60 * 1000

/**
 * Returns cached shops if fresh, otherwise fetches once and caches the result.
 * Concurrent callers (e.g. two pages mounting near-simultaneously) share the
 * same in-flight request instead of firing duplicate network calls.
 */
export function getShops({ forceRefresh = false } = {}) {
  const isFresh = cachedShops && (Date.now() - lastFetchedAt < CACHE_TTL)
  if (isFresh && !forceRefresh) {
    return Promise.resolve(cachedShops)
  }
  if (pendingFetch) {
    return pendingFetch
  }
  pendingFetch = fetch(`${API_URL}/shops/`)
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        cachedShops = data
        lastFetchedAt = Date.now()
      }
      pendingFetch = null
      return cachedShops || []
    })
    .catch(err => {
      pendingFetch = null
      throw err
    })
  return pendingFetch
}

// Call after an action that changes shop data (e.g. admin edit propagating,
// or a future in-app edit flow) to force the next getShops() call to refetch.
export function invalidateShopsCache() {
  cachedShops = null
  lastFetchedAt = 0
}
