import { getStore } from './store.js';

const ACTIONS = 'actions';

/** All actions, newest first, with a derived SLA status. */
export async function listActions() {
  const store = await getStore();
  const actions = await store.all(ACTIONS);
  const now = Date.now();
  return actions
    .map((a) => {
      const dueMs = new Date(a.slaDueAt).getTime();
      const msLeft = dueMs - now;
      return {
        ...a,
        msLeft,
        breached: a.status === 'open' && msLeft < 0,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/** Resolve / acknowledge an action (founder marks it done). */
export async function updateActionStatus(id, status) {
  const store = await getStore();
  const existing = await store.get(ACTIONS, id);
  if (!existing) return null;
  const updated = { ...existing, status, resolvedAt: new Date().toISOString() };
  await store.set(ACTIONS, id, updated);
  return updated;
}
