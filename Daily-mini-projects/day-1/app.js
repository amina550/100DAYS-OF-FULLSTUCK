/**
 * app.js — Day 1: Array Methods (map · filter · reduce)
 *
 * KEY CONCEPTS demonstrated here:
 *  - filter()  → keeps only items that pass a test
 *  - map()     → transforms every item into a new value (HTML row)
 *  - reduce()  → collapses the whole array into one value (total salary)
 *
 * ERROR LOGGING:
 *  Every DOM update is wrapped in a try/catch. If the DOM element is
 *  missing (e.g. a typo in an ID), the error is caught and logged
 *  visibly in the on-screen error log instead of silently failing.
 */

"use strict";

/* ============================================================
   1.  DOM REFS
   We grab all references once. If any element is null, we catch
   that later when we try to use it.
   ============================================================ */
const tableBody      = document.getElementById("table-body");
const emptyMsg       = document.getElementById("empty-msg");
const statCount      = document.getElementById("stat-count");
const statSalary     = document.getElementById("stat-salary");
const statAge        = document.getElementById("stat-age");
const roleFiltersEl  = document.getElementById("role-filters");
const sortBtns       = document.querySelectorAll(".btn--sort");
const resetBtn       = document.getElementById("reset-btn");
const errorList      = document.getElementById("error-list");
const errorCountEl   = document.getElementById("error-count");

/* ============================================================
   2.  STATE
   Single source of truth. Render() always reads from here.
   ============================================================ */
let state = {
  activeRole: "All",   // "All" | any role string
  sortOrder:  "none",  // "none" | "asc" | "desc"
};

let errorCount = 0;

/* ============================================================
   3.  ROLE BADGE COLOUR MAP
   ============================================================ */
const BADGE_CLASS = {
  Engineer:  "badge--engineer",
  Designer:  "badge--designer",
  Manager:   "badge--manager",
  Analyst:   "badge--analyst",
  DevOps:    "badge--devops",
  Marketing: "badge--marketing",
};

/* ============================================================
   4.  ERROR LOGGER
   Catches DOM update failures and shows them in the error panel.
   ============================================================ */
function logError(context, err) {
  errorCount++;

  // Update counter badge
  errorCountEl.textContent = errorCount;
  errorCountEl.classList.remove("zero");

  // Remove the "no errors" placeholder on first real error
  const placeholder = errorList.querySelector(".error-item--empty");
  if (placeholder) placeholder.remove();

  const li = document.createElement("li");
  li.className = "error-item";
  li.textContent = `[${new Date().toLocaleTimeString()}] ${context}: ${err.message}`;
  errorList.appendChild(li);

  // Also log to console for DevTools
  console.error(`[DOM Error — ${context}]`, err);
}

/* ============================================================
   5.  SAFE DOM WRITE
   Wraps every assignment so a missing element is caught.
   ============================================================ */
function safeDOMUpdate(label, fn) {
  try {
    fn();
  } catch (err) {
    logError(label, err);
  }
}

/* ============================================================
   6.  DERIVE VISIBLE DATA
   This is where filter() and sort() do their work.
   ============================================================ */
function getVisible() {
  // ── FILTER ──────────────────────────────────────────────────
  // filter() walks every user and keeps only those where the
  // test function returns true. If "All" is selected, every
  // user passes (always true).
  const filtered = USERS.filter(user => {
    if (state.activeRole === "All") return true;
    return user.role === state.activeRole;
  });

  // ── SORT ────────────────────────────────────────────────────
  // We create a shallow copy first (slice) so we never mutate
  // the filtered array in place — a subtle but important habit.
  if (state.sortOrder === "none") return filtered;

  return filtered.slice().sort((a, b) =>
    state.sortOrder === "asc" ? a.age - b.age : b.age - a.age
  );
}

/* ============================================================
   7.  COMPUTE STATS WITH reduce()
   ============================================================ */
function computeStats(visible) {
  // ── REDUCE: total salary ─────────────────────────────────────
  // reduce() takes two arguments:
  //   1. A "reducer" callback(accumulator, currentItem) → newAccumulator
  //   2. The INITIAL VALUE of the accumulator (0 here).
  //
  // Without the initial value:
  //   • If the array is empty → TypeError (no initial value & nothing to reduce)
  //   • If it's non-empty → first element becomes acc, which is an OBJECT,
  //     not a number, so acc + user.salary gives NaN silently.
  //
  // Always supply the initial value!
  const totalSalary = visible.reduce((acc, user) => {
    return acc + user.salary;   // acc starts at 0, grows with each user
  }, 0);                        // ← initial value — never forget this!

  // Average age — another reduce(), this time averaging
  const avgAge = visible.length === 0
    ? null
    : Math.round(
        visible.reduce((acc, user) => acc + user.age, 0) / visible.length
      );

  return { totalSalary, avgAge };
}

