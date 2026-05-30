// Stages that count toward open pipeline.
const OPEN_STAGES = new Set(['Prospect', 'Qualified', 'Proposal', 'Negotiation']);

// Total $ value across the lead and all its sub-leads, regardless of stage.
export function leadTotalValue(lead) {
  if (!lead) return 0;
  const base = Number(lead.value) || 0;
  const subs = (lead.subLeads || []).reduce((s, x) => s + (Number(x.value) || 0), 0);
  return base + subs;
}

// Pipeline contribution: only counts the lead's value if it is in an open stage,
// and only counts each sub-lead's value if the sub-lead is in an open stage.
export function leadPipelineValue(lead) {
  if (!lead) return 0;
  const base = OPEN_STAGES.has(lead.stage) ? (Number(lead.value) || 0) : 0;
  const subs = (lead.subLeads || []).reduce(
    (s, x) => s + (OPEN_STAGES.has(x.stage) ? (Number(x.value) || 0) : 0),
    0,
  );
  return base + subs;
}
