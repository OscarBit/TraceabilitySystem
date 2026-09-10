import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { fetchAuth } from '../utils/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function DashboardViewer() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [estado, setEstado] = useState('');
  const [loteId, setLoteId] = useState('');
  const [planCorte, setPlanCorte] = useState('');
  
  useEffect(() => {
    fetchStats();
  }, [estado, loteId, planCorte]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (estado) params.append('estado', estado);
      if (loteId) params.append('lote_id', loteId);
      if (planCorte) params.append('plan_corte', planCorte);
      
      const res = await fetchAuth(`${import.meta.env.VITE_API_URL}/dashboard/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-card rounded-2xl border border-border shadow-2xl p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sm px-3 py-1 bg-border rounded hover:bg-gray-700 transition cursor-pointer">Volver</button>
          Dashboard de Operaciones
        </h2>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-800/30 p-4 rounded-xl border border-gray-700">
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Estado</label>
          <select 
            value={estado} 
            onChange={e => setEstado(e.target.value)}
            className="w-full bg-input border border-border text-foreground p-2 rounded outline-none focus:border-blue-500"
          >
            <option value="">Todos los Estados</option>
            <option value="Ingreso">Ingreso</option>
            <option value="Desbaste">Desbaste</option>
            <option value="Tallado">Tallado</option>
            <option value="Entregado">Entregado</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Lote (ID)</label>
          <input 
            type="text" 
            value={loteId} 
            onChange={e => setLoteId(e.target.value)}
            placeholder="Ej: GSX-T-2026..."
            className="w-full bg-input border border-border text-foreground p-2 rounded outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Forma de Talla</label>
          <select 
            value={planCorte} 
            onChange={e => setPlanCorte(e.target.value)}
            className="w-full bg-input border border-border text-foreground p-2 rounded outline-none focus:border-blue-500"
          >
            <option value="">Todas las Formas</option>
            <option value="Corte Esmeralda">Corte Esmeralda</option>
            <option value="Ovalo">Ovalo</option>
            <option value="Redondo">Redondo</option>
            <option value="Cojín">Cojín</option>
            <option value="Pera">Pera</option>
            <option value="Asscher">Asscher</option>
            <option value="Octágono">Octágono</option>
            <option value="Corazón">Corazón</option>
            <option value="Cabujón">Cabujón</option>
            <option value="Trillion">Trillion</option>
            <option value="Fantasía">Fantasía</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 p-8">Cargando datos...</div>
      ) : stats ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-blue-900/20 border border-blue-500/30 rounded-xl text-center shadow-inner">
              <p className="text-sm text-blue-300 uppercase tracking-wider mb-2">Total Piedras Procesadas</p>
              <p className="text-4xl font-bold text-white drop-shadow-md">{stats.total_piedras}</p>
            </div>
            <div className="p-6 bg-emerald-900/20 border border-emerald-500/30 rounded-xl text-center shadow-inner">
              <p className="text-sm text-emerald-300 uppercase tracking-wider mb-2">Quilates Totales (ct)</p>
              <p className="text-4xl font-bold text-white drop-shadow-md">{stats.total_quilates}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            
            <div className="bg-gray-800/20 border border-gray-700 p-4 rounded-xl shadow-md hover:border-gray-600 transition">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">Piedras por Estado</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.piedras_por_estado}>
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 12}} />
                    <YAxis stroke="#9ca3af" allowDecimals={false} tick={{fontSize: 12}} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-800/20 border border-gray-700 p-4 rounded-xl shadow-md hover:border-gray-600 transition">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">Formas de Talla más Populares</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.piedras_por_forma.slice(0, 5)} layout="vertical" margin={{ left: 30 }}>
                    <XAxis type="number" stroke="#9ca3af" allowDecimals={false} tick={{fontSize: 12}} />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{fontSize: 12}} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-800/20 border border-gray-700 p-4 rounded-xl md:col-span-2 shadow-md hover:border-gray-600 transition">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">Distribución de Piedras por Tallador</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={stats.piedras_por_tallador} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={110}
                      innerRadius={60}
                      label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                    >
                      {stats.piedras_por_tallador.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
}
