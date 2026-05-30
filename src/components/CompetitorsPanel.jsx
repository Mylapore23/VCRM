import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { canEdit } from '../utils/permissions';

const STATUSES = ['Watching', 'Evaluating', 'Shortlisted', 'Incumbent', 'Active Bid', 'Defeated', 'Lost To'];
const THREATS = ['High', 'Medium', 'Low'];

const STATUS_STYLES = {
  Watching: 'bg-slate-100 text-slate-700 border-slate-200',
  Evaluating: 'bg-blue-100 text-blue-700 border-blue-200',
  Shortlisted: 'bg-purple-100 text-purple-700 border-purple-200',
  Incumbent: 'bg-amber-100 text-amber-700 border-amber-200',
  'Active Bid': 'bg-orange-100 text-orange-700 border-orange-200',
  Defeated: 'bg-green-100 text-green-700 border-green-200',
  'Lost To': 'bg-red-100 text-red-700 border-red-200',
};

const THREAT_STYLES = {
  High: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function CompetitorsPanel({ lead }) {
  const { currentUser, addCompetitor, updateCompetitor, removeCompetitor } = useApp();
  const editable = canEdit(lead, currentUser);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const competitors = lead.competitors || [];

  return (
    <div className="mt-6 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Competition</h4>
          <p className="text-xs text-slate-500">Who else is in the room and where they stand.</p>
        </div>
        {editable && !adding && (
          <button onClick={() => { setAdding(true); setEditingId(null); }} className="text-sm text-blue-600 hover:underline">+ Add Competitor</button>
        )}
      </div>

      {competitors.length === 0 && !adding && (
        <p className="text-xs text-slate-400">No competitors tracked.</p>
      )}

      <ul className="space-y-2">
        {competitors.map(c => (
          <li key={c.id}>
            {editingId === c.id ? (
              <CompetitorForm
                initial={c}
                onCancel={() => setEditingId(null)}
                onSave={(patch) => { updateCompetitor(lead.id, c.id, patch); setEditingId(null); }}
              />
            ) : (
              <div className="flex items-start justify-between gap-3 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">{c.name}</span>
                    {c.status && <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_STYLES[c.status] || ''}`}>{c.status}</span>}
                    {c.threatLevel && <span className={`text-xs px-1.5 py-0.5 rounded border ${THREAT_STYLES[c.threatLevel] || ''}`}>Threat: {c.threatLevel}</span>}
                  </div>
                  {c.notes && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{c.notes}</p>}
                  <div className="text-xs text-slate-400 mt-1">Updated {new Date(c.updatedAt).toLocaleDateString()}</div>
                </div>
                {editable && (
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => { setEditingId(c.id); setAdding(false); }} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => { if (confirm(`Remove ${c.name}?`)) removeCompetitor(lead.id, c.id); }} className="text-red-600 hover:underline">Remove</button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding && (
        <div className="mt-2">
          <CompetitorForm
            onCancel={() => setAdding(false)}
            onSave={(payload) => { addCompetitor(lead.id, payload); setAdding(false); }}
          />
        </div>
      )}
    </div>
  );
}

function CompetitorForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    status: initial?.status || 'Watching',
    threatLevel: initial?.threatLevel || 'Medium',
    notes: initial?.notes || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      status: form.status,
      threatLevel: form.threatLevel,
      notes: form.notes.trim(),
    });
  };

  const cls = 'w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:border-blue-500 focus:outline-none';

  return (
    <form onSubmit={submit} className="bg-white border border-blue-200 rounded-md p-3 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Competitor name *" className={cls} />
        <select value={form.status} onChange={e => set('status', e.target.value)} className={cls}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={form.threatLevel} onChange={e => set('threatLevel', e.target.value)} className={cls}>
          {THREATS.map(t => <option key={t} value={t}>Threat: {t}</option>)}
        </select>
      </div>
      <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Where they stand, who they're talking to, what they're offering..." className={cls} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
        <button type="submit" className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
}
