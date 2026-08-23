# CampusHub 🚀

Your own mini platform for college students — dashboard, assignment tracker, CGPA calculator, attendance tracker, and notes, all in one place.

This is **Version 1**: a pure HTML/CSS/JS frontend with no backend, no build step, and no dependencies. Your data is saved to your browser's `localStorage`, so it persists between visits on the same device.

## Features (V1)

- **Dashboard** — today's classes, upcoming assignments, upcoming exams, and a quick-notes scratchpad, all in one view.
- **Assignment Tracker** — add subject, title, deadline, and priority; mark items pending/completed; filter the list.
- **Exam Tracker** — lightweight companion to the assignment tracker, feeds the dashboard's "upcoming exams" card.
- **CGPA Calculator** — add semesters, add subjects with credits + grade (O/A+/A/B+/B/C/P/F, 10-point scale), get a live semester GPA and overall CGPA with a progress ring.
- **Attendance Tracker** — log classes attended vs. held per subject, see your %, and get a straight answer to *"how many classes can I miss?"* (or *"how many do I need to attend?"* if you're already under the line).
- **Notes** — create, edit, delete, and search notes.
- **Export / Import** — back up all your data to a `.json` file and restore it later or on another device.

## Getting started

No install needed.

```
cd frontend
open index.html      # macOS
start index.html      # Windows
xdg-open index.html   # Linux
```

Or just double-click `frontend/index.html`. Everything runs client-side.

> Data is stored per-browser via `localStorage`. Clearing your browser data will clear CampusHub's data too — use **Export data** in the sidebar to keep a backup.

## Project structure

```
CampusHub/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/          ← added in V2 (Java + Spring Boot)
├── database/          ← added in V2 (MySQL schema + migrations)
│
├── README.md
└── LICENSE
```

## Roadmap

| Version | What changes |
|---|---|
| V1 | Static frontend, `localStorage` persistence — what's in this repo now |
| V2 | Java + Spring Boot REST API, MySQL database, real accounts (signup/login), deployment |
| V3 | React frontend, charts/analytics, polish |

### Suggested build order (from the original plan)

1. Dashboard + CGPA calculator
2. Assignment tracker
3. Attendance tracker
4. Notes + search
5. MySQL database design
6. Java Spring Boot backend + REST endpoints
7. Login / signup (authentication)
8. Deployment (e.g. Vercel/Netlify for frontend, Render/Railway for backend + DB)

## Tech stack

- **V1 (this repo):** HTML, CSS, JavaScript (vanilla, no frameworks)
- **V2 backend:** Java + Spring Boot
- **V2 database:** MySQL
- **V3:** React, JWT/session auth, REST APIs, charting library, hosted deployment

## License

MIT — see [LICENSE](LICENSE).
