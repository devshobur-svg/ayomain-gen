import { Plus, Trash2, Loader2, Grid, X } from 'lucide-react';
import { useState } from 'react';
import { db, auth } from '@/firebaseConfig'; // 👈 Mengamankan core instance auth terpusat
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

export default function StepTeamsGenerate({ onPrev, formData, onGenerateSuccess }) {
  // Data dummy awal berupa objek lengkap dengan icon benderanya (Original Lu)
  const [teams, setTeams] = useState([
    { name: 'FC Bayern', icon: '🇩🇪' },
    { name: 'Chelsea FC', icon: '🇬🇧' },
    { name: 'Manchester City', icon: '🦈' },
    { name: 'Arsenal FC', icon: '🔴' }
  ]);
  
  const [newTeam, setNewTeam] = useState('');
  const [selectedTeamIcon, setSelectedTeamIcon] = useState('🛡️');
  const [showTeamIconModal, setShowTeamIconModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const teamIconLibrary = [
    '🛡️', '⚽', '🥇', '🦁', '🦅', '🐺', '🦈', '🐉', '🔥', '⚡', '⭐', '👑',
    '🇲🇨', '🇩🇪', '🇬🇧', '🇪🇸', '🇮🇹', '🇫🇷', '🇯🇵', '🇰🇷', '🇧🇷', '🇦🇷', '🇺🇸', '🇳🇱',
    '🔴', '🔵', '🟢', '🟡', '⚫', '⚪', '🟠', '🟣', '🏹', '⚔️', '🏔️', '🌊'
  ];

  const handleAddTeam = () => {
    if (newTeam.trim()) {
      setTeams([...teams, { name: newTeam.trim(), icon: selectedTeamIcon }]);
      setNewTeam('');
      setSelectedTeamIcon('🛡️');
    }
  };

  const handleRemoveTeam = (index) => {
    setTeams(teams.filter((_, i) => i !== index));
  };

  // 🧠 ENGINE LIGA 1 (UPGRADED TO HOME & AWAY): Menghitung jadwal tanding silang otomatis dua putaran
  const generateRoundRobinFixtures = (teamsList) => {
    let list = [...teamsList];
    
    if (list.length % 2 !== 0) {
      list.push({ name: 'BYE', icon: '💤', isBye: true });
    }

    const numTeams = list.length;
    const roundsInLeg = numTeams - 1; // Jumlah pekan per satu putaran tunggal
    const halfSize = numTeams / 2;
    const leg1Fixtures = [];

    // =========================================================================
    // 🏠 PUTARAN 1: LEG FIRST (HOME MATCHES)
    // =========================================================================
    for (let round = 0; round < roundsInLeg; round++) {
      for (let i = 0; i < halfSize; i++) {
        const home = list[i];
        const away = list[numTeams - 1 - i];

        if (!home.isBye && !away.isBye) {
          leg1Fixtures.push({
            round: round + 1,
            homeTeamName: home.name,
            homeTeamIcon: home.icon,
            awayTeamName: away.name,
            awayTeamIcon: away.icon,
            homeScore: null,
            awayScore: null,
            status: 'upcoming',
            time: '16:00'
          });
        }
      }
      list.splice(1, 0, list.pop());
    }

    // =========================================================================
    // ✈️ PUTARAN 2: LEG SECOND (AWAY MATCHES - POSISI DIBALIK OTOMATIS)
    // =========================================================================
    const leg2Fixtures = leg1Fixtures.map(match => ({
      ...match,
      round: match.round + roundsInLeg, // Melanjutkan nomor pekan sekuensial (Contoh: Pekan 1 + 3 = Pekan 4)
      homeTeamName: match.awayTeamName,  // 👈 SEBALIKNYA: Away lama menjadi Home baru
      homeTeamIcon: match.awayTeamIcon,
      awayTeamName: match.homeTeamName,  // 👈 SEBALIKNYA: Home lama menjadi Away baru
      awayTeamIcon: match.homeTeamIcon,
    }));

    // Satukan kedua leg menjadi satu rangkaian kalender kompetisi penuh raksasa
    return [...leg1Fixtures, ...leg2Fixtures];
  };

  // 🧠 ENGINE PIALA 2: Pembuat bagan pohon biner otomatis untuk Sistem Gugur (Knockout Matrix)
  const generateKnockoutFixtures = (teamsList) => {
    const numTeams = teamsList.length;
    const fixtures = [];

    if (numTeams === 4) {
      // 🏆 FORMAT PRESET 4 TIM: Langsung Babak Semifinal
      fixtures.push({
        matchId: 'M1',
        round: 1, 
        stage: 'semifinal',
        homeTeamName: teamsList[0].name, homeTeamIcon: teamsList[0].icon,
        awayTeamName: teamsList[1].name, awayTeamIcon: teamsList[1].icon,
        homeScore: null, awayScore: null, homePenaltyScore: null, awayPenaltyScore: null,
        status: 'upcoming', time: '16:00', nextMatchId: 'M3', nextMatchSide: 'home'
      });
      fixtures.push({
        matchId: 'M2',
        round: 1,
        stage: 'semifinal',
        homeTeamName: teamsList[2].name, homeTeamIcon: teamsList[2].icon,
        awayTeamName: teamsList[3].name, awayTeamIcon: teamsList[3].icon,
        homeScore: null, awayScore: null, homePenaltyScore: null, awayPenaltyScore: null,
        status: 'upcoming', time: '18:00', nextMatchId: 'M3', nextMatchSide: 'away'
      });
      // Slot Kosong Grand Final Menunggu Pemenang
      fixtures.push({
        matchId: 'M3',
        round: 2,
        stage: 'final',
        homeTeamName: 'Pemenang Semifinal 1', homeTeamIcon: '🕒',
        awayTeamName: 'Pemenang Semifinal 2', awayTeamIcon: '🕒',
        homeScore: null, awayScore: null, homePenaltyScore: null, awayPenaltyScore: null,
        status: 'upcoming', time: '20:00', nextMatchId: null, nextMatchSide: null
      });
    } else if (numTeams === 8) {
      // 🏆 FORMAT PRESET 8 TIM: Mulai Babak Perempat Final (Quarterfinal)
      for (let i = 0; i < 4; i++) {
        const nextMId = i < 2 ? 'M5' : 'M6';
        const nextMSide = i % 2 === 0 ? 'home' : 'away';
        fixtures.push({
          matchId: `M${i + 1}`,
          round: 1,
          stage: 'quarterfinal',
          homeTeamName: teamsList[i * 2].name, homeTeamIcon: teamsList[i * 2].icon,
          awayTeamName: teamsList[i * 2 + 1].name, awayTeamIcon: teamsList[i * 2 + 1].icon,
          homeScore: null, awayScore: null, homePenaltyScore: null, awayPenaltyScore: null,
          status: 'upcoming', time: '14:00', nextMatchId: nextMId, nextMatchSide: nextMSide
        });
      }
      // Slot Kosong Semifinal
      fixtures.push({
        matchId: 'M5', round: 2, stage: 'semifinal',
        homeTeamName: 'Pemenang QF 1', homeTeamIcon: '🕒',
        awayTeamName: 'Pemenang QF 2', awayTeamIcon: '🕒',
        homeScore: null, awayScore: null, homePenaltyScore: null, awayPenaltyScore: null,
        status: 'upcoming', time: '17:00', nextMatchId: 'M7', nextMatchSide: 'home'
      });
      fixtures.push({
        matchId: 'M6', round: 2, stage: 'semifinal',
        homeTeamName: 'Pemenang QF 3', homeTeamIcon: '🕒',
        awayTeamName: 'Pemenang QF 4', awayTeamIcon: '🕒',
        homeScore: null, awayScore: null, homePenaltyScore: null, awayPenaltyScore: null,
        status: 'upcoming', time: '19:00', nextMatchId: 'M7', nextMatchSide: 'away'
      });
      // Slot Kosong Grand Final
      fixtures.push({
        matchId: 'M7', round: 3, stage: 'final',
        homeTeamName: 'Pemenang Semifinal 1', homeTeamIcon: '🕒',
        awayTeamName: 'Pemenang Semifinal 2', awayTeamIcon: '🕒',
        homeScore: null, awayScore: null, homePenaltyScore: null, awayPenaltyScore: null,
        status: 'upcoming', time: '21:00', nextMatchId: null, nextMatchSide: null
      });
    }
    return fixtures;
  };

  const handleExecuteFirebase = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return alert('Sesi login berakhir, silakan masuk kembali!');
    
    // 🛡️ VALIDASI PRESET SISTEM GUGUR (CUP)
    if (formData.format === 'cup' && teams.length !== 4 && teams.length !== 8) {
      return alert('⚠️ FORMAT PRESET PIALA KELUAR!\n\nUntuk sistem gugur (Cup Knockout), jumlah tim terdaftar wajib berjumlah pas 4 Tim (Semifinal) atau 8 Tim (Perempat Final) agar bagan tanding simetris, Coach!');
    }
    if (formData.format === 'league' && teams.length < 2) {
      return alert('Butuh minimal 2 tim untuk membuat turnamen format liga, Coach!');
    }
    
    setLoading(true);

    try {
      const batch = writeBatch(db);
      const compRef = doc(collection(db, 'competitions'));
      
      // 1. Pilih jalur algoritma jadwal berdasarkan format pilihan admin
      const generatedFixtures = formData.format === 'cup' 
        ? generateKnockoutFixtures(teams)
        : generateRoundRobinFixtures(teams);

      // 2. Tembak data spesifikasi induk kompetisi ke Firestore
      batch.set(compRef, {
        userId: currentUser.uid, 
        name: formData.name,
        sportType: formData.sportType,
        description: formData.description,
        icon: formData.icon,
        format: formData.format,
        rules: {
          ...formData.rules,
          extraTime: formData.format === 'cup' ? true : formData.rules.extraTime
        },
        teamCount: teams.length,
        status: 'active',
        createdAt: serverTimestamp()
      });

      // 3. Tanam data sub-koleksi /teams secara serentak
      teams.forEach((team, idx) => {
        const teamId = `team_${idx + 1}`;
        const teamRef = doc(db, 'competitions', compRef.id, 'teams', teamId);
        
        batch.set(teamRef, {
          userId: currentUser.uid, // 👈 INJEKSI EMAS: Gandeng ID admin langsung di level dokumen tim
          name: team.name,
          icon: team.icon,
          stats: { gamesPlayed: 0, points: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0 }
        });

        // Hubungkan relasi ID tim internal
        generatedFixtures.forEach(match => {
          if (match.homeTeamName === team.name) match.homeTeamId = teamId;
          if (match.awayTeamName === team.name) match.awayTeamId = teamId;
        });
      });

      // =========================================================================
      // 4. Tanam list jadwal pertandingan ke sub-koleksi /matches (DOCK_ID FIXED)
      // =========================================================================
      generatedFixtures.forEach((match, index) => {
        const customMatchDocumentId = formData.format === 'cup' ? match.matchId : `match_${index + 1}`;
        
        // 👈 INJEKSI EMAS KEDUA: Berikan identitas pemilik langsung ke dokumen match objek
        const secureMatchPayload = {
          ...match,
          userId: currentUser.uid 
        };

        const matchRef = doc(db, 'competitions', compRef.id, 'matches', customMatchDocumentId);
        batch.set(matchRef, secureMatchPayload);
      });

      await batch.commit();
      alert("🔥 BOOM! Kompetisi, Tim, dan Struktur Bagan Berhasil Disinkronisasi ke Cloud!");
      onGenerateSuccess();
    } catch (err) {
      console.error("Firebase Sync Error: ", err);
      alert("Terjadi kesalahan sistem saat mengunggah data jadwal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn relative">
      
      {/* POP-UP MODAL: MINI TEAM ICON PICKER */}
      {showTeamIconModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 p-4 flex flex-col justify-end animate-fadeIn">
          <div className="bg-[#18181f] border border-gray-800 rounded-t-3xl max-h-[60vh] flex flex-col p-4 w-full animate-slideUp">
            <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
              <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Grid size={13} className="text-neon-purple" /> Select Team Badge
              </span>
              <button onClick={() => setShowTeamIconModal(false)} className="text-gray-500 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-2 pr-1 content-start py-2">
              {teamIconLibrary.map((icon) => (
                <button
                  key={icon}
                  onClick={() => {
                    setSelectedTeamIcon(icon);
                    setShowTeamIconModal(false);
                  }}
                  className={`text-xl p-2 rounded-xl bg-[#1a1a1a] border transition active:scale-90 ${
                    selectedTeamIcon === icon ? 'border-neon-purple bg-neon-purple/10' : 'border-gray-800/60 hover:border-gray-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC LIVE REVIEW SUMMARY CARD */}
      <div className="bg-neon-purple/5 border border-neon-purple/20 rounded-xl p-3.5 flex items-start gap-3">
        <div className="text-xl bg-black/30 p-1.5 rounded-lg border border-gray-800/60 shadow-inner">
          {formData.icon}
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Competition Review</p>
          <p className="text-xs text-white font-black mt-0.5">{formData.name || 'Untitled tournament'}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5 capitalize">
            Format: {formData.format.replace('_', ' ')} • {formData.rules.duration} Mins • {formData.format === 'cup' ? 'Knockout Mode Active' : (formData.rules.extraTime ? 'Extra Time On' : 'No Extra Time')}
          </p>
        </div>
      </div>

      {/* INPUT FORM: TEAM NAME & LOGO */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Register Teams ({teams.length})</label>
          {formData.format === 'cup' && (
            <span className="text-[9px] font-black text-neon-volt uppercase tracking-wider bg-neon-volt/10 border border-neon-volt/20 px-2 py-0.5 rounded-md">
              Target: 4 atau 8 Tim
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTeamIconModal(true)}
            className="w-12 h-12 bg-card-bg border border-gray-800 rounded-xl text-xl flex items-center justify-center hover:border-neon-purple transition active:scale-95 shadow-inner"
            title="Click to change team badge"
          >
            {selectedTeamIcon}
          </button>
          
          <input
            type="text"
            value={newTeam}
            onChange={(e) => setNewTeam(e.target.value)}
            placeholder="Enter Team Name..."
            className="flex-1 bg-card-bg border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-neon-purple outline-none shadow-inner"
            onKeyDown={(e) => { if(e.key === 'Enter') handleAddTeam(); }}
          />
          
          <button 
            onClick={handleAddTeam} 
            className="px-4 bg-neon-purple text-white rounded-xl active:scale-95 transition-all shadow-md shadow-neon-purple/20 flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* RENDER LIST OF REGISTERED TEAMS */}
      <div className="max-h-48 overflow-y-auto bg-card-bg border border-gray-800 rounded-xl p-2 flex flex-col gap-1.5 shadow-inner">
        {teams.map((team, index) => (
          <div key={index} className="flex justify-between items-center bg-[#151515] px-3.5 py-2.5 rounded-lg border border-gray-800/40 group">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-black text-gray-600 w-4">{index + 1}.</span>
              <span className="text-sm bg-black/40 w-7 h-7 rounded-md flex items-center justify-center border border-gray-800/60 shadow-sm">{team.icon}</span>
              <span className="text-xs font-bold text-white truncate max-w-[180px]">{team.name}</span>
            </div>
            <button onClick={() => handleRemoveTeam(index)} className="text-gray-600 hover:text-red-500 p-1 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* BUTTON FOOTER NAVIGATION */}
      <div className="grid grid-cols-3 gap-2.5 mt-2">
        <button onClick={onPrev} disabled={loading} className="py-3.5 bg-card-bg border border-gray-800 text-white text-xs font-bold rounded-xl uppercase tracking-wider">Back</button>
        <button
          onClick={handleExecuteFirebase}
          disabled={loading || teams.length < 2}
          className="col-span-2 py-3.5 bg-gradient-to-r from-neon-purple to-indigo-600 text-white text-xs font-black rounded-xl shadow-lg flex justify-center items-center gap-2 uppercase tracking-wide transition-all active:scale-95 disabled:opacity-30"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : 'Generate & Sync Tournament 🚀'}
        </button>
      </div>

    </div>
  );
}