/* ============================================================
   CAS Writing Services — ATS Checker v4
   Frequency-weighted, tier-based keyword analysis.
   Only curated database keywords appear in results — no noise.
   ============================================================ */

/* ---- Elements ---- */
const checkBtn      = document.getElementById('checkBtn');
const jdText        = document.getElementById('jdText');
const cvText        = document.getElementById('cvText');
const atsError      = document.getElementById('atsError');
const atsResults    = document.getElementById('atsResults');
const atsCta        = document.getElementById('atsCta');
const scoreNum      = document.getElementById('scoreNum');
const scoreTag      = document.getElementById('scoreTag');
const scoreLabel    = document.getElementById('scoreLabel');
const scoreRing     = document.getElementById('scoreRing');
const recList       = document.getElementById('recList');
const foundChips    = document.getElementById('foundChips');
const missingChips  = document.getElementById('missingChips');
const detectedBadge = document.getElementById('detectedBadge');

const TIER_WEIGHTS = { critical: 5, certifications: 4, technical: 2 };

/* ---- Check ---- */
checkBtn.addEventListener('click', () => {
  atsError.textContent = '';
  const jobTitle = (document.getElementById('jobTitleInput')?.value || '').trim();
  const jd = jdText.value.trim();
  const cv = cvText.value.trim();
  if (!jd) { atsError.textContent = 'Please paste the job description.'; return; }
  if (!cv) { atsError.textContent = 'Please paste your CV text.'; return; }
  if (jd.length < 100) { atsError.textContent = 'Job description looks too short — paste the full text.'; return; }
  if (cv.length < 100) { atsError.textContent = 'CV looks too short — paste the full text.'; return; }
  renderResults(analyzeATS(jd, cv, jobTitle));
});

/* ============================================================
   ANALYSIS ENGINE
   ============================================================ */

function countInText(keyword, text) {
  const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (text.match(new RegExp(escaped, 'g')) || []).length;
}

function analyzeATS(jdRaw, cvRaw, jobTitle = '') {
  const jd = jdRaw.toLowerCase();
  const cv = cvRaw.toLowerCase();

  // Detection priority: explicit job title → JD text scan → generic fallback
  const detected = detectRoleFromTitle(jobTitle) || detectRole(jdRaw);

  if (!detected) {
    return { roleDetected: false, ...genericAnalysis(jd, cv) };
  }

  const role = ROLE_DATABASE[detected.roleId];

  // Build keyword entries: only those that appear in THIS JD
  // Weight = tier_weight × JD frequency (repeated keywords matter more)
  const build = (keywords, tier) =>
    keywords
      .map(kw => ({ kw, tier, freq: countInText(kw, jd), weight: TIER_WEIGHTS[tier] }))
      .filter(k => k.freq > 0)
      .map(k => ({ ...k, weight: k.weight * Math.min(k.freq, 3) })); // cap freq bonus at 3x

  const allKw = [
    ...build(role.critical, 'critical'),
    ...build(role.certifications, 'certifications'),
    ...build(role.technical, 'technical'),
  ].sort((a, b) => b.weight - a.weight); // most important first

  const found   = allKw.filter(k => cv.includes(k.kw.toLowerCase()));
  const missing = allKw.filter(k => !cv.includes(k.kw.toLowerCase()));

  const totalPts   = allKw.reduce((n, k) => n + k.weight, 0);
  const matchedPts = found.reduce((n, k) => n + k.weight, 0);
  const score = totalPts > 0 ? Math.min(100, Math.round((matchedPts / totalPts) * 100)) : 0;

  return {
    roleDetected: true,
    roleName: role.name,
    score,
    found:   found.slice(0, 20),
    missing: missing.slice(0, 20),
    criticalMissing: missing.filter(k => k.tier === 'critical' || k.tier === 'certifications')
  };
}

