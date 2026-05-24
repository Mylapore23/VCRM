import { ROLE_BADGE } from '../config/users';

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

const KNOWLEDGE_STYLES = {
  insight: 'bg-blue-100 text-blue-700',
  competitive: 'bg-purple-100 text-purple-700',
  messaging: 'bg-teal-100 text-teal-700',
  objection_handler: 'bg-amber-100 text-amber-700',
  win_story: 'bg-green-100 text-green-700',
  loss_analysis: 'bg-red-100 text-red-700',
};

export const STAGES = ['Prospect', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
export const PRIORITIES = ['High', 'Medium', 'Low'];
export const KNOWLEDGE_TYPES = ['insight', 'competitive', 'messaging', 'objection_handler', 'win_story', 'loss_analysis'];

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

export function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ROLE_BADGE[role] || ''} capitalize`}>
      {role}
    </span>
  );
}

export function KnowledgeTypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${KNOWLEDGE_STYLES[type] || 'bg-slate-100 text-slate-700'}`}>
      {type.replace('_', ' ')}
    </span>
  );
}

export function LessonStatusBadge({ status }) {
  if (status === 'final') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">Finalised ✓</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">Draft</span>;
}

export function LockIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3.5 h-3.5 ${className}`}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
