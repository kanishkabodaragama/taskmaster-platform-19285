# TaskMaster Frontend (React)

Responsive web app with Ocean Professional design, Supabase authentication, dashboard analytics, notifications, settings, and website publishing.

## Quick start

1) Install dependencies
   npm install

2) Configure environment
   Copy .env.example to .env and set:
   - REACT_APP_SUPABASE_URL
   - REACT_APP_SUPABASE_KEY
   Optional:
   - REACT_APP_API_BASE

AI Assistant (OpenAI):
- REACT_APP_OPENAI_API_KEY
- REACT_APP_OPENAI_BASE_URL (optional, defaults to https://api.openai.com/v1)
- REACT_APP_OPENAI_MODEL (optional, defaults to gpt-4o-mini)

3) Run
   npm start

App runs at http://localhost:3000

## AI Assistant

A floating "Ask AI" button opens a drawer with a chat assistant powered by OpenAI. With your permission, it can read your task list to provide better answers and propose actions (create/update tasks). Proposed actions are only executed after your confirmation.

Setup:
1) Set REACT_APP_OPENAI_API_KEY in your .env (see .env.example)
2) Start the app. If the key is missing, the assistant will not be shown.

Privacy:
- Task context is only included if you enable the "Share task context" toggle.
- The assistant returns an ACTION JSON proposal; you must confirm to apply changes.

## Features

- Ocean Professional UI (blue primary #2563EB and amber accents #F59E0B)
- Landing page with CTA
- Auth (email/password) powered by Supabase
- Dashboard with KPIs and charts (react-chartjs-2/chart.js)
- Real-time notifications via WebSocket toaster (configurable URL)
- Settings with profile and notifications toggles
- Publish page simulating build and deploy flow
- Accessible, responsive layout: top nav + sidebar + content

## Supabase

Client is initialized from env vars inside src/supabase/SupabaseProvider.js.
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY
Optional:
- REACT_APP_SITE_URL (used by src/supabase/getURL.js to build dynamic redirects)

Sign-up uses emailRedirectTo based on dynamic URL from getURL(). Make sure redirect allowlist includes:
- http://localhost:3000/**
- your production domain /**

## RESTful API

Use src/lib/api.js for GET/POST helpers. Set REACT_APP_API_BASE when a backend is available.

## WebSocket Notifications

src/components/NotificationsToaster.js tries to connect to ws://<host>:4000/ws.
If unavailable, it provides a demo welcome notification. Adjust URL as needed to match backend.

## Scripts

- npm start
- npm run build
- npm test
