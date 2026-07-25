# 📡 ResearchRadar — AI Research Paper Assistant

A full-stack web application that helps students and researchers **understand research papers**, **discover literature**, and **evaluate startup ideas** — all powered by AI.

Built as a college project by **Lakshya Prasad** (Computer Science & Engineering).

---

## ✨ Features

### 🔬 PDF Paper Summarizer
Upload any research paper PDF and get an AI-generated structured analysis:
- **Paper Summary** — Clear 2–3 paragraph overview
- **Key Points & Contributions** — 5–7 core findings
- **Technical Terms** — Important jargon with plain-English definitions

### 🔍 ArXiv Literature Search
Search the global ArXiv database in real-time:
- Query by keywords or research domain
- View paper titles, authors, and truncated abstracts
- Direct links to full papers on ArXiv

### 💡 Startup Idea Analyzer
Evaluate any research-based idea or startup concept with a multi-dimensional AI scorecard:
- **Innovation Index** (0–10)
- **Technical Feasibility** (0–10)
- **Market Potential** (0–10)
- **Overall Viability** (0–10)
- Actionable strategic suggestions

### 👤 User Profile & Research Vault
- Secure account registration & login
- Persistent history of all analyzed papers with full summaries
- Personal research vault stored in SQLite

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, Flask |
| **Frontend** | HTML, CSS (vanilla), JavaScript |
| **Database** | SQLite |
| **AI/LLM** | OpenAI-compatible API (GPT-4o-mini, Groq, etc.) |
| **PDF Parsing** | PyPDF2 |
| **Paper Search** | ArXiv REST API (Atom XML) |
| **Auth** | Flask sessions + Werkzeug password hashing |

---

## 📁 Project Structure

```
ResearchRadar/
├── app.py                  # Flask server — all API routes & AI logic
├── database.db             # SQLite database (auto-created)
├── requirements.txt        # Python dependencies
├── .env                    # API keys & config (not committed)
├── .env.example            # Template for environment variables
├── templates/
│   └── index.html          # Single-page frontend (SPA)
├── static/
│   ├── css/
│   │   └── style.css       # Full stylesheet (warm light theme)
│   ├── js/
│   │   └── app.js          # Frontend logic, API calls, UI rendering
│   └── images/
│       └── login_bg.jpg    # Login page background image
└── uploads/                # Uploaded PDF files (per-user)
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.8+**
- An **OpenAI-compatible API key** (OpenAI, Groq, Together AI, etc.)

### 1. Clone the repository

```bash
git clone https://github.com/Lakshya-prasad/ResearchRadar.git
cd ResearchRadar
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy the example file and fill in your API key:

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
SECRET_KEY=change-this-to-a-random-string
```

> **Using Groq (free tier)?** Set `OPENAI_BASE_URL=https://api.groq.com/openai/v1` and `OPENAI_MODEL=llama-3.3-70b-versatile`

### 4. Run the server

```bash
python app.py
```

Open **http://localhost:5000** in your browser.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serve the SPA frontend |
| `POST` | `/api/register` | Create a new user account |
| `POST` | `/api/login` | Authenticate and start session |
| `POST` | `/api/logout` | Clear user session |
| `GET` | `/api/me` | Get current logged-in user info |
| `POST` | `/api/upload` | Upload PDF and get AI summary |
| `GET` | `/api/search?q=...` | Search ArXiv for papers |
| `POST` | `/api/analyze` | Analyze a startup/research idea |
| `GET` | `/api/papers` | Get user's uploaded paper history |

---

## 🎨 Design

- **Theme:** Warm light mode — Beige, Matcha Green, Soft Red palette
- **Typography:** Inter + Poppins (Google Fonts)
- **Layout:** Single-page app with top navbar navigation
- **Hero Section:** Interactive animated character showcase with 4 SVG characters
- **Section Backgrounds:** Parallax SVG graphics with scroll-based animation
- **Login Page:** Split layout with background image, glassmorphism form

---

## 📝 How It Works

1. **Register/Login** → Creates a session-based account stored in SQLite
2. **Upload a PDF** → PyPDF2 extracts text → sent to LLM API → structured JSON response rendered in the UI
3. **Search Papers** → Query hits ArXiv REST API → Atom XML parsed → results displayed as cards
4. **Analyze Idea** → Description sent to LLM API → multi-factor scoring returned as JSON → visualized with progress bars and score cards
5. **Profile** → Fetches all previously analyzed papers from the database with full summaries

---

## 📄 License

This project was built for academic purposes as a college project.

---

> **ResearchRadar** — *Understand Research. Build Innovation.*
