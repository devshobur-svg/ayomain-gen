import { Trophy, Calendar, Radio, CheckCircle2 } from 'lucide-react';

export default function QuickStats() {
  const stats = [
    { label: 'Teams', value: 16, icon: Trophy, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Matches', value: 48, icon: Calendar, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Live', value: 3, icon: Radio, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Finished', value: 22, icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="px-4 py-2">
      {/* Dropdown Selector Liga */}
      <div className="mb-4">
        <select className="w-full bg-card-bg text-white text-sm font-semibold p-3 rounded-xl border border-gray-800 focus:outline-none focus:border-neon-purple appearance-none cursor-pointer">
          <option>Summer League 2024</option>
          <option>Champions Cup</option>
        </select>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-card-bg border border-gray-800 p-3 rounded-xl flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-medium">{stat.label}</p>
                <p className="text-base font-bold text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Box */}
      <div className="bg-card-bg border border-gray-800 p-3 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400 font-medium">Progress</span>
          <span className="text-xs text-neon-purple font-bold">45%</span>
        </div>
        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div className="bg-neon-purple h-full rounded-full transition-all duration-500" style={{ width: '45%' }} />
        </div>
        <p className="text-[10px] text-gray-500 mt-1.5 text-right font-medium">Knockout Stage</p>
      </div>
    </div>
  );
}