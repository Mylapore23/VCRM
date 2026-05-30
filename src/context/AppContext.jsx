import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { canView } from '../utils/permissions';

const STORAGE_KEY = 'voltara_data_v3';
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
    contacts: [],
    subLeads: [],
    reminders: [],
    lessonsLearnt: emptyLessons(),
    createdAt: now,
    updatedAt: now,
    ...seed,
    lessonsLearnt: { ...emptyLessons(), ...(seed.lessonsLearnt || {}) },
  };
}

function seedInitial() {
  return {
    leads: [],
    pitchDocs: [],
    contentRepo: [],
    knowledgeRepo: [],
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
        contacts: l.contacts || [],
        subLeads: l.subLeads || [],
        reminders: l.reminders || [],
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

  const addContact = useCallback((leadId, contact) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        contacts: [...(l.contacts || []), { id: uuid(), ...contact }],
        updatedAt: new Date().toISOString(),
      } : l),
    }));
  }, []);

  const updateContact = useCallback((leadId, contactId, patch) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        contacts: (l.contacts || []).map(c => c.id === contactId ? { ...c, ...patch } : c),
        updatedAt: new Date().toISOString(),
      } : l),
    }));
  }, []);

  const removeContact = useCallback((leadId, contactId) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        contacts: (l.contacts || []).filter(c => c.id !== contactId),
        updatedAt: new Date().toISOString(),
      } : l),
    }));
  }, []);

  const addReminder = useCallback((leadId, reminder) => {
    const now = new Date().toISOString();
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        reminders: [{ id: uuid(), done: false, createdAt: now, ...reminder }, ...(l.reminders || [])],
        updatedAt: now,
      } : l),
    }));
  }, []);

  const updateReminder = useCallback((leadId, reminderId, patch) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        reminders: (l.reminders || []).map(r => r.id === reminderId ? { ...r, ...patch } : r),
        updatedAt: new Date().toISOString(),
      } : l),
    }));
  }, []);

  const deleteReminder = useCallback((leadId, reminderId) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        reminders: (l.reminders || []).filter(r => r.id !== reminderId),
        updatedAt: new Date().toISOString(),
      } : l),
    }));
  }, []);

  const addSubLead = useCallback((leadId, sub) => {
    const now = new Date().toISOString();
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        subLeads: [{ id: uuid(), createdAt: now, updatedAt: now, ...sub }, ...(l.subLeads || [])],
        updatedAt: now,
      } : l),
    }));
  }, []);

  const updateSubLead = useCallback((leadId, subId, patch) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        subLeads: (l.subLeads || []).map(s => s.id === subId ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s),
        updatedAt: new Date().toISOString(),
      } : l),
    }));
  }, []);

  const deleteSubLead = useCallback((leadId, subId) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId ? {
        ...l,
        subLeads: (l.subLeads || []).filter(s => s.id !== subId),
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
      addContact, updateContact, removeContact,
      addSubLead, updateSubLead, deleteSubLead,
      addReminder, updateReminder, deleteReminder,
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
