# Deployment Guide (Vercel & Render)

This guide covers how to deploy the KhaataAI application for production. We recommend deploying the Frontend on **Vercel** and the Backend on **Render**.

## 1. Backend Deployment (Render)

1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/app.js` (or `npm start` if defined in package.json)
4. Add Environment Variables:
   - `DATABASE_URL` (Your Supabase/Postgres connection string)
   - `GEMINI_API_KEY` (Your Google Gemini API Key)
   - `JWT_SECRET` (A strong, random secret key)
5. Deploy the service. Note the assigned Render URL (e.g., `https://khaata-backend.onrender.com`).

## 2. Frontend Deployment (Vercel CLI)

The frontend is a standard Vite React application, perfectly suited for Vercel.

### Prerequisites
Make sure you have the Vercel CLI installed and are logged in.
```bash
npm i -g vercel
vercel login
```

### Deployment Steps
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Initialize the Vercel project and link it:
   ```bash
   vercel link
   ```
3. Set the environment variable for your production backend URL (replace with your Render URL):
   ```bash
   vercel env add VITE_API_BASE_URL production
   # Enter the value: https://khaata-backend.onrender.com
   ```
4. Deploy to production:
   ```bash
   vercel --prod
   ```

### Alternatively: Deploying via Vercel Dashboard
1. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click "Add New... Project".
2. Import your GitHub repository.
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
4. Add the `VITE_API_BASE_URL` environment variable pointing to your backend URL.
5. Click **Deploy**.

## Troubleshooting
- **CORS Errors**: Ensure your backend `app.js` CORS configuration allows requests from your Vercel frontend domain in production.
- **Upload Failures**: Check that your backend host supports multipart/form-data limits suitable for your expected file sizes (Render standard limits usually suffice for invoices/receipts).
- **Database Connections**: If using Supabase, ensure you are using the pooled connection string (usually ending in `?pgbouncer=true` or port `6543`) for serverless/ephemeral environments.
