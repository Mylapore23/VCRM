import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { USERS, userById } from '../config/users';
import { STAGES, PRIORITIES, PriorityBadge, StageBadge } from '../components/Badges';
import LeadForm from '../components/LeadForm';

export default function Leads() {
  const { data, addLead } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ stage: '', priority: '', owner: '', q: '' });

  const filtered = useMemo(() => {
    return data.leads.filter(l => {
      if (filters.stage && l.stage !== filters.stage) return false;
      if (filters.priority && l.priority !== filters.priority) return false;
      if (filters.owner && l.owner !== filters.owner) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (!l.company.toLowerCase().includes(q) && !(l.contact || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data.leads, filters]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">+ Add Lead</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 flex flex-wrap gap-2">
        <input
          placeholder="Search company or contact..."
          value={filters.q}
          onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
        <select value={filters.stage} onChange={e => setFilters(f => ({ ...f, stage: e.target.value }))} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={filters.owner} onChange={e => setFilters(f => ({ ...f, owner: e.target.value }))} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          <option value="">All Owners</option>
          {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No leads match.</td></tr>
            )}
            {filtered.map(l => (
              <tr
                key={l.id}
                onClick={() => navigate(`/leads/${l.id}`)}
                className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer"
              >
                <td className="px-4 py-3 font-medium text-slate-900">{l.company}</td>
                <td className="px-4 py-3 text-slate-600">{l.contact}</td>
                <td className="px-4 py-3"><StageBadge stage={l.stage} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={l.priority} /></td>
                <td className="px-4 py-3 text-slate-600">{userById(l.owner)?.name}</td>
                <td className="px-4 py-3 text-slate-700">{l.value ? `$${l.value.toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(l.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <LeadForm
          onSave={(data) => { addLead(data); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
