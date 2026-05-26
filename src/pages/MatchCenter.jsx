import { useState, useEffect } from 'react';
import FixturesTab from '../components/matches/FixturesTab';
import StandingsTab from '../components/matches/StandingsTab';
import { Calendar, Trophy, Shield, Activity } from 'lucide-react';

export default function MatchCenter() {
  // Sub-tab active state: 'fixtures' atau 'standings'
  const [activeSubTab, setActiveSubTab] = useState('fixtures');

  // 🛰️ DEEP ANALYSIS ROUTING INTEGRATION:
  // Mendengarkan sinyal CustomEvent 'switchToStandings' yang dikirim dari Dashboard
  useEffect(() => {
    const handleSwitchToStandings = () => {
      setActiveSubTab('standings'); // Otomatis geser fokus visual ke Klasemen
    };

    window.addEventListener('switchToStandings', handleSwitchToStandings);
    
    // Cleanup event listener pas komponen di-unmount biar gak memory leak
    return () => {
      window.removeEventListener('switchToStandings', handleSwitchToStandings);
    };
  }, []);

  return (
    <div className="p-4 pb-32 min-h-screen bg-gradient-to-b from-[#0f0f12] via-[#121216] to-[#0a0a0c] text-white animate-fadeIn">
      
      {/* 🟢 TOP BAR HEADER STATUS */}
      <div className="flex justify-between items-center mb-5 border-b border-gray-900/60 pb-4">
        <div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse" />
            <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase">Live Match Hub</span>
          </div>
          <h1 className="text-lg font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mt-1">
            Match Center
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-[#1b1b22] border border-gray-800 px-3 py-1.5 rounded-full shadow-inner">
          <Activity size={12} className="text-neon-volt animate-pulse" />
          <span className="text-[10px] font-black tracking-wide text-gray-400 uppercase">Realtime Sync</span>
        </div>
      </div>

      {/* 🟢 PREMIUM DOUBLE PILL SUB-TAB SELECTOR */}
      <div className="grid grid-cols-2 bg-[#18181f]/90 border border-gray-800/80 p-1.5 rounded-2xl mb-5 shadow-lg relative overflow-hidden">
        {/* Glow Line Indicator Background Effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-purple/20 to-transparent" />
        
        {/* Tab 1: Fixtures (Jadwal) */}
        <button
          onClick={() => setActiveSubTab('fixtures')}
          className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
            activeSubTab === 'fixtures'
              ? 'bg-gradient-to-r from-neon-purple to-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-neon-purple/30 scale-[1.01]'
              : 'text-gray-500 hover:text-gray-300 bg-transparent'
          }`}
        >
          <Calendar size={14} className={activeSubTab === 'fixtures' ? 'text-white' : 'text-gray-500'} />
          Fixtures
        </button>

        {/* Tab 2: Standings (Klasemen) */}
        <button
          onClick={() => setActiveSubTab('standings')}
          className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
            activeSubTab === 'standings'
              ? 'bg-gradient-to-r from-neon-purple to-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-neon-purple/30 scale-[1.01]'
              : 'text-gray-500 hover:text-gray-300 bg-transparent'
          }`}
        >
          <Trophy size={14} className={activeSubTab === 'standings' ? 'text-white' : 'text-gray-500'} />
          Standings
        </button>
      </div>

      {/* 🟢 LIVE CONTENT ROUTER PANEL */}
      <div className="relative z-10 transition-all duration-300">
        {activeSubTab === 'fixtures' ? (
          <FixturesTab />
        ) : (
          <StandingsTab />
        )}
      </div>

    </div>
  );
}