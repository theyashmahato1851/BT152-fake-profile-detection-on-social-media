/**
 * CYBER-RADAR Vanilla JavaScript Frontend Controller
 * Communicates with FastAPI backend for real-time AI inference.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const scanForm = document.getElementById('scan-form');
  const urlInput = document.getElementById('url-input');
  const scanBtn = document.getElementById('scan-btn');
  const btnSpinner = document.getElementById('btn-spinner');
  const detectedIcon = document.getElementById('detected-icon');
  const presetsContainer = document.getElementById('presets-container');
  const resultsSection = document.getElementById('results-section');

  // Result Elements
  const resIcon = document.getElementById('res-icon');
  const resHandle = document.getElementById('res-handle');
  const resPlatform = document.getElementById('res-platform');
  const resQuickStats = document.getElementById('res-quick-stats');
  const gaugeCircle = document.getElementById('gauge-circle');
  const gaugeScore = document.getElementById('gauge-score');
  const riskBadge = document.getElementById('risk-badge');
  const diagnosticsList = document.getElementById('diagnostics-list');
  const advisoryBox = document.getElementById('advisory-box');

  // Drawer Elements
  const drawerBtn = document.getElementById('drawer-btn');
  const drawerContent = document.getElementById('drawer-content');
  const drawerArrow = document.getElementById('drawer-arrow');
  const btnRecalculate = document.getElementById('btn-recalculate');

  // Global state
  let currentFeatures = {};
  let currentPlatform = 'ALL';
  const CIRCLE_CIRCUMFERENCE = 502.65; // 2 * pi * 80

  // --------------------------------------------------------------------------
  // 1. Initialize Presets & Metrics
  // --------------------------------------------------------------------------
  async function loadInitialData() {
    try {
      // Load presets
      const res = await fetch('/api/presets');
      const data = await res.json();
      renderPresets(data.presets || []);

      // Load metrics
      const mRes = await fetch('/api/metrics');
      const mData = await mRes.json();
      renderMetrics(mData);
    } catch (err) {
      console.warn('API fetch warning:', err);
    }
  }

  function getPlatformEmoji(platform) {
    const p = (platform || '').toLowerCase();
    if (p.includes('instagram')) return '📸';
    if (p.includes('facebook')) return '📘';
    return '𝕏';
  }

  function renderPresets(presets) {
    presetsContainer.innerHTML = '';
    const filtered = currentPlatform === 'ALL' 
      ? presets 
      : presets.filter(p => p.platform.toLowerCase().includes(currentPlatform.toLowerCase()));

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'preset-card';
      const icon = getPlatformEmoji(p.platform);
      const badgeCls = p.is_bot ? 'badge-bot' : 'badge-real';

      card.innerHTML = `
        <div class="preset-left">
          <span class="preset-icon">${icon}</span>
          <div>
            <div class="preset-name">${p.name}</div>
            <div class="preset-platform">${p.platform} · ${p.handle}</div>
          </div>
        </div>
        <span class="preset-badge ${badgeCls}">${p.type}</span>
      `;

      card.addEventListener('click', () => {
        urlInput.value = p.url;
        updateDetectedIcon(p.url);
        executeScan(p.url);
      });

      presetsContainer.appendChild(card);
    });
  }

  function renderMetrics(data) {
    if (!data || !data.metrics) return;
    const m = data.metrics;
    if (m.accuracy) document.getElementById('metric-acc').textContent = `${(m.accuracy * 100).toFixed(2)}%`;
    if (m.precision) document.getElementById('metric-prec').textContent = `${(m.precision * 100).toFixed(2)}%`;
    if (m.recall) document.getElementById('metric-rec').textContent = `${(m.recall * 100).toFixed(2)}%`;
    if (m.f1_score) document.getElementById('metric-f1').textContent = `${(m.f1_score * 100).toFixed(2)}%`;
    if (m.roc_auc) document.getElementById('metric-auc').textContent = m.roc_auc.toFixed(4);
  }

  // --------------------------------------------------------------------------
  // 2. URL Input Real-Time Platform Detection
  // --------------------------------------------------------------------------
  function updateDetectedIcon(val) {
    const v = val.toLowerCase();
    if (v.includes('instagram.com') || v.includes('instagr.am')) {
      detectedIcon.textContent = '📸';
    } else if (v.includes('facebook.com') || v.includes('fb.com')) {
      detectedIcon.textContent = '📘';
    } else if (v.includes('x.com') || v.includes('twitter.com')) {
      detectedIcon.textContent = '𝕏';
    } else {
      detectedIcon.textContent = '🔍';
    }
  }

  urlInput.addEventListener('input', (e) => {
    updateDetectedIcon(e.target.value);
  });

  // Platform Filter Chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');
      currentPlatform = chip.dataset.platform;
      loadInitialData();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Scan Execution & Result Animation
  // --------------------------------------------------------------------------
  scanForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = urlInput.value.trim();
    if (val) executeScan(val);
  });

  async function executeScan(url, customFeatures = null) {
    setLoading(true);
    try {
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, custom_features: customFeatures })
      });

      if (!resp.ok) throw new Error('Scan failed');
      const data = await resp.json();
      displayResults(data);
    } catch (err) {
      alert('Error scanning profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    if (isLoading) {
      btnSpinner.style.display = 'inline-block';
      scanBtn.style.opacity = '0.8';
      scanBtn.disabled = true;
    } else {
      btnSpinner.style.display = 'none';
      scanBtn.style.opacity = '1';
      scanBtn.disabled = false;
    }
  }

  function displayResults(data) {
    resultsSection.style.display = 'block';

    const t = data.target;
    const a = data.assessment;
    const f = data.features;
    currentFeatures = { ...f };

    // Target summary
    resIcon.textContent = getPlatformEmoji(t.platform);
    resHandle.textContent = t.handle;
    resPlatform.textContent = `Platform: ${t.platform}`;
    resQuickStats.innerHTML = `
      <span>Followers: <b>${f.followers ? f.followers.toLocaleString() : 0}</b></span>
      <span>Following: <b>${f.following ? f.following.toLocaleString() : 0}</b></span>
      <span>Posts: <b>${f.posts || 0}</b></span>
    `;

    // Radial Speedometer Animation
    const prob = a.fake_probability;
    const offset = CIRCLE_CIRCUMFERENCE - (prob * CIRCLE_CIRCUMFERENCE);
    gaugeCircle.style.strokeDashoffset = offset;
    gaugeCircle.style.stroke = a.tier_color;

    // Number count-up
    animateNumber(0, prob * 100, 1000, (current) => {
      gaugeScore.textContent = `${current.toFixed(1)}%`;
      gaugeScore.style.color = a.tier_color;
    });

    // Risk Badge
    riskBadge.textContent = `${a.tier_icon} ${a.tier_label}`;
    riskBadge.style.color = a.tier_color;
    riskBadge.style.background = `${a.tier_color}1a`;
    riskBadge.style.border = `1px solid ${a.tier_color}60`;

    // Diagnostics Checklist
    diagnosticsList.innerHTML = '';
    data.diagnostics.forEach(diag => {
      const row = document.createElement('div');
      row.className = 'diag-row';
      const isPass = diag.status === 'PASS';
      row.innerHTML = `
        <div class="diag-left">
          <span class="diag-name">${diag.name} (${diag.value})</span>
          <span class="diag-detail">${diag.detail}</span>
        </div>
        <span class="diag-status ${isPass ? 'status-pass' : 'status-fail'}">
          ${isPass ? '✓ Normal' : '⚠ Anomaly'}
        </span>
      `;
      diagnosticsList.appendChild(row);
    });

    // Advisory Guidance Banner
    if (prob >= 0.50) {
      advisoryBox.className = 'advisory-box advisory-danger';
      advisoryBox.innerHTML = `
        <b>⚠️ Security Advisory for ${t.handle}:</b> This profile exhibits behavioral patterns characteristic of automated Sybil bot networks or impersonators.
        Do not engage in financial transactions, click external bio links, or share sensitive information.
      `;
    } else {
      advisoryBox.className = 'advisory-box advisory-safe';
      advisoryBox.innerHTML = `
        <b>✅ Verification Confirmation for ${t.handle}:</b> Account signals are consistent with authentic human social interaction.
        Social engagement is considered low risk according to the trained multi-platform model.
      `;
    }

    // Populate Inspector Drawer
    document.getElementById('param-followers').value = f.followers || 0;
    document.getElementById('param-following').value = f.following || 0;
    document.getElementById('param-posts').value = f.posts || 0;
    document.getElementById('param-bio').value = f.bio_length || 0;
    document.getElementById('param-pic').checked = Boolean(f.has_profile_pic);
    document.getElementById('param-verified').checked = Boolean(f.verified);
    document.getElementById('param-suspicious').checked = Boolean(f.suspicious_links_in_bio);

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function animateNumber(start, end, duration, callback) {
    const startTime = performance.now();
    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
      const value = start + (end - start) * easeProgress;
      callback(value);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // --------------------------------------------------------------------------
  // 4. Drawer Toggle & Recalculate
  // --------------------------------------------------------------------------
  drawerBtn.addEventListener('click', () => {
    const isVisible = drawerContent.style.display === 'block';
    drawerContent.style.display = isVisible ? 'none' : 'block';
    drawerArrow.textContent = isVisible ? '▼' : '▲';
  });

  btnRecalculate.addEventListener('click', () => {
    currentFeatures.followers = parseInt(document.getElementById('param-followers').value, 10) || 0;
    currentFeatures.following = parseInt(document.getElementById('param-following').value, 10) || 0;
    currentFeatures.posts = parseInt(document.getElementById('param-posts').value, 10) || 0;
    currentFeatures.bio_length = parseInt(document.getElementById('param-bio').value, 10) || 0;
    currentFeatures.has_profile_pic = document.getElementById('param-pic').checked ? 1 : 0;
    currentFeatures.verified = document.getElementById('param-verified').checked ? 1 : 0;
    currentFeatures.suspicious_links_in_bio = document.getElementById('param-suspicious').checked ? 1 : 0;

    executeScan(urlInput.value.trim(), currentFeatures);
  });

  // Run on start
  loadInitialData();
});
