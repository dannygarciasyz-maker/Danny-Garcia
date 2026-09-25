
import React, { useState, useEffect } from 'react';
import { ATSData, Step } from './types';
import Header from './components/Header';
import Stepper from './components/Stepper';
import StepContext from './components/StepContext';
import StepVision from './components/StepVision';
import StepRisks from './components/StepRisks';
import StepHealth from './components/StepHealth';
import StepControls from './components/StepControls';
import StepAnalysis from './components/StepAnalysis';
import StepVerification from './components/StepVerification';
import StepTeam from './components/StepTeam';
import StepSummary from './components/StepSummary';

const INITIAL_STATE: ATSData = {
  activity: {
    creationDate: new Date().toISOString(),
    startDate: '',
    endDate: '',
    orderNo: '',
    company: 'SYZ Colombia',
    location: '',
    address: '',
    workerCount: 0,
    tools: '',
    taskDescription: '',
    serviceCallNo: '',
    hasCaseAssociated: 'No',
    heightDepth: 'N/A',
    atsLinkRef: '',
    requiresPermit: 'No',
    permitNo: '',
    hasWorkPlan: false,
  },
  risks: {},
  health: {
    rested: false,
    medicated: false,
    emotionalState: false,
    prepared: false,
    optimalCondition: false,
  },
  verification: {},
  controls: {
    epp: {},
    other: {},
  },
  analysis: [],
  photos: [],
  aiRecommendations: [],
  team: [],
  signatures: {
    hse: '',
    hseName: '',
    hseId: '',
    supervisor: '',
    supName: '',
    supId: '',
  },
};

