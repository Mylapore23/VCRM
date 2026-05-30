import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { USERS, userById } from '../config/users';
import { LockIcon, ReminderFlag } from '../components/Badges';
import LeadForm from '../components/LeadForm';
import { canCreateLead, canViewFinancials, canAssignVisibility } from '../utils/permissions';
import { reminderFlag, flagLabel } from '../utils/reminders';
import { leadPipelineValue, leadTotalValue } from '../utils/value';

export default function Leads() {
  const { visibleLeads, currentUser, addLead } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ owner: '', q: '', partner: '' });

  const showFinancials = canViewFinancials(currentUser);
  const showVisibility = canAssignVisibility(currentUser);

  const filtered = useMemo(() => {
    return visibleLeads.filter(l => {
      if (filters.owner && l.owner !== filters.owner) return false;
      if (filters.partner === '__yes' && !l.partner) return false;
      if (filters.partner === '__no' && l.partner) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (
          !l.company.toLowerCase().includes(q) &&
          !(l.contact || '').toLowerCase().includes(q) &&
          !(l.partner || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [visibleLeads, filters]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
        {canCreateLead(currentUser) && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">+ Add Account</button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 flex flex-wrap gap-2">
        <input
          placeholder="Search company, contact, partner..."
          value={filters.q}
          onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
        <select value={filters.owner} onChange={e => setFilters(f => ({ ...f, owner: e.target.value }))} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          <option value="">All Owners</option>
          {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={filters.partner} onChange={e => setFilters(f => ({ ...f, partner: e.target.value }))} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          <option value="">Partner: any</option>
          <option value="__yes">With partner</option>
          <option value="__no">Direct only</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Primary Contact</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Partner</th>
              <th className="px-4 py-3">Opps</th>
              <th className="px-4 py-3">Pipeline</th>
              {showVisibility && <th className="px-4 py-3">Visibility</th>}
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={showVisibility ? 8 : 7} className="px-4 py-10 text-center text-slate-400">No accounts match.</td></tr>
            )}
            {filtered.map(l => {
              const restricted = !l.visibility || l.visibility.length < 2;
              const flag = reminderFlag(l);
              const opps = l.subLeads?.length || 0;
              const pipeline = leadPipelineValue(l);
              const total = leadTotalValue(l);
              return (
                <tr key={l.id} onClick={() => navigate(`/leads/${l.id}`)} className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <span className="inline-flex items-center gap-1.5">
                      <ReminderFlag flag={flag} title={flagLabel(flag)} />
                      {restricted && <LockIcon className="text-slate-400" />}
                      {l.company}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{l.contact || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{userById(l.owner)?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{l.partner || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{opps}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {showFinancials && pipeline > 0 ? (
                      <span title={total !== pipeline ? `Open $${pipeline.toLocaleString()} of $${total.toLocaleString()} total` : ''}>
                        ${pipeline.toLocaleString()}
                      </span>
                    ) : '—'}
                  </td>
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
          onSave={(data) => { const l = addLead(data); setShowForm(false); navigate(`/leads/${l.id}`); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
