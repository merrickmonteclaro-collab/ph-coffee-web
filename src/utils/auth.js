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
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}
