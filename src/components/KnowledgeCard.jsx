import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../context/AppContext';
import { userById } from '../config/users';
import { KnowledgeTypeBadge } from './Badges';
import { canDeleteKnowledge } from '../utils/permissions';

export default function KnowledgeCard({ entry, onEdit }) {
  const { data, currentUser, deleteKnowledge } = useApp();
  const [open, setOpen] = useState(false);

  const linkedNames = (entry.linkedLeads || [])
    .map(id => data.leads.find(l => l.id === id)?.company)
    .filter(Boolean);

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => setOpen(true)}>{entry.title}</h3>
          <KnowledgeTypeBadge type={entry.type} />
        </div>
        <p className="text-xs text-slate-500 line-clamp-3 mb-3">{entry.content.slice(0, 150)}{entry.content.length > 150 ? '...' : ''}</p>
        {linkedNames.length > 0 && (
          <div className="text-xs text-slate-500 mb-2">
            Linked: {linkedNames.join(', ')}
          </div>
        )}
        <div className="flex flex-wrap gap-1 mb-3">
          {(entry.tags || []).map(t => (
            <span key={t} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">#{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs mt-auto">
          <span className="text-slate-400">{userById(entry.author)?.name} · {new Date(entry.updatedAt).toLocaleDateString()}</span>
          <button onClick={onEdit} className="ml-auto text-blue-600 hover:underline">Edit</button>
          {canDeleteKnowledge(currentUser) && (
            <button
              onClick={() => { if (confirm(`Delete "${entry.title}"?`)) deleteKnowledge(entry.id); }}
              className="text-red-600 hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="text-xl font-bold">{entry.title}</h2>
              <KnowledgeTypeBadge type={entry.type} />
            </div>
            <p className="text-xs text-slate-500 mb-4">Theme: {entry.pitchTheme}</p>
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown>{entry.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
