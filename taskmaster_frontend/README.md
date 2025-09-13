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

3) Run
   npm start

App runs at http://localhost:3000

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
