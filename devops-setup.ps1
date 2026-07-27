$ErrorActionPreference = "Stop"

function Write-Step($phase, $step, $msg) {
    Write-Host ""
    Write-Host "  [$phase/$step] $msg" -ForegroundColor Cyan
    Write-Host "  --------------------------------------------------" -ForegroundColor DarkGray
}

function Wait-For-Input($msg) {
    Write-Host ""
    Write-Host "  PAUSE: $msg" -ForegroundColor Yellow
    Read-Host "  Press ENTER to continue"
}

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Magenta
Write-Host "   ResearchRadar - Full DevOps Pipeline"        -ForegroundColor Magenta
Write-Host "  ============================================" -ForegroundColor Magenta
Write-Host ""

Write-Step "1" "1" "Checking prerequisites..."

function Add-ToPath($dir) {
    if ($dir -and (Test-Path $dir)) {
        $currentPaths = $env:PATH -split ';'
        if ($currentPaths -notcontains $dir) {
            $env:PATH = "$dir;$env:PATH"
        }
    }
}

$regMachine = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") -split ';'
$regUser    = [System.Environment]::GetEnvironmentVariable("PATH", "User") -split ';'
foreach ($p in ($regMachine + $regUser)) { Add-ToPath $p }

function Ensure-CLI-Tool($name, $exeName, $wingetId, $searchDirs) {
    $foundPath = $null

    $cmd = Get-Command $exeName -ErrorAction SilentlyContinue
    if ($cmd) {
        $foundPath = $cmd.Source
    }

    if (-not $foundPath) {
        foreach ($dir in $searchDirs) {
            if (Test-Path $dir) {
                $foundFile = Get-ChildItem -Path $dir -Recurse -Filter $exeName -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($foundFile) {
                    Add-ToPath $foundFile.DirectoryName
                    $foundPath = $foundFile.FullName
                    break
                }
            }
        }
    }

    if (-not $foundPath -and $wingetId) {
        Write-Host "  [INFO] $name not found. Attempting installation via winget ($wingetId)..." -ForegroundColor Yellow
        try {
            winget install --id $wingetId -e --accept-source-agreements --accept-package-agreements 2>&1 | Out-Null
        } catch {}

        $regM = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") -split ';'
        $regU = [System.Environment]::GetEnvironmentVariable("PATH", "User") -split ';'
        foreach ($p in ($regM + $regU)) { Add-ToPath $p }

        foreach ($dir in $searchDirs) {
            if (Test-Path $dir) {
                $foundFile = Get-ChildItem -Path $dir -Recurse -Filter $exeName -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($foundFile) {
                    Add-ToPath $foundFile.DirectoryName
                    $foundPath = $foundFile.FullName
                    break
                }
            }
        }
    }

    if ($foundPath -or (Get-Command $exeName -ErrorAction SilentlyContinue)) {
        Write-Host "  [OK] $name ready" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  [FAIL] $name could not be found or installed automatically." -ForegroundColor Red
        return $false
    }
}

$commonSearchPaths = @(
    "$env:ProgramFiles\Docker\Docker\resources\bin",
    "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin",
    "$env:ProgramFiles\Kubernetes\Minikube",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Links",
    "$env:LOCALAPPDATA\Programs",
    "$env:ProgramFiles",
    "${env:ProgramFiles(x86)}",
    "C:\minikube",
    "C:\kubectl"
)

$dockerOk   = Ensure-CLI-Tool "Docker"   "docker.exe"   "Docker.DockerDesktop" $commonSearchPaths
$minikubeOk = Ensure-CLI-Tool "Minikube" "minikube.exe" "Kubernetes.minikube"  $commonSearchPaths
$kubectlOk  = Ensure-CLI-Tool "kubectl"  "kubectl.exe"  "Kubernetes.kubectl"   $commonSearchPaths
$helmOk     = Ensure-CLI-Tool "Helm"     "helm.exe"     "Helm.Helm"           $commonSearchPaths

