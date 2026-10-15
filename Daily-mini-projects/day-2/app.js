/**
 * app.js – Kanban Board Logic
 * ════════════════════════════════════════════════════════════════
 *
 * 📚 REACT CONCEPTS MAPPED TO VANILLA JS
 * ────────────────────────────────────────
 *
 *  React                    │  This file
 * ──────────────────────────┼──────────────────────────────────
 *  useState(initialValue)   │  AppState.state + AppState.set()
 *  useEffect(fn, [deps])    │  AppState.subscribe(fn)
 *  Component                │  renderColumn(), renderCard()
 *  Props                    │  Function arguments (task, column)
 *  Key prop (lists)         │  task.id used as data-task-id attr
 *  Lifting State Up         │  AppState is the single source of truth
 *  Controlled Input         │  form fields read/written via JS
 *  Conditional Rendering    │  hidden attr toggled on empty states / modal
 *  Context / Global State   │  AppState singleton (mirrors React Context)
 *
 * ════════════════════════════════════════════════════════════════
 */

"use strict";

/* ══════════════════════════════════════════════════════════════
   1.  STATE  (mirrors React useState / useReducer)
   ══════════════════════════════════════════════════════════════ */

const AppState = (() => {
  // Load persisted state from localStorage or fall back to seed data
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem("kanban_tasks")) ?? null; }
    catch { return null; }
  })();

  let state = {
    tasks: saved ?? [...INITIAL_TASKS],
    filter: "all",          // 'all' | 'high' | 'medium' | 'low'
    editingTaskId: null,    // null = new task, string = edit existing
  };

  const subscribers = new Set();

  /** Mirror of React's setState – merges partial update, notifies listeners */
  function set(partial) {
    state = { ...state, ...(typeof partial === "function" ? partial(state) : partial) };
    // Persist tasks to localStorage (like a useEffect side-effect)
    localStorage.setItem("kanban_tasks", JSON.stringify(state.tasks));
    subscribers.forEach(fn => fn(state));
  }

  /** Mirror of React's useEffect subscription pattern */
  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  function get() { return state; }

  return { get, set, subscribe };
})();


/* ══════════════════════════════════════════════════════════════
   2.  UTILITY HELPERS
   ══════════════════════════════════════════════════════════════ */

function uid() {
  return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function priorityMeta(p) {
  return { high: { icon: "🔴", label: "High" }, medium: { icon: "🟡", label: "Medium" }, low: { icon: "🟢", label: "Low" } }[p] ?? { icon: "⚪", label: p };
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(iso) {
  if (!iso) return false;
  return new Date(iso) < new Date(new Date().toDateString());
}

function showToast(msg, type = "info") {
  const area = document.getElementById("toast-area");
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  area.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    el.addEventListener("transitionend", () => el.remove());
  }, 3000);
}


/* ══════════════════════════════════════════════════════════════
   3.  COMPONENTS  (pure functions → mirror React function components)
   ══════════════════════════════════════════════════════════════ */

/**
 * renderCard(task) → HTMLElement
 * 📚 React: function Card({ task }) { return <div>…</div>; }
 */
function renderCard(task) {
  const card = document.createElement("article");
  card.className = "card";
  card.setAttribute("draggable", "true");
  card.setAttribute("data-task-id", task.id);   // ← React "key" equivalent
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "listitem");
  card.setAttribute("aria-label", task.title);

  const pm = priorityMeta(task.priority);
  const dueFmt = formatDate(task.due);
  const overdue = task.columnId !== "done" && isOverdue(task.due);

  card.innerHTML = `
    <div class="card-top">
      <span class="priority-badge priority-${task.priority}">${pm.icon} ${pm.label}</span>
      ${task.category ? `<span class="category-tag">${task.category}</span>` : ""}
    </div>
    <h3 class="card-title">${escHtml(task.title)}</h3>
    ${task.description ? `<p class="card-desc">${escHtml(task.description)}</p>` : ""}
    ${dueFmt ? `<div class="card-due ${overdue ? "overdue" : ""}">
      ${overdue ? "⚠️" : "📅"} ${dueFmt}
    </div>` : ""}
  `;

  // 📚 React: onClick handler on JSX element
  card.addEventListener("click", () => openModal(task.id));
  card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") openModal(task.id); });

  // ── Native HTML5 Drag events ──────────────────────────────
  card.addEventListener("dragstart", onCardDragStart);
  card.addEventListener("dragend",   onCardDragEnd);

  return card;
}

/**
 * renderColumn(column, tasks) → HTMLElement
 * 📚 React: function Column({ column, tasks }) { return <section>…</section>; }
 */
