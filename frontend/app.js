/**
 * ProfileTrust — Frontend Logic & Interactive Radar Scanner
 * ========================================================
 * Implements:
 * 1. Live paste detection & dynamic platform badge update
 * 2. Animated scanning radar with multi-step progress indicators
 * 3. Smooth circular gauge meter count-up animation
 * 4. Plain-English factor cards for users of all age groups
 * 5. Dark / Light mode toggle with persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const scanForm = document.getElementById('scanForm');
  const urlInput = document.getElementById('urlInput');
  const clearBtn = document.getElementById('clearBtn');
  const scanBtn = document.getElementById('scanBtn');
  const inputPlatformIcon = document.getElementById('inputPlatformIcon');

  // Scanning State Elements
  const scanningState = document.getElementById('scanningState');
  const scanStepTitle = document.getElementById('scanStepTitle');
  const scanStepDetail = document.getElementById('scanStepDetail');
  const scanProgressBar = document.getElementById('scanProgressBar');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const step4 = document.getElementById('step4');

  // Result Elements
  const resultCard = document.getElementById('resultCard');
  const profileAvatar = document.getElementById('profileAvatar');
  const verifiedBadge = document.getElementById('verifiedBadge');
  const profileName = document.getElementById('profileName');
  const profileHandle = document.getElementById('profileHandle');
  const platformName = document.getElementById('platformName');
  const platformIconImg = document.getElementById('platformIconImg');
  const profileBio = document.getElementById('profileBio');
  const statFollowers = document.getElementById('statFollowers');
  const statFollowing = document.getElementById('statFollowing');
  const statPosts = document.getElementById('statPosts');

  // Gauge & Verdict
  const gaugeProgressCircle = document.getElementById('gaugeProgressCircle');
  const meterScore = document.getElementById('meterScore');
  const verdictPill = document.getElementById('verdictPill');
  const verdictDot = document.getElementById('verdictDot');
  const verdictLabel = document.getElementById('verdictLabel');
  const verdictTitle = document.getElementById('verdictTitle');
  const verdictDesc = document.getElementById('verdictDesc');
  const factorsList = document.getElementById('factorsList');

  // Technical Telemetry Toggle
  const toggleTechnicalBtn = document.getElementById('toggleTechnicalBtn');
  const technicalContent = document.getElementById('technicalContent');
  const techToggleIcon = document.getElementById('techToggleIcon');
  const featuresTableBody = document.getElementById('featuresTableBody');

  // Preset Buttons
  const presetBtns = document.querySelectorAll('.preset-btn');

  // Gauge Circle Circumference: 2 * PI * r = 2 * 3.14159 * 50 = 314.159
  const GAUGE_CIRCUMFERENCE = 314.159;

  // -------------------------------------------------------------------------
  // 1. Theme Management (Dark / Light)
  // -------------------------------------------------------------------------
  function applyTheme(isDark) {
    if (isDark) {
      document.documentElement.classList.add('dark');
      themeIcon.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      themeIcon.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    }
  }

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(!isDark);
  });

  // -------------------------------------------------------------------------
  // 2. Dynamic Platform Icon Detection on Typing/Pasting
  // -------------------------------------------------------------------------
  function updateInputPlatformBadge(text) {
    const val = text.trim().toLowerCase();
    if (!val) {
      inputPlatformIcon.innerHTML = '🌐';
      clearBtn.classList.add('hidden');
      return;
    }

    clearBtn.classList.remove('hidden');

    if (val.includes('instagram.com') || val.includes('instagr.am')) {
      inputPlatformIcon.innerHTML = '<img src="/static/assets/instagram.png" alt="Instagram" class="w-4 h-4 object-contain">';
    } else if (val.includes('facebook.com') || val.includes('fb.com')) {
      inputPlatformIcon.innerHTML = '<img src="/static/assets/facebook.png" alt="Facebook" class="w-4 h-4 object-contain">';
    } else if (val.includes('x.com') || val.includes('twitter.com') || val.startsWith('@')) {
      inputPlatformIcon.innerHTML = '<img src="/static/assets/x.svg" alt="X" class="w-3.5 h-3.5 object-contain">';
    } else {
      inputPlatformIcon.innerHTML = '🔍';
    }
  }

  urlInput.addEventListener('input', (e) => {
    updateInputPlatformBadge(e.target.value);
  });

  urlInput.addEventListener('paste', () => {
    setTimeout(() => updateInputPlatformBadge(urlInput.value), 50);
  });

  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    updateInputPlatformBadge('');
    urlInput.focus();
  });

  // -------------------------------------------------------------------------
  // 3. Multi-Step Scanning Radar Animation
  // -------------------------------------------------------------------------
  function setScanStep(stepNum, title, detail, progressPercent) {
    scanStepTitle.textContent = title;
    scanStepDetail.textContent = detail;
    scanProgressBar.style.width = `${progressPercent}%`;

    const steps = [step1, step2, step3, step4];
    steps.forEach((s, idx) => {
      if (idx + 1 < stepNum) {
        s.className = 'flex items-center gap-1.5 text-emerald-500 font-semibold';
        s.children[0].textContent = '✓';
      } else if (idx + 1 === stepNum) {
        s.className = 'flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold animate-pulse';
        s.children[0].textContent = '▶';
      } else {
        s.className = 'flex items-center gap-1.5 text-gray-400 font-medium';
        s.children[0].textContent = '○';
      }
    });
  }

  // -------------------------------------------------------------------------
  // 4. Smooth Gauge Count-Up Animation
  // -------------------------------------------------------------------------
  function animateGauge(targetScore, color) {
    gaugeProgressCircle.style.stroke = color;
    const targetOffset = GAUGE_CIRCUMFERENCE - (targetScore / 100) * GAUGE_CIRCUMFERENCE;
    gaugeProgressCircle.style.strokeDashoffset = targetOffset;

    let current = 0;
    const duration = 900;
    const startTime = performance.now();

    function updateScore(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      current = Math.round(ease * targetScore);
      meterScore.textContent = `${current}%`;

      if (progress < 1) {
        requestAnimationFrame(updateScore);
      } else {
        meterScore.textContent = `${targetScore}%`;
      }
    }
    requestAnimationFrame(updateScore);
  }

  // -------------------------------------------------------------------------
  // 5. Render Scan Results to UI
  // -------------------------------------------------------------------------
  function renderResults(data) {
    const target = data.target;
    const trust = data.trust;
    const factors = data.factors;
    const tech = data.technical_details;

    // Profile Card
    profileName.textContent = target.name || target.handle;
    profileHandle.textContent = target.handle;
    profileBio.textContent = target.bio ? `"${target.bio}"` : 'No bio description provided.';
    
    // Avatar
    profileAvatar.src = target.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${target.handle}`;
    profileAvatar.onerror = () => {
      profileAvatar.src = `https://api.dicebear.com/7.x/initials/svg?seed=${target.handle}`;
    };

    // Platform Badge & Avatar Ring Color
    platformName.textContent = target.platform;
    if (target.platform === 'Instagram') {
      platformIconImg.src = '/static/assets/instagram.png';
    } else if (target.platform === 'Facebook') {
      platformIconImg.src = '/static/assets/facebook.png';
    } else {
      platformIconImg.src = '/static/assets/x.svg';
    }

    // Avatar ring color based on status
    profileAvatar.style.borderColor = trust.color;

    // Verified badge
    if (target.verified) {
      verifiedBadge.classList.remove('hidden');
    } else {
      verifiedBadge.classList.add('hidden');
    }

    // Numbers
    statFollowers.textContent = target.followers_formatted;
    statFollowing.textContent = target.following_formatted;
    statPosts.textContent = target.posts_formatted;

    // Verdict Badge
    verdictLabel.textContent = trust.status_label;
    verdictTitle.textContent = trust.verdict_title;
    verdictDesc.textContent = trust.verdict_desc;
    verdictDot.style.backgroundColor = trust.color;

    if (trust.status === 'authentic') {
      verdictPill.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    } else if (trust.status === 'suspicious') {
      verdictPill.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    } else {
      verdictPill.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
    }

    // Animate Circular Gauge
    animateGauge(trust.score, trust.color);

    // Render Factors
    factorsList.innerHTML = '';
    factors.forEach(f => {
      const card = document.createElement('div');
      
      let badgeHtml = '';
      let borderClass = '';
      if (f.status === 'good') {
        borderClass = 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20';
        badgeHtml = '<span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">✓ Healthy</span>';
      } else if (f.status === 'warning') {
        borderClass = 'border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20';
        badgeHtml = '<span class="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full">! Caution</span>';
      } else {
        borderClass = 'border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20';
        badgeHtml = '<span class="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2.5 py-0.5 rounded-full">✕ Risk Alert</span>';
      }

      card.className = `p-4 rounded-xl border ${borderClass} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition`;
      card.innerHTML = `
        <div class="flex items-start gap-3.5">
          <div class="text-2xl mt-0.5 sm:mt-0">${f.icon}</div>
          <div>
            <div class="flex items-center gap-2">
              <h5 class="text-sm font-bold text-gray-900 dark:text-white">${f.title}</h5>
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">— ${f.summary}</span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">${f.detail}</p>
          </div>
        </div>
        <div class="shrink-0 self-end sm:self-center">
          ${badgeHtml}
        </div>
      `;
      factorsList.appendChild(card);
    });

    // Technical Features Table
    if (tech && tech.features) {
      featuresTableBody.innerHTML = '';
      const featEntries = Object.entries(tech.features);
      featEntries.forEach(([k, v]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="p-2 font-medium">${k}</td>
          <td class="p-2 font-bold text-emerald-600 dark:text-emerald-400">${v}</td>
          <td class="p-2 text-gray-500 dark:text-gray-400">Model Input Factor</td>
        `;
        featuresTableBody.appendChild(row);
      });
    }
  }

  // -------------------------------------------------------------------------
  // 6. Execute Scan Pipeline
  // -------------------------------------------------------------------------
  async function runScan(targetUrl) {
    if (!targetUrl || !targetUrl.trim()) return;

    urlInput.value = targetUrl;
    updateInputPlatformBadge(targetUrl);

    // Show Scanning State
    resultCard.classList.add('hidden');
    scanningState.classList.remove('hidden');
    scanBtn.disabled = true;
    scanBtn.classList.add('opacity-75');

    // Smooth Step Progression
    setScanStep(1, 'Connecting to Network...', 'Looking up public profile metadata and server response...', 25);
    await new Promise(r => setTimeout(r, 280));

    setScanStep(2, 'Extracting Profile Bio & Stats...', 'Reading followers, following ratio, and public post count...', 55);
    await new Promise(r => setTimeout(r, 320));

    setScanStep(3, 'Running AI Machine Learning Model...', 'Evaluating 21 behavioral features with Random Forest Ensemble (400 trees)...', 85);

    try {
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned ${resp.status}`);
      }

      const data = await resp.json();

      setScanStep(4, 'Compiling Trust Report...', 'Finalizing verdict and plain-English factors...', 100);
      await new Promise(r => setTimeout(r, 250));

      // Hide scanning, show results
      scanningState.classList.add('hidden');
      resultCard.classList.remove('hidden');
      renderResults(data);

      // Smooth scroll to result
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      console.error('Scan error:', err);
      scanningState.classList.add('hidden');
      resultCard.classList.remove('hidden');
      alert('Could not complete scan. Please check the URL or try one of the quick presets.');
    } finally {
      scanBtn.disabled = false;
      scanBtn.classList.remove('opacity-75');
    }
  }

  // -------------------------------------------------------------------------
  // 7. Event Listeners (Form & Presets)
  // -------------------------------------------------------------------------
  scanForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runScan(urlInput.value);
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      runScan(url);
    });
  });

  // Toggle Technical Drawer
  toggleTechnicalBtn.addEventListener('click', () => {
    const isHidden = technicalContent.classList.contains('hidden');
    if (isHidden) {
      technicalContent.classList.remove('hidden');
      techToggleIcon.textContent = '▲';
    } else {
      technicalContent.classList.add('hidden');
      techToggleIcon.textContent = '▼';
    }
  });

  // Run initial scan on load for instant live demonstration
  runScan('https://instagram.com/cristiano');
});
