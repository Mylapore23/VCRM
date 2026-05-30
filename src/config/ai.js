// Anthropic API configuration.
// Set VITE_ANTHROPIC_API_KEY in a .env file at the project root (see .env.example).
// Do not commit real keys.
export const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
export const ANTHROPIC_MODEL = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
