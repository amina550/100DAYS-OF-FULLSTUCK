/**
 * app.js — Sticky Notes Wall (Day 5)
 * Web Storage API: add / edit / delete notes persisted to localStorage.
 * Errors from JSON.stringify / JSON.parse are caught, logged to console,
 * and surfaced to the user via a toast notification.
 */

'use strict';

/* ─── Constants ──────────────────────────────────────────── */
const STORAGE_KEY   = 'stickyNotes_v1';
const TOAST_TIMEOUT = 3500; // ms
const COLOR_CLASSES = ['yellow', 'blue', 'green', 'pink', 'orange'];
const DEFAULT_COLOR = 'yellow';

/* ─── DOM references ─────────────────────────────────────── */
const grid        = document.getElementById('notes-grid');
const addBtn      = document.getElementById('add-note-btn');
const toast       = document.getElementById('toast');
const emptyState  = document.getElementById('empty-state');
const template    = document.getElementById('note-template');

/* ─── In-memory state ─────────────────────────────────────── */
let notes = [];      // Array<{ id, text, color, createdAt, updatedAt }>
let toastTimer = null;

/* ═══════════════════════════════════════════════════════════
   1.  STORAGE HELPERS
   ═══════════════════════════════════════════════════════════ */

/**
 * Persist the current notes array to localStorage.
 * Catches and logs any JSON.stringify errors.
 */
function saveNotes() {
  try {
    const serialised = JSON.stringify(notes);
    localStorage.setItem(STORAGE_KEY, serialised);
  } catch (err) {
    // ── Error logging requirement ──
    console.error('[StickyNotes] JSON.stringify failed while saving notes:', err);
    showToast(`Save error: ${err.message}`, 'error');
  }
}

/**
 * Load notes array from localStorage.
 * Catches and logs any JSON.parse errors, returning an empty array as fallback.
 * @returns {Array}
 */
function loadNotes() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    // Nothing stored yet — clean start.
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    // Guard: ensure we got an array (don't crash on corrupted data)
    if (!Array.isArray(parsed)) {
      throw new TypeError(`Expected Array, got ${typeof parsed}`);
    }

    return parsed;
  } catch (err) {
    // ── Error logging requirement ──
    console.error('[StickyNotes] JSON.parse failed while loading notes:', err);
    console.warn('[StickyNotes] Raw value that caused the error:', raw);
    showToast(`Load error: ${err.message}. Starting fresh.`, 'error');
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════
   2.  NOTE CRUD
   ═══════════════════════════════════════════════════════════ */

/** Generate a simple unique id */
function uid() {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Create a new blank note data object */
function createNoteData(color = DEFAULT_COLOR) {
  const now = new Date().toISOString();
  return { id: uid(), text: '', color, createdAt: now, updatedAt: now };
}

/** Add a note, persist, and render */
function addNote(data = createNoteData()) {
  notes.push(data);
  saveNotes();
  renderNote(data, /* focusBody */ true);
  toggleEmptyState();
}

/** Update an existing note's field(s) and persist */
function updateNote(id, changes) {
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return;
  notes[idx] = { ...notes[idx], ...changes, updatedAt: new Date().toISOString() };
  saveNotes();
}

/** Remove a note by id, destroy its DOM card, and persist */
function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  saveNotes();

  const card = grid.querySelector(`[data-id="${id}"]`);
  if (card) {
    card.style.transition = 'transform .2s ease, opacity .2s ease';
    card.style.transform  = 'scale(.8)';
    card.style.opacity    = '0';
    card.addEventListener('transitionend', () => card.remove(), { once: true });
  }

  toggleEmptyState();
}

/* ═══════════════════════════════════════════════════════════
   3.  RENDERING
   ═══════════════════════════════════════════════════════════ */

/**
 * Clone the <template> and populate it with note data.
 * @param {Object}  data        - Note data object
 * @param {boolean} focusBody   - Move cursor into the text body if true
 */
function renderNote(data, focusBody = false) {
  const fragment = template.content.cloneNode(true);
  const card     = fragment.querySelector('.note-card');
  const body     = fragment.querySelector('.note-body');
  const delBtn   = fragment.querySelector('.note-delete-btn');
  const dots     = fragment.querySelectorAll('.color-dot');
  const stamp    = fragment.querySelector('.note-timestamp');

  // Populate
  card.dataset.id    = data.id;
  card.dataset.color = data.color;
  body.textContent   = data.text;

  // Timestamp
  const ts = new Date(data.updatedAt);
  stamp.dateTime   = ts.toISOString();
  stamp.textContent = formatTimestamp(ts);

  // Colour dots — mark active
  dots.forEach(dot => {
    if (dot.dataset.color === data.color) dot.classList.add('active');

    dot.addEventListener('click', () => {
      const id    = card.dataset.id;
      const color = dot.dataset.color;
      card.dataset.color = color;
      card.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      updateNote(id, { color });
    });
  });

  // Inline editing — save on every input
  body.addEventListener('input', () => {
    updateNote(card.dataset.id, { text: body.textContent });
    // Update timestamp display
    const now  = new Date();
    stamp.dateTime    = now.toISOString();
    stamp.textContent = formatTimestamp(now);
  });

  // Delete
  delBtn.addEventListener('click', () => deleteNote(card.dataset.id));

  grid.appendChild(fragment);

  if (focusBody) {
    // Wait for element to be in DOM, then focus
    requestAnimationFrame(() => {
      const liveBody = grid.querySelector(`[data-id="${data.id}"] .note-body`);
      if (liveBody) liveBody.focus();
    });
  }
}

/** Render all notes from the notes array */
function renderAll() {
  grid.innerHTML = '';
  notes.forEach(n => renderNote(n));
  toggleEmptyState();
}

/** Format a Date object as a short human-readable string */
function formatTimestamp(date) {
  return date.toLocaleString(undefined, {
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/** Show / hide the empty-state panel */
function toggleEmptyState() {
  emptyState.hidden = notes.length > 0;
}

/* ═══════════════════════════════════════════════════════════
   4.  TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════════════ */

/**
 * Display a toast message.
 * @param {string} message
 * @param {'info'|'error'} type
 */
function showToast(message, type = 'info') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className   = `toast toast--${type} toast--show`;

  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--show');
  }, TOAST_TIMEOUT);
}

/* ═══════════════════════════════════════════════════════════
   5.  KEYBOARD SHORTCUT
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('keydown', e => {
  // Ctrl/Cmd + Enter → add a new note from anywhere
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    addNote();
  }
});

/* ═══════════════════════════════════════════════════════════
   6.  STORAGE EVENT — sync across tabs
   ═══════════════════════════════════════════════════════════ */

window.addEventListener('storage', e => {
  if (e.key !== STORAGE_KEY) return;

  try {
    const updated = e.newValue ? JSON.parse(e.newValue) : [];
    if (!Array.isArray(updated)) throw new TypeError('Stored data is not an Array');
    notes = updated;
    renderAll();
    showToast('Notes synced from another tab.', 'info');
  } catch (err) {
    console.error('[StickyNotes] JSON.parse failed on storage event:', err);
    showToast(`Sync error: ${err.message}`, 'error');
  }
});

/* ═══════════════════════════════════════════════════════════
   7.  BOOTSTRAP
   ═══════════════════════════════════════════════════════════ */

addBtn.addEventListener('click', () => addNote());

// Load persisted notes on startup
notes = loadNotes();
renderAll();

// Welcome message if first-ever visit
if (notes.length === 0) {
  showToast('Welcome! Click "+ Add Note" or press Ctrl + Enter.', 'info');
}
