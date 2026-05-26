import { useState, useEffect } from 'react';
import { auth } from '@/firebaseConfig'; // 👈 Import Auth
import { onAuthStateChanged } from 'firebase/auth'; // 👈 Import Listener
import { Home, PlusCircle, Trophy, User, Loader2 } from 'lucide-react';
import LoginPage from './pages/LoginPage'; // 👈 Halaman Login Baru
import Dashboard from './pages/Dashboard';
import CreateCompetition from './pages/CreateCompetition';
import MatchCenter from './pages/MatchCenter';
import Profile from './pages/Profile';
import PublicViewer from './pages/public/PublicViewer'; // 🆕 Import file wrapper publik baru kita nanti

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null); // 👈 State User
  const [initializing, setInitializing] = useState(true); // 👈 State Loading Awal
  
  // 🔽 STATE BARU: Untuk menyimpan ID kompetisi yang dibagikan lewat URL
  const [shareId, setShareId] = useState(null);

  // 🛰️ Real-time Auth & URL Interceptor Listener
  useEffect(() => {
    // 🔗 Cek apakah ada parameter "?share=ID_KOMPETISI" di URL browser
    const params = new URLSearchParams(window.location.search);
    const compIdFromUrl = params.get('share');
    if (compIdFromUrl) {
      setShareId(compIdFromUrl);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <Loader2 className="text-neon-purple animate-spin" size={32} />
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Opening Arena Gates...</span>
      </div>
    );
  }

  // 👁️ MODE PENONTON PUBLIK: Jika membuka lewat share link, bypass login dan kunci layout tanpa bottom nav
  if (shareId) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center overflow-x-hidden p-2">
        <div className="w-full max-w-md min-h-screen bg-dark-bg relative flex flex-col shadow-2xl border-x border-gray-950 overflow-hidden rounded-3xl">
          <main className="flex-1 overflow-y-auto text-white">
            <PublicViewer compId={shareId} onBackToAdmin={() => setShareId(null)} />
          </main>
        </div>
      </div>
    );
  }

  // 🛡️ MODE ADMIN HUB: Jika tidak ada share link dan tidak ada user login, paksa masuk ke LoginPage
  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (activeTab) {
      // 🔥 CRITICAL INJECTION: Sekarang objek data 'user' dialirkan masuk sebagai props ke Dashboard
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} user={user} />;
      case 'create': return <CreateCompetition />;
      case 'match-center': return <MatchCenter />;
      case 'profile': return <Profile />;
      default: return <Dashboard setActiveTab={setActiveTab} user={user} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'create', label: 'Create', icon: PlusCircle },
    { id: 'match-center', label: 'Matches', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-black flex justify-center items-center overflow-x-hidden p-2">
      <div className="w-full max-w-md min-h-screen bg-dark-bg relative flex flex-col shadow-2xl border-x border-gray-950 overflow-hidden rounded-3xl">
        <main className="flex-1 overflow-y-auto pb-24 text-white">
          {renderPage()}
        </main>
        
        {/* FIXED BOTTOM NAVIGATION BAR ADMIN (Hanya dirender pada mode Admin internal) */}
        <nav className="fixed bottom-0 w-full max-w-md bg-[#121212]/80 backdrop-blur-xl border-t border-gray-800/80 px-6 py-3 flex justify-between items-center z-50 shadow-2xl">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className="flex flex-col items-center gap-1 active:scale-90 transition-all">
                <IconComponent size={18} className={`transition-colors duration-200 ${isActive ? 'text-neon-purple' : 'text-gray-500'}`} />
                <span className={`text-[9px] font-bold tracking-wider transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-500'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default App;