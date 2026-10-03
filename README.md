# AI Resume & Interview Coach

> **Build Better. Prepare Smarter. Get Hired.**

A complete, production-grade web application integrating AI-driven resume authoring, real ATS resume auditing, job description parsing, and live interactive interview simulation with multidimensional feedback.

---

## 🌟 The Six Connected Capabilities

1. **AI Resume Builder**
   - Author, polish, and quantify resume content tailored to any target role.
   - Built-in AI Bullet Point Enhancer transforming weak responsibilities into action-driven statements with metrics.
   - Server-side ATS-compliant PDF generation via ReportLab with instant preview and download.

2. **Real Resume Analyzer**
   - Native server-side parsing for **PDF**, **DOCX**, and **TXT** files.
   - Genuine calculated scoring across ATS Readability, Content Depth, Keywords, and Structure.
   - Granular breakdown of identified strengths, weaknesses, and missing high-impact keywords.

3. **Real ATS Optimization & Matching**
   - Cross-analyzes candidate resumes against authentic Job Descriptions.
   - Identifies matched vs. missing technical skills and target keywords.
   - Computes overall alignment percentage and provides actionable resume modifications.

4. **Real-Time AI Interview Coach**
   - ChatGPT-style live interview interface simulating HR, Technical, Behavioral, and Situational rounds.
   - Real-time dimensional scoring after each answer: Content, Technical Accuracy, Communication, and Structure.
   - Dynamic follow-up probing and context tracking throughout the session.

5. **STAR Method Behavioral Coach**
   - Deconstructs behavioral interview responses into Situation, Task, Action, and Result components.
   - Flags missing elements (e.g. missing quantifiable results) and provides a restructured formulation.

6. **Personalized Career Coach & Roadmap**
   - Real-time strategic guidance anchored directly on your verified profile background and recorded skills.
   - Generates 6-month phased transition blueprints with critical skill gap analysis.

---

## 🚀 Community Project Presentation Mode

Click the **`🚀 Live AI Demo`** button in the header at any time during presentations to access a guided walkthrough of all seven core capabilities:

1. **Upload a Real Resume** (extracts text and scores live)
2. **Paste a Real Job Description** (extracts structured requirements)
3. **Run ATS Analysis** (shows genuine alignment and gaps)
4. **Start a Live AI Interview** (generates dynamic opening question)
5. **Answer an Interview Question**
6. **Show AI Feedback Immediately** (real-time scoring and STAR breakdown)
7. **Ask the Career AI a Question** (context-aware mentoring)

---

## 🔒 Strict No-Fake-Data Guarantee

Every metric displayed on the dashboard, resume analyzer, ATS matcher, and interview coach is calculated directly from:
- User-provided profile records
- Server-extracted document text
- Target job descriptions
- Database entities
- Real-time LLM inference

---

## 🛠️ Technology Stack

### Frontend
- **React.js 19** with **TypeScript**
- **Vite** with **@tailwindcss/vite** (Modern Dark Theme & Glassmorphism)
- **Redux Toolkit** for state management
- **React Hook Form** for clean form validations
- **Axios** with JWT interceptors
- **React Router v7** for authenticated routing
- **Lucide React** for modern iconography

### Backend
- **Python 3.14 / 3.11+**
- **FastAPI** with async endpoints and SSE streaming capabilities
- **SQLAlchemy 2.0** ORM supporting PostgreSQL and SQLite seamlessly
- **ReportLab** for professional server-side PDF resume generation
- **pypdf** and **python-docx** for real document text extraction
- **Pydantic v2** & **Pydantic-Settings**
- **PyJWT** & **bcrypt** authentication

---

## 📁 Project Structure

```text
ai_resume_project/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Sidebar, ScoreGauge, ToastContainer, CareerChatModal, LiveDemoModal
│   │   ├── layouts/          # AppLayout, ProtectedRoute
│   │   ├── pages/            # LandingPage, Login, Register, Dashboard, ProfilePage,
│   │   │                     # ResumeBuilderPage, ResumeAnalyzerPage, ATSAnalyzerPage,
│   │   │                     # JobAnalyzerPage, JobMatchPage, InterviewCoachPage,
│   │   │                     # InterviewSessionPage, InterviewHistoryPage, STARCoachPage,
│   │   │                     # CareerCoachPage, CareerRoadmapPage, SkillsAnalysisPage, SettingsPage
│   │   ├── services/         # Axios client and typed API services
│   │   ├── store/            # Redux Toolkit store (authSlice, uiSlice)
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Route declarations
│   │   └── main.tsx          # Application entrypoint
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
│
├── backend/
│   ├── app/
│   │   ├── ai/               # provider.py, resume_ai.py, ats_ai.py, interview_ai.py, career_ai.py, star_ai.py
│   │   ├── api/              # auth, profile, resumes, resume_analysis, ats_analysis,
│   │   │                     # job_descriptions, job_match, interviews, star_analysis,
│   │   │                     # career_chat, dashboard, settings_api
│   │   ├── database/         # session.py, schema initialization
│   │   ├── models/           # SQLAlchemy ORM models (20 tables)
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # auth_service.py, pdf_service.py, file_extractor.py
│   │   ├── config.py         # App settings & env reader
│   │   └── main.py           # FastAPI entrypoint
│   ├── requirements.txt
│   └── test_system.py        # Automated test suite
│
├── database/
│   └── schema.sql            # Full PostgreSQL DDL schema with tables and indexes
├── .env.example              # Environment variables template
└── README.md
```

---

## ⚡ Quick Start & Setup Guide

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```

The backend API will be live at `http://localhost:8000`.  
Explore interactive Swagger documentation at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## 🔑 AI Key Configuration

You can configure your AI provider in either of two ways:
1. **Via the User Interface**: Navigate to `/settings` in the application, enter your OpenAI, Groq, Ollama, or DeepSeek API key and click **Save** and **Test Connection Live**.
2. **Via `.env`**: Set `AI_API_KEY` in `backend/.env`.

---

## 🧪 Automated System Verification

To run the automated backend test suite verifying authentication, profile management, dashboard calculations, and PDF generation:

```bash
cd backend
python test_system.py
```

Expected output:
```text
[PASS] 1. Backend Health Check: OK
[PASS] 2. User Registration: OK
[PASS] 3. Auth Me: OK
[PASS] 4. Profile Skills CRUD: OK (3 skills added)
[PASS] 5. Profile Experience CRUD: OK
[PASS] 6. Dashboard Calculated Stats: OK
[PASS] 7. Resume Document Created: OK
[PASS] 8. ReportLab PDF Generation: OK (2421 bytes generated)
[PASS] 9. Settings & AI Status: OK
=============================================
ALL SYSTEM CAPABILITY TESTS PASSED WITH 100% SUCCESS!
=============================================
```

---

## 📄 License
MIT License. Built for real-world career preparation.
