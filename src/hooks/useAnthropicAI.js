import { useCallback } from 'react';
import { userById } from '../config/users';

const API_KEY_STORAGE = 'voltara_api_key';
const MODEL = 'claude-sonnet-4-20250514';
const API_URL = 'https://api.anthropic.com/v1/messages';

export function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

export function setApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
}

async function callClaude({ system, messages, tools }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Missing Anthropic API key. Set it via the banner at the top.');

  const body = {
    model: MODEL,
    max_tokens: 1500,
    system,
    messages,
  };
  if (tools) body.tools = tools;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }
  return res.json();
}

function extractText(response) {
  if (!response?.content) return '';
  return response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');
}

function extractSources(response) {
  const urls = new Set();
  if (!response?.content) return [];
  for (const block of response.content) {
    if (block.type === 'text' && block.citations) {
      for (const c of block.citations) {
        if (c.url) urls.add(c.url);
      }
    }
    if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
      for (const r of block.content) {
        if (r.url) urls.add(r.url);
      }
    }
  }
  return Array.from(urls).slice(0, 5);
}

export function useAnthropicAI() {
  const fetchWebIntel = useCallback(async (company, query) => {
    const system = `You are a GTM research assistant for Voltara LLC. Research the company and topic provided. Return a concise summary (3-5 bullet points) and list up to 3 source URLs.`;
    const userMsg = `Company: ${company}\nResearch question: ${query}\n\nProvide a concise bullet-point summary.`;
    const response = await callClaude({
      system,
      messages: [{ role: 'user', content: userMsg }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
    });
    const summary = extractText(response) || 'No summary available.';
    const sources = extractSources(response);
    return { summary, sources };
  }, []);

  const generatePitchOutline = useCallback(async (lead, intelNotes) => {
    const system = `You are a pitch writing assistant for Voltara LLC, a GTM intelligence platform helping sales teams research and engage high-value accounts. Draft a concise pitch outline in markdown for the opportunity described. Use clear headings (## Problem, ## Why Now, ## Voltara Fit, ## Recommended Next Steps).`;
    const ownerName = userById(lead.owner)?.name || 'team';
    const intelText = (intelNotes || []).slice(0, 8).map(n => `- ${n.text}`).join('\n') || '(none)';
    const webIntel = (lead.webIntel || []).slice(0, 3).map(w => `- ${w.query}: ${w.summary}`).join('\n') || '(none)';
    const userMsg = `Lead profile:
Company: ${lead.company}
Contact: ${lead.contact}${lead.contactEmail ? ` (${lead.contactEmail})` : ''}
Stage: ${lead.stage}
Priority: ${lead.priority}
Estimated value: ${lead.value ? `$${lead.value.toLocaleString()}` : 'unknown'}
Owner: ${ownerName}
Tags: ${(lead.tags || []).join(', ') || 'none'}

Manual intel notes:
${intelText}

Web intel:
${webIntel}

Draft a starter pitch outline in markdown.`;
    const response = await callClaude({
      system,
      messages: [{ role: 'user', content: userMsg }],
    });
    return extractText(response) || '# Pitch outline\n\n(AI returned no content.)';
  }, []);

  return { fetchWebIntel, generatePitchOutline };
}
