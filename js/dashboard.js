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
    headerAlign:'left'
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

  const cvHtml = `
    <div class="cvp-header" style="text-align:${settings.headerAlign}">
      <div class="cvp-name">${esc(h.name||'')}</div>
      ${h.jobTitle&&!hidden['jobTitle']?`<div class="cvp-jobtitle">${esc(h.jobTitle)}</div>`:''}
      ${contact?`<div class="cvp-contact">${esc(contact)}</div>`:''}
    </div>
    <hr class="cvp-divider">
    <div class="cv-sections-area">${(parsed.sections||[]).map((s,i)=>renderSec(s,i)).join('')}</div>`;

  // Render in an off-screen fixed container so html2canvas captures it cleanly
  const wrap  = document.createElement('div');
  wrap.style.cssText = 'position:fixed;top:0;left:0;width:210mm;z-index:-9999;opacity:0;pointer-events:none;';
  const paper = document.createElement('div');
  paper.className = ['cv-paper',`t-${settings.template}`,`hs-${settings.headingStyle}`,
    `hc-${settings.headingCase}`,`cols-1`,
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
  wrap.appendChild(paper);
  document.body.appendChild(wrap);

  const btn = event.target.closest('button');
  if (btn) { btn.textContent = '⏳ Generating…'; btn.disabled = true; }

  setTimeout(async () => {
    try {
      await html2pdf().set({
        margin: 0,
        filename: `${cv.name||'CV'}.pdf`,
        image: { type:'jpeg', quality:0.98 },
        html2canvas: { scale:2, useCORS:true, logging:false, x:0, y:0, scrollX:0, scrollY:0, windowWidth: paper.scrollWidth },
        jsPDF: { unit:'mm', format:'a4', orientation:'portrait' },
        pagebreak: { mode:['css'], avoid:'.cvp-bullet,.cvp-entry-title,.cvp-entry-meta' }
      }).from(paper).save();
    } finally {
      document.body.removeChild(wrap);
      if (btn) { btn.textContent = 'Download'; btn.disabled = false; }
    }
  }, 400);
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
