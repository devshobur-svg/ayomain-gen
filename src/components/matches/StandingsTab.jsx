import { useState, useEffect } from 'react';
import { db, auth } from '@/firebaseConfig';
import { collection, onSnapshot, query, orderBy, where, collectionGroup } from 'firebase/firestore';
import { RefreshCw, ChevronDown, BarChart3, ListOrdered } from 'lucide-react';

export default function StandingsTab() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [teams, setTeams] = useState([]);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // 📊 TOGGLE SUB-TAB MIKRO KLASEMEN: 'standard' atau 'analytics'
  const [standingsMode, setStandingsMode] = useState('standard');

  // 1. Ambil daftar seluruh kompetisi khusus milik User yang login
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const compsRef = collection(db, 'competitions');
    const q = query(compsRef, where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));

    const unsubscribeLeagues = onSnapshot(q, (snapshot) => {
      const compsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompetitions(compsList);
      
      if (compsList.length > 0 && !selectedCompId) {
        setSelectedCompId(compsList[0].id);
      }
      setLoadingLeagues(false);
    }, (err) => {
      console.error(err);
      setLoadingLeagues(false);
    });

    return () => unsubscribeLeagues();
  }, []);

  // 2. Real-time Listener Tim & Kalkulasi Analytics dari Histori Pertandingan
  useEffect(() => {
    if (!selectedCompId) {
      setTeams([]);
      return;
    }

    setLoadingTeams(true);

    // Ambil data tim dasar
    const teamsRef = collection(db, 'competitions', selectedCompId, 'teams');
    const unsubscribeTeams = onSnapshot(teamsRef, (teamsSnapshot) => {
      const teamsData = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Ambil data pertandingan untuk mengekstrak GF, GA, dan Form Tren
      const matchesRef = collection(db, 'competitions', selectedCompId, 'matches');
      onSnapshot(matchesRef, (matchesSnapshot) => {
        const finishedMatches = matchesSnapshot.docs
          .map(doc => doc.data())
          .filter(m => m.status === 'finished');

        // 🧠 DEEP ADVANCED STATS ENGINE: Hitung GF, GA, dan Form per Tim
        const enhancedTeams = teamsData.map(team => {
          let goalsFor = 0;
          let goalsAgainst = 0;
          const matchHistory = []; // Menyimpan tren W, D, L

          // Cari pertandingan yang melibatkan tim ini
          finishedMatches.forEach(match => {
            const isHome = match.homeTeamId === team.id;
            const isAway = match.awayTeamId === team.id;

            if (isHome) {
              const hScore = match.homeScore ?? 0;
              const aScore = match.awayScore ?? 0;
              goalsFor += hScore;
              goalsAgainst += aScore;

              if (hScore > aScore) matchHistory.push({ round: match.round, res: 'W' });
              else if (hScore < aScore) matchHistory.push({ round: match.round, res: 'L' });
              else matchHistory.push({ round: match.round, res: 'D' });
            } else if (isAway) {
              const hScore = match.homeScore ?? 0;
              const aScore = match.awayScore ?? 0;
              goalsFor += aScore;
              goalsAgainst += hScore;

              if (aScore > hScore) matchHistory.push({ round: match.round, res: 'W' });
              else if (aScore < hScore) matchHistory.push({ round: match.round, res: 'L' });
              else matchHistory.push({ round: match.round, res: 'D' });
            }
          });

          // Urutkan riwayat form berdasarkan pekan/round dari yang paling baru
          const sortedHistory = matchHistory
            .sort((a, b) => b.round - a.round)
            .map(h => h.res)
            .slice(0, 5); // Batasi ambil 5 pertandingan terakhir saja

          return {
            ...team,
            analytics: {
              gf: goalsFor,
              ga: goalsAgainst,
              form: sortedHistory // Array berisi ['W', 'L', 'D', ...]
            }
          };
        });

        // 🏆 SORTING LEAGUE STANDINGS STANDARD RULES
        const sortedStandings = enhancedTeams.sort((a, b) => {
          const pointsA = a.stats?.points ?? 0;
          const pointsB = b.stats?.points ?? 0;
          const gdA = a.stats?.goalDifference ?? 0;
          const gdB = b.stats?.goalDifference ?? 0;

          if (pointsB !== pointsA) return pointsB - pointsA;
          return gdB - gdA;
        });

        setTeams(sortedStandings);
        setLoadingTeams(false);
      });
    }, (err) => {
      console.error(err);
      setLoadingTeams(false);
    });

    return () => unsubscribeTeams();
  }, [selectedCompId]);

  const currentComp = competitions.find(c => c.id === selectedCompId);

  if (loadingLeagues) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-gray-500 gap-2">
        <RefreshCw className="animate-spin text-neon-purple" size={18} />
        <span>Inisialisasi sistem klasemen...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fadeIn text-white">
      
      {/* LEAGUE SELECTOR DROPDOWN */}
      {competitions.length > 0 && (
        <div className="relative bg-[#18181f] border border-gray-800 rounded-xl p-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-lg bg-black/40 w-8 h-8 rounded-lg flex items-center justify-center border border-gray-800/60 shadow-inner">
              {currentComp?.icon || '🏆'}
            </span>
            <div className="flex flex-col flex-1">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active Standings League</span>
              <div className="relative w-full mt-0.5">
                <select
                  value={selectedCompId}
                  onChange={(e) => setSelectedCompId(e.target.value)}
                  className="w-full bg-transparent text-xs font-black text-white outline-none appearance-none pr-6 cursor-pointer tracking-wide uppercase"
                >
                  {competitions.map((comp) => (
                    <option key={comp.id} value={comp.id} className="bg-[#1e1e1e] text-white">{comp.name}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN DATA INTERACTIVE TABLE */}
      <div className="bg-[#14141a] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        
        {/* 🎛️ MODE SELECTOR TAB MIKRO (Standard vs Analytics Premium) */}
        <div className="flex justify-between items-center border-b border-gray-800/60 p-2 bg-black/20">
          <div className="flex gap-1.5">
            <button 
              onClick={() => setStandingsMode('standard')}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 transition-all ${
                standingsMode === 'standard' 
                  ? 'bg-neon-purple/10 border border-neon-purple/20 text-neon-purple shadow-sm' 
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <ListOrdered size={12} /> Standard Table
            </button>
            <button 
              onClick={() => setStandingsMode('analytics')}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 transition-all ${
                standingsMode === 'analytics' 
                  ? 'bg-neon-volt/10 border border-neon-volt/20 text-neon-volt shadow-sm' 
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <BarChart3 size={12} /> Advanced Stats
            </button>
          </div>
          <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-2">Top Scorers</span>
        </div>

        {loadingTeams ? (
          <div className="flex items-center justify-center py-16 text-xs text-gray-500 gap-2">
            <RefreshCw className="animate-spin text-neon-purple" size={14} />
            <span>Menyusun urutan klasemen cloud...</span>
          </div>
        ) : teams.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              
              {/* 🟢 CONDITION 1: HEADER UNTUK STANDARD MODE */}
              {standingsMode === 'standard' && (
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase bg-black/10 tracking-wider">
                    <th className="py-3.5 px-3 text-center w-8">#</th>
                    <th className="py-3.5 px-2">Team</th>
                    <th className="py-3.5 px-1.5 text-center w-8">P</th>
                    <th className="py-3.5 px-1.5 text-center w-8">W</th>
                    <th className="py-3.5 px-1.5 text-center w-8">D</th>
                    <th className="py-3.5 px-1.5 text-center w-8">L</th>
                    <th className="py-3.5 px-2 text-center w-10">GD</th>
                    <th className="py-3.5 px-3 text-center w-10 font-black text-white">Pts</th>
                  </tr>
                </thead>
              )}

              {/* 🟡 CONDITION 2: HEADER UNTUK ANALYTICS MODE */}
              {standingsMode === 'analytics' && (
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase bg-black/10 tracking-wider">
                    <th className="py-3.5 px-3 text-center w-8">#</th>
                    <th className="py-3.5 px-2">Team</th>
                    <th className="py-3.5 px-2 text-center w-10 text-emerald-400">GF</th>
                    <th className="py-3.5 px-2 text-center w-10 text-red-400">GA</th>
                    <th className="py-3.5 px-2 text-center w-10">GD</th>
                    <th className="py-3.5 px-4 text-center w-32">5 Last Form</th>
                  </tr>
                </thead>
              )}

              <tbody className="divide-y divide-gray-800/40">
                {teams.map((team, index) => (
                  <tr key={team.id} className="hover:bg-white/[0.01] transition-colors duration-150">
                    <td className="py-3.5 px-3 text-center text-xs font-black text-gray-500">{index + 1}</td>
                    <td className="py-3.5 px-2 flex items-center gap-2.5">
                      <span className="text-xs bg-black/40 w-6 h-6 rounded-md flex items-center justify-center border border-gray-800/60 shadow-inner">{team.icon}</span>
                      <span className="text-xs font-bold text-white truncate max-w-[100px]">{team.name}</span>
                    </td>

                    {/* RENDER DATA BERDASARKAN MODE SELEKTOR */}
                    {standingsMode === 'standard' ? (
                      <>
                        <td className="py-3.5 px-1.5 text-center text-xs text-gray-400">{team.stats?.gamesPlayed ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center text-xs text-gray-400">{team.stats?.wins ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center text-xs text-gray-400">{team.stats?.draws ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center text-xs text-gray-400">{team.stats?.losses ?? 0}</td>
                        <td className="py-3.5 px-2 text-center text-xs font-semibold text-gray-400">{team.stats?.goalDifference ?? 0}</td>
                        <td className="py-3.5 px-3 text-center text-xs font-black text-white bg-white/[0.01]">{team.stats?.points ?? 0}</td>
                      </>
                    ) : (
                      <>
                        {/* Advanced Columns */}
                        <td className="py-3.5 px-2 text-center text-xs text-emerald-400 font-medium">{team.analytics?.gf ?? 0}</td>
                        <td className="py-3.5 px-2 text-center text-xs text-red-400 font-medium">{team.analytics?.ga ?? 0}</td>
                        <td className="py-3.5 px-2 text-center text-xs font-semibold text-gray-400">{team.stats?.goalDifference ?? 0}</td>
                        
                        {/* 🟢 TREN BULATAN FORM PERFORMA */}
                        <td className="py-3.5 px-4">
                          <div className="flex gap-1 justify-center items-center">
                            {team.analytics?.form && team.analytics.form.length > 0 ? (
                              team.analytics.form.map((res, hIdx) => (
                                <span 
                                  key={hIdx}
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black tracking-tighter text-white shadow-sm ${
                                    res === 'W' ? 'bg-emerald-600 shadow-emerald-900/40' : 
                                    res === 'L' ? 'bg-red-600 shadow-red-900/40' : 
                                    'bg-zinc-600'
                                  }`}
                                  title={res === 'W' ? 'Win' : res === 'L' ? 'Loss' : 'Draw'}
                                >
                                  {res}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">No Match Data</span>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600 text-xs px-4">
            <span className="text-xl block mb-1">📋</span>
            Kompetisi ini belum memiliki daftar skuad tim terdaftar, Coach.
          </div>
        )}
      </div>

    </div>
  );
}