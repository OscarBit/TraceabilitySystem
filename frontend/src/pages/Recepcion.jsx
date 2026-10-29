import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import DynamicActorSelect from '../components/DynamicActorSelect';
import { fetchAuth } from '../utils/api';

export default function Recepcion() {
  const navigate = useNavigate();
  const [clienteId, setClienteId] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [cantidadPiedras, setCantidadPiedras] = useState(1);
  const [pesoTotal, setPesoTotal] = useState('');
  const [loteGenerado, setLoteGenerado] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCliente, setIsCreatingCliente] = useState(false);
  const [isCreatingOperador, setIsCreatingOperador] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isCreatingActors = isCreatingCliente || isCreatingOperador;

  const handleRegistrarLote = async () => {
    let missingFields = [];
    if (!clienteId) missingFields.push("Cliente (Dueño)");
    if (!responsableId) missingFields.push("Operador Responsable");
    if (cantidadPiedras < 1) missingFields.push("Cantidad de Piedras válida");
    if (!pesoTotal) missingFields.push("Peso Total Estimado");

    if (missingFields.length > 0) {
      alert(`Error al generar: Faltan los siguientes datos obligatorios:\n\n- ${missingFields.join('\n- ')}\n\nSi creaste un nuevo actor, asegúrate de haber presionado el botón verde (✔) o Enter para guardarlo antes de registrar el lote.`);
      return;
    }
    
    setShowConfirmModal(true);
  };

  const confirmRegistrarLote = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const res = await fetchAuth('/lotes/', {
        method: 'POST',
        body: JSON.stringify({
          cliente_id: parseInt(clienteId),
          responsable_id: parseInt(responsableId),
          cantidad_piedras: parseInt(cantidadPiedras),
          peso_total_ct: parseFloat(pesoTotal)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLoteGenerado(data);
      } else {
        alert("Error al crear el lote");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión con el backend");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loteGenerado) {
    const appBaseUrl = (import.meta.env.VITE_APP_URL && !import.meta.env.VITE_APP_URL.includes('localhost'))
      ? import.meta.env.VITE_APP_URL
      : window.location.origin;

    return (
      <div className="w-full max-w-4xl bg-card rounded-2xl border border-border p-8 shadow-2xl">
         <div className="flex justify-between items-center mb-6 print:hidden">
            <h2 className="text-2xl font-bold text-primary">Lote Generado Exitosamente</h2>
            <div className="flex gap-2">
               <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer">
                  🖨️ Imprimir QRs
               </button>
               <button onClick={() => navigate('/')} className="bg-border px-4 py-2 rounded hover:bg-gray-700 cursor-pointer">
                  Finalizar
               </button>
            </div>
         </div>

         <div className="print-area">
           <div className="mb-8 border-b border-gray-700 pb-4">
             <h3 className="text-xl font-bold text-white print:text-black">Lote Principal: {loteGenerado.id}</h3>
             <p className="text-gray-400 print:text-gray-600">Este QR identifica el lote completo.</p>
             <div className="mt-4 p-4 bg-white inline-block rounded-lg">
               <QRCodeSVG value={`${appBaseUrl}/lotes/${loteGenerado.id}${loteGenerado.qr_token ? `?token=${loteGenerado.qr_token}` : ''}`} size={128} />
             </div>
           </div>

           <h3 className="text-lg font-bold text-white print:text-black mb-4">Códigos Individuales ({loteGenerado.piedras_generadas.length} piedras)</h3>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
             {loteGenerado.piedras_generadas.map((piedra) => (
               <div key={piedra.id} className="border border-gray-700 print:border-gray-300 p-4 rounded-xl flex flex-col items-center gap-2">
                 <p className="font-mono text-sm text-gray-300 print:text-black">{piedra.id}</p>
                 <div className="p-2 bg-white rounded-lg">
                   <QRCodeSVG value={`${appBaseUrl}/trazabilidad/${piedra.id}${piedra.qr_token ? `?token=${piedra.qr_token}` : ''}`} size={100} />
                 </div>
               </div>
             ))}
           </div>
         </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl bg-card rounded-2xl border border-border p-8 shadow-2xl print:hidden">
       <h2 className="text-2xl font-bold text-primary mb-6 flex justify-between items-center">
          Registrar Nuevo Lote
          <button onClick={() => navigate('/')} className="text-sm bg-border px-3 py-1 rounded hover:bg-gray-700 cursor-pointer">Volver</button>
       </h2>
       <div className="space-y-6">
          <DynamicActorSelect 
             label="Cliente (Dueño)" 
             role="Cliente" 
             value={clienteId} 
             onSelect={setClienteId} 
             onIsCreatingChange={setIsCreatingCliente}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-300">Cantidad de Piedras</label>
              <input type="number" min="1" value={cantidadPiedras} onChange={(e) => setCantidadPiedras(e.target.value)} className="w-full mt-1 p-2.5 bg-input border border-border rounded-lg text-foreground outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-300">Peso Total Estimado (ct)</label>
              <input type="number" step="0.01" min="0" value={pesoTotal} onChange={(e) => setPesoTotal(e.target.value)} className="w-full mt-1 p-2.5 bg-input border border-border rounded-lg text-foreground outline-none focus:border-blue-500" />
            </div>
          </div>
          
          <DynamicActorSelect 
             label="Operador Responsable" 
             role="Operador" 
             value={responsableId} 
             onSelect={setResponsableId}
             onIsCreatingChange={setIsCreatingOperador}
          />
          
          <button 
            onClick={handleRegistrarLote}
            disabled={isSubmitting || isCreatingActors}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-700 text-white font-bold rounded-lg mt-4 transition shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            {isSubmitting ? 'Registrando...' : isCreatingActors ? 'Guarda los actores (botón verde) para continuar' : 'Registrar Lote y Generar QRs'}
          </button>
       </div>

       {showConfirmModal && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 print:hidden">
           <div className="bg-card border border-border p-8 rounded-2xl shadow-2xl max-w-md w-full relative">
             <h3 className="text-2xl font-bold text-white mb-4">Confirmar Creación de Lote</h3>
             <p className="text-gray-300 mb-6">Por favor verifica los datos antes de registrar el lote. Esta acción generará las piedras en el sistema.</p>
             
             <div className="bg-background border border-border rounded-xl p-4 mb-6 space-y-3">
               <div className="flex justify-between">
                 <span className="text-gray-400">Cliente (Dueño ID):</span>
                 <span className="font-bold text-white">{clienteId}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-400">Operador (ID):</span>
                 <span className="font-bold text-white">{responsableId}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-400">Cantidad Piedras:</span>
                 <span className="font-bold text-emerald-400">{cantidadPiedras}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-400">Peso Total (ct):</span>
                 <span className="font-bold text-blue-400">{pesoTotal} ct</span>
               </div>
             </div>

             <div className="flex gap-4">
               <button 
                 onClick={() => setShowConfirmModal(false)}
                 className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition"
               >
                 Cancelar
               </button>
               <button 
                 onClick={confirmRegistrarLote}
                 className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
               >
                 Confirmar y Crear
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
