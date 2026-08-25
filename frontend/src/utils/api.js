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
  }
  
  return response;
};
