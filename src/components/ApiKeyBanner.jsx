import { useState, useEffect } from 'react';
import { getApiKey, setApiKey } from '../hooks/useAnthropicAI';

export default function ApiKeyBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('voltara_api_banner_dismissed') === '1');
  const [hasKey, setHasKey] = useState(!!getApiKey());
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setHasKey(!!getApiKey());
  }, [open]);

  if (hasKey || dismissed) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-3">
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-slate-500 hover:text-slate-700 underline"
        >
          {hasKey ? 'Anthropic API key set · update' : 'Set Anthropic API key'}
        </button>
        {open && (
          <KeyModal
            onClose={() => setOpen(false)}
            onSave={(k) => { setApiKey(k); setHasKey(true); setOpen(false); }}
            draft={draft}
            setDraft={setDraft}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4 text-sm">
        <span className="text-blue-900">
          <strong>Anthropic API key required</strong> for web intel and pitch generation. Stored locally in your browser.
        </span>
        <input
          type="password"
          placeholder="sk-ant-..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 px-3 py-1.5 border border-blue-300 rounded-md bg-white"
        />
        <button
          onClick={() => { if (draft.trim()) { setApiKey(draft.trim()); setHasKey(true); } }}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
        >
          Save
        </button>
        <button
          onClick={() => { localStorage.setItem('voltara_api_banner_dismissed', '1'); setDismissed(true); }}
          className="text-blue-700 hover:text-blue-900"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function KeyModal({ onClose, onSave, draft, setDraft }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">Anthropic API Key</h3>
        <p className="text-sm text-slate-600 mb-4">Stored locally in your browser as <code>voltara_api_key</code>.</p>
        <input
          type="password"
          placeholder="sk-ant-..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
          <button
            onClick={() => draft.trim() && onSave(draft.trim())}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
