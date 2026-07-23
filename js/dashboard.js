/* ============================================================
   CAS CV Builder — dashboard.js
   Handles gallery rendering, modal, and CV actions.
   CV data lives in Firestore (users/{uid}/cvs/{cvId}), reached
   through window.CVStore (see js/cv-store.js). This file itself
   stays a classic global-scope script; only the Firestore calls
   are async.
   ============================================================ */

// Auth is now handled by auth-guard.js (Firebase) — see js/auth-guard.js

// In-memory copy of whatever CVStore.getAll() last returned, so
// actions like download/delete don't need a fresh Firestore read.
let cachedCVs = [];

// Waits for the actual fonts a CV uses to finish loading before a PDF
// capture, instead of a flat setTimeout guess. A fixed delay can still
// fire before a slow (mobile data) font fetch resolves, which bakes the
// fallback font's slightly different metrics into both the raster and
// the page-break measurement, sometimes tipping content onto an extra
// page compared to the same CV on a faster connection. See editor.js's
// ensureFontsReady for the same pattern.
async function ensureFontsReady(bodyFont, nameFont) {
  if (!(document.fonts && document.fonts.load)) return;
  const stacks = [bodyFont, nameFont].filter(f => f && f !== 'inherit');
  const specs = [];
  stacks.forEach(stack => {
    // See editor.js's ensureFontsReady for why only the primary family
    // name (not the full fallback-list stack straight from settings) is
    // passed to FontFaceSet.load(): that call's font argument is a CSS
    // font shorthand meant to name the one font being requested, and a
    // fallback list there is out of spec and inconsistently parsed
    // across browsers, silently failing to trigger the real font's
    // fetch on at least one — the exact race this function exists to
    // prevent, just moved one level up.
    const primaryFamily = stack.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
    specs.push(`400 16px "${primaryFamily}"`, `700 16px "${primaryFamily}"`, `italic 400 16px "${primaryFamily}"`, `italic 700 16px "${primaryFamily}"`);
  });
  try {
    await Promise.all(specs.map(spec => document.fonts.load(spec).catch(() => {})));
    await document.fonts.ready;
  } catch { /* best-effort; fall through and render with whatever's loaded */ }
}

// Elements
const logoutBtn     = document.getElementById('logoutBtn');
const newCvBtn      = document.getElementById('newCvBtn');
const newCvBtnEmpty = document.getElementById('newCvBtnEmpty');
const modalOverlay  = document.getElementById('modalOverlay');
const modalClose    = document.getElementById('modalClose');
const optionImport  = document.getElementById('optionImport');
const optionScratch = document.getElementById('optionScratch');
const cvCountEl     = document.getElementById('cvCount');
const emptyState    = document.getElementById('emptyState');
const cvGrid        = document.getElementById('cvGrid');

/* ---- Logout ---- */
logoutBtn.addEventListener('click', () => {
  if (typeof window.casSignOut === 'function') {
    window.casSignOut();
  } else {
    // Fallback, shouldn't normally happen since auth-guard.js
    // always runs first and defines this.
    window.location.href = 'index.html';
  }
});

