import ReactMarkdown from 'react-markdown';
import { useState } from 'react';

const TYPE_COLORS = {
  case_study: 'bg-purple-100 text-purple-700',
  one_pager: 'bg-blue-100 text-blue-700',
  deck_slide: 'bg-amber-100 text-amber-700',
  template: 'bg-green-100 text-green-700',
  snippet: 'bg-slate-100 text-slate-700',
};

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function fileIcon(mimeType = '') {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📕';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📄';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📈';
  return '📎';
}

export default function ContentCard({ item, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const att = item.attachment;
  const isImage = att?.mimeType?.startsWith('image/');
  const isPdf = att?.mimeType === 'application/pdf';

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => setOpen(true)}>{item.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLORS[item.type] || ''}`}>{item.type.replace('_', ' ')}</span>
        </div>
        {item.content && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.content.slice(0, 120)}{item.content.length > 120 ? '...' : ''}</p>}
        {att && (
          <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 mb-3">
            <span>{fileIcon(att.mimeType)}</span>
            <span className="truncate flex-1" title={att.name}>{att.name}</span>
            <span className="text-slate-400">{fmtBytes(att.size)}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1 mb-3">
          {(item.tags || []).map(t => (
            <span key={t} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">#{t}</span>
          ))}
        </div>
        <div className="flex gap-3 text-xs mt-auto">
          <button onClick={() => setOpen(true)} className="text-blue-600 hover:underline font-medium">Preview</button>
          <button onClick={onEdit} className="text-blue-600 hover:underline">Edit</button>
          {att && <a href={att.dataUrl} download={att.name} className="text-blue-600 hover:underline">Download</a>}
          {onDelete && <button onClick={onDelete} className="text-red-600 hover:underline">Delete</button>}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white text-slate-900 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold">{item.title}</h2>
              {att && (
                <a href={att.dataUrl} download={att.name} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  ⬇ Download {att.name}
                </a>
              )}
            </div>
            {att && isImage && (
              <img src={att.dataUrl} alt={att.name} className="max-h-[60vh] mx-auto rounded border border-slate-200 mb-4" />
            )}
            {att && isPdf && (
              <iframe src={att.dataUrl} title={att.name} className="w-full h-[60vh] border border-slate-200 rounded mb-4" />
            )}
            {att && !isImage && !isPdf && (
              <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-4 text-sm text-slate-600">
                {fileIcon(att.mimeType)} {att.name} · {fmtBytes(att.size)} — use Download to open in its native app.
              </div>
            )}
            {item.content && (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{item.content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
