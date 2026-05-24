import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { userById } from '../config/users';

export default function PitchDocs() {
  const { data, visibleLeads } = useApp();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  const visibleLeadIds = new Set(visibleLeads.map(l => l.id));
  const pitches = data.pitchDocs.filter(p => visibleLeadIds.has(p.leadId));

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Pitch Docs</h1>
        <button onClick={() => setPicking(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">+ New Pitch</button>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {pitches.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">No pitches yet.</td></tr>
            )}
            {pitches.map(p => {
              const lead = data.leads.find(l => l.id === p.leadId);
              return (
                <tr
                  key={p.id}
                  onClick={() => lead && navigate(`/leads/${lead.id}`)}
                  className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{p.title}</td>
                  <td className="px-4 py-3 text-slate-600">{lead?.company || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{userById(p.author)?.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.updatedAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {picking && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setPicking(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Select a company</h3>
            <div className="space-y-1">
              {visibleLeads.map(l => (
                <Link
                  key={l.id}
                  to={`/leads/${l.id}`}
                  onClick={() => setPicking(false)}
                  className="block px-3 py-2 hover:bg-blue-50 rounded text-sm"
                >
                  <div className="font-medium text-slate-900">{l.company}</div>
                  <div className="text-xs text-slate-500">{l.contact} · {l.stage}</div>
                </Link>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">Pitches are created from the lead's Pitch tab.</p>
          </div>
        </div>
      )}
    </div>
  );
}