/* ---- Generic fallback ---- */
function genericAnalysis(jd, cv) {
  // Only words 6+ chars that look like actual skill terms
  const NOISE = new Set(["ensure","support","manage","develop","provide","maintain","working","company","include","ability","excellent","knowledge","understanding","relevant","degree","related","across","within","including","necessary","environment","minimum","required","strong","experience","candidate","position","responsibilities","requirements","qualifications","dedicated","committed","passionate","dynamic","motivated","enthusiastic","professional","successful","international","description","british","american","national","global","local","regional","stakeholders","performance","contribute","demonstrate","communicate","organisation","business","service","services","product","client","customer","market","various","different","multiple","current","potential","future"]);

  const words = jd.replace(/[^a-z0-9\s]/g,' ').split(/\s+/)
    .filter(w => w.length >= 6 && !NOISE.has(w) && !/^\d+$/.test(w));
  const freq = {};
  words.forEach(w => freq[w] = (freq[w]||0)+1);

  const unique   = Object.keys(freq).filter(w => freq[w] >= 2); // must appear 2+ times
  const found    = unique.filter(w => cv.includes(w)).map(kw => ({ kw, tier:'technical', freq:freq[kw] }));
  const missing  = unique.filter(w => !cv.includes(w)).map(kw => ({ kw, tier:'technical', freq:freq[kw] }));
  const score    = unique.length > 0 ? Math.min(100, Math.round((found.length / unique.length) * 100)) : 0;

  return { score, found: found.slice(0,16), missing: missing.slice(0,16), criticalMissing: [] };
}

/* ============================================================
   RENDER RESULTS
   ============================================================ */

const TIER_LABELS = {
  critical:       { label: 'Critical',     css: 'chip-critical' },
  certifications: { label: 'Certification', css: 'chip-cert' },
  technical:      { label: 'Hard Skill',   css: 'chip-technical' },
};

const TIER_LABELS_MISSING = {
  critical:       { label: 'Critical',     css: 'chip-missing-critical' },
  certifications: { label: 'Cert',         css: 'chip-missing-cert' },
  technical:      { label: 'Hard Skill',   css: 'chip-missing-tech' },
};

function renderResults(result) {
  // Score ring
  scoreRing.style.strokeDashoffset = 327 * (1 - result.score / 100);

  let color, tag, label;
  if (result.score >= 80)      { color='#22c55e'; tag='Excellent';  label='Strong ATS match. Your CV is well-optimised for this role.'; }
  else if (result.score >= 60) { color='#C9A84C'; tag='Good Match'; label='Decent match — a few more targeted keywords will improve your ranking.'; }
  else if (result.score >= 40) { color='#f97316'; tag='Fair Match'; label='Several important keywords are missing — the ATS may rank your CV low.'; }
  else                         { color='#e05252'; tag='Poor Match'; label='Significant gaps. This CV is likely to be filtered before a human sees it.'; }

  scoreRing.style.stroke = color;
  scoreNum.textContent   = result.score + '%';
  scoreTag.textContent   = tag;
  scoreTag.style.color   = color;
  scoreLabel.textContent = label;

  // Role detection badge
  if (detectedBadge) {
    if (result.roleDetected) {
      detectedBadge.textContent = '✓ Analysed as: ' + result.roleName;
      detectedBadge.className   = 'role-badge role-badge--detected';
    } else {
      detectedBadge.textContent = '⚠ Job role not in database — running general keyword scan';
      detectedBadge.className   = 'role-badge role-badge--unknown';
    }
    detectedBadge.style.display = 'inline-block';
  }

  // Recommendations
  recList.innerHTML = buildRecs(result).map(r => `<li>${r}</li>`).join('');

  // Found keywords — labelled by tier
  foundChips.innerHTML = result.found.length
    ? result.found.map(k => {
        const t = TIER_LABELS[k.tier] || TIER_LABELS.technical;
        return `<span class="ats-chip ats-chip-found ${t.css}"><span class="chip-label">${t.label}</span>${escapeHtml(k.kw)}</span>`;
      }).join('')
    : '<span class="ats-empty">No matching keywords detected</span>';

  // Missing keywords — sorted by tier (critical first), labelled
  const sortedMissing = [...result.missing].sort((a,b) => {
    const order = { critical:0, certifications:1, technical:2 };
    return (order[a.tier]||2) - (order[b.tier]||2);
  });

  missingChips.innerHTML = sortedMissing.length
    ? sortedMissing.map(k => {
        const t = TIER_LABELS_MISSING[k.tier] || TIER_LABELS_MISSING.technical;
        return `<span class="ats-chip ats-chip-missing ${t.css}"><span class="chip-label">${t.label}</span>${escapeHtml(k.kw)}</span>`;
      }).join('')
    : '<span class="ats-empty">No major keyword gaps — great!</span>';

  atsResults.classList.add('visible');
  atsCta.classList.add('visible');
  atsResults.scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ---- Recommendations ---- */
function buildRecs(result) {
  const recs = [];
  const { score, missing, criticalMissing } = result;

  if      (score >= 80) recs.push('Excellent — your CV is well-targeted for this role. Focus on polishing your Professional Summary.');
  else if (score >= 60) recs.push('Good match. Adding a few more specific keywords will push your ranking higher and reduce the chance of being filtered.');
  else if (score >= 40) recs.push('Your CV needs more tailoring for this specific role before you apply.');
  else                  recs.push('This CV is not optimised for this role. A focused rewrite targeting the keywords below is strongly recommended.');

  if (criticalMissing && criticalMissing.length > 0) {
    const kws = criticalMissing.slice(0, 4).map(k => `<strong>${k.kw}</strong>`).join(', ');
    recs.push(`These are critical missing keywords — ATS systems will likely filter your CV without them: ${kws}. Add them to your Professional Summary and Work Experience.`);
  }

  const certsMissing = missing.filter(k => k.tier === 'certifications');
  if (certsMissing.length > 0) {
    recs.push(`The JD mentions certifications your CV doesn't show: <strong>${certsMissing.map(k=>k.kw).join(', ')}</strong>. If you have them, list them clearly in a Certifications section.`);
  }

  recs.push('Mirror the exact phrasing from the job description — ATS systems do literal keyword matching, not concept matching. "Revenue generation" ≠ "generating revenue".');

  return recs;
}

function escapeHtml(s) {
  const d=document.createElement('div');
  d.appendChild(document.createTextNode(s||''));
  return d.innerHTML;
}

/* ============================================================
   FILE UPLOAD — DOCX / PDF / Scanned PDF
   ============================================================ */

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const cvFileInput  = document.getElementById('cvFile');
const uploadStatus = document.getElementById('uploadStatus');

if (cvFileInput) {
  cvFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    cvText.value = '';
    const ext = file.name.split('.').pop().toLowerCase();
    if      (ext === 'docx') await handleDocx(file);
    else if (ext === 'pdf')  await handlePdf(file);
    else setStatus('Unsupported format. Use .pdf or .docx.', 'error');
    cvFileInput.value = '';
  });
}

