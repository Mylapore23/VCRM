// Engagement scoring: rate an opportunity by who is engaged.
// Higher score = better multi-threading + stronger contact types.

const KIND_WEIGHT = {
  Champion: 4,
  'Decision Maker': 4,
  'Economic Buyer': 4,
  'Technical Buyer': 3,
  Influencer: 2,
  Gatekeeper: 1,
  'End User': 1,
  Blocker: -3,
  Other: 1,
};

// Domains that materially de-risk an enterprise deal.
const KEY_DOMAINS = ['Business', 'IT', 'Executive Leadership'];

export function scoreOpportunity(lead, opp) {
  if (!lead || !opp) return { score: 0, label: 'No engagement', tone: 'slate', domains: [], contactCount: 0, missing: KEY_DOMAINS };
  const linkedIds = opp.contactIds || [];
  const contacts = linkedIds
    .map(id => {
      if (id === '__primary') {
        if (!lead.contact) return null;
        return { name: lead.contact, kind: 'Champion', domain: '' };
      }
      return (lead.contacts || []).find(c => c.id === id);
    })
    .filter(Boolean);

  if (contacts.length === 0) {
    return { score: 0, label: 'No engagement', tone: 'slate', domains: [], contactCount: 0, missing: KEY_DOMAINS };
  }

  let base = 0;
  const domains = new Set();
  for (const c of contacts) {
    base += KIND_WEIGHT[c.kind] ?? 1;
    if (c.domain) domains.add(c.domain);
  }

  // +2 per key domain covered, capped to encourage multi-threading.
  const domainBonus = KEY_DOMAINS.filter(d => domains.has(d)).length * 2;
  const score = Math.max(0, base + domainBonus);

  let label, tone;
  if (score >= 12) { label = 'Strong'; tone = 'green'; }
  else if (score >= 6) { label = 'Moderate'; tone = 'amber'; }
  else { label = 'Weak'; tone = 'red'; }

  const missing = KEY_DOMAINS.filter(d => !domains.has(d));

  return {
    score,
    label,
    tone,
    domains: Array.from(domains),
    contactCount: contacts.length,
    missing,
  };
}

const TONE_STYLES = {
  green: 'bg-green-50 text-green-700 border-green-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
};

export function toneClasses(tone) {
  return TONE_STYLES[tone] || TONE_STYLES.slate;
}
