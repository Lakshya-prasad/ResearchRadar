let currentUser = null;
let currentAvaraSlide = 0;

const avaraSlides = [
    {
        title: 'Developers of the ResearchRadar Protocol',
        desc: 'High-performance AI PDF parsing and paper synthesis engine. Extract structured summaries, core methodology, and jargon definitions in seconds.',
        action: 'Launch Research Engine →',
        section: 'sec-upload'
    },
    {
        title: 'Research Vault & Personal History Engine',
        desc: 'Relational SQLite storage vault preserving all your analyzed paper summaries, startup viability reports, and research search bookmarks.',
        action: 'Open Research Vault →',
        page: 'profile'
    },
    {
        title: 'ArXiv Global Literature Search Feed',
        desc: 'Real-time query parsing over ArXiv REST API endpoints. Instant retrieval of paper titles, authors, abstracts, and direct publication links.',
        action: 'Search Global Papers →',
        section: 'sec-search'
    },
    {
        title: 'Startup Viability & Innovation Scorecard',
        desc: 'Multi-factor innovation evaluator scoring research ideas across Innovation (0-10), Feasibility, Market Potential, and Execution Strategy.',
        action: 'Analyze Startup Idea →',
        section: 'sec-analyzer'
    }
];

function selectAvaraSlide(index) {
    currentAvaraSlide = (index + avaraSlides.length) % avaraSlides.length;
    const slide = avaraSlides[currentAvaraSlide];

    const charIds = ['char-ghost', 'char-frame', 'char-cloud', 'char-circle'];
    charIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', i === currentAvaraSlide);
    });

    const titleEl = document.getElementById('avaraTitle');
    const descEl = document.getElementById('avaraDesc');
    const actionBtn = document.getElementById('avaraActionBtn');
    const indicator = document.getElementById('slideIndicator');

    if (titleEl) titleEl.textContent = slide.title;
    if (descEl) descEl.textContent = slide.desc;
    if (actionBtn) actionBtn.textContent = slide.action;
    if (indicator) indicator.textContent = `${currentAvaraSlide + 1} / ${avaraSlides.length}`;
}

function nextAvaraSlide() {
    selectAvaraSlide(currentAvaraSlide + 1);
}

function prevAvaraSlide() {
    selectAvaraSlide(currentAvaraSlide - 1);
}

function launchAvaraSlide() {
    const slide = avaraSlides[currentAvaraSlide];
    if (slide.page) {
        showPage(slide.page);
        return;
    }
    const el = document.getElementById(slide.section);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function toggleAuth(form) {
    document.getElementById('loginForm').classList.toggle('hidden', form !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', form !== 'register');
}

function updateWelcomeBackBanner() {
    const welcomeTitle = document.getElementById('welcomeBackTitle');
    if (!welcomeTitle) return;

    const hasLoggedOut = localStorage.getItem('hasLoggedOut');
    if (hasLoggedOut === 'true') {
        welcomeTitle.classList.remove('hidden');
    } else {
        welcomeTitle.classList.add('hidden');
    }
}

async function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
        return showToast('Please fill in all fields', 'error');
    }
    if (password.length < 6) {
        return showToast('Password must be at least 6 characters', 'error');
    }

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Account created! Please sign in.', 'success');
            toggleAuth('login');
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (err) {
        showToast('Network error. Is the server running?', 'error');
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        return showToast('Please enter email and password', 'error');
    }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            currentUser = data.user;
            showToast('Welcome to ResearchRadar, ' + currentUser.name + '!', 'success');
            enterApp();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (err) {
        showToast('Network error. Is the server running?', 'error');
    }
}

async function handleLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (err) { }

    currentUser = null;

    localStorage.setItem('hasLoggedOut', 'true');
    updateWelcomeBackBanner();

    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('appLayout').classList.add('hidden');
    showToast('Logged out successfully', 'info');
}

function enterApp() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('appLayout').classList.remove('hidden');
    showPage('dashboard');
}

function showPage(pageName) {
    document.querySelectorAll('.main-content > section').forEach(section => {
        section.classList.add('hidden');
    });

    const target = document.getElementById('page-' + pageName);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-tab').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });

    if (pageName === 'profile') loadProfile();
}

function onFileSelect(event) {
    const file = event.target.files[0];
    const label = document.getElementById('selectedFile') || document.getElementById('selectedFileNav');
    if (label) {
        label.textContent = file ? '📎 ' + file.name : '';
    }
}

