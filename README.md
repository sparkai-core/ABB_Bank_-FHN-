# Smeta Yoxlama

ABB-styled tender checker against a **sample** price catalog. Official FHN prices are not loaded.

Runs fully in the browser (Vercel-ready). Auth and projects stay in `localStorage`.

## Local

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Optional local Python API still lives in `backend/` for comparison tests:

```bash
cd backend
py -3 -m app.server
```

## Vercel

Root deploy uses the frontend build:

1. Import the repo in Vercel
2. Root directory: leave as repo root (uses root `package.json` + `vercel.json`)
   - Or set Root Directory to `frontend` and ignore root `vercel.json`
3. Build: `npm run build`
4. Output: `frontend/dist` when using root scripts, or `dist` if root is `frontend`

Sample tenders for upload live in `frontend/public/samples/`.
