/**
 * data.js  –  Seed data & column definitions
 * ═══════════════════════════════════════════
 * 📚 React Concept: "Props" – columns and tasks are the data
 *    passed as props from parent (Board) → child (Column → Card)
 */

const COLUMNS = [
  { id: "backlog",     label: "📋 Backlog",      color: "#6366f1" },
  { id: "todo",        label: "📌 To Do",         color: "#f59e0b" },
  { id: "in-progress", label: "🚀 In Progress",   color: "#3b82f6" },
  { id: "review",      label: "🔍 Review",        color: "#8b5cf6" },
  { id: "done",        label: "✅ Done",           color: "#10b981" },
];

const INITIAL_TASKS = [
  {
    id: "t1",
    title: "Set up project repository",
    description: "Init Git repo, add .gitignore, README, folder structure.",
    priority: "high",
    category: "Development",
    columnId: "done",
    due: "2026-10-10",
    createdAt: "2026-10-08T09:00:00Z",
  },
  {
    id: "t2",
    title: "Design wireframes for landing page",
    description: "Create low-fidelity wireframes in Figma for all main screens.",
    priority: "high",
    category: "Design",
    columnId: "done",
    due: "2026-10-12",
    createdAt: "2026-10-09T10:00:00Z",
  },
  {
    id: "t3",
    title: "Build component library",
    description: "Button, Input, Card, Modal base components with Storybook.",
    priority: "medium",
    category: "Development",
    columnId: "in-progress",
    due: "2026-10-18",
    createdAt: "2026-10-10T08:00:00Z",
  },
  {
    id: "t4",
    title: "Write API integration tests",
    description: "Cover auth, CRUD, and error-response endpoints.",
    priority: "high",
    category: "QA",
    columnId: "in-progress",
    due: "2026-10-17",
    createdAt: "2026-10-11T11:00:00Z",
  },
  {
    id: "t5",
    title: "SEO meta-tag audit",
    description: "Review og: tags, canonical URLs, sitemap.xml.",
    priority: "medium",
    category: "Marketing",
    columnId: "review",
    due: "2026-10-19",
    createdAt: "2026-10-12T14:00:00Z",
  },
  {
    id: "t6",
    title: "Set up CI/CD pipeline",
    description: "GitHub Actions workflow: lint → test → build → deploy.",
    priority: "high",
    category: "Development",
    columnId: "todo",
    due: "2026-10-20",
    createdAt: "2026-10-13T09:00:00Z",
  },
  {
    id: "t7",
    title: "Write onboarding documentation",
    description: "README, CONTRIBUTING.md, environment setup guide.",
    priority: "low",
    category: "Research",
    columnId: "todo",
    due: "2026-10-22",
    createdAt: "2026-10-13T10:00:00Z",
  },
  {
    id: "t8",
    title: "Accessibility (a11y) review",
    description: "Keyboard nav, ARIA labels, colour contrast ≥ 4.5:1.",
    priority: "medium",
    category: "QA",
    columnId: "backlog",
    due: "2026-10-25",
    createdAt: "2026-10-14T08:00:00Z",
  },
  {
    id: "t9",
    title: "Performance profiling",
    description: "Lighthouse audit & fix LCP / CLS / INP regressions.",
    priority: "low",
    category: "Development",
    columnId: "backlog",
    due: "2026-10-28",
    createdAt: "2026-10-14T09:00:00Z",
  },
];
