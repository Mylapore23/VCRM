import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import ContentCard from '../components/ContentCard';
import { canDeleteContent } from '../utils/permissions';

const TYPES = ['case_study', 'one_pager', 'deck_slide', 'template', 'snippet'];

export default function ContentRepo() {
  const { data, currentUser, addContent, updateContent, deleteContent } = useApp();
  const allowDelete = canDeleteContent(currentUser);
  const [typeFilter, setTypeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [editing, setEditing] = useState(null);

  const allTags = useMemo(() => {
    const s = new Set();
    data.contentRepo.forEach(c => (c.tags || []).forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [data.contentRepo]);

  const filtered = data.contentRepo.filter(c =>
    (!typeFilter || c.type === typeFilter) &&
    (!tagFilter || (c.tags || []).includes(tagFilter))
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Content Repo</h1>
        <button onClick={() => setEditing({})} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">+ Add Content</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white">
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white">
          <option value="">All Tags</option>
          {allTags.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && <p className="text-slate-400 text-sm col-span-full">No items.</p>}
        {filtered.map(item => (
          <ContentCard
            key={item.id}
            item={item}
            onEdit={() => setEditing(item)}
            onDelete={allowDelete ? () => { if (confirm(`Delete "${item.title}"?`)) deleteContent(item.id); } : null}
          />
        ))}
      </div>

      {editing && (
        <ContentForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(payload) => {
            if (editing.id) updateContent(editing.id, payload);
            else addContent(payload);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ContentForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    type: initial.type || 'snippet',
    tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : '',
    content: initial.content || '',
    attachment: initial.attachment || null,
  });
  const [fileError, setFileError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileError('');
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`File too large (${fmtBytes(file.size)}). Max ${fmtBytes(MAX_FILE_BYTES)} — stored in browser localStorage.`);
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      set('attachment', { name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size, dataUrl });
      if (!form.title.trim()) set('title', file.name.replace(/\.[^.]+$/, ''));
    } catch {
      setFileError('Failed to read file.');
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      type: form.type,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      content: form.content,
      attachment: form.attachment,
    });
  };

  const cls = 'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-500 focus:outline-none';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-white text-slate-900 rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{initial.id ? 'Edit Content' : 'Add Content'}</h3>
        <div className="space-y-3">
          <label className="block"><span className="text-xs font-medium text-slate-600">Title *</span>
            <input required value={form.title} onChange={e => set('title', e.target.value)} className={cls} />
          </label>
          <label className="block"><span className="text-xs font-medium text-slate-600">Type</span>
            <select value={form.type} onChange={e => set('type', e.target.value)} className={cls}>
              {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-xs font-medium text-slate-600">Tags (comma-separated)</span>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} className={cls} />
          </label>
          <div className="block">
            <span className="text-xs font-medium text-slate-600">Attachment (deck, PDF, image — max {fmtBytes(MAX_FILE_BYTES)})</span>
            <div className="mt-1 flex items-center gap-2">
              <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-sm cursor-pointer">
                {form.attachment ? 'Replace file' : 'Choose file'}
                <input type="file" className="hidden" onChange={onFile} />
              </label>
              {form.attachment && (
                <>
                  <span className="text-xs text-slate-600 truncate flex-1">📎 {form.attachment.name} · {fmtBytes(form.attachment.size)}</span>
                  <button type="button" onClick={() => set('attachment', null)} className="text-xs text-red-600 hover:underline">Remove</button>
                </>
              )}
            </div>
            {fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
          </div>
          <label className="block"><span className="text-xs font-medium text-slate-600">Markdown content (optional)</span>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={8} className={`${cls} font-mono`} />
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
        </div>
      </form>
    </div>
  );
}