function renderColumn(column, tasks) {
  const col = document.createElement("section");
  col.className = "column";
  col.setAttribute("data-column-id", column.id);
  col.setAttribute("role", "list");
  col.setAttribute("aria-label", column.label);
  col.style.setProperty("--col-color", column.color);

  col.innerHTML = `
    <div class="column-header">
      <div class="column-header-left">
        <span class="column-dot"></span>
        <h2 class="column-title">${column.label}</h2>
      </div>
      <span class="column-count" aria-label="${tasks.length} tasks">${tasks.length}</span>
    </div>
    <div class="column-body" data-column-id="${column.id}">
      ${tasks.length === 0
        ? `<div class="empty-state">Drop tasks here</div>`
        : ""}
    </div>
    <button class="column-add-btn" data-column="${column.id}" aria-label="Add task to ${column.label}">＋ Add task</button>
  `;

  const body = col.querySelector(".column-body");

  // 📚 React: tasks.map(t => <Card key={t.id} task={t} />)
  tasks.forEach(t => body.appendChild(renderCard(t)));

  // ── Drop-zone events ──────────────────────────────────────
  body.addEventListener("dragover",  onDragOver);
  body.addEventListener("dragenter", onDragEnter);
  body.addEventListener("dragleave", onDragLeave);
  body.addEventListener("drop",      onDrop);

  col.querySelector(".column-add-btn").addEventListener("click", () => openModal(null, column.id));

  return col;
}


/* ══════════════════════════════════════════════════════════════
   4.  BOARD RENDER  (mirrors React's root render / reconciliation)
   ══════════════════════════════════════════════════════════════ */

function renderBoard(state) {
  const board = document.getElementById("board");
  const { tasks, filter } = state;

  // Filter tasks by priority (📚 React: derived state / useMemo)
  const visibleTasks = filter === "all" ? tasks : tasks.filter(t => t.priority === filter);

  board.innerHTML = "";

  COLUMNS.forEach(col => {
    const colTasks = visibleTasks.filter(t => t.columnId === col.id);
    board.appendChild(renderColumn(col, colTasks));
  });

  // Update filter button active states
  document.querySelectorAll(".btn-ghost[data-filter]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
}


/* ══════════════════════════════════════════════════════════════
   5.  DRAG-AND-DROP  (HTML5 native DnD API)
   ══════════════════════════════════════════════════════════════ */

let draggingId = null;
let dragSource = null;   // column the card started from

function onCardDragStart(e) {
  draggingId = e.currentTarget.dataset.taskId;
  dragSource  = AppState.get().tasks.find(t => t.id === draggingId)?.columnId;
  e.currentTarget.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", draggingId);
}

function onCardDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  document.querySelectorAll(".column-body").forEach(b => b.classList.remove("drag-over"));
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  insertionGhost(e);
}

function onDragEnter(e) {
  e.preventDefault();
  e.currentTarget.classList.add("drag-over");
}

function onDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove("drag-over");
  }
}

function onDrop(e) {
  e.preventDefault();
  const targetColumnId = e.currentTarget.dataset.columnId;
  e.currentTarget.classList.remove("drag-over");

  if (!draggingId || !targetColumnId) return;

  // 📚 React: setState call – triggers re-render
  AppState.set(s => ({
    tasks: s.tasks.map(t =>
      t.id === draggingId ? { ...t, columnId: targetColumnId } : t
    ),
  }));

  const colLabel = COLUMNS.find(c => c.id === targetColumnId)?.label ?? targetColumnId;
  if (targetColumnId !== dragSource) {
    showToast(`Moved to ${colLabel}`, "success");
  }
  draggingId = null;
  dragSource  = null;
}

/** Tiny insertion ghost – shows WHERE the card will land */
function insertionGhost(e) {
  const body  = e.currentTarget;
  const cards = [...body.querySelectorAll(".card:not(.dragging)")];
  const ghost = body.querySelector(".drop-ghost");
  const after = getDragAfterElement(body, e.clientY);

  if (!ghost) {
    const g = document.createElement("div");
    g.className = "drop-ghost";
    body.insertBefore(g, after ?? null);
  } else {
    body.insertBefore(ghost, after ?? null);
  }
}

function getDragAfterElement(container, y) {
  const draggableEls = [...container.querySelectorAll(".card:not(.dragging)")];
  return draggableEls.reduce((closest, el) => {
    const box = el.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    return offset < 0 && offset > closest.offset ? { offset, el } : closest;
  }, { offset: Number.NEGATIVE_INFINITY }).el;
}