/* ---- Modal ---- */
function openModal() {
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

newCvBtn.addEventListener('click', openModal);
newCvBtnEmpty.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ---- Option handlers ---- */
optionImport.addEventListener('click', () => {
  closeModal();
  window.location.href = 'import.html';
});

optionScratch.addEventListener('click', async () => {
  closeModal();
  const id = 'cv_' + Date.now();
  const blankCV = {
    id,
    name: 'Untitled CV',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    raw: '',
    parsed: {
      header: { name: '', jobTitle: '', email: '', phone: '', location: '', linkedin: '', contact: '' },
      sections: [
        { title: 'Professional Profile', type: 'profile', entries: [{ visible:true, summary:'' }], lines: [] },
        { title: 'Work Experience',      type: 'work',     entries: [], lines: [] },
        { title: 'Education',            type: 'education',entries: [], lines: [] },
        { title: 'Core Skills',          type: 'skills',   entries: [], lines: [] }
      ]
    },
    columnAssign: {},
    hiddenFields: {},
    sectionNames: {},
    sectionWidth: {},
    settings: {}
  };
  try {
    const CVStore = await window.cvStoreReady;
    await CVStore.save(blankCV);
    window.location.href = `editor.html?id=${id}`;
  } catch {
    alert('Could not create a new CV. Please try again.');
  }
});

/* ---- Gallery render ---- */
function renderGallery() {
  const cvs = cachedCVs;

  cvCountEl.textContent = cvs.length === 0
    ? '0 CVs saved'
    : `${cvs.length} CV${cvs.length === 1 ? '' : 's'} saved`;

  if (cvs.length === 0) {
    emptyState.style.display = 'flex';
    cvGrid.style.display     = 'none';
    return;
  }

  emptyState.style.display = 'none';
  cvGrid.style.display     = 'grid';

  cvGrid.innerHTML = cvs.map(cv => `
    <div class="cv-card" data-id="${cv.id}">
      <div class="cv-card-top">
        <div class="cv-card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="cv-card-info">
          <div class="cv-card-name">${escapeHtml(cv.name)}</div>
          ${cv.parsed?.header?.jobTitle ? `<div class="cv-card-jobtitle">${escapeHtml(cv.parsed.header.jobTitle)}</div>` : ''}
          <div class="cv-card-date">Last edited ${formatDate(cv.updatedAt || cv.createdAt)}</div>
        </div>
      </div>
      <div class="cv-card-actions">
        <button class="cv-action-btn" onclick="editCV('${cv.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Edit
        </button>
        <button class="cv-action-btn" onclick="downloadCV('${cv.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Download
        </button>
        <button class="cv-action-btn cv-action-btn--delete" onclick="deleteCV('${cv.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          Delete
        </button>
      </div>
    </div>
  `).join('');
}

/* ---- Actions ---- */
function editCV(id) {
  window.location.href = `editor.html?id=${id}`;
}

function downloadCV(id) {
  const cv = cachedCVs.find(c => c.id === id);
  if (!cv) { alert('CV not found.'); return; }

  const settings = Object.assign({
    template:'classic', headingStyle:'underline', headingCase:'upper',
    subtitleStyle:'normal', linkStyle:'underline', accentColor:'#1a1a1a',
    accentHeadings:true, accentLine:true, baseFontSize:11, nameFontSize:19,
    titleFontSize:12, headingFontSize:10, entryFontSize:11, lineHeight:1.55,
    sectionSpacing:11, marginLR:13, marginTB:11, bodyFont:'Calibri, Arial, sans-serif',
    nameFont:'inherit', listStyle:'bullet', colorBg:'#ffffff', colorText:'#1a1a1a',
    headerAlign:'left', headerPosition:'top', columns:1, twoColWidth:32
  }, cv.settings || {});

  const parsed  = cv.parsed || {};
  const hidden  = cv.hiddenFields || {};
  const names   = cv.sectionNames || {};
  const h       = parsed.header || {};
  const esc     = s => { const d=document.createElement('div'); d.appendChild(document.createTextNode(s||'')); return d.innerHTML; };
  const bullet  = settings.listStyle==='hyphen'?'–':'•';

  const fieldOrder = cv.headerFieldOrder || ['email','phone','location','linkedin'];
  let contact = fieldOrder.filter(k => !hidden[k] && h[k]).map(k => h[k]).join(' | ');
  if (!contact && h.contact && !hidden['contact']) contact = h.contact;

  function renderSec(sec, i) {
    const name = names[i] !== undefined ? names[i] : sec.title;
    let body = '';
    if (sec.entries && sec.entries.length) {
      sec.entries.filter(e=>e.visible!==false).forEach(e => {
        // Declaration section
        if (sec.type === 'declaration') {
          if (e.statement) body += `<p class="cvp-line">${esc(e.statement)}</p>`;
          if (e.signatureName) body += `<p class="cvp-signature">${esc(e.signatureName)}</p>`;
          if (e.date) body += `<p class="cvp-entry-meta">${esc(e.date)}</p>`;
          return;
        }
        // Skills section (the Skills form's skill/info/level fields —
        // see editor.js's renderEntryHTML for the stype==='skills' case
        // this mirrors). Reported by Cas: Core Skills entries downloaded
        // from the Dashboard showed only the bold category label
        // ("Sales and Business Development") with nothing after it —
        // the actual skill list lives in entry.info, a field this
        // function otherwise never looks at (only desc/summary, which
        // skill entries don't use), so it was silently dropped.
        if (sec.type === 'skills' || (sec.type === 'custom' && (cv.customSectionType||{})[i] === 'skill')) {
          const skill = e.skill||''; const info = e.info||''; const level = e.level||'';
          if (skill&&info) body += `<p class="cvp-line"><strong class="cvp-cat">${esc(skill)}:</strong> ${esc(info)}</p>`;
          else if (skill)  body += `<p class="cvp-line"><strong class="cvp-cat">${esc(skill)}</strong>${level?' — '+esc(level):''}</p>`;
          return;
        }
        // Found auditing this function against editor.js's renderEntryHTML
        // after the skills bug above: certifications, languages, awards/
        // publications/interests, and references entries each store their
        // content in their own specific field names too (not the generic
        // title/employer/desc fields the fallback branch below reads), so
        // they were silently dropping data the exact same way skills was.
        if (sec.type === 'certifications') {
          const name = e.name||''; const nameLink = e.nameLink||'';
          const nameHtml = nameLink ? `<a href="${esc(nameLink)}" target="_blank" rel="noopener">${esc(name)}</a>` : esc(name);
          const date = e.date||''; const info = e.info||'';
          if (name||date||info) body += `<p class="cvp-line"><strong>${nameHtml}</strong>${date?' — Date: '+esc(date):''}${info?'<br>'+esc(info):''}</p>`;
          return;
        }
        if (sec.type === 'languages') {
          if (e.language) body += `<p class="cvp-line">${esc(e.language)}${e.proficiency?' — '+esc(e.proficiency):''}</p>`;
          return;
        }
        if (sec.type === 'awards' || sec.type === 'publications' || sec.type === 'interests') {
          const title = e.title||e.interest||''; const titleLink = e.titleLink||e.interestLink||'';
          const titleHtml = titleLink ? `<a href="${esc(titleLink)}" target="_blank" rel="noopener">${esc(title)}</a>` : esc(title);
          const sub = [e.issuer||e.publisher, e.date||''].filter(Boolean).join(' — ');
          const desc = e.desc||'';
          if (title) body += `<p class="cvp-entry-title">${titleHtml}</p>`;
          if (sub)   body += `<p class="cvp-entry-meta">${esc(sub)}</p>`;
          if (desc)  body += `<p class="cvp-line">${esc(desc)}</p>`;
          return;
        }
        if (sec.type === 'references') {
          const nameLink = e.nameLink||'';
          const nameHtml = nameLink ? `<a href="${esc(nameLink)}" target="_blank" rel="noopener">${esc(e.name||'')}</a>` : esc(e.name||'');
          if (e.name) body += `<p class="cvp-entry-title">${nameHtml}</p>`;
          if (e.position||e.company) body += `<p class="cvp-entry-meta">${esc([e.position,e.company].filter(Boolean).join(', '))}</p>`;
          if (e.email||e.phone) body += `<p class="cvp-line">${esc([e.email,e.phone].filter(Boolean).join(' | '))}</p>`;
          return;
        }
        const title   = e.jobTitle||e.degree||e.title||e.skill||e.name||'';
        const sub     = e.employer||e.school||e.role||e.provider||e.organisation||'';
        const subLink = e.employerLink||e.schoolLink||e.providerLink||e.organisationLink||'';
        const start = e.startDate||''; const end = e.endDate||''; const loc = e.location||'';
        const desc  = e.desc||e.summary||'';
        const meta  = [start&&end?start+' – '+end:start, loc].filter(Boolean).join(' | ');
        const subHtml = subLink ? `<a href="${esc(subLink)}" target="_blank" rel="noopener">${esc(sub)}</a>` : esc(sub);
        if (title) body += `<p class="cvp-entry-title">${esc(title)}</p>`;
        if (sub||meta) body += `<p class="cvp-entry-meta">${[subHtml, esc(meta)].filter(Boolean).join(' | ')}</p>`;
        if (desc) desc.split('\n').forEach(l => {
          const t=l.trim(); if(!t)return;
          if(/^[•–-]\s/.test(t)) body+=`<p class="cvp-bullet">${bullet} ${esc(t.replace(/^[•–-]\s+/,''))}</p>`;
          else body+=`<p class="cvp-line">${esc(t)}</p>`;
        });
      });
    } else {
      (sec.lines||[]).forEach(l => {
        const t=l.trim(); if(!t){body+='<div class="cvp-gap"></div>';return;}
        if(/^[•–-]\s/.test(t)){body+=`<p class="cvp-bullet">${bullet} ${esc(t.replace(/^[•–-]\s+/,''))}</p>`;return;}
        if(t.includes(' | ')&&/(Present|\d{4})/i.test(t)){body+=`<p class="cvp-entry-meta">${esc(t)}</p>`;return;}
        const cat=t.match(/^([^:•|–-]{2,50}):\s+(.+)$/);
        if(cat&&!/^\d/.test(cat[1])){body+=`<p class="cvp-line"><strong class="cvp-cat">${esc(cat[1])}:</strong> ${esc(cat[2])}</p>`;return;}
        body+=`<p class="cvp-line">${esc(t)}</p>`;
      });
    }
    return `<div class="cvp-section"><div class="cvp-sec-heading">${esc(name)}</div><div class="cvp-sec-content">${body}</div></div>`;
  }

  // Found auditing this function against editor.js after the skills/
  // certifications/etc. content-mapping bugs above: this function ALSO
  // hardcoded a single flowing column ('cols-1', one <div
  // class="cv-sections-area">) regardless of the CV's actual Columns
  // setting, completely ignoring columnAssign (which sections go in the
  // sidebar vs main column). For any 2-column or sidebar-template CV
  // (Atlantic Blue, Corporate Panel, Cobalt Edge, Obsidian Edge, Neutral
  // Gray — see SIDEBAR_TEMPLATES), the Dashboard download would have
  // dumped every section into one plain column, losing the entire
  // layout, not just some field content. Mirrors editor.js's
  // buildCVHTML structure (SIDEBAR_TEMPLATES list, the sidebar
  // template's header-IS-the-colored-panel markup with sections nested
  // in .cvp-header-sections, and the generic two-column
  // .cv-two-col-wrap > .cv-sidebar-col + .cv-main-col split) using this
  // function's own renderSec for each section either way.
  const SIDEBAR_TEMPLATES = ['atlantic-blue', 'corporate-panel', 'cobalt-edge', 'obsidian-edge', 'neutral-gray'];
  const isTwoCol = String(settings.columns) === '2';
  const isSidebarTemplate = isTwoCol && SIDEBAR_TEMPLATES.includes(settings.template);
  const columnAssign = cv.columnAssign || {};
  const allSecs    = (parsed.sections||[]).map((s,i)=>({s,i}));
  const sidebarSecs = allSecs.filter(({i})=>columnAssign[i]==='sidebar');
  const mainSecs    = allSecs.filter(({i})=>(columnAssign[i]||'main')==='main');

  const headerInner = `
    <div class="cvp-name">${esc(h.name||'')}</div>
    ${h.jobTitle&&!hidden['jobTitle']?`<div class="cvp-jobtitle">${esc(h.jobTitle)}</div>`:''}
    ${contact?`<div class="cvp-contact">${esc(contact)}</div>`:''}`;

  let cvHtml;
  if (isSidebarTemplate) {
    cvHtml = `
      <div class="cvp-header" style="text-align:${settings.headerAlign}">
        ${headerInner}
        <div class="cvp-header-sections">${sidebarSecs.map(({s,i})=>renderSec(s,i)).join('')}</div>
      </div>
      ${mainSecs.map(({s,i})=>renderSec(s,i)).join('')}`;
  } else if (isTwoCol) {
    const headerPos = settings.headerPosition;
    const headerInColumn = headerPos === 'left' || headerPos === 'right';
    const headerBlockInColumn = `<div class="cvp-header cvp-header-incolumn">${headerInner}</div>`;
    cvHtml = `
      ${headerInColumn ? '' : `<div class="cvp-header" style="text-align:${settings.headerAlign}">${headerInner}</div><hr class="cvp-divider">`}
      <div class="cv-two-col-wrap">
        <div class="cv-sidebar-col">${headerInColumn&&headerPos==='left' ?headerBlockInColumn:''}${sidebarSecs.map(({s,i})=>renderSec(s,i)).join('')}</div>
        <div class="cv-main-col">${headerInColumn&&headerPos==='right'?headerBlockInColumn:''}${mainSecs.map(({s,i})=>renderSec(s,i)).join('')}</div>
      </div>`;
  } else {
    cvHtml = `
      <div class="cvp-header" style="text-align:${settings.headerAlign}">${headerInner}</div>
      <hr class="cvp-divider">
      <div class="cv-sections-area">${allSecs.map(({s,i})=>renderSec(s,i)).join('')}</div>`;
  }

  // Render in an off-screen fixed container so html2canvas captures it cleanly
  const wrap  = document.createElement('div');
  wrap.style.cssText = 'position:fixed;top:0;left:0;width:210mm;z-index:-9999;opacity:0;pointer-events:none;';
  const paper = document.createElement('div');
  paper.className = ['cv-paper',`t-${settings.template}`,`hs-${settings.headingStyle}`,
    `hc-${settings.headingCase}`, isTwoCol?'cols-2':'cols-1',
    settings.accentHeadings?'ac-headings':'', settings.accentLine?'ac-line':''].filter(Boolean).join(' ');
  paper.innerHTML = cvHtml;
  paper.style.cssText = `width:210mm;min-height:297mm;background:${settings.colorBg};color:${settings.colorText};font-family:${settings.bodyFont};font-size:${settings.baseFontSize}px;line-height:${settings.lineHeight};padding:${settings.marginTB}mm ${settings.marginLR}mm;box-sizing:border-box;`;
  paper.style.setProperty('--cv-accent', settings.accentColor);
  paper.style.setProperty('--cv-name-size',     settings.nameFontSize    +'px');
  paper.style.setProperty('--cv-name-font',      settings.nameFont);
  paper.style.setProperty('--cv-title-size',     settings.titleFontSize   +'px');
  paper.style.setProperty('--cv-heading-size',   settings.headingFontSize +'px');
  paper.style.setProperty('--cv-entry-size',     settings.entryFontSize   +'px');
  paper.style.setProperty('--cv-section-gap',    settings.sectionSpacing  +'px');
  paper.style.setProperty('--cv-margin-lr',      settings.marginLR        +'mm');
  paper.style.setProperty('--cv-margin-tb',      settings.marginTB        +'mm');
  paper.style.setProperty('--cv-col-width',      settings.twoColWidth     +'%');
  wrap.appendChild(paper);
  document.body.appendChild(wrap);
  neutralizeHeaderBleed(paper);

  const btn = event.target.closest('button');
  if (btn) { btn.textContent = '⏳ Generating…'; btn.disabled = true; }

  (async () => {
    try {
      await ensureFontsReady(settings.bodyFont, settings.nameFont);
      // quality/scale match editor.js's PDF export (see that file's
      // comment): 0.98 JPEG measured larger than a lossless PNG of the
      // same page for this flat-background, dark-text content, so it
      // was paying for lossy compression while getting none of its
      // benefit. 0.85/1.5 cuts file size substantially with no visible
      // quality loss at normal zoom.
      await html2pdf().set({
        margin: 0,
        filename: `${cv.name||'CV'}.pdf`,
        image: { type:'jpeg', quality:0.85 },
        html2canvas: { scale:1.5, useCORS:true, logging:false, x:0, y:0, scrollX:0, scrollY:0, windowWidth: paper.scrollWidth },
        jsPDF: { unit:'mm', format:'a4', orientation:'portrait' },
        pagebreak: { mode:['css'], avoid:'.cvp-bullet,.cvp-entry-title,.cvp-entry-meta' }
      }).from(paper).save();
    } finally {
      document.body.removeChild(wrap);
      if (btn) { btn.textContent = 'Download'; btn.disabled = false; }
    }
  })();
}

async function deleteCV(id) {
  if (!confirm('Delete this CV? This cannot be undone.')) return;
  try {
    const CVStore = await window.cvStoreReady;
    await CVStore.remove(id);
    cachedCVs = cachedCVs.filter(cv => cv.id !== id);
    renderGallery();
  } catch {
    alert('Could not delete this CV. Please try again.');
  }
}

/* ---- Helpers ---- */
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || 'Untitled CV'));
  return d.innerHTML;
}

