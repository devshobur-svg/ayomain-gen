import { useState } from 'react';
import StepBasicInfo from '../components/create/StepBasicInfo';
import StepFormatRules from '../components/create/StepFormatRules';
import StepTeamsGenerate from '../components/create/StepTeamsGenerate';

export default function CreateCompetition() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    sportType: 'Football',
    description: '',
    icon: '⚽', // Default selection icon awal
    format: 'league',
    rules: {
      duration: 90,
      pointsWin: 3,
      extraTime: false
    }
  });

  return (
    <div className="p-4 pb-28 min-h-screen bg-[#121212]">
      <h1 className="text-xl font-black text-white mb-1">Create Competition</h1>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">Setup your tournament in 3 simple steps</p>

      {/* PROGRESS BAR HEADER INDICATOR */}
      <div className="flex items-center justify-between mb-8 px-6 relative">
        <div className="absolute top-1/2 left-6 right-6 h-[1px] bg-gray-800 -translate-y-1/2 z-0" />
        <div className="absolute top-1/2 left-6 h-[1px] bg-neon-purple -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }} />

        {[1, 2, 3].map(num => (
          <div 
            key={num} 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black z-10 border-2 transition-all duration-300 ${
              step >= num 
                ? 'bg-neon-purple border-neon-purple text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                : 'bg-[#121212] border-gray-800 text-gray-500'
            }`}
          >
            {num}
          </div>
        ))}
      </div>

      {/* CORE STEP CONTENT ROUTER */}
      <div className="mt-4">
        {step === 1 && (
          <StepBasicInfo 
            formData={formData} 
            setFormData={setFormData} 
            onNext={() => setStep(2)} 
          />
        )}
        {step === 2 && (
          <StepFormatRules 
            formData={formData} 
            setFormData={setFormData} 
            onNext={() => setStep(3)} 
            onPrev={() => setStep(1)} 
          />
        )}
        {step === 3 && (
          <StepTeamsGenerate 
            formData={formData} 
            onPrev={() => setStep(2)} 
            onGenerateSuccess={() => setStep(1)} 
          />
        )}
      </div>
    </div>
  );
}