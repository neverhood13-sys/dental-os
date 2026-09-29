import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Clinic, Profile } from '../../types';

const items = [
  { to: '/app/patients', label: 'Пациенты', icon: '👥' },
  { to: '/app/treatment', label: 'Планы лечения', icon: '🦷' },
  { to: '/app/calendar', label: 'Календарь', icon: '📅' },
  { to: '/app/price', label: 'Прайс-лист', icon: '💰' },
  { to: '/app/finance', label: 'Финансы', icon: '📊' },
];

function roleLabel(r: string) {
  return r === 'chief_doctor' ? 'Главный врач' : r === 'admin' ? 'Администратор' : 'Врач';
}

export default function AppShell({ profile, clinic }: { profile: Profile; clinic: Clinic }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-3 left-3 z-50 md:hidden px-3 py-2 rounded-xl bg-white shadow border border-gray-200"
        aria-label="Меню"
      >
        {open ? '✕' : '☰'}
      </button>

      <aside
        className={`
          fixed md:static top-0 left-0 h-screen w-64 bg-white/80 backdrop-blur-xl
          border-r border-gray-200 z-40 flex flex-col
          transform transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 pt-16 md:pt-6">
          <div className="text-lg font-semibold text-gray-800">DentalOS</div>
          <div className="text-xs text-gray-500 mt-1">{clinic.name}</div>
        </div>

        <nav className="px-3 space-y-1 flex-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span>{it.icon}</span> {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 text-xs text-gray-500">
            {profile.full_name} · {roleLabel(profile.role)}
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100"
          >
            Выйти
          </button>
        </div>
      </aside>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
        />
      )}

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}