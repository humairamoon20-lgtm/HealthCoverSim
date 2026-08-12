/**
 * API utility — all calls to the Express backend go through here.
 */

const API_BASE = 'http://localhost:5001/api';

export async function fetchQuotes() {
  const res = await fetch(`${API_BASE}/quotes`);
  if (!res.ok) throw new Error('Failed to fetch quotes');
  return res.json();
}

export async function fetchQuote(id) {
  const res = await fetch(`${API_BASE}/quotes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch quote');
  return res.json();
}

export async function createQuote(data) {
  const res = await fetch(`${API_BASE}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

export async function updateQuote(id, data) {
  const res = await fetch(`${API_BASE}/quotes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

export async function deleteQuote(id) {
  const res = await fetch(`${API_BASE}/quotes/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete quote');
  return res.json();
}
