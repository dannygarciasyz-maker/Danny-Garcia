
import React from 'react';
import { ATSData } from '../types';

interface Props {
  data: ATSData;
  update: (d: Partial<ATSData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepHealth({ data, update, onNext, onPrev }: Props) {
  const toggle = (field: keyof ATSData['health']) => {
    update({ health: { ...data.health, [field]: !data.health[field] } });
  };

  const items = [
    { key: 'rested', label: '¿Me siento descansado y en condiciones físicas óptimas?' },
    { key: 'medicated', label: '¿Estoy libre de consumo de medicamentos que afecten mi atención?' },
    { key: 'emotionalState', label: '¿Me encuentro emocionalmente apto y concentrado para realizar mi labor?' },
    { key: 'prepared', label: '¿Estoy tranquilo y mentalmente preparado para realizar la labor?' },
    { key: 'optimalCondition', label: '¿Estoy en condiciones de asegurar mi propia seguridad y la de otros?' }
  ];

  const allChecked = Object.values(data.health).every(v => v === true);

  return (
    <div className="space-y-6">
      <div className="border-b-4 border-slate-100 pb-4">
        <h2 className="text-3xl font-black text-syz-jet uppercase tracking-tighter">Condiciones de Salud</h2>
        <p className="text-slate-500 font-bold italic">"Mi seguridad empieza por mi bienestar personal. Lea y confirme cada ítem."</p>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div 
            key={item.key} 
            onClick={() => toggle(item.key as keyof ATSData['health'])}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${data.health[item.key as keyof ATSData['health']] ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
          >
            <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${data.health[item.key as keyof ATSData['health']] ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}>
              {data.health[item.key as keyof ATSData['health']] && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>}
            </div>
            <label className="text-syz-jet font-black uppercase text-xs cursor-pointer flex-1">
              {item.label}
            </label>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
        <p className="text-amber-800 text-[9pt] font-bold">
          <span className="font-black">NOTA:</span> Debe marcar todos los ítems para confirmar que se encuentra en condiciones óptimas para iniciar labores. 
          <span className="block mt-2 text-syz-red font-black uppercase underline">
            De no encontrarse en condiciones óptimas, absténgase de realizar la labor y avise inmediatamente a su empleador o al responsable HSE.
          </span>
        </p>
      </div>

      <div className="flex justify-between pt-8 border-t">
        <button onClick={onPrev} className="text-slate-500 font-black px-6 py-3 hover:bg-slate-100 rounded-xl transition-all uppercase text-xs">Anterior</button>
        <button 
          onClick={onNext} 
          disabled={!allChecked}
          className={`px-10 py-3 rounded-xl font-black transition-all shadow-lg uppercase ${allChecked ? 'bg-syz-red text-white hover:bg-red-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          {allChecked ? 'Confirmar y Continuar' : 'Debe validar todos los puntos'}
        </button>
      </div>
    </div>
  );
}
