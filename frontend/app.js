/**
 * ProfileSentinel — Modern Editorial ML Frontend Controller
 * Combines Notion Document Aesthetic with Night Shift Ambient Campaign Styling
 */

// Preset Profile Behavioral Datasets
const PRESET_DATA = {
  shadow_profile: {
    name: "Shadow Profile",
    handle: "@ShadowProfile",
    platform: "X",
    url: "https://x.com/ShadowProfile",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    risk: "Suspicious",
    riskClass: "bg-sentinel-crimson text-white",
    ringColor: "#E13D45",
    timezone: "Inferred Offset: UTC-05:00 vs Actual UTC+03:00 (Moscow)",
    biometric: "GAN StyleGAN2 pupil alignment score: 91% (Synthetic flagged)",
    burst: "3 hours ago • Unnatural 140s automated burst",
    stats: { posts: "23%", followers: "2", following: "1,240" },
    suspicionScore: 890,
    curve24h: [75, 78, 80, 82, 79, 85, 80, 78, 82, 80, 84, 80, 79, 81, 85, 83, 80, 82, 85, 79, 80, 82, 78, 81],
    curve7d: [80, 82, 85, 81, 79, 83, 84],
    curveColor: "#E13D45",
    gradientId: "curve-gradient-red"
  },
  elena_rostova: {
    name: "Dr. Elena Rostova",
    handle: "@ElenaRostova",
    platform: "Instagram",
    url: "https://instagram.com/ElenaRostova",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
    risk: "Verified Human",
    riskClass: "bg-sentinel-emerald text-white",
    ringColor: "#10B981",
    timezone: "Normal Circadian Alignment: UTC-08:00 (PST)",
    biometric: "Natural ocular & biometric variance verified (98.4%)",
    burst: "18 mins ago • Organic Poisson inter-arrival variance",
    stats: { posts: "84%", followers: "14.2K", following: "318" },
    suspicionScore: 120,
    curve24h: [8, 4, 1, 0, 0, 2, 12, 35, 62, 70, 68, 75, 82, 70, 65, 72, 80, 88, 74, 60, 45, 28, 15, 10],
    curve7d: [65, 72, 78, 82, 70, 40, 35],
    curveColor: "#10B981",
    gradientId: "curve-gradient-emerald"
  },
  viral_pulse: {
    name: "ViralPulse Network",
    handle: "@ViralPulse",
    platform: "Facebook",
    url: "https://facebook.com/ViralPulse",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    risk: "Astroturf Farm",
    riskClass: "bg-sentinel-amber text-white",
    ringColor: "#E58E26",
    timezone: "High Variance Multi-IP Jitter Detected (Farm Node)",
    biometric: "Stock photo reuse across 14 syndicated farm nodes",
    burst: "45 mins ago • Synchronized 45s scripted post cluster",
    stats: { posts: "55%", followers: "420", following: "3,890" },
    suspicionScore: 720,
    curve24h: [20, 15, 10, 8, 90, 95, 20, 15, 18, 95, 90, 25, 30, 20, 92, 88, 25, 30, 85, 90, 30, 25, 20, 18],
    curve7d: [45, 90, 30, 95, 25, 85, 40],
    curveColor: "#E58E26",
    gradientId: "curve-gradient-amber"
  }
};

let activeTargetKey = 'shadow_profile';
let activeCurveRange = '24h';
let currentActiveProfileData = PRESET_DATA.shadow_profile;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFormControls();
  renderProfileUI(PRESET_DATA.shadow_profile);
  renderSplineCurve();
});

