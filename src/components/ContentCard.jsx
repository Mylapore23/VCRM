import ReactMarkdown from 'react-markdown';
import { useState } from 'react';

const TYPE_COLORS = {
  case_study: 'bg-purple-100 text-purple-700',
  one_pager: 'bg-blue-100 text-blue-700',
  deck_slide: 'bg-amber-100 text-amber-700',
  template: 'bg-green-100 text-green-700',
  snippet: 'bg-slate-100 text-slate-700',
};

export default function ContentCard({ item, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => setOpen(true)}>{item.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLORS[item.type] || ''}`}>{item.type.replace('_', ' ')}</span>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.content.slice(0, 120)}{item.content.length > 120 ? '...' : ''}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {(item.tags || []).map(t => (
            <span key={t} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">#{t}</span>
          ))}
        </div>
        <div className="flex gap-3 text-xs mt-auto">
          <button onClick={onEdit} className="text-blue-600 hover:underline">Edit</button>
          <button onClick={onDelete} className="text-red-600 hover:underline">Delete</button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{item.title}</h2>
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown>{item.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
