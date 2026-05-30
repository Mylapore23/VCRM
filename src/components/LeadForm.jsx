import { useState } from 'react';
import { USERS } from '../config/users';
import { canAssignVisibility } from '../utils/permissions';

export default function LeadForm({ initial, onSave, onCancel, currentUser }) {
  const [form, setForm] = useState(() => ({
    company: '',
    website: '',
    contact: '',
    contactEmail: '',
    contactLinkedin: '',
    partner: '',
    owner: currentUser?.id || USERS[0].id,
    tags: '',
    ...initial,
    tags: Array.isArray(initial?.tags) ? initial.tags.join(', ') : (initial?.tags || ''),
    visibility: initial?.visibility || [],
  }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleVis = (role) => setForm(f => ({
    ...f,
    visibility: f.visibility.includes(role) ? f.visibility.filter(r => r !== role) : [...f.visibility, role],
  }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.company.trim()) return;
    onSave({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  const showVisibility = canAssignVisibility(currentUser);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <form
        onSubmit={submit}
        onClick={e => e.stopPropagation()}
        className="bg-white text-slate-900 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-lg font-semibold mb-1">{initial?.id ? 'Edit Account' : 'Add Account'}</h3>
        <p className="text-xs text-slate-500 mb-4">Accounts hold company info. Specific deals live as Opportunities inside the account.</p>
        <div className="space-y-3">
          <Field label="Company *"><input required value={form.company} onChange={e => set('company', e.target.value)} className={inputCls} /></Field>
          <Field label="Website"><input value={form.website} onChange={e => set('website', e.target.value)} className={inputCls} placeholder="https://example.com" /></Field>
          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold text-slate-700 mb-2">Primary Contact</p>
            <div className="space-y-3">
              <Field label="Name"><input value={form.contact} onChange={e => set('contact', e.target.value)} className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email"><input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} className={inputCls} /></Field>
                <Field label="LinkedIn"><input value={form.contactLinkedin} onChange={e => set('contactLinkedin', e.target.value)} className={inputCls} placeholder="linkedin.com/in/handle" /></Field>
              </div>
            </div>
          </div>
          <Field label="Partner (if any)"><input value={form.partner} onChange={e => set('partner', e.target.value)} className={inputCls} placeholder="Partner / referral source" /></Field>
          <Field label="Account Owner">
            <select value={form.owner} onChange={e => set('owner', e.target.value)} className={inputCls}>
              {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Tags (comma-separated)"><input value={form.tags} onChange={e => set('tags', e.target.value)} className={inputCls} /></Field>
          {showVisibility && (
            <div className="border-t border-slate-200 pt-3">
              <span className="text-xs font-medium text-slate-600">Visible to (admin only)</span>
              <div className="flex gap-3 mt-2">
                {['sales', 'marketing'].map(role => (
                  <label key={role} className="flex items-center gap-2 text-sm capitalize">
                    <input type="checkbox" checked={form.visibility.includes(role)} onChange={() => toggleVis(role)} />
                    {role}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none text-sm';
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