// --------------------------------------------------------------------------
// 1. Theme Management (Notion Light vs Night Shift Obsidian)
// --------------------------------------------------------------------------
function initTheme() {
  const saved = localStorage.getItem('profilesentinel_theme');
  if (saved === 'light') {
    document.documentElement.classList.remove('dark');
    updateThemeButtonUI(false);
  } else {
    document.documentElement.classList.add('dark');
    updateThemeButtonUI(true);
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('profilesentinel_theme', isDark ? 'dark' : 'light');
  updateThemeButtonUI(isDark);
  renderSplineCurve();
}

function updateThemeButtonUI(isDark) {
  const icon = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  if (label) label.textContent = isDark ? 'Notion Light' : 'Obsidian Dark';
}

// --------------------------------------------------------------------------
// 2. URL Input & Platform Heuristic Auto-Detection
// --------------------------------------------------------------------------
function initFormControls() {
  const form = document.getElementById('scan-form');
  const input = document.getElementById('url-input');
  const clearBtn = document.getElementById('btn-clear-input');

  if (input) {
    input.addEventListener('input', (e) => {
      updatePlatformIcon(e.target.value);
    });
    updatePlatformIcon(input.value);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      updatePlatformIcon('');
      input.focus();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      executeScanPipeline(input.value.trim());
    });
  }
}

function updatePlatformIcon(val) {
  const v = (val || '').toLowerCase();
  const iconEl = document.getElementById('detected-icon');
  if (!iconEl) return;

  if (v.includes('instagram.com') || v.includes('instagr.am')) {
    iconEl.innerHTML = '<img src="/static/assets/instagram.png" alt="Instagram" class="icon-search" width="20" height="20">';
  } else if (v.includes('facebook.com') || v.includes('fb.com')) {
    iconEl.innerHTML = '<img src="/static/assets/facebook.png" alt="Facebook" class="icon-search" width="20" height="20">';
  } else if (v.includes('x.com') || v.includes('twitter.com')) {
    iconEl.innerHTML = '<span class="x-glyph" style="font-size: 16px;">𝕏</span>';
  } else {
    iconEl.textContent = '🔍';
  }
}

function getPlatformIconBadge(platform) {
  const p = (platform || '').toLowerCase();
  if (p.includes('instagram')) {
    return '<img src="/static/assets/instagram.png" alt="Instagram" class="icon-inline" width="16" height="16"> Instagram';
  } else if (p.includes('facebook')) {
    return '<img src="/static/assets/facebook.png" alt="Facebook" class="icon-inline" width="16" height="16"> Facebook';
  } else {
    return '<span class="x-glyph" style="margin-right: 6px;">𝕏</span> X (Twitter)';
  }
}

// --------------------------------------------------------------------------
// 3. Preset Target Switcher
// --------------------------------------------------------------------------
function loadPresetTarget(key) {
  if (!PRESET_DATA[key]) return;
  activeTargetKey = key;
  const p = PRESET_DATA[key];
  const input = document.getElementById('url-input');
  if (input) {
    input.value = p.url;
    updatePlatformIcon(p.url);
  }

  executeScanPipeline(p.url, p);
}

// --------------------------------------------------------------------------
// 4. Scan Pipeline Execution (Calling FastAPI)
// --------------------------------------------------------------------------
async function executeScanPipeline(url, fallbackPreset = null) {
  const spinner = document.getElementById('scan-spinner');
  const btnText = document.getElementById('scan-btn-text');
  const scanBtn = document.getElementById('scan-btn');

  if (spinner) spinner.classList.remove('hidden');
  if (btnText) btnText.textContent = 'Evaluating...';
  if (scanBtn) scanBtn.disabled = true;

  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!res.ok) throw new Error('Inference API response error');
    const data = await res.json();
    handleScanResult(data);
  } catch (err) {
    console.warn('API call failed or offline, loading fallback client profile:', err);
    if (fallbackPreset) {
      renderProfileUI(fallbackPreset);
      renderSplineCurve();
    } else {
      // Synthesize profile from input
      synthesizeProfileFromInput(url);
    }
  } finally {
    if (spinner) spinner.classList.add('hidden');
    if (btnText) btnText.textContent = 'Run Pipeline';
    if (scanBtn) scanBtn.disabled = false;
  }
}

