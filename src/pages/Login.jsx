import { useState } from 'react';
import { USERS, initials } from '../config/users';
import { useApp } from '../context/AppContext';
import { RoleBadge } from '../components/Badges';

export default function Login() {
  const { login } = useApp();
  const [selected, setSelected] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const tryLogin = () => {
    if (!selected) return;
    if (code === selected.passcode) {
      login(selected);
    } else {
      setError('Incorrect passcode');
      setCode('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-lg">V</div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Voltara GTM</h1>
            <p className="text-sm text-slate-500">Lead tracker · internal</p>
          </div>
        </div>

        {!selected ? (
          <>
            <p className="text-sm text-slate-600 mb-4">Pick your name:</p>
            <div className="space-y-2">
              {USERS.map(u => (
                <button
                  key={u.id}
                  onClick={() => { setSelected(u); setError(''); }}
                  className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                    {initials(u.name)}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-slate-900">{u.name}</div>
                    <div className="mt-1"><RoleBadge role={u.role} /></div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => { setSelected(null); setCode(''); setError(''); }} className="text-sm text-slate-500 hover:text-slate-700 mb-4">← Back</button>
            <p className="text-sm text-slate-600 mb-2">Hi <strong>{selected.name}</strong>, enter your 4-digit passcode:</p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && tryLogin()}
              className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="••••"
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            <button
              onClick={tryLogin}
              disabled={code.length !== 4}
              className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
