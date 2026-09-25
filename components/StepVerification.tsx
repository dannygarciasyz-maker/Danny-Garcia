
import React from 'react';
import { ATSData } from '../types';

interface Props {
  data: ATSData;
  update: (d: Partial<ATSData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepVerification({ data, update, onNext, onPrev }: Props) {
  const checklist = [
    "¿EL EQUIPO EJECUTOR TIENE LAS COMPETENCIA PARA DESARROLLAR EL TRABAJO?",
    "¿EL EQUIPO EJECUTOR TIENE CLARO LOS RIESGOS A LOS CUALES SE ENCONTRARA EXPUESTO EN LA EJECUCIÓN DEL TRABAJO?",
    "¿EL EQUIPO EJECUTOR TIENE CLARAS LAS MEDIDAS DE CONTROL Y PROCEDIMIENTO SEGUROS QUE DEBE SEGUIR PARA EJECUTAR EL TRABAJO?",
    "¿EL EQUIPO EJECUTOR TIENE CLARAS SUS FUNCIONES Y RESPONSABILIDAD EN LA EJECUCIÓN DEL TRABAJO?",
    "¿EL EQUIPO EJECUTOR CUENTA CON TODOS LOS ELEMENTOS DE PROTECCIÓN PERSONAL ADECUADO Y EN BUEN ESTADO PARA EJECUTAR EL TRABAJO?",
    "¿EL EQUIPO DE TRABAJO CUENTA CON LOS EQUIPOS Y HERRAMIENTAS ADECUADAS PARA EJECUTAR EL TRABAJO?"
  ];

  const handleToggle = (item: string) => {
    const newVerification = { ...data.verification };
    newVerification[item] = !newVerification[item];
    update({ verification: newVerification });
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-black text-syz-red uppercase">Verificación Final</h2>
        <p className="text-slate-500 font-bold italic">Validación crítica del equipo ejecutor antes de iniciar.</p>
      </div>

      <div className="space-y-4">
        {/* Pregunta sobre Plan de Trabajo unificada */}
        <div 
          onClick={() => update({ activity: { ...data.activity, hasWorkPlan: !data.activity.hasWorkPlan } })}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${data.activity.hasWorkPlan ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
          <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${data.activity.hasWorkPlan ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}>
            {data.activity.hasWorkPlan && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>}
          </div>
          <label className="text-syz-jet font-black uppercase text-xs cursor-pointer flex-1">
            ¿La labor a ejecutar cuenta con un plan de trabajo verificado?
          </label>
        </div>

        {checklist.map((item, i) => (
          <div 
            key={i} 
            onClick={() => handleToggle(item)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${data.verification[item] ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
            <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${data.verification[item] ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}>
              {data.verification[item] && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>}
            </div>
            <label className="text-syz-jet font-black uppercase text-xs cursor-pointer flex-1">
              {item}
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-8 border-t">
        <button onClick={onPrev} className="text-slate-500 font-black px-6 py-3 hover:bg-slate-100 rounded-xl transition-all uppercase text-xs">Anterior</button>
        <button onClick={onNext} className="bg-syz-jet text-white px-10 py-3 rounded-xl font-black hover:bg-black transition-all shadow-lg uppercase">
          Siguiente
        </button>
      </div>
    </div>
  );
}
