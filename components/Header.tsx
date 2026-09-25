
import React from 'react';

export default function Header() {
  return (
    <nav className="bg-syz-jet text-syz-white py-1.5 px-6 flex flex-col md:flex-row items-center justify-between sticky top-0 z-50 shadow-xl border-b-2 border-syz-red overflow-hidden">
      <div className="flex items-center space-x-4">
        <div className="flex flex-col border-l-2 border-syz-red pl-3">
          <div className="flex items-baseline gap-1">
            <span className="text-white font-black text-lg md:text-xl tracking-tighter uppercase italic">AT</span>
            <span className="text-syz-red font-black text-lg md:text-xl tracking-tighter uppercase italic atsyz-brand">SYZ</span>
          </div>
          <p className="text-[5.5pt] uppercase font-bold tracking-[0.1em] text-syz-gray-x11 mt-0.5 leading-none italic">
            Gestión HSE Inteligente
          </p>
        </div>
      </div>
      
      <div className="hidden lg:block">
        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-syz-red to-transparent opacity-30 rounded-full"></div>
      </div>
    </nav>
  );
}
