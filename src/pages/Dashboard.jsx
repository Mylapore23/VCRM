import { useMemo } from 'react';
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { userById, initials } from '../config/users';
import { STAGES, PriorityBadge, LockIcon, ReminderFlag } from '../components/Badges';
import { canEdit, canViewFinancials, formatValue } from '../utils/permissions';
import { reminderFlag, flagLabel } from '../utils/reminders';

function MetricCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${accent || 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

function LeadCard({ lead, draggable, currentUser }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id, disabled: !draggable });
  const owner = userById(lead.owner);
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const restricted = !lead.visibility || lead.visibility.length < 2;
  const flag = reminderFlag(lead);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-md p-3 mb-2 shadow-sm ${flag === 'red' ? 'border-red-300' : flag === 'yellow' ? 'border-amber-300' : 'border-slate-200'} ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2" {...(draggable ? listeners : {})} {...(draggable ? attributes : {})}>
        <div
          className="font-medium text-slate-900 text-sm hover:text-blue-600 flex items-center gap-1.5"
          onClick={(e) => { e.stopPropagation(); navigate(`/leads/${lead.id}`); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ReminderFlag flag={flag} title={flagLabel(flag)} />
          {restricted && <LockIcon className="text-slate-400" />}
          {lead.company}
        </div>
        <PriorityBadge priority={lead.priority} />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500" {...(draggable ? listeners : {})} {...(draggable ? attributes : {})}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-semibold">
            {initials(owner?.name)}
          </div>
          <span>{owner?.name}</span>
        </div>
        {canViewFinancials(currentUser) && lead.value ? <span className="font-medium text-slate-700">${lead.value.toLocaleString()}</span> : null}
      </div>
      {lead.partner && (
        <div className="mt-2 text-xs inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100" {...(draggable ? listeners : {})} {...(draggable ? attributes : {})}>
          🤝 {lead.partner}
        </div>
      )}
    </div>
  );
}

function Column({ stage, leads, currentUser }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} className={`flex-shrink-0 w-64 bg-slate-100 rounded-lg p-3 ${isOver ? 'ring-2 ring-blue-400' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{stage}</h3>
        <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <div className="min-h-[100px]">
        {leads.map(l => <LeadCard key={l.id} lead={l} draggable={canEdit(l, currentUser)} currentUser={currentUser} />)}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { visibleLeads, currentUser, updateLead } = useApp();
  const role = currentUser.role;

  const metrics = useMemo(() => {
    const scope = role === 'sales' ? visibleLeads.filter(l => l.owner === currentUser.id) : visibleLeads;
    const total = scope.length;
    const pipeline = scope.filter(l => l.stage !== 'Closed Lost' && l.stage !== 'Closed Won').reduce((s, l) => s + (l.value || 0), 0);
    const high = scope.filter(l => l.priority === 'High').length;
    const won = scope.filter(l => l.stage === 'Closed Won').length;
    const proposals = scope.filter(l => l.stage === 'Proposal' || l.stage === 'Negotiation').length;
    return { total, pipeline, high, won, proposals };
  }, [visibleLeads, currentUser, role]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const lead = visibleLeads.find(l => l.id === active.id);
    if (lead && lead.stage !== over.id) {
      updateLead(lead.id, { stage: over.id });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-5">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {role === 'admin' && (
          <>
            <MetricCard label="Total Leads" value={metrics.total} />
            <MetricCard label="Pipeline Value" value={`$${metrics.pipeline.toLocaleString()}`} accent="text-blue-600" />
            <MetricCard label="High Priority" value={metrics.high} accent="text-red-600" />
            <MetricCard label="Closed Won" value={metrics.won} accent="text-green-600" />
          </>
        )}
        {role === 'sales' && (
          <>
            <MetricCard label="My Leads" value={metrics.total} />
            <MetricCard label="My Pipeline Value" value={`$${metrics.pipeline.toLocaleString()}`} accent="text-blue-600" />
            <MetricCard label="High Priority" value={metrics.high} accent="text-red-600" />
            <MetricCard label="Closed Won" value={metrics.won} accent="text-green-600" />
          </>
        )}
        {role === 'marketing' && (
          <>
            <MetricCard label="Visible Leads" value={metrics.total} />
            <MetricCard label="Proposals in Flight" value={metrics.proposals} accent="text-purple-600" />
            <MetricCard label="High Priority" value={metrics.high} accent="text-red-600" />
          </>
        )}
      </div>

      <h2 className="text-lg font-semibold text-slate-900 mb-3">Pipeline</h2>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <Column key={stage} stage={stage} currentUser={currentUser} leads={visibleLeads.filter(l => l.stage === stage)} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
