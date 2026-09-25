
import React from 'react';
import { Step } from '../types';

interface StepperProps {
  currentStep: Step;
  steps: { label: string; key: Step }[];
  onStepClick: (key: Step) => void;
}

export default function Stepper({ currentStep, steps, onStepClick }: StepperProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto overflow-x-auto pb-4 px-2 no-scrollbar">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isFuture = index > currentIndex;
        
        return (
          <div key={step.key} className="flex flex-col items-center flex-1 min-w-[80px] relative">
            <button
              onClick={() => !isFuture && onStepClick(step.key)}
              disabled={isFuture}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 z-10 outline-none
                ${isActive ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200' : 
                  isCompleted ? 'bg-slate-800 border-slate-800 text-white hover:bg-syz-red hover:border-syz-red cursor-pointer' : 
                  'bg-white border-slate-200 text-slate-400 cursor-not-allowed'}
                ${!isFuture && !isActive ? 'hover:scale-110 active:scale-90' : ''}`}
            >
              {isCompleted ? '✓' : index + 1}
            </button>
            <span 
              onClick={() => !isFuture && onStepClick(step.key)}
              className={`text-[10px] mt-2 font-black uppercase tracking-tighter select-none transition-colors
                ${isActive ? 'text-orange-600' : isCompleted ? 'text-slate-700 cursor-pointer hover:text-syz-red' : 'text-slate-400'}`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`absolute top-5 h-[2px] transition-all duration-500 -z-0
                ${isCompleted ? 'bg-slate-800' : 'bg-slate-200'}`}
                style={{ 
                  left: `50%`,
                  width: `100%` 
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