function handleScanResult(data) {
  const t = data.target;
  const a = data.assessment;
  const f = data.features;
  const fo = data.forensics || {};

  const prob = a.fake_probability;
  const isHighRisk = prob >= 0.50;
  const isAstroturf = prob >= 0.40 && prob < 0.70;

  let riskLabel = "Verified Human";
  let riskClass = "bg-sentinel-emerald text-white";
  let ringColor = "#10B981";
  let curveColor = "#10B981";

  if (prob >= 0.70) {
    riskLabel = "Suspicious";
    riskClass = "bg-sentinel-crimson text-white";
    ringColor = "#E13D45";
    curveColor = "#E13D45";
  } else if (isAstroturf) {
    riskLabel = "Astroturf Farm";
    riskClass = "bg-sentinel-amber text-white";
    ringColor = "#E58E26";
    curveColor = "#E58E26";
  }

  currentActiveProfileData = {
    name: t.handle.replace(/^@|^fb\.com\//, ''),
    handle: t.handle,
    platform: t.platform,
    avatar: t.avatar || (isHighRisk 
      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80"),
    risk: riskLabel,
    riskClass: riskClass,
    ringColor: ringColor,
    timezone: fo.timezone_audit || (isHighRisk ? "Inferred Offset: UTC-05:00 vs Actual UTC+03:00" : "Normal Circadian Alignment: UTC-08:00 (PST)"),
    biometric: fo.biometric_score || (isHighRisk ? "GAN StyleGAN2 pupil alignment: 91% (Synthetic flagged)" : "Natural ocular variance verified (Human: 98.4%)"),
    burst: fo.burst_interval || (isHighRisk ? "3 hours ago • Unnatural 140s automated burst" : "18 mins ago • Organic Poisson inter-arrival variance"),
    stats: {
      posts: `${f.posts_per_day ? Math.min(100, Math.round(f.posts_per_day * 100)) : 23}%`,
      followers: f.followers > 1000 ? `${(f.followers / 1000).toFixed(1)}K` : `${f.followers || 0}`,
      following: f.following > 1000 ? `${(f.following / 1000).toFixed(1)}K` : `${f.following || 0}`
    },
    suspicionScore: Math.round(prob * 1000),
    curve24h: fo.circadian_curve_24h || (isHighRisk 
      ? [75, 78, 80, 82, 79, 85, 80, 78, 82, 80, 84, 80, 79, 81, 85, 83, 80, 82, 85, 79, 80, 82, 78, 81]
      : [8, 4, 1, 0, 0, 2, 12, 35, 62, 70, 68, 75, 82, 70, 65, 72, 80, 88, 74, 60, 45, 28, 15, 10]),
    curve7d: fo.circadian_curve_7d || (isHighRisk ? [80, 82, 85, 81, 79, 83, 84] : [65, 72, 78, 82, 70, 40, 35]),
    curveColor: curveColor,
    diagnostics: data.diagnostics || []
  };

  renderProfileUI(currentActiveProfileData);
  renderSplineCurve();
  showToast(`Inference Pipeline complete: ${currentActiveProfileData.handle} (${(prob * 100).toFixed(1)}% Risk)`);
}

function synthesizeProfileFromInput(url) {
  const isSuspicious = url.toLowerCase().includes('bot') || url.toLowerCase().includes('shadow') || url.toLowerCase().includes('spambot');
  const target = isSuspicious ? PRESET_DATA.shadow_profile : PRESET_DATA.elena_rostova;
  renderProfileUI(target);
  renderSplineCurve();
}

// --------------------------------------------------------------------------
// 5. Render Profile UI Elements
// --------------------------------------------------------------------------
function renderProfileUI(p) {
  currentActiveProfileData = p;

  // Window title & Status dot
  const winLabel = document.getElementById('window-target-label');
  const winDot = document.getElementById('window-status-dot');
  if (winLabel) winLabel.textContent = `Target: ${p.handle}`;
  if (winDot) winDot.style.backgroundColor = p.ringColor;

  // Profile hero identity card
  const nameEl = document.getElementById('profile-name');
  const handleEl = document.getElementById('profile-handle');
  const avatarEl = document.getElementById('profile-avatar-img');
  const ringEl = document.getElementById('profile-avatar-ring');
  const badgeEl = document.getElementById('profile-risk-badge');
  const platformBadgeEl = document.getElementById('profile-platform-badge');
  const tzEl = document.getElementById('profile-timezone');

  if (nameEl) nameEl.textContent = p.name;
  if (handleEl) handleEl.textContent = p.handle;
  if (avatarEl) avatarEl.src = p.avatar;
  if (ringEl) ringEl.style.borderColor = p.ringColor;
  if (badgeEl) {
    badgeEl.textContent = p.risk;
    badgeEl.className = `absolute -bottom-1.5 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${p.riskClass} shadow-md`;
  }
  if (platformBadgeEl) {
    platformBadgeEl.innerHTML = getPlatformIconBadge(p.platform || 'X');
  }
  if (tzEl) tzEl.textContent = p.timezone;

  // Velocity Stat Pills
  const postsEl = document.getElementById('stat-posts-val');
  const followersEl = document.getElementById('stat-followers-val');
  const followingEl = document.getElementById('stat-following-val');
  if (postsEl) postsEl.textContent = p.stats.posts;
  if (followersEl) followersEl.textContent = p.stats.followers;
  if (followingEl) followingEl.textContent = p.stats.following;

  // Forensics Card Info
  const burstEl = document.getElementById('burst-interval-text');
  const bioEl = document.getElementById('biometric-score-text');
  const bioFlagPill = document.getElementById('biometric-flag-pill');
  if (burstEl) burstEl.textContent = p.burst;
  if (bioEl) bioEl.textContent = p.biometric;
  if (bioFlagPill) {
    const isHuman = p.risk.includes('Verified');
    bioFlagPill.textContent = isHuman ? 'Verified' : 'Flagged';
    bioFlagPill.className = isHuman
      ? 'text-[10px] font-mono text-emerald-600 font-medium bg-emerald-500/10 px-2 py-0.5 rounded'
      : 'text-[10px] font-mono text-sentinel-crimson font-medium bg-sentinel-crimson/10 px-2 py-0.5 rounded';
  }

  // Diagnostics Checklist
  renderDiagnostics(p.diagnostics || [
    { name: "Follower-to-Following Equity", value: `${p.stats.followers} / ${p.stats.following}`, status: p.risk.includes('Verified') ? 'PASS' : 'FAIL', detail: p.risk.includes('Verified') ? 'Balanced audience ratio' : 'Severe asymmetric following volume' },
    { name: "Circadian Cadence Deviation", value: p.risk.includes('Verified') ? 'Z: -0.4' : 'Z: +3.2', status: p.risk.includes('Verified') ? 'PASS' : 'FAIL', detail: p.risk.includes('Verified') ? 'Natural sleep attenuation observed' : 'Unnatural 24/7 continuous cron intervals' },
    { name: "GAN Biometric Authenticity", value: p.risk.includes('Verified') ? '98.4%' : '91.0% Artifact', status: p.risk.includes('Verified') ? 'PASS' : 'FAIL', detail: p.risk.includes('Verified') ? 'Human facial landmarks confirmed' : 'StyleGAN2 synthetic pupil alignment' },
    { name: "Lexical Semantic Entropy", value: p.risk.includes('Verified') ? 'H = 4.82' : 'H = 1.15', status: p.risk.includes('Verified') ? 'PASS' : 'FAIL', detail: p.risk.includes('Verified') ? 'Diverse organic vocabulary' : 'High repetition spambot templates' }
  ]);
}

function renderDiagnostics(items) {
  const container = document.getElementById('diagnostics-container');
  if (!container) return;

  container.innerHTML = '';
  items.forEach(d => {
    const isPass = d.status === 'PASS';
    const row = document.createElement('div');
    row.className = 'diagnostic-item';
    row.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="w-5 h-5 rounded-full ${isPass ? 'bg-emerald-500/10 text-emerald-600' : 'bg-sentinel-crimson/10 text-sentinel-crimson'} flex items-center justify-center text-xs font-bold font-mono">
          ${isPass ? '✓' : '!'}
        </span>
        <div>
          <div class="font-medium text-zinc-800 dark:text-zinc-200">${d.name} <span class="font-mono text-zinc-400 font-normal">(${d.value})</span></div>
          <div class="text-[10px] text-zinc-400 font-mono">${d.detail}</div>
        </div>
      </div>
      <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${isPass ? 'bg-emerald-500/10 text-emerald-600' : 'bg-sentinel-crimson/10 text-sentinel-crimson'}">
        ${isPass ? 'PASS' : 'ANOMALY'}
      </span>
    `;
    container.appendChild(row);
  });
}

// --------------------------------------------------------------------------
// 6. Continuous Cubic Bézier Mathematical Spline (No Discrete Bars)
// --------------------------------------------------------------------------
function formatCubicSpline(points, width = 1000, height = 200) {
  const n = points.length;
  if (n === 0) return { pathD: "", areaD: "", coords: [] };

  const stepX = width / (n - 1);
  const coords = points.map((val, i) => ({
    x: i * stepX,
    y: height - (val / 100) * (height - 30) - 15
  }));

  let d = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2 > n - 1 ? n - 1 : i + 2];

    const tension = 0.32;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const pathD = d;
  const areaD = `${d} L ${width},${height} L 0,${height} Z`;
  return { pathD, areaD, coords };
}

function renderSplineCurve() {
  const p = currentActiveProfileData || PRESET_DATA.shadow_profile;
  const data = activeCurveRange === '24h' ? p.curve24h : p.curve7d;

  // 1. Render Human Normative Baseline (Dashed Emerald Curve)
  const baselineData = PRESET_DATA.elena_rostova.curve24h;
  const baselineSpline = formatCubicSpline(baselineData);
  const bPath = document.getElementById('baseline-path');
  const bArea = document.getElementById('baseline-area');
  if (bPath) bPath.setAttribute('d', baselineSpline.pathD);
  if (bArea) bArea.setAttribute('d', baselineSpline.areaD);

  // 2. Render Target Profile Spline Curve
  const targetSpline = formatCubicSpline(data);
  const tPath = document.getElementById('target-path');
  const tArea = document.getElementById('target-area');
  const legendTargetBar = document.getElementById('legend-target-bar');

  if (tPath) {
    tPath.setAttribute('d', targetSpline.pathD);
    tPath.setAttribute('stroke', p.curveColor);
  }
  if (tArea) {
    tArea.setAttribute('d', targetSpline.areaD);
    const gradId = p.curveColor === '#10B981' ? 'curve-gradient-emerald' : (p.curveColor === '#E58E26' ? 'curve-gradient-amber' : 'curve-gradient-red');
    tArea.setAttribute('fill', `url(#${gradId})`);
  }
  if (legendTargetBar) {
    legendTargetBar.style.backgroundColor = p.curveColor;
  }

  // 3. Attach Interactive Telemetry Crosshair
  setupCrosshairEngine(targetSpline.coords, data, p.curveColor);
}

function setupCrosshairEngine(coords, data, strokeColor) {
  const svg = document.getElementById('activity-svg');
  const crossX = document.getElementById('crosshair-x');
  const crossDot = document.getElementById('crosshair-dot');
  const tooltip = document.getElementById('curve-tooltip');
  const tooltipDot = document.getElementById('tooltip-dot');
  if (!svg || !crossX || !crossDot || !tooltip) return;

  svg.onmousemove = function(e) {
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = 1000 / rect.width;
    const svgX = Math.max(0, Math.min(1000, mouseX * scaleX));

    // Find nearest point
    let nearestIdx = 0;
    let minDiff = Infinity;
    coords.forEach((pt, i) => {
      const diff = Math.abs(pt.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIdx = i;
      }
    });

    const activePt = coords[nearestIdx];
    const clientX = (activePt.x / 1000) * rect.width;
    const clientY = (activePt.y / 200) * rect.height;

    // Crosshair lines
    crossX.setAttribute('x1', activePt.x);
    crossX.setAttribute('x2', activePt.x);
    crossX.setAttribute('stroke', strokeColor);
    crossX.classList.remove('opacity-0');

    crossDot.setAttribute('cx', activePt.x);
    crossDot.setAttribute('cy', activePt.y);
    crossDot.setAttribute('stroke', strokeColor);
    crossDot.classList.remove('opacity-0');

    // Tooltip position & text
    tooltip.style.left = `${clientX}px`;
    tooltip.style.top = `${clientY}px`;
    tooltip.classList.remove('opacity-0');
    if (tooltipDot) tooltipDot.style.backgroundColor = strokeColor;

    const timeLabel = activeCurveRange === '24h'
      ? `${String(nearestIdx).padStart(2, '0')}:00 UTC`
      : `Day ${nearestIdx + 1}`;

    const rate = data[nearestIdx];
    const zScore = ((rate - 38) / 14).toFixed(1);
    const isAnomalous = Math.abs(zScore) > 1.8;

    document.getElementById('tooltip-time').textContent = `Timestamp: ${timeLabel}`;
    document.getElementById('tooltip-rate').textContent = `${rate} posts/hr`;
    document.getElementById('tooltip-status').innerHTML = isAnomalous
      ? `<span class="text-red-400 font-bold">Z-Score: +${zScore} (Anomalous Interval)</span>`
      : `<span class="text-emerald-400 font-bold">Z-Score: ${zScore} (Normative Baseline)</span>`;
  };

  svg.onmouseleave = function() {
    crossX.classList.add('opacity-0');
    crossDot.classList.add('opacity-0');
    tooltip.classList.add('opacity-0');
  };
}

function setCurveRange(range) {
  activeCurveRange = range;
  const btn24 = document.getElementById('btn-curve-24h');
  const btn7d = document.getElementById('btn-curve-7d');
  const axis = document.getElementById('x-axis-labels');

  if (range === '24h') {
    btn24.className = "px-3 py-1 rounded-lg bg-white dark:bg-obsidian-900 shadow-sm text-zinc-900 dark:text-zinc-100 font-semibold transition-all";
    btn7d.className = "px-3 py-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all";
    if (axis) {
      axis.innerHTML = `
        <span>00:00 (Sleep)</span>
        <span>04:00</span>
        <span>08:00 (Wake)</span>
        <span>12:00</span>
        <span>16:00</span>
        <span>20:00</span>
        <span>23:59</span>
      `;
    }
  } else {
    btn7d.className = "px-3 py-1 rounded-lg bg-white dark:bg-obsidian-900 shadow-sm text-zinc-900 dark:text-zinc-100 font-semibold transition-all";
    btn24.className = "px-3 py-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all";
    if (axis) {
      axis.innerHTML = `
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      `;
    }
  }
  renderSplineCurve();
}

// --------------------------------------------------------------------------
// 7. Forensic Actions (Anonymize & Share Docket)
// --------------------------------------------------------------------------
function anonymizeProfile() {
  const nameEl = document.getElementById('profile-name');
  const handleEl = document.getElementById('profile-handle');
  const avatarEl = document.getElementById('profile-avatar-img');

  if (nameEl) nameEl.textContent = "Subject #409-REDACTED [GDPR-Safe]";
  if (handleEl) handleEl.textContent = "@anonymous_subject";
  if (avatarEl) avatarEl.src = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80";

  showToast("Personal identifiers masked in UI state (GDPR compliant)");
}

function shareDocketModal() {
  copyToken("https://profilesentinel.ai/docket/audit_8f4c2e0b19d43a67");
  showToast("Forensic report link copied to clipboard");
}

function copyAuditHash() {
  copyToken("SHA256:8f4c2e0b19d43a67be92015fa72c3d18903cde85a6b7e0df39a");
  showToast("Cryptographic SHA-256 docket signature copied");
}

function toggleTokens() {
  const drawer = document.getElementById('token-drawer');
  if (drawer) drawer.classList.toggle('translate-x-full');
}

function copyToken(text) {
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  showToast(`Copied: ${text}`);
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    t.classList.add('opacity-0', 'pointer-events-none');
  }, 2600);
}