const STEPS: { label: string; key: Step }[] = [
  { label: 'Actividad', key: 'CONTEXT' },
  { label: 'Visión IA', key: 'VISION' },
  { label: 'Riesgos', key: 'RISKS' },
  { label: 'Salud', key: 'HEALTH' },
  { label: 'Controles', key: 'CONTROLS' },
  { label: 'Desglose', key: 'ANALYSIS' },
  { label: 'Verificación', key: 'VERIFICATION' },
  { label: 'Equipo', key: 'TEAM' },
  { label: 'Finalizar', key: 'SUMMARY' },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>('CONTEXT');
  const [data, setData] = useState<ATSData>(INITIAL_STATE);
  const [view, setView] = useState<'FORM' | 'ADMIN'>('FORM');
  const [savedRecords, setSavedRecords] = useState<any[]>([]);
  const [isPrefilled, setIsPrefilled] = useState(false);

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem('atsyz_records') || '[]');
    if (records.length > 0) {
      const last = records[records.length - 1];
      setData({
        ...last,
        activity: {
          ...last.activity,
          creationDate: new Date().toISOString(),
          orderNo: `${Math.floor(100000 + Math.random() * 900000)}`,
          startDate: '',
          endDate: '',
        },
        signatures: { ...INITIAL_STATE.signatures },
        team: last.team?.map((w: any) => ({ ...w, signature: '' })) || [],
        photos: [],
        aiRecommendations: last.aiRecommendations.map((r: any) => ({ ...r, acknowledged: false })),
        analysis: last.analysis.map((s: any) => ({ ...s, acknowledged: false }))
      });
      setIsPrefilled(true);
    } else {
      setData(prev => ({
        ...prev,
        activity: { ...prev.activity, orderNo: `${Math.floor(100000 + Math.random() * 900000)}` }
      }));
    }
  }, []);

  useEffect(() => {
    if (view === 'ADMIN') {
      const records = JSON.parse(localStorage.getItem('atsyz_records') || '[]');
      setSavedRecords(records);
    }
  }, [view]);

  const resetForm = () => {
    const records = JSON.parse(localStorage.getItem('atsyz_records') || '[]');
    if (records.length > 0) {
      const last = records[records.length - 1];
      setData({
        ...last,
        activity: {
          ...last.activity,
          creationDate: new Date().toISOString(),
          orderNo: `${Math.floor(100000 + Math.random() * 900000)}`,
          startDate: '',
          endDate: '',
        },
        signatures: { ...INITIAL_STATE.signatures },
        team: last.team?.map((w: any) => ({ ...w, signature: '' })) || [],
        photos: [],
        aiRecommendations: last.aiRecommendations.map((r: any) => ({ ...r, acknowledged: false })),
        analysis: last.analysis.map((s: any) => ({ ...s, acknowledged: false }))
      });
      setIsPrefilled(true);
    } else {
      setData({
        ...INITIAL_STATE,
        activity: { ...INITIAL_STATE.activity, orderNo: `${Math.floor(100000 + Math.random() * 900000)}` }
      });
      setIsPrefilled(false);
    }
    setCurrentStep('CONTEXT');
    setView('FORM');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prev = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1].key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (stepKey: Step) => {
    setCurrentStep(stepKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateData = (newData: Partial<ATSData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'CONTEXT': return <StepContext data={data} update={updateData} onNext={next} onJumpToSummary={() => setCurrentStep('SUMMARY')} isPrefilled={isPrefilled} />;
      case 'VISION': return <StepVision data={data} update={updateData} onNext={next} onPrev={prev} />;
      case 'RISKS': return <StepRisks data={data} update={updateData} onNext={next} onPrev={prev} />;
      case 'HEALTH': return <StepHealth data={data} update={updateData} onNext={next} onPrev={prev} />;
      case 'CONTROLS': return <StepControls data={data} update={updateData} onNext={next} onPrev={prev} />;
      case 'ANALYSIS': return <StepAnalysis data={data} update={updateData} onNext={next} onPrev={prev} />;
      case 'VERIFICATION': return <StepVerification data={data} update={updateData} onNext={next} onPrev={prev} />;
      case 'TEAM': return <StepTeam data={data} update={updateData} onNext={next} onPrev={prev} />;
      case 'SUMMARY': return <StepSummary data={data} update={updateData} onPrev={prev} onReset={resetForm} />;
      default: return null;
    }
  };

  const AdminView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-syz-jet uppercase">Panel de Administración</h2>
        <button onClick={() => setView('FORM')} className="bg-syz-red text-white px-6 py-2 rounded font-bold uppercase text-xs">Volver al Formulario</button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {savedRecords.length === 0 ? (
          <p className="text-center py-20 text-slate-400 font-bold uppercase">No hay registros guardados.</p>
        ) : (
          savedRecords.map((rec, i) => (
            <div key={i} className="bg-slate-50 p-6 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black text-syz-red">No. ATS: {rec.activity.orderNo}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase">{rec.activity.company}</p>
                </div>
                <span className="text-[10px] bg-syz-jet text-white px-3 py-1 rounded-full">{new Date(rec.id.split('-')[1] * 1).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[9pt]">
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[7pt]">Tarea</p>
                  <p className="text-slate-800 line-clamp-2">{rec.activity.taskDescription}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[7pt]">Ubicación</p>
                  <p className="text-slate-800">{rec.activity.location}</p>
                </div>
                <div className="flex items-center gap-2">
                   {rec.signatures?.hse && <div className="bg-white p-1 border rounded"><img src={rec.signatures.hse} className="h-10" alt="Firma" /></div>}
                   {rec.signatures?.supervisor && <div className="bg-white p-1 border rounded"><img src={rec.signatures.supervisor} className="h-10" alt="Firma" /></div>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="max-w-6xl w-full mx-auto px-4 py-8 flex-grow">
        {view === 'FORM' ? (
          <>
            <Stepper currentStep={currentStep} steps={STEPS} onStepClick={handleStepClick} />
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 mt-8 border border-slate-200">
              {renderStep()}
            </div>
          </>
        ) : (
          <AdminView />
        )}
      </div>
      <footer className="py-6 text-center text-slate-400 text-sm border-t bg-white flex flex-col items-center gap-3">
        <p>© 2024 ATSYZ - SYZ Colombia | Sistema de Gestión HSE Inteligente</p>
        <button onClick={() => setView(view === 'FORM' ? 'ADMIN' : 'FORM')} className="text-[10px] font-black uppercase text-slate-300 hover:text-syz-red transition-colors">
          {view === 'FORM' ? 'Acceso Administrador' : 'Salir del Panel'}
        </button>
      </footer>
    </div>
  );
}
