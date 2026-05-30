import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { USERS, userById } from '../config/users';
import { STAGES, PRIORITIES, StageBadge, PriorityBadge } from './Badges';
import { canEdit, canViewFinancials, canDelete } from '../utils/permissions';
import { scoreOpportunity, toneClasses } from '../utils/engagement';

const OPEN_STAGES = new Set(['Prospect', 'Qualified', 'Proposal', 'Negotiation']);

export default function SubLeadsPanel({ lead }) {
  const { currentUser, addSubLead, updateSubLead, deleteSubLead } = useApp();
  const editable = canEdit(lead, currentUser);
  const allowDelete = canDelete(currentUser) || editable;
  const showFinancials = canViewFinancials(currentUser);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const subs = lead.subLeads || [];
  const pipelineValue = subs
    .filter(s => OPEN_STAGES.has(s.stage))
    .reduce((s, x) => s + (Number(x.value) || 0), 0);

  const contactOptions = [
    ...(lead.contact ? [{ id: '__primary', name: `${lead.contact} (primary)` }] : []),
    ...(lead.contacts || []).map(c => ({ id: c.id, name: `${c.name}${c.kind ? ' · ' + c.kind : ''}` })),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Opportunities</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {subs.length} {subs.length === 1 ? 'opportunity' : 'opportunities'}
            {showFinancials && pipelineValue > 0 && ` · Open pipeline: $${pipelineValue.toLocaleString()}`}
          </p>
        </div>
        {editable && !adding && (
          <button onClick={() => { setAdding(true); setEditingId(null); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            + Add Opportunity
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-3">
          <SubLeadForm
            currentUser={currentUser}
            showFinancials={showFinancials}
            contactOptions={contactOptions}
            onCancel={() => setAdding(false)}
            onSave={(payload) => { addSubLead(lead.id, payload); setAdding(false); }}
          />
        </div>
      )}

      {subs.length === 0 && !adding && (
        <p className="text-sm text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-md p-6 text-center">
          No opportunities yet. Add one to start tracking deal stage and value within this account.
        </p>
      )}

      <ul className="space-y-2">
        {subs.map(s => {
          const linkedContacts = (s.contactIds || []).map(cid => {
            if (cid === '__primary') return lead.contact ? `${lead.contact} (primary)` : null;
            const c = (lead.contacts || []).find(x => x.id === cid);
            return c ? c.name : null;
          }).filter(Boolean);
          return (
            <li key={s.id}>
              {editingId === s.id ? (
                <SubLeadForm
                  initial={s}
                  currentUser={currentUser}
                  showFinancials={showFinancials}
                  contactOptions={contactOptions}
                  onCancel={() => setEditingId(null)}
                  onSave={(patch) => { updateSubLead(lead.id, s.id, patch); setEditingId(null); }}
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-md p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900">{s.title}</div>
                      {s.description && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{s.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <StageBadge stage={s.stage} />
                        <PriorityBadge priority={s.priority} />
                        {(() => {
                          const eng = scoreOpportunity(lead, s);
                          return (
                            <span
                              className={`text-xs px-2 py-0.5 rounded border ${toneClasses(eng.tone)}`}
                              title={eng.contactCount === 0
                                ? 'Link contacts to score engagement'
                                : `Score ${eng.score} from ${eng.contactCount} contact${eng.contactCount === 1 ? '' : 's'}` +
                                  (eng.domains.length ? ` · covers ${eng.domains.join(', ')}` : '') +
                                  (eng.missing.length ? ` · missing ${eng.missing.join(', ')}` : '')}
                            >
                              Engagement: {eng.label} ({eng.score})
                            </span>
                          );
                        })()}
                        <span className="text-xs text-slate-500">Owner: {userById(s.owner)?.name || '—'}</span>
                        {showFinancials && s.value ? <span className="text-xs font-medium text-slate-700">${Number(s.value).toLocaleString()}</span> : null}
                      </div>
                      {linkedContacts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {linkedContacts.map((name, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">👤 {name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {editable && (
                      <div className="flex gap-2 text-xs">
                        <button onClick={() => { setEditingId(s.id); setAdding(false); }} className="text-blue-600 hover:underline">Edit</button>
                        {allowDelete && (
                          <button onClick={() => { if (confirm(`Delete opportunity "${s.title}"?`)) deleteSubLead(lead.id, s.id); }} className="text-red-600 hover:underline">Delete</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SubLeadForm({ initial, currentUser, showFinancials, contactOptions, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    stage: initial?.stage || 'Prospect',
    priority: initial?.priority || 'Medium',
    value: initial?.value ?? '',
    owner: initial?.owner || currentUser?.id || USERS[0].id,
    contactIds: initial?.contactIds || [],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleContact = (id) => set('contactIds', form.contactIds.includes(id) ? form.contactIds.filter(x => x !== id) : [...form.contactIds, id]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      stage: form.stage,
      priority: form.priority,
      owner: form.owner,
      contactIds: form.contactIds,
    };
    if (showFinancials) payload.value = form.value === '' ? undefined : Number(form.value);
    onSave(payload);
  };

  const cls = 'w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:border-blue-500 focus:outline-none';

  return (
    <form onSubmit={submit} className="bg-white border border-blue-200 rounded-md p-3 space-y-2">
      <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Opportunity title *" className={cls} />
      <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Description (scope, product, context...)" className={cls} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select value={form.stage} onChange={e => set('stage', e.target.value)} className={cls}>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={form.priority} onChange={e => set('priority', e.target.value)} className={cls}>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        {showFinancials && (
          <input type="number" value={form.value} onChange={e => set('value', e.target.value)} placeholder="Value ($)" className={cls} />
        )}
        <select value={form.owner} onChange={e => set('owner', e.target.value)} className={cls}>
          {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      {contactOptions.length > 0 && (
        <div>
          <div className="text-xs font-medium text-slate-600 mb-1">Linked Contacts (from account)</div>
          <div className="flex flex-wrap gap-2 bg-slate-50 border border-slate-200 rounded p-2 max-h-32 overflow-y-auto">
            {contactOptions.map(c => (
              <label key={c.id} className="inline-flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={form.contactIds.includes(c.id)} onChange={() => toggleContact(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
        <button type="submit" className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
}
