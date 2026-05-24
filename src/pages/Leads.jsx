import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { USERS, userById } from '../config/users';
import { STAGES, PRIORITIES, PriorityBadge, StageBadge, LockIcon } from '../components/Badges';
import LeadForm from '../components/LeadForm';
import { canCreateLead, canViewFinancials, canAssignVisibility, formatValue } from '../utils/permissions';

export default function Leads() {
  const { visibleLeads, currentUser, addLead } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ stage: '', priority: '', owner: '', q: '' });

  const showFinancials = canViewFinancials(currentUser);
  const showVisibility = canAssignVisibility(currentUser);

  const filtered = useMemo(() => {
    return visibleLeads.filter(l => {
      if (filters.stage && l.stage !== filters.stage) return false;
      if (filters.priority && l.priority !== filters.priority) return false;
      if (filters.owner && l.owner !== filters.owner) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (!l.company.toLowerCase().includes(q) && !(l.contact || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [visibleLeads, filters]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
        {canCreateLead(currentUser) && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">+ Add Lead</button>
        )}
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
              {showVisibility && <th className="px-4 py-3">Visibility</th>}
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={showVisibility ? 8 : 7} className="px-4 py-10 text-center text-slate-400">No leads match.</td></tr>
            )}
            {filtered.map(l => {
              const restricted = !l.visibility || l.visibility.length < 2;
              return (
                <tr key={l.id} onClick={() => navigate(`/leads/${l.id}`)} className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <span className="inline-flex items-center gap-1.5">
                      {restricted && <LockIcon className="text-slate-400" />}
                      {l.company}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{l.contact}</td>
                  <td className="px-4 py-3"><StageBadge stage={l.stage} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={l.priority} /></td>
                  <td className="px-4 py-3 text-slate-600">{userById(l.owner)?.name}</td>
                  <td className="px-4 py-3 text-slate-700">{showFinancials ? (l.value ? `$${l.value.toLocaleString()}` : '—') : '—'}</td>
                  {showVisibility && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {(l.visibility || []).length === 0 && <span className="text-xs text-slate-400">Private</span>}
                        {(l.visibility || []).map(r => (
                          <span key={r} className="text-xs px-1.5 py-0.5 bg-slate-100 rounded capitalize">{r}</span>
                        ))}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(l.updatedAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <LeadForm
          currentUser={currentUser}
          onSave={(data) => { addLead(data); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
