/* ═══════════════════════════════════════════════════════
   Day 3 — Custom Context Menu  |  script.js

   Concepts covered:
   ──────────────────────────────────────────────────────
   ✅ Event Delegation  – ONE listener on <body> handles
      right-clicks on every element via event bubbling.

   ✅ e.target          – The exact element the user
      right-clicked (may be a deeply nested child).

   ✅ e.currentTarget   – The element the listener is
      attached to (always <body> here, because that's
      where addEventListener is called).
   ═══════════════════════════════════════════════════════ */

'use strict';

// ── DOM references ────────────────────────────────────
const menu            = document.getElementById('contextMenu');
const menuGroupLabel  = document.getElementById('menuGroupLabel');
const contextActions  = document.getElementById('contextActions');
const contextSeparator= document.getElementById('contextSeparator');
const logger          = document.getElementById('logger');

// ── Context-specific menu items per card type ─────────
const CARD_MENUS = {
  image: [
    { action: 'save-image',   label: '💾 Save Image' },
    { action: 'copy-image',   label: '🖼️ Copy Image URL' },
    { action: 'view-full',    label: '🔍 View Full Size' },
  ],
  link: [
    { action: 'open-tab',     label: '🗂️ Open in New Tab' },
    { action: 'copy-link',    label: '🔗 Copy Link' },
    { action: 'bookmark',     label: '🔖 Bookmark Link' },
  ],
  text: [
    { action: 'copy-text',    label: '📝 Copy Text' },
    { action: 'search',       label: '🔎 Search Selected' },
    { action: 'translate',    label: '🌐 Translate' },
  ],
};

// ── Utility: build context-specific menu items ────────
function buildContextItems(cardType) {
  const items = CARD_MENUS[cardType] ?? [];

  if (items.length === 0) {
    contextActions.innerHTML = '';
    contextSeparator.hidden = true;
    menuGroupLabel.textContent = 'Page Actions';
    return;
  }

  menuGroupLabel.textContent = `${cardType.charAt(0).toUpperCase() + cardType.slice(1)} Actions`;
  contextSeparator.hidden = false;

  // Build buttons inside the <li id="contextActions">
  contextActions.innerHTML = items
    .map(item => `<button class="menu-item" data-action="${item.action}" role="menuitem">${item.label}</button>`)
    .join('');
}

// ── Utility: clamp menu position inside viewport ──────
function clampPosition(x, y) {
  const { offsetWidth: w, offsetHeight: h } = menu;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  return {
    left: x + w > vw ? vw - w - 8 : x,
    top:  y + h > vh ? vh - h - 8 : y,
  };
}

// ── Show the menu ─────────────────────────────────────
function showMenu(x, y, cardType) {
  buildContextItems(cardType);

  // Remove [hidden] so the element is in the layout,
  // then measure and clamp — avoids 0-size flash.
  menu.hidden = false;

  const { left, top } = clampPosition(x, y);
  menu.style.left = `${left}px`;
  menu.style.top  = `${top}px`;

  // Focus first item for keyboard accessibility
  menu.querySelector('.menu-item')?.focus();
}

// ── Hide the menu ─────────────────────────────────────
function hideMenu() {
  menu.hidden = true;
}

// ── Log an event entry in the inspector ──────────────
let logCount = 0;

function logEvent({ target, currentTarget, x, y }) {
  // Remove placeholder if still present
  logger.querySelector('.log-placeholder')?.remove();

  // Keep max 6 entries
  if (++logCount > 6) {
    logger.firstElementChild?.remove();
    logCount = 6;
  }

  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <span class="log-label">e.target</span>
    <span class="log-value">&lt;${target.tagName.toLowerCase()}${
      target.className ? ` class="${target.className}"` : ''
    }${target.dataset.type ? ` data-type="${target.dataset.type}"` : ''}&gt;</span>

    <span class="log-label">e.currentTarget</span>
    <span class="log-value current">&lt;${currentTarget.tagName.toLowerCase()}&gt;</span>

    <span class="log-label">coords</span>
    <span class="log-value coords">x: ${Math.round(x)}, y: ${Math.round(y)}</span>
  `;
  logger.appendChild(entry);
  logger.scrollTop = logger.scrollHeight;
}

// ════════════════════════════════════════════════════════
//  ★  EVENT DELEGATION
//  A SINGLE 'contextmenu' listener on <body> handles
//  right-clicks on EVERY element on the page.
//  The browser fires the event on the deepest clicked
//  element, then BUBBLES it up — body intercepts it here.
// ════════════════════════════════════════════════════════
document.body.addEventListener('contextmenu', (e) => {

  // 1️⃣  Block the browser's native context menu
  e.preventDefault();

  // ── Key concepts logged here ───────────────────────
  //
  //  e.target        → The ACTUAL element clicked.
  //                    Could be <span class="badge">,
  //                    <p>, <h2> — whatever is deepest.
  //
  //  e.currentTarget → The element this listener is on.
  //                    ALWAYS <body> because that is
  //                    where addEventListener was called.
  //
  // ──────────────────────────────────────────────────
  console.group('🖱️ contextmenu event fired');
  console.log('e.target        →', e.target);
  console.log('e.currentTarget →', e.currentTarget);
  console.log('Coordinates     →', `x:${e.clientX}, y:${e.clientY}`);
  console.groupEnd();

  // 2️⃣  Log to the on-page inspector
  logEvent({
    target:        e.target,
    currentTarget: e.currentTarget,
    x:             e.clientX,
    y:             e.clientY,
  });

  // 3️⃣  Walk up the DOM to find the nearest .card
  //     This is the heart of EVENT DELEGATION:
  //     we identify WHICH logical component was clicked
  //     by traversing from e.target upward.
  const card = e.target.closest('.card');
  showMenu(e.clientX, e.clientY, card?.dataset.type ?? null);
});

// ── Handle menu item clicks (also delegated!) ─────────
menu.addEventListener('click', (e) => {
  const btn = e.target.closest('.menu-item');
  if (!btn) return;

  const action = btn.dataset.action;

  if (action === 'close') {
    hideMenu();
    return;
  }

  // Demo actions
  const messages = {
    'copy':        '📋 Copied to clipboard! (demo)',
    'print':       '🖨️ Print dialog would open here.',
    'save-image':  '💾 Image saved! (demo)',
    'copy-image':  '🔗 Image URL copied! (demo)',
    'view-full':   '🔍 Full-size view opened! (demo)',
    'open-tab':    '🗂️ Opened in new tab! (demo)',
    'copy-link':   '🔗 Link copied! (demo)',
    'bookmark':    '🔖 Bookmarked! (demo)',
    'copy-text':   '📝 Text copied! (demo)',
    'search':      '🔎 Searching… (demo)',
    'translate':   '🌐 Translating… (demo)',
  };

  alert(messages[action] ?? `Action: ${action}`);
  hideMenu();
});

// ── Close menu on outside click ───────────────────────
document.addEventListener('click', (e) => {
  if (!menu.contains(e.target)) hideMenu();
});

// ── Close menu on Escape key ──────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideMenu();
});

// ── Close menu on scroll ──────────────────────────────
window.addEventListener('scroll', hideMenu, { passive: true });
