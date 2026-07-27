# ResearchRadar — Technology Stack

## 1. Overview

ResearchRadar is an AI-powered web application that helps researchers understand papers, discover literature, and evaluate startup ideas. It uses a monolithic Flask architecture with a DevOps pipeline targeting AWS EKS via ArgoCD.

## 2. Frontend

- **Rendering:** Server-side (Flask templates + Jinja2)
- **Language:** HTML, JavaScript (vanilla)
- **Styling:** Vanilla CSS
- **Typography:** Inter, Poppins (Google Fonts)
- **Architecture:** Single-Page Application (SPA) rendered from `templates/index.html`

## 3. Backend

- **Framework:** Flask (Python)
- **Language:** Python 3.11+
- **API Type:** REST API
- **WSGI Server:** Gunicorn (production)
- **Authentication:** Flask sessions + Werkzeug password hashing (bcrypt)
- **File Upload:** Flask `request.files`

## 4. Artificial Intelligence

- **LLM Provider:** Groq API
- **Default Model:** Llama 3.3 70B Versatile
- **AI Tasks:** Paper summarization, key point extraction, technical term definitions, startup idea evaluation

## 5. Database

- **Primary Database:** SQLite (file-based, auto-created)
- **Tables:** `users`, `papers`

## 6. Research Paper Sources

- **ArXiv REST API** — Real-time paper search via Atom XML feed

## 7. PDF Processing

- **Library:** PyPDF2 — text extraction from uploaded PDFs

## 8. DevOps & Infrastructure

| Component | Technology |
|-----------|-----------|
| **Containerization** | Docker |
| **Container Registry** | Amazon ECR |
| **Container Orchestration** | Amazon EKS (Kubernetes) |
| **CI/CD Pipeline** | GitHub Actions |
| **GitOps / Continuous Deployment** | ArgoCD |
| **Package Manager** | Helm Charts |
| **Ingress Controller** | Nginx Ingress |
| **Autoscaling** | Kubernetes HPA (CPU-based) |
| **Version Control** | Git & GitHub |

## 9. DevOps Pipeline Flow

```
Developer pushes to main
        ↓
GitHub Actions: Lint → Test → Build Docker Image
        ↓
Push to Amazon ECR (SHA-tagged)
        ↓
Update Helm values.yaml with new image tag (committed to Git)
        ↓
ArgoCD detects Git change → syncs to EKS cluster
        ↓
Kubernetes rolls out new Deployment (2-5 replicas via HPA)
```

## 10. Security

- Password hashing (Werkzeug/bcrypt)
- Flask session-based authentication
- Non-root Docker container
- Kubernetes Secrets for API keys
- Input validation on all API endpoints

## 11. Project Structure

```
ResearchRadar/
├── app.py                          # Flask server — all API routes & AI logic
├── database.db                     # SQLite database (auto-created)
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Production container image
├── .dockerignore                   # Docker build exclusions
├── .env.example                    # Environment variable template
├── .github/workflows/ci.yml       # GitHub Actions CI/CD pipeline
├── k8s/
│   ├── manifests/                  # Raw Kubernetes manifests
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   ├── secret.yaml
│   │   └── argocd-app.yaml
│   └── helm/researchradar/        # Helm chart
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── _helpers.tpl
│           ├── deployment.yaml
│           ├── service.yaml
│           ├── ingress.yaml
│           ├── secret.yaml
│           └── hpa.yaml
├── templates/
│   └── index.html                  # Single-page frontend (SPA)
├── static/
│   ├── css/style.css
│   ├── js/app.js
│   └── images/
└── uploads/                        # Uploaded PDF files (per-user)
```

## 12. Future Improvements

- PostgreSQL migration for multi-instance deployments
- Redis session store for horizontal scaling
- Prometheus + Grafana monitoring
- Sealed Secrets or AWS Secrets Manager
- Unit and integration test suite
- Multi-language support
- Mobile application
