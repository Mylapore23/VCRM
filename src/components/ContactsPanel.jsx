import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { canEdit } from '../utils/permissions';

const CONTACT_KINDS = ['Champion', 'Decision Maker', 'Economic Buyer', 'Technical Buyer', 'Influencer', 'Gatekeeper', 'End User', 'Blocker', 'Other'];
const CONTACT_DOMAINS = ['Business', 'IT', 'Executive Leadership', 'Procurement', 'Finance', 'Legal', 'Other'];

const KIND_STYLES = {
  Champion: 'bg-green-100 text-green-700',
  'Decision Maker': 'bg-indigo-100 text-indigo-700',
  'Economic Buyer': 'bg-purple-100 text-purple-700',
  'Technical Buyer': 'bg-blue-100 text-blue-700',
  Influencer: 'bg-teal-100 text-teal-700',
  Gatekeeper: 'bg-amber-100 text-amber-700',
  'End User': 'bg-slate-100 text-slate-700',
  Blocker: 'bg-red-100 text-red-700',
  Other: 'bg-slate-100 text-slate-600',
};

const DOMAIN_STYLES = {
  Business: 'bg-blue-50 text-blue-700 border-blue-200',
  IT: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Executive Leadership': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Procurement: 'bg-amber-50 text-amber-700 border-amber-200',
  Finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Legal: 'bg-slate-50 text-slate-700 border-slate-200',
  Other: 'bg-slate-50 text-slate-600 border-slate-200',
};

function normaliseLinkedIn(url) {
  if (!url) return '';
  const v = url.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('linkedin.com') || v.startsWith('www.linkedin.com')) return `https://${v}`;
  if (v.startsWith('/in/') || v.startsWith('in/')) return `https://www.linkedin.com${v.startsWith('/') ? '' : '/'}${v}`;
  return `https://www.linkedin.com/in/${v.replace(/^@/, '')}`;
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19 3A2 2 0 0 1 21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18V9.92H5.67V18h2.67zM7 8.74a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zM18.34 18v-4.42c0-2.39-1.28-3.5-2.98-3.5-1.38 0-2 .76-2.34 1.29V9.92h-2.67V18h2.67v-4.5c0-.25.02-.5.1-.68.18-.5.65-1.02 1.41-1.02 1 0 1.4.76 1.4 1.87V18h2.41z" />
    </svg>
  );
}

export default function ContactsPanel({ lead }) {
  const { currentUser, addContact, updateContact, removeContact } = useApp();
  const editable = canEdit(lead, currentUser);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  return (
    <div className="mt-6 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-900">Additional Contacts</h4>
        {editable && !adding && (
          <button onClick={() => { setAdding(true); setEditingId(null); }} className="text-sm text-blue-600 hover:underline">+ Add Contact</button>
        )}
      </div>

      {(lead.contacts || []).length === 0 && !adding && (
        <p className="text-xs text-slate-400">No additional contacts.</p>
      )}

      <ul className="space-y-2">
        {(lead.contacts || []).map(c => (
          <li key={c.id}>
            {editingId === c.id ? (
              <ContactForm
                initial={c}
                onCancel={() => setEditingId(null)}
                onSave={(patch) => { updateContact(lead.id, c.id, patch); setEditingId(null); }}
              />
            ) : (
              <div className="flex items-start justify-between gap-3 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">{c.name}{c.role ? <span className="text-slate-500 font-normal"> · {c.role}</span> : null}</span>
                    {c.domain && <span className={`text-xs px-1.5 py-0.5 rounded border ${DOMAIN_STYLES[c.domain] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>{c.domain}</span>}
                    {c.kind && <span className={`text-xs px-1.5 py-0.5 rounded ${KIND_STYLES[c.kind] || 'bg-slate-100 text-slate-700'}`}>{c.kind}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs">
                    {c.email && <a href={`mailto:${c.email}`} className="text-slate-600 hover:text-blue-600 truncate">{c.email}</a>}
                    {c.linkedin && (
                      <a href={normaliseLinkedIn(c.linkedin)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <LinkedInIcon /> LinkedIn
                      </a>
                    )}
                  </div>
                  {c.notes && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{c.notes}</p>}
                </div>
                {editable && (
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => { setEditingId(c.id); setAdding(false); }} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => { if (confirm(`Remove ${c.name}?`)) removeContact(lead.id, c.id); }} className="text-red-600 hover:underline">Remove</button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding && (
        <div className="mt-2">
          <ContactForm
            onCancel={() => setAdding(false)}
            onSave={(payload) => { addContact(lead.id, payload); setAdding(false); }}
          />
        </div>
      )}
    </div>
  );
}

function ContactForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    role: initial?.role || '',
    email: initial?.email || '',
    linkedin: initial?.linkedin || '',
    kind: initial?.kind || '',
    domain: initial?.domain || '',
    notes: initial?.notes || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      role: form.role.trim(),
      email: form.email.trim(),
      linkedin: form.linkedin.trim(),
      kind: form.kind,
      domain: form.domain,
      notes: form.notes.trim(),
    });
  };

  const cls = 'w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:border-blue-500 focus:outline-none';

  return (
    <form onSubmit={submit} className="bg-white border border-blue-200 rounded-md p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Name *" className={cls} />
        <input value={form.role} onChange={e => set('role', e.target.value)} placeholder="Title / Role" className={cls} />
        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" className={cls} />
        <input value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/handle" className={cls} />
        <select value={form.domain} onChange={e => set('domain', e.target.value)} className={cls}>
          <option value="">— Function / Domain —</option>
          {CONTACT_DOMAINS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={form.kind} onChange={e => set('kind', e.target.value)} className={cls}>
          <option value="">— Qualify nature —</option>
          {CONTACT_KINDS.map(k => <option key={k}>{k}</option>)}
        </select>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes (rapport, context, internal influence...)" rows={1} className="col-span-2 w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
        <button type="submit" className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
}
