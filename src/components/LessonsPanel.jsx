import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { useApp } from '../context/AppContext';
import { useAnthropicAI } from '../hooks/useAnthropicAI';
import { canFinaliseLessons, canEdit } from '../utils/permissions';
import { LessonStatusBadge } from './Badges';

export default function LessonsPanel({ lead }) {
  const { currentUser, updateLessons, finaliseLessons } = useApp();
  const { synthesizeLessons } = useAnthropicAI();
  const final = lead.lessonsLearnt.status === 'final';
  const editable = !final && canEdit(lead, currentUser);

  const [form, setForm] = useState(lead.lessonsLearnt);
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');
  const [synthLoading, setSynthLoading] = useState(false);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(lead.lessonsLearnt); }, [lead.id, lead.lessonsLearnt.status]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };
  const addPro = () => { if (!newPro.trim()) return; set('pros', [...(form.pros || []), { id: uuid(), text: newPro.trim() }]); setNewPro(''); };
  const addCon = () => { if (!newCon.trim()) return; set('cons', [...(form.cons || []), { id: uuid(), text: newCon.trim() }]); setNewCon(''); };
  const rmPro = (id) => set('pros', form.pros.filter(p => p.id !== id));
  const rmCon = (id) => set('cons', form.cons.filter(c => c.id !== id));

  const saveDraft = () => {
    updateLessons(lead.id, { ...form, status: 'draft' });
    setSaved(true);
  };

  const finalise = () => {
    if (!confirm('Finalise lessons? This locks the entry and auto-creates a Knowledge Repo entry.')) return;
    updateLessons(lead.id, form);
    finaliseLessons(lead.id, currentUser.id);
  };

  const runSynthesis = async () => {
    setErr('');
    setSynthLoading(true);
    try {
      const synthesis = await synthesizeLessons(lead, form);
      setForm(f => ({ ...f, aiSynthesis: synthesis }));
      updateLessons(lead.id, { ...form, aiSynthesis: synthesis });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSynthLoading(false);
    }
  };

  const ro = !editable;
  const inputCls = `w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-500 focus:outline-none ${ro ? 'bg-slate-50' : ''}`;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Challenges & Lessons</h3>
        <p className="text-xs text-slate-500 mt-0.5">Capture challenges, what's working, and lessons during the active account hunt — not just at close. Refresh anytime; finalise to lock and seed Knowledge Repo.</p>
      </div>
      <div className="flex items-center gap-2">
        <LessonStatusBadge status={form.status} />
        {final && form.completedAt && (
          <span className="text-xs text-slate-500">Finalised {new Date(form.completedAt).toLocaleDateString()}</span>
        )}
      </div>

      <section>
        <label className="block">
          <span className="text-sm font-semibold text-slate-900">Current Situation / Outcome</span>
          <textarea readOnly={ro} value={form.outcome} onChange={e => set('outcome', e.target.value)} rows={3} className={inputCls + ' mt-2'} placeholder="Where the account stands today, what's happened, key context." />
        </label>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-slate-900 mb-2">What's Working (Pros)</h4>
        <ul className="space-y-1 mb-2">
          {(form.pros || []).map(p => (
            <li key={p.id} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded px-3 py-1.5 text-sm">
              <span className="flex-1">✓ {p.text}</span>
              {!ro && <button onClick={() => rmPro(p.id)} className="text-slate-400 hover:text-red-600">×</button>}
            </li>
          ))}
        </ul>
        {!ro && (
          <div className="flex gap-2">
            <input value={newPro} onChange={e => setNewPro(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPro())} placeholder="Add a pro..." className={inputCls} />
            <button onClick={addPro} className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm">+ Add</button>
          </div>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Challenges to Address / Avoid (Cons)</h4>
        <ul className="space-y-1 mb-2">
          {(form.cons || []).map(c => (
            <li key={c.id} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-1.5 text-sm">
              <span className="flex-1">✗ {c.text}</span>
              {!ro && <button onClick={() => rmCon(c.id)} className="text-slate-400 hover:text-red-600">×</button>}
            </li>
          ))}
        </ul>
        {!ro && (
          <div className="flex gap-2">
            <input value={newCon} onChange={e => setNewCon(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCon())} placeholder="Add a con..." className={inputCls} />
            <button onClick={addCon} className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm">+ Add</button>
          </div>
        )}
      </section>

      <section>
        <label className="block">
          <span className="text-sm font-semibold text-slate-900">Recommendations / Next Plays</span>
          <textarea readOnly={ro} value={form.recommendations} onChange={e => set('recommendations', e.target.value)} rows={3} className={inputCls + ' mt-2'} placeholder="What to do next, what to repeat, what to avoid for the next refresher / similar accounts." />
        </label>
      </section>

      {form.aiSynthesis && (
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">✨ AI Synthesis</h4>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{form.aiSynthesis}</p>
        </section>
      )}

      {err && <p className="text-red-600 text-sm">{err}</p>}

      {!ro && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
          <button onClick={runSynthesis} disabled={synthLoading} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300">
            {synthLoading ? 'Synthesising...' : '✨ AI Synthesise Lessons'}
          </button>
          <button onClick={saveDraft} className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm">Save Draft</button>
          {saved && <span className="text-sm text-green-600 self-center">Saved ✓</span>}
          {canFinaliseLessons(currentUser) && (
            <button onClick={finalise} className="ml-auto px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
              Finalise
            </button>
          )}
        </div>
      )}
      {final && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
          This entry is finalised and locked. A Knowledge Repo entry was created automatically.
        </p>
      )}
    </div>
  );
}
