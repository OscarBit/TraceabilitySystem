import { useAuthStore } from '../store/useAuthStore';

export const fetchAuth = async (url, options = {}) => {
  const token = useAuthStore.getState().token || localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!(options.body instanceof FormData)) {
     if (!headers['Content-Type']) {
         headers['Content-Type'] = 'application/json';
     }
  }

  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  let targetUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (!url.startsWith(baseUrl)) {
      const cleanUrl = url.startsWith('/') ? url : `/${url}`;
      targetUrl = `${baseUrl}${cleanUrl}`;
    }
  }

  const response = await fetch(targetUrl, { ...options, headers });
  
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  } else if (response.status === 403) {
    // Handling RBAC / 2FA errors
    const errorData = await response.clone().json().catch(() => ({}));
    if (errorData.detail === "2FA_REQUIRED") {
      throw new Error("2FA_REQUIRED");
    } else {
      alert(errorData.detail || "Acceso denegado. No tienes permisos suficientes.");
      if (window.location.pathname.includes('/dashboard')) {
        window.location.href = '/';
      }
    }
  }
  
  return response;
};
