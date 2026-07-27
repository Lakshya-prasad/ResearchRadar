# 📡 ResearchRadar — Full DevOps & GitOps Pipeline

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Helm](https://img.shields.io/badge/Helm-0F1689?style=for-the-badge&logo=helm&logoColor=white)
![ArgoCD](https://img.shields.io/badge/ArgoCD-EF7B4D?style=for-the-badge&logo=argo&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)

A production-grade, Cloud-Native **DevOps & GitOps Infrastructure** hosting **ResearchRadar** — an AI-powered research paper synthesis and literature discovery application.

Developed by **Lakshya Prasad** (Computer Science & Engineering).

---

## 🏗️ DevOps & GitOps Architecture

```
                      +-------------------------------------------------+
                      |                GitHub Repository                |
                      |    (Lakshya-prasad/ResearchRadar - main)        |
                      +-----------------------+-------------------------+
                                              |
                          1. git push to main |
                                              v
                      +-------------------------------------------------+
                      |                 GitHub Actions                  |
                      |           (.github/workflows/ci.yml)            |
                      +-----------------------+-------------------------+
                                              |
     +----------------------------------------+----------------------------------------+
     |                                        |                                        |
     v                                        v                                        v
 [ Stage 1: Test ]              [ Stage 2: Build & Push ]               [ Stage 3: GitOps Update ]
- Python dependencies          - Build Docker Image                    - Update Helm image tag
- flake8 linting               - Push to AWS ECR / Registry              in values.yaml
- pytest unit tests                                                    - Commit & push back to GitHub
                                                                                       |
                                                                                       v
                                                                       +---------------+---------------+
                                                                       |        ArgoCD Engine          |
                                                                       |   (Running in Minikube / K8s) |
                                                                       +---------------+---------------+
                                                                                       |
                                                                        4. Auto-syncs cluster state
                                                                                       |
                                                                                       v
                                                                       +---------------+---------------+
                                                                       |       Kubernetes Cluster      |
                                                                       |   (Pods / Helm Deployment)    |
                                                                       +---------------+---------------+
```

---

## 🌟 Key DevOps & Cloud Native Features

### 🐳 Containerization & Optimization
* **Multi-Stage Dockerfile**: Lightweight `python:3.11-slim` base image.
* **Security & Non-Root Execution**: Runs under a dedicated, unprivileged `appuser`.
* **Health Checks**: Automated HTTP container healthchecks.

### ☸️ Kubernetes Orchestration
* **High Availability**: Multi-replica pod deployment with rolling updates.
* **Self-Healing Probes**: Configured Liveness & Readiness probes for zero-downtime health monitoring.
* **Horizontal Pod Autoscaling (HPA)**: Dynamic scaling (2 to 5 pods) based on CPU utilization metrics.
* **Resource Limits & Requests**: Memory and CPU allocations to protect cluster capacity.

### ☸️ Helm 3 Package Management
* Modular chart template structure (`k8s/helm/researchradar`).
* Environment-based configuration separation (`values.yaml` for production vs `values-local.yaml` for local Minikube).

### 🔄 ArgoCD Continuous Delivery (GitOps)
* Declarative GitOps Application manifest (`argocd-app.yaml`).
* Automated sync, self-healing, and drift detection directly from GitHub repository changes.

### ⚡ Automated PowerShell Pipeline Script (`devops-setup.ps1`)
* **Self-Healing PATH Resolution**: Auto-detects and injects Docker, Minikube, `kubectl`, and `helm` paths dynamically.
* **End-to-End Automation**: Builds container image, spins up Minikube, loads images, installs Helm chart, deploys ArgoCD, and retrieves admin credentials automatically.

---

## 📁 Project Structure

```
ResearchRadar/
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI/CD pipeline
├── k8s/
│   ├── helm/
│   │   └── researchradar/          # Helm 3 Chart templates & values
│   └── manifests/                  # Kubernetes & ArgoCD Application manifests
├── devops-setup.ps1                # Automated full DevOps pipeline script
├── Dockerfile                      # Production container spec
├── app.py                          # Flask backend API
├── requirements.txt                # Python dependencies
├── static/
│   ├── index.html                  # Single-page application frontend
│   ├── css/style.css               # Application stylesheet
│   └── js/app.js                   # Client-side JavaScript
└── tests/
    └── test_app.py                 # PyTest unit testing suite
```

---

## 🚀 Quick Start (Automated One-Click Setup)

### Prerequisites
* Windows 10/11 with **PowerShell** (Run as Administrator)
* **Docker Desktop** installed and running

### 1. Run the Full DevOps Pipeline Script

```powershell
cd C:\Users\ACER\ResearchRadar
.\devops-setup.ps1
```

This single command will:
1. Verify & auto-configure PATH for Docker, Minikube, `kubectl`, and Helm.
2. Build the Docker image `researchradar:latest`.
3. Start a local Minikube Kubernetes cluster.
4. Load the image into Minikube and deploy via Helm.
5. Deploy ArgoCD into the `argocd` namespace and display the initial admin password.

---

## 🌐 Accessing Deployed Services

Once the script completes, open new terminal windows for port forwarding:

### 1. ResearchRadar Application
```powershell
kubectl port-forward svc/researchradar-svc 5000:80
```
👉 Open in browser: **[http://localhost:5000](http://localhost:5000)**

### 2. ArgoCD Dashboard
```powershell
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
👉 Open in browser: **[https://localhost:8080](https://localhost:8080)**  
* **Username:** `admin`  
* **Password:** *(Retrieved automatically by `devops-setup.ps1`)*

---

## 🛠️ Management & Monitoring Commands

```powershell
kubectl get pods                     # Check application pod status
kubectl get pods -n argocd           # Check ArgoCD pod status
kubectl logs -f deploy/researchradar # Stream application logs
kubectl get hpa                     # View Horizontal Pod Autoscaler status
minikube dashboard                   # Launch Kubernetes Web Dashboard
minikube stop                        # Stop local Kubernetes cluster
```

---

## 📄 License

Developed by **Lakshya Prasad** for academic & DevOps project demonstrations.
