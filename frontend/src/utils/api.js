export const fetchAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove X-Device-Code if it exists in old code
  if (headers['X-Device-Code']) {
    delete headers['X-Device-Code'];
  }
  
  if (!(options.body instanceof FormData)) {
     if (!headers['Content-Type']) {
         headers['Content-Type'] = 'application/json';
     }
  }

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem('token');
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
