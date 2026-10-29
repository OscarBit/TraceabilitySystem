import { create } from 'zustand';

function getUserFromTokenOrStorage(token) {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { username: payload.sub, rol: payload.rol };
    }
  } catch (e) {
    console.error('Error parsing user data:', e);
  }
  return null;
}

const initialToken = localStorage.getItem('token');
const initialUser = getUserFromTokenOrStorage(initialToken);

export const useAuthStore = create((set) => ({
  token: initialToken,
  user: initialUser,
  isAuthenticated: !!initialToken,
  isAdmin: initialUser?.rol === 'Administrador',

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({
      token,
      user,
      isAuthenticated: !!token,
      isAdmin: user?.rol === 'Administrador',
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    });
  },
}));
