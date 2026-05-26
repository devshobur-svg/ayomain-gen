import { Home, PlusCircle, Trophy, User } from 'lucide-react';

export default function MainLayout({ children, activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'create', label: 'Create', icon: PlusCircle },
    { id: 'match-center', label: 'Matches', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-black flex justify-center items-center">
      {/* Bingkai mockup HP Simulator */}
      <div className="w-full max-w-md min-h-screen bg-dark-bg relative flex flex-col shadow-2xl border-x border-gray-900 overflow-y-auto">
        
        {/* Area Konten Utama Halaman */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-md border-t border-gray-800 px-6 py-3 flex justify-between items-center z-50">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center gap-1 focus:outline-none transition-colors"
              >
                <IconComponent 
                  size={24} 
                  className={isActive ? 'text-neon-purple' : 'text-gray-500'} 
                />
                <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
}