/* ============================================================
   8.  FORMAT HELPERS
   ============================================================ */
const formatCurrency = n =>
  "$" + n.toLocaleString("en-US");

/* ============================================================
   9.  RENDER
   The single function that updates the entire UI from state.
   ============================================================ */
function render() {
  const visible = getVisible();
  const { totalSalary, avgAge } = computeStats(visible);

  // ── TABLE ROWS via map() ─────────────────────────────────────
  // map() turns every user object into an HTML string (same length array).
  // We then join("") to produce one big string and set innerHTML once —
  // minimising reflows compared to appending row-by-row in a loop.
  safeDOMUpdate("table rows (map)", () => {
    if (visible.length === 0) {
      tableBody.innerHTML = "";
      emptyMsg.hidden = false;
    } else {
      emptyMsg.hidden = true;

      const rowsHTML = visible.map((user, index) => {
        const badgeClass = BADGE_CLASS[user.role] ?? "";
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(user.name)}</td>
            <td>${user.age}</td>
            <td><span class="badge ${badgeClass}">${escapeHTML(user.role)}</span></td>
            <td class="salary-cell">${formatCurrency(user.salary)}</td>
          </tr>`;
      });

      tableBody.innerHTML = rowsHTML.join("");
    }
  });

  // ── STATS ────────────────────────────────────────────────────
  safeDOMUpdate("stat-count", () => {
    statCount.textContent = visible.length;
  });

  safeDOMUpdate("stat-salary (reduce)", () => {
    statSalary.textContent = formatCurrency(totalSalary);
  });

  safeDOMUpdate("stat-age (reduce)", () => {
    statAge.textContent = avgAge !== null ? avgAge : "–";
  });

  // ── BUTTON ACTIVE STATES ────────────────────────────────────
  safeDOMUpdate("sort button states", () => {
    sortBtns.forEach(btn => {
      const isActive = btn.dataset.sort === state.sortOrder;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive);
    });
  });

  safeDOMUpdate("role button states", () => {
    roleFiltersEl.querySelectorAll(".btn--role").forEach(btn => {
      const isActive = btn.dataset.role === state.activeRole;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive);
    });
  });
}

/* ============================================================
   10.  SECURITY HELPER — prevent XSS
   Even with fake data, escaping HTML is a good habit.
   ============================================================ */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ============================================================
   11.  BUILD ROLE FILTER BUTTONS
   We derive the unique roles from the data itself using
   filter() + map() — so adding a new role to data.js
   automatically creates a button for it.
   ============================================================ */
function buildRoleButtons() {
  safeDOMUpdate("role filter buttons", () => {
    // Get unique roles from the dataset
    const roles = ["All", ...ROLES];

    const buttonsHTML = roles.map(role => {
      const isActive = role === state.activeRole;
      return `<button
        class="btn btn--role${isActive ? " active" : ""}"
        data-role="${escapeHTML(role)}"
        aria-pressed="${isActive}"
      >${escapeHTML(role)}</button>`;
    });

    roleFiltersEl.innerHTML = buttonsHTML.join("");

    // Attach click handlers to each new button
    roleFiltersEl.querySelectorAll(".btn--role").forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeRole = btn.dataset.role;
        render();
      });
    });
  });
}

/* ============================================================
   12.  SORT BUTTON HANDLERS
   ============================================================ */
sortBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    state.sortOrder = btn.dataset.sort;
    render();
  });
});

/* ============================================================
   13.  RESET
   ============================================================ */
resetBtn.addEventListener("click", () => {
  state.activeRole = "All";
  state.sortOrder  = "none";
  render();
});

/* ============================================================
   14.  INIT
   ============================================================ */
function init() {
  buildRoleButtons();
  render();

  // Mark error counter green (zero errors) on load
  errorCountEl.classList.add("zero");

  console.log(
    "%c[Day 1] Array Methods Demo loaded",
    "color:#00d4aa;font-weight:bold"
  );
  console.log(
    "%cOpen the console and try: getVisible(), USERS.filter(u => u.age > 40)",
    "color:#8892a4"
  );
}

init();
