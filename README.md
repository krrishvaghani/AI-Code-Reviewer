<div align="center">

# 🤖 AI Code Reviewer

**A full-stack, production-ready AI-powered code review platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Live Demo](#) · [Report Bug](https://github.com/krrishvaghani/AI-Code-Reviewer/issues) · [Request Feature](https://github.com/krrishvaghani/AI-Code-Reviewer/issues)

![AI Code Reviewer Dashboard](docs/screenshots/dashboard-preview.png)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [VS Code Extension Setup](#vs-code-extension-setup)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**AI Code Reviewer** is a professional-grade, full-stack web application that harnesses the power of large language models (Google Gemini and OpenAI GPT-4) to deliver instant, actionable code review feedback. It goes beyond simple linting — it detects bugs, suggests optimizations, explains complex code, analyzes entire GitHub repositories, and even reviews GitHub Pull Requests automatically via webhook.

The platform ships with a modern React dashboard, JWT-based user authentication, a persistent review history stored in SQLite, and a VS Code extension — making it an end-to-end developer productivity tool.

> **Built as a portfolio project demonstrating full-stack engineering, LLM integration, SaaS architecture, and developer tooling.**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI Code Review** | Paste or upload code and receive structured feedback: bugs, optimizations, improved code, and plain-English explanations |
| 🐛 **Bug Detection** | Identifies logic errors, null-pointer risks, off-by-one errors, and anti-patterns |
| ⚡ **Optimization Suggestions** | Flags inefficient algorithms and proposes faster alternatives with time/space complexity analysis |
| 📖 **Code Explanation** | Generates clear, layered explanations of unfamiliar or legacy code |
| 🐙 **GitHub Repo Analysis** | Enter any public GitHub URL to get an AI-powered architectural overview and code quality report |
| 🔀 **PR Auto-Reviewer** | GitHub webhook integration automatically posts AI review comments on every new Pull Request |
| 💬 **Chat with Code** | Conversational AI assistant — ask follow-up questions about your code in natural language |
| 📁 **File Upload** | Upload `.py`, `.js`, `.ts`, `.java`, `.cpp` files directly; language is auto-detected |
| 📜 **Review History** | All reviews are persisted per-user in a SQLite database and browsable in the dashboard |
| 🔐 **JWT Authentication** | Secure signup/login with bcrypt-hashed passwords and 7-day JWT sessions |
| 🧩 **VS Code Extension** | Native extension brings review, explanation, and chat directly into the editor |
| 🌗 **Dark-mode UI** | Fully responsive dashboard with sidebar navigation, built with Tailwind CSS |

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance async REST API framework |
| **Python 3.11+** | Core runtime |
| **Google Gemini 2.0 Flash** | Primary LLM for code analysis |
| **OpenAI GPT-4o-mini** | Alternative LLM provider |
| **SQLAlchemy 2.0 + SQLite** | ORM and persistent review history storage |
| **python-jose + passlib** | JWT token generation and bcrypt password hashing |
| **Pydantic v2** | Request/response validation and settings management |
| **Uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI |
| **Vite** | Lightning-fast build tooling |
| **Tailwind CSS 3** | Utility-first styling |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client with auth interceptors |
| **Monaco Editor** | VS Code-grade in-browser code editor |

### DevOps & Tooling
| Technology | Purpose |
|---|---|
| **Render** | Cloud deployment (backend + static frontend) |
| **VS Code Extension API** | Native IDE integration |
| **GitHub Webhooks** | Automated PR review pipeline |
| **Git + GitHub** | Version control and CI/CD |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │  React Web App   │    │  VS Code Extension│    │  GitHub PR    │  │
│  │  (Vite + Tailwind│    │  (Extension API) │    │  (Webhook)    │  │
│  └────────┬─────────┘    └────────┬─────────┘    └──────┬────────┘  │
└───────────┼──────────────────────┼────────────────────┼────────────┘
            │  HTTPS / REST        │  HTTPS / REST       │  Webhook POST
            ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND                                │
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐   │
│  │ /auth/*    │ │ /api/review│ │ /api/chat  │ │ /api/github/*  │   │
│  │ JWT Auth   │ │ Code Review│ │  Chat Mode │ │ Repo + Webhook │   │
│  └────────────┘ └─────┬──────┘ └─────┬──────┘ └──────┬─────────┘   │
│                        │              │               │              │
│              ┌─────────▼──────────────▼───────────────▼──────────┐  │
│              │              AI SERVICE LAYER                      │  │
│              │  ┌─────────────────┐   ┌──────────────────────┐   │  │
│              │  │ Google Gemini   │   │   OpenAI GPT-4o-mini  │   │  │
│              │  │ 2.0 Flash       │   │   (fallback / alt)    │   │  │
│              │  └─────────────────┘   └──────────────────────┘   │  │
│              └───────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     DATA LAYER                               │   │
│  │    SQLite (SQLAlchemy 2.0)  ·  Users  ·  Review History     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Request lifecycle (Code Review):**
1. User pastes/uploads code in the React editor and clicks **Review Code**
2. Frontend POSTs `{ code, language }` to `POST /api/review` with JWT `Authorization: Bearer` header
3. FastAPI validates the token, routes to `ai_reviewer.py`, which calls the selected LLM provider
4. LLM returns structured JSON: `{ issues, suggestions, improved_code, explanation, complexity }`
5. Response is rendered in the Review Panel; the result is silently saved to the user's history in SQLite

---

## 📁 Project Structure

```
AI-Code-Reviewer/
│
├── backend/                        # FastAPI Python application
│   ├── auth/
│   │   └── jwt_handler.py          # JWT creation, decoding, FastAPI dependencies
│   ├── core/
│   │   └── config.py               # Pydantic settings (env-based config)
│   ├── models/
│   │   ├── db_models.py            # SQLAlchemy ORM models (User, ReviewHistory)
│   │   └── schemas.py              # Pydantic request/response schemas
│   ├── routes/
│   │   ├── auth.py                 # POST /auth/signup, /auth/login, GET /auth/me
│   │   ├── review.py               # POST /api/review
│   │   ├── chat.py                 # POST /api/chat-with-code
│   │   ├── github_review.py        # POST /api/github/review
│   │   ├── github_webhook.py       # POST /api/webhook/github  (PR auto-review)
│   │   └── history.py              # GET/POST/DELETE /api/history
│   ├── services/
│   │   ├── ai_reviewer.py          # Core review orchestration
│   │   ├── gemini_service.py       # Google Gemini integration
│   │   ├── chat_service.py         # Conversational AI logic
│   │   ├── github_service.py       # GitHub API client (repo analysis)
│   │   └── github_webhook_service.py # PR review automation
│   ├── database.py                 # SQLAlchemy engine + get_db() dependency
│   ├── main.py                     # FastAPI app, CORS, router registration
│   ├── requirements.txt
│   ├── Procfile                    # Render/Heroku deploy command
│   └── .env.example                # Environment variable template
│
├── frontend/                       # React + Vite application
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state (token, user, login/logout)
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Public marketing landing page
│   │   │   ├── LoginPage.jsx       # Authentication form
│   │   │   ├── SignupPage.jsx      # Registration with password strength meter
│   │   │   ├── DashboardLayout.jsx # Sidebar + protected route wrapper
│   │   │   ├── CodeReviewPage.jsx  # Main code review interface
│   │   │   ├── ChatPage.jsx        # Chat with your code
│   │   │   ├── GithubReviewPage.jsx# GitHub repository analyzer
│   │   │   ├── HistoryPage.jsx     # Past review history browser
│   │   │   └── SettingsPage.jsx    # Profile + backend configuration
│   │   ├── components/             # Reusable UI components
│   │   ├── hooks/                  # Custom React hooks (useCodeReview, useChat…)
│   │   ├── services/
│   │   │   ├── api.js              # Axios instance with auth interceptor
│   │   │   └── authApi.js          # Auth + history API functions
│   │   ├── App.jsx                 # Root router (<Routes>)
│   │   └── main.jsx                # Entry point (BrowserRouter + AuthProvider)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── vscode-extension/               # VS Code Extension
│   ├── src/
│   │   ├── extension.js            # Extension entry point + command registration
│   │   ├── reviewPanel.js          # Webview: code review panel
│   │   ├── chatPanel.js            # Webview: chat panel
│   │   └── apiClient.js            # Backend API calls from extension
│   └── package.json
│
├── docs/
│   └── screenshots/                # Add your screenshots here
│
├── render.yaml                     # One-click Render deployment config
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** and **npm** — [Download](https://nodejs.org/)
- A **Google Gemini API key** (free) — [Get one](https://aistudio.google.com/app/apikey)  
  _or_ an **OpenAI API key** — [Get one](https://platform.openai.com/api-keys)
- **Git**

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/krrishvaghani/AI-Code-Reviewer.git
cd AI-Code-Reviewer/backend

# 2. Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Choose your AI provider: "gemini" or "openai"
AI_PROVIDER=gemini

# Google Gemini (if AI_PROVIDER=gemini)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# OpenAI (if AI_PROVIDER=openai)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Security — change this to a long random secret in production!
JWT_SECRET=your-super-secret-key-change-me

# CORS — comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:5173

# GitHub webhook secret (optional — for PR auto-review)
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

```bash
# 5. Start the development server
uvicorn main:app --reload --port 8000
```

The API is now running at `http://localhost:8000`.  
Interactive docs available at `http://localhost:8000/docs`.

---

### Frontend Setup

```bash
# From the repo root
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment (optional — defaults to localhost:8000)
# Copy and edit if your backend runs elsewhere
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

# 3. Start the development server
npm run dev
```

The app is now running at `http://localhost:5173`.

---

### VS Code Extension Setup

```bash
cd vscode-extension

# 1. Install dependencies
npm install

# 2. Open in VS Code
code .

# 3. Press F5 to launch the Extension Development Host
#    This opens a new VS Code window with the extension loaded.
```

To configure the extension, open VS Code Settings and search for **"AI Code Reviewer"** to set your backend URL.

---

## 📖 Usage

### Web Application

| Page | URL | Description |
|---|---|---|
| Landing | `/` | Marketing page with features overview |
| Sign Up | `/signup` | Create a new account |
| Log In | `/login` | Sign in to your account |
| Code Review | `/dashboard/review` | Paste or upload code for AI review |
| Chat | `/dashboard/chat` | Conversational AI assistant |
| GitHub Review | `/dashboard/github` | Analyze any public GitHub repository |
| History | `/dashboard/history` | Browse and manage past reviews |
| Settings | `/dashboard/settings` | Account info and backend configuration |

**Reviewing code:**
1. Navigate to **Dashboard → Code Review**
2. Select your language or upload a file (`.py`, `.js`, `.ts`, `.java`, `.cpp`)
3. Paste or type your code in the Monaco editor
4. Click **Review Code**
5. Results appear in the right panel: bugs, suggestions, improved code, complexity analysis

**Using the GitHub Analyzer:**
1. Navigate to **Dashboard → GitHub Review**
2. Paste a public GitHub repository URL (e.g., `https://github.com/facebook/react`)
3. Click **Analyze Repo**
4. Receive an AI-generated architectural review and quality report

**Setting up the PR Auto-Reviewer:**
1. Go to your GitHub repository → **Settings → Webhooks → Add webhook**
2. Set Payload URL to `https://your-backend.com/api/webhook/github`
3. Set Content type to `application/json`
4. Set Secret to the value of `GITHUB_WEBHOOK_SECRET` in your `.env`
5. Choose **Pull requests** event
6. Every new PR will now automatically receive an AI review comment

---

## 📡 API Reference

The full interactive API docs are available at `/docs` (Swagger UI) and `/redoc` when the backend is running.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | — | Create a new user account |
| `POST` | `/auth/login` | — | Authenticate and receive JWT token |
| `GET` | `/auth/me` | ✅ JWT | Get current user profile |
| `POST` | `/api/review` | Optional | Submit code for AI review |
| `POST` | `/api/chat-with-code` | — | Chat with AI about code |
| `POST` | `/api/github/review` | — | Analyze a GitHub repository |
| `POST` | `/api/webhook/github` | HMAC | Receive GitHub PR webhook events |
| `GET` | `/api/history` | ✅ JWT | Fetch paginated review history |
| `POST` | `/api/history` | ✅ JWT | Save a review result |
| `DELETE` | `/api/history/{id}` | ✅ JWT | Delete a history entry |
| `GET` | `/health` | — | Health check |

**Example: POST `/api/review`**

```json
// Request body
{
  "code": "def add(a, b):\n    return a - b  # bug: should be +",
  "language": "python"
}

// Response
{
  "issues": ["Line 2: Subtraction used instead of addition — likely a bug."],
  "suggestions": ["Rename the function to reflect its actual operation."],
  "improved_code": "def add(a, b):\n    return a + b",
  "explanation": "The function is named `add` but performs subtraction...",
  "complexity": {
    "time_complexity": "O(1)",
    "space_complexity": "O(1)",
    "has_nested_loops": false,
    "bottlenecks": [],
    "optimization_hint": "No optimization needed for this trivial function."
  }
}
```

---

## ☁️ Deployment

### One-click Render Deploy

This repo includes a `render.yaml` for zero-config deployment on [Render](https://render.com).

1. Fork this repository
2. Create a new account on [Render](https://render.com)
3. Click **New → Blueprint** and connect your fork
4. Add your `GEMINI_API_KEY` (or `OPENAI_API_KEY`) and `JWT_SECRET` in the Render dashboard
5. Deploy — Render will build and host both the backend (Web Service) and frontend (Static Site)

### Manual Deployment

**Backend** (any server with Python 3.11+):
```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend** (any static hosting: Netlify, Vercel, Render Static Site):
```bash
cd frontend
npm run build
# Upload the dist/ directory to your static host
```

---

## 🔮 Future Improvements

- [ ] **Multi-file project review** — Upload a ZIP or link a local directory for whole-project analysis
- [ ] **Team workspaces** — Share review history and collaborate within an organization
- [ ] **IDE plugins** — JetBrains (IntelliJ, PyCharm) plugin alongside the existing VS Code extension
- [ ] **Streaming responses** — Stream LLM tokens to the UI in real-time for faster perceived performance
- [ ] **GitHub App** — Replace webhook with a proper GitHub App for richer PR integration (inline comments, status checks)
- [ ] **Diff-aware review** — Review only changed lines in a PR rather than the entire file
- [ ] **Custom rule sets** — Let teams define project-specific coding standards for the AI to enforce
- [ ] **Export reports** — Download review results as PDF or Markdown
- [ ] **Rate limiting & billing** — Per-user API quotas and Stripe payment integration for a commercial tier
- [ ] **Support for more languages** — Go, Rust, Ruby, Swift, Kotlin

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

```bash
# Fork the repo and create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then commit
git commit -m "feat: describe your change"

# Push and open a Pull Request
git push origin feature/your-feature-name
```

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and open an issue first for major changes.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Krrish Vaghani](https://github.com/krrishvaghani)**

⭐ Star this repo if you found it useful!

</div>
