import { useState } from 'react';
import { ImagePlus, Grid, X } from 'lucide-react';

export default function StepBasicInfo({ formData, setFormData, onNext }) {
  const [showIconModal, setShowIconModal] = useState(false);

  // Koleksi icon olahraga & kompetisi yang melimpah
  const iconCategories = {
    Sports: ['⚽', '🏀', '🏸', '🎮', '🏐', '🏈', '⚾', '🎾', '🏉', '🎱', '🏓', '🏒', '🥏', '🏹', '🛹', '🥊', '🥋', '🚴'],
    Trophies: ['🏆', '🥇', '🥈', '🥉', '🎖️', '🎗️', '👑', '⭐', '🔥', '✨']
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn relative">
      
      {/* 🔴 MODAL ICON SELECTOR POP-UP (PREMIUM UI) */}
      {showIconModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 rounded-2xl p-4 flex flex-col border border-gray-800 animate-fadeIn">
          <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
            <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <Grid size={14} className="text-neon-purple" /> Select Tournament Icon
            </span>
            <button 
              onClick={() => setShowIconModal(false)}
              className="text-gray-500 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
            {Object.keys(iconCategories).map((category) => (
              <div key={category} className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{category}</span>
                <div className="grid grid-cols-5 gap-2">
                  {iconCategories[category].map((icon) => (
                    <button
                      key={icon}
                      onClick={() => {
                        setFormData({ ...formData, icon });
                        setShowIconModal(false);
                      }}
                      className={`text-xl p-2.5 rounded-xl bg-[#1a1a1a] border transition active:scale-90 ${
                        formData.icon === icon ? 'border-neon-purple bg-neon-purple/10' : 'border-gray-800/80 hover:border-gray-700'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FIELD COMPONENT LOGO & PREVIEW */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Competition Logo</label>
        <div className="flex gap-4 items-center bg-card-bg border border-gray-800/80 p-3.5 rounded-2xl">
          <div className="w-14 h-14 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-center text-2xl shadow-inner">
            {formData.icon || '🏆'}
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-xs font-bold text-white">Choose Badge</p>
            <button
              onClick={() => setShowIconModal(true)}
              className="w-fit text-[10px] font-black text-neon-purple bg-neon-purple/10 border border-neon-purple/20 px-3 py-1.5 rounded-lg hover:bg-neon-purple/20 transition-all uppercase tracking-wider"
            >
              Browse Library
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Competition Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Summer League 2024"
          className="w-full bg-card-bg border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:border-neon-purple outline-none mt-1.5"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Sport Type</label>
        <select
          name="sportType"
          value={formData.sportType}
          onChange={handleChange}
          className="w-full bg-card-bg border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:border-neon-purple outline-none mt-1.5 cursor-pointer"
        >
          <option>Football</option>
          <option>Futsal</option>
          <option>Basketball</option>
          <option>Badminton</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          placeholder="Annual summer league for regional clubs..."
          className="w-full bg-card-bg border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:border-neon-purple resize-none mt-1.5 outline-none"
        />
      </div>

      <button
        onClick={onNext}
        disabled={!formData.name}
        className="w-full py-3.5 bg-neon-purple text-white text-xs font-black rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition disabled:opacity-30 mt-2 uppercase tracking-widest"
      >
        Next Step
      </button>
    </div>
  );
}