async function handleUpload() {
    const fileInput = document.getElementById('pdfInput') || document.getElementById('pdfInputNav');
    const file = fileInput ? fileInput.files[0] : null;

    if (!file) {
        return showToast('Please select a PDF file first', 'error');
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        return showToast('Only PDF files are supported', 'error');
    }

    const btn = document.getElementById('uploadBtn') || document.getElementById('uploadBtnNav');
    if (btn) {
        btn.innerHTML = '<span class="spinner"></span> Analyzing...';
        btn.disabled = true;
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Paper analyzed successfully!', 'success');
            displaySummary(data);
        } else {
            showToast(data.error || 'Upload failed', 'error');
        }
    } catch (err) {
        showToast('Error uploading file. Check connection.', 'error');
    } finally {
        if (btn) {
            btn.innerHTML = 'Analyze Paper';
            btn.disabled = false;
        }
    }
}

function displaySummary(data) {
    const container = document.getElementById('uploadResults');
    if (!container) return;
    container.innerHTML = `
        <div class="summary-section">
            <h3>📝 Paper Summary</h3>
            <p>${data.summary || 'No summary available.'}</p>
        </div>
        <div class="summary-section">
            <h3>🔑 Key Points & Contributions</h3>
            <ul>${(data.key_points || []).map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="summary-section">
            <h3>📚 Important Technical Terms</h3>
            <ul>${(data.terms || []).map(t => `<li><strong>${t.term}:</strong> ${t.definition}</li>`).join('')}</ul>
        </div>
    `;
}

async function handleSearch() {
    const queryEl = document.getElementById('searchQuery') || document.getElementById('searchQueryNav');
    const query = queryEl ? queryEl.value.trim() : '';
    if (!query) {
        return showToast('Please enter a search query', 'error');
    }

    const btn = document.getElementById('searchBtn') || document.getElementById('searchBtnNav');
    if (btn) {
        btn.innerHTML = '<span class="spinner"></span> Searching...';
        btn.disabled = true;
    }

    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (res.ok && data.results) {
            displaySearchResults(data.results);
            if (data.results.length === 0) {
                showToast('No papers found. Try different keywords.', 'info');
            }
        } else {
            showToast(data.error || 'Search failed', 'error');
        }
    } catch (err) {
        showToast('Error searching papers', 'error');
    } finally {
        if (btn) {
            btn.innerHTML = '🔍 Search ArXiv';
            btn.disabled = false;
        }
    }
}

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    if (results.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); padding:20px;">No results found.</p>';
        return;
    }
    container.innerHTML = results.map(paper => `
        <div class="result-card">
            <h3>${paper.title}</h3>
            <p class="authors">${paper.authors}</p>
            <p>${paper.abstract}</p>
            <a href="${paper.link}" target="_blank" rel="noopener">View on ArXiv →</a>
        </div>
    `).join('');
}

async function handleAnalyze() {
    const ideaEl = document.getElementById('ideaInput') || document.getElementById('ideaInputNav');
    const idea = ideaEl ? ideaEl.value.trim() : '';
    if (!idea) {
        return showToast('Please describe your idea', 'error');
    }

    const btn = document.getElementById('analyzeBtn') || document.getElementById('analyzeBtnNav');
    if (btn) {
        btn.innerHTML = '<span class="spinner"></span> Analyzing...';
        btn.disabled = true;
    }

    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idea })
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Analysis complete!', 'success');
            displayAnalysis(data);
        } else {
            showToast(data.error || 'Analysis failed', 'error');
        }
    } catch (err) {
        showToast('Error analyzing idea', 'error');
    } finally {
        if (btn) {
            btn.innerHTML = '💡 Analyze Idea';
            btn.disabled = false;
        }
    }
}

