import { useState, useEffect } from 'react';
import { db } from '@/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Calendar, Users, X, ChevronDown, ListOrdered, BarChart3, RefreshCw } from 'lucide-react';

export default function PublicFixtures({ compId, currentMode }) {
  // Data Storage States
  const [matchesByRound, setMatchesByRound] = useState({});
  const [standingsTeams, setStandingsTeams] = useState([]);
  const [expandedRounds, setExpandedRounds] = useState({});
  const [standingsSubMode, setStandingsSubMode] = useState('standard'); // standard / analytics
  const [loading, setLoading] = useState(true);

  // Lineup Drawer View States
  const [showLineupModal, setShowLineupModal] = useState(false);
  const [activeMatch, setActiveMatch] = useState(null);
  const [homeLineup, setHomeLineup] = useState([]);
  const [awayLineup, setAwayLineup] = useState([]);

  useEffect(() => {
    if (!compId) return;
    setLoading(true);

    // 1. Ambil data Matches untuk Jadwal & Kalkulasi Live Analytics Klasemen
    const matchesRef = collection(db, 'competitions', compId, 'matches');
    const unsubscribeMatches = onSnapshot(matchesRef, (matchSnap) => {
      const matchesList = matchSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 🧠 1A. LOGIC ACCORDION & SMART AUTO FOCUS (Kloningan Presisi Fixtures Lu)
      const grouped = {};
      const autoFocusPayload = { ...expandedRounds };

      matchesList.forEach(match => {
        const roundNum = match.round || 1;
        if (!grouped[roundNum]) grouped[roundNum] = [];
        grouped[roundNum].push(match);
      });

      const roundNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);
      let focusedFound = false;

      roundNumbers.forEach(r => {
        const hasPending = grouped[r].some(m => m.status === 'upcoming' || m.status === 'live');
        const key = `${compId}_${r}`;
        if (hasPending && !focusedFound) {
          if (autoFocusPayload[key] === undefined) autoFocusPayload[key] = true;
          focusedFound = true;
        } else {
          if (autoFocusPayload[key] === undefined) autoFocusPayload[key] = false;
        }
      });

      if (!focusedFound && roundNumbers.length > 0) {
        const key = `${compId}_${roundNumbers[0]}`;
        if (autoFocusPayload[key] === undefined) autoFocusPayload[key] = true;
      }

      setExpandedRounds(autoFocusPayload);
      setMatchesByRound(grouped);

      // 2. Ambil data Teams untuk menyusun urutan klasemen
      const teamsRef = collection(db, 'competitions', compId, 'teams');
      onSnapshot(teamsRef, (teamsSnap) => {
        const teamsList = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const finishedMatches = matchesList.filter(m => m.status === 'finished');

        // 🧠 1B. ADVANCED ANALYTICS MATRIX FOR PUBLIC VIEWER (GF, GA, 5 Last Form)
        const enhancedTeams = teamsList.map(team => {
          let gf = 0, ga = 0;
          const formTrend = [];

          finishedMatches.forEach(m => {
            const isHome = m.homeTeamId === team.id;
            const isAway = m.awayTeamId === team.id;
            if (isHome) {
              gf += (m.homeScore ?? 0); ga += (m.awayScore ?? 0);
              if (m.homeScore > m.awayScore) formTrend.push({ round: m.round, res: 'W' });
              else if (m.homeScore < m.awayScore) formTrend.push({ round: m.round, res: 'L' });
              else formTrend.push({ round: m.round, res: 'D' });
            } else if (isAway) {
              gf += (m.awayScore ?? 0); ga += (m.homeScore ?? 0);
              if (m.awayScore > m.homeScore) formTrend.push({ round: m.round, res: 'W' });
              else if (m.awayScore < m.homeScore) formTrend.push({ round: m.round, res: 'L' });
              else formTrend.push({ round: m.round, res: 'D' });
            }
          });

          const sortedForm = formTrend.sort((a, b) => b.round - a.round).map(f => f.res).slice(0, 5);

          return {
            ...team,
            analytics: { gf, ga, form: sortedForm }
          };
        });

        // Sorting standar Poin & Goal Difference
        const sorted = enhancedTeams.sort((a, b) => {
          if ((b.stats?.points ?? 0) !== (a.stats?.points ?? 0)) return (b.stats?.points ?? 0) - (a.stats?.points ?? 0);
          return (b.stats?.goalDifference ?? 0) - (a.stats?.goalDifference ?? 0);
        });

        setStandingsTeams(sorted);
        setLoading(false);
      });
    });

    return () => unsubscribeMatches();
  }, [compId]);

  const handleOpenPublicLineup = (match) => {
    setActiveMatch(match);
    const lineupRef = collection(db, 'competitions', compId, 'matches', match.id, 'lineups');
    onSnapshot(lineupRef, (snapshot) => {
      const homePlayers = [];
      const awayPlayers = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.teamSide === 'home') homePlayers.push(data);
        if (data.teamSide === 'away') awayPlayers.push(data);
      });
      setHomeLineup(homePlayers);
      setAwayLineup(awayPlayers);
      setShowLineupModal(true);
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-xs text-gray-500 gap-2">
        <RefreshCw className="animate-spin text-neon-purple" size={16} />
        <span>Syncing server scoreboard data...</span>
      </div>
    );
  }

  const roundNumbers = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  return (
    <>
      {/* 🟢 RENDER 1: TAB JADWAL FIXTURES COMPONENT */}
      {currentMode === 'fixtures' && (
        <div className="flex flex-col gap-3">
          {roundNumbers.length > 0 ? (
            roundNumbers.map(roundNum => {
              const key = `${compId}_${roundNum}`;
              const isExpanded = !!expandedRounds[key];
              const matches = matchesByRound[roundNum];

              return (
                <div key={roundNum} className="border border-gray-900 bg-black/20 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedRounds(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="w-full flex justify-between items-center bg-[#18181f]/70 px-4 py-3 border-b border-gray-950"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-purple shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
                      <span className="text-xs font-black uppercase tracking-wider">Pekan {roundNum}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500 font-bold uppercase">{matches.length} Matches</span>
                      <ChevronDown size={13} className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-3 flex flex-col gap-3 animate-fadeIn">
                      {matches.map(match => (
                        <div key={match.id} className={`bg-[#14141a] border rounded-2xl p-4 flex flex-col gap-3.5 ${match.status === 'live' ? 'border-red-500/20 bg-gradient-to-b from-[#1c1214] to-[#14141a]' : 'border-gray-800/60'}`}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5 w-24">
                              <span className="text-sm bg-black/40 w-6 h-6 rounded-md flex items-center justify-center border border-gray-800/60 shadow-inner">{match.homeTeamIcon}</span>
                              <span className="text-xs font-black text-white truncate">{match.homeTeamName}</span>
                            </div>

                            <div className="flex flex-col items-center justify-center flex-1">
                              {match.status === 'live' || match.status === 'finished' ? (
                                <div className="flex items-center gap-2 text-xs font-black text-white bg-black/40 px-2.5 py-1 rounded-xl border border-gray-800/60 shadow-inner">
                                  <span className={match.status === 'live' ? 'text-neon-volt animate-pulse' : 'text-white'}>{match.homeScore}</span>
                                  <span className="text-gray-600 font-normal">:</span>
                                  <span className={match.status === 'live' ? 'text-neon-volt animate-pulse' : 'text-white'}>{match.awayScore}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 bg-black/40 border border-gray-800/60 px-2 py-0.5 rounded-md text-[9px] text-gray-400 font-bold">
                                  <span>{match.time}</span>
                                </div>
                              )}
                              {match.status === 'live' && <span className="text-[7px] text-red-500 font-black uppercase tracking-wider mt-1 animate-pulse">● LIVE</span>}
                            </div>

                            <div className="flex items-center gap-2.5 w-24 justify-end">
                              <span className="text-xs font-black text-white truncate text-right">{match.awayTeamName}</span>
                              <span className="text-sm bg-black/40 w-6 h-6 rounded-md flex items-center justify-center border border-gray-800/60 shadow-inner">{match.awayTeamIcon}</span>
                            </div>
                          </div>

                          <div className="border-t border-gray-900/60 pt-2.5 flex justify-between items-center text-[10px] text-gray-500 font-bold">
                            <button onClick={() => handleOpenPublicLineup(match)} className="flex items-center gap-1 hover:text-white transition-colors border border-gray-800/60 bg-black/20 px-2 py-1 rounded-lg text-[9px] uppercase"><Users size={11} /> View Skuad</button>
                            <span className="uppercase text-[8px] tracking-widest text-zinc-600 font-black">{match.status === 'finished' ? '🔒 Locked' : '🕒 Pending'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-600 text-xs">Jadwal pekanan kompetisi belum dirilis.</div>
          )}
        </div>
      )}

      {/* 🟡 RENDER 2: TAB LEAGUE STANDINGS TABLE COMPONENT */}
      {currentMode === 'standings' && (
        <div className="bg-[#14141a] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="flex border-b border-gray-800/60 p-2 bg-black/20 gap-1.5">
            <button onClick={() => setStandingsSubMode('standard')} className={`px-3 py-1.5 rounded-lg text-[9px] uppercase font-black tracking-wider flex items-center gap-1 ${standingsSubMode === 'standard' ? 'bg-neon-purple/10 border border-neon-purple/20 text-neon-purple' : 'text-gray-500'}`}><ListOrdered size={11} /> Standard</button>
            <button onClick={() => setStandingsSubMode('analytics')} className={`px-3 py-1.5 rounded-lg text-[9px] uppercase font-black tracking-wider flex items-center gap-1 ${standingsSubMode === 'analytics' ? 'bg-neon-volt/10 border border-neon-volt/20 text-neon-volt' : 'text-gray-500'}`}><BarChart3 size={11} /> Analytics</button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-[9px] font-bold text-gray-500 uppercase bg-black/10 tracking-wider">
                  <th className="py-3 px-3 text-center w-8">#</th>
                  <th className="py-3 px-2">Team</th>
                  {standingsSubMode === 'standard' ? (
                    <>
                      <th className="py-3 px-1 text-center w-7">P</th>
                      <th className="py-3 px-1 text-center w-7">W</th>
                      <th className="py-3 px-1 text-center w-7">D</th>
                      <th className="py-3 px-1 text-center w-7">L</th>
                      <th className="py-3 px-1.5 text-center w-8">GD</th>
                      <th className="py-3 px-3 text-center w-8 font-black text-white bg-white/5">Pts</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-1 text-center w-8 text-emerald-400">GF</th>
                      <th className="py-3 px-1 text-center w-8 text-red-400">GA</th>
                      <th className="py-3 px-1 text-center w-8">GD</th>
                      <th className="py-3 px-3 text-center w-28">5 Form</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {standingsTeams.map((team, idx) => (
                  <tr key={team.id} className="hover:bg-white/[0.01]">
                    <td className="py-3 px-3 text-center text-xs font-black text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-2 flex items-center gap-2 truncate max-w-[110px]">
                      <span className="text-xs bg-black/40 w-5 h-5 rounded flex items-center justify-center border border-gray-800/60 shadow-inner">{team.icon}</span>
                      <span className="text-xs font-bold text-white truncate uppercase">{team.name}</span>
                    </td>
                    {standingsSubMode === 'standard' ? (
                      <>
                        <td className="py-3 px-1 text-center text-xs text-gray-400">{team.stats?.gamesPlayed ?? 0}</td>
                        <td className="py-3 px-1 text-center text-xs text-gray-400">{team.stats?.wins ?? 0}</td>
                        <td className="py-3 px-1 text-center text-xs text-gray-400">{team.stats?.draws ?? 0}</td>
                        <td className="py-3 px-1 text-center text-xs text-gray-400">{team.stats?.losses ?? 0}</td>
                        <td className="py-3 px-1.5 text-center text-xs text-gray-400">{team.stats?.goalDifference ?? 0}</td>
                        <td className="py-3 px-3 text-center text-xs font-black text-white bg-white/5">{team.stats?.points ?? 0}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-1 text-center text-xs text-emerald-400">{team.analytics?.gf ?? 0}</td>
                        <td className="py-3 px-1 text-center text-xs text-red-400">{team.analytics?.ga ?? 0}</td>
                        <td className="py-3 px-1 text-center text-xs text-gray-400">{team.stats?.goalDifference ?? 0}</td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1 justify-center items-center">
                            {team.analytics?.form && team.analytics.form.length > 0 ? (
                              team.analytics.form.map((res, fIdx) => (
                                <span key={fIdx} className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black text-white ${res === 'W' ? 'bg-emerald-600' : res === 'L' ? 'bg-red-600' : 'bg-zinc-600'}`}>{res}</span>
                              ))
                            ) : (
                              <span className="text-[7px] text-gray-600 font-bold uppercase tracking-wider">No Data</span>
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
        </div>
      )}

      {/* READ-ONLY SKUAD LINEUP DRAWER MODAL */}
      {showLineupModal && activeMatch && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 p-4 flex flex-col justify-end animate-fadeIn">
          <div className="bg-[#18181f]/95 border border-gray-800 rounded-t-3xl max-h-[70vh] flex flex-col p-4 w-full relative shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-2.5 mb-4"><span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Match Roster Lineup</span><button onClick={() => { setShowLineupModal(false); setActiveMatch(null); }} className="text-gray-500 hover:text-white p-1"><X size={16} /></button></div>
            
            <div className="bg-black/40 border border-gray-800/60 p-2.5 rounded-xl flex items-center justify-between text-center mb-4 text-xs font-black">
              <span className="truncate max-w-[110px]">{activeMatch.homeTeamName}</span>
              <span className="text-[9px] font-black bg-zinc-800 text-gray-500 px-1.5 py-0.5 rounded">VS</span>
              <span className="truncate max-w-[110px] text-right">{activeMatch.awayTeamName}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto mb-4 max-h-48 pr-1">
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-neon-purple uppercase tracking-widest border-b border-gray-800 pb-1 block truncate">{activeMatch.homeTeamName}</span>
                {homeLineup.length > 0 ? homeLineup.map((p, i) => <div key={i} className="bg-black/20 px-2 py-1 rounded-lg text-[10px] font-bold text-gray-300">{i+1}. {p.name}</div>) : <span className="text-[9px] text-gray-600 italic">No lineups input</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-neon-purple uppercase tracking-widest border-b border-gray-800 pb-1 block truncate text-right">{activeMatch.awayTeamName}</span>
                {awayLineup.length > 0 ? awayLineup.map((p, i) => <div key={i} className="bg-black/20 px-2 py-1 rounded-lg text-[10px] font-bold text-gray-300 text-right">{p.name} .{i+1}</div>) : <span className="text-[9px] text-gray-600 italic text-right">No lineups input</span>}
              </div>
            </div>
            <button onClick={() => { setShowLineupModal(false); setActiveMatch(null); }} className="w-full py-3 bg-zinc-800 text-white text-xs font-black rounded-xl uppercase tracking-wider">Close Viewer</button>
          </div>
        </div>
      )}
    </>
  );
}