import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { USERS, userById } from '../config/users';
import { STAGES, PRIORITIES, StageBadge, PriorityBadge, LessonStatusBadge } from '../components/Badges';
import IntelPanel from '../components/IntelPanel';
import PitchEditor from '../components/PitchEditor';
import VisibilityPanel from '../components/VisibilityPanel';
import LessonsPanel from '../components/LessonsPanel';
import ContactsPanel from '../components/ContactsPanel';
import SubLeadsPanel from '../components/SubLeadsPanel';
import { useAnthropicAI } from '../hooks/useAnthropicAI';
import { canEdit, canDelete, canView, canViewFinancials } from '../utils/permissions';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, updateLead, deleteLead, addPitch, updatePitch, currentUser, deletePitch } = useApp();
  const lead = data.leads.find(l => l.id === id);
  const [tab, setTab] = useState('Overview');

  if (!lead || !canView(lead, currentUser)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Lead not found or you don't have access. <Link to="/leads" className="text-blue-600">Back to leads</Link></p>
      </div>
    );
  }

  const closed = lead.stage === 'Closed Won' || lead.stage === 'Closed Lost';
  const TABS = ['Overview', 'Sub-Leads', 'Intel', 'Pitch', 'Lessons', 'Content'];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <button onClick={() => navigate('/leads')} className="text-sm text-slate-500 hover:text-slate-700 mb-3">← All leads</button>
      <div className="flex items-start justify-between mb-1 gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{lead.company}</h1>
            {lead.website && (
              <a href={/^https?:\/\//i.test(lead.website) ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                ↗ Website
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StageBadge stage={lead.stage} />
            <PriorityBadge priority={lead.priority} />
            {closed && <LessonStatusBadge status={lead.lessonsLearnt.status} />}
            {lead.partner && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">🤝 Partner: {lead.partner}</span>}
            {(lead.subLeads?.length || 0) > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">{lead.subLeads.length} sub-lead{lead.subLeads.length === 1 ? '' : 's'}</span>}
            <span className="text-sm text-slate-500">· {lead.contact} · Owner: {userById(lead.owner)?.name}</span>
          </div>
        </div>
        {canDelete(currentUser) && (
          <button
            onClick={() => { if (confirm('Delete this lead?')) { deleteLead(lead.id); navigate('/leads'); } }}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        )}
      </div>

      <div className="border-b border-slate-200 mt-6 mb-6">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {t}{t === 'Lessons' && closed && lead.lessonsLearnt.status === 'final' ? ' ✓' : ''}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Overview' && <OverviewTab lead={lead} updateLead={updateLead} currentUser={currentUser} />}
      {tab === 'Sub-Leads' && <SubLeadsPanel lead={lead} />}
      {tab === 'Intel' && <IntelPanel lead={lead} />}
      {tab === 'Pitch' && (
        <PitchTab
          lead={lead}
          pitches={data.pitchDocs.filter(p => p.leadId === lead.id)}
          addPitch={addPitch}
          updatePitch={updatePitch}
          deletePitch={deletePitch}
          currentUser={currentUser}
        />
      )}
      {tab === 'Lessons' && <LessonsPanel lead={lead} />}
      {tab === 'Content' && <ContentTab content={data.contentRepo} />}
    </div>
  );
}

function OverviewTab({ lead, updateLead, currentUser }) {
  const editable = canEdit(lead, currentUser);
  const showFinancials = canViewFinancials(currentUser);
  const [form, setForm] = useState({
    company: lead.company,
    website: lead.website || '',
    contact: lead.contact || '',
    contactEmail: lead.contactEmail || '',
    contactLinkedin: lead.contactLinkedin || '',
    partner: lead.partner || '',
    stage: lead.stage,
    priority: lead.priority,
    value: lead.value || '',
    owner: lead.owner,
    tags: (lead.tags || []).join(', '),
  });
  const [saved, setSaved] = useState(false);
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };

  const save = () => {
    const patch = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    if (showFinancials) patch.value = form.value ? Number(form.value) : undefined;
    else delete patch.value;
    updateLead(lead.id, patch);
    setSaved(true);
  };

  const cls = `w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-500 focus:outline-none ${!editable ? 'bg-slate-50' : ''}`;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <L label="Company"><input readOnly={!editable} value={form.company} onChange={e => set('company', e.target.value)} className={cls} /></L>
        <L label="Website"><input readOnly={!editable} value={form.website} onChange={e => set('website', e.target.value)} className={cls} placeholder="https://example.com" /></L>
        <L label="Primary Contact"><input readOnly={!editable} value={form.contact} onChange={e => set('contact', e.target.value)} className={cls} /></L>
        <L label="Primary Email"><input readOnly={!editable} value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} className={cls} /></L>
        <L label="Primary LinkedIn"><input readOnly={!editable} value={form.contactLinkedin} onChange={e => set('contactLinkedin', e.target.value)} className={cls} placeholder="linkedin.com/in/handle" /></L>
        <L label="Partner"><input readOnly={!editable} value={form.partner} onChange={e => set('partner', e.target.value)} className={cls} placeholder="Partner / referral source" /></L>
        {showFinancials && <L label="Value ($)"><input readOnly={!editable} type="number" value={form.value} onChange={e => set('value', e.target.value)} className={cls} /></L>}
        <L label="Stage">
          <select disabled={!editable} value={form.stage} onChange={e => set('stage', e.target.value)} className={cls}>
            {STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
        </L>
        <L label="Priority">
          <select disabled={!editable} value={form.priority} onChange={e => set('priority', e.target.value)} className={cls}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </L>
        <L label="Owner">
          <select disabled={!editable} value={form.owner} onChange={e => set('owner', e.target.value)} className={cls}>
            {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </L>
        <L label="Tags"><input readOnly={!editable} value={form.tags} onChange={e => set('tags', e.target.value)} className={cls} placeholder="comma, separated" /></L>
      </div>
      {editable && (
        <div className="flex items-center gap-3 mt-6">
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">Save</button>
          {saved && <span className="text-sm text-green-600">Saved ✓</span>}
        </div>
      )}
      <ContactsPanel lead={lead} />
      <VisibilityPanel lead={lead} />
    </div>
  );
}

function L({ label, children }) {
  return <label className="block"><span className="text-xs font-medium text-slate-600">{label}</span><div className="mt-1">{children}</div></label>;
}

function PitchTab({ lead, pitches, addPitch, updatePitch, deletePitch, currentUser }) {
  const [selectedId, setSelectedId] = useState(pitches[0]?.id || '');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const { generatePitchOutline } = useAnthropicAI();
  const selected = pitches.find(p => p.id === selectedId);

  const createNew = async (auto) => {
    setError('');
    let content = `# Pitch for ${lead.company}\n\n## Problem\n\n## Why Now\n\n## Voltara Fit\n\n## Recommended Next Steps\n`;
    if (auto) {
      setGenerating(true);
      try {
        content = await generatePitchOutline(lead, lead.notes);
      } catch (e) {
        setError(e.message);
        setGenerating(false);
        return;
      }
      setGenerating(false);
    }
    const p = addPitch({
      leadId: lead.id,
      title: `${lead.company} pitch`,
      content,
      author: currentUser.id,
    });
    setSelectedId(p.id);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white">
          <option value="">— Select pitch —</option>
          {pitches.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button onClick={() => createNew(false)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm border border-slate-300">+ Blank Pitch</button>
        <button onClick={() => createNew(true)} disabled={generating} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300">
          {generating ? 'Drafting...' : '✨ AI Draft Pitch'}
        </button>
        {selected && (
          <button onClick={() => { if (confirm('Delete pitch?')) { deletePitch(selected.id); setSelectedId(''); } }} className="text-sm text-red-600 hover:text-red-800 ml-auto">Delete</button>
        )}
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {selected ? (
        <PitchEditor pitch={selected} onSave={(patch) => updatePitch(selected.id, patch)} />
      ) : (
        <p className="text-slate-400 text-sm">No pitch selected. Create one above.</p>
      )}
    </div>
  );
}

function ContentTab({ content }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(
    () => content.filter(c => !q || c.title.toLowerCase().includes(q.toLowerCase()) || (c.tags || []).join(' ').toLowerCase().includes(q.toLowerCase())),
    [content, q]
  );
  const copy = (item) => {
    navigator.clipboard.writeText(item.content);
    alert(`"${item.title}" copied to clipboard. Paste into your pitch editor.`);
  };
  return (
    <div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search content library..." className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md text-sm mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="font-medium text-slate-900">{c.title}</div>
              <span className="text-xs px-2 py-0.5 bg-slate-100 rounded">{c.type}</span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{c.content.slice(0, 120)}</p>
            <button onClick={() => copy(c)} className="mt-3 text-xs text-blue-600 hover:underline">Insert into Pitch</button>
          </div>
        ))}
      </div>
    </div>
  );
}
