import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';

const STORAGE_KEY = 'voltara_data';
const SESSION_KEY = 'voltara_session';

const SEED_LEADS = [
  {
    company: 'Nexus Dynamics',
    contact: 'Jordan Lee',
    contactEmail: 'jordan@nexusdynamics.io',
    stage: 'Qualified',
    priority: 'High',
    value: 45000,
    owner: 'u2',
    tags: ['SaaS', 'Series A'],
  },
  {
    company: 'Brightline Health',
    contact: 'Amara Singh',
    contactEmail: 'amara@brightline.health',
    stage: 'Proposal',
    priority: 'High',
    value: 120000,
    owner: 'u1',
    tags: ['Healthcare', 'Enterprise'],
  },
  {
    company: 'Stackform Inc',
    contact: 'Tyler Okafor',
    contactEmail: 'tyler@stackform.dev',
    stage: 'Prospect',
    priority: 'Medium',
    value: 18000,
    owner: 'u3',
    tags: ['DevTools'],
  },
];

function makeLead(seed) {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    notes: [],
    webIntel: [],
    createdAt: now,
    updatedAt: now,
    ...seed,
  };
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load data', e);
  }
  return {
    leads: SEED_LEADS.map(makeLead),
    pitchDocs: [],
    contentRepo: [
      {
        id: uuid(),
        title: 'Voltara One-Pager',
        type: 'one_pager',
        content: '# Voltara LLC\n\nGTM intelligence for modern teams.\n\n- Identify high-fit accounts\n- AI-assisted research\n- Pitch faster, win more',
        tags: ['intro', 'overview'],
        createdAt: new Date().toISOString(),
      },
    ],
  };
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
      data, currentUser, login, logout,
      addLead, updateLead, deleteLead, addNoteToLead, addWebIntel,
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
