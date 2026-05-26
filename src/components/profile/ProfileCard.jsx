import { Settings, Shield } from 'lucide-react';

export default function ProfileCard() {
  const managedLeagues = [
    { id: 1, name: 'Summer League 2024', role: 'Organizer' },
    { id: 2, name: 'Champions Cup', role: 'Admin' }
  ];

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      {/* Bio Section */}
      <div className="bg-card-bg border border-gray-800 rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-white transition">
          <Settings size={18} />
        </button>

        <img
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop"
          alt="Alice Johnson"
          className="w-20 h-20 rounded-full object-cover border-2 border-neon-purple shadow-xl mb-3"
        />

        <h2 className="text-base font-bold text-white">Alice Johnson</h2>
        <div className="flex items-center gap-1 bg-neon-purple/10 border border-neon-purple/20 px-2.5 py-0.5 rounded-full mt-1">
          <Shield size={12} className="text-neon-purple" />
          <span className="text-[10px] text-neon-purple font-bold uppercase tracking-wider">Organizer</span>
        </div>

        <div className="mt-4 w-full border-t border-gray-800/60 pt-4 flex flex-col gap-1.5 text-xs text-gray-400">
          <p className="flex justify-between"><span>Email:</span> <span className="text-white font-medium">alice.johnson@email.com</span></p>
          <p className="flex justify-between"><span>Phone:</span> <span className="text-white font-medium">+62 812 3456 7890</span></p>
        </div>
      </div>

      {/* My Competitions Mini List */}
      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">My Competitions</h4>
          <span className="text-xs text-neon-purple font-semibold hover:underline cursor-pointer">See All</span>
        </div>

        <div className="flex flex-col gap-2">
          {managedLeagues.map((league) => (
            <div key={league.id} className="bg-card-bg border border-gray-800 p-3.5 rounded-xl flex justify-between items-center hover:border-gray-700 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="text-xs font-bold text-white">{league.name}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Role: {league.role}</p>
                </div>
              </div>
              <span className="text-gray-600 text-xs font-bold">&gt;</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}