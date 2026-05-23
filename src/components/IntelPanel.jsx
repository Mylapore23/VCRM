import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { userById } from '../config/users';
import { useAnthropicAI } from '../hooks/useAnthropicAI';

export default function IntelPanel({ lead }) {
  const { currentUser, addNoteToLead, addWebIntel } = useApp();
  const { fetchWebIntel } = useAnthropicAI();
  const [note, setNote] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitNote = () => {
    if (!note.trim()) return;
    addNoteToLead(lead.id, note.trim(), currentUser.id);
    setNote('');
  };

  const submitIntel = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { summary, sources } = await fetchWebIntel(lead.company, query.trim());
      addWebIntel(lead.id, { query: query.trim(), summary, sources });
      setQuery('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section>
        <h3 className="font-semibold text-slate-900 mb-3">Manual Notes</h3>
        <div className="bg-white border border-slate-200 rounded-lg p-3 mb-3">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note about this lead..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm resize-none focus:border-blue-500 focus:outline-none"
          />
          <div className="flex justify-end mt-2">
            <button onClick={submitNote} disabled={!note.trim()} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300">Add Note</button>
          </div>
        </div>
        <div className="space-y-2">
          {lead.notes.length === 0 && <p className="text-sm text-slate-400">No notes yet.</p>}
          {lead.notes.map(n => (
            <div key={n.id} className="bg-white border border-slate-200 rounded-md p-3">
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{n.text}</p>
              <div className="text-xs text-slate-400 mt-2">
                {userById(n.author)?.name || 'Unknown'} · {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-3">AI Web Intel</h3>
        <div className="bg-white border border-slate-200 rounded-lg p-3 mb-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitIntel()}
            placeholder={`What do you want to know about ${lead.company}?`}
            className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:outline-none"
          />
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
          <div className="flex justify-end mt-2">
            <button onClick={submitIntel} disabled={loading || !query.trim()} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300">
              {loading ? 'Fetching...' : 'Fetch Intel'}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {lead.webIntel.length === 0 && <p className="text-sm text-slate-400">No web intel fetched yet.</p>}
          {lead.webIntel.map(w => (
            <div key={w.id} className="bg-white border border-slate-200 rounded-md p-3">
              <div className="text-xs font-semibold text-blue-600 mb-1">{w.query}</div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{w.summary}</p>
              {w.sources?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {w.sources.map((s, i) => (
                    <a key={i} href={s} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[200px]">
                      {new URL(s).hostname}
                    </a>
                  ))}
                </div>
              )}
              <div className="text-xs text-slate-400 mt-2">{new Date(w.fetchedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