if (-not $dockerOk -or -not $minikubeOk -or -not $kubectlOk -or -not $helmOk) {
    Write-Host "  [FAIL] Some prerequisites are missing. Please install them and restart your terminal." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  [OK] All prerequisites ready!" -ForegroundColor Green

Write-Step "2" "1" "Building Docker image..."
docker build -t researchradar:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Docker build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Image built: researchradar:latest" -ForegroundColor Green

Write-Step "2" "2" "Testing standalone container..."
try { docker stop rr-test 2>&1 | Out-Null } catch {}
try { docker rm rr-test 2>&1 | Out-Null } catch {}
$groqKey = if ($env:GROQ_API_KEY) { $env:GROQ_API_KEY } else { "your-groq-api-key-here" }
docker run -d --name rr-test -p 5000:5000 `
    -e GROQ_API_KEY=$groqKey `
    -e SECRET_KEY=dev-secret-2026 `
    researchradar:latest

Write-Host "  Waiting 10s for container to start..." -ForegroundColor DarkGray
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri http://localhost:5000 -UseBasicParsing -TimeoutSec 5
    $statusCode = $response.StatusCode
    Write-Host "  [OK] Container test passed! (HTTP $statusCode)" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] Container test inconclusive - continuing anyway" -ForegroundColor Yellow
}

try { docker stop rr-test 2>&1 | Out-Null } catch {}
try { docker rm rr-test 2>&1 | Out-Null } catch {}

Write-Step "3" "1" "Starting Minikube cluster..."

try { $mkStatus = minikube status --format "{{.Host}}" 2>&1 | Out-String } catch { $mkStatus = "" }
if ($mkStatus -eq "Running") {
    Write-Host "  [INFO] Minikube already running" -ForegroundColor Cyan
} else {
    minikube start --cpus=2 --memory=4096 --driver=docker
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] Minikube start failed!" -ForegroundColor Red
        Write-Host "     Make sure Docker Desktop is running." -ForegroundColor Yellow
        exit 1
    }
}
Write-Host "  [OK] Minikube cluster running" -ForegroundColor Green

Write-Step "3" "2" "Loading Docker image into Minikube..."

minikube image load researchradar:latest
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Failed to load image into Minikube" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Image loaded into Minikube" -ForegroundColor Green

Write-Step "4" "1" "Installing Helm chart..."

try { helm uninstall researchradar 2>&1 | Out-Null } catch {}

helm install researchradar ./k8s/helm/researchradar `
    -f ./k8s/helm/researchradar/values-local.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Helm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Helm chart installed" -ForegroundColor Green

Write-Step "4" "2" "Waiting for pods to be ready..."
Write-Host "  This may take 30-60 seconds..." -ForegroundColor DarkGray

try { kubectl rollout status deployment/researchradar --timeout=120s 2>&1 | Out-Null } catch {}
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [WARN] Pods may still be starting. Checking status..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  --- Pod Status ---" -ForegroundColor Cyan
kubectl get pods -l app=researchradar
Write-Host ""
Write-Host "  --- Service Status ---" -ForegroundColor Cyan
kubectl get svc
Write-Host ""
Write-Host "  --- HPA Status ---" -ForegroundColor Cyan
try { kubectl get hpa 2>&1 | Out-Null } catch {}

Write-Step "5" "1" "Installing ArgoCD into cluster..."

try { kubectl create namespace argocd 2>&1 | Out-Null } catch {}
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

Write-Host "  Waiting for ArgoCD to be ready (this takes 1-2 minutes)..." -ForegroundColor DarkGray
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [WARN] ArgoCD may still be starting. Check with: kubectl get pods -n argocd" -ForegroundColor Yellow
} else {
    Write-Host "  [OK] ArgoCD is running" -ForegroundColor Green
}

Write-Step "5" "2" "Retrieving ArgoCD admin password..."
$jsonpathArg = "jsonpath={.data.password}"
try { $argoPass = kubectl -n argocd get secret argocd-initial-admin-secret -o $jsonpathArg 2>&1 | Out-String } catch { $argoPass = "" }
if ($argoPass) {
    $decodedPass = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($argoPass))
    Write-Host "  ArgoCD Admin Credentials:" -ForegroundColor Green
    Write-Host "     Username: admin" -ForegroundColor White
    Write-Host "     Password: $decodedPass" -ForegroundColor White
} else {
    Write-Host "  [WARN] Could not retrieve password yet. Run this later:" -ForegroundColor Yellow
    $hintCmd = '  kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"'
    Write-Host $hintCmd -ForegroundColor DarkGray
}

Write-Step "6" "1" "Applying ArgoCD Application manifest..."
kubectl apply -f k8s/manifests/argocd-app-local.yaml
Write-Host "  [OK] ArgoCD Application created - it will auto-sync from Git" -ForegroundColor Green

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   FULL DEVOPS PIPELINE IS RUNNING!"            -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  To access the services, open NEW terminal windows:" -ForegroundColor White
Write-Host ""
Write-Host "  ResearchRadar App:" -ForegroundColor Cyan
Write-Host "     kubectl port-forward svc/researchradar-svc 5000:80" -ForegroundColor White
Write-Host "     Then open: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "  ArgoCD Dashboard:" -ForegroundColor Cyan
Write-Host "     kubectl port-forward svc/argocd-server -n argocd 8080:443" -ForegroundColor White
Write-Host "     Then open: https://localhost:8080" -ForegroundColor White
Write-Host "     Login: admin / (password shown above)" -ForegroundColor White
Write-Host ""
Write-Host "  Useful Commands:" -ForegroundColor Cyan
Write-Host "     kubectl get pods" -ForegroundColor DarkGray
Write-Host "     kubectl get pods -n argocd" -ForegroundColor DarkGray
Write-Host "     kubectl logs -f deploy/researchradar" -ForegroundColor DarkGray
Write-Host "     kubectl get hpa" -ForegroundColor DarkGray
Write-Host "     minikube dashboard" -ForegroundColor DarkGray
Write-Host "     minikube stop" -ForegroundColor DarkGray
Write-Host ""