/* ---- Init ---- */
async function boot() {
  cvCountEl.textContent = 'Loading…';
  emptyState.style.display = 'none';
  cvGrid.style.display     = 'block';
  cvGrid.innerHTML = '<p class="cv-loading-text">Loading your CVs…</p>';

  try {
    const CVStore = await window.cvStoreReady;
    await CVStore.migrateIfNeeded();
    cachedCVs = await CVStore.getAll();
  } catch {
    cvCountEl.textContent = '';
    cvGrid.innerHTML = '<p class="cv-loading-text">Could not load your CVs. Please refresh the page.</p>';
    return;
  }

  renderGallery();
}

boot();

// Reported by Cas: the Dashboard's Download button produced a CV that
// looked visually different (colors/styling) from what Editor's own
// Download PDF or Customize panel showed for the exact same CV. The
// underlying color/style computation itself checked out correct in
// isolation, so the more likely explanation is staleness: cachedCVs is
// only ever populated once, when this script first runs (boot() above).
// Editor's own "Dashboard" button does a real navigation
// (window.location.href), which reloads this script and refreshes
// cachedCVs — but a phone's native back gesture/button can instead
// restore this page from the browser's back-forward cache (bfcache)
// without re-running any script, silently leaving cachedCVs (and
// therefore what Download uses) stuck on whatever it was BEFORE
// whatever was just edited in the editor. pageshow's event.persisted
// flag is true specifically when a page was restored from bfcache
// rather than freshly loaded; re-running boot() in that case only
// (never on the normal fresh-load path, where it would just be a
// redundant duplicate fetch of what already just ran above).
window.addEventListener('pageshow', (event) => {
  if (event.persisted) boot();
});
