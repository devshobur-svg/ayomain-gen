import { useState, useEffect } from 'react';
import { db } from '@/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { Trophy, Calendar, BarChart3, Activity, ShieldAlert, LogIn } from 'lucide-react';
// 🔥 SINKRONISASI ARSITEKTUR: Arahkan nama import langsung ke file PublicStandings yang berisi update zona dinamis!
import PublicStandings from './PublicStandings';

export default function PublicViewer({ compId, onBackToAdmin }) {
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publicTab, setPublicTab] = useState('fixtures'); // fixtures atau standings

  useEffect(() => {
    if (!compId) return;
    setLoading(true);

    // 🛰️ DIRECT SINGLE FETCH: Ambil info liga secara publik berdasarkan ID unik URL (Aman & Bebas Logout)
    const compDocRef = doc(db, 'competitions', compId);
    const unsubscribe = onSnapshot(compDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setCompetition({ id: docSnap.id, ...docSnap.data() });
      } else {
        setCompetition(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Public fetch error: ", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [compId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-[#0c0c0e] min-h-screen text-xs text-gray-500 gap-3">
        <div className="relative p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-full animate-bounce">
          <Activity className="text-neon-purple animate-pulse" size={24} />
        </div>
        <span className="font-bold uppercase tracking-widest text-[9px] text-gray-400">Loading Tournament Arena...</span>
      </div>
    );
  }

  // Jika ID kompetisi ngawur atau sudah dihapus admin
  if (!competition) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex flex-col items-center justify-center p-6 text-center gap-4">
        <ShieldAlert size={40} className="text-red-500 animate-pulse" />
        <h2 className="text-sm font-black text-white uppercase tracking-wider">Tournament Identity Not Found</h2>
        <p className="text-xs text-gray-500 max-w-xs leading-relaxed">Link liga tidak valid atau telah dihapus oleh pihak manajemen operator arena, Coach.</p>
        <button onClick={onBackToAdmin} className="mt-2 px-4 py-2.5 bg-zinc-900 border border-gray-800 text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center gap-2 active:scale-95 transition-all">
          <LogIn size={13} /> Go To Admin Gate
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-12 min-h-screen bg-gradient-to-b from-[#0f0f12] via-[#121216] to-[#0a0a0c] text-white animate-fadeIn">
      
      {/* 👁️ HEADER BANNER PUBLIC VIEW MODE */}
      <div className="flex justify-between items-center mb-5 bg-[#1b1b22] border border-gray-800/80 px-4 py-2.5 rounded-2xl shadow-inner">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-volt animate-pulse" />
          <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase">Public View Mode</span>
        </div>
        <button 
          onClick={onBackToAdmin} 
          className="text-[9px] font-black bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 text-neon-purple px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors"
        >
          Portal Admin
        </button>
      </div>

      {/* 🏆 LEAGUE IDENTIFIER HERO CARD */}
      <div className="bg-gradient-to-br from-[#1b1233]/40 via-card-bg to-[#121216] border border-neon-purple/20 rounded-2xl p-4.5 mb-5 relative overflow-hidden shadow-xl">
        <div className="flex items-start gap-3.5 relative z-10">
          <span className="text-2xl bg-black/50 w-11 h-11 rounded-xl flex items-center justify-center border border-gray-800/80 shadow-md">
            {competition.icon || '🏆'}
          </span>
          <div className="flex-1 truncate">
            <span className="text-[8px] font-black uppercase tracking-widest bg-neon-purple/20 text-neon-purple border border-neon-purple/40 px-2 py-0.5 rounded-md inline-block">
              {competition.sportType || 'Soccer Arena'}
            </span>
            <h2 className="text-base font-black text-white mt-1.5 leading-tight uppercase truncate">{competition.name}</h2>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5 capitalize truncate">{competition.description || 'Kompetisi resmi berjalan.'}</p>
          </div>
        </div>
      </div>

      {/* 🎛️ PUBLIC MAIN TAB CONTROLLER */}
      <div className="grid grid-cols-2 bg-[#18181f]/90 border border-gray-800/80 p-1 rounded-xl shadow-inner mb-5">
        <button
          onClick={() => setPublicTab('fixtures')}
          className={`py-2.5 text-[11px] font-black rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            publicTab === 'fixtures'
              ? 'bg-gradient-to-r from-neon-purple to-indigo-600 text-white shadow-md border border-neon-purple/20'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Calendar size={13} /> Match Fixtures
        </button>
        <button
          onClick={() => setPublicTab('standings')}
          className={`py-2.5 text-[11px] font-black rounded-lg uppercase tracking-wider flex items-center center gap-1.5 transition-all ${
            publicTab === 'standings'
              ? 'bg-gradient-to-r from-neon-purple to-indigo-600 text-white shadow-md border border-neon-purple/20'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <BarChart3 size={13} /> League Table
        </button>
      </div>

      {/* 🚀 CORE RENDERING SINKRON JADWAL & KLASEMEN KHUSUS PENONTON */}
      <div className="animate-fadeIn">
        <PublicStandings compId={competition.id} currentMode={publicTab} />
      </div>

    </div>
  );
}