function displayAnalysis(data) {
    const container = document.getElementById('analyzerResults');

    const innovationPct = Math.min(100, Math.max(0, Math.round((data.innovation_score || 0) * 10)));
    const feasibilityPct = Math.min(100, Math.max(0, Math.round((data.feasibility_score || 0) * 10)));
    const marketPct = Math.min(100, Math.max(0, Math.round((data.market_score || 0) * 10)));
    const overallPct = Math.min(100, Math.max(0, Math.round((data.overall_score || 0) * 10)));

    container.innerHTML = `
        <div class="score-grid">
            <div class="score-card primary">
                <div class="score-value">${overallPct}%</div>
                <div class="score-label">Overall Viability</div>
                <div style="font-size:0.75rem; opacity:0.85;">(${data.overall_score}/10)</div>
            </div>
            <div class="score-card matcha">
                <div class="score-value">${innovationPct}%</div>
                <div class="score-label">Innovation Index</div>
                <div style="font-size:0.75rem; opacity:0.85;">(${data.innovation_score}/10)</div>
            </div>
            <div class="score-card beige-dark">
                <div class="score-value">${feasibilityPct}%</div>
                <div class="score-label">Technical Feasibility</div>
                <div style="font-size:0.75rem; opacity:0.85;">(${data.feasibility_score}/10)</div>
            </div>
            <div class="score-card soft-red">
                <div class="score-value">${marketPct}%</div>
                <div class="score-label">Market Opportunity</div>
                <div style="font-size:0.75rem; opacity:0.85;">(${data.market_score}/10)</div>
            </div>
        </div>

        <div class="percentage-metrics-container">
            <h3 style="margin-bottom:16px; font-size:1.05rem; color:var(--matcha-dark);">📈 Viability Percentage Breakdown</h3>

            <div class="percentage-item">
                <div class="percentage-header">
                    <span>🚀 Overall Viability Rating</span>
                    <span class="percentage-val">${overallPct}%</span>
                </div>
                <div class="percentage-bar-track">
                    <div class="percentage-bar-fill matcha" style="width: ${overallPct}%;"></div>
                </div>
            </div>

            <div class="percentage-item">
                <div class="percentage-header">
                    <span>💡 Innovation Index</span>
                    <span class="percentage-val">${innovationPct}%</span>
                </div>
                <div class="percentage-bar-track">
                    <div class="percentage-bar-fill sky" style="width: ${innovationPct}%;"></div>
                </div>
            </div>

            <div class="percentage-item">
                <div class="percentage-header">
                    <span>⚙️ Technical Feasibility</span>
                    <span class="percentage-val">${feasibilityPct}%</span>
                </div>
                <div class="percentage-bar-track">
                    <div class="percentage-bar-fill amber" style="width: ${feasibilityPct}%;"></div>
                </div>
            </div>

            <div class="percentage-item">
                <div class="percentage-header">
                    <span>📊 Market Potential & Scalability</span>
                    <span class="percentage-val">${marketPct}%</span>
                </div>
                <div class="percentage-bar-track">
                    <div class="percentage-bar-fill soft-red" style="width: ${marketPct}%;"></div>
                </div>
            </div>
        </div>

        <div class="summary-section">
            <h3>📊 Feasibility Assessment</h3>
            <p>${data.feasibility || 'Feasibility analysis complete.'}</p>
        </div>
        <div class="summary-section">
            <h3>🌍 Market Potential</h3>
            <p>${data.market_potential || 'Market analysis complete.'}</p>
        </div>
        <div class="summary-section">
            <h3>💡 Strategic Suggestions</h3>
            <ul>${(data.suggestions || []).map(s => `<li>${s}</li>`).join('')}</ul>
        </div>
    `;
}

async function loadProfile() {
    if (currentUser) {
        const initials = currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase();
        document.getElementById('profileInfo').innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">${initials}</div>
                <div class="profile-info">
                    <h2>${currentUser.name}</h2>
                    <p>${currentUser.email}</p>
                    <p>Member since ${currentUser.joined || 'recently'}</p>
                </div>
            </div>
        `;
    }

    try {
        const res = await fetch('/api/papers');
        if (!res.ok) return;
        const data = await res.json();

        const container = document.getElementById('profilePapers');
        if (!data.papers || data.papers.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);">No papers uploaded yet.</p>';
            return;
        }

        container.innerHTML = data.papers.map(paper => {
            const keyPointsHtml = (paper.key_points && paper.key_points.length > 0)
                ? `<div class="summary-section mt-12">
                     <h3>🔑 Key Points & Contributions</h3>
                     <ul>${paper.key_points.map(p => `<li>${p}</li>`).join('')}</ul>
                   </div>`
                : '';

            const termsHtml = (paper.terms && paper.terms.length > 0)
                ? `<div class="summary-section mt-12">
                     <h3>📚 Important Technical Terms</h3>
                     <ul>${paper.terms.map(t => `<li><strong>${t.term}:</strong> ${t.definition}</li>`).join('')}</ul>
                   </div>`
                : '';

            return `
                <div class="result-card" style="margin-bottom: 24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <h3 style="margin:0;">📄 ${paper.filename}</h3>
                        <span class="badge-tag badge-matcha">Uploaded: ${paper.uploaded_at || 'Recently'}</span>
                    </div>
                    <div class="summary-section mt-12">
                        <h3>📝 Paper Summary</h3>
                        <p>${paper.summary || 'No summary available'}</p>
                    </div>
                    ${keyPointsHtml}
                    ${termsHtml}
                </div>
            `;
        }).join('');
    } catch (err) {
    }
}

async function checkAuth() {
    updateWelcomeBackBanner();
    try {
        const res = await fetch('/api/me');
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            enterApp();
        }
    } catch (err) {
    }
}

checkAuth();

window.addEventListener('scroll', function() {
    const dbBg = document.querySelector('.database-bg-layer');
    if (dbBg) {
        const rect = dbBg.getBoundingClientRect();
        const speed = (rect.top - window.innerHeight) * 0.12;
        dbBg.style.transform = `translateY(${speed}px)`;
    }

    const bulbBg = document.querySelector('.bulb-bg-layer');
    if (bulbBg) {
        const rect = bulbBg.getBoundingClientRect();
        const speed = (rect.top - window.innerHeight) * 0.12;
        bulbBg.style.transform = `translateY(${speed}px)`;
    }
});
