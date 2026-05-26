import { Bell } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <div className="flex items-center justify-between p-4 bg-[#121212]">
      {/* Profil Section */}
      <div className="flex items-center gap-3">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop"
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover border border-neon-purple"
        />
        <div>
          <p className="text-xs text-gray-500">Tournament Organizer</p>
          <h3 className="text-sm font-semibold text-white flex items-center gap-1">
            Hi, Alice 👋
          </h3>
        </div>
      </div>

      {/* Right Action: Notif */}
      <div className="relative p-2 bg-card-bg rounded-xl border border-gray-800 cursor-pointer">
        <Bell size={18} className="text-white" />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
      </div>
    </div>
  );
}