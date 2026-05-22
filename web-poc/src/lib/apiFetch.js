export function apiFetch(url, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers }).then((response) => {
    if (response.status === 401) {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return response;
  });
}
