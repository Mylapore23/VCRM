import { useMemo } from 'react';
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { userById, initials } from '../config/users';
import { STAGES, PriorityBadge } from '../components/Badges';

function MetricCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${accent || 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

function LeadCard({ lead }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const owner = userById(lead.owner);
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-slate-200 rounded-md p-3 mb-2 shadow-sm cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2" {...listeners} {...attributes}>
        <div
          className="font-medium text-slate-900 text-sm hover:text-blue-600"
          onClick={(e) => { e.stopPropagation(); navigate(`/leads/${lead.id}`); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {lead.company}
        </div>
        <PriorityBadge priority={lead.priority} />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500" {...listeners} {...attributes}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-semibold">
            {initials(owner?.name)}
          </div>
          <span>{owner?.name}</span>
        </div>
        {lead.value ? <span className="font-medium text-slate-700">${lead.value.toLocaleString()}</span> : null}
      </div>
    </div>
  );
}

function Column({ stage, leads }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-64 bg-slate-100 rounded-lg p-3 ${isOver ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{stage}</h3>
        <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <div className="min-h-[100px]">
        {leads.map(l => <LeadCard key={l.id} lead={l} />)}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, updateLead } = useApp();

  const metrics = useMemo(() => {
    const total = data.leads.length;
    const pipeline = data.leads
      .filter(l => l.stage !== 'Closed Lost')
      .reduce((sum, l) => sum + (l.value || 0), 0);
    const high = data.leads.filter(l => l.priority === 'High').length;
    const won = data.leads.filter(l => l.stage === 'Closed Won').length;
    return { total, pipeline, high, won };
  }, [data.leads]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const lead = data.leads.find(l => l.id === active.id);
    if (lead && lead.stage !== over.id) {
      updateLead(lead.id, { stage: over.id });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-5">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Leads" value={metrics.total} />
        <MetricCard label="Pipeline Value" value={`$${metrics.pipeline.toLocaleString()}`} accent="text-blue-600" />
        <MetricCard label="High Priority" value={metrics.high} accent="text-red-600" />
        <MetricCard label="Closed Won" value={metrics.won} accent="text-green-600" />
      </div>

      <h2 className="text-lg font-semibold text-slate-900 mb-3">Pipeline</h2>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <Column key={stage} stage={stage} leads={data.leads.filter(l => l.stage === stage)} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
