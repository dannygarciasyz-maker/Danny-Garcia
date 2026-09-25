
import React, { useRef, useState, useEffect } from 'react';
import { ATSData } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  data: ATSData;
  update: (d: Partial<ATSData>) => void;
  onPrev: () => void;
  onReset: () => void;
}

export default function StepSummary({ data, update, onPrev, onReset }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const hseCanvasRef = useRef<HTMLCanvasElement>(null);
  const supCanvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef(data);

  useEffect(() => { dataRef.current = data; }, [data]);

  const handleInfoChange = (field: keyof ATSData['signatures'], value: string) => {
    update({
      signatures: {
        ...data.signatures,
        [field]: value
      }
    });
  };

  const syncSignatures = () => {
    update({
      signatures: {
        ...dataRef.current.signatures,
        hse: hseCanvasRef.current?.toDataURL() || '',
        supervisor: supCanvasRef.current?.toDataURL() || ''
      }
    });
  };

  useEffect(() => {
    [hseCanvasRef, supCanvasRef].forEach((ref) => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      let drawing = false;
      const getPos = (e: any) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { 
          x: (clientX - rect.left) * (canvas.width / rect.width), 
          y: (clientY - rect.top) * (canvas.height / rect.height) 
        };
      };

      const start = (e: any) => { drawing = true; ctx.beginPath(); const pos = getPos(e); ctx.moveTo(pos.x, pos.y); if (e.cancelable) e.preventDefault(); };
      const move = (e: any) => { if (!drawing) return; const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); if (e.cancelable) e.preventDefault(); };
      const stop = () => { if (drawing) { drawing = false; syncSignatures(); } };

      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
      canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', stop);
      canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', move, { passive: false }); canvas.addEventListener('touchend', stop);
      return () => { canvas.removeEventListener('mousedown', start); canvas.removeEventListener('mousemove', move); window.removeEventListener('mouseup', stop); canvas.removeEventListener('touchstart', start); canvas.removeEventListener('touchmove', move); canvas.removeEventListener('touchend', stop); };
    });
  }, []);

  const generatePDF = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;

    setIsGeneratingPDF(true);
    try {
      // Clonar a contenedor fuera de pantalla con ancho fijo exacto de 780px
      // Esto previene que el viewport de la pantalla o los contenedores con overflow recorten el margen derecho
      const clone = element.cloneNode(true) as HTMLElement;
      clone.id = 'print-area-pdf-clone';
      clone.style.width = '780px';
      clone.style.minWidth = '780px';
      clone.style.maxWidth = '780px';
      clone.style.boxSizing = 'border-box';
      clone.style.margin = '0';
      clone.style.padding = '0';
      clone.style.border = 'none';
      clone.style.boxShadow = 'none';
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.zIndex = '-9999';
      clone.style.background = '#FFFFFF';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        width: 780,
        windowWidth: 1000
      });

      document.body.removeChild(clone);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
      
      // Márgenes laterales y verticales simétricos de 10mm
      const marginX = 10; // 10mm margen izquierdo y 10mm margen derecho
      const marginY = 10; // 10mm margen superior e inferior
      const printableWidth = pageWidth - (2 * marginX); // 190 mm exactos
      const printableHeight = pageHeight - (2 * marginY); // 277 mm exactos

      const pxPerMm = canvas.width / printableWidth;
      const pageHeightInPx = printableHeight * pxPerMm;
      const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightInPx));

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        const sourceY = page * pageHeightInPx;
        const sourceHeight = Math.min(pageHeightInPx, canvas.height - sourceY);
        const sliceHeightInMM = sourceHeight / pxPerMm;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL('image/png');
        pdf.addImage(pageImgData, 'PNG', marginX, marginY, printableWidth, sliceHeightInMM);
      }
      
      const orderNumber = data.activity.orderNo || 'BORRADOR';
      pdf.save(`ATS_SYZ_${orderNumber}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Hubo un inconveniente al generar el PDF. Use el botón blanco "Imprimir / Guardar PDF Perfecto" para un resultado garantizado.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const getMergedRisks = () => {
    const list: string[] = [];
    Object.entries(data.risks).forEach(([category, detail]) => {
      if (detail && detail !== "Aplica" && detail.trim() !== "") {
        list.push(`${category}: ${detail}`);
      } else {
        list.push(category);
      }
    });
    return list;
  };

  const getUniqueControls = () => {
    return [
      ...Object.keys(data.controls.epp),
      ...Object.keys(data.controls.other)
    ];
  };

  const FormalDocument = ({ id }: { id?: string }) => (
    <div className="w-full overflow-x-auto p-2 sm:p-6 bg-slate-100/70 rounded-2xl border border-slate-200 shadow-inner print:p-0 print:m-0 print:border-none print:shadow-none print:bg-white print:overflow-visible flex justify-center">
      <div 
        id={id || 'print-area'} 
        className="bg-white text-[8pt] mx-auto printable-document shadow-md print:shadow-none print:m-0 print:p-0 box-border"
        style={{ width: '780px', minWidth: '780px' }}
      >
        <table className="w-full border-collapse border-2 border-black table-fixed bg-white">
          <thead>
            <tr className="bg-white h-24">
              <th className="border-2 border-black p-4 w-[25%] text-center bg-white align-middle">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-syz-red font-black text-5xl tracking-tighter uppercase italic leading-none atsyz-brand">SYZ</div>
                  <div className="text-[7pt] font-bold text-black mt-2">www.grupo-syz.com</div>
                </div>
              </th>
              <th className="border-2 border-black p-2 w-[50%] text-center bg-syz-red align-middle">
                <div className="text-[18pt] font-black uppercase text-white leading-tight">
                  ANÁLISIS DE TRABAJO SEGURO (ATS)
                </div>
              </th>
              <th className="border-2 border-black p-0 w-[25%] text-[8pt] font-normal uppercase bg-white align-middle">
                <div className="border-b border-black p-3 text-center">VERSIÓN: <span className="font-bold">1 (2026)</span></div>
                <div className="p-3 text-center">No. ATS: <span className="font-bold">{data.activity.orderNo}</span></div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="avoid-page-break"><td colSpan={3} className="bg-slate-100 text-black text-center font-black p-2 border-y-2 border-black uppercase text-[9pt]">1. Información de la Actividad</td></tr>
            <tr className="avoid-page-break">
              <td colSpan={3} className="p-0">
                <div className="w-full uppercase text-[7.5pt]">
                  <div className="flex w-full border-b border-black">
                    <div className="border-r border-black p-2.5 font-normal flex flex-col justify-center overflow-hidden break-words" style={{ width: '35%' }}>
                      EMPRESA: <span className="font-bold">{data.activity.location}</span>
                    </div>
                    <div className="border-r border-black p-2.5 font-normal flex flex-col justify-center overflow-hidden break-words" style={{ width: '35%' }}>
                      DIRECCIÓN: <span className="font-bold">{data.activity.address}</span>
                    </div>
                    <div className="border-r border-black p-2.5 text-center font-normal flex flex-col justify-center overflow-hidden break-words" style={{ width: '15%' }}>
                      FECHA INICIO: <span className="font-bold">{formatDate(data.activity.startDate)}</span>
                    </div>
                    <div className="p-2.5 text-center font-normal flex flex-col justify-center overflow-hidden break-words" style={{ width: '15%' }}>
                      FECHA FINAL: <span className="font-bold">{formatDate(data.activity.endDate)}</span>
                    </div>
                  </div>
                  <div className="flex w-full">
                    <div className="border-r border-black p-2.5 font-normal flex flex-col justify-center overflow-hidden break-words" style={{ width: '35%' }}>
                      TRABAJO A REALIZAR: <span className="font-bold">{data.activity.taskDescription}</span>
                    </div>
                    <div className="border-r border-black p-2.5 font-normal flex flex-col justify-center overflow-hidden break-words" style={{ width: '35%' }}>
                      HERRAMIENTA / EQUIPO: <span className="font-bold">{data.activity.tools}</span>
                    </div>
                    <div className="p-2.5 font-normal flex flex-col justify-center overflow-hidden break-words" style={{ width: '30%' }}>
                      PERMISO DE TRABAJO RELACIONADO: <span className="font-bold">{data.activity.requiresPermit === 'Sí' ? `SÍ (${data.activity.permitNo || 'N/A'})` : 'NO'}</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <tr className="avoid-page-break"><td colSpan={3} className="bg-slate-100 text-black text-center font-black p-2 border-y-2 border-black uppercase text-[9pt]">2. Análisis de Peligros y Controles</td></tr>
            <tr className="avoid-page-break">
              <td colSpan={3} className="p-0">
                <div className="grid grid-cols-2 text-[8pt] uppercase">
                  <div className="border-r border-black p-4 bg-white min-h-[140px]">
                    <div className="font-black text-center mb-3 pb-1 text-black text-[9pt] border-b border-black">PELIGROS DETECTADOS</div>
                    <div className="space-y-1 font-bold pl-2">
                      {getMergedRisks().map((r, i) => <div key={i} className="flex gap-2"><span>•</span> <span>{r}</span></div>)}
                    </div>
                  </div>
                  <div className="p-4 bg-white min-h-[140px]">
                    <div className="font-black text-center mb-3 pb-1 text-black text-[9pt] border-b border-black">CONTROLES Y EPP</div>
                    <div className="space-y-1 font-bold pl-2">
                      {getUniqueControls().map((c, i) => <div key={i} className="flex gap-2"><span>•</span> <span>{c}</span></div>)}
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <tr className="avoid-page-break"><td colSpan={3} className="bg-slate-100 text-black text-center font-black p-2 border-y-2 border-black uppercase text-[9pt]">3. Desglose de Pasos</td></tr>
            <tr>
              <td colSpan={3} className="p-0">
                <table className="w-full border-collapse text-[7.5pt] uppercase table-fixed bg-white">
                  <thead className="bg-slate-50 font-black">
                    <tr>
                      <th className="border border-black p-2 w-[33%] text-center">PASO A PASO</th>
                      <th className="border border-black p-2 w-[33%] text-center">RIESGO</th>
                      <th className="border border-black p-2 w-[34%] text-center">CONTROL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.analysis.map((step, i) => (
                      <tr key={i} className="avoid-page-break h-12">
                        <td className="border border-black p-3 leading-snug font-bold align-middle text-center">{step.step}</td>
                        <td className="border border-black p-3 leading-snug font-bold align-middle text-center">{step.risk}</td>
                        <td className="border border-black p-3 leading-snug font-bold align-middle text-center">{step.control}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>

            <tr className="avoid-page-break"><td colSpan={3} className="bg-slate-100 text-black text-center font-black p-2 border-y-2 border-black uppercase text-[9pt]">4. Personal Ejecutante</td></tr>
            <tr>
              <td colSpan={3} className="p-0">
                <table className="w-full border-collapse text-[7.5pt] uppercase table-fixed bg-white">
                  <thead>
                    <tr className="font-black bg-slate-50">
                      <th className="border border-black p-2 w-[5%] text-center">#</th>
                      <th className="border border-black p-2 w-[35%] text-center">NOMBRE COMPLETO</th>
                      <th className="border border-black p-2 w-[20%] text-center">ID / CC</th>
                      <th className="border border-black p-2 w-[20%] text-center">ROL</th>
                      <th className="border border-black p-2 w-[20%] text-center">FIRMA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.team.map((w, i) => (
                      <tr key={i} className="h-16 avoid-page-break">
                        <td className="border border-black p-2 text-center font-bold align-middle bg-slate-50">{i + 1}</td>
                        <td className="border border-black px-3 py-2 font-bold align-middle text-center">{w.name}</td>
                        <td className="border border-black px-3 py-2 text-center font-bold align-middle">{w.id}</td>
                        <td className="border border-black px-3 py-2 text-center font-bold align-middle">{w.role}</td>
                        <td className="border border-black p-1 text-center align-middle h-16">
                          {w.signature && <img src={w.signature} className="max-h-14 mx-auto" alt="Firma" />}
                        </td>
                      </tr>
                    ))}
                    {data.team.length === 0 && (
                      <tr className="h-16 avoid-page-break">
                        <td className="border border-black text-center font-bold bg-slate-50">1</td>
                        <td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>

            <tr className="avoid-page-break"><td colSpan={3} className="bg-slate-100 text-black text-center font-black p-2 border-y-2 border-black uppercase text-[9pt]">5. Responsables / Firmas de Validación</td></tr>
            <tr className="avoid-page-break">
              <td colSpan={3} className="p-6">
                <div className="grid grid-cols-2 gap-12 uppercase bg-white">
                  <div className="flex flex-col items-center">
                    <div className="h-20 flex items-end justify-center mb-1 w-full">
                      {data.signatures.hse && <img src={data.signatures.hse} className="max-h-full" alt="Firma HSE" />}
                    </div>
                    <div className="w-full border-t-2 border-black pt-2 text-center">
                      <p className="font-bold text-[8.5pt] leading-tight flex justify-center items-center gap-2">
                        <span>{data.signatures.hseName || '__________________________'}</span>
                        <span className="text-[7.5pt]">CC: {data.signatures.hseId || '________________'}</span>
                      </p>
                      <p className="font-bold text-[7pt] text-slate-600 uppercase tracking-widest mt-1">SUPERVISOR HSE / SST</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-20 flex items-end justify-center mb-1 w-full">
                      {data.signatures.supervisor && <img src={data.signatures.supervisor} className="max-h-full" alt="Firma Responsable" />}
                    </div>
                    <div className="w-full border-t-2 border-black pt-2 text-center">
                      <p className="font-bold text-[8.5pt] leading-tight flex justify-center items-center gap-2">
                        <span>{data.signatures.supName || '__________________________'}</span>
                        <span className="text-[7.5pt]">CC: {data.signatures.supId || '________________'}</span>
                      </p>
                      <p className="font-bold text-[7pt] text-slate-600 uppercase tracking-widest mt-1">RESPONSABLE DE ÁREA</p>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-[7pt] mt-4 italic text-center font-bold text-slate-400">ESTE DOCUMENTO ES SOPORTE LEGAL DEL SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO.</p>
      </div>
      <style>{`
        @media print {
          .printable-document {
             width: 100% !important;
             max-width: 100% !important;
             min-width: 0 !important;
             margin: 0 auto !important;
             padding: 0 !important;
             border: none !important;
             box-shadow: none !important;
          }
          .avoid-page-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          table {
            page-break-inside: auto !important;
            border-collapse: collapse !important;
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
          }
          thead {
            display: table-header-group !important;
          }
          tbody {
            display: table-row-group !important;
          }
          td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );

  if (submitted) {
    return (
      <div className="text-center py-10 space-y-8">
        <div className="bg-syz-jet text-white p-8 border-b-4 border-syz-red rounded-2xl shadow-2xl">
          <h2 className="text-3xl font-black uppercase tracking-tighter">ATS GENERADO CORRECTAMENTE</h2>
          <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
             <button onClick={() => window.print()} className="bg-white text-syz-jet border-4 border-syz-jet px-8 py-5 font-black uppercase rounded-xl shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
               Imprimir / Guardar PDF Perfecto
             </button>
             <button 
                onClick={generatePDF} 
                disabled={isGeneratingPDF}
                className={`bg-syz-red text-white px-8 py-5 font-black uppercase rounded-xl shadow-xl hover:bg-red-800 transition-all flex items-center justify-center gap-3 ${isGeneratingPDF ? 'opacity-50' : ''}`}>
                {isGeneratingPDF ? 'Procesando...' : 'Descargar PDF Rápido'}
             </button>
          </div>
          <div className="mt-6 bg-slate-800/50 p-4 rounded-xl inline-block border border-slate-700">
            <p className="text-[9pt] text-slate-300 font-bold">
              <span className="text-syz-red">CONSEJO PROFESIONAL:</span> Para evitar que las celdas se corten en documentos de varias páginas,<br/>use el botón blanco <span className="text-white">"Imprimir / Guardar PDF Perfecto"</span> y elija la opción "Guardar como PDF" en su navegador.
            </p>
          </div>
        </div>
        <FormalDocument id="print-area" />
        <div className="pt-10">
          <button onClick={onReset} className="text-slate-400 font-bold uppercase hover:text-syz-red transition-colors">Nuevo Registro</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="border-b pb-4">
        <h2 className="text-3xl font-black text-syz-red uppercase">Validación de Autoridades</h2>
        <p className="text-slate-500 font-bold italic">Diligencie sus datos y realice la firma digital para cerrar el formato.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-syz-jet border-b-2 border-syz-red pb-2 mb-4">Supervisor HSE</h3>
          <div className="space-y-3">
            <input type="text" placeholder="Nombre Completo" className="w-full font-bold !bg-white" value={data.signatures.hseName} onChange={e => handleInfoChange('hseName', e.target.value)} />
            <input type="text" placeholder="Cédula / ID" className="w-full font-bold !bg-white" value={data.signatures.hseId} onChange={e => handleInfoChange('hseId', e.target.value)} />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 mt-4">Firma Digital:</p>
          <div className="bg-white border-2 border-slate-200 h-40 rounded-2xl relative overflow-hidden shadow-inner">
            <canvas ref={hseCanvasRef} width={600} height={300} className="w-full h-full cursor-crosshair touch-none" />
          </div>
          <button onClick={() => hseCanvasRef.current?.getContext('2d')?.clearRect(0,0,600,300)} className="text-[8pt] font-black uppercase text-syz-red hover:underline">Limpiar Firma</button>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-syz-jet border-b-2 border-syz-onyx pb-2 mb-4">Responsable de ÁREA</h3>
          <div className="space-y-3">
            <input type="text" placeholder="Nombre Completo" className="w-full font-bold !bg-white" value={data.signatures.supName} onChange={e => handleInfoChange('supName', e.target.value)} />
            <input type="text" placeholder="Cédula / ID" className="w-full font-bold !bg-white" value={data.signatures.supId} onChange={e => handleInfoChange('supId', e.target.value)} />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 mt-4">Firma Digital:</p>
          <div className="bg-white border-2 border-slate-200 h-40 rounded-2xl relative overflow-hidden shadow-inner">
            <canvas ref={supCanvasRef} width={600} height={300} className="w-full h-full cursor-crosshair touch-none" />
          </div>
          <button onClick={() => supCanvasRef.current?.getContext('2d')?.clearRect(0,0,600,300)} className="text-[8pt] font-black uppercase text-syz-red hover:underline">Limpiar Firma</button>
        </div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t-4 border-slate-50">
        <button onClick={onPrev} className="text-slate-500 font-black uppercase text-xs px-10 py-5 hover:bg-slate-100 rounded-2xl transition-all">Anterior</button>
        <button 
          onClick={() => {
            setIsSubmitting(true);
            setTimeout(() => {
              setSubmitted(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 1000);
          }}
          className="bg-syz-red text-white px-16 py-5 rounded-2xl font-black text-xl shadow-2xl uppercase tracking-widest hover:bg-red-800 transition-all">
          {isSubmitting ? 'Finalizando...' : 'Generar PDF Final'}
        </button>
      </div>
    </div>
  );
}
