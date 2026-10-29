import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStoneStore } from '../store/useStoneStore';
import { useAuthStore } from '../store/useAuthStore';
import DynamicActorSelect from './DynamicActorSelect';
import { Camera } from 'lucide-react';
import { fetchAuth } from '../utils/api';

const ESTADOS = ['Ingreso', 'Desbaste', 'Tallado', 'Entregado'];

export default function StoneViewer() {
  const { id: piedraId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get('token');
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('Ingreso');
  const [formData, setFormData] = useState({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [procesos, setProcesos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [showNewProcesoModal, setShowNewProcesoModal] = useState(false);
  const [newProceso, setNewProceso] = useState({ nombre: '', descripcion: '' });
  const { estadosHistorial, setEstadosHistorial, updatePiedraState } = useStoneStore();
  const isAdmin = useAuthStore((state) => state.isAdmin);

  useEffect(() => {
    fetchHistory();
    fetchProcesos();
    fetchUbicaciones();
  }, [piedraId]);

  const fetchProcesos = async () => {
    try {
      const res = await fetchAuth('/procesos/');
      if (res.ok) {
        setProcesos(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUbicaciones = async () => {
    try {
      const res = await fetchAuth('/ubicaciones/');
      if (res.ok) {
        setUbicaciones(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCrearProceso = async () => {
    if (!newProceso.nombre) return;
    try {
      const res = await fetchAuth('/procesos/', {
        method: 'POST',
        body: JSON.stringify(newProceso)
      });
      if (res.ok) {
        setShowNewProcesoModal(false);
        setNewProceso({ nombre: '', descripcion: '' });
        fetchProcesos(); // Refresh list
      } else {
        const err = await res.json();
        alert(err.detail || "Error al crear proceso");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    }
  };

  const fetchHistory = async () => {
    try {
      setErrorMsg(null);
      const url = qrToken 
        ? `/piedras/${piedraId}/historial?token=${encodeURIComponent(qrToken)}`
        : `/piedras/${piedraId}/historial`;
      const res = await fetchAuth(url);
      if (res.ok) {
        const data = await res.json();
        setEstadosHistorial(data);
        // Find latest state to set active tab
        if (data.length > 0) {
          const latestState = data[data.length - 1].estado_registrado;
          setActiveTab(latestState);
          loadFormDataForState(latestState, data);
        } else {
          // If no history, it's just 'Ingreso'
          setActiveTab('Ingreso');
          loadFormDataForState('Ingreso', []);
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Error al cargar la información");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Error de conexión con el servidor");
    }
  };

  const loadFormDataForState = (estadoName, historyArray = estadosHistorial) => {
    const record = historyArray.find(h => h.estado_registrado === estadoName);
    
    // Check if the state being viewed is older than the current actual state
    const currentActualState = historyArray.length > 0 ? historyArray[historyArray.length - 1].estado_registrado : 'Ingreso';
    const isPast = ESTADOS.indexOf(estadoName) < ESTADOS.indexOf(currentActualState);
    const isCompleted = record !== undefined;
    
    setIsReadOnly(isPast || isCompleted);
    
    if (record) {
      setFormData(record);
    } else {
      // Inherit if moving to a new state
      const previousStateRecord = historyArray.length > 0 ? historyArray[historyArray.length - 1] : {};
      setFormData({
        peso_ct: previousStateRecord.peso_ct || '',
        longitud_mm: previousStateRecord.longitud_mm || '',
        ancho_mm: previousStateRecord.ancho_mm || '',
        profundo_mm: previousStateRecord.profundo_mm || '',
        proceso_id: previousStateRecord.proceso_id || '',
        ubicacion_id: previousStateRecord.ubicacion_id || '',
        plan_corte: previousStateRecord.plan_corte || '',
        foto_url: previousStateRecord.foto_url || '',
        notas: ''
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formPayload = new FormData();
    formPayload.append('file', file);

    try {
      const res = await fetchAuth('/upload/image', {
        method: 'POST',
        body: formPayload
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, foto_url: data.url }));
      } else {
        alert("Error al subir la imagen");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTabClick = (estado) => {
    const currentActualStateIndex = estadosHistorial.length > 0 
      ? ESTADOS.indexOf(estadosHistorial[estadosHistorial.length - 1].estado_registrado)
      : 0;
    
    const targetIndex = ESTADOS.indexOf(estado);
    
    // Allow clicking past states, current state, or the exactly next valid state
    if (targetIndex <= currentActualStateIndex + 1) {
      setActiveTab(estado);
      loadFormDataForState(estado);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        estado: activeTab,
        ...formData,
        qr_token: qrToken || undefined
      };
      const res = await fetchAuth(`/piedras/${piedraId}/estado`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const updatedRecord = await res.json();
        setEstadosHistorial([...estadosHistorial, updatedRecord]);
        updatePiedraState(piedraId, activeTab);
        setIsReadOnly(true);
      } else {
        const error = await res.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-card rounded-2xl border border-border shadow-2xl p-6 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sm px-3 py-1 bg-border rounded hover:bg-gray-700 transition cursor-pointer">Volver</button>
          {errorMsg ? 'Error de Búsqueda' : (
            <>Trazabilidad Piedra: <span className="text-blue-400">{piedraId}</span></>
          )}
        </h2>
      </div>

      {errorMsg ? (
        <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg text-center">
          <h3 className="text-xl font-bold text-red-400 mb-2">Piedra no encontrada</h3>
          <p className="text-gray-300">El ID <strong className="text-white">{piedraId}</strong> no pertenece a ninguna piedra registrada en el sistema. Asegúrate de estar escaneando el código QR de una piedra y no el de un lote.</p>
        </div>
      ) : (
        <>
          {/* Timeline Tabs */}
      <div className="flex w-full border-b border-border mb-4">
        {ESTADOS.map((estado, idx) => {
          const isActive = activeTab === estado;
          const isAvailable = idx <= (estadosHistorial.length > 0 ? ESTADOS.indexOf(estadosHistorial[estadosHistorial.length - 1].estado_registrado) + 1 : 0);
          const isCompleted = estadosHistorial.some(h => h.estado_registrado === estado);

          return (
            <button
              key={estado}
              onClick={() => handleTabClick(estado)}
              disabled={!isAvailable}
              className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 
                ${isActive ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}
                ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs
                  ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}
                `}>
                  {idx + 1}
                </span>
                {estado}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dimensions Group */}
        <div className="col-span-1 md:col-span-2 flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-300">Peso (ct)</label>
              <input type="number" name="peso_ct" value={formData.peso_ct || ''} onChange={handleChange} disabled={isReadOnly || (activeTab === 'Entregado' && !isReadOnly)} className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground disabled:opacity-50" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-300">Largo (mm)</label>
              <input type="number" name="longitud_mm" value={formData.longitud_mm || ''} onChange={handleChange} disabled={isReadOnly || (activeTab === 'Entregado' && !isReadOnly)} className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground disabled:opacity-50" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-300">Ancho (mm)</label>
              <input type="number" name="ancho_mm" value={formData.ancho_mm || ''} onChange={handleChange} disabled={isReadOnly || (activeTab === 'Entregado' && !isReadOnly)} className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground disabled:opacity-50" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-300">Alto (mm)</label>
              <input type="number" name="profundo_mm" value={formData.profundo_mm || ''} onChange={handleChange} disabled={isReadOnly || (activeTab === 'Entregado' && !isReadOnly)} className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground disabled:opacity-50" />
            </div>
        </div>

        {/* Plan Corte / Proceso */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold text-gray-300">Proceso (Plan de Corte / Tratamiento)</label>
            {isAdmin && !isReadOnly && activeTab === 'Ingreso' && (
              <button 
                onClick={() => setShowNewProcesoModal(true)}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded transition"
              >
                + Nuevo Proceso
              </button>
            )}
          </div>
          <select 
             name="proceso_id" 
             value={formData.proceso_id || ''} 
             onChange={handleChange} 
             disabled={isReadOnly || activeTab !== 'Ingreso'} 
             className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground disabled:opacity-50 outline-none focus:border-blue-500"
          >
             <option value="" disabled>Seleccione un proceso...</option>
             {procesos.map(p => (
               <option key={p.id} value={p.id}>{p.nombre}</option>
             ))}
          </select>
          {isReadOnly && formData.plan_corte && !formData.proceso_id && (
            <p className="text-xs text-gray-400 mt-1">Antiguo plan: {formData.plan_corte}</p>
          )}
        </div>

        {/* Ubicación / Custodia */}
        <div className="col-span-1 md:col-span-2">
          <label className="text-sm font-semibold text-gray-300 block mb-1">
            Ubicación / Área de Custodia
          </label>
          <select 
             name="ubicacion_id" 
             value={formData.ubicacion_id || ''} 
             onChange={handleChange} 
             disabled={isReadOnly} 
             className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground disabled:opacity-50 outline-none focus:border-blue-500"
          >
             <option value="">Seleccione el área o estado de custodia...</option>
             {ubicaciones.map(u => (
               <option key={u.id} value={u.id}>
                 {u.nombre} {u.descripcion ? `— ${u.descripcion}` : ''}
               </option>
             ))}
          </select>
          {isReadOnly && formData.ubicacion && (
            <p className="text-xs text-blue-400 mt-1">Área registrada: {formData.ubicacion.nombre}</p>
          )}
        </div>

        {/* Tallador - Only active from Desbaste onwards */}
        {ESTADOS.indexOf(activeTab) >= 1 && (
          <div className="col-span-1 md:col-span-2">
            {isReadOnly ? (
               <div>
                  <label className="text-sm font-semibold text-gray-300">Tallador Asignado (ID)</label>
                  <input type="text" value={formData.tallador_id || 'N/A'} disabled className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground opacity-50" />
               </div>
            ) : (
               <DynamicActorSelect 
                 label="Tallador" 
                 role="Tallador" 
                 value={formData.tallador_id} 
                 onSelect={(val) => setFormData({...formData, tallador_id: val})} 
               />
            )}
          </div>
        )}

        {/* Foto */}
        <div className="col-span-1 md:col-span-2">
          <label className="text-sm font-semibold text-gray-300 mb-2 block">Fotografía del Estado</label>
          <div className="flex items-center gap-4">
            {formData.foto_url && (
              <img src={formData.foto_url.startsWith('http') ? formData.foto_url : `${import.meta.env.VITE_API_URL || ''}${formData.foto_url}`} alt="Piedra" className="w-32 h-32 object-cover rounded-lg border border-border bg-black" />
            )}
            
            {(!isReadOnly && activeTab !== 'Entregado') && (
              <label className={`flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {isUploading ? (
                  <span className="text-sm text-gray-400">Subiendo...</span>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-400 font-medium text-center px-2">Subir / Cambiar Foto</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="col-span-1 md:col-span-2">
          <label className="text-sm font-semibold text-gray-300">Notas Adicionales</label>
          <textarea name="notas" value={formData.notas || ''} onChange={handleChange} disabled={isReadOnly} className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground h-24 resize-none disabled:opacity-50" />
        </div>

      </div>

      {/* Footer / Actions */}
      {!isReadOnly && (
        <div className="flex justify-end mt-4">
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            Guardar Estado: {activeTab}
          </button>
        </div>
      )}
        </>
      )}

      {/* Modal Nuevo Proceso */}
      {showNewProcesoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-2xl max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-4">Crear Nuevo Proceso</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={newProceso.nombre}
                  onChange={(e) => setNewProceso({...newProceso, nombre: e.target.value})}
                  className="w-full bg-input border border-border rounded-lg p-2 text-foreground focus:border-emerald-500 outline-none"
                  placeholder="Ej: Brillo, Pulido Extra"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-1">Descripción</label>
                <textarea 
                  value={newProceso.descripcion}
                  onChange={(e) => setNewProceso({...newProceso, descripcion: e.target.value})}
                  className="w-full bg-input border border-border rounded-lg p-2 text-foreground focus:border-emerald-500 outline-none h-20 resize-none"
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowNewProcesoModal(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCrearProceso}
                disabled={!newProceso.nombre}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
