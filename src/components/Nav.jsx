import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { initials } from '../config/users';

const linkBase = 'px-3 py-2 rounded-md text-sm font-medium transition-colors';

export default function Nav() {
  const { currentUser, logout } = useApp();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center font-bold">V</div>
          <span className="font-semibold tracking-tight">Voltara GTM</span>
        </div>
        <nav className="flex gap-1 flex-1">
          {[
            ['/', 'Dashboard'],
            ['/leads', 'Leads'],
            ['/pitches', 'Pitches'],
            ['/content', 'Content'],
          ].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? 'bg-blue-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">
              {initials(currentUser.name)}
            </div>
            <div className="text-sm">
              <div className="text-white font-medium">{currentUser.name}</div>
              <div className="text-slate-400 text-xs">{currentUser.role}</div>
            </div>
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
