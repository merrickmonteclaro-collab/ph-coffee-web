export function saveToken(token) {
  localStorage.setItem('brewpack_token', token);
}

export function getToken() {
  return localStorage.getItem('brewpack_token');
}

export function removeToken() {
  localStorage.removeItem('brewpack_token');
}

export async function authFetch(url, options = {}) {
  const token = getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // A 401 means the saved token is expired or no longer valid (24h expiry,
  // or the server's signing key was rotated). Clear it so the app stops
  // treating the user as logged in and they're asked to log in again.
  // Only clear if the saved token is still the one this request used, so a
  // slow 401 can't wipe a token the user just got by logging in again.
  if (response.status === 401 && getToken() === token) {
    removeToken();
  }

  return response;
}
