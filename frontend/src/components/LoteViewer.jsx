import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth } from '../utils/api';

export default function LoteViewer() {
  const { id: loteId } = useParams();
  const navigate = useNavigate();
  const [lote, setLote] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLote();
  }, [loteId]);

  const fetchLote = async () => {
    setIsLoading(true);
    try {
      setErrorMsg(null);
      const res = await fetchAuth(`${import.meta.env.VITE_API_URL}/lotes/${loteId}`);
      if (res.ok) {
        const data = await res.json();
        setLote(data);
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Error al cargar la información del lote");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Error de conexión con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-400 p-8">Cargando lote...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-card rounded-2xl border border-border shadow-2xl p-6 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sm px-3 py-1 bg-border rounded hover:bg-gray-700 transition cursor-pointer">Volver</button>
          {errorMsg ? 'Error de Búsqueda' : (
            <>Detalle del Lote: <span className="text-blue-400">{loteId}</span></>
          )}
        </h2>
      </div>

      {errorMsg ? (
        <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg text-center">
          <h3 className="text-xl font-bold text-red-400 mb-2">Lote no encontrado</h3>
          <p className="text-gray-300">{errorMsg}</p>
        </div>
      ) : lote && (
        <>
          {/* Resumen del Lote */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Cant. Piedras</p>
              <p className="text-lg font-bold text-white">{lote.cantidad_piedras}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Peso Total (ct)</p>
              <p className="text-lg font-bold text-white">{lote.peso_total_ct}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Cliente ID</p>
              <p className="text-lg font-bold text-white">{lote.cliente_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Fecha Registro</p>
              <p className="text-lg font-bold text-white">{new Date(lote.fecha_registro).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Tabla de Piedras */}
          <div className="overflow-x-auto border border-gray-700 rounded-xl mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/80 text-gray-300 text-sm border-b border-gray-700">
                  <th className="p-4 font-semibold">Código (ID)</th>
                  <th className="p-4 font-semibold">Estado Actual</th>
                  <th className="p-4 font-semibold">Peso (ct)</th>
                  <th className="p-4 font-semibold">Tallador ID</th>
                  <th className="p-4 font-semibold w-1/4">Forma de la Talla</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {lote.piedras.map(piedra => (
                  <tr key={piedra.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <button 
                        onClick={() => navigate(`/trazabilidad/${piedra.id}`)}
                        className="text-blue-400 hover:text-blue-300 hover:underline font-mono cursor-pointer"
                      >
                        {piedra.id}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold
                        ${piedra.estado_actual === 'Ingreso' ? 'bg-gray-700 text-gray-300' : 
                          piedra.estado_actual === 'Desbaste' ? 'bg-yellow-900/50 text-yellow-500' :
                          piedra.estado_actual === 'Tallado' ? 'bg-blue-900/50 text-blue-400' :
                          'bg-emerald-900/50 text-emerald-400'}`}
                      >
                        {piedra.estado_actual}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{piedra.peso_ct !== null ? piedra.peso_ct : '-'}</td>
                    <td className="p-4 text-gray-300">{piedra.tallador_id !== null ? piedra.tallador_id : '-'}</td>
                    <td className="p-4 text-gray-300">
                      {piedra.plan_corte ? (
                        <span className="px-3 py-1 bg-gray-800 rounded-md border border-gray-700 text-sm">
                          {piedra.plan_corte}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
