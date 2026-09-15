import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('Operador');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password, rol, nombre })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al registrar el usuario');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-8 flex flex-col gap-6 mx-auto mt-20 relative">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-primary mb-2">Crear Cuenta</h2>
        <p className="text-gray-400">Regístrate para acceder al sistema</p>
      </div>

      {success ? (
        <div className="bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl text-center">
          ¡Usuario creado exitosamente! Redirigiendo al login...
        </div>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {error && <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">{error}</div>}
          
          <div>
            <label className="text-sm font-semibold text-gray-300 block mb-1">Nombre Completo</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              required
              className="w-full bg-input border border-border rounded-lg p-3 text-foreground focus:border-blue-500 outline-none transition"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 block mb-1">Usuario</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
              className="w-full bg-input border border-border rounded-lg p-3 text-foreground focus:border-blue-500 outline-none transition"
              placeholder="Elige un nombre de usuario"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 block mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              className="w-full bg-input border border-border rounded-lg p-3 text-foreground focus:border-blue-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 block mb-1">Rol</label>
            <select 
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full bg-input border border-border rounded-lg p-3 text-foreground focus:border-blue-500 outline-none transition"
            >
              <option value="Operador">Operador</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg mt-2 transition cursor-pointer"
          >
            {isLoading ? 'Registrando...' : 'Registrar Cuenta'}
          </button>
        </form>
      )}

      <div className="text-center mt-4 border-t border-gray-700 pt-4">
        <span className="text-gray-400 text-sm">¿Ya tienes cuenta? </span>
        <button onClick={() => navigate('/login')} className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
          Inicia Sesión aquí
        </button>
      </div>
    </div>
  );
}
