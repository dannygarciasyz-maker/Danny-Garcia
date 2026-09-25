
import React, { useState } from 'react';
import { ATSData } from '../types';

interface Props {
  data: ATSData;
  update: (d: Partial<ATSData>) => void;
  onNext: () => void;
  onJumpToSummary?: () => void;
  isPrefilled?: boolean;
}

const InlineChoice = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  inputValue, 
  onInputChange, 
  isRequired,
  error,
  id
}: any) => (
  <div className="flex flex-col space-y-1 col-span-1">
    <label className="text-subtitle uppercase truncate" title={label}>
      {label} {isRequired && <span className="text-syz-red">*</span>}
    </label>
    <div className={`flex items-center gap-2 bg-[#F2F2F2] border rounded px-2 h-[42px] transition-all ${error ? 'border-syz-red ring-2 ring-red-100 shadow-sm' : 'border-syz-onyx'}`}>
      <div className="flex items-center gap-1 cursor-pointer select-none group" onClick={() => onChange('Sí')}>
        <span className="font-bold text-slate-800 text-[8pt]">Sí</span>
        <div className="w-4 h-4 border border-syz-onyx flex items-center justify-center bg-white rounded-sm group-hover:border-syz-red transition-colors">
          {value === 'Sí' && <div className="w-2.5 h-2.5 bg-syz-red"></div>}
        </div>
      </div>
      
      <div className="flex items-center gap-1 cursor-pointer select-none group" onClick={() => onChange('No')}>
        <span className="font-bold text-slate-800 text-[8pt]">No</span>
        <div className="w-4 h-4 border border-syz-onyx flex items-center justify-center bg-white rounded-sm group-hover:border-syz-red transition-colors">
          {value === 'No' && <div className="w-2.5 h-2.5 bg-syz-red"></div>}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <input 
          id={id}
          type="text" 
          placeholder={value === 'Sí' ? placeholder : ""}
          value={inputValue || ''}
          disabled={value !== 'Sí'}
          onChange={(e) => onInputChange(e.target.value)}
          className={`!h-6 !bg-transparent !border-b !border-t-0 !border-x-0 !border-syz-onyx !rounded-none !px-1 focus:!ring-0 font-bold text-[8pt] transition-opacity w-full ${value !== 'Sí' ? 'opacity-10 pointer-events-none' : 'opacity-100'}`}
        />
      </div>
    </div>
  </div>
);

