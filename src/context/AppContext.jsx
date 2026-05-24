import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { canView } from '../utils/permissions';

const STORAGE_KEY = 'voltara_data';
const SESSION_KEY = 'voltara_session';

function emptyLessons() {
  return {
    status: 'draft',
    outcome: '',
    pros: [],
    cons: [],
    recommendations: '',
    aiSynthesis: '',
  };
}

function makeLead(seed) {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    notes: [],
    webIntel: [],
    visibility: [],
    lessonsLearnt: emptyLessons(),
    createdAt: now,
    updatedAt: now,
    ...seed,
    lessonsLearnt: { ...emptyLessons(), ...(seed.lessonsLearnt || {}) },
  };
}

function seedInitial() {
  const now = new Date().toISOString();
  const nexusId = uuid();
  const brightlineId = uuid();
  const stackformId = uuid();

  const brightlineLessons = {
    status: 'final',
    outcome: 'Closed 6-month pilot contract after 3 rounds of negotiation.',
    pros: [
      { id: uuid(), text: 'Strong exec sponsor from the start' },
      { id: uuid(), text: 'Demo tailored to compliance workflow resonated' },
    ],
    cons: [
      { id: uuid(), text: 'Pricing deck sent too early before value was established' },
      { id: uuid(), text: 'Legal review took 3 weeks — not budgeted in timeline' },
    ],
    recommendations: 'Lead with compliance angle in healthcare. Build legal review time into all enterprise timelines.',
    aiSynthesis: 'Brightline Health closed after a value-first approach anchored on compliance workflow fit. Early exec alignment was the decisive factor. Future healthcare deals should delay pricing conversations until after a tailored demo and should budget 3+ weeks for legal review.',
    completedAt: '2025-05-01T00:00:00Z',
    completedBy: 'u1',
  };

  return {
    leads: [
      {
        id: nexusId,
        company: 'Nexus Dynamics', contact: 'Jordan Lee',
        contactEmail: 'jordan@nexusdynamics.io',
        stage: 'Qualified', priority: 'High', value: 45000,
        owner: 'u2', visibility: ['sales'],
        tags: ['SaaS', 'Series A'],
        notes: [], webIntel: [], lessonsLearnt: emptyLessons(),
        createdAt: now, updatedAt: now,
      },
      {
        id: brightlineId,
        company: 'Brightline Health', contact: 'Amara Singh',
        contactEmail: 'amara@brightline.health',
        stage: 'Closed Won', priority: 'High', value: 120000,
        owner: 'u1', visibility: ['sales', 'marketing'],
        tags: ['Healthcare', 'Enterprise'],
        notes: [], webIntel: [], lessonsLearnt: brightlineLessons,
        createdAt: now, updatedAt: now,
      },
      {
        id: stackformId,
        company: 'Stackform Inc', contact: 'Tyler Okafor',
        contactEmail: 'tyler@stackform.dev',
        stage: 'Prospect', priority: 'Medium', value: 18000,
        owner: 'u3', visibility: ['marketing'],
        tags: ['DevTools'],
        notes: [], webIntel: [], lessonsLearnt: emptyLessons(),
        createdAt: now, updatedAt: now,
      },
    ],
    pitchDocs: [],
    contentRepo: [
      {
        id: uuid(),
        title: 'Voltara One-Pager',
        type: 'one_pager',
        content: '# Voltara LLC\n\nGTM intelligence for modern teams.\n\n- Identify high-fit accounts\n- AI-assisted research\n- Pitch faster, win more',
        tags: ['intro', 'overview'],
        createdAt: now,
      },
    ],
    knowledgeRepo: [
      {
        id: uuid(),
        title: 'Healthcare Enterprise Win — Brightline Health',
        pitchTheme: 'Healthcare',
        type: 'win_story',
        content: `## Outcome\nClosed 6-month pilot contract after 3 rounds of negotiation.\n\n## What Worked\n- Strong exec sponsor from the start\n- Demo tailored to compliance workflow resonated\n\n## What Didn't\n- Pricing deck sent too early\n- Legal review took 3 weeks\n\n## Synthesis\nBrightline closed via a value-first, compliance-anchored approach. Exec alignment was decisive.`,
        linkedLeads: [brightlineId],
        tags: ['Healthcare', 'Enterprise'],
        author: 'u1',
        createdAt: now, updatedAt: now,
      },
      {
        id: uuid(),
        title: 'Compliance-first messaging for regulated industries',
        pitchTheme: 'Healthcare',
        type: 'messaging',
        content: '## Frame\nLead with how Voltara reduces audit prep time and surfaces compliance gaps before they become risks. Avoid efficiency framing — it reads as cost-cutting in regulated buyer rooms.\n\n## Proof Points\n- HIPAA-aware data handling\n- Audit trail per record',
        linkedLeads: [],
        tags: ['Healthcare', 'messaging'],
        author: 'u1',
        createdAt: now, updatedAt: now,
      },
    ],
  };
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Backfill v2 fields on existing v1 data
      data.knowledgeRepo = data.knowledgeRepo || [];
      data.leads = (data.leads || []).map(l => ({
        ...l,
        visibility: l.visibility || [],
        lessonsLearnt: { ...emptyLessons(), ...(l.lessonsLearnt || {}) },
      }));
      return data;
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  return seedInitial();
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setData] = useState(loadInitial);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const s = sessionStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const login = useCallback((user) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  }, []);

  const visibleLeads = useMemo(() => {
    if (!currentUser) return [];
    return data.leads.filter(l => canView(l, currentUser));
  }, [data.leads, currentUser]);

  // Leads
  const addLead = useCallback((lead) => {
    const newLead = makeLead(lead);
    setData(d => ({ ...d, leads: [newLead, ...d.leads] }));
    return newLead;
  }, []);

  const updateLead = useCallback((id, patch) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l),
    }));
  }, []);

  const deleteLead = useCallback((id) => {
    setData(d => ({
      ...d,
      leads: d.leads.filter(l => l.id !== id),
      pitchDocs: d.pitchDocs.filter(p => p.leadId !== id),
    }));
  }, []);

  const addNoteToLead = useCallback((leadId, text, author) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        notes: [{ id: uuid(), text, author, createdAt: new Date().toISOString() }, ...l.notes],
        updatedAt: new Date().toISOString(),
      } : l),
    }));
  }, []);

  const addWebIntel = useCallback((leadId, entry) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        webIntel: [{ id: uuid(), fetchedAt: new Date().toISOString(), ...entry }, ...l.webIntel],
        updatedAt: new Date().toISOString(),
      } : l),
    }));
  }, []);

  const updateLessons = useCallback((leadId, lessons) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        lessonsLearnt: { ...l.lessonsLearnt, ...lessons },
        updatedAt: new Date().toISOString(),
      } : l),
    }));
  }, []);

  // Knowledge
  const addKnowledge = useCallback((entry) => {
    const now = new Date().toISOString();
    const newEntry = { id: uuid(), createdAt: now, updatedAt: now, ...entry };
    setData(d => ({ ...d, knowledgeRepo: [newEntry, ...d.knowledgeRepo] }));
    return newEntry;
  }, []);

  const updateKnowledge = useCallback((id, patch) => {
    setData(d => ({
      ...d,
      knowledgeRepo: d.knowledgeRepo.map(k => k.id === id ? { ...k, ...patch, updatedAt: new Date().toISOString() } : k),
    }));
  }, []);

  const deleteKnowledge = useCallback((id) => {
    setData(d => ({ ...d, knowledgeRepo: d.knowledgeRepo.filter(k => k.id !== id) }));
  }, []);

  const finaliseLessons = useCallback((leadId, userId) => {
    const lead = data.leads.find(l => l.id === leadId);
    if (!lead) return;
    const now = new Date().toISOString();
    const finalised = {
      ...lead.lessonsLearnt,
      status: 'final',
      completedAt: now,
      completedBy: userId,
    };
    const isWin = lead.stage === 'Closed Won';
    const theme = lead.tags?.[0] || 'General';
    const prosMd = (finalised.pros || []).map(p => `- ${p.text}`).join('\n') || '- (none)';
    const consMd = (finalised.cons || []).map(c => `- ${c.text}`).join('\n') || '- (none)';
    const content = `## Outcome\n${finalised.outcome || '(no outcome recorded)'}\n\n## What Worked\n${prosMd}\n\n## What Didn't\n${consMd}\n\n## Recommendations\n${finalised.recommendations || '(none)'}\n\n## Synthesis\n${finalised.aiSynthesis || '(none)'}`;
    const knowledgeEntry = {
      id: uuid(),
      title: `${isWin ? 'Win' : 'Loss'}: ${lead.company}`,
      pitchTheme: theme,
      type: isWin ? 'win_story' : 'loss_analysis',
      content,
      linkedLeads: [leadId],
      tags: lead.tags || [],
      author: userId,
      createdAt: now,
      updatedAt: now,
    };

    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? { ...l, lessonsLearnt: finalised, updatedAt: now } : l),
      knowledgeRepo: [knowledgeEntry, ...d.knowledgeRepo],
    }));
  }, [data.leads]);

  // Pitches
  const addPitch = useCallback((pitch) => {
    const now = new Date().toISOString();
    const newPitch = { id: uuid(), createdAt: now, updatedAt: now, ...pitch };
    setData(d => ({ ...d, pitchDocs: [newPitch, ...d.pitchDocs] }));
    return newPitch;
  }, []);

  const updatePitch = useCallback((id, patch) => {
    setData(d => ({
      ...d,
      pitchDocs: d.pitchDocs.map(p => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p),
    }));
  }, []);

  const deletePitch = useCallback((id) => {
    setData(d => ({ ...d, pitchDocs: d.pitchDocs.filter(p => p.id !== id) }));
  }, []);

  // Content
  const addContent = useCallback((item) => {
    const newItem = { id: uuid(), createdAt: new Date().toISOString(), ...item };
    setData(d => ({ ...d, contentRepo: [newItem, ...d.contentRepo] }));
    return newItem;
  }, []);

  const updateContent = useCallback((id, patch) => {
    setData(d => ({
      ...d,
      contentRepo: d.contentRepo.map(c => c.id === id ? { ...c, ...patch } : c),
    }));
  }, []);

  const deleteContent = useCallback((id) => {
    setData(d => ({ ...d, contentRepo: d.contentRepo.filter(c => c.id !== id) }));
  }, []);

  return (
    <AppContext.Provider value={{
      data, visibleLeads, currentUser, login, logout,
      addLead, updateLead, deleteLead, addNoteToLead, addWebIntel,
      updateLessons, finaliseLessons,
      addKnowledge, updateKnowledge, deleteKnowledge,
      addPitch, updatePitch, deletePitch,
      addContent, updateContent, deleteContent,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
