import { auth } from '@/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Settings, LogOut, Shield, Award, ChevronRight, User, Bell, Lock } from 'lucide-react';

export default function Profile() {
  const user = auth.currentUser;

  const handleLogout = () => {
    if(confirm("Yakin ingin keluar dari akun manajemen arena, Coach?")) {
      signOut(auth);
    }
  };

  const profileOptions = [
    { icon: User, label: "Edit Personal Info", desc: "Update your trainer profile details" },
    { icon: Lock, label: "Security & Password", desc: "Keep your database credentials guarded" },
    { icon: Bell, label: "Notification Signals", desc: "Configure direct match push metrics" },
    { icon: Shield, label: "Privacy Core Control", desc: "Manage federation system rights" },
  ];

  return (
    <div className="p-4 pb-28 animate-fadeIn text-white">
      {/* HEADER PROFILE */}
      <div className="flex flex-col items-center mt-6 mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-neon-purple blur-2xl opacity-20" />
          <div className="w-20 h-20 rounded-full border border-neon-purple p-1 relative z-10 shadow-lg bg-black/40">
            <img 
              src={user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
              className="w-full h-full rounded-full object-cover"
              alt="Avatar"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-neon-volt p-1 rounded-md border border-black z-20 shadow">
            <Award size={12} className="text-black font-black" />
          </div>
        </div>
        <h2 className="text-base font-black text-white mt-3.5 tracking-tight uppercase">{user?.displayName || 'Elite Manager'}</h2>
        <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mt-0.5">{user?.email || 'admin@ayomainbola.com'}</p>
      </div>

      {/* METRICS DASHBOARD LIST */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <div className="bg-[#14141a] border border-gray-800/80 p-3 rounded-xl text-center shadow-md">
          <span className="text-base font-black text-white block">Active</span>
          <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mt-1">Status</span>
        </div>
        <div className="bg-[#14141a] border border-gray-800/80 p-3 rounded-xl text-center shadow-md">
          <span className="text-base font-black text-neon-purple block">HQ</span>
          <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mt-1">Role Permission</span>
        </div>
        <div className="bg-[#14141a] border border-gray-800/80 p-3 rounded-xl text-center shadow-md">
          <span className="text-base font-black text-neon-volt block">100%</span>
          <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mt-1">Cloud Sync</span>
        </div>
      </div>

      {/* CORE CONFIG LIST OPTIONS */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Arena Settings & Policy</h3>
        
        {profileOptions.map((opt, i) => {
          const IconComponent = opt.icon;
          return (
            <button 
              key={i}
              className="flex items-center justify-between p-3.5 bg-[#14141a] border border-gray-800/70 rounded-xl hover:border-gray-700 transition-all active:scale-[0.98] group shadow-sm text-left"
            >
              <div className="flex items-center gap-3.5 truncate">
                <div className="p-2 bg-zinc-900/90 border border-gray-800/60 rounded-xl text-gray-400 group-hover:text-neon-purple transition-colors">
                  <IconComponent size={14} />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white tracking-wide uppercase text-[11px]">{opt.label}</p>
                  <p className="text-[9px] text-gray-500 truncate mt-0.5">{opt.desc}</p>
                </div>
              </div>
              <ChevronRight size={13} className="text-gray-700 group-hover:text-gray-400 transition-colors shrink-0 ml-1" />
            </button>
          );
        })}

        <button 
          onClick={handleLogout}
          className="mt-3 flex items-center justify-center gap-1.5 p-3.5 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-900/40 transition-all active:scale-[0.98] shadow-md"
        >
          <LogOut size={13} /> Log Out Arena System
        </button>
      </div>
    </div>
  );
}