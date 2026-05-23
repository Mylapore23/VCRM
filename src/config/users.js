export const USERS = [
  { id: 'u1', name: 'Sarah',  role: 'founder',   passcode: '7742' },
  { id: 'u2', name: 'Marcus', role: 'sales',     passcode: '3391' },
  { id: 'u3', name: 'Priya',  role: 'marketing', passcode: '8815' },
];

export function userById(id) {
  return USERS.find(u => u.id === id);
}

export function initials(name) {
  return name ? name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() : '?';
}