/* ══════════════════════════════════════════════════════════════
   6.  MODAL  (📚 React: conditional rendering + controlled form)
   ══════════════════════════════════════════════════════════════ */

const backdrop  = document.getElementById("modal-backdrop");
const form      = document.getElementById("task-form");
const inputTitle    = document.getElementById("input-title");
const inputDesc     = document.getElementById("input-desc");
const inputPriority = document.getElementById("input-priority");
const inputDue      = document.getElementById("input-due");
const inputCategory = document.getElementById("input-category");
const inputColumn   = document.getElementById("input-column");
const btnDelete     = document.getElementById("btn-delete-task");
const modalHeading  = document.getElementById("modal-heading");

// Populate column <select>
COLUMNS.forEach(col => {
  const opt = document.createElement("option");
  opt.value = col.id;
  opt.textContent = col.label;
  inputColumn.appendChild(opt);
});

function openModal(taskId = null, defaultColumnId = "todo") {
  const state = AppState.get();
  const task  = taskId ? state.tasks.find(t => t.id === taskId) : null;

  AppState.set({ editingTaskId: taskId });
  modalHeading.textContent = task ? "Edit Task" : "New Task";
  btnDelete.hidden = !task;

  // 📚 React: Controlled inputs – set value from state
  inputTitle.value    = task?.title       ?? "";
  inputDesc.value     = task?.description ?? "";
  inputPriority.value = task?.priority    ?? "medium";
  inputDue.value      = task?.due         ?? "";
  inputCategory.value = task?.category    ?? "";
  inputColumn.value   = task?.columnId    ?? defaultColumnId;

  clearErrors();
  backdrop.hidden = false;
  backdrop.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => backdrop.classList.add("open"));
  inputTitle.focus();
}

function closeModal() {
  backdrop.classList.remove("open");
  backdrop.addEventListener("transitionend", () => {
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
  }, { once: true });
  AppState.set({ editingTaskId: null });
}

function clearErrors() {
  document.getElementById("err-title").hidden = true;
  inputTitle.classList.remove("input-error");
}

// ── Form Submit ───────────────────────────────────────────────
form.addEventListener("submit", e => {
  e.preventDefault();
  clearErrors();

  const title = inputTitle.value.trim();
  if (!title) {
    document.getElementById("err-title").hidden = false;
    inputTitle.classList.add("input-error");
    inputTitle.focus();
    return;
  }

  const { editingTaskId } = AppState.get();

  const taskData = {
    title,
    description: inputDesc.value.trim(),
    priority:    inputPriority.value,
    due:         inputDue.value     || null,
    category:    inputCategory.value.trim(),
    columnId:    inputColumn.value,
  };

  if (editingTaskId) {
    // 📚 React: immutable state update (spread + map)
    AppState.set(s => ({
      tasks: s.tasks.map(t =>
        t.id === editingTaskId ? { ...t, ...taskData } : t
      ),
    }));
    showToast("Task updated ✓", "success");
  } else {
    const newTask = { id: uid(), createdAt: new Date().toISOString(), ...taskData };
    AppState.set(s => ({ tasks: [...s.tasks, newTask] }));
    showToast("Task added ✓", "success");
  }

  closeModal();
});

// ── Delete ────────────────────────────────────────────────────
btnDelete.addEventListener("click", () => {
  const { editingTaskId } = AppState.get();
  if (!editingTaskId) return;
  if (!confirm("Delete this task?")) return;
  AppState.set(s => ({ tasks: s.tasks.filter(t => t.id !== editingTaskId) }));
  showToast("Task deleted", "info");
  closeModal();
});

// ── Close triggers ────────────────────────────────────────────
document.getElementById("modal-close").addEventListener("click", closeModal);
backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModal(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !backdrop.hidden) closeModal();
});


/* ══════════════════════════════════════════════════════════════
   7.  HEADER ACTIONS
   ══════════════════════════════════════════════════════════════ */

document.getElementById("btn-add-task").addEventListener("click", () => openModal());

document.querySelectorAll(".btn-ghost[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    AppState.set({ filter: btn.dataset.filter });
  });
});


/* ══════════════════════════════════════════════════════════════
   8.  SUBSCRIBE (📚 React: useEffect – re-render when state changes)
   ══════════════════════════════════════════════════════════════ */

AppState.subscribe(renderBoard);


/* ══════════════════════════════════════════════════════════════
   9.  BOOT
   ══════════════════════════════════════════════════════════════ */

renderBoard(AppState.get());


/* ══════════════════════════════════════════════════════════════
   10. HELPERS
   ══════════════════════════════════════════════════════════════ */

function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
