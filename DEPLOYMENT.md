# Deployment Guide — Vercel (Frontend) + Render (Backend) + MongoDB Atlas

This project is split for production:

| Layer | Platform | Folder |
|-------|----------|--------|
| React (Vite) | **Vercel** | `/client` |
| Express API | **Render** | `/server` |
| Database | **MongoDB Atlas** | cloud |

After deployment, the frontend reads `VITE_API_BASE_URL` and calls your Render API automatically.

---

## 1. Production folder structure

```
Tool/
├── client/                 # React + Vite → deploy to Vercel
│   ├── src/
│   ├── vercel.json         # Vercel SPA + build settings
│   ├── .env.example
│   └── .env.production.example
├── server/                 # Express API → deploy to Render
│   ├── config/
│   │   ├── cors.js         # CORS for Vercel origin
│   │   ├── db.js
│   │   └── security.js     # Helmet + rate limits
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── render.yaml               # Render Blueprint (optional)
├── DEPLOYMENT.md             # This file
└── package.json              # Local dev scripts only
```

---

## 2. Environment variables

### MongoDB Atlas

1. Create a cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access** → create a DB user with password.
3. **Network Access** → add `0.0.0.0/0` (or Render/Vercel IPs) so the API can connect.
4. **Connect** → Drivers → copy connection string.
5. Replace `<password>` and set database name (e.g. `elite-hire`):

```
mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/elite-hire?retryWrites=true&w=majority
```

### Render (backend) — `server` Web Service

| Variable | Required | Example |
|----------|----------|---------|
| `NODE_ENV` | Yes | `production` |
| `MONGO_URI` | Yes | Atlas connection string |
| `JWT_SECRET` | Yes | Long random string (`openssl rand -base64 48`) |
| `CLIENT_URL` | Yes | `https://your-app.vercel.app` |
| `CLIENT_URLS` | No | `https://your-app-git-main.vercel.app` (preview) |
| `SEED_ON_START` | No | `true` first deploy, then `false` |
| `SERVE_CLIENT` | No | `false` (Vercel hosts UI) |
| `RATE_LIMIT_MAX` | No | `300` |
| `AUTH_RATE_LIMIT_MAX` | No | `20` |

Render sets `PORT` automatically — do not override it.

### Vercel (frontend)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_BASE_URL` | Yes | `https://elite-hire-api.onrender.com/api` |

Use your **actual** Render service URL. It must end with `/api`.

---

## 3. Security (already configured)

- **Helmet** — secure HTTP headers
- **Rate limiting** — global API + stricter `/api/auth`
- **CORS** — only `CLIENT_URL` / `CLIENT_URLS` (+ localhost in dev)
- **JWT** — required via `JWT_SECRET`
- **Errors** — stack traces hidden in production
- **JSON body limit** — 1 MB
- **Production DB** — no in-memory Mongo fallback; no local URI fallback
- **Seeder** — demo analytics data only in development

---

## 4. Deploy backend on Render

### Option A — Blueprint (`render.yaml`)

1. Push the repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo; Render reads `render.yaml`.
4. Set **manual** env vars when prompted: `MONGO_URI`, `CLIENT_URL` (after Vercel deploy).

### Option B — Manual Web Service

1. **New** → **Web Service** → connect GitHub repo.
2. Settings:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
3. Add environment variables from the table above.
4. **Create Web Service** and wait for deploy.
5. Open `https://YOUR-SERVICE.onrender.com/api/health` — should return `"status":"healthy"`.

**Atlas:** Under Network Access, allow connections (Render uses dynamic IPs; `0.0.0.0/0` is simplest for free tier).

**Default admin** (first start with `SEED_ON_START=true`):

- Email: `admin@elitehire.com`
- Password: `password123`  
  Change this immediately after first login.

---

## 5. Deploy frontend on Vercel

1. Push the repo to GitHub (if not already).
2. [vercel.com](https://vercel.com) → **Add New Project** → import repo.
3. Configure:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables** (Production + Preview):

   ```
   VITE_API_BASE_URL=https://YOUR-SERVICE.onrender.com/api
   ```

5. Deploy.

`vercel.json` handles SPA routing (all routes → `index.html`).

---

## 6. Connect frontend ↔ backend

1. Copy your Vercel URL, e.g. `https://elite-hire.vercel.app`.
2. In **Render** → your service → **Environment**:
   - `CLIENT_URL` = `https://elite-hire.vercel.app` (no trailing slash)
   - Optional: `CLIENT_URLS` = preview URL(s), comma-separated
3. **Save** → Render redeploys.
4. In **Vercel** → confirm `VITE_API_BASE_URL` points to Render `/api`.
5. Redeploy Vercel if you changed env vars.

Test: open Vercel URL → login → Analytics / Payment Tracker should load data.

---

## 7. Local development

```bash
# Install
npm run install-all

# server/.env
cp server/.env.example server/.env
# Edit MONGO_URI, JWT_SECRET

# client/.env
cp client/.env.example client/.env

# Run both
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:5000/api  

---

## 8. Build & scripts reference

| Command | Where | Purpose |
|---------|-------|---------|
| `npm run dev` | root | Client + server locally |
| `npm run build:client` | root | Production React build |
| `npm run start:server` | root | Start API only |
| `npm run seed` | server | Seed roles/admin |
| `npm run migrate:status` | server | Status migration |
| `npm run purge:data` | server | Clear module data |

---

## 9. Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error in browser | Set `CLIENT_URL` on Render to exact Vercel URL (https, no trailing slash) |
| API returns 502 / sleep | Render free tier spins down; first request may take ~50s |
| `MONGO_URI` / DB disconnected | Whitelist IP on Atlas; verify user/password in URI |
| Login works locally, not prod | Check `VITE_API_BASE_URL` ends with `/api`; redeploy Vercel |
| `querySrv ECONNREFUSED` | Atlas SRV blocked; try standard URI or network/DNS |
| Health check fails | Path must be `/api/health`; root directory `server` |

---

## 10. Post-deploy checklist

- [ ] `/api/health` returns healthy on Render
- [ ] `CLIENT_URL` matches Vercel production URL
- [ ] `VITE_API_BASE_URL` set on Vercel
- [ ] Change default admin password
- [ ] Set `SEED_ON_START=false` on Render after first boot
- [ ] Rotate `JWT_SECRET` if it was ever committed
- [ ] Restrict Atlas Network Access when possible

---

## Quick reference URLs

Replace placeholders after deploy:

```
Backend:  https://<render-service>.onrender.com/api
Health:   https://<render-service>.onrender.com/api/health
Frontend: https://<project>.vercel.app
```

The React app uses `VITE_API_BASE_URL` at **build time** on Vercel — any change requires a **redeploy**.
