import { useState, useEffect } from 'react';
import { db, auth } from '@/firebaseConfig'; // 👈 Inject auth instance
import { collection, onSnapshot, query, doc, runTransaction, updateDoc, setDoc, where, getDoc } from 'firebase/firestore';
import { 
  Calendar, Trophy, ChevronRight, RefreshCw, Play, 
  CheckCircle, Plus, Minus, Users, X, UserPlus, ShieldAlert, ChevronDown
} from 'lucide-react';

export default function FixturesTab() {
  const [filter, setFilter] = useState('upcoming'); // upcoming, live, finished
  const [groupedMatches, setGroupedMatches] = useState({});
  const [loading, setLoading] = useState(true);

  // 🔽 STATE BARU: Menyimpan data pekan mana saja yang sedang melorot terbuka (Accordion)
  const [expandedRounds, setExpandedRounds] = useState({});

  // States Skuad Lineup Drawer (Original Lu)
  const [showLineupModal, setShowLineupModal] = useState(false);
  const [activeMatchContext, setActiveMatchContext] = useState(null);
  const [homeLineup, setHomeLineup] = useState([]);
  const [awayLineup, setAwayLineup] = useState([]);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [selectedTeamTarget, setSelectedTeamTarget] = useState('home');

  // 🔽 STATES BARU FOR CUP KNOCKOUT MODE: Pengendali skor adu penalti
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyMatchData, setPenaltyMatchData] = useState(null);
  const [homePenaltyInput, setHomePenaltyInput] = useState(0);
  const [awayPenaltyInput, setAwayPenaltyInput] = useState(0);

  // 🛰️ FIXED SECURITY LAYER: Mengganti collectionGroup global menjadi Sub-Collection Map Fetching Terisolasi
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // 1. Ambil seluruh kompetisi milik user yang sedang login
    const compsRef = collection(db, 'competitions');
    const userCompsQuery = query(compsRef, where('userId', '==', currentUser.uid));

    const unsubscribeLeagues = onSnapshot(userCompsQuery, (compSnapshot) => {
      const myCompIds = [];
      const compMap = {};

      compSnapshot.forEach(cDoc => {
        myCompIds.push(cDoc.id);
        const data = cDoc.data();
        compMap[cDoc.id] = {
          name: data.name || 'Unknown Competition',
          icon: data.icon || '🏆'
        };
      });

      // Jika user baru belum punya kompetisi, langsung bypass matikan loading
      if (myCompIds.length === 0) {
        setGroupedMatches({});
        setLoading(false);
        return;
      }

      // 🧠 AMAN & TERISOLASI: Lakukan loop onSnapshot terarah murni ke dalam koleksi internal milik admin
      const activeUnsubscribes = myCompIds.map(compId => {
        const matchesRef = collection(db, 'competitions', compId, 'matches');
        
        return onSnapshot(matchesRef, (matchSnapshot) => {
          setGroupedMatches(prevGrouped => {
            const bundledGroup = { ...prevGrouped };
            const autoFocusPayload = { ...expandedRounds };

            const compInfo = compMap[compId] || { name: 'Unknown Competition', icon: '🏆' };
            const compName = compInfo.name;

            // Reset wadah rounds untuk liga spesifik ini agar tidak menumpuk saat trigger update score
            if (bundledGroup[compName]) {
              bundledGroup[compName].rounds = {};
            }

            matchSnapshot.docs.forEach(mDoc => {
              const matchData = { id: mDoc.id, competitionId: compId, ...mDoc.data() };
              
              // Saring data real-time murni berdasarkan tab filter aktif
              if (matchData.status !== filter) return;

              if (!bundledGroup[compName]) {
                bundledGroup[compName] = {
                  compId: compId,
                  compIcon: compInfo.icon,
                  rounds: {}
                };
              }

              const roundNum = matchData.round || 1;
              if (!bundledGroup[compName].rounds[roundNum]) {
                bundledGroup[compName].rounds[roundNum] = [];
              }

              // Mencegah redudansi data masuk ke array
              const isDuplicate = bundledGroup[compName].rounds[roundNum].some(m => m.id === matchData.id);
              if (!isDuplicate) {
                bundledGroup[compName].rounds[roundNum].push(matchData);
              }
            });

            // 🎯 SMART AUTO-FOCUS SYSTEM: Buka pekan aktif pertama yang terdeteksi
            const compData = bundledGroup[compName];
            if (compData && compData.rounds) {
              const roundNumbers = Object.keys(compData.rounds).map(Number).sort((a, b) => a - b);
              let focusedRoundFound = false;

              for (let r of roundNumbers) {
                const hasPendingMatch = compData.rounds[r].some(m => m.status === 'upcoming' || m.status === 'live');
                const uniqueKey = `${compId}_${r}`;

                if (hasPendingMatch && !focusedRoundFound) {
                  if (autoFocusPayload[uniqueKey] === undefined) autoFocusPayload[uniqueKey] = true;
                  focusedRoundFound = true;
                } else {
                  if (autoFocusPayload[uniqueKey] === undefined) autoFocusPayload[uniqueKey] = false;
                }
              }
            }

            // Bersihkan sisa properti nama kompetisi kosong jika filternya nihil
            if (bundledGroup[compName] && Object.keys(bundledGroup[compName].rounds).length === 0) {
              delete bundledGroup[compName];
            }

            return bundledGroup;
          });
          
          setLoading(false);
        });
      });

      // Fungsi pembersih multi-listener subscriber
      return () => {
        activeUnsubscribes.forEach(unsub => unsub());
      };

    }, (err) => {
      console.error("Error secure fixtures sync: ", err);
      setLoading(false);
    });

    return () => unsubscribeLeagues();
  }, [filter]);

  // 🔄 ACTION TOGGLE ACCORDION PANEL
  const toggleRoundAccordion = (compId, roundNum) => {
    const uniqueKey = `${compId}_${roundNum}`;
    setExpandedRounds(prev => ({
      ...prev,
      [uniqueKey]: !prev[uniqueKey]
    }));
  };

  const handleOpenLineupManager = (compId, match) => {
    setActiveMatchContext({ compId, ...match });
    setSelectedTeamTarget('home');
    setPlayerNameInput('');

    const lineupRef = collection(db, 'competitions', compId, 'matches', match.id, 'lineups');
    onSnapshot(lineupRef, (snapshot) => {
      const homePlayers = [];
      const awayPlayers = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.teamSide === 'home') homePlayers.push({ id: doc.id, ...data });
        if (data.teamSide === 'away') awayPlayers.push({ id: doc.id, ...data });
      });
      setHomeLineup(homePlayers);
      setAwayLineup(awayPlayers);
      setShowLineupModal(true);
    });
  };

  const handleAddPlayerToLineup = async () => {
    if (!playerNameInput.trim()) return;
    const { compId, id: matchId } = activeMatchContext;
    try {
      const playerDocRef = doc(collection(db, 'competitions', compId, 'matches', matchId, 'lineups'));
      await setDoc(playerDocRef, { name: playerNameInput.trim(), teamSide: selectedTeamTarget, createdAt: new Date() });
      setPlayerNameInput('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartLive = async (compId, matchId) => {
    try {
      await updateDoc(doc(db, 'competitions', compId, 'matches', matchId), { status: 'live', homeScore: 0, awayScore: 0 });
      setFilter('live');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLiveScore = async (compId, matchId, teamType, operation) => {
    try {
      const matchDocRef = doc(db, 'competitions', compId, 'matches', matchId);
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchDocRef);
        if (!matchDoc.exists()) return;
        const currentData = matchDoc.data();
        let currentScore = currentData[teamType] ?? 0;
        if (operation === 'add') currentScore += 1;
        if (operation === 'sub' && currentScore > 0) currentScore -= 1;
        transaction.update(matchDocRef, { [teamType]: currentScore });
      });
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 EKSEKUTOR MODUL KEDUA: Submit skor adu penalti & trigger estafet kelolosan otomatis
  const handleExecutePenaltyFinish = async () => {
    if (homePenaltyInput === awayPenaltyInput) return alert("Skor adu penalti gak boleh seri, Coach! Harus ada pemenang mutlak.");
    const { compId, match } = penaltyMatchData;
    setShowPenaltyModal(false);
    await executeFinalClosure(compId, match, homePenaltyInput, awayPenaltyInput);
  };

  const handleFinishMatch = async (compId, match) => {
    const hScore = match.homeScore ?? 0;
    const aScore = match.awayScore ?? 0;

    // 👁️ VALIDASI FORMAT INDUK: Ambil format untuk deteksi apakah butuh adu penalti
    const compDoc = await getDoc(doc(db, 'competitions', compId));
    const isCupFormat = compDoc.exists() && compDoc.data().format === 'cup';

    if (isCupFormat && hScore === aScore) {
      // Jika seri di format Cup, paksa buka modal adu penalti
      setHomePenaltyInput(0);
      setAwayPenaltyInput(0);
      setPenaltyMatchData({ compId, match });
      setShowPenaltyModal(true);
      return;
    }

    if (!confirm(`Kunci skor akhir ${match.homeTeamName} ${hScore} - ${aScore} ${match.awayTeamName}?`)) return;
    await executeFinalClosure(compId, match, null, null);
  };

  // 🧠 CORE ARS_ENGINE: Fungsi penutupan laga terpadu (Mendukung Liga & Cup Knockout)
  const executeFinalClosure = async (compId, match, homePen, awayPen) => {
    const hScore = match.homeScore ?? 0;
    const aScore = match.awayScore ?? 0;

    try {
      const compDocRef = doc(db, 'competitions', compId);
      const compSnap = await getDoc(compDocRef);
      const isCupFormat = compSnap.exists() && compSnap.data().format === 'cup';

      const matchDocRef = doc(db, 'competitions', compId, 'matches', match.id);

      if (isCupFormat) {
        // =========================================================================
        // 🏆 JALUR FORMAT PIALA/CUP (KNOCKOUT ADVANCEMENT LOGIC)
        // =========================================================================
        let winnerId = '';
        let winnerName = '';
        let winnerIcon = '';

        if (homePen !== null && awayPen !== null) {
          if (homePen > awayPen) {
            winnerId = match.homeTeamId; winnerName = match.homeTeamName; winnerIcon = match.homeTeamIcon;
          } else {
            winnerId = match.awayTeamId; winnerName = match.awayTeamName; winnerIcon = match.awayTeamIcon;
          }
        } else {
          if (hScore > aScore) {
            winnerId = match.homeTeamId; winnerName = match.homeTeamName; winnerIcon = match.homeTeamIcon;
          } else {
            winnerId = match.awayTeamId; winnerName = match.awayTeamName; winnerIcon = match.awayTeamIcon;
          }
        }

        await runTransaction(db, async (transaction) => {
          const updatePayload = { status: 'finished' };
          if (homePen !== null) {
            updatePayload.homePenaltyScore = homePen;
            updatePayload.awayPenaltyScore = awayPen;
          }
          transaction.update(matchDocRef, updatePayload);

          if (match.nextMatchId && match.nextMatchSide) {
            const nextMatchDocRef = doc(db, 'competitions', compId, 'matches', match.nextMatchId);
            
            if (match.nextMatchSide === 'home') {
              transaction.update(nextMatchDocRef, {
                homeTeamId: winnerId,
                homeTeamName: winnerName,
                homeTeamIcon: winnerIcon
              });
            } else if (match.nextMatchSide === 'away') {
              transaction.update(nextMatchDocRef, {
                awayTeamId: winnerId,
                awayTeamName: winnerName,
                awayTeamIcon: winnerIcon
              });
            }
          }
        });

        alert(`🏆 BERSALIN SLOT!\n\n"${winnerName.toUpperCase()}" resmi memenangkan laga knockout dan melaju otomatis ke babak berikutnya!`);
      } else {
        // =========================================================================
        // 🔄 JALUR FORMAT LIGA STANDAR (ROUND ROBIN STATISTICS UPDATER)
        // =========================================================================
        let homeWin = 0, homeDraw = 0, homeLoss = 0, homePts = 0;
        let awayWin = 0, awayDraw = 0, awayLoss = 0, awayPts = 0;

        if (hScore > aScore) { homeWin = 1; homePts = 3; awayLoss = 1; }
        else if (hScore < aScore) { awayWin = 1; awayPts = 3; homeLoss = 1; }
        else { homeDraw = 1; homePts = 1; awayDraw = 1; awayPts = 1; }

        const homeTeamDocRef = doc(db, 'competitions', compId, 'teams', match.homeTeamId);
        const awayTeamDocRef = doc(db, 'competitions', compId, 'teams', match.awayTeamId);

        await runTransaction(db, async (transaction) => {
          const homeTeamDoc = await transaction.get(homeTeamDocRef);
          const awayTeamDoc = await transaction.get(awayTeamDocRef);

          if (!homeTeamDoc.exists() || !awayTeamDoc.exists()) throw "Dokumen tim tidak ditemukan!";
          const currentHomeStats = homeTeamDoc.data().stats;
          const currentAwayStats = awayTeamDoc.data().stats;

          transaction.update(matchDocRef, { status: 'finished' });
          transaction.update(homeTeamDocRef, {
            "stats.gamesPlayed": currentHomeStats.gamesPlayed + 1,
            "stats.wins": currentHomeStats.wins + homeWin,
            "stats.draws": currentHomeStats.draws + homeDraw,
            "stats.losses": currentHomeStats.losses + homeLoss,
            "stats.goalDifference": currentHomeStats.goalDifference + (hScore - aScore),
            "stats.points": currentHomeStats.points + homePts,
          });
          transaction.update(awayTeamDocRef, {
            "stats.gamesPlayed": currentAwayStats.gamesPlayed + 1,
            "stats.wins": currentAwayStats.wins + awayWin,
            "stats.draws": currentAwayStats.draws + awayDraw,
            "stats.losses": currentAwayStats.losses + awayLoss,
            "stats.goalDifference": currentAwayStats.goalDifference + (aScore - hScore),
            "stats.points": currentAwayStats.points + awayPts,
          });
        });
        alert("🚀 Pertandingan selesai! Tabel klasemen liga ter-kalkulasi otomatis!");
      }
      setFilter('finished');
    } catch (err) {
      console.error(err);
      alert("Gagal mengunci skor pertandingan. Cek konsol eror.");
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn text-white">
      
      {/* FILTER TOP PILL BUTTONS */}
      <div className="grid grid-cols-3 bg-[#18181f]/90 border border-gray-800/80 p-1 rounded-xl shadow-inner relative overflow-hidden">
        {['upcoming', 'live', 'finished'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`py-2 text-[11px] font-black rounded-lg capitalize transition-all duration-300 ${
              filter === type 
                ? 'bg-gradient-to-r from-neon-purple to-indigo-600 text-white shadow-md border border-neon-purple/20' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {type === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping mr-1" />}
            {type}
          </button>
        ))}
      </div>

      {/* MATCH CARD LIST */}
      <div className="flex flex-col gap-6">
        {Object.keys(groupedMatches).length > 0 ? (
          Object.keys(groupedMatches).map((compName) => {
            const compData = groupedMatches[compName];
            const roundNumbers = Object.keys(compData.rounds).map(Number).sort((a, b) => a - b);

            return (
              <div key={compName} className="flex flex-col gap-3.5">
                
                {/* COMPETITION HEADER */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#18181f] to-transparent px-3 py-2 rounded-xl border-l-2 border-neon-purple shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-black/40 w-6 h-6 rounded-md flex items-center justify-center border border-gray-800/50 shadow-inner">
                      {compData.compIcon}
                    </span>
                    <span className="text-xs font-black text-white tracking-wide uppercase">{compName}</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-600" />
                </div>

                {/* 🔁 RENDER ROUND ACCORDION STACK SEJAJAR */}
                <div className="flex flex-col gap-2.5">
                  {roundNumbers.map((roundNum) => {
                    const uniqueKey = `${compData.compId}_${roundNum}`;
                    const isExpanded = !!expandedRounds[uniqueKey];
                    const matchesInRound = compData.rounds[roundNum];

                    return (
                      <div key={roundNum} className="flex flex-col gap-2 border border-gray-900 bg-black/20 rounded-xl overflow-hidden transition-all">
                        
                        {/* 🔽 ACCORDION TRIGGER HEADER */}
                        <button 
                          onClick={() => toggleRoundAccordion(compData.compId, roundNum)}
                          className="w-full flex justify-between items-center bg-[#18181f]/70 hover:bg-[#18181f] px-4 py-3 text-left transition-colors group border-b border-gray-950"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-purple shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                            <span className="text-xs font-black text-white uppercase tracking-wider">
                              {matchesInRound[0]?.stage ? `Babak ${matchesInRound[0].stage.toUpperCase()}` : `Pekan ${roundNum}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{matchesInRound.length} Matches</span>
                            <ChevronDown 
                              size={14} 
                              className={`text-gray-500 group-hover:text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                            />
                          </div>
                        </button>

                        {/* 📋 ACCORDION INNER CONTENT: CARD MATCHES */}
                        {isExpanded && (
                          <div className="p-3 flex flex-col gap-3 animate-fadeIn">
                            {matchesInRound.map((match) => (
                              <div 
                                key={match.id} 
                                className={`bg-[#14141a] border rounded-2xl p-4 flex flex-col gap-3.5 shadow-md relative overflow-hidden transition-all duration-300 ${
                                  match.status === 'live' ? 'border-red-500/30 bg-gradient-to-b from-[#1c1214] to-[#14141a]' : 'border-gray-800/70'
                                }`}
                              >
                                {match.status === 'live' && <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />}

                                <div className="flex justify-between items-center relative z-10">
                                  <div className="flex items-center gap-3 w-28">
                                    <span className="text-base bg-black/40 w-7 h-7 rounded-lg flex items-center justify-center border border-gray-800/60 shadow-inner">{match.homeTeamIcon || '🛡️'}</span>
                                    <span className="text-xs font-black text-white truncate">{match.homeTeamName}</span>
                                  </div>

                                  <div className="flex flex-col items-center justify-center flex-1">
                                    {match.status === 'live' || match.status === 'finished' ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-3 text-sm font-black text-white bg-black/50 px-3 py-1 rounded-xl border border-gray-800/80 shadow-inner">
                                          <span className={match.status === 'live' ? 'text-neon-volt font-black text-base' : 'text-white'}>{match.homeScore ?? 0}</span>
                                          <span className="text-gray-600 font-normal text-xs">:</span>
                                          <span className={match.status === 'live' ? 'text-neon-volt font-black text-base' : 'text-white'}>{match.awayScore ?? 0}</span>
                                        </div>
                                        {/* Cetak Skor Penalti Info jika terkunci via adu tos-tosan */}
                                        {match.homePenaltyScore !== undefined && match.homePenaltyScore !== null && (
                                          <span className="text-[9px] text-neon-volt font-bold uppercase tracking-widest mt-1 bg-neon-volt/10 border border-neon-volt/20 px-1.5 py-0.5 rounded">
                                            Pen: ({match.homePenaltyScore} - {match.awayPenaltyScore})
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 bg-black/40 border border-gray-800/80 px-2.5 py-1 rounded-lg shadow-inner">
                                        <Calendar size={11} className="text-neon-purple" />
                                        <span className="text-[10px] font-black text-gray-300 tracking-wide">{match.time}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 w-28 justify-end">
                                    <span className="text-xs font-black text-white truncate text-right">{match.awayTeamName}</span>
                                    <span className="text-base bg-black/40 w-7 h-7 rounded-lg flex items-center justify-center border border-gray-800/60 shadow-inner">{match.awayTeamIcon || '🛡️'}</span>
                                  </div>
                                </div>

                                {/* CONSOLE ACTION BAR CONTROLS */}
                                <div className="border-t border-gray-900/60 pt-3 flex gap-2 relative z-10">
                                  {match.status === 'upcoming' && (
                                    <div className="grid grid-cols-3 gap-2 w-full">
                                      <button onClick={() => handleOpenLineupManager(compData.compId, match)} className="bg-[#1b1b22] border border-gray-800 text-gray-400 hover:text-white py-2 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold"><Users size={12} /> Lineup</button>
                                      <button onClick={() => handleStartLive(compData.compId, match.id)} className="col-span-2 text-center text-[10px] font-black bg-gradient-to-r from-neon-purple to-indigo-600 text-white py-2 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider"><Play size={10} /> Kick Off (LIVE)</button>
                                    </div>
                                  )}

                                  {match.status === 'live' && (
                                    <div className="flex flex-col gap-2.5 w-full">
                                      <div className="grid grid-cols-2 gap-3 text-center">
                                        <div className="flex items-center justify-between bg-black/40 p-1 px-2 rounded-xl border border-gray-800/50">
                                          <button onClick={() => handleUpdateLiveScore(compData.compId, match.id, 'homeScore', 'sub')} className="p-1.5 bg-zinc-800 rounded-lg text-gray-400 hover:text-white"><Minus size={10} /></button>
                                          <span className="text-[9px] font-black text-gray-500 uppercase">GOAL</span>
                                          <button onClick={() => handleUpdateLiveScore(compData.compId, match.id, 'homeScore', 'add')} className="p-1.5 bg-neon-purple/20 border border-neon-purple/20 rounded-lg text-neon-purple"><Plus size={10} /></button>
                                        </div>
                                        <div className="flex items-center justify-between bg-black/40 p-1 px-2 rounded-xl border border-gray-800/50">
                                          <button onClick={() => handleUpdateLiveScore(compData.compId, match.id, 'awayScore', 'sub')} className="p-1.5 bg-zinc-800 rounded-lg text-gray-400 hover:text-white"><Minus size={10} /></button>
                                          <span className="text-[9px] font-black text-gray-500 uppercase">GOAL</span>
                                          <button onClick={() => handleUpdateLiveScore(compData.compId, match.id, 'awayScore', 'add')} className="p-1.5 bg-neon-purple/20 border border-neon-purple/20 rounded-lg text-neon-purple"><Plus size={10} /></button>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 w-full">
                                        <button onClick={() => handleOpenLineupManager(compData.compId, match)} className="bg-[#1b1b22] border border-gray-800 text-gray-400 py-2 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold"><Users size={12} /> Lineup</button>
                                        <button onClick={() => handleFinishMatch(compData.compId, match)} className="col-span-2 text-center text-[10px] font-black bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider"><CheckCircle size={11} /> Finish Match</button>
                                      </div>
                                    </div>
                                  )}

                                  {match.status === 'finished' && (
                                    <div className="flex justify-between items-center w-full px-1">
                                      <button onClick={() => handleOpenLineupManager(compData.compId, match)} className="text-[10px] font-black text-gray-500 hover:text-white flex items-center gap-1 border border-gray-800 bg-black/20 px-2.5 py-1 rounded-lg"><Users size={11} /> View Lineup</button>
                                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">🛡️ Locked</span>
                                    </div>
                                  )}
                                </div>

                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-[#14141a] border border-gray-800/60 rounded-2xl px-4">
            <span className="text-2xl block mb-2">📡</span>
            <p className="text-xs text-gray-500 font-bold">Tidak ada pertandingan berstatus <span className="text-neon-purple font-black">"{filter}"</span> untuk akun lu.</p>
          </div>
        )}
      </div>

      {/* 🔮 MODAL POP-UP BARU: FORCED PENALTY SHOOTOUT INPUT DRAWER */}
      {showPenaltyModal && penaltyMatchData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] p-4 flex flex-col justify-end animate-fadeIn">
          <div className="bg-[#18181f] border border-gray-800 rounded-t-3xl p-4 w-full flex flex-col max-h-[50vh]">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-4">
              <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Trophy size={14} className="text-neon-volt" /> ADU PENALTY TIE-BREAKER
              </span>
              <button onClick={() => setShowPenaltyModal(false)} className="text-gray-500 hover:text-white p-1"><X size={16} /></button>
            </div>
            
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-normal text-center mb-3">
              Skor imbang {penaltyMatchData.match.homeScore} - {penaltyMatchData.match.awayScore} di babak gugur. Tentukan pemenang via adu tos-tosan:
            </p>

            <div className="grid grid-cols-3 gap-4 bg-black/40 p-4 border border-gray-800 rounded-xl items-center text-center mb-5 shadow-inner">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black truncate block text-white uppercase">{penaltyMatchData.match.homeTeamName}</span>
                <input 
                  type="number" 
                  value={homePenaltyInput} 
                  onChange={(e) => setHomePenaltyInput(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-gray-800 p-2 text-center text-sm rounded-xl text-white outline-none font-black focus:border-neon-purple"
                />
              </div>
              <span className="text-[11px] font-black text-gray-600">PENALTI</span>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black truncate block text-white uppercase">{penaltyMatchData.match.awayTeamName}</span>
                <input 
                  type="number" 
                  value={awayPenaltyInput} 
                  onChange={(e) => setAwayPenaltyInput(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-gray-800 p-2 text-center text-sm rounded-xl text-white outline-none font-black focus:border-neon-purple"
                />
              </div>
            </div>

            <button 
              onClick={handleExecutePenaltyFinish}
              className="w-full py-3.5 bg-gradient-to-r from-neon-volt to-emerald-500 text-black text-xs font-black rounded-xl uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
            >
              Kunci Kelolosan Tim 🚀
            </button>
          </div>
        </div>
      )}

      {/* LINEUP MODAL DRAWER (Original Lu) */}
      {showLineupModal && activeMatchContext && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 p-4 flex flex-col justify-end animate-fadeIn">
          <div className="bg-[#18181f]/95 border border-gray-800 rounded-t-3xl max-h-[85vh] flex flex-col p-4 w-full relative shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-3 mb-4"><span className="text-[10px] font-black uppercase tracking-widest text-white">Skuad Lineup Manager</span><button onClick={() => { setShowLineupModal(false); setActiveMatchContext(null); }} className="text-gray-500 hover:text-white p-1"><X size={18} /></button></div>
            
            <div className="bg-black/40 border border-gray-800/60 p-3 rounded-xl flex items-center justify-between text-center mb-4">
              <span className="text-xs font-black text-white truncate max-w-[110px]">{activeMatchContext.homeTeamName}</span>
              <span className="text-[10px] font-black bg-zinc-800 text-gray-400 px-2 py-0.5 rounded">VS</span>
              <span className="text-xs font-black text-white truncate max-w-[110px] text-right">{activeMatchContext.awayTeamName}</span>
            </div>

            {activeMatchContext.status !== 'finished' ? (
              <div className="flex flex-col gap-2 mb-4 bg-black/20 p-3 rounded-xl border border-gray-800/40">
                <div className="grid grid-cols-2 gap-2 p-0.5 bg-zinc-900 rounded-lg">
                  <button onClick={() => setSelectedTeamTarget('home')} className={`py-1.5 text-[10px] font-black rounded-md uppercase ${selectedTeamTarget === 'home' ? 'bg-neon-purple text-white' : 'text-gray-500'}`}>{activeMatchContext.homeTeamName}</button>
                  <button onClick={() => setSelectedTeamTarget('away')} className={`py-1.5 text-[10px] font-black rounded-md uppercase ${selectedTeamTarget === 'away' ? 'bg-neon-purple text-white' : 'text-gray-500'}`}>{activeMatchContext.awayTeamName}</button>
                </div>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={playerNameInput} onChange={(e) => setPlayerNameInput(e.target.value)} placeholder="Ketik nama pemain..." className="flex-1 bg-zinc-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-neon-purple font-bold" onKeyDown={(e) => { if(e.key === 'Enter') handleAddPlayerToLineup(); }} />
                  <button onClick={handleAddPlayerToLineup} className="p-2.5 bg-neon-purple text-white rounded-xl"><UserPlus size={16} /></button>
                </div>
              </div>
            ) : (
              <div className="mb-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-3 flex items-center gap-2 text-indigo-400"><ShieldAlert size={14} /><span className="text-[10px] font-bold uppercase">Official Match Skuad Roster Locked</span></div>
            )}

            <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto mb-4 max-h-56">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-1 block truncate">{activeMatchContext.homeTeamName}</span>
                {homeLineup.map((p, idx) => <div key={p.id} className="bg-black/20 px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5"><span className="text-[9px] text-gray-600">{idx+1}.</span>{p.name}</div>)}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-1 block truncate text-right">{activeMatchContext.awayTeamName}</span>
                {awayLineup.map((p, idx) => <div key={p.id} className="bg-black/20 px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-end gap-1.5">{p.name}<span className="text-[9px] text-gray-600">{idx+1}.</span></div>)}
              </div>
            </div>
            <button onClick={() => { setShowLineupModal(false); setActiveMatchContext(null); }} className="w-full py-3.5 bg-zinc-800 text-white text-xs font-black rounded-xl uppercase">Done & Back</button>
          </div>
        </div>
      )}

    </div>
  );
}