const PRIORITY_STYLES = {
  High: 'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STAGE_STYLES = {
  Prospect: 'bg-slate-100 text-slate-700 border-slate-200',
  Qualified: 'bg-blue-100 text-blue-700 border-blue-200',
  Proposal: 'bg-purple-100 text-purple-700 border-purple-200',
  Negotiation: 'bg-amber-100 text-amber-700 border-amber-200',
  'Closed Won': 'bg-green-100 text-green-700 border-green-200',
  'Closed Lost': 'bg-red-100 text-red-700 border-red-200',
};

export const STAGES = ['Prospect', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
export const PRIORITIES = ['High', 'Medium', 'Low'];

export function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${PRIORITY_STYLES[priority] || ''}`}>
      {priority}
    </span>
  );
}

export function StageBadge({ stage }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STAGE_STYLES[stage] || ''}`}>
      {stage}
    </span>
  );
}
