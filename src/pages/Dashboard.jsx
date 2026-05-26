import { useState, useEffect } from 'react';
import { db, auth } from '@/firebaseConfig'; // 👈 Mengamankan auth instance terpusat
import { collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, getDocs, query, where } from 'firebase/firestore'; // 👈 Inject query & where untuk isolasi data
import { 
  Trophy, Calendar, Users, Settings, PlusCircle, 
  Trash2, Edit3, X, Save, RefreshCw, Grid, Shield, Activity, ArrowRight, BarChart3
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  // Database States
  const [stats, setStats] = useState({ matches: 0, leagues: 0, teams: 0 });
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal 1: League Manager States
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [editingCompId, setEditingCompId] = useState(null);
  const [editCompName, setEditCompName] = useState('');
  const [editCompIcon, setEditCompIcon] = useState('');

  // Modal 2: Team Roster Manager States
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedComp, setSelectedComp] = useState(null);
  const [compTeams, setCompTeams] = useState([]);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamIcon, setEditTeamIcon] = useState('');

  // Shared Global Icon Picker State
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);

  const iconLibrary = ['⚽', '🛡️', '🏆', '🦁', '🦅', '🦈', '🔥', '⚡', '⭐', '🔴', '🔵', '🟢', '🟡'];

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // 🛰️ DYNAMIC SECURE QUERY: Hanya melacak kompetisi privat milik user yang aktif login
    const compsRef = collection(db, 'competitions');
    const userScopedQuery = query(compsRef, where('userId', '==', currentUser.uid)); // 👈 Kunci isolasi fresh dashboard
    
    const unsubscribe = onSnapshot(userScopedQuery, (snapshot) => {
      const compsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompetitions(compsList);

      let totalTeams = 0;
      compsList.forEach(comp => {
        totalTeams += comp.teamCount || 0;
      });

      setStats({
        leagues: compsList.length,
        matches: compsList.length * 6, 
        teams: totalTeams
      });
      setLoading(false);
    }, (err) => {
      console.error("Firebase Security Error Read Dashboard: ", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectLeagueTeams = (comp) => {
    setSelectedComp(comp);
    const teamsRef = collection(db, 'competitions', comp.id, 'teams');
    onSnapshot(teamsRef, (snapshot) => {
      const teamsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompTeams(teamsList);
    });
  };

  const handleUpdateLeague = async (compId) => {
    if (!editCompName.trim()) return alert("Nama kompetisi gak boleh kosong, Coach!");
    try {
      await updateDoc(doc(db, 'competitions', compId), {
        name: editCompName.trim(),
        icon: editCompIcon
      });
      setEditingCompId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLeague = async (compId) => {
    if (!confirm("⚠️ Hapus kompetisi ini beserta seluruh jadwal & klasemen di dalamnya secara permanen?")) return;
    try {
      const batch = writeBatch(db);
      const mSnap = await getDocs(collection(db, 'competitions', compId, 'matches'));
      mSnap.forEach(d => batch.delete(d.ref));
      const tSnap = await getDocs(collection(db, 'competitions', compId, 'teams'));
      tSnap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'competitions', compId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTeam = async (teamId) => {
    if (!editTeamName.trim()) return alert("Nama tim gak boleh kosong, bro!");
    try {
      await updateDoc(doc(db, 'competitions', selectedComp.id, 'teams', teamId), {
        name: editTeamName.trim(),
        icon: editTeamIcon
      });
      setEditingTeamId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm("Hapus tim ini dari keanggotaan liga?")) return;
    try {
      await deleteDoc(doc(db, 'competitions', selectedComp.id, 'teams', teamId));
      await updateDoc(doc(db, 'competitions', selectedComp.id), {
        teamCount: Math.max(0, (compTeams.length - 1))
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRouteToStandings = () => {
    setActiveTab('match-center');
    setTimeout(() => {
      const event = new CustomEvent('switchToStandings');
      window.dispatchEvent(event);
    }, 50);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-[#0c0c0e] min-h-screen text-xs text-gray-500 gap-3">
        <div className="relative p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-full animate-bounce">
          <Activity className="text-neon-purple animate-pulse" size={24} />
        </div>
        <span className="font-bold uppercase tracking-widest text-[9px] text-gray-400">Syncing Live Statistics Graph...</span>
      </div>
    );
  }

  return (
    <div className="p-4 pb-32 min-h-screen bg-gradient-to-b from-[#0f0f12] via-[#121216] to-[#0a0a0c] text-white animate-fadeIn relative">
      
      {/* PREMIUM BRANDING HEADER */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-900/60 pb-4">
        <div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-volt animate-ping" />
            <span className="text-[9px] font-black tracking-widest bg-neon-purple/20 text-neon-purple border border-neon-purple/40 px-2 py-0.5 rounded-md uppercase">Core Engine Live</span>
          </div>
          <h1 className="text-lg font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mt-1">AYO MAIN BOLA</h1>
        </div>
        <div className="flex items-center gap-2 bg-[#1b1b22] border border-gray-800 px-3 py-1.5 rounded-full shadow-inner">
          <Shield size={12} className="text-neon-purple animate-pulse" />
          <span className="text-[10px] font-black tracking-wide text-gray-300">ADMIN HUB</span>
        </div>
      </div>

      {/* INTERACTIVE HERO BANNER */}
      <div className="bg-gradient-to-br from-[#1b1233]/40 via-card-bg to-[#121216] border border-neon-purple/20 rounded-2xl p-4.5 mb-6 relative overflow-hidden shadow-xl group">
        <div className="absolute -right-6 -bottom-6 opacity-5 text-neon-purple group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
          <Trophy size={140} />
        </div>
        <div className="relative z-10">
          <span className="text-[8px] font-black uppercase tracking-widest bg-neon-volt/10 text-neon-volt border border-neon-volt/20 px-2 py-0.5 rounded-md">
            Tournament HQ Control
          </span>
          <h2 className="text-sm font-black text-white mt-2 leading-snug">
            Welcome Back, {auth.currentUser?.displayName || 'Coach Shobur'}!
          </h2>
          <p className="text-[10px] text-gray-400 mt-1 leading-normal">
            Realtime database manager is active. Easily customize competition parameters, sync squad lineups, and adjust atomic fixtures tables.
          </p>
        </div>
      </div>

      {/* 📊 Symmetrical 2x2 GRID FOR OVERVIEW LIVE ANALYTICS */}
      <div className="flex flex-col gap-2.5 mb-6">
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Overview Live Analytics</span>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Total Match */}
          <div 
            onClick={() => setActiveTab('match-center')}
            className="bg-gradient-to-b from-[#18181f] to-[#121216] border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-neon-purple/60 active:scale-95 transition-all duration-300 shadow-md group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-purple/40 to-transparent" />
            <div className="flex justify-between items-center text-neon-purple group-hover:text-white transition-colors">
              <Calendar size={16} className="bg-neon-purple/10 p-1 rounded-lg w-6 h-6 border border-neon-purple/20" />
              <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300 text-gray-400" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-white tracking-tight leading-none block">{stats.matches}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mt-1.5">Total Match</span>
            </div>
          </div>

          {/* Card 2: Active League */}
          <div 
            onClick={() => setShowLeagueModal(true)}
            className="bg-gradient-to-b from-[#18181f] to-[#121216] border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500/60 active:scale-95 transition-all duration-300 shadow-md group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            <div className="flex justify-between items-center text-indigo-400 group-hover:text-white transition-colors">
              <Trophy size={16} className="bg-indigo-500/10 p-1 rounded-lg w-6 h-6 border border-indigo-500/20" />
              <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300 text-gray-400" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-white tracking-tight leading-none block">{stats.leagues}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mt-1.5">Active League</span>
            </div>
          </div>

          {/* Card 3: Registered Teams */}
          <div 
            onClick={() => { setShowTeamModal(true); if(competitions.length > 0) handleSelectLeagueTeams(competitions[0]); }}
            className="bg-gradient-to-b from-[#18181f] to-[#121216] border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-[#a855f7]/50 active:scale-95 transition-all duration-300 shadow-md group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#a855f7]/40 to-transparent" />
            <div className="flex justify-between items-center text-purple-400 group-hover:text-white transition-colors">
              <Users size={16} className="bg-purple-500/10 p-1 rounded-lg w-6 h-6 border border-purple-500/20" />
              <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300 text-gray-400" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-white tracking-tight leading-none block">{stats.teams}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mt-1.5">Reg. Teams</span>
            </div>
          </div>

          {/* Card 4: Standings Analytics Dashboard Card */}
          <div 
            onClick={handleRouteToStandings}
            className="bg-gradient-to-b from-[#18181f] to-[#121216] border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-neon-volt/50 active:scale-95 transition-all duration-300 shadow-md group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-volt/30 to-transparent" />
            <div className="flex justify-between items-center text-neon-volt group-hover:text-white transition-colors">
              <BarChart3 size={16} className="bg-neon-volt/10 p-1 rounded-lg w-6 h-6 border border-neon-volt/20" />
              <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300 text-gray-400" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-white tracking-tight leading-none block">LIVE</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mt-1.5">Standings</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK MANAGEMENT ACTIONS */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Quick Action Console</span>
        
        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => setActiveTab('create')}
            className="bg-gradient-to-br from-[#18181f] to-[#14141a] border border-gray-800/80 p-4 rounded-2xl flex flex-col gap-3 items-start cursor-pointer hover:border-neon-purple/50 active:scale-[0.97] transition-all duration-300 shadow-md group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-neon-purple" />
            <div className="p-2 bg-neon-purple/10 border border-neon-purple/20 text-neon-purple group-hover:bg-neon-purple group-hover:text-white transition-all rounded-xl">
              <PlusCircle size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white tracking-wide group-hover:text-neon-purple transition-colors uppercase">Create Tournament</h4>
              <p className="text-[9px] text-gray-500 font-medium mt-0.5">Deploy automatic scheduler matrix</p>
            </div>
          </div>

          <div 
            onClick={() => { setShowTeamModal(true); if(competitions.length > 0) handleSelectLeagueTeams(competitions[0]); }}
            className="bg-gradient-to-br from-[#18181f] to-[#14141a] border border-gray-800/80 p-4 rounded-2xl flex flex-col gap-3 items-start cursor-pointer hover:border-neon-volt/40 active:scale-[0.97] transition-all duration-300 shadow-md group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-neon-volt" />
            <div className="p-2 bg-neon-volt/10 border border-neon-volt/20 text-neon-volt group-hover:bg-neon-volt group-hover:text-black transition-all rounded-xl">
              <Settings size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white tracking-wide group-hover:text-neon-volt transition-colors uppercase">Manage Roster</h4>
              <p className="text-[9px] text-gray-500 font-medium mt-0.5">CRUD squad information dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔮 MODAL 1: ACTIVE LEAGUE MANAGEMENT PANEL                                */}
      {/* ========================================================================= */}
      {showLeagueModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 p-4 flex flex-col justify-end animate-fadeIn">
          <div className="bg-[#18181f]/95 border border-gray-800/80 rounded-t-3xl max-h-[80vh] flex flex-col p-4 w-full shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-800 rounded-full mt-2" />
            
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-3 mb-4 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-white">
                <Trophy size={14} className="text-neon-purple animate-pulse" /> Leagues Control Panel
              </span>
              <button onClick={() => { setShowLeagueModal(false); setEditingCompId(null); }} className="text-gray-500 hover:text-white p-1"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 mb-4 pr-1">
              {competitions.map((comp) => {
                const isEditing = editingCompId === comp.id;
                return (
                  <div key={comp.id} className="bg-black/30 border border-gray-800/50 rounded-xl p-3.5 flex flex-col gap-2 relative group overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-neon-purple/40" />
                    {isEditing ? (
                      <div className="flex items-center gap-2 relative w-full">
                        <button 
                          onClick={() => { setPickerTarget('league'); setShowIconPicker(!showIconPicker); }}
                          className="w-9 h-9 bg-zinc-900 border border-gray-800 rounded-lg text-sm flex items-center justify-center"
                        >
                          {editCompIcon}
                        </button>
                        <input 
                          type="text" 
                          value={editCompName} 
                          onChange={(e) => setEditCompName(e.target.value)}
                          className="flex-1 bg-zinc-900 border border-neon-purple text-xs text-white p-2 rounded-lg font-bold outline-none"
                        />
                        <button onClick={() => handleUpdateLeague(comp.id)} className="p-2 bg-neon-purple text-white rounded-lg shadow-md"><Save size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-black/40 border border-gray-800 rounded-lg flex items-center justify-center text-sm shadow-inner">{comp.icon || '🏆'}</span>
                          <div>
                            <p className="text-xs font-black text-white tracking-wide uppercase">{comp.name}</p>
                            <p className="text-[9px] text-gray-500 font-bold tracking-tighter mt-0.5">Format: {comp.format} • <span className="text-neon-purple font-black">{comp.teamCount || 0} Teams</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingCompId(comp.id); setEditCompName(comp.name); setEditCompIcon(comp.icon || '🏆'); }} className="p-1.5 text-gray-500 hover:text-neon-purple transition-colors"><Edit3 size={12} /></button>
                          <button onClick={() => handleDeleteLeague(comp.id)} className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔮 MODAL 2: MANAGE TEAMS ROSTER CONTROL                                   */}
      {/* ========================================================================= */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 p-4 flex flex-col justify-end animate-fadeIn">
          <div className="bg-[#18181f]/95 border border-gray-800/80 rounded-t-3xl max-h-[80vh] flex flex-col p-4 w-full shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-800 rounded-full mt-2" />
            
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-3 mb-4 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-white">
                <Settings size={14} className="text-neon-volt animate-pulse" /> Team Database Manager
              </span>
              <button onClick={() => { setShowTeamModal(false); setEditingTeamId(null); setSelectedComp(null); }} className="text-gray-500 hover:text-white p-1"><X size={16} /></button>
            </div>

            <div className="mb-4">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1 px-0.5">Select Active League Scope</label>
              <select 
                value={selectedComp?.id || ''} 
                onChange={(e) => { 
                  const target = competitions.find(c => c.id === e.target.value); 
                  if(target) handleSelectLeagueTeams(target); 
                }} 
                className="w-full bg-black/40 border border-gray-800 rounded-xl p-3.5 text-xs text-white outline-none focus:border-neon-volt cursor-pointer font-black uppercase tracking-wider"
              >
                <option value="" className="bg-[#18181f]">-- Select Target Scope --</option>
                {competitions.map(c => <option key={c.id} value={c.id} className="bg-[#18181f]">{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-4 pr-1 max-h-56">
              {compTeams.map((team) => {
                const isEditing = editingTeamId === team.id;
                return (
                  <div key={team.id} className="bg-black/30 border border-gray-800/50 rounded-xl p-3 flex items-center justify-between gap-3 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-neon-volt/40" />
                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-2 relative">
                        <button onClick={() => { setPickerTarget('team'); setShowIconPicker(!showIconPicker); }} className="w-8 h-8 bg-zinc-900 border border-gray-800 rounded-lg text-sm flex items-center justify-center">{editTeamIcon}</button>
                        <input type="text" value={editTeamName} onChange={(e) => setEditTeamName(e.target.value)} className="flex-1 bg-zinc-900 border border-neon-volt text-xs text-white p-2 rounded-lg font-bold outline-none" />
                        <button onClick={() => handleUpdateTeam(team.id)} className="p-2 bg-neon-volt text-black rounded-lg font-bold shadow-md"><Save size={12} /></button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 bg-black/50 border border-gray-800 rounded-md flex items-center justify-center text-xs shadow-inner">{team.icon || '🛡️'}</span>
                          <span className="text-xs font-bold text-white truncate max-w-[170px] uppercase tracking-wide">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingTeamId(team.id); setEditTeamName(team.name); setEditTeamIcon(team.icon || '🛡️'); }} className="p-1.5 text-gray-500 hover:text-neon-volt transition-colors"><Edit3 size={12} /></button>
                          <button onClick={() => handleDeleteTeam(team.id)} className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowTeamModal(false)} className="w-full py-3.5 bg-zinc-800/90 text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-md hover:bg-zinc-700 transition-colors">Close Panel</button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔮 GLOBAL FLOATING ICON LIBRARY POPOVER                                   */}
      {/* ========================================================================= */}
      {showIconPicker && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6 animate-fadeIn backdrop-blur-xs">
          <div className="bg-[#18181f] border border-gray-800 rounded-2xl p-4 w-full max-w-xs shadow-2xl flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1"><Grid size={12} /> Select Emblem Badge</span>
              <button onClick={() => setShowIconPicker(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {iconLibrary.map(ico => (
                <button 
                  key={ico} 
                  onClick={() => {
                    if (pickerTarget === 'league') setEditCompIcon(ico);
                    if (pickerTarget === 'team') setEditTeamIcon(ico);
                    setShowIconPicker(false);
                  }} 
                  className="text-lg p-2 bg-black/40 border border-gray-800/80 hover:border-neon-purple/60 rounded-xl transition-all active:scale-90"
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}