export default function StepContext({ data, update, onNext, onJumpToSummary, isPrefilled }: Props) {
  const [showValidation, setShowValidation] = useState(false);

  const handleChange = (field: keyof ATSData['activity'], value: string | number) => {
    update({ activity: { ...data.activity, [field]: value } });
  };

  const handleCompanySelect = (val: string) => {
    const newActivity = { ...data.activity };
    if (val === "Otro") {
      newActivity.location = " "; 
      newActivity.company = "";
    } else {
      newActivity.location = val;
      newActivity.company = val.includes('(') ? val.split(' (')[0] : val;
      if (val === "SYZ Colombia (Funza, Cundinamarca)") {
        newActivity.address = "Aut. Bogotá-Medellín Km 7 Conj. Celta Trade Park LT 7, LC 5";
      }
    }
    update({ activity: newActivity });
  };

  const missingFields: string[] = [];
  if (data.activity.hasCaseAssociated === 'Sí' && !data.activity.serviceCallNo) missingFields.push("Número de Caso (requerido si seleccionó 'Sí')");
  if (!data.activity.location || data.activity.location === ' ') missingFields.push("Compañía / Sede");
  if (!data.activity.address) missingFields.push("Dirección de la obra");
  if (data.activity.workerCount < 1) missingFields.push("Número de Trabajadores (debe ser al menos 1)");
  if (data.activity.requiresPermit === 'Sí' && !data.activity.permitNo) missingFields.push("Número de Permiso de Trabajo (requerido si seleccionó 'Sí')");
  if (!data.activity.taskDescription || data.activity.taskDescription.trim().length < 10) missingFields.push("Trabajo a realizar (descripción muy corta)");

  const isFormValid = missingFields.length === 0;

  const isOtherActive = data.activity.location === " " || (data.activity.location !== "" && !["SYZ Colombia (Funza, Cundinamarca)"].includes(data.activity.location));

  return (
    <div className="space-y-6">
      {/* Header con Título y No. ATS prominentemente */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-syz-red pb-3 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-syz-jet uppercase tracking-tight">Datos de la actividad</h2>
          {isPrefilled && (
            <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full border border-amber-200 animate-pulse uppercase">
              Recuperado
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 bg-syz-jet text-white px-4 py-2 rounded-xl shadow-lg border-l-4 border-syz-red">
          <span className="text-[9px] font-black uppercase opacity-60">No. ATS:</span>
          <span className="text-lg font-black tracking-widest">{data.activity.orderNo}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
        <InlineChoice 
          label="¿Caso asociado?" 
          value={data.activity.hasCaseAssociated || 'No'} 
          isRequired
          placeholder="No."
          inputValue={data.activity.serviceCallNo}
          error={showValidation && data.activity.hasCaseAssociated === 'Sí' && !data.activity.serviceCallNo}
          onInputChange={(val: string) => handleChange('serviceCallNo', val)}
          onChange={(val: string) => update({ activity: { ...data.activity, hasCaseAssociated: val, serviceCallNo: val === 'No' ? '' : data.activity.serviceCallNo } })}
        />

        <div className={`flex flex-col space-y-1 transition-all duration-300 ${isOtherActive ? 'col-span-1 md:col-span-2' : 'col-span-1'}`}>
          <label className="text-subtitle uppercase">Compañía / Sede <span className="text-syz-red">*</span></label>
          <div className="flex gap-2">
            <select 
              className={`flex-1 min-w-[140px] ${showValidation && (!data.activity.location) ? 'border-syz-red ring-2 ring-red-100' : ''}`}
              value={data.activity.location === " " ? "Otro" : (data.activity.location === "" ? "" : (["SYZ Colombia (Funza, Cundinamarca)"].includes(data.activity.location) ? data.activity.location : "Otro"))} 
              onChange={e => handleCompanySelect(e.target.value)}
            >
              <option value="">Seleccione...</option>
              <option value="SYZ Colombia (Funza, Cundinamarca)">SYZ Colombia (Funza, Cundinamarca)</option>
              <option value="Otro">Otro (Especificar)</option>
            </select>
            
            {isOtherActive && (
              <input 
                type="text" 
                placeholder="Nombre de la empresa..." 
                className={`flex-1 font-bold animate-in fade-in slide-in-from-left-2 ${showValidation && (data.activity.location === ' ') ? 'border-syz-red ring-2 ring-red-100' : ''}`}
                value={data.activity.location === " " ? "" : data.activity.location}
                onChange={e => handleChange('location', e.target.value)}
              />
            )}
          </div>
        </div>

        <div className={`flex flex-col space-y-1 transition-all ${isOtherActive ? 'col-span-1' : 'col-span-1 md:col-span-2'}`}>
          <label className="text-subtitle uppercase">Dirección <span className="text-syz-red">*</span></label>
          <input 
            type="text" 
            className={`${showValidation && !data.activity.address ? 'border-syz-red ring-2 ring-red-100' : ''}`}
            value={data.activity.address} 
            onChange={e => handleChange('address', e.target.value)} 
          />
        </div>
        
        <div className="flex flex-col space-y-1">
          <label className="text-subtitle uppercase">Fecha Inicio</label>
          <input type="datetime-local" value={data.activity.startDate} onChange={e => handleChange('startDate', e.target.value)} />
        </div>
        
        <div className="flex flex-col space-y-1">
          <label className="text-subtitle uppercase">Fecha Final</label>
          <input type="datetime-local" value={data.activity.endDate} onChange={e => handleChange('endDate', e.target.value)} />
        </div>
        
        <div className="flex flex-col space-y-1">
          <label className="text-subtitle uppercase">No. Trabajadores <span className="text-syz-red">*</span></label>
          <input 
            type="number" 
            min="1" 
            className={`${showValidation && data.activity.workerCount < 1 ? 'border-syz-red ring-2 ring-red-100' : ''}`}
            value={data.activity.workerCount} 
            onChange={e => handleChange('workerCount', parseInt(e.target.value) || 0)} 
          />
        </div>

        <InlineChoice 
          label="¿Permiso relacionado?" 
          value={data.activity.requiresPermit || 'No'} 
          isRequired
          placeholder="No."
          inputValue={data.activity.permitNo}
          error={showValidation && data.activity.requiresPermit === 'Sí' && !data.activity.permitNo}
          onInputChange={(val: string) => handleChange('permitNo', val)}
          onChange={(val: string) => update({ activity: { ...data.activity, requiresPermit: val, permitNo: val === 'No' ? '' : data.activity.permitNo } })}
        />

        <div className="flex flex-col space-y-1 col-span-1 md:col-span-1 lg:col-span-2">
          <label className="text-subtitle uppercase">Herramienta / Equipo</label>
          <input type="text" value={data.activity.tools} onChange={e => handleChange('tools', e.target.value)} placeholder="Ej: Multímetro, Escalera..." />
        </div>

        <div className="flex flex-col space-y-1 col-span-1 md:col-span-1 lg:col-span-2">
          <label className="text-subtitle uppercase">Trabajo a realizar <span className="text-syz-red">*</span></label>
          <textarea 
            rows={1} 
            className={`!h-[42px] !py-[10px] !px-3 resize-none ${showValidation && (!data.activity.taskDescription || data.activity.taskDescription.trim().length < 10) ? 'border-syz-red ring-2 ring-red-100' : ''}`}
            value={data.activity.taskDescription} 
            onChange={e => handleChange('taskDescription', e.target.value)} 
            placeholder="Describa la actividad técnica..." 
          />
        </div>
      </div>

      {showValidation && !isFormValid && (
        <div className="mt-8 p-5 bg-red-50 border-l-4 border-syz-red rounded-r-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-5 h-5 text-syz-red" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="font-black text-syz-red uppercase text-sm tracking-tight">Campos pendientes por completar</h3>
          </div>
          <ul className="space-y-1 pl-8">
            {missingFields.map((msg, i) => (
              <li key={i} className="text-syz-red font-bold text-[8.5pt] list-disc uppercase">{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
        <button 
          onClick={onJumpToSummary}
          className="flex items-center gap-2 bg-syz-jet text-white px-8 py-3 font-black uppercase rounded-lg hover:bg-black transition-all shadow-md text-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          Vista Previa Formato
        </button>

        <button 
          onClick={() => { 
            if (isFormValid) {
              setShowValidation(false);
              onNext(); 
            } else { 
              setShowValidation(true); 
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            } 
          }} 
          className={`px-12 py-3 font-black uppercase rounded-lg transition-all shadow-lg ${isFormValid ? 'bg-syz-red text-white hover:bg-red-700' : 'bg-slate-300 text-slate-600 cursor-pointer'}`}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
