import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { canAssignVisibility } from '../utils/permissions';

export default function VisibilityPanel({ lead }) {
  const { currentUser, updateLead } = useApp();
  const [vis, setVis] = useState(lead.visibility || []);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setVis(lead.visibility || []); }, [lead.id]);

  if (!canAssignVisibility(currentUser)) {
    const label = (lead.visibility || []).length
      ? `Shared with: ${lead.visibility.map(r => r[0].toUpperCase() + r.slice(1)).join(', ')}`
      : 'Private (owner + admin only)';
    return (
      <div className="text-xs text-slate-500 mt-2">{label}</div>
    );
  }

  const toggle = (role) => {
    setVis(v => v.includes(role) ? v.filter(r => r !== role) : [...v, role]);
    setSaved(false);
  };

  const save = () => {
    updateLead(lead.id, { visibility: vis });
    setSaved(true);
  };

  return (
    <div className="mt-6 border-t border-slate-200 pt-4">
      <h4 className="text-sm font-semibold text-slate-900 mb-1">Opportunity Visibility</h4>
      <p className="text-xs text-slate-500 mb-3">
        Visible to: {vis.length ? vis.map(r => r[0].toUpperCase() + r.slice(1)).join(', ') : '(only owner + admin)'}
      </p>
      <div className="flex items-center gap-4">
        {['sales', 'marketing'].map(role => (
          <label key={role} className="flex items-center gap-2 text-sm capitalize">
            <input type="checkbox" checked={vis.includes(role)} onChange={() => toggle(role)} />
            {role}
          </label>
        ))}
        <button onClick={save} className="ml-auto px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          Save Visibility
        </button>
        {saved && <span className="text-xs text-green-600">Saved ✓</span>}
      </div>
    </div>
  );
}