function setStatus(msg, type) {
  if (!uploadStatus) return;
  uploadStatus.textContent   = msg;
  uploadStatus.className     = `upload-status status-${type}`;
  uploadStatus.style.display = msg ? 'block' : 'none';
}

async function handleDocx(file) {
  setStatus('Reading Word document…', 'loading');
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    if (!result.value.trim()) throw new Error('empty');
    cvText.value = result.value.trim();
    setStatus(`✓ Extracted from "${file.name}"`, 'success');
  } catch { setStatus('Could not read this Word file. Try copy-pasting instead.', 'error'); }
}

async function handlePdf(file) {
  setStatus('Reading PDF…', 'loading');
  try {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      text += (await page.getTextContent()).items.map(it => it.str).join(' ') + '\n';
    }
    const cleaned = text.trim().replace(/\s{3,}/g, '\n');
    if (cleaned.length < 100) { await handleScannedPdf(file, pdf); return; }
    cvText.value = cleaned;
    setStatus(`✓ Extracted from "${file.name}"`, 'success');
  } catch { setStatus('Could not read this PDF. Try copy-pasting instead.', 'error'); }
}

async function handleScannedPdf(file, pdf) {
  setStatus('🔍 Scanned PDF — loading OCR engine. First use downloads ~10MB; may take 30–60 seconds…', 'loading');
  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js');
    const worker = await Tesseract.createWorker('eng');
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      setStatus(`🔍 OCR: page ${i} of ${pdf.numPages}…`, 'loading');
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width; canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      text += (await worker.recognize(canvas)).data.text + '\n';
    }
    await worker.terminate();
    if (!text.trim()) throw new Error('empty');
    cvText.value = text.trim();
    setStatus('✓ OCR complete — review text before checking.', 'success');
  } catch { setStatus('OCR failed. Please copy-paste your CV text manually.', 'error'); }
}

function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}
