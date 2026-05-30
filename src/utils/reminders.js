// Returns 'red' if any active reminder is due within 2 days (or overdue),
// 'yellow' if any is due within 5 days, otherwise null.
export function reminderFlag(lead) {
  if (!lead?.reminders?.length) return null;
  const now = new Date();
  let flag = null;
  for (const r of lead.reminders) {
    if (r.done || !r.dueDate) continue;
    const due = new Date(r.dueDate);
    if (isNaN(due)) continue;
    const days = (due - now) / 86400000;
    if (days <= 2) return 'red';
    if (days <= 5 && flag !== 'red') flag = 'yellow';
  }
  return flag;
}

export function flagLabel(flag) {
  if (flag === 'red') return 'Reminder due within 2 days';
  if (flag === 'yellow') return 'Reminder due within 5 days';
  return '';
}
