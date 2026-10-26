import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Layers, Kanban, Users } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#090E1A]/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.7)]">
      <div className="flex justify-around items-center h-16 px-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex-1 min-w-0 flex flex-col items-center justify-center gap-1 h-full py-1 transition-all ${
              isActive ? 'text-[#00C2FF] font-bold drop-shadow-[0_0_8px_rgba(0,194,255,0.6)]' : 'text-gray-400 hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] truncate tracking-tight">Dashboard</span>
        </NavLink>

        <NavLink
          to="/machines"
          className={({ isActive }) =>
            `flex-1 min-w-0 flex flex-col items-center justify-center gap-1 h-full py-1 transition-all ${
              isActive ? 'text-[#00C2FF] font-bold drop-shadow-[0_0_8px_rgba(0,194,255,0.6)]' : 'text-gray-400 hover:text-white'
            }`
          }
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] truncate tracking-tight">Estoque</span>
        </NavLink>

        <NavLink
          to="/pipeline"
          className={({ isActive }) =>
            `flex-1 min-w-0 flex flex-col items-center justify-center gap-1 h-full py-1 transition-all ${
              isActive ? 'text-[#00C2FF] font-bold drop-shadow-[0_0_8px_rgba(0,194,255,0.6)]' : 'text-gray-400 hover:text-white'
            }`
          }
        >
          <Kanban className="w-5 h-5" />
          <span className="text-[10px] truncate tracking-tight">Funil</span>
        </NavLink>

        <NavLink
          to="/leads"
          className={({ isActive }) =>
            `flex-1 min-w-0 flex flex-col items-center justify-center gap-1 h-full py-1 transition-all ${
              isActive ? 'text-[#00C2FF] font-bold drop-shadow-[0_0_8px_rgba(0,194,255,0.6)]' : 'text-gray-400 hover:text-white'
            }`
          }
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] truncate tracking-tight">Clientes</span>
        </NavLink>
      </div>
    </nav>
  );
};
