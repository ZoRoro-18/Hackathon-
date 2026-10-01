# KhaataAI

KhaataAI is an intelligent financial document processing engine that leverages Google Gemini to automatically extract, categorize, and validate data from receipts, invoices, and bank statements.

## 🚀 The Problem
Small businesses and individuals spend countless hours manually entering data from physical receipts and PDF invoices into their accounting software. This manual process is:
- **Time-consuming** and tedious.
- **Prone to human error**, leading to inaccurate financial records.
- **Difficult to categorize** consistently without dedicated financial knowledge.

## 💡 The Solution
KhaataAI automates this entire pipeline. Users simply upload a picture or PDF of their financial document, and KhaataAI's AI engine takes over to:
1. **Extract** the core financial data (amount, currency, party name, date).
2. **Categorize** the transaction intelligently based on context.
3. **Validate** the data, providing a confidence score for the extraction.
4. **Structure** the output into a clean, queryable dashboard.

## 🧠 AI Pipeline Architecture
Our solution leverages **Google Gemini 1.5 Flash** for its multimodal capabilities and exceptional JSON structuring.
1. **Ingestion**: Document (Image/PDF) is uploaded via the React frontend.
2. **Processing**: The Node.js backend receives the file and securely transmits it to the Gemini API using the official `@google/genai` SDK.
3. **Multimodal Inference**: Gemini processes the visual and textual information simultaneously, guided by a strict JSON schema prompt.
4. **Validation & Storage**: The structured JSON response is validated, stored in PostgreSQL, and returned to the frontend.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS v4, Lucide React (Icons), React Hot Toast
- **Backend**: Node.js, Express, Multer (File Handling)
- **Database**: PostgreSQL (Supabase / Local)
- **AI Engine**: Google Gemini 1.5 Flash API (`@google/genai`)

## ⚙️ Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Google Gemini API Key

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/khaata-ai.git
cd khaata-ai

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/khaata
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_super_secret_jwt_key
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_BASE_URL=http://localhost:5000
```

### 3. Database Setup
Run the SQL schema provided in `backend/database.sql` against your PostgreSQL instance to create the `users` and `documents` tables.

### 4. Run the Application
Start the backend server:
```bash
cd backend
npm run dev
```

Start the frontend development server:
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 🎨 UI/UX Design
KhaataAI features a premium, modern dark-mode aesthetic inspired by leading fintech platforms. It utilizes a slate and teal color palette with glassmorphic elements and subtle micro-animations to create a highly responsive and professional user experience.
