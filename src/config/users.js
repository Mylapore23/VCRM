export const USERS = [
  { id: 'u1', name: 'Sarah',       role: 'admin',     passcode: '7742' },
  { id: 'u2', name: 'Marcus',      role: 'sales',     passcode: '3391' },
  { id: 'u3', name: 'Priya',       role: 'marketing', passcode: '8815' },
  { id: 'u4', name: 'Dan Beasley', role: 'admin',     passcode: '3232' },
];

export function userById(id) {
  return USERS.find(u => u.id === id);
}

export function initials(name) {
  return name ? name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() : '?';
}

export const ROLE_BADGE = {
  admin:     'bg-indigo-100 text-indigo-700 border-indigo-200',
  sales:     'bg-blue-100 text-blue-700 border-blue-200',
  marketing: 'bg-teal-100 text-teal-700 border-teal-200',
};
