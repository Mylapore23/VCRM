import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function PitchEditor({ pitch, onChange, onSave }) {
  const [mode, setMode] = useState('edit');
  const [title, setTitle] = useState(pitch.title);
  const [content, setContent] = useState(pitch.content);

  useEffect(() => { setTitle(pitch.title); setContent(pitch.content); }, [pitch.id]);

  const exportMd = () => {
    const blob = new Blob([`# ${title}\n\n${content}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dirty = title !== pitch.title || content !== pitch.content;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 bg-slate-50">
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); onChange?.({ title: e.target.value, content }); }}
          className="flex-1 px-2 py-1 text-sm font-medium border border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none rounded"
        />
        <div className="flex bg-slate-200 rounded p-0.5">
          <button onClick={() => setMode('edit')} className={`px-3 py-1 text-xs rounded ${mode === 'edit' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>Edit</button>
          <button onClick={() => setMode('preview')} className={`px-3 py-1 text-xs rounded ${mode === 'preview' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>Preview</button>
        </div>
        <button onClick={exportMd} className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-300">Export .md</button>
        <button
          onClick={() => onSave({ title, content })}
          disabled={!dirty}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-slate-300"
        >
          Save
        </button>
      </div>
      {mode === 'edit' ? (
        <textarea
          value={content}
          onChange={e => { setContent(e.target.value); onChange?.({ title, content: e.target.value }); }}
          className="w-full min-h-[500px] p-4 font-mono text-sm focus:outline-none resize-none"
        />
      ) : (
        <div className="prose prose-slate max-w-none p-6 min-h-[500px]">
          <ReactMarkdown>{content || '*Nothing to preview*'}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
