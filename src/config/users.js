export const USERS = [
  { id: 'u4', name: 'Dan Beasley', role: 'admin', passcode: '3232' },
  { id: 'u5', name: 'Jai J',       role: 'admin', passcode: '2323' },
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
