export function canView(lead, currentUser) {
  if (!currentUser || !lead) return false;
  if (currentUser.role === 'admin') return true;
  if (lead.owner === currentUser.id) return true;
  return (lead.visibility || []).includes(currentUser.role);
}

export function canEdit(lead, currentUser) {
  if (!currentUser || !lead) return false;
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'marketing') {
    return lead.owner === currentUser.id || (lead.visibility || []).includes('marketing');
  }
  return lead.owner === currentUser.id || (lead.visibility || []).includes(currentUser.role);
}

export function canDelete(currentUser) {
  return currentUser?.role === 'admin';
}

export function canCreateLead(currentUser) {
  return currentUser?.role === 'admin' || currentUser?.role === 'sales';
}

export function canAssignVisibility(currentUser) {
  return currentUser?.role === 'admin';
}

export function canViewFinancials(currentUser) {
  return currentUser?.role !== 'marketing';
}

export function canFinaliseLessons(currentUser) {
  return currentUser?.role === 'admin';
}

export function canDeleteKnowledge(currentUser) {
  return currentUser?.role === 'admin';
}

export function canDeleteContent(currentUser) {
  return currentUser?.role === 'admin';
}

export function formatValue(value, currentUser) {
  if (!canViewFinancials(currentUser)) return '—';
  return value ? `$${value.toLocaleString()}` : '—';
}
