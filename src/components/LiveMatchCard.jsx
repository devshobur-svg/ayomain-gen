export default function LiveMatchCard() {
  return (
    <div className="px-4 py-2">
      <div className="flex justify-between items-center mb-2 px-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Live Match</h4>
        <span className="text-xs text-neon-purple font-semibold cursor-pointer hover:underline">See All</span>
      </div>

      <div className="bg-card-bg border border-gray-800 rounded-2xl p-4 relative overflow-hidden">
        {/* Neon Glow Aksen di Atas Card */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-50" />

        {/* Status Match */}
        <div className="flex justify-center items-center gap-1.5 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live</span>
          <span className="text-[10px] font-medium text-gray-500 ml-1">1st Half 18:10</span>
        </div>

        {/* Versus Row */}
        <div className="flex justify-between items-center px-4">
          {/* Tim Home */}
          <div className="flex flex-col items-center gap-1 w-20">
            <img src="https://flagcdn.com/w80/de.png" alt="Bayern" className="w-10 h-10 rounded-full object-cover border border-gray-800 shadow" />
            <span className="text-xs font-bold text-white text-center truncate w-full">Bayern</span>
          </div>

          {/* Skor */}
          <div className="flex items-center gap-4">
            <span className="text-3xl font-black text-white">2</span>
            <span className="text-xs font-bold text-gray-600">:</span>
            <span className="text-3xl font-black text-white">0</span>
          </div>

          {/* Tim Away */}
          <div className="flex flex-col items-center gap-1 w-20">
            <img src="https://flagcdn.com/w80/gb-eng.png" alt="Chelsea" className="w-10 h-10 rounded-full object-cover border border-gray-800 shadow" />
            <span className="text-xs font-bold text-white text-center truncate w-full">Chelsea</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex justify-center">
          <button className="w-full max-w-[200px] py-2 bg-neon-purple text-white text-xs font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all">
            View Match Center
          </button>
        </div>
      </div>
    </div>
  );
}