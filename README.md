# 📡 ResearchRadar — Research Paper Assistant

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
| **AI/LLM** | OpenAI-compatible API (Groq, LLaMA-3.3-70B) |
| **PDF Parsing** | PyPDF2 |
| **Paper Search** | ArXiv REST API (Atom XML) |
| **Auth** | Flask sessions + Werkzeug password hashing |
| **DevOps & Cloud** | Docker, Kubernetes (Minikube), Helm 3, ArgoCD, GitHub Actions |

---

## 📁 Project Structure

```
ResearchRadar/
├── app.py                  # Flask server — all API routes & AI logic
├── database.db             # SQLite database (auto-created)
├── requirements.txt        # Python dependencies
├── devops-setup.ps1        # Automated full DevOps pipeline script
├── docker-run.bat          # Standalone Docker execution script
├── Dockerfile              # Production container spec
├── static/
│   ├── index.html          # Single-page frontend (SPA)
│   ├── css/
│   │   └── style.css       # Full stylesheet (warm light theme)
│   ├── js/
│   │   └── app.js          # Frontend logic, API calls, UI rendering
│   └── images/             # Background SVG assets
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI/CD pipeline
├── k8s/
│   ├── helm/               # Helm 3 deployment charts
│   └── manifests/          # Kubernetes & ArgoCD App manifests
└── uploads/                # Uploaded PDF files (per-user)
```

---

## 🚀 How to Run (Multiple Deployment Methods)

ResearchRadar supports 4 flexible execution methods depending on your environment:

### Method 1: Local Python Server (Direct Run)

```bash
# 1. Clone the repository
git clone https://github.com/Lakshya-prasad/ResearchRadar.git
cd ResearchRadar

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env
# Edit .env and set your GROQ_API_KEY

# 4. Start Flask server
python app.py
```
👉 Open **http://localhost:5000** in your browser.

---

### Method 2: Standalone Docker Container

```powershell
# Build image
docker build -t researchradar:latest .

# Run container with API key
docker run -d --name researchradar -p 5000:5000 -e GROQ_API_KEY=your-api-key researchradar:latest
```
*Or use the interactive batch helper on Windows:*
```cmd
.\docker-run.bat your-groq-api-key
```
👉 Open **http://localhost:5000** in your browser.

---

### Method 3: Automated Full DevOps Pipeline (Minikube + Helm + ArgoCD)

Runs the complete Cloud-Native DevOps pipeline locally via PowerShell:

```powershell
# Run Administrator PowerShell
cd C:\Users\ACER\ResearchRadar
.\devops-setup.ps1
```

This automated script will:
1. Auto-detect & inject Docker, Minikube, `kubectl`, and `helm` paths.
2. Build the Docker container image.
3. Launch a Minikube Kubernetes cluster.
4. Deploy the Helm release chart (`k8s/helm/researchradar`).
5. Install ArgoCD in the `argocd` namespace and print credentials.

**Access Services:**
* **App (Port-Forward):** `kubectl port-forward svc/researchradar-svc 5000:80` -> **http://localhost:5000**
* **ArgoCD Dashboard:** `kubectl port-forward svc/argocd-server -n argocd 8080:443` -> **https://localhost:8080**

---

### Method 4: Automated GitHub Actions CI/CD & GitOps Pipeline

Pushing changes to the `main` branch automatically triggers the GitHub Actions CI/CD pipeline (`.github/workflows/ci.yml`):

1. **Stage 1 (Lint & Test):** Code linting via `flake8` and unit tests via `pytest`.
2. **Stage 2 (Build & Push):** Containerizes app and pushes to Amazon ECR / Registry.
3. **Stage 3 (GitOps Update):** Updates Helm `values.yaml` with the new image tag and commits back to GitHub.
4. **ArgoCD Sync:** ArgoCD auto-detects the commit on GitHub and performs a zero-downtime rolling update on the Kubernetes cluster.

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
