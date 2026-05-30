import { useMemo } from 'react';
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { userById, initials } from '../config/users';
import { STAGES, PriorityBadge, LockIcon, ReminderFlag } from '../components/Badges';
import { canEdit, canViewFinancials } from '../utils/permissions';
import { reminderFlag, flagLabel } from '../utils/reminders';
import { leadPipelineValue } from '../utils/value';

const OPEN_STAGES = new Set(['Prospect', 'Qualified', 'Proposal', 'Negotiation']);

function MetricCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${accent || 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

function OppCard({ lead, opp, draggable, currentUser }) {
  const navigate = useNavigate();
  const id = `${lead.id}::${opp.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled: !draggable });
  const owner = userById(opp.owner);
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const restricted = !lead.visibility || lead.visibility.length < 2;
  const flag = reminderFlag(lead);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-md p-3 mb-2 shadow-sm ${flag === 'red' ? 'border-red-300' : flag === 'yellow' ? 'border-amber-300' : 'border-slate-200'} ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1" {...(draggable ? listeners : {})} {...(draggable ? attributes : {})}>
        <div
          className="text-xs uppercase tracking-wide text-slate-500 hover:text-blue-600 flex items-center gap-1.5 min-w-0"
          onClick={(e) => { e.stopPropagation(); navigate(`/leads/${lead.id}`); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ReminderFlag flag={flag} title={flagLabel(flag)} />
          {restricted && <LockIcon className="text-slate-400" />}
          <span className="truncate">{lead.company}</span>
        </div>
        <PriorityBadge priority={opp.priority} />
      </div>
      <div
        className="font-medium text-slate-900 text-sm mb-2 hover:text-blue-600 line-clamp-2"
        onClick={(e) => { e.stopPropagation(); navigate(`/leads/${lead.id}`); }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {opp.title}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500" {...(draggable ? listeners : {})} {...(draggable ? attributes : {})}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-semibold">
            {initials(owner?.name)}
          </div>
          <span>{owner?.name}</span>
        </div>
        {canViewFinancials(currentUser) && opp.value ? <span className="font-medium text-slate-700">${Number(opp.value).toLocaleString()}</span> : null}
      </div>
      {lead.partner && (
        <div className="mt-2 text-xs inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
          🤝 {lead.partner}
        </div>
      )}
    </div>
  );
}

function Column({ stage, items, currentUser }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} className={`flex-shrink-0 w-64 bg-slate-100 rounded-lg p-3 ${isOver ? 'ring-2 ring-blue-400' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{stage}</h3>
        <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="min-h-[100px]">
        {items.map(({ lead, opp }) => (
          <OppCard key={`${lead.id}::${opp.id}`} lead={lead} opp={opp} draggable={canEdit(lead, currentUser)} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { visibleLeads, currentUser, updateSubLead } = useApp();
  const role = currentUser.role;

  // Flatten all visible opportunities for the role's scope.
  const items = useMemo(() => {
    const scope = role === 'sales' ? visibleLeads.filter(l => l.owner === currentUser.id) : visibleLeads;
    const out = [];
    scope.forEach(l => (l.subLeads || []).forEach(opp => out.push({ lead: l, opp })));
    return out;
  }, [visibleLeads, currentUser, role]);

  const scopeLeads = role === 'sales' ? visibleLeads.filter(l => l.owner === currentUser.id) : visibleLeads;
  const pipeline = scopeLeads.reduce((s, l) => s + leadPipelineValue(l), 0);
  const accounts = scopeLeads.length;
  const oppsCount = items.length;
  const openCount = items.filter(({ opp }) => OPEN_STAGES.has(opp.stage)).length;
  const highCount = items.filter(({ opp }) => opp.priority === 'High' && OPEN_STAGES.has(opp.stage)).length;
  const wonCount = items.filter(({ opp }) => opp.stage === 'Closed Won').length;
  const proposalCount = items.filter(({ opp }) => opp.stage === 'Proposal' || opp.stage === 'Negotiation').length;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const [leadId, oppId] = String(active.id).split('::');
    const lead = visibleLeads.find(l => l.id === leadId);
    const opp = lead?.subLeads?.find(s => s.id === oppId);
    if (opp && opp.stage !== over.id) {
      updateSubLead(leadId, oppId, { stage: over.id });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-5">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {role === 'admin' && (
          <>
            <MetricCard label="Accounts" value={accounts} />
            <MetricCard label="Pipeline Value" value={`$${pipeline.toLocaleString()}`} accent="text-blue-600" />
            <MetricCard label="Open Opportunities" value={openCount} />
            <MetricCard label="Closed Won" value={wonCount} accent="text-green-600" />
          </>
        )}
        {role === 'sales' && (
          <>
            <MetricCard label="My Accounts" value={accounts} />
            <MetricCard label="My Pipeline" value={`$${pipeline.toLocaleString()}`} accent="text-blue-600" />
            <MetricCard label="High-Priority Open" value={highCount} accent="text-red-600" />
            <MetricCard label="Closed Won" value={wonCount} accent="text-green-600" />
          </>
        )}
        {role === 'marketing' && (
          <>
            <MetricCard label="Visible Accounts" value={accounts} />
            <MetricCard label="Opportunities" value={oppsCount} />
            <MetricCard label="Proposals in Flight" value={proposalCount} accent="text-purple-600" />
          </>
        )}
      </div>

      <h2 className="text-lg font-semibold text-slate-900 mb-3">Pipeline (by opportunity)</h2>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <Column key={stage} stage={stage} currentUser={currentUser} items={items.filter(({ opp }) => opp.stage === stage)} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
