import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { canEdit } from '../utils/permissions';
import { userById } from '../config/users';
import { ReminderFlag } from './Badges';

function flagFor(dueDate, done) {
  if (done || !dueDate) return null;
  const days = (new Date(dueDate) - new Date()) / 86400000;
  if (days <= 2) return 'red';
  if (days <= 5) return 'yellow';
  return null;
}

function fmtDue(dueDate) {
  if (!dueDate) return '';
  const due = new Date(dueDate);
  const days = Math.ceil((due - new Date()) / 86400000);
  const dateStr = due.toLocaleDateString();
  if (days < 0) return `${dateStr} · overdue ${-days}d`;
  if (days === 0) return `${dateStr} · today`;
  if (days === 1) return `${dateStr} · tomorrow`;
  return `${dateStr} · in ${days}d`;
}

export default function RemindersPanel({ lead }) {
  const { currentUser, addReminder, updateReminder, deleteReminder } = useApp();
  const editable = canEdit(lead, currentUser);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const reminders = [...(lead.reminders || [])].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Reminders & Actions</h3>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><ReminderFlag flag="red" /> ≤ 2 days</span>
            <span className="inline-flex items-center gap-1"><ReminderFlag flag="yellow" /> ≤ 5 days</span>
          </p>
        </div>
        {editable && !adding && (
          <button onClick={() => { setAdding(true); setEditingId(null); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            + Add Reminder
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-3">
          <ReminderForm
            onCancel={() => setAdding(false)}
            onSave={(payload) => { addReminder(lead.id, { ...payload, createdBy: currentUser.id }); setAdding(false); }}
          />
        </div>
      )}

      {reminders.length === 0 && !adding && (
        <p className="text-sm text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-md p-6 text-center">
          No reminders yet. Add follow-up actions with due dates to surface visual flags.
        </p>
      )}

      <ul className="space-y-2">
        {reminders.map(r => {
          const flag = flagFor(r.dueDate, r.done);
          return (
            <li key={r.id}>
              {editingId === r.id ? (
                <ReminderForm
                  initial={r}
                  onCancel={() => setEditingId(null)}
                  onSave={(patch) => { updateReminder(lead.id, r.id, patch); setEditingId(null); }}
                />
              ) : (
                <div className={`bg-white border rounded-md p-3 flex items-start gap-3 ${r.done ? 'opacity-60 border-slate-200' : flag === 'red' ? 'border-red-200 bg-red-50' : flag === 'yellow' ? 'border-amber-200 bg-amber-50' : 'border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={!!r.done}
                    disabled={!editable}
                    onChange={() => updateReminder(lead.id, r.id, { done: !r.done })}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ReminderFlag flag={flag} />
                      <span className={`text-sm font-medium text-slate-900 ${r.done ? 'line-through' : ''}`}>{r.action}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {fmtDue(r.dueDate)}
                      {r.createdBy && <> · by {userById(r.createdBy)?.name || 'unknown'}</>}
                    </div>
                    {r.notes && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{r.notes}</p>}
                  </div>
                  {editable && (
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => { setEditingId(r.id); setAdding(false); }} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => { if (confirm('Delete reminder?')) deleteReminder(lead.id, r.id); }} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReminderForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    action: initial?.action || '',
    dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
    notes: initial?.notes || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.action.trim()) return;
    onSave({
      action: form.action.trim(),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : '',
      notes: form.notes.trim(),
    });
  };

  const cls = 'w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:border-blue-500 focus:outline-none';

  return (
    <form onSubmit={submit} className="bg-white border border-blue-200 rounded-md p-3 space-y-2">
      <input required value={form.action} onChange={e => set('action', e.target.value)} placeholder="Action (e.g. Send proposal, Follow up with CFO)" className={cls} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-600">
          Due date
          <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className={cls} />
        </label>
        <label className="text-xs text-slate-600">
          Notes
          <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional context" className={cls} />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
        <button type="submit" className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
}
