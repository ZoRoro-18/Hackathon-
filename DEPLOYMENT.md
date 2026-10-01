# KhaataAI Production Deployment Guide

This guide provides exact step-by-step Windows PowerShell instructions to deploy both the Backend API and Frontend Dashboard to **Vercel** (or Render/Cloud).

---

## 1. Prerequisites

Verify you have the Vercel CLI installed and authenticated:
```powershell
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Log in to your Vercel account
vercel login
```

---

## 2. Backend Deployment (Vercel Serverless Function)

The backend is configured with `api/index.js` exporting the Express `app` and `vercel.json` rewrites with a 60-second function timeout for Gemini AI extractions.

### Step-by-Step PowerShell Commands:
```powershell
# Navigate to backend directory
cd D:\Hackathon\backend

# Link or initialize Vercel project
vercel link

# Add required Environment Variables to Vercel
vercel env add DATABASE_URL production
# (Paste your Supabase/PostgreSQL connection string with pgbouncer/pooling)

vercel env add GEMINI_API_KEY production
# (Paste your Google Gemini API key)

vercel env add GEMINI_MODEL production
# (Value: gemini-3.1-flash-lite or gemini-3.8-flash)

vercel env add JWT_SECRET production
# (Paste your secret key)

vercel env add FRONTEND_URL production
# (Paste your production frontend Vercel URL, e.g. https://khaata-frontend.vercel.app)

vercel env add NODE_ENV production
# (Value: production)

# Deploy Backend to Production
vercel --prod
```

---

## 3. Frontend Deployment (Vercel)

The frontend is a Vite + React application configured with `frontend/vercel.json` SPA rewrite rules.

### Step-by-Step PowerShell Commands:
```powershell
# Navigate to frontend directory
cd D:\Hackathon\frontend

# Verify local production build passes cleanly
npm run build

# Link Vercel project
vercel link

# Add backend API URL environment variable
vercel env add VITE_API_BASE_URL production
# (Enter the deployed backend Vercel URL, e.g. https://khaata-backend.vercel.app)

# Deploy Frontend to Production
vercel --prod
```

---

## 4. Alternative: Backend Deployment on Render

If running as a persistent Node.js service on Render:

1. Create a **New Web Service** connected to your repository.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
3. Add Environment Variables:
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (`gemini-3.1-flash-lite`)
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `NODE_ENV` (`production`)
4. Copy the assigned URL (`https://khaata-backend.onrender.com`) and supply it as `VITE_API_BASE_URL` in the frontend Vercel project.

---

## 5. Security & Verification Checklist

- [x] `.env` files are strictly excluded via `.gitignore` and `.vercelignore`.
- [x] No secrets or credentials are hardcoded in source files.
- [x] `app.set('trust proxy', 1)` is enabled for rate-limiting behind reverse proxies.
- [x] CORS dynamic origin resolution supports `FRONTEND_URL` and `*.vercel.app`.
- [x] Single Page Application (SPA) routing is preserved via `vercel.json` rewrites.
