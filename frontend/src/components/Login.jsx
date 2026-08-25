import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formPayload = new URLSearchParams();
      formPayload.append('username', username);
      formPayload.append('password', password);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formPayload,
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/'); // Redirect to Home
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error(error);
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img src="/mainLogoGreen.png" alt="GemStoneX" className="h-16 mb-4 object-contain" />
          <h2 className="text-2xl font-bold text-primary">Iniciar Sesión</h2>
        </div>
        
        {error && (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6 border border-red-500/50">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-gray-300">Usuario</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 p-3 bg-input border border-border rounded-lg text-foreground outline-none focus:border-emerald-500 transition-colors" 
              placeholder="Ej. admin"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-300">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-3 bg-input border border-border rounded-lg text-foreground outline-none focus:border-emerald-500 transition-colors" 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? 'Verificando...' : 'Acceder al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
