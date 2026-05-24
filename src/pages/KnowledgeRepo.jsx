import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import KnowledgeCard from '../components/KnowledgeCard';
import { KNOWLEDGE_TYPES } from '../components/Badges';

export default function KnowledgeRepo() {
  const { data, visibleLeads, currentUser, addKnowledge, updateKnowledge } = useApp();
  const [theme, setTheme] = useState('__all');
  const [typeFilter, setTypeFilter] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);

  const themes = useMemo(() => {
    const counts = new Map();
    data.knowledgeRepo.forEach(e => counts.set(e.pitchTheme, (counts.get(e.pitchTheme) || 0) + 1));
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data.knowledgeRepo]);

  const filtered = useMemo(() => {
    return data.knowledgeRepo.filter(e => {
      if (theme !== '__all' && e.pitchTheme !== theme) return false;
      if (typeFilter && e.type !== typeFilter) return false;
      if (q) {
        const ql = q.toLowerCase();
        if (!e.title.toLowerCase().includes(ql) && !e.content.toLowerCase().includes(ql)) return false;
      }
      return true;
    });
  }, [data.knowledgeRepo, theme, typeFilter, q]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Knowledge Repository</h1>
        <button onClick={() => setEditing({})} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">+ Add Entry</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <aside className="bg-white border border-slate-200 rounded-lg p-3 h-fit">
          <h3 className="text-xs font-semibold uppercase text-slate-500 mb-2">Pitch Themes</h3>
          <button
            onClick={() => setTheme('__all')}
            className={`w-full text-left px-2 py-1.5 rounded text-sm ${theme === '__all' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50'}`}
          >
            All Themes ({data.knowledgeRepo.length})
          </button>
          <div className="border-t border-slate-100 my-2" />
          {themes.map(([name, count]) => (
            <button
              key={name}
              onClick={() => setTheme(name)}
              className={`w-full text-left px-2 py-1.5 rounded text-sm flex justify-between ${theme === name ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50'}`}
            >
              <span className="truncate">{name}</span>
              <span className="text-slate-400">{count}</span>
            </button>
          ))}
        </aside>

        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white">
              <option value="">All Types</option>
              {KNOWLEDGE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-md text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.length === 0 && <p className="text-slate-400 text-sm col-span-full">No entries.</p>}
            {filtered.map(e => (
              <KnowledgeCard key={e.id} entry={e} onEdit={() => setEditing(e)} />
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <KnowledgeForm
          initial={editing}
          themes={themes.map(([n]) => n)}
          leads={visibleLeads}
          currentUser={currentUser}
          onCancel={() => setEditing(null)}
          onSave={(payload) => {
            if (editing.id) updateKnowledge(editing.id, payload);
            else addKnowledge({ ...payload, author: currentUser.id });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function KnowledgeForm({ initial, themes, leads, currentUser, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    pitchTheme: initial.pitchTheme || '',
    type: initial.type || 'insight',
    content: initial.content || '',
    tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : '',
    linkedLeads: initial.linkedLeads || [],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleLead = (id) => set('linkedLeads', form.linkedLeads.includes(id) ? form.linkedLeads.filter(x => x !== id) : [...form.linkedLeads, id]);

  const suggestFromIntel = () => {
    if (!form.linkedLeads.length) { alert('Link a lead first to suggest from its intel.'); return; }
    const lead = leads.find(l => l.id === form.linkedLeads[0]);
    if (!lead) return;
    const notes = (lead.notes || []).slice(0, 5).map(n => `- ${n.text}`).join('\n');
    const intel = (lead.webIntel || []).slice(0, 3).map(w => `### ${w.query}\n${w.summary}`).join('\n\n');
    const draft = `# Notes from ${lead.company}\n\n## Manual Notes\n${notes || '(none)'}\n\n## Web Intel\n${intel || '(none)'}`;
    set('content', draft);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.pitchTheme.trim()) return;
    onSave({
      title: form.title.trim(),
      pitchTheme: form.pitchTheme.trim(),
      type: form.type,
      content: form.content,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      linkedLeads: form.linkedLeads,
    });
  };

  const cls = 'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-500 focus:outline-none';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{initial.id ? 'Edit Knowledge Entry' : 'Add Knowledge Entry'}</h3>
        <div className="space-y-3">
          <L label="Title *"><input required value={form.title} onChange={e => set('title', e.target.value)} className={cls} /></L>
          <div className="grid grid-cols-2 gap-3">
            <L label="Pitch Theme *">
              <input required list="themes" value={form.pitchTheme} onChange={e => set('pitchTheme', e.target.value)} className={cls} placeholder="e.g. Healthcare" />
              <datalist id="themes">{themes.map(t => <option key={t} value={t} />)}</datalist>
            </L>
            <L label="Type">
              <select value={form.type} onChange={e => set('type', e.target.value)} className={cls}>
                {KNOWLEDGE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </L>
          </div>
          <L label="Content (markdown)">
            <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={8} className={`${cls} font-mono`} />
          </L>
          <L label="Tags (comma-separated)"><input value={form.tags} onChange={e => set('tags', e.target.value)} className={cls} /></L>
          <div>
            <span className="text-xs font-medium text-slate-600">Link to Leads</span>
            <div className="mt-1 max-h-32 overflow-y-auto border border-slate-200 rounded-md p-2 space-y-1">
              {leads.length === 0 && <p className="text-xs text-slate-400">No visible leads.</p>}
              {leads.map(l => (
                <label key={l.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.linkedLeads.includes(l.id)} onChange={() => toggleLead(l.id)} />
                  {l.company}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center gap-2 mt-6">
          <button type="button" onClick={suggestFromIntel} className="text-sm px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100">
            ✨ Suggest from Intel
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function L({ label, children }) {
  return <label className="block"><span className="text-xs font-medium text-slate-600">{label}</span><div className="mt-1">{children}</div></label>;
}
