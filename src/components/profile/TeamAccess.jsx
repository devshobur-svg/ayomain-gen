import { UserPlus, Check, MoreVertical } from 'lucide-react';

export default function TeamAccess() {
  const members = [
    { name: 'Mike Williams', role: 'Organizer', tag: 'Owner', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=80&auto=format&fit=crop' },
    { name: 'Sarah Carter', role: 'Manager', tag: 'Manager', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=80&auto=format&fit=crop' },
    { name: 'David Brown', role: 'Coach', tag: 'Coach', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=80&auto=format&fit=crop' },
  ];

  const permissions = [
    { feature: 'Create Competition', roles: [true, true, false, false] },
    { feature: 'Edit Fixture', roles: [true, true, false, false] },
    { feature: 'Input Result', roles: [true, true, true, false] },
    { feature: 'View Standing', roles: [true, true, true, true] },
    { feature: 'Manage Team', roles: [true, true, true, false] },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      {/* Team Members Header & Button */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Team Members</span>
          <button className="text-[11px] bg-neon-purple text-white font-bold px-3 py-1.5 rounded-lg shadow flex items-center gap-1 hover:opacity-90 transition">
            <UserPlus size={12} /> Invite Member
          </button>
        </div>

        {/* Members List Container */}
        <div className="bg-card-bg border border-gray-800 rounded-xl p-2 flex flex-col gap-2">
          {members.map((m, idx) => (
            <div key={idx} className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-gray-800/40">
              <div className="flex items-center gap-3">
                <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="text-xs font-bold text-white">{m.name}</p>
                  <p className="text-[10px] text-gray-500">{m.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-800 rounded-md text-gray-400 border border-gray-700/50">{m.tag}</span>
                <button className="text-gray-500 hover:text-white"><MoreVertical size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Permission Matrix Table */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 px-1">Role Permission</h4>
        <div className="bg-card-bg border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 bg-black/10">
                  <th className="py-2.5 px-3 text-left">Feature</th>
                  <th className="py-2.5 px-1 text-center w-10">Org</th>
                  <th className="py-2.5 px-1 text-center w-10">Mgr</th>
                  <th className="py-2.5 px-1 text-center w-10">Cch</th>
                  <th className="py-2.5 px-1 text-center w-10">Vwr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-gray-400">
                {permissions.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01]">
                    <td className="py-2 px-3 font-medium text-white">{p.feature}</td>
                    {p.roles.map((allowed, rIdx) => (
                      <td key={rIdx} className="py-2 px-1 text-center">
                        {allowed ? (
                          <div className="flex justify-center"><Check size={12} className="text-green-500 stroke-[3]" /></div>
                        ) : (
                          <span className="text-gray-700 font-bold">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}