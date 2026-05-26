import { Layers, Award, GitBranch, Clock, Target, ShieldCheck } from 'lucide-react';

export default function StepFormatRules({ formData, setFormData, onNext, onPrev }) {
  // 🔥 FIXED MAPPING VALUE: Ubah id 'knockout' menjadi 'cup' agar sinkron dengan Knockout Engine di Step 3
  const formats = [
    { id: 'league', label: 'League', icon: Layers, desc: 'Round Robin' },
    { id: 'cup', label: 'Knockout', icon: Award, desc: 'Single Elimination' },
    { id: 'group_stage', label: 'Group Stage', icon: GitBranch, desc: 'Groups + Playoff' },
  ];

  const handleRuleChange = (field, value) => {
    setFormData({
      ...formData,
      rules: { ...formData.rules, [field]: value }
    });
  };

  // 🔥 CUSTOM CLICK INTERCEPTOR: Otomatis menghidupkan extra time jika memilih format Cup Knockout
  const handleFormatSelect = (formatId) => {
    if (formatId === 'cup') {
      setFormData({
        ...formData,
        format: formatId,
        rules: { ...formData.rules, extraTime: true } // Otomatis ON jika piala
      });
    } else {
      setFormData({
        ...formData,
        format: formatId
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      {/* FORMAT SELECTION */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Tournament Format</label>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {formats.map((f) => {
            const Icon = f.icon;
            const isSelected = formData.format === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFormatSelect(f.id)}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                  isSelected ? 'bg-neon-purple/10 border-neon-purple text-neon-purple' : 'bg-card-bg border-gray-800 text-gray-500'
                }`}
              >
                <Icon size={16} />
                <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* EDITABLE RULES CONTAINER */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Configure Rules</label>
        
        <div className="bg-card-bg border border-gray-800 rounded-xl p-4 flex flex-col gap-4 mt-1.5 shadow-inner">
          {/* Rule Item 1: Match Duration */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <Clock size={14} className="text-gray-500" />
              <span className="text-xs font-bold text-white">Match Duration (Mins)</span>
            </div>
            <input 
              type="number"
              value={formData.rules.duration}
              onChange={(e) => handleRuleChange('duration', parseInt(e.target.value) || 0)}
              className="w-16 bg-black/40 border border-gray-800 rounded-lg py-1 px-2 text-xs text-center text-neon-purple font-black focus:border-neon-purple outline-none"
            />
          </div>

          {/* Rule Item 2: Points (Hanya muncul jika format Liga) */}
          {formData.format === 'league' && (
            <div className="flex justify-between items-center border-t border-gray-800/50 pt-3">
              <div className="flex items-center gap-2.5">
                <Target size={14} className="text-gray-500" />
                <span className="text-xs font-bold text-white">Points per Win</span>
              </div>
              <select 
                value={formData.rules.pointsWin}
                onChange={(e) => handleRuleChange('pointsWin', parseInt(e.target.value))}
                className="bg-black/40 border border-gray-800 rounded-lg py-1 px-2 text-xs text-neon-purple font-black outline-none cursor-pointer"
              >
                <option value={3}>3 Points</option>
                <option value={2}>2 Points</option>
              </select>
            </div>
          )}

          {/* Rule Item 3: Extra Time Toggle */}
          <div className="flex justify-between items-center border-t border-gray-800/50 pt-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={14} className="text-gray-500" />
              <span className="text-xs font-bold text-white">Extra Time (KO Stage)</span>
            </div>
            <button 
              type="button"
              onClick={() => handleRuleChange('extraTime', !formData.rules.extraTime)}
              className={`w-9 h-5 rounded-full relative transition-colors ${formData.rules.extraTime ? 'bg-neon-purple' : 'bg-gray-800'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.rules.extraTime ? 'left-5' : 'left-1'}`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION ACTION BAR */}
      <div className="grid grid-cols-3 gap-2.5 mt-4">
        <button type="button" onClick={onPrev} className="py-3.5 bg-card-bg border border-gray-800 text-white text-xs font-bold rounded-xl uppercase tracking-wider">Back</button>
        <button type="button" onClick={onNext} className="col-span-2 py-3.5 bg-neon-purple text-white text-xs font-black rounded-xl shadow-lg uppercase tracking-wider">Next Step</button>
      </div>
    </div>
  );
}