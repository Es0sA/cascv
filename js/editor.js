/* ============================================================
   CAS CV Builder — editor.js  v3
   Structured entry system + html2pdf PDF generation
   ============================================================ */

const params   = new URLSearchParams(window.location.search);
const cvId     = params.get('id');
if (!cvId) window.location.replace('dashboard.html');

// Populated asynchronously by initEditor() once the Firestore read
// resolves (see the BOOT section at the bottom of this file). Every
// function below that reads cvData is only ever called after that
// has happened, since rendering itself is kicked off from
// initEditor() too.
let cvData = null;

/* ============================================================
   SECTION TYPE DEFINITIONS
   ============================================================ */
const SECTION_TYPES = {
  profile: {
    label: 'Professional Profile', icon: '👤',
    fields: [{ key:'summary', label:'Professional Summary', type:'textarea', allowAlign:true }],
    single: true
  },
  work: {
    label: 'Work Experience', icon: '💼',
    fields: [
      { key:'jobTitle',  label:'Job Title',  type:'text' },
      { key:'employer',  label:'Employer',   type:'text', linkable:true },
      { key:'startDate', label:'Start Date', type:'text', placeholder:'e.g. January 2020', clearable:true },
      { key:'endDate',   label:'End Date',   type:'text', placeholder:'e.g. Present', allowPresent:true, clearable:true },
      { key:'location',  label:'Location',   type:'text', placeholder:'City, Country' },
      { key:'desc',      label:'Description', type:'textarea', placeholder:'Describe your role and achievements...', allowAlign:true }
    ]
  },
  education: {
    label: 'Education', icon: '🎓',
    fields: [
      { key:'degree',    label:'Degree / Qualification',  type:'text' },
      { key:'school',    label:'School / Institution',    type:'text', linkable:true },
      { key:'startDate', label:'Start Date', type:'text', placeholder:'e.g. 2019', clearable:true },
      { key:'endDate',   label:'End Date',   type:'text', placeholder:'e.g. 2023', clearable:true },
      { key:'location',  label:'Location',   type:'text', placeholder:'City, Country' },
      { key:'desc',      label:'Description', type:'textarea', placeholder:'Relevant modules, achievements...', allowAlign:true }
    ]
  },
  skills: {
    label: 'Core Skills', icon: '🧠',
    fields: [
      { key:'skill', label:'Skill / Category',  type:'text' },
      { key:'info',  label:'Sub-skills / Info', type:'textarea', placeholder:'Specific skills, tools, methods...' },
      { key:'level', label:'Skill Level', type:'select',
        options: ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] }
    ]
  },
  certifications: {
    label: 'Certifications & Professional Development', icon: '🏅',
    fields: [
      { key:'name', label:'Certificate / Qualification', type:'text', linkable:true },
      { key:'date', label:'Date Earned',                 type:'text', placeholder:'e.g. June 2024', clearable:true },
      { key:'info', label:'Additional Information',      type:'textarea', placeholder:'Issuer, details...' }
    ]
  },
  languages: {
    label: 'Languages', icon: '🌍',
    fields: [
      { key:'language',    label:'Language',   type:'text' },
      { key:'proficiency', label:'Proficiency', type:'select',
        options: ['', 'Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Native'] }
    ]
  },
  projects: {
    label: 'Projects', icon: '🚀',
    fields: [
      { key:'title',     label:'Project Title',  type:'text', linkable:true },
      { key:'role',      label:'Your Role',      type:'text' },
      { key:'startDate', label:'Start Date',     type:'text', clearable:true },
      { key:'endDate',   label:'End Date',       type:'text', allowPresent:true, clearable:true },
      { key:'desc',      label:'Description',    type:'textarea', placeholder:'Challenges, your role, impact...', allowAlign:true }
    ]
  },
  awards: {
    label: 'Awards', icon: '🏆',
    fields: [
      { key:'title',   label:'Award Title',  type:'text', linkable:true },
      { key:'issuer',  label:'Issuer',       type:'text' },
      { key:'date',    label:'Date',         type:'text', clearable:true },
      { key:'desc',    label:'Description',  type:'textarea', allowAlign:true }
    ]
  },
  courses: {
    label: 'Courses', icon: '📚',
    fields: [
      { key:'title',     label:'Course Title',  type:'text' },
      { key:'provider',  label:'Institution',   type:'text', linkable:true },
      { key:'startDate', label:'Start Date',    type:'text', clearable:true },
      { key:'endDate',   label:'End Date',      type:'text', clearable:true },
      { key:'location',  label:'Location',      type:'text' },
      { key:'desc',      label:'Description',   type:'textarea', allowAlign:true }
    ]
  },
  organisations: {
    label: 'Organisations', icon: '🏢',
    fields: [
      { key:'name',     label:'Organisation', type:'text', linkable:true },
      { key:'role',     label:'Role',         type:'text' },
      { key:'start',    label:'Start Date',   type:'text', clearable:true },
      { key:'end',      label:'End Date',     type:'text', clearable:true },
      { key:'location', label:'Location',     type:'text' },
      { key:'desc',     label:'Description',  type:'textarea', allowAlign:true }
    ]
  },
  publications: {
    label: 'Publications', icon: '📰',
    fields: [
      { key:'title',     label:'Title',        type:'text', linkable:true },
      { key:'publisher', label:'Publisher',    type:'text' },
      { key:'date',      label:'Date',         type:'text', clearable:true },
      { key:'desc',      label:'Description',  type:'textarea', allowAlign:true }
    ]
  },
  references: {
    label: 'References', icon: '👥',
    fields: [
      { key:'name',     label:'Full Name',   type:'text', linkable:true },
      { key:'position', label:'Position',    type:'text' },
      { key:'company',  label:'Company',     type:'text' },
      { key:'email',    label:'Email',       type:'text' },
      { key:'phone',    label:'Phone',       type:'text' }
    ]
  },
  interests: {
    label: 'Interests', icon: '⭐',
    fields: [
      { key:'interest', label:'Interest',    type:'text', linkable:true },
      { key:'desc',     label:'Description', type:'textarea' }
    ]
  },
  declaration: {
    label: 'Declaration', icon: '✍️',
    fields: [
      { key:'statement',     label:'Declaration Statement', type:'textarea',
        placeholder:'I hereby declare that the information provided above is true and accurate to the best of my knowledge.' },
      { key:'signatureName', label:'Signature (typed name)', type:'text', placeholder:'Your full name' },
      { key:'date',          label:'Date',                   type:'text', placeholder:'e.g. June 2026', clearable:true }
    ],
    single: true
  },
  custom: {
    label: 'Custom Section', icon: '✏️',
    useTextarea: true
  }
};

/* ---- DEFAULTS ---- */
const DEFAULTS = {
  template:'classic', columns:1, twoColWidth:32, headerAlign:'left',
  subtitleLine:'next', paperFormat:'A4', bodyFont:'Calibri, Arial, sans-serif',
  nameFont:'inherit', baseFontSize:11, nameFontSize:19, titleFontSize:12,
  headingFontSize:10, entryFontSize:11, lineHeight:1.55, letterSpacing:0,
  sectionSpacing:11, marginLR:13, marginTB:11, headingStyle:'underline',
  headingCase:'upper', subtitleStyle:'normal', dateStyle:'normal', locationStyle:'normal', listStyle:'bullet',
  dateFormat:'Month YYYY', showDuration:false, skillStyle:'text',
  useMarkdown:false, accentColor:'#1a1a1a', colorBg:'#ffffff',
  colorSidebarBg:'#f0f4f8', colorText:'#1a1a1a', accentName:false,
  accentTitle:false, accentHeadings:true, accentLine:true, accentDates:false,
  accentSubtitle:false, showPageNums:false, linkStyle:'underline',
  footerCustom:false, footerLeft:'', footerCenter:'', footerRight:'',
};

// Real values get merged in with cvData.settings once initEditor()
// has fetched the CV; DEFAULTS alone is just a safe placeholder for
// the brief window before that.
let cvSettings = Object.assign({}, DEFAULTS);

/* ---- Elements ---- */
const backBtn           = document.getElementById('backBtn');
const cvNameDisplay     = document.getElementById('cvNameDisplay');
const saveIndicator     = document.getElementById('saveIndicator');
const downloadBtn       = document.getElementById('downloadBtn');
const reimportBtn       = document.getElementById('reimportBtn');
const undoBtn           = document.getElementById('undoBtn');
const redoBtn           = document.getElementById('redoBtn');
const sectionsContainer = document.getElementById('sectionsContainer');
const customizePanel    = document.getElementById('customizePanel');
const reimportOverlay   = document.getElementById('reimportOverlay');
const reimportClose     = document.getElementById('reimportClose');
const reimportText      = document.getElementById('reimportText');
const reimportConfirm   = document.getElementById('reimportConfirm');
const reimportError     = document.getElementById('reimportError');
const cvPaper           = document.getElementById('cvPaper');

// document.title and cvNameDisplay get the real CV name once
// initEditor() has fetched it; both already show sensible
// placeholders ("CAS CV Builder — Editor" / "Loading...") until then.
backBtn.addEventListener('click', () => window.location.href = 'dashboard.html');

// Disabled until initEditor() has actual CV data to act on.
downloadBtn.disabled = true;
reimportBtn.disabled = true;
sectionsContainer.innerHTML = '<p class="cv-loading-text">Loading CV…</p>';
cvPaper.innerHTML = '<p class="cv-loading-text">Loading CV…</p>';

/* ============================================================
   PDF DOWNLOAD — html2pdf.js (creates actual PDF file)

   Captures an off-screen clone of cvPaper rendered at TRUE A4/Letter
   mm dimensions (matching dashboard.js's approach), instead of
   capturing the live on-screen preview directly — the on-screen
   preview is a fixed-px (660px-wide) scaled-down box for editing
   convenience, and capturing it directly caused a width/page-height
   mismatch against html2pdf's mm-based page slicing.

   To avoid a spurious near-blank trailing page (rounding between
   the browser's mm→px layout and html2canvas's own pixel math can
   push captured height a hair past an exact page boundary), we:
   1. Measure the clone's TRUE natural content height first (no
      forced page height yet).
   2. Compute exactly how many pages that content needs.
   3. Size the clone to that exact multiple of page height, so the
      capture always lands precisely on a page boundary.
   4. As a safety net, trim any stray trailing page from the
      generated PDF if rounding still produced one extra.
   ============================================================ */
downloadBtn.addEventListener('click', async () => {
  if (typeof html2pdf === 'undefined') { window.print(); return; }

  const isLetter = cvSettings.paperFormat === 'Letter';
  const [pw, ph] = isLetter ? [215.9, 279.4] : [210, 297];

  downloadBtn.textContent = '⏳ Generating…';
  downloadBtn.disabled    = true;

  try {
    if (isPaginatedLayout()) {
      await exportPaginatedPdf(pw, ph, isLetter);
    } else {
      await exportFlowingPdf(pw, ph, isLetter);
    }
  } catch (err) {
    console.error('PDF generation failed:', err);
    alert('PDF generation failed. Please try again — if this keeps happening, let Cas know.');
  } finally {
    downloadBtn.textContent = '⬇ Download PDF';
    downloadBtn.disabled    = false;
  }
});

// Real-pagination export: each .cv-page is rendered to its own canvas
// and assembled into the PDF explicitly via jsPDF's own addPage/
// addImage, instead of handing html2pdf the whole document and hoping
// its automatic CSS-pagebreak detection lines up with our own .cv-page
// boundaries — that approach silently produced a phantom blank page
// (html2pdf's own pixel-height-based pagination and our CSS `after`
// hint don't reliably reconcile with each other). This has zero such
// ambiguity: one canvas in, one page out, one at a time.
async function exportPaginatedPdf(pw, ph, isLetter) {
  const pageEls = Array.from(cvPaper.querySelectorAll('.cv-page'));
  if (!pageEls.length) return;

  let pdf = null;
  for (let i = 0; i < pageEls.length; i++) {
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:fixed;top:0;left:0;width:${pw}mm;z-index:-9999;opacity:0;pointer-events:none;`;
    const pageClone = pageEls[i].cloneNode(true);
    pageClone.style.boxShadow = 'none';
    pageClone.style.width = pageClone.style.maxWidth = `${pw}mm`;
    pageClone.style.minWidth = '0';
    wrap.appendChild(pageClone);
    document.body.appendChild(wrap);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const opt = {
      margin: 0,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false,
                     x: 0, y: 0, scrollX: 0, scrollY: 0,
                     windowWidth: pageClone.scrollWidth, windowHeight: pageClone.scrollHeight },
      jsPDF: { unit: 'mm', format: isLetter ? [pw, ph] : 'a4', orientation: 'portrait' },
    };
    const worker = html2pdf().set(opt).from(pageClone);
    const canvas = await worker.toCanvas().get('canvas');
    document.body.removeChild(wrap);

    if (!pdf) {
      pdf = await worker.toPdf().get('pdf');
      // Even a single .cv-page, run through html2pdf's own .toPdf()
      // step, can land a hair over one physical page's worth of
      // pixels (canvas-height rounding) and get a phantom near-blank
      // 2nd page tacked on internally — trim it back to exactly 1,
      // same safety net the fallback export already relies on.
      const n = pdf.internal.getNumberOfPages();
      for (let p = n; p > 1; p--) pdf.deletePage(p);
    } else {
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addPage([pw, ph], 'portrait');
      pdf.addImage(imgData, 'JPEG', 0, 0, pw, ph);
    }
  }
  pdf.save(`${cvData.name || 'CV'}.pdf`);
}

// Fallback (2-col/mix/sidebar-template) export: unchanged from before —
// clones the whole flowing #cvPaper, snaps its height to an exact page
// multiple to avoid html2canvas/jsPDF rounding producing a near-blank
// trailing page, and trims any stray extra page as a safety net.
async function exportFlowingPdf(pw, ph, isLetter) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed;top:0;left:0;width:${pw}mm;z-index:-9999;opacity:0;pointer-events:none;`;
  const clone = cvPaper.cloneNode(true);
  clone.removeAttribute('id');
  clone.style.width     = `${pw}mm`;
  clone.style.maxWidth  = `${pw}mm`;
  clone.style.minHeight = '0';
  clone.style.height    = 'auto';
  clone.style.boxShadow = 'none';
  wrap.appendChild(clone);
  document.body.appendChild(wrap);

  // Let the browser lay out the clone at full width before measuring.
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  // Measure true content height in mm, then snap the clone's height
  // to an exact multiple of one page — this is what actually
  // prevents the phantom trailing page.
  const pxPerMm         = clone.clientWidth / pw;
  const contentHeightMm = clone.scrollHeight / pxPerMm;
  const pageCount       = Math.max(1, Math.ceil(contentHeightMm / ph - 0.001));
  clone.style.minHeight = `${pageCount * ph}mm`;

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    const opt = {
      margin:     0,
      filename:   `${cvData.name || 'CV'}.pdf`,
      image:      { type: 'jpeg', quality: 0.98 },
      html2canvas:{ scale: 2, useCORS: true, allowTaint: true, logging: false,
                    x: 0, y: 0, scrollX: 0, scrollY: 0,
                    windowWidth: clone.scrollWidth, windowHeight: clone.scrollHeight },
      jsPDF:      { unit: 'mm', format: isLetter ? [pw, ph] : 'a4', orientation: 'portrait' },
      pagebreak:  { mode: ['css'], avoid: '.cvp-bullet,.cvp-entry-title,.cvp-entry-meta,.cvp-entry-row1,.cvp-entry-row2' }
    };

    const worker = html2pdf().set(opt).from(clone);
    await worker.toPdf();
    await worker.get('pdf').then((pdf) => {
      // Safety net: if rounding still produced extra trailing
      // page(s) beyond what the content actually needs, drop them.
      const total = pdf.internal.getNumberOfPages();
      for (let p = total; p > pageCount; p--) pdf.deletePage(p);
    });
    await worker.save();
  } finally {
    document.body.removeChild(wrap);
  }
}

/* ============================================================
   TABS
   ============================================================ */
function switchTab(tab) {
  document.getElementById('tabEdit').classList.toggle('active', tab === 'edit');
  document.getElementById('tabCustomize').classList.toggle('active', tab === 'customize');
  document.getElementById('editPanel').style.display      = tab === 'edit'      ? '' : 'none';
  document.getElementById('customizePanel').style.display = tab === 'customize' ? '' : 'none';
}

/* ============================================================
   EDIT PANEL
   ============================================================ */
function renderEditPanel() {
  // innerHTML replacement below destroys and recreates every child
  // node, which resets the scroll position of the ancestor
  // scrollable panel — save it here and restore it after, so
  // editing/reordering/adding sections doesn't jump you back to
  // the top of the list.
  const scrollEl  = document.querySelector('.editor-left-scroll');
  const savedTop  = scrollEl ? scrollEl.scrollTop : 0;

  const { header, sections } = cvData.parsed;
  let html = '';

  /* Header card */
  html += `
  <div class="accordion" id="acc-header">
    <button class="accordion-header open" onclick="toggleAccordion('header')" type="button">
      <div class="accordion-title-row">
        <span class="accordion-badge">Header</span>
        <span class="accordion-label">Personal Information</span>
      </div>
      <svg class="accordion-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
    </button>
    <div class="accordion-body" id="body-header">
      ${hdrField('name',     'Full Name',           header.name,     'text')}
      ${hdrField('jobTitle', 'Job Title / Tagline',  header.jobTitle, 'text')}
      ${renderContactFields(header)}
      ${hdrField('contact',  'Other Contact / Line', header.contact  || '', 'text',
        'Fallback line shown if email/phone/location fields above are empty.')}
    </div>
  </div>`;

  /* Section cards */
  sections.forEach((section, i) => {
    const name     = cvData.sectionNames[i] !== undefined ? cvData.sectionNames[i] : section.title;
    const assign   = cvData.columnAssign[i] || 'main';
    const showCols = Number(cvSettings.columns) === 2;
    const stype    = section.type || 'custom';
    const def      = SECTION_TYPES[stype] || SECTION_TYPES.custom;

    html += `
  <div class="accordion sec-accordion" id="acc-${i}"
       draggable="true"
       ondragstart="onDragStart(event,${i})"
       ondragover="onDragOver(event,${i})"
       ondrop="onDrop(event,${i})"
       ondragend="onDragEnd()">
    <button class="accordion-header open" onclick="toggleAccordion(${i})" type="button">
      <div class="accordion-title-row">
        <span class="drag-handle" onclick="event.stopPropagation()">⠿</span>
        <span class="accordion-index">${i + 1}</span>
        <input class="accordion-rename" type="text" value="${escapeAttr(name)}"
               onclick="event.stopPropagation()" onkeydown="event.stopPropagation()"
               onchange="event.stopPropagation();renameSectionHandler(${i},this.value)">
      </div>
      <div class="accordion-header-right">
        ${showCols ? `
        <div class="col-assign" onclick="event.stopPropagation()">
          <button class="col-btn ${assign==='main'?'active':''}"    onclick="assignColumn(${i},'main')"    type="button">Main</button>
          <button class="col-btn ${assign==='sidebar'?'active':''}" onclick="assignColumn(${i},'sidebar')" type="button">Sidebar</button>
        </div>` : ''}
        <svg class="accordion-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
      </div>
    </button>
    <div class="accordion-body" id="body-${i}">
      ${def.useTextarea ? renderTextareaSection(section, i) : renderStructuredSection(section, i, def)}
      <div class="section-actions">
        <button class="sec-action-btn sec-action-danger" onclick="deleteSection(${i})" type="button">🗑 Delete</button>
      </div>
    </div>
  </div>`;
  });

  /* Add Content button */
  html += `
  <div class="add-section-wrap">
    <button class="add-section-btn" onclick="openAddContent()" type="button">+ Add Content</button>
  </div>`;

  sectionsContainer.innerHTML = html;
  requestAnimationFrame(() => document.querySelectorAll('.acc-textarea').forEach(autoResize));
  if (scrollEl) scrollEl.scrollTop = savedTop;
}

function renderTextareaSection(section, i) {
  return `<textarea class="acc-textarea" id="section-ta-${i}" data-section="${i}"
      oninput="updateSection(${i},this.value);autoResize(this)"
    >${escapeHtml((section.lines || []).join('\n'))}</textarea>`;
}

function renderStructuredSection(section, i, def) {
  const entries = section.entries || [];
  if (!entries.length) {
    return `<div class="entry-empty">No entries yet.</div>
    <div class="entry-add-row">
      <button class="entry-add-btn" onclick="addEntry(${i})" type="button">+ Add Entry</button>
    </div>`;
  }
  let html = `<div class="entry-list">`;
  entries.forEach((entry, ei) => {
    const preview = entryPreviewLabel(entry, def);
    const visible = entry.visible !== false;
    html += `
    <div class="entry-card ${!visible?'entry-hidden':''}"
         draggable="true"
         ondragstart="onEntryDragStart(event,${i},${ei})"
         ondragover="onEntryDragOver(event,${i},${ei})"
         ondrop="onEntryDrop(event,${i},${ei})"
         ondragend="onEntryDragEnd()">
      <span class="entry-drag-handle">⠿</span>
      <span class="entry-preview" onclick="openEntryEditor(${i},${ei})">${escapeHtml(preview)}</span>
      <div class="entry-actions">
        <button class="entry-vis-btn" onclick="toggleEntryVisibility(${i},${ei})" title="${visible?'Hide':'Show'}" type="button">
          ${visible ? '👁' : '🙈'}
        </button>
      </div>
    </div>`;
  });
  html += `</div>
  <div class="entry-add-row">
    <button class="entry-add-btn" onclick="addEntry(${i})" type="button">+ Add Entry</button>
  </div>`;
  return html;
}

function entryPreviewLabel(entry, def) {
  if (entry.jobTitle)  return entry.jobTitle + (entry.employer ? ', ' + entry.employer : '');
  if (entry.degree)    return entry.degree   + (entry.school   ? ', ' + entry.school   : '');
  if (entry.skill)     return entry.skill;
  if (entry.name)      return entry.name;
  if (entry.language)  return entry.language;
  if (entry.title)     return entry.title;
  if (entry.summary)   return entry.summary.slice(0, 60) + (entry.summary.length > 60 ? '…' : '');
  if (entry.interest)  return entry.interest;
  if (entry.statement) return entry.statement.slice(0, 60) + (entry.statement.length > 60 ? '…' : '');
  if (entry.signatureName) return 'Signed: ' + entry.signatureName;
  return 'New Entry';
}

function hdrField(key, label, value, type, hint) {
  const hidden = cvData.hiddenFields[key];
  return `
    <div class="acc-field-group ${hidden ? 'field-hidden' : ''}">
      <div class="acc-label-row">
        <label class="acc-label">${label}</label>
        <button class="field-visibility-btn" onclick="toggleFieldVisibility('${key}')" type="button" title="${hidden?'Show':'Hide'} field">
          ${hidden
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
          }
        </button>
      </div>
      <input class="acc-input" type="${type}" id="field-${key}" value="${escapeAttr(value || '')}"
             oninput="updateHeader('${key}',this.value)">
      ${hint ? `<p class="acc-hint">${hint}</p>` : ''}
    </div>`;
}

/* ---- Reorderable contact fields (Email / Phone / Location / LinkedIn +
   optional add-on detail/social fields). Only keys present in
   cvData.headerFieldOrder are ever rendered/shown — the catalog below
   is just the full menu of what CAN be added via "+ Add Field". ---- */
const CONTACT_FIELD_META = {
  email:          { label: 'Email',            type: 'email' },
  phone:          { label: 'Phone',             type: 'text'  },
  location:       { label: 'Location',          type: 'text'  },
  linkedin:       { label: 'LinkedIn URL',      type: 'text'  },
  website:        { label: 'Website',           type: 'text'  },
  portfolio:      { label: 'Portfolio URL',     type: 'text'  },
  github:         { label: 'GitHub',            type: 'text'  },
  twitter:        { label: 'Twitter / X',       type: 'text'  },
  nationality:    { label: 'Nationality',       type: 'text'  },
  dob:            { label: 'Date of Birth',     type: 'text'  },
  visaStatus:     { label: 'Visa Status',       type: 'text'  },
  availability:   { label: 'Availability',      type: 'text'  },
  drivingLicense: { label: 'Driving License',   type: 'text'  },
  maritalStatus:  { label: 'Marital Status',    type: 'text'  },
};
// Always shown, never removable (only hideable) — the fields nearly
// every CV needs. Everything else in the catalog above is opt-in.
const CORE_HEADER_FIELDS = ['email', 'phone', 'location'];

function renderContactFields(header) {
  const order = cvData.headerFieldOrder;
  const fieldsHtml = order.map((key, idx) => {
    const meta   = CONTACT_FIELD_META[key] || { label: key, type: 'text' };
    const hidden = cvData.hiddenFields[key];
    const value  = header[key] || '';
    const isFirst = idx === 0;
    const isLast  = idx === order.length - 1;
    const removable = !CORE_HEADER_FIELDS.includes(key);
    return `
    <div class="acc-field-group ${hidden ? 'field-hidden' : ''}">
      <div class="acc-label-row">
        <label class="acc-label">${meta.label}</label>
        <div class="acc-label-actions">
          <button class="field-reorder-btn" onclick="moveHeaderField('${key}',-1)" type="button" title="Move up" ${isFirst?'disabled':''}>↑</button>
          <button class="field-reorder-btn" onclick="moveHeaderField('${key}',1)" type="button" title="Move down" ${isLast?'disabled':''}>↓</button>
          <button class="field-visibility-btn" onclick="toggleFieldVisibility('${key}')" type="button" title="${hidden?'Show':'Hide'} field">
            ${hidden
              ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
              : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
            }
          </button>
          ${removable ? `<button class="field-remove-btn" onclick="removeHeaderField('${key}')" type="button" title="Remove field">✕</button>` : ''}
        </div>
      </div>
      <input class="acc-input" type="${meta.type}" id="field-${key}" value="${escapeAttr(value)}"
             oninput="updateHeader('${key}',this.value)">
    </div>`;
  }).join('');

  const available = Object.keys(CONTACT_FIELD_META).filter(k => !order.includes(k));
  const addFieldHtml = available.length ? `
    <div class="acc-field-group">
      <select class="acc-input add-field-select" onchange="if(this.value){addHeaderField(this.value);this.value='';}">
        <option value="">+ Add Field…</option>
        ${available.map(k => `<option value="${k}">${CONTACT_FIELD_META[k].label}</option>`).join('')}
      </select>
    </div>` : '';

  return fieldsHtml + addFieldHtml;
}

function addHeaderField(key) {
  if (!CONTACT_FIELD_META[key] || cvData.headerFieldOrder.includes(key)) return;
  cvData.headerFieldOrder.push(key);
  renderEditPanel();
  renderRightPanel();
  scheduleSave();
}

function removeHeaderField(key) {
  if (CORE_HEADER_FIELDS.includes(key)) return;
  cvData.headerFieldOrder = cvData.headerFieldOrder.filter(k => k !== key);
  delete cvData.parsed.header[key];
  delete cvData.hiddenFields[key];
  renderEditPanel();
  renderRightPanel();
  scheduleSave();
}

function moveHeaderField(key, direction) {
  const order = cvData.headerFieldOrder;
  const idx = order.indexOf(key);
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= order.length) return;
  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
  renderEditPanel();
  renderRightPanel();
  scheduleSave();
}

/* ============================================================
   RICH TEXT TOOLBAR — wraps selected text with markdown markers
   ============================================================ */
function rteWrap(taId, before, after) {
  const ta = document.getElementById(taId);
  if (!ta) return;
  const start = ta.selectionStart, end = ta.selectionEnd;
  const sel   = ta.value.slice(start, end) || 'text';
  const newVal = ta.value.slice(0, start) + before + sel + after + ta.value.slice(end);
  ta.value = newVal;
  // Update bound entry data
  const key = Object.keys(_editEntryData).find(() => true);
  // Find which field this textarea maps to via its id suffix
  const fieldKey = taId.replace('entry-ta-', '');
  _editEntryData[fieldKey] = newVal;
  ta.focus();
  ta.setSelectionRange(start + before.length, start + before.length + sel.length);
  autoResize(ta);
}

function rteBullet(taId) {
  const ta = document.getElementById(taId);
  if (!ta) return;
  const start = ta.selectionStart;
  // Insert a bullet at the start of the current line
  const before = ta.value.slice(0, start);
  const lineStart = before.lastIndexOf('\n') + 1;
  const newVal = ta.value.slice(0, lineStart) + '• ' + ta.value.slice(lineStart);
  ta.value = newVal;
  const fieldKey = taId.replace('entry-ta-', '');
  _editEntryData[fieldKey] = newVal;
  ta.focus();
  autoResize(ta);
}

function rteLink(taId) {
  const ta = document.getElementById(taId);
  if (!ta) return;
  const start = ta.selectionStart, end = ta.selectionEnd;
  const sel = ta.value.slice(start, end) || 'link text';
  const url = window.prompt('Enter the URL this text should link to:', 'https://');
  if (!url) return;
  const newVal = ta.value.slice(0, start) + `[${sel}](${url})` + ta.value.slice(end);
  ta.value = newVal;
  const fieldKey = taId.replace('entry-ta-', '');
  _editEntryData[fieldKey] = newVal;
  ta.focus();
  autoResize(ta);
}

function clearEntryField(fieldKey) {
  _editEntryData[fieldKey] = '';
  const input = document.getElementById(`ef-${fieldKey}`);
  if (input) input.value = '';
}

function promptEntryLink(linkKey, btnEl) {
  const current = _editEntryData[linkKey] || '';
  const url = window.prompt('Enter the URL (leave blank to remove the link):', current || 'https://');
  if (url === null) return; // cancelled
  _editEntryData[linkKey] = url.trim();
  if (btnEl) btnEl.classList.toggle('link-field-btn-active', !!url.trim());
}

function setEntryAlign(fieldKey, align, btnEl) {
  _editEntryData[`${fieldKey}Align`] = align;
  if (btnEl) {
    btnEl.parentElement.querySelectorAll('.rte-align-btn').forEach(b => b.classList.remove('rte-active'));
    btnEl.classList.add('rte-active');
  }
}

/* ============================================================
   ENTRY EDITOR MODAL
   ============================================================ */
let _editSectionIdx = null;
let _editEntryIdx   = null;
let _editEntryData  = null;

function openEntryEditor(sectionIdx, entryIdx) {
  const section = cvData.parsed.sections[sectionIdx];
  const def     = SECTION_TYPES[section.type] || SECTION_TYPES.custom;
  const entry   = (section.entries || [])[entryIdx] || {};

  _editSectionIdx = sectionIdx;
  _editEntryIdx   = entryIdx;
  _editEntryData  = Object.assign({}, entry);

  document.getElementById('entryEditorTitle').textContent = `Edit ${def.label} Entry`;
  document.getElementById('entryDeleteBtn').style.display = '';
  const visBtn = document.getElementById('entryVisBtn');
  if (visBtn) {
    visBtn.textContent = entry.visible === false ? '🙈' : '👁';
    visBtn.title = entry.visible === false ? 'Show this entry' : 'Hide this entry';
  }

  let html = `<div class="entry-editor-form">`;
  (def.fields || []).forEach(f => {
    const val = entry[f.key] || '';
    if (f.type === 'select') {
      html += `<div class="entry-field-group">
        <label class="acc-label">${f.label}</label>
        <select class="acc-input" onchange="_editEntryData['${f.key}']=this.value">
          ${(f.options||[]).map(o => `<option value="${o}" ${val===o?'selected':''}>${o||'Select…'}</option>`).join('')}
        </select>
      </div>`;
    } else if (f.type === 'textarea') {
      const taId = `entry-ta-${f.key}`;
      const alignKey = `${f.key}Align`;
      const curAlign = entry[alignKey] || 'left';
      html += `<div class="entry-field-group">
        <label class="acc-label">${f.label}</label>
        <div class="rte-toolbar">
          <button type="button" class="rte-btn" title="Bold" onmousedown="event.preventDefault()" onclick="rteWrap('${taId}','**','**')"><b>B</b></button>
          <button type="button" class="rte-btn" title="Italic" onmousedown="event.preventDefault()" onclick="rteWrap('${taId}','*','*')"><i>I</i></button>
          <button type="button" class="rte-btn" title="Underline" onmousedown="event.preventDefault()" onclick="rteWrap('${taId}','__','__')"><u>U</u></button>
          <span class="rte-divider"></span>
          <button type="button" class="rte-btn" title="Bullet point" onmousedown="event.preventDefault()" onclick="rteBullet('${taId}')">• List</button>
          <button type="button" class="rte-btn" title="Insert link" onmousedown="event.preventDefault()" onclick="rteLink('${taId}')">🔗</button>
          ${f.allowAlign ? `
          <span class="rte-divider"></span>
          <button type="button" class="rte-btn rte-align-btn ${curAlign==='left'?'rte-active':''}" title="Align left" onmousedown="event.preventDefault()" onclick="setEntryAlign('${f.key}','left',this)">⟸</button>
          <button type="button" class="rte-btn rte-align-btn ${curAlign==='center'?'rte-active':''}" title="Align center" onmousedown="event.preventDefault()" onclick="setEntryAlign('${f.key}','center',this)">⟺</button>
          <button type="button" class="rte-btn rte-align-btn ${curAlign==='right'?'rte-active':''}" title="Align right" onmousedown="event.preventDefault()" onclick="setEntryAlign('${f.key}','right',this)">⟹</button>
          <button type="button" class="rte-btn rte-align-btn ${curAlign==='justify'?'rte-active':''}" title="Justify" onmousedown="event.preventDefault()" onclick="setEntryAlign('${f.key}','justify',this)">☰</button>` : ''}
        </div>
        <textarea class="acc-input entry-textarea" id="${taId}" placeholder="${f.placeholder||''}"
          oninput="_editEntryData['${f.key}']=this.value;autoResize(this)"
        >${escapeHtml(val)}</textarea>
      </div>`;
    } else {
      const linkKey = `${f.key}Link`;
      const linkVal = entry[linkKey] || '';
      html += `<div class="entry-field-group">
        <label class="acc-label">${f.label}</label>
        ${f.allowPresent ? `<div class="date-present-row">
          <input class="acc-input" type="text" id="ef-${f.key}" value="${escapeAttr(val)}"
                 placeholder="${f.placeholder||''}"
                 oninput="_editEntryData['${f.key}']=this.value">
          <button class="present-btn" onclick="setEntryPresent('${f.key}')" type="button">Now / Present</button>
          ${f.clearable ? `<button class="clear-field-btn" onclick="clearEntryField('${f.key}')" type="button" title="Clear date">✕</button>` : ''}
        </div>` : f.clearable ? `<div class="date-present-row">
          <input class="acc-input" type="text" id="ef-${f.key}" value="${escapeAttr(val)}"
                 placeholder="${f.placeholder||''}"
                 oninput="_editEntryData['${f.key}']=this.value">
          <button class="clear-field-btn" onclick="clearEntryField('${f.key}')" type="button" title="Clear date">✕</button>
        </div>` : f.linkable ? `<div class="link-field-row">
          <input class="acc-input" type="text" id="ef-${f.key}" value="${escapeAttr(val)}"
                 placeholder="${f.placeholder||''}"
                 oninput="_editEntryData['${f.key}']=this.value">
          <button class="link-field-btn ${linkVal?'link-field-btn-active':''}" onclick="promptEntryLink('${linkKey}',this)" type="button" title="Attach a URL">🔗 Link</button>
        </div>` :
        `<input class="acc-input" type="text" value="${escapeAttr(val)}"
               placeholder="${f.placeholder||''}"
               oninput="_editEntryData['${f.key}']=this.value">`}
      </div>`;
    }
  });
  html += `</div>`;

  document.getElementById('entryEditorBody').innerHTML = html;
  document.querySelectorAll('.entry-textarea').forEach(autoResize);
  document.getElementById('entryEditorOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function addEntry(sectionIdx) {
  const section = cvData.parsed.sections[sectionIdx];
  const def     = SECTION_TYPES[section.type] || SECTION_TYPES.custom;
  if (!section.entries) section.entries = [];
  const newIdx  = section.entries.length;
  section.entries.push({ visible: true });
  openEntryEditor(sectionIdx, newIdx);
}

function setEntryPresent(fieldKey) {
  _editEntryData[fieldKey] = 'Present';
  const el = document.getElementById(`ef-${fieldKey}`);
  if (el) el.value = 'Present';
}

function saveEntryAndClose() {
  const section = cvData.parsed.sections[_editSectionIdx];
  if (!section.entries) section.entries = [];
  section.entries[_editEntryIdx] = Object.assign(
    { visible: true },
    _editEntryData
  );
  closeEntryEditor();
  renderEditPanel();
  renderRightPanel();
  scheduleSave();
}

function deleteCurrentEntry() {
  if (!confirm('Delete this entry?')) return;
  const section = cvData.parsed.sections[_editSectionIdx];
  if (section.entries) section.entries.splice(_editEntryIdx, 1);
  closeEntryEditor();
  renderEditPanel();
  renderRightPanel();
  scheduleSave();
}

function toggleCurrentEntryVisibility() {
  _editEntryData.visible = _editEntryData.visible === false ? true : false;
  const visBtn = document.getElementById('entryVisBtn');
  if (visBtn) {
    visBtn.textContent = _editEntryData.visible === false ? '🙈' : '👁';
    visBtn.title = _editEntryData.visible === false ? 'Show this entry' : 'Hide this entry';
  }
}

function closeEntryEditor() {
  document.getElementById('entryEditorOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function toggleEntryVisibility(si, ei) {
  const section = cvData.parsed.sections[si];
  if (section.entries && section.entries[ei]) {
    section.entries[ei].visible = section.entries[ei].visible === false ? true : false;
  }
  renderEditPanel();
  renderRightPanel();
  scheduleSave();
}

/* Entry drag */
let _eDragSi=null, _eDragEi=null;
function onEntryDragStart(e,si,ei) { _eDragSi=si; _eDragEi=ei; e.dataTransfer.effectAllowed='move'; }
function onEntryDragOver(e,si,ei)  { e.preventDefault(); }
function onEntryDrop(e,si,ei) {
  e.preventDefault();
  if (_eDragSi!==si || _eDragEi===ei) {
    const entries = cvData.parsed.sections[si].entries||[];
    const [moved] = entries.splice(_eDragEi,1);
    entries.splice(ei,0,moved);
    renderEditPanel(); renderRightPanel(); scheduleSave();
  }
  _eDragSi=null; _eDragEi=null;
}
function onEntryDragEnd() { _eDragSi=null; _eDragEi=null; }

/* ============================================================
   ADD CONTENT MODAL
   ============================================================ */
function openAddContent() {
  const grid = document.getElementById('addContentGrid');
  grid.innerHTML = Object.entries(SECTION_TYPES).map(([key, def]) =>
    `<div class="add-content-card" onclick="addTypedSection('${key}')">
      <span class="add-content-icon">${def.icon}</span>
      <span class="add-content-label">${def.label}</span>
    </div>`
  ).join('');
  document.getElementById('addContentOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAddContent() {
  document.getElementById('addContentOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function addTypedSection(type) {
  const def = SECTION_TYPES[type];
  cvData.parsed.sections.push({
    title:   def.label,
    type:    type,
    entries: [],
    lines:   []
  });
  closeAddContent();
  renderEditPanel();
  renderRightPanel();
  scheduleSave();
  const newIdx = cvData.parsed.sections.length - 1;
  setTimeout(() => {
    document.getElementById(`acc-${newIdx}`)?.scrollIntoView({ behavior:'smooth', block:'start' });
  }, 100);
}

/* Close modals on overlay click / Escape */
document.getElementById('addContentOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('addContentOverlay')) closeAddContent();
});
document.getElementById('entryEditorOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('entryEditorOverlay')) closeEntryEditor();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeAddContent(); closeEntryEditor(); closeReimport(); }
});

/* ============================================================
   CUSTOMIZE PANEL
   ============================================================ */
const FONTS = [
  // Serif
  { label:'Lora',             value:"'Lora', Georgia, serif" },
  { label:'Aleo',             value:"'Aleo', Georgia, serif" },
  { label:'EB Garamond',      value:"'EB Garamond', Garamond, Georgia, serif" },
  { label:'Georgia',          value:'Georgia, serif' },
  { label:'Times New Roman',  value:"'Times New Roman', Times, serif" },
  { label:'Source Serif',     value:"'Source Serif 4', Georgia, serif" },
  { label:'Merriweather',     value:"'Merriweather', Georgia, serif" },
  { label:'PT Serif',         value:"'PT Serif', Georgia, serif" },
  { label:'Crimson Text',     value:"'Crimson Text', Georgia, serif" },
  // Sans
  { label:'Calibri',          value:'Calibri, Arial, sans-serif' },
  { label:'Lato',             value:"'Lato', Arial, sans-serif" },
  { label:'Source Sans',      value:"'Source Sans 3', Arial, sans-serif" },
  { label:'Open Sans',        value:"'Open Sans', Arial, sans-serif" },
  { label:'Roboto',           value:"'Roboto', Arial, sans-serif" },
  { label:'Work Sans',        value:"'Work Sans', Arial, sans-serif" },
  { label:'Nunito',           value:"'Nunito', Arial, sans-serif" },
  { label:'Karla',            value:"'Karla', Arial, sans-serif" },
  // Mono
  { label:'IBM Plex Mono',    value:"'IBM Plex Mono', 'Courier New', monospace" },
  { label:'Source Code Pro',  value:"'Source Code Pro', 'Courier New', monospace" },
];
const NAME_FONTS = [
  { label:'Same as Body',     value:'inherit',                             preview:'Calibri, Arial, sans-serif' },
  { label:'Comfortaa',        value:"'Comfortaa', cursive",                preview:"'Comfortaa', cursive" },
  { label:'Playfair Display', value:"'Playfair Display', Georgia, serif",  preview:"'Playfair Display', Georgia, serif" },
  { label:'Lato',             value:"'Lato', Arial, sans-serif",           preview:"'Lato', Arial, sans-serif" },
  { label:'Lora',             value:"'Lora', Georgia, serif",              preview:"'Lora', Georgia, serif" },
  { label:'Abril Fatface',    value:"'Abril Fatface', Georgia, serif",     preview:"'Abril Fatface', Georgia, serif" },
  { label:'Pacifico',         value:"'Pacifico', cursive",                 preview:"'Pacifico', cursive" },
  { label:'Caveat',           value:"'Caveat', cursive",                   preview:"'Caveat', cursive" },
  { label:'Bungee Shade',     value:"'Bungee Shade', cursive",             preview:"'Bungee Shade', cursive" },
  { label:'Parisienne',       value:"'Parisienne', cursive",               preview:"'Parisienne', cursive" },
];
const ACCENT_COLORS = [
  { label:'Ink',      value:'#1a1a1a' }, { label:'Navy',    value:'#1B3A6B' },
  { label:'Teal',     value:'#1B5E6B' }, { label:'Forest',  value:'#1B4D3E' },
  { label:'Burgundy', value:'#6B1B2A' }, { label:'Purple',  value:'#3D1B6B' },
  { label:'Slate',    value:'#4A4E69' }, { label:'Brown',   value:'#5C3D2E' },
];
const ALL_TEMPLATES = [
  { value:'classic',         label:'Classic',         accent:'#1a1a1a' },
  { value:'modern',          label:'Modern',          accent:'#1B3A6B' },
  { value:'minimal',         label:'Minimal',         accent:'#1a1a1a' },
  { value:'executive',       label:'Executive',       accent:'#1a1a1a' },
  { value:'refined',         label:'Refined',         accent:'#1B3A6B' },
  { value:'precision-line',  label:'Precision Line',  accent:'#1B3A6B' },
  { value:'classic-serif',   label:'Classic Serif',   accent:'#1a1a1a' },
  { value:'condensed-rule',  label:'Condensed Rule',  accent:'#1a1a1a' },
  { value:'split-rule',      label:'Split Rule',      accent:'#1B3A6B' },
  { value:'clean-slate',     label:'Clean Slate',     accent:'#1a1a1a' },
  { value:'editorial-rule',  label:'Editorial Rule',  accent:'#1B3A6B' },
  { value:'sage-line',       label:'Sage Line',       accent:'#2d5a4a' },
  { value:'saffron-line',    label:'Saffron Line',    accent:'#c08020' },
  { value:'silver-banner',   label:'Silver Banner',   accent:'#4A4E69' },
  { value:'true-blue',       label:'True Blue',       accent:'#1B3A6B' },
  { value:'corporate',       label:'Corporate',       accent:'#1B3A6B' },
  { value:'blue-steel',      label:'Blue Steel',      accent:'#2C3E50' },
  { value:'clear-banner',    label:'Clear Banner',    accent:'#5C3D2E' },
  { value:'hunter-green',    label:'Hunter Green',    accent:'#1B4D3E' },
  { value:'atlantic-blue',   label:'Atlantic Blue',   accent:'#1B3A6B' },
  { value:'corporate-panel', label:'Corporate Panel', accent:'#2a2a2a' },
  { value:'cobalt-edge',     label:'Cobalt Edge',     accent:'#1a4d8f' },
  { value:'obsidian-edge',   label:'Obsidian Edge',   accent:'#12121a' },
  { value:'neutral-gray',    label:'Neutral Gray',    accent:'#6b7280' },
];

// Templates whose CSS already renders a permanent colored side panel
// (see the "Shared sidebar base" rule in main.css). These are inherently
// two-column, so picking one should switch Columns to "2" automatically
// instead of leaving the user with a mismatched single-column layout.
const SIDEBAR_TEMPLATES = ['atlantic-blue', 'corporate-panel', 'cobalt-edge', 'obsidian-edge', 'neutral-gray'];

/* ============================================================
   TEMPLATE THUMBNAILS — real live-rendered miniatures.

   Each thumbnail is an actual `.cv-paper` element carrying the
   SAME template class (t-classic, t-executive, etc.) and the
   same CSS the real editor preview uses, filled with short
   placeholder content, then scaled down with a CSS transform.
   Because it's the real markup/CSS — not a separate photo — the
   thumbnail can never drift out of sync with what clicking it
   actually produces. To add a new template: add one entry above
   and write matching `.cv-paper.t-yourvalue` rules in main.css —
   the thumbnail picks it up automatically, no image asset needed.
   ============================================================ */
function templateThumb(tpl) {
  const hs = cvSettings.headingStyle || 'underline';
  const hc = cvSettings.headingCase  || 'upper';
  const acHead = cvSettings.accentHeadings ? 'ac-headings' : '';
  const acLine = cvSettings.accentLine ? 'ac-line' : '';
  const cls = ['cv-paper', `t-${tpl.value}`, `hs-${hs}`, `hc-${hc}`, acHead, acLine]
    .filter(Boolean).join(' ');
  return `<div class="template-thumb template-thumb-live">
    <div class="${cls}" style="--cv-accent:${tpl.accent || '#1a1a1a'}">
      <div class="cvp-header">
        <div class="cvp-name">Jordan Blake</div>
        <div class="cvp-jobtitle">Marketing Manager</div>
        <div class="cvp-contact">jordan@email.com | City, Country</div>
      </div>
      <hr class="cvp-divider">
      <div class="cvp-section">
        <div class="cvp-sec-heading">Experience</div>
        <div class="cvp-sec-content">
          <div class="cvp-entry-row1"><span class="cvp-entry-title">Senior Marketing Lead</span><span class="cvp-entry-date">2021 – Present</span></div>
          <div class="cvp-entry-row2"><span class="cvp-entry-employer">Acme Co.</span></div>
          <p class="cvp-bullet">• Grew engagement 40% year over year</p>
          <p class="cvp-bullet">• Led a team of five specialists</p>
        </div>
      </div>
      <div class="cvp-section">
        <div class="cvp-sec-heading">Education</div>
        <div class="cvp-sec-content">
          <div class="cvp-entry-row1"><span class="cvp-entry-title">B.Sc. Business</span><span class="cvp-entry-date">2016 – 2020</span></div>
          <div class="cvp-entry-row2"><span class="cvp-entry-employer">State University</span></div>
        </div>
      </div>
      <div class="cvp-section">
        <div class="cvp-sec-heading">Skills</div>
        <div class="cvp-sec-content">
          <p class="cvp-line">Strategy | Communication | Analytics</p>
        </div>
      </div>
    </div>
  </div>`;
}

function renderCustomizePanel() {
  // Same innerHTML-reset issue as renderEditPanel — preserve the
  // panel's vertical scroll AND the template carousel's horizontal
  // scroll (its own independent scroll axis) across re-render.
  const scrollEl    = document.querySelector('.editor-left-scroll');
  const savedTop    = scrollEl ? scrollEl.scrollTop : 0;
  const tplScrollEl = document.querySelector('.template-grid-2col');
  const savedTplLeft = tplScrollEl ? tplScrollEl.scrollLeft : 0;

  const ac = cvSettings.accentColor;
  const colMode = String(cvSettings.columns);
  const isTwoCol = colMode === '2';
  const isMix    = colMode === 'mix';

  let templateHtml = `<div class="template-grid template-grid-2col">`;
  ALL_TEMPLATES.forEach(t => {
    const active = cvSettings.template === t.value ? 'active' : '';
    templateHtml += `<button class="template-card ${active}" onclick="setSetting('template','${t.value}')" type="button">${templateThumb(t)}<span class="template-card-label">${t.label}</span></button>`;
  });
  templateHtml += `</div>`;

  const layoutHtml =
    custRow('Paper Format', toggleGroup([{label:'A4',value:'A4'},{label:'Letter (US)',value:'Letter'}],'paperFormat')) +
    custRow('Columns',      toggleGroup([{label:'⬜ One',value:'1'},{label:'⬛⬛ Two',value:'2'},{label:'▦ Mix',value:'mix'}],'columns')) +
    (isTwoCol ? custRow('Sidebar Width', slider('twoColWidth',20,50,1,'%')) : '') +
    custRow('Header',       toggleGroup([{label:'← Left',value:'left'},{label:'↔ Center',value:'center'}],'headerAlign')) +
    custRow('Subtitle',     toggleGroup([{label:'Next Line',value:'next'},{label:'Same Line',value:'same'}],'subtitleLine')) +
    custRow('Section Layout', renderSectionLayoutPanel(colMode));

  const nameFontObj = NAME_FONTS.find(f=>f.value===cvSettings.nameFont)||NAME_FONTS[0];
  const fontHtml =
    custRow('Body Font',`<div class="font-select-wrap"><select class="cust-select" onchange="onFontChange('bodyFont',this.value)">${FONTS.map(f=>`<option value="${escapeAttr(f.value)}" ${cvSettings.bodyFont===f.value?'selected':''}>${f.label}</option>`).join('')}</select><div class="font-preview-strip" style="font-family:${escapeAttr(cvSettings.bodyFont)}">The quick brown fox jumps over the lazy dog.</div></div>`) +
    custRow('Name Font', `<div class="font-select-wrap"><select class="cust-select" onchange="onFontChange('nameFont',this.value)">${NAME_FONTS.map(f=>`<option value="${escapeAttr(f.value)}" ${cvSettings.nameFont===f.value?'selected':''}>${f.label}</option>`).join('')}</select><div class="font-preview-strip" style="font-family:${escapeAttr(nameFontObj.preview)};font-size:1.05rem;font-weight:700">Your Name Here</div></div>`);

  const fontSizeHtml =
    custRow('Base',             slider('baseFontSize',   9,  14, 0.5,'pt')) +
    custRow('Full Name',        slider('nameFontSize',  14,  34,   1,'pt')) +
    custRow('Job Title',        slider('titleFontSize',  9,  16,   1,'pt')) +
    custRow('Section Headings', slider('headingFontSize',7,  14, 0.5,'pt')) +
    custRow('Entry Header',     slider('entryFontSize',  9,  14, 0.5,'pt'));

  const spacingHtml =
    custRow('Line Height',         slider('lineHeight',    1.2,2.0,0.05,'')) +
    custRow('Letter Spacing',      slider('letterSpacing', 0,  0.2,0.01,'em')) +
    custRow('Section Spacing',     slider('sectionSpacing',4,  28,   1,'px')) +
    custRow('Left & Right Margin', slider('marginLR',      6,  25,   1,'mm')) +
    custRow('Top & Bottom Margin', slider('marginTB',      6,  25,   1,'mm'));

  const headingStyles = [{value:'underline',label:'Underline'},{value:'line',label:'Line'},{value:'bold',label:'Bold'},{value:'bar',label:'Bar'},{value:'overline',label:'Overline'},{value:'double',label:'Double'},{value:'dotted',label:'Dotted'}];
  let hsHtml = `<div class="hs-grid">`;
  headingStyles.forEach(hs => {
    const active = cvSettings.headingStyle===hs.value?'active':'';
    let inner='';
    if(hs.value==='underline') inner=`<div class="hs-preview"><div class="hs-preview-label" style="border-bottom:1px solid #888;padding-bottom:2px">SECTION</div><div class="hs-preview-lines"><div class="hs-preview-line"></div><div class="hs-preview-line"></div></div></div>`;
    else if(hs.value==='line') inner=`<div class="hs-preview"><div class="hs-preview-label">SECTION</div><div class="hs-preview-bar"></div><div class="hs-preview-lines"><div class="hs-preview-line"></div><div class="hs-preview-line"></div></div></div>`;
    else if(hs.value==='bold') inner=`<div class="hs-preview"><div class="hs-preview-label" style="font-weight:900;font-size:8px;color:#555">SECTION</div><div class="hs-preview-lines" style="margin-top:3px"><div class="hs-preview-line"></div><div class="hs-preview-line"></div></div></div>`;
    else if(hs.value==='bar') inner=`<div class="hs-preview" style="flex-direction:row;align-items:stretch;gap:5px"><div class="hs-bar-side"></div><div style="display:flex;flex-direction:column;gap:2px;flex:1"><div class="hs-preview-label">SECTION</div><div class="hs-preview-lines"><div class="hs-preview-line"></div><div class="hs-preview-line"></div></div></div></div>`;
    else if(hs.value==='overline') inner=`<div class="hs-preview"><div class="hs-preview-label" style="border-top:2px solid #888;padding-top:3px">SECTION</div><div class="hs-preview-lines"><div class="hs-preview-line"></div><div class="hs-preview-line"></div></div></div>`;
    else if(hs.value==='double') inner=`<div class="hs-preview"><div class="hs-preview-label" style="border-bottom:3px double #888;padding-bottom:2px">SECTION</div><div class="hs-preview-lines"><div class="hs-preview-line"></div><div class="hs-preview-line"></div></div></div>`;
    else inner=`<div class="hs-preview"><div class="hs-preview-label" style="border-bottom:1.5px dotted #888;padding-bottom:2px">SECTION</div><div class="hs-preview-lines"><div class="hs-preview-line"></div><div class="hs-preview-line"></div></div></div>`;
    hsHtml+=`<button class="hs-btn ${active}" onclick="setSetting('headingStyle','${hs.value}')" type="button">${inner}<span class="hs-btn-label">${hs.label}</span></button>`;
  });
  hsHtml+=`</div>`;

  const styleHtml =
    custRow('Heading Style',  hsHtml) +
    custRow('Heading Case',   toggleGroup([{label:'UPPERCASE',value:'upper'},{label:'Title Case',value:'title'}],'headingCase')) +
    custRow('Subtitle Style', toggleGroup([{label:'Normal',value:'normal'},{label:'Bold',value:'bold'},{label:'Italic',value:'italic'}],'subtitleStyle')) +
    custRow('Date Style',     toggleGroup([{label:'Normal',value:'normal'},{label:'Bold',value:'bold'},{label:'Italic',value:'italic'}],'dateStyle')) +
    custRow('Location Style', toggleGroup([{label:'Normal',value:'normal'},{label:'Bold',value:'bold'},{label:'Italic',value:'italic'}],'locationStyle')) +
    custRow('List Style',     toggleGroup([{label:'• Bullet',value:'bullet'},{label:'– Hyphen',value:'hyphen'}],'listStyle')) +
    custRow('Date Format',    toggleGroup([{label:'Month YYYY',value:'Month YYYY'},{label:'Mon YYYY',value:'Mon YYYY'},{label:'MM/YYYY',value:'MM/YYYY'},{label:'MM.YYYY',value:'MM.YYYY'},{label:'YYYY',value:'YYYY'}],'dateFormat')) +
    custRow('Duration',`<label class="cust-toggle-row"><input type="checkbox" ${cvSettings.showDuration?'checked':''} onchange="toggleBool('showDuration',this.checked)"><span class="cust-toggle-slider"></span><span class="cust-toggle-label">Show job duration (e.g. 2 yrs 3 mos)</span></label>`) +
    custRow('Skill Display',  toggleGroup([{label:'Text',value:'text'},{label:'Bars',value:'bars'},{label:'Dots',value:'dots'}],'skillStyle')) +
    custRow('Markdown',`<label class="cust-toggle-row"><input type="checkbox" ${cvSettings.useMarkdown?'checked':''} onchange="toggleBool('useMarkdown',this.checked);renderRightPanel()"><span class="cust-toggle-slider"></span><span class="cust-toggle-label">Enable **bold** and *italic* in content</span></label>`);

  let colorGrid=`<div class="color-grid">`;
  ACCENT_COLORS.forEach(c=>{
    const active=cvSettings.accentColor===c.value?'active':'';
    colorGrid+=`<div class="color-item ${active}" onclick="setSetting('accentColor','${c.value}')" title="${c.label}"><div class="color-dot" style="background:${c.value}"></div><span class="color-dot-label">${c.label}</span></div>`;
  });
  colorGrid+=`</div><div class="color-custom-row"><span class="color-custom-label">Custom</span><input type="color" class="color-custom-swatch" id="colorPickerSwatch" value="${ac}" oninput="onColorPickerInput(this.value)"><input type="text" class="color-custom-input" id="colorHexInput" value="${ac}" maxlength="7" placeholder="#1a1a1a" oninput="onColorHexInput(this.value)"></div>`;

  const accentTargets=[{key:'accentName',label:'Name'},{key:'accentTitle',label:'Job Title'},{key:'accentHeadings',label:'Section Headings'},{key:'accentLine',label:'Heading Line'},{key:'accentDates',label:'Dates'},{key:'accentSubtitle',label:'Entry Subtitle'}];
  let targetsHtml=`<div class="accent-targets"><div class="accent-targets-label">Apply Accent Colour To</div>`;
  accentTargets.forEach(t=>{
    const checked=cvSettings[t.key]?'checked':'';
    targetsHtml+=`<label class="accent-check"><input type="checkbox" ${checked} onchange="toggleBool('${t.key}',this.checked)"><span class="accent-check-box"></span><span class="accent-check-label">${t.label}</span></label>`;
  });
  targetsHtml+=`</div>`;
  const perColorHtml=`<div class="per-color-grid">${perColorRow('Canvas Background','colorBg',cvSettings.colorBg)}${perColorRow('Sidebar Background','colorSidebarBg',cvSettings.colorSidebarBg)}${perColorRow('Body Text','colorText',cvSettings.colorText)}</div>`;
  const colorHtml = colorGrid + targetsHtml + custRow('Element Colors', perColorHtml);

  const footerCustomFields = cvSettings.footerCustom ? `<div class="footer-zone-grid">
      <div class="footer-zone-field"><label class="acc-label">Left</label><input class="acc-input" type="text" value="${escapeAttr(cvSettings.footerLeft)}" placeholder="e.g. {{name}}" oninput="onFooterZoneInput('footerLeft',this.value)"></div>
      <div class="footer-zone-field"><label class="acc-label">Center</label><input class="acc-input" type="text" value="${escapeAttr(cvSettings.footerCenter)}" placeholder="e.g. {{email}} | {{phone}}" oninput="onFooterZoneInput('footerCenter',this.value)"></div>
      <div class="footer-zone-field"><label class="acc-label">Right</label><input class="acc-input" type="text" value="${escapeAttr(cvSettings.footerRight)}" placeholder="e.g. Page {{pages}}" oninput="onFooterZoneInput('footerRight',this.value)"></div>
      <p class="footer-zone-hint">Available tokens: {{name}} {{email}} {{phone}} {{pages}}</p>
    </div>` : '';
  // Footer / page-number controls don't apply to real multi-page CVs yet:
  // a footer would need to repeat correctly on every generated page, which
  // is explicitly out of scope for this pass (see plan). Hide them rather
  // than leave controls that quietly do nothing.
  const footerHtml = isPaginatedLayout()
    ? `<p class="footer-zone-hint">Page footer / numbering isn't available yet for real multi-page CVs — coming in a future update.</p>` +
      custRow('Link Style', toggleGroup([{label:'Underline',value:'underline'},{label:'Blue',value:'blue'},{label:'Plain',value:'plain'}],'linkStyle'))
    : custRow('Page Numbers',`<label class="cust-toggle-row"><input type="checkbox" ${cvSettings.showPageNums?'checked':''} onchange="toggleBool('showPageNums',this.checked)"><span class="cust-toggle-slider"></span><span class="cust-toggle-label">Show page numbers</span></label>`) +
      custRow('Custom Footer',`<label class="cust-toggle-row"><input type="checkbox" ${cvSettings.footerCustom?'checked':''} onchange="toggleBool('footerCustom',this.checked);renderCustomizePanel();renderRightPanel()"><span class="cust-toggle-slider"></span><span class="cust-toggle-label">Build a custom 3-zone footer</span></label>${footerCustomFields}`) +
      custRow('Link Style', toggleGroup([{label:'Underline',value:'underline'},{label:'Blue',value:'blue'},{label:'Plain',value:'plain'}],'linkStyle'));

  customizePanel.innerHTML =
    section('Design Templates', templateHtml) + section('Layout', layoutHtml) +
    section('Font', fontHtml) + section('Font Size', fontSizeHtml) +
    section('Spacing', spacingHtml) + section('Style', styleHtml) +
    section('Colours', colorHtml) + section('Footer & Links', footerHtml);

  if (scrollEl) scrollEl.scrollTop = savedTop;
  const newTplScrollEl = document.querySelector('.template-grid-2col');
  if (newTplScrollEl) newTplScrollEl.scrollLeft = savedTplLeft;
}

function custRow(label, controlHtml) {
  return `<div class="cust-row"><div class="cust-row-label">${label}</div><div class="cust-row-control">${controlHtml}</div></div>`;
}

/* ============================================================
   SECTION LAYOUT PANEL — drag sections between columns,
   or toggle Full/Half width in Mix mode
   ============================================================ */
function renderSectionLayoutPanel(colMode) {
  const sections = cvData.parsed.sections;
  if (!sections.length) return '<div class="layout-empty">No sections yet.</div>';

  function chip(i) {
    const name = cvData.sectionNames[i] !== undefined ? cvData.sectionNames[i] : sections[i].title;
    const def  = SECTION_TYPES[sections[i].type] || SECTION_TYPES.custom;
    const width = cvData.sectionWidth[i] || 'full';
    return `<div class="layout-chip" draggable="true"
      ondragstart="onLayoutDragStart(event,${i})"
      ondragover="onLayoutDragOver(event,${i})"
      ondrop="onLayoutDrop(event,${i})"
      ondragend="onLayoutDragEnd()">
      <span class="layout-chip-handle">⠿</span>
      <span class="layout-chip-icon">${def.icon || '📄'}</span>
      <span class="layout-chip-label">${escapeHtml(name)}</span>
      ${colMode==='mix' ? `<button class="layout-width-btn" type="button" onclick="event.stopPropagation();toggleSectionWidth(${i})" title="Toggle full/half width">${width==='half'?'◧ Half':'▭ Full'}</button>` : ''}
    </div>`;
  }

  if (colMode === '2') {
    const mainIdx    = sections.map((_,i)=>i).filter(i => (cvData.columnAssign[i]||'main') === 'main');
    const sidebarIdx = sections.map((_,i)=>i).filter(i => cvData.columnAssign[i] === 'sidebar');
    return `<div class="layout-2col-panel">
      <div class="layout-zone" data-zone="sidebar" ondragover="onZoneDragOver(event)" ondrop="onZoneDrop(event,'sidebar')">
        <div class="layout-zone-label">Sidebar</div>
        ${sidebarIdx.length ? sidebarIdx.map(chip).join('') : '<div class="layout-zone-empty">Drag sections here</div>'}
      </div>
      <div class="layout-zone" data-zone="main" ondragover="onZoneDragOver(event)" ondrop="onZoneDrop(event,'main')">
        <div class="layout-zone-label">Main</div>
        ${mainIdx.length ? mainIdx.map(chip).join('') : '<div class="layout-zone-empty">Drag sections here</div>'}
      </div>
    </div>`;
  }

  // One column or Mix: single reorderable list
  return `<div class="layout-1col-panel" data-zone="single" ondragover="onZoneDragOver(event)" ondrop="onZoneDrop(event,'single')">
    ${sections.map((_,i)=>chip(i)).join('')}
    ${colMode==='mix' ? '<p class="layout-hint">Half-width sections pair up side by side, in the order shown.</p>' : ''}
  </div>`;
}

let _layoutDragIdx = null;
function onLayoutDragStart(e, idx) {
  _layoutDragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => e.target.classList.add('layout-chip-dragging'), 0);
}
function onLayoutDragOver(e, idx) { e.preventDefault(); }
function onZoneDragOver(e) { e.preventDefault(); }

function onLayoutDrop(e, targetIdx) {
  e.preventDefault();
  e.stopPropagation();
  if (_layoutDragIdx === null || _layoutDragIdx === targetIdx) return;
  const targetCol = cvData.columnAssign[targetIdx]; // capture target's column before indices shift
  reorderSections(_layoutDragIdx, targetIdx);
  if (targetCol !== undefined) {
    cvData.columnAssign[targetIdx] = targetCol; // moved chip now lives at targetIdx — match target's column
    renderEditPanel(); renderCustomizePanel(); renderRightPanel(); scheduleSave();
  }
  _layoutDragIdx = null;
}

function onZoneDrop(e, zone) {
  e.preventDefault();
  if (_layoutDragIdx === null) return;
  // Dropped on empty zone space (not on a specific chip) — assign to end of that zone/column
  if (zone === 'sidebar' || zone === 'main') {
    cvData.columnAssign[_layoutDragIdx] = zone;
  }
  _layoutDragIdx = null;
  renderEditPanel(); renderCustomizePanel(); renderRightPanel(); scheduleSave();
}

function onLayoutDragEnd() {
  _layoutDragIdx = null;
  document.querySelectorAll('.layout-chip').forEach(el => el.classList.remove('layout-chip-dragging'));
}

function reorderSections(fromIdx, toIdx) {
  const secs = cvData.parsed.sections;
  const [moved] = secs.splice(fromIdx, 1);
  secs.splice(toIdx, 0, moved);
  const remap = obj => {
    const out = {};
    Object.entries(obj).forEach(([k,v]) => {
      let nk = parseInt(k);
      if (nk===fromIdx) nk=toIdx;
      else if (fromIdx<toIdx && nk>fromIdx && nk<=toIdx) nk=nk-1;
      else if (fromIdx>toIdx && nk>=toIdx && nk<fromIdx) nk=nk+1;
      out[nk]=v;
    });
    return out;
  };
  cvData.columnAssign = remap(cvData.columnAssign);
  cvData.sectionNames = remap(cvData.sectionNames);
  cvData.sectionWidth = remap(cvData.sectionWidth);
  renderEditPanel(); renderCustomizePanel(); renderRightPanel(); scheduleSave();
}

function toggleSectionWidth(i) {
  const cur = cvData.sectionWidth[i] || 'full';
  cvData.sectionWidth[i] = cur === 'half' ? 'full' : 'half';
  renderCustomizePanel(); renderRightPanel(); scheduleSave();
}

const SEG_COUNT = 14;

function slider(key, min, max, step, suffix) {
  const val   = cvSettings[key];
  const disp  = step < 1 ? parseFloat(val).toFixed(2) : Math.round(val);
  const pct   = Math.max(0, Math.min(1, (val - min) / (max - min)));
  const filled = Math.round(pct * SEG_COUNT);
  let bars = '';
  for (let s = 0; s < SEG_COUNT; s++) {
    bars += `<span class="seg-bar ${s < filled ? 'seg-filled' : ''}"></span>`;
  }
  return `<div class="seg-slider" data-key="${key}">
    <div class="seg-value-row"><span class="seg-value-badge" id="val-${key}">${disp}${suffix||''}</span></div>
    <div class="seg-bar-row">
      <button class="seg-step-btn" type="button" onclick="stepSlider('${key}',${-step},${min},${max},${step},'${suffix||''}')">−</button>
      <div class="seg-track-wrap">
        <div class="seg-bars" id="segbars-${key}">${bars}</div>
        <input type="range" class="seg-range-overlay" id="range-${key}" min="${min}" max="${max}" step="${step}" value="${val}"
          oninput="onSlider('${key}',parseFloat(this.value),'${suffix||''}')">
      </div>
      <button class="seg-step-btn" type="button" onclick="stepSlider('${key}',${step},${min},${max},${step},'${suffix||''}')">+</button>
    </div>
  </div>`;
}

function updateSegBars(key, min, max) {
  const wrap = document.getElementById(`segbars-${key}`);
  if (!wrap) return;
  const val = cvSettings[key];
  const pct = Math.max(0, Math.min(1, (val - min) / (max - min)));
  const filled = Math.round(pct * SEG_COUNT);
  Array.from(wrap.children).forEach((el, i) => el.classList.toggle('seg-filled', i < filled));
}

function section(title, bodyHtml) {
  return `<div class="cust-section"><div class="cust-section-title">${title}</div>${bodyHtml}</div>`;
}
function toggleGroup(options, settingKey) {
  return `<div class="toggle-group">${options.map(o=>`<button class="toggle-btn ${String(cvSettings[settingKey])===String(o.value)?'active':''}" onclick="setSetting('${settingKey}','${o.value}')" type="button">${o.label}</button>`).join('')}</div>`;
}
function perColorRow(label,key,value) {
  return `<div class="per-color-row"><span class="per-color-label">${label}</span><input type="color" class="per-color-swatch" value="${value}" oninput="onPerColorInput('${key}',this.value)"><span class="per-color-hex">${value}</span></div>`;
}

function setSetting(key, value) {
  const prevTemplate = cvSettings.template;
  cvSettings[key] = value;
  if (key==='template') {
    const t=ALL_TEMPLATES.find(t=>t.value===value); if(t&&t.accent) cvSettings.accentColor=t.accent;
    // These templates already have a permanent colored side panel baked
    // into their CSS, so force the matching column mode automatically
    // rather than leaving the layout mismatched until the user notices.
    if (SIDEBAR_TEMPLATES.includes(value)) cvSettings.columns = '2';
    else if (SIDEBAR_TEMPLATES.includes(prevTemplate)) cvSettings.columns = '1';
  }
  renderCustomizePanel();
  if (key==='listStyle'||key==='columns'||key==='dateFormat'||key==='template') { renderEditPanel(); renderRightPanel(); } else applySettings();
  scheduleSave();
}
function onSlider(key, value, suffix) {
  cvSettings[key]=value;
  const el=document.getElementById(`val-${key}`);
  if(el){ const d=key==='lineHeight'||key==='letterSpacing'?value.toFixed(2):(Number.isInteger(value)?value:value.toFixed(1)); el.textContent=d+(suffix||''); }
  updateSegBars(key, parseFloat(document.getElementById(`range-${key}`)?.min ?? 0), parseFloat(document.getElementById(`range-${key}`)?.max ?? 100));
  applySettings(); scheduleSave();
}
function stepSlider(key, delta, min, max, step, suffix) {
  let next = Math.round((cvSettings[key] + delta) / step) * step;
  next = Math.max(min, Math.min(max, next));
  // Avoid floating point drift (e.g. 1.2000000003)
  next = Math.round(next * 1000) / 1000;
  cvSettings[key] = next;
  const rangeInput = document.getElementById(`range-${key}`);
  if (rangeInput) rangeInput.value = next;
  const el = document.getElementById(`val-${key}`);
  if (el) { const d = step < 1 ? next.toFixed(2) : Math.round(next); el.textContent = d + (suffix||''); }
  updateSegBars(key, min, max);
  applySettings(); scheduleSave();
}
function toggleBool(key,val){
  cvSettings[key]=val;
  if (key==='showDuration') renderRightPanel(); else applySettings();
  scheduleSave();
}
function onFontChange(key,value){ cvSettings[key]=value; applySettings(); scheduleSave(); renderCustomizePanel(); }
function onColorPickerInput(hex){ cvSettings.accentColor=hex; const h=document.getElementById('colorHexInput'); if(h)h.value=hex; applySettings(); scheduleSave(); renderCustomizePanel(); }
function onColorHexInput(val){ const c=val.trim(); if(/^#[0-9a-fA-F]{6}$/.test(c)){cvSettings.accentColor=c; const s=document.getElementById('colorPickerSwatch'); if(s)s.value=c; applySettings(); scheduleSave(); renderCustomizePanel();} }
function onPerColorInput(key,hex){ cvSettings[key]=hex; applySettings(); scheduleSave(); }
function onFooterZoneInput(key,value){ cvSettings[key]=value; renderRightPanel(); scheduleSave(); }

function applySettings() {
  if (isPaginatedLayout()) {
    // #cvPaper is a plain stacking wrapper here; each .cv-page carries
    // the real theme/style class string instead (see computeCvPaperClassString).
    cvPaper.className = 'cv-pages-holder';
    const classString = computeCvPaperClassString(true);
    cvPaper.querySelectorAll('.cv-page').forEach(p => { p.className = 'cv-page ' + classString; });
  } else {
    cvPaper.className = computeCvPaperClassString(false);
  }

  const isLetter = cvSettings.paperFormat==='Letter';
  cvPaper.style.setProperty('--cv-paper-w',  isLetter?'215.9mm':'210mm');
  cvPaper.style.setProperty('--cv-paper-h',  isLetter?'279.4mm':'297mm');
  cvPaper.style.setProperty('--cv-accent',       cvSettings.accentColor);
  cvPaper.style.setProperty('--cv-base',          cvSettings.baseFontSize    +'px');
  cvPaper.style.setProperty('--cv-name-size',     cvSettings.nameFontSize    +'px');
  cvPaper.style.setProperty('--cv-name-font',     cvSettings.nameFont);
  cvPaper.style.setProperty('--cv-title-size',    cvSettings.titleFontSize   +'px');
  cvPaper.style.setProperty('--cv-heading-size',  cvSettings.headingFontSize +'px');
  cvPaper.style.setProperty('--cv-entry-size',    cvSettings.entryFontSize   +'px');
  cvPaper.style.setProperty('--cv-section-gap',   cvSettings.sectionSpacing  +'px');
  cvPaper.style.setProperty('--cv-margin-lr',     cvSettings.marginLR        +'mm');
  cvPaper.style.setProperty('--cv-margin-tb',     cvSettings.marginTB        +'mm');
  cvPaper.style.setProperty('--cv-letter-spacing',cvSettings.letterSpacing   +'em');
  cvPaper.style.setProperty('--cv-col-width',     cvSettings.twoColWidth     +'%');
  cvPaper.style.setProperty('--cv-bg',            cvSettings.colorBg);
  cvPaper.style.setProperty('--cv-sidebar-bg',    cvSettings.colorSidebarBg);
  cvPaper.style.setProperty('--cv-text',          cvSettings.colorText);
  cvPaper.style.fontFamily    = cvSettings.bodyFont;
  cvPaper.style.lineHeight    = cvSettings.lineHeight;
  cvPaper.style.letterSpacing = cvSettings.letterSpacing+'em';
  cvPaper.style.color         = cvSettings.colorText;
  cvPaper.style.background    = cvSettings.colorBg;
  const hdr = cvPaper.querySelector('.cvp-header');
  if (hdr) hdr.style.textAlign = cvSettings.headerAlign;
  requestAnimationFrame(updatePageBreaks);
  if (typeof scheduleFitZoom === 'function') scheduleFitZoom();
}

/* ============================================================
   PAGE BREAK OVERLAY — calibrated to html2pdf rendering
   ============================================================ */
function updatePageBreaks() {
  const overlay = document.getElementById('pageBreakOverlay');
  if (!overlay || !cvPaper) return;
  if (isPaginatedLayout()) {
    // Real .cv-page boundaries exist now — the guessed-ratio overlay
    // would be redundant at best and wrong at worst, so just clear it.
    overlay.innerHTML = '';
    return;
  }
  // Use getBoundingClientRect for actual rendered width
  const rect   = cvPaper.getBoundingClientRect();
  const paperW = rect.width;
  const isLetter = cvSettings.paperFormat==='Letter';
  // html2pdf renders at exact CSS mm dimensions — replicate ratio
  const ratio   = isLetter ? (279.4/215.9) : (297/210);
  const pagePx  = paperW * ratio;
  const totalH  = cvPaper.scrollHeight;
  const pages   = Math.ceil(totalH / pagePx);
  let html = '';
  for (let i=1; i<pages; i++) {
    const top = Math.round(i * pagePx);
    html += `<div class="page-break-line" style="top:${top}px"><span class="page-break-label">↑ Page ${i} ends · Page ${i+1} starts ↓</span></div>`;
  }
  overlay.innerHTML = html;

  // The {{pages}} footer token can't know the real total until the CV is
  // actually laid out (page count depends on content length), so patch
  // it in here alongside the page-break overlay, which already does the
  // same measurement.
  const pagesEl = cvPaper.querySelector('.cvp-footer-pages');
  if (pagesEl) pagesEl.textContent = pages;
}

/* ============================================================
   RIGHT PANEL — Live CV Preview
   ============================================================ */
let _paginationMultiPageSections = new Set();

function renderRightPanel() {
  if (isPaginatedLayout()) {
    const { pageHtmls, multiPageSections } = paginateSingleColumn(cvData.parsed);
    _paginationMultiPageSections = multiPageSections;
    cvPaper.innerHTML = pageHtmls.map(h => `<div class="cv-page">${h}</div>`).join('');
  } else {
    _paginationMultiPageSections = new Set();
    cvPaper.innerHTML = buildCVHTML(cvData.parsed);
  }
  applySettings();
}

function buildCVHTML(parsed) {
  const { header, sections } = parsed;
  const colMode  = String(cvSettings.columns);
  const isTwoCol = colMode === '2';
  const isMix    = colMode === 'mix';
  const isSidebarTemplate = isTwoCol && SIDEBAR_TEMPLATES.includes(cvSettings.template);

  // Build header line from structured fields, in the user-defined order
  let contactLine = '';
  const hf = header;
  const fieldParts = cvData.headerFieldOrder
    .filter(key => !cvData.hiddenFields[key] && hf[key])
    .map(key => hf[key]);
  contactLine = fieldParts.join(' | ');
  if (!contactLine && hf.contact && !cvData.hiddenFields['contact']) contactLine = hf.contact;

  let html = '<div class="cvp-header">';
  if (!cvData.hiddenFields['name'])     html += `<div class="cvp-name">${mdLine(hf.name||'')}</div>`;
  if (!cvData.hiddenFields['jobTitle'] && hf.jobTitle) html += `<div class="cvp-jobtitle">${mdLine(hf.jobTitle)}</div>`;
  if (contactLine) html += `<div class="cvp-contact">${escapeHtml(contactLine)}</div>`;
  if (isSidebarTemplate) {
    // These templates' header IS the colored side panel (see main.css
    // "Shared sidebar base"), so sections assigned to the sidebar render
    // inside it directly and inherit its color, instead of spawning a
    // separate flat-colored box elsewhere in the layout.
    const sidebar = sections.map((s,i)=>({s,i})).filter(({i})=>cvData.columnAssign[i]==='sidebar');
    html += '<div class="cvp-header-sections">' + sidebar.map(({s,i})=>renderSectionPreview(s,i)).join('') + '</div>';
  }
  html += '</div><hr class="cvp-divider">';

  if (isSidebarTemplate) {
    const main = sections.map((s,i)=>({s,i})).filter(({i})=>(cvData.columnAssign[i]||'main')==='main');
    html += main.map(({s,i})=>renderSectionPreview(s,i)).join('');
  } else if (isTwoCol) {
    const main    = sections.map((s,i)=>({s,i})).filter(({i})=>(cvData.columnAssign[i]||'main')==='main');
    const sidebar = sections.map((s,i)=>({s,i})).filter(({i})=>cvData.columnAssign[i]==='sidebar');
    html += '<div class="cv-two-col-wrap">';
    html += '<div class="cv-sidebar-col">' + sidebar.map(({s,i})=>renderSectionPreview(s,i)).join('') + '</div>';
    html += '<div class="cv-main-col">'    + main.map(({s,i})=>renderSectionPreview(s,i)).join('')    + '</div>';
    html += '</div>';
  } else if (isMix) {
    // Walk sections in order; pair up consecutive 'half' width sections into a flex row
    html += '<div class="cv-mix-area">';
    let i = 0;
    while (i < sections.length) {
      const width = cvData.sectionWidth[i] || 'full';
      if (width === 'half') {
        const nextWidth = cvData.sectionWidth[i+1] || 'full';
        if (nextWidth === 'half' && i+1 < sections.length) {
          html += `<div class="cv-mix-row">
            <div class="cv-mix-half">${renderSectionPreview(sections[i], i)}</div>
            <div class="cv-mix-half">${renderSectionPreview(sections[i+1], i+1)}</div>
          </div>`;
          i += 2;
          continue;
        } else {
          // Lone half-width section — render full-width row containing one half slot
          html += `<div class="cv-mix-row"><div class="cv-mix-half">${renderSectionPreview(sections[i], i)}</div></div>`;
          i += 1;
          continue;
        }
      }
      html += renderSectionPreview(sections[i], i);
      i += 1;
    }
    html += '</div>';
  } else {
    html += '<div class="cv-sections-area">';
    sections.forEach((sec,i) => { html += renderSectionPreview(sec, i); });
    html += '</div>';
  }
  if (cvSettings.footerCustom) {
    html += buildCustomFooterHTML(header);
  } else if (cvSettings.showPageNums) {
    html += '<div class="cvp-footer"><span class="cvp-pagenum">Page 1</span></div>';
  }
  return html;
}

/* ============================================================
   REAL A4/LETTER PAGINATION (single-column, non-sidebar-template)

   Everything below builds the CV as genuinely separate `.cv-page`
   containers that content actually flows across as you edit, instead
   of one endlessly-tall flowing div with a decorative overlay line
   guessing where a page would break. Deliberately scoped to the
   common case (Columns: One, not one of the 5 sidebar templates) —
   two-column/Mix layouts and sidebar templates keep the old flowing
   + fake-overlay behavior unchanged; see the plan doc for why (they'd
   need their own per-column/per-page-grid pagination logic, a
   follow-up project of its own).

   The entry-rendering internals (renderEntryHTML, formatLines) are
   reused completely unchanged — only their *output* gets flattened
   into top-level DOM nodes and treated as atomic layout units, rather
   than duplicating any of that per-section-type logic here.
   ============================================================ */
function isPaginatedLayout() {
  return String(cvSettings.columns) === '1' && !SIDEBAR_TEMPLATES.includes(cvSettings.template);
}

// Single source of truth for the class string that carries every
// template/accent/style modifier — used both by applySettings() (for
// the fallback path, applied straight to #cvPaper) and by the real
// -pagination path (applied to each .cv-page instead, since #cvPaper
// becomes a plain stacking wrapper there). excludePageNum drops the
// 'show-pagenum' token: the hardcoded ::after page-number text isn't
// meaningful once there are real repeated pages (see plan's footer
// descope), so it's suppressed rather than shown wrong on every page.
function computeCvPaperClassString(excludePageNum) {
  const colMode = String(cvSettings.columns);
  const colClass = colMode==='2' ? 'cols-2' : colMode==='mix' ? 'cols-mix' : 'cols-1';
  const accentClasses = [
    cvSettings.accentName     ?'ac-name':'', cvSettings.accentTitle    ?'ac-title':'',
    cvSettings.accentHeadings ?'ac-headings':'', cvSettings.accentLine  ?'ac-line':'',
    cvSettings.accentDates    ?'ac-dates':'', cvSettings.accentSubtitle ?'ac-subtitle':'',
    (cvSettings.showPageNums && !excludePageNum) ?'show-pagenum':'', colClass,
  ].filter(Boolean).join(' ');
  return ['cv-paper',`t-${cvSettings.template}`,`hs-${cvSettings.headingStyle}`,
    `hc-${cvSettings.headingCase}`,`ss-${cvSettings.subtitleStyle}`,`ds-${cvSettings.dateStyle}`,
    `lc-${cvSettings.locationStyle}`,`sl-${cvSettings.subtitleLine}`,
    `ls-${cvSettings.linkStyle}`,accentClasses].filter(Boolean).join(' ');
}

// Parses an HTML string and returns its top-level element nodes —
// used to flatten renderEntryHTML()'s per-entry output (row1/row2/each
// bullet/line) into individually-placeable atomic units, without
// touching any of renderEntryHTML's own per-section-type logic.
function htmlToTopLevelNodes(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return Array.from(tmp.children);
}

// Flat ordered array of atomic layout units for single-column
// pagination: the header once (page-1 only), then per section a
// heading unit followed by its entries' row1/row2/bullet/line units
// (each individually placeable — a section's entries, and even a
// single entry's bullets, can end up split across a page boundary,
// matching the exact same atomic granularity already proven safe by
// the PDF export's pagebreak-avoid list).
function buildLayoutUnits(parsed) {
  const { header, sections } = parsed;
  const units = [];
  const sectionMeta = [];

  let contactLine = '';
  const fieldParts = cvData.headerFieldOrder
    .filter(key => !cvData.hiddenFields[key] && header[key])
    .map(key => header[key]);
  contactLine = fieldParts.join(' | ');
  if (!contactLine && header.contact && !cvData.hiddenFields['contact']) contactLine = header.contact;

  let headerHtml = '<div class="cvp-header">';
  if (!cvData.hiddenFields['name'])     headerHtml += `<div class="cvp-name">${mdLine(header.name||'')}</div>`;
  if (!cvData.hiddenFields['jobTitle'] && header.jobTitle) headerHtml += `<div class="cvp-jobtitle">${mdLine(header.jobTitle)}</div>`;
  if (contactLine) headerHtml += `<div class="cvp-contact">${escapeHtml(contactLine)}</div>`;
  headerHtml += '</div><hr class="cvp-divider">';
  units.push({ html: headerHtml, sectionIndex: null, isHeading: false, isHeader: true });

  sections.forEach((sec, i) => {
    const name = cvData.sectionNames[i] !== undefined ? cvData.sectionNames[i] : sec.title;
    sectionMeta[i] = { name };
    units.push({ html: `<div class="cvp-sec-heading">${escapeHtml(name)}</div>`, sectionIndex: i, isHeading: true });

    const stype = sec.type || 'custom';
    const def   = SECTION_TYPES[stype];
    if (def && !def.useTextarea && sec.entries && sec.entries.length) {
      // Process per-entry (not the whole section's HTML flattened
      // together) so a job title's row1 and its company/location row2
      // can be paired into ONE atomic unit — splitting them across a
      // page boundary would show a title with no company on one page
      // and a company with no title on the next, which is worse than
      // just keeping the pair together. Bullets/lines still flow
      // independently, same as before.
      sec.entries.filter(e=>e.visible!==false).forEach(entry => {
        const nodes = htmlToTopLevelNodes(renderEntryHTML(entry, stype));
        let j = 0;
        while (j < nodes.length) {
          const node = nodes[j];
          const next = nodes[j+1];
          if ((node.className||'').includes('cvp-entry-row1') && next && (next.className||'').includes('cvp-entry-row2')) {
            units.push({ html: node.outerHTML + next.outerHTML, sectionIndex: i, isHeading: false });
            j += 2;
          } else {
            units.push({ html: node.outerHTML, sectionIndex: i, isHeading: false });
            j += 1;
          }
        }
      });
    } else {
      htmlToTopLevelNodes(formatLines(sec.lines || [])).forEach(node => {
        units.push({ html: node.outerHTML, sectionIndex: i, isHeading: false });
      });
    }
  });

  return { units, sectionMeta };
}

// Renders `units` into a hidden off-screen probe at the CV's true
// content width, measures each unit's real rendered height (mirrors
// the "measure, don't assume DPI" idiom already used for width by the
// PDF export handler below), then walks them in order splitting into
// a new page whenever the next unit would overflow the current page's
// usable content height. Returns an array of page-sized unit arrays.
function measureAndPaginate(units, pw, ph, marginLR, marginTB, classString, sectionMeta) {
  const probe = document.createElement('div');
  probe.className = classString;
  probe.style.cssText = 'position:fixed;top:0;left:-99999px;visibility:hidden;box-shadow:none;';
  probe.style.width = probe.style.maxWidth = `${pw}mm`;
  probe.style.minWidth = probe.style.minHeight = '0';
  probe.style.height = 'auto';
  // CSS custom properties (--cv-base, --cv-margin-lr, etc.) are
  // inherited, so copy them from the live #cvPaper for accurate
  // font-size/spacing measurement.
  Array.from(cvPaper.style).forEach(prop => {
    if (prop.startsWith('--')) probe.style.setProperty(prop, cvPaper.style.getPropertyValue(prop));
  });
  probe.style.fontFamily    = cvPaper.style.fontFamily;
  probe.style.lineHeight    = cvPaper.style.lineHeight;
  probe.style.letterSpacing = cvPaper.style.letterSpacing;
  document.body.appendChild(probe);

  const pxPerMm = probe.clientWidth / pw;
  const usablePageHeightPx = (ph - marginTB * 2) * pxPerMm;

  // Measure by actually rendering each candidate page through
  // unitsToPageHTML — the exact same .cvp-section/.cvp-sec-heading/
  // .cvp-sec-content wrapper markup the final render uses — rather
  // than summing bare unit heights in isolation. Summing individual
  // units missed the wrapper elements' own margins/padding/section
  // gaps, which under-predicted real height enough to let content
  // silently overflow a page's true limit.
  const pages = [[]];
  units.forEach(u => {
    const pageIdx = pages.length - 1;
    const candidate = pages[pageIdx].concat([u]);
    probe.innerHTML = unitsToPageHTML(candidate, sectionMeta, pageIdx);
    const h = probe.getBoundingClientRect().height;
    if (h > usablePageHeightPx && pages[pageIdx].length > 0) {
      pages.push([u]);
    } else {
      pages[pageIdx] = candidate;
    }
  });
  document.body.removeChild(probe);
  return pages;
}

// Reassembles one page's unit array back into real HTML, reconstructing
// the .cvp-section/.cvp-sec-heading/.cvp-sec-content wrapper structure
// fresh per page. A section whose heading unit isn't among this page's
// units (i.e. it started on an earlier page) gets a synthesized
// "(cont'd)" heading instead of silently continuing headerless. IDs are
// only kept unique-and-meaningful on a section's FIRST page — later
// pages suffix the id, since updateSection()/renameSectionHandler()'s
// fast-path deliberately avoids targeting multi-page sections at all
// (see those functions) and duplicate ids would be invalid HTML.
function unitsToPageHTML(pageUnits, sectionMeta, pageIdx) {
  let html = '';
  let i = 0;
  while (i < pageUnits.length) {
    const u = pageUnits[i];
    if (u.isHeader) { html += u.html; i++; continue; }
    const secIdx = u.sectionIndex;
    let headingHtml = '';
    let bodyHtml = '';
    while (i < pageUnits.length && pageUnits[i].sectionIndex === secIdx) {
      const gu = pageUnits[i];
      if (gu.isHeading) headingHtml = gu.html;
      else bodyHtml += gu.html;
      i++;
    }
    const isContinuation = !headingHtml;
    if (isContinuation) {
      headingHtml = `<div class="cvp-sec-heading">${escapeHtml(sectionMeta[secIdx].name)} (cont'd)</div>`;
    }
    const idSuffix = isContinuation ? `-p${pageIdx}` : '';
    html += `<div class="cvp-section" id="preview-sec-${secIdx}${idSuffix}">
      ${headingHtml}
      <div class="cvp-sec-content" id="preview-content-${secIdx}${idSuffix}">${bodyHtml}</div>
    </div>`;
  }
  return html;
}

// Top-level entry point: builds the ordered units, paginates them, and
// returns an array of per-page HTML strings ready to become `.cv-page`
// divs. Also returns which section indices span more than one page, so
// callers (updateSection/renameSectionHandler's fast-path) know when a
// targeted single-node DOM patch is no longer safe.
function paginateSingleColumn(parsed) {
  const isLetter = cvSettings.paperFormat === 'Letter';
  const [pw, ph] = isLetter ? [215.9, 279.4] : [210, 297];
  const classString = computeCvPaperClassString(true);

  const { units, sectionMeta } = buildLayoutUnits(parsed);
  const pages = measureAndPaginate(units, pw, ph, cvSettings.marginLR, cvSettings.marginTB, classString, sectionMeta);

  const sectionPageCount = {};
  pages.forEach(pageUnits => {
    const seen = new Set(pageUnits.map(u => u.sectionIndex).filter(idx => idx !== null));
    seen.forEach(idx => { sectionPageCount[idx] = (sectionPageCount[idx] || 0) + 1; });
  });
  const multiPageSections = new Set(Object.keys(sectionPageCount).filter(k => sectionPageCount[k] > 1).map(Number));

  const pageHtmls = pages.map((pageUnits, pageIdx) => unitsToPageHTML(pageUnits, sectionMeta, pageIdx));
  return { pageHtmls, classString, multiPageSections };
}

// Substitutes {{name}}/{{email}}/{{phone}}/{{pages}} tokens in each footer
// zone. {{pages}} is filled in after render by updatePageBreaks() (the
// real total isn't knowable until the CV is actually laid out in the DOM),
// via a placeholder span it can find and patch.
function buildCustomFooterHTML(header) {
  const fill = (text) => escapeHtml(text)
    .replace(/\{\{name\}\}/gi,  escapeHtml(header.name||''))
    .replace(/\{\{email\}\}/gi, escapeHtml(header.email||''))
    .replace(/\{\{phone\}\}/gi, escapeHtml(header.phone||''))
    .replace(/\{\{pages\}\}/gi, '<span class="cvp-footer-pages">1</span>');
  const left   = fill(cvSettings.footerLeft);
  const center = fill(cvSettings.footerCenter);
  const right  = fill(cvSettings.footerRight);
  if (!left && !center && !right) return '';
  return `<div class="cvp-footer cvp-footer-custom">
    <span class="cvp-footer-zone cvp-footer-left">${left}</span>
    <span class="cvp-footer-zone cvp-footer-center">${center}</span>
    <span class="cvp-footer-zone cvp-footer-right">${right}</span>
  </div>`;
}

function renderSectionPreview(sec, i) {
  const name  = cvData.sectionNames[i] !== undefined ? cvData.sectionNames[i] : sec.title;
  const stype = sec.type || 'custom';
  const def   = SECTION_TYPES[stype];
  let body = '';

  if (def && !def.useTextarea && sec.entries && sec.entries.length) {
    body = sec.entries.filter(e=>e.visible!==false).map(e=>renderEntryHTML(e, stype)).join('');
  } else {
    body = formatLines(sec.lines || []);
  }

  return `<div class="cvp-section" id="preview-sec-${i}">
    <div class="cvp-sec-heading">${escapeHtml(name)}</div>
    <div class="cvp-sec-content" id="preview-content-${i}">${body}</div>
  </div>`;
}

function renderEntryHTML(entry, stype) {
  const bullet = cvSettings.listStyle==='hyphen'?'–':'•';
  let html = '';

  if (stype==='profile') {
    const align = entry.summaryAlign && entry.summaryAlign!=='left' ? ` style="text-align:${entry.summaryAlign}"` : '';
    html += `<p class="cvp-line"${align}>${mdLine(entry.summary||'',true)}</p>`;
    return html;
  }

  if (stype==='work'||stype==='education'||stype==='projects'||stype==='courses'||stype==='organisations') {
    const title   = entry.jobTitle||entry.degree||entry.title||entry.course||entry.name||'';
    const sub     = entry.employer||entry.school||entry.role||entry.provider||entry.organisation||'';
    const subLink = entry.employerLink||entry.schoolLink||entry.providerLink||entry.organisationLink||'';
    const start   = formatDate(entry.startDate||entry.start||'');
    const end     = formatDate(entry.endDate||entry.end||'');
    const loc     = entry.location||'';
    const desc    = entry.desc||'';
    const descAlign = entry.descAlign && entry.descAlign!=='left' ? ` style="text-align:${entry.descAlign}"` : '';
    let dateStr   = '';
    if (start||end) {
      dateStr = [start, end].filter(Boolean).join(' – ');
      if (cvSettings.showDuration && start && end) {
        dateStr += ' ' + calcDuration(entry.startDate||entry.start||'', entry.endDate||entry.end||'');
      }
    }
    const subHtml   = subLink ? `<a href="${escapeAttr(subLink)}" target="_blank" rel="noopener">${escapeHtml(sub)}</a>` : escapeHtml(sub);
    // Row 1: job title left, date range right. Row 2: employer left, location right.
    // Keeps company/date/location as distinct fields all the way to markup,
    // instead of collapsing them into one pipe-joined flowing paragraph.
    // "Subtitle: Same Line" folds employer into row 1 next to the title
    // (its pre-existing meaning), leaving row 2 for location only.
    if (cvSettings.subtitleLine === 'same') {
      const titleHtml = [
        title ? `<span class="cvp-entry-title">${mdLine(title,true)}</span>` : '',
        sub   ? `<span class="cvp-entry-employer cvp-entry-employer-inline">${subHtml}</span>` : ''
      ].filter(Boolean).join('');
      if (titleHtml||dateStr) html += `<div class="cvp-entry-row1">
        <span>${titleHtml}</span>
        ${dateStr ? `<span class="cvp-entry-date">${escapeHtml(dateStr)}</span>` : ''}
      </div>`;
      if (loc) html += `<div class="cvp-entry-row2"><span></span><span class="cvp-entry-location">${escapeHtml(loc)}</span></div>`;
    } else {
      if (title||dateStr) html += `<div class="cvp-entry-row1">
        ${title ? `<span class="cvp-entry-title">${mdLine(title,true)}</span>` : '<span></span>'}
        ${dateStr ? `<span class="cvp-entry-date">${escapeHtml(dateStr)}</span>` : ''}
      </div>`;
      if (sub||loc) html += `<div class="cvp-entry-row2">
        ${sub ? `<span class="cvp-entry-employer">${subHtml}</span>` : '<span></span>'}
        ${loc ? `<span class="cvp-entry-location">${escapeHtml(loc)}</span>` : ''}
      </div>`;
    }
    if (desc) {
      desc.split('\n').forEach(line => {
        const t = line.trim();
        if (!t) return;
        if (/^[•–-]\s/.test(t)) {
          html += `<p class="cvp-bullet"${descAlign} style="break-inside:avoid">${bullet} ${mdLine(t.replace(/^[•–-]\s+/,''),true)}</p>`;
        } else {
          html += `<p class="cvp-line"${descAlign}>${mdLine(t,true)}</p>`;
        }
      });
    }
    return html;
  }

  if (stype==='skills') {
    const skill = entry.skill||'';
    const info  = entry.info||'';
    const level = entry.level||'';
    if (skill&&info) html += `<p class="cvp-line"><strong class="cvp-cat">${escapeHtml(skill)}:</strong> ${mdLine(info)}</p>`;
    else if (skill)  html += `<p class="cvp-line"><strong class="cvp-cat">${escapeHtml(skill)}</strong>${level?' — '+level:''}</p>`;
    return html;
  }

  if (stype==='certifications') {
    const name = entry.name||'';
    const nameLink = entry.nameLink||'';
    const nameHtml = nameLink ? `<a href="${escapeAttr(nameLink)}" target="_blank" rel="noopener">${escapeHtml(name)}</a>` : escapeHtml(name);
    const date = formatDate(entry.date||'');
    const info = entry.info||'';
    html += `<p class="cvp-line"><strong>${nameHtml}</strong>${date?' — Date: '+escapeHtml(date):''}${info?'\n'+info:''}</p>`;
    return html;
  }

  if (stype==='languages') {
    html += `<p class="cvp-line">${escapeHtml(entry.language||'')}${entry.proficiency?' — '+entry.proficiency:''}</p>`;
    return html;
  }

  if (stype==='awards'||stype==='publications'||stype==='interests') {
    const title = entry.title||entry.interest||'';
    const titleLink = entry.titleLink||entry.interestLink||'';
    const titleHtml = titleLink ? `<a href="${escapeAttr(titleLink)}" target="_blank" rel="noopener">${mdLine(title,true)}</a>` : mdLine(title,true);
    const sub   = [entry.issuer||entry.publisher, entry.date ? formatDate(entry.date) : ''].filter(Boolean).join(' — ');
    const desc  = entry.desc||'';
    const descAlign = entry.descAlign && entry.descAlign!=='left' ? ` style="text-align:${entry.descAlign}"` : '';
    if (title) html += `<p class="cvp-entry-title">${titleHtml}</p>`;
    if (sub)   html += `<p class="cvp-entry-meta">${escapeHtml(sub)}</p>`;
    if (desc)  html += `<p class="cvp-line"${descAlign}>${mdLine(desc,true)}</p>`;
    return html;
  }

  if (stype==='declaration') {
    const statement = entry.statement||'';
    const sigName   = entry.signatureName||'';
    const date      = formatDate(entry.date||'');
    if (statement) html += `<p class="cvp-line">${mdLine(statement,true)}</p>`;
    if (sigName) html += `<p class="cvp-signature">${escapeHtml(sigName)}</p>`;
    if (date) html += `<p class="cvp-entry-meta">${escapeHtml(date)}</p>`;
    return html;
  }

  if (stype==='references') {
    const nameLink = entry.nameLink||'';
    const nameHtml = nameLink ? `<a href="${escapeAttr(nameLink)}" target="_blank" rel="noopener">${escapeHtml(entry.name||'')}</a>` : escapeHtml(entry.name||'');
    html += `<p class="cvp-entry-title">${nameHtml}</p>`;
    if (entry.position||entry.company) html += `<p class="cvp-entry-meta">${escapeHtml([entry.position,entry.company].filter(Boolean).join(', '))}</p>`;
    if (entry.email||entry.phone) html += `<p class="cvp-line">${escapeHtml([entry.email,entry.phone].filter(Boolean).join(' | '))}</p>`;
    return html;
  }

  // Generic fallback
  return `<p class="cvp-line">${escapeHtml(JSON.stringify(entry))}</p>`;
}

/* ============================================================
   DATE / DURATION HELPERS
   ============================================================ */
const MONTH_MAP = {jan:'January',feb:'February',mar:'March',apr:'April',may:'May',jun:'June',jul:'July',aug:'August',sep:'September',oct:'October',nov:'November',dec:'December'};
const MONTH_NUM = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
const MONTH_ABBR = {jan:'Jan',feb:'Feb',mar:'Mar',apr:'Apr',may:'May',jun:'Jun',jul:'Jul',aug:'Aug',sep:'Sep',oct:'Oct',nov:'Nov',dec:'Dec'};

// Shared by both match branches below: render a month/year pair once the
// 3-letter abbreviation and year are known, for any supported dateFormat.
function formatMonthYear(abbr, year, fallback) {
  const fmt = cvSettings.dateFormat || 'Month YYYY';
  if (fmt === 'Month YYYY') return `${MONTH_MAP[abbr] || fallback} ${year}`;
  if (fmt === 'Mon YYYY')   return `${MONTH_ABBR[abbr] || fallback} ${year}`;
  if (fmt === 'MM/YYYY')    return `${MONTH_NUM[abbr] || '01'}/${year}`;
  if (fmt === 'MM.YYYY')    return `${MONTH_NUM[abbr] || '01'}.${year}`;
  if (fmt === 'YYYY')       return year;
  return fallback ? `${fallback} ${year}` : year;
}

/* Format a single date string ("Jan 2020", "January 2020", "2020", "Present")
   according to cvSettings.dateFormat: 'Month YYYY' | 'Mon YYYY' | 'MM/YYYY' | 'MM.YYYY' | 'YYYY' */
function formatDate(str) {
  if (!str) return '';
  const clean = str.trim();
  if (/^present$/i.test(clean)) return 'Present';

  // "Jan 2020" / "January 2020"
  const mY = clean.match(/^(\w{3,9})\s+(\d{4})$/i);
  if (mY) {
    const abbr = mY[1].slice(0,3).toLowerCase();
    return formatMonthYear(abbr, mY[2], mY[1]);
  }

  // "2020-01" / "2020-1"
  const yM = clean.match(/^(\d{4})-(\d{1,2})$/);
  if (yM) {
    const year = yM[1], mon = yM[2].padStart(2,'0');
    const abbr = Object.keys(MONTH_NUM).find(k => MONTH_NUM[k] === mon);
    return formatMonthYear(abbr, year, mon);
  }

  // Plain year only — nothing to convert for Month/MM formats, just return as-is
  if (/^\d{4}$/.test(clean)) return clean;

  return clean;
}

function parseDateToMs(s) {
  if(!s||/^present$/i.test(s.trim())) return Date.now();
  const c=s.trim();
  const mY=c.match(/^(\w{3,9})\s+(\d{4})$/i);
  if(mY){ const a=mY[1].slice(0,3).toLowerCase(); return new Date(parseInt(mY[2]),parseInt(MONTH_NUM[a]||'1',10)-1).getTime(); }
  const y=c.match(/^(\d{4})$/); if(y) return new Date(parseInt(y[1]),0).getTime();
  return 0;
}

function calcDuration(start,end) {
  const ms=parseDateToMs(end)-parseDateToMs(start);
  if(ms<=0) return '';
  const m=Math.round(ms/(1000*60*60*24*30.44));
  const yr=Math.floor(m/12), mo=m%12;
  const p=[];
  if(yr) p.push(`${yr} yr${yr>1?'s':''}`);
  if(mo) p.push(`${mo} mo${mo>1?'s':''}`);
  return p.length?`· ${p.join(' ')}`:'' ;
}

/* ============================================================
   formatLines (for textarea / custom sections)
   ============================================================ */
function formatLines(lines) {
  const bullet = cvSettings.listStyle==='hyphen'?'–':'•';
  const result = [];
  for(let i=0;i<lines.length;i++){
    const t=lines[i].trim();
    if(!t){result.push('<div class="cvp-gap"></div>');continue;}
    if(/^[•–]\s/.test(t)||/^-\s/.test(t)){ result.push(`<p class="cvp-bullet" style="break-inside:avoid">${bullet} ${mdLine(t.replace(/^[•–-]\s+/,''))}</p>`); continue; }
    if(t.includes(' | ')&&/(Present|\d{4})/i.test(t)){ result.push(`<p class="cvp-entry-meta">${escapeHtml(t)}</p>`); continue; }
    const next=(lines[i+1]||'').trim();
    if(next.includes(' | ')&&/(Present|\d{4})/i.test(next)){ result.push(`<p class="cvp-entry-title">${mdLine(t)}</p>`); continue; }
    const cat=t.match(/^([^:•|–-]{2,50}):\s+(.+)$/);
    if(cat&&!/^\d/.test(cat[1])){ result.push(`<p class="cvp-line"><strong class="cvp-cat">${escapeHtml(cat[1])}:</strong> ${mdLine(cat[2])}</p>`); continue; }
    result.push(`<p class="cvp-line">${mdLine(t)}</p>`);
  }
  return result.join('');
}

function mdLine(text, force) {
  if(!cvSettings.useMarkdown && !force) return escapeHtml(text||'');
  return (text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
      const safeUrl = url.replace(/"/g, '&quot;');
      return `<a href="${safeUrl}" target="_blank" rel="noopener">${label}</a>`;
    })
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/__(.+?)__/g,'<u>$1</u>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`(.+?)`/g,'<code>$1</code>');
}

/* ============================================================
   UPDATE HANDLERS
   ============================================================ */
function updateHeader(field, value) {
  cvData.parsed.header[field] = value;
  if (field === 'name' && value.trim()) {
    cvData.name = value.trim();
    cvNameDisplay.textContent = cvData.name;
    document.title = `CAS CV Builder — ${cvData.name}`;
  }
  renderRightPanel();
  scheduleSave();
}

// Under real pagination, a section's fast single-node preview patch
// (targeting a specific preview-content-N element by id) is only safe
// while that section fits on one page — once it spans pages, only one
// of its page fragments can keep that id, so the other silently goes
// stale. Debounced instead of instant: typing can also grow a
// currently-single-page section past the boundary mid-keystroke, so
// this reconciliation pass runs after every edit in paginated mode,
// not just when a section is already known to span pages.
let _repaginateTimeout = null;
function scheduleRepaginate() {
  clearTimeout(_repaginateTimeout);
  _repaginateTimeout = setTimeout(renderRightPanel, 200);
}

function updateSection(index, value) {
  cvData.parsed.sections[index].lines = value.split('\n');
  if (isPaginatedLayout() && _paginationMultiPageSections.has(index)) {
    scheduleRepaginate();
  } else {
    const el = document.getElementById(`preview-content-${index}`);
    if (el) el.innerHTML = formatLines(cvData.parsed.sections[index].lines);
    if (isPaginatedLayout()) scheduleRepaginate();
  }
  scheduleSave();
}

function renameSectionHandler(index, name) {
  cvData.sectionNames[index] = name;
  cvData.parsed.sections[index].title = name;
  if (isPaginatedLayout() && _paginationMultiPageSections.has(index)) {
    scheduleRepaginate();
  } else {
    const h = document.getElementById(`preview-sec-${index}`)?.querySelector('.cvp-sec-heading');
    if (h) h.textContent = name;
    if (isPaginatedLayout()) scheduleRepaginate();
  }
  scheduleSave();
}

function toggleFieldVisibility(key) {
  cvData.hiddenFields[key] = !cvData.hiddenFields[key];
  renderEditPanel(); renderRightPanel(); scheduleSave();
}

function assignColumn(index, col) {
  cvData.columnAssign[index] = col;
  renderEditPanel(); renderRightPanel(); scheduleSave();
}

function deleteSection(index) {
  if (!confirm('Delete this section?')) return;
  cvData.parsed.sections.splice(index,1);
  const remap = obj => {
    const out={};
    Object.entries(obj).forEach(([k,v])=>{ const ki=parseInt(k); if(ki>index) out[ki-1]=v; else if(ki<index) out[ki]=v; });
    return out;
  };
  cvData.columnAssign=remap(cvData.columnAssign);
  cvData.sectionNames=remap(cvData.sectionNames);
  cvData.sectionWidth=remap(cvData.sectionWidth);
  renderEditPanel(); renderRightPanel(); scheduleSave();
}

function markPresent(sectionIdx) {
  const section=cvData.parsed.sections[sectionIdx];
  if (section.entries && section.entries.length) {
    const last = section.entries[section.entries.length-1];
    if (last.endDate !== undefined) last.endDate='Present';
    else if (last.end !== undefined) last.end='Present';
    renderEditPanel(); renderRightPanel(); scheduleSave();
    return;
  }
  const ta=document.getElementById(`section-ta-${sectionIdx}`);
  if(!ta) return;
  const re=/(\w{3,9}\s+\d{4}|\d{4})\s*[–—-]\s*(?!Present)(\w{3,9}\s+\d{4}|\d{4})/gi;
  let lastMatch=null,lastIdx=-1,m;
  const re2=new RegExp(re.source,'gi');
  while((m=re2.exec(ta.value))!==null){lastMatch=m;lastIdx=m.index;}
  if(lastMatch){ ta.value=ta.value.slice(0,lastIdx)+lastMatch[1]+' – Present'+ta.value.slice(lastIdx+lastMatch[0].length); updateSection(sectionIdx,ta.value); }
  else alert('No date range found to mark as Present.');
}

/* ============================================================
   DRAG-TO-REORDER SECTIONS
   ============================================================ */
let dragSrcIdx=null, dragOverIdx=null;
function onDragStart(e,idx){ dragSrcIdx=idx; e.dataTransfer.effectAllowed='move'; setTimeout(()=>document.getElementById(`acc-${idx}`)?.classList.add('dragging'),0); }
function onDragOver(e,idx){ e.preventDefault(); if(idx===dragOverIdx)return; dragOverIdx=idx; document.querySelectorAll('.sec-accordion').forEach(el=>el.classList.remove('drag-over')); if(idx!==dragSrcIdx)document.getElementById(`acc-${idx}`)?.classList.add('drag-over'); }
function onDrop(e,idx){
  e.preventDefault(); if(dragSrcIdx===null||dragSrcIdx===idx)return;
  const secs=cvData.parsed.sections; const[moved]=secs.splice(dragSrcIdx,1); secs.splice(idx,0,moved);
  const remap=obj=>{ const out={}; Object.entries(obj).forEach(([k,v])=>{ let nk=parseInt(k); if(nk===dragSrcIdx)nk=idx; else if(dragSrcIdx<idx&&nk>dragSrcIdx&&nk<=idx)nk=nk-1; else if(dragSrcIdx>idx&&nk>=idx&&nk<dragSrcIdx)nk=nk+1; out[nk]=v; }); return out; };
  cvData.columnAssign=remap(cvData.columnAssign); cvData.sectionNames=remap(cvData.sectionNames); cvData.sectionWidth=remap(cvData.sectionWidth);
  dragSrcIdx=null; dragOverIdx=null; renderEditPanel(); renderRightPanel(); scheduleSave();
}
function onDragEnd(){ dragSrcIdx=null; dragOverIdx=null; document.querySelectorAll('.sec-accordion').forEach(el=>el.classList.remove('dragging','drag-over')); }

/* ============================================================
   ACCORDION
   ============================================================ */
function toggleAccordion(id) {
  const hdr=document.querySelector(`#acc-${id} .accordion-header`);
  const body=document.getElementById(`body-${id}`);
  if(!hdr||!body)return;
  const open=hdr.classList.contains('open');
  hdr.classList.toggle('open',!open); body.classList.toggle('collapsed',open);
}
function autoResize(el){ el.style.height='auto'; el.style.height=Math.max(el.scrollHeight,80)+'px'; }

/* ============================================================
   REIMPORT
   ============================================================ */
reimportBtn.addEventListener('click',()=>{ reimportText.value=''; reimportError.textContent=''; reimportOverlay.classList.add('active'); document.body.style.overflow='hidden'; });
function closeReimport(){ reimportOverlay.classList.remove('active'); document.body.style.overflow=''; }
reimportClose.addEventListener('click',closeReimport);
reimportOverlay.addEventListener('click',e=>{ if(e.target===reimportOverlay)closeReimport(); });
reimportConfirm.addEventListener('click',()=>{
  const text=reimportText.value.trim(); reimportError.textContent='';
  if(!text){reimportError.textContent='Please paste the updated CV text.';return;}
  if(text.length<100){reimportError.textContent='Text looks too short. Paste the full CV.';return;}
  const parsed=parseCV(text); smartMigrate(parsed.sections); cvData.parsed=parsed; cvData.raw=text; cvData.updatedAt=new Date().toISOString();
  renderEditPanel(); renderRightPanel(); closeReimport(); persistSave();
});

/* ============================================================
   SAVE
   ============================================================ */
let saveTimeout=null;
function scheduleSave(){ saveIndicator.textContent='Saving…'; saveIndicator.className='save-indicator saving'; clearTimeout(saveTimeout); saveTimeout=setTimeout(persistSave,800); scheduleHistoryCheckpoint(); }
async function persistSave(){
  cvData.settings=cvSettings; cvData.updatedAt=new Date().toISOString();
  try{
    const CVStore = await window.cvStoreReady;
    await CVStore.save(cvData);
    saveIndicator.textContent='Saved'; saveIndicator.className='save-indicator saved';
  }catch{ saveIndicator.textContent='Save failed'; saveIndicator.className='save-indicator error'; }
}

/* ============================================================
   UNDO / REDO
   Every mutation in the app already funnels through scheduleSave()
   (called from every field edit, drag-reorder, setting change, etc.),
   so that's the one place a history checkpoint needs to be hooked in,
   rather than touching every individual mutation site. Checkpoints are
   debounced the same way autosave is, so a burst of typing becomes one
   undo step instead of one per keystroke.
   ============================================================ */
let undoStack = [];
let redoStack = [];
let historyTimeout = null;
let restoringHistory = false;
const MAX_HISTORY = 50;

function snapshotState() {
  // Exclude updatedAt and settings: persistSave() rewrites updatedAt on
  // every autosave tick and copies the live cvSettings into cvData.settings
  // (redundant here since cvSettings is already captured below), both
  // asynchronously after a checkpoint is taken. Leaving them in would drift
  // the live state away from an already-taken snapshot purely from a save
  // completing in the background, defeating the no-op dedup check.
  const { updatedAt, settings, ...cvDataForHistory } = cvData;
  return JSON.stringify({ cvData: cvDataForHistory, cvSettings });
}

function pushHistoryCheckpoint() {
  if (restoringHistory) return;
  const snap = snapshotState();
  if (undoStack.length && undoStack[undoStack.length - 1] === snap) return;
  undoStack.push(snap);
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateUndoRedoButtons();
}
function scheduleHistoryCheckpoint() { clearTimeout(historyTimeout); historyTimeout = setTimeout(pushHistoryCheckpoint, 600); }
function updateUndoRedoButtons() {
  undoBtn.disabled = undoStack.length < 2;
  redoBtn.disabled = redoStack.length === 0;
}
function restoreSnapshot(snap) {
  const state = JSON.parse(snap);
  restoringHistory = true;
  cvData = state.cvData;
  cvSettings = state.cvSettings;
  renderEditPanel(); renderCustomizePanel(); renderRightPanel();
  restoringHistory = false;
  updateUndoRedoButtons();
  scheduleSave();
}
function undo() {
  clearTimeout(historyTimeout);
  pushHistoryCheckpoint();
  if (undoStack.length < 2) return;
  redoStack.push(undoStack.pop());
  restoreSnapshot(undoStack[undoStack.length - 1]);
}
function redo() {
  if (!redoStack.length) return;
  const snap = redoStack.pop();
  undoStack.push(snap);
  restoreSnapshot(snap);
}
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
document.addEventListener('keydown', (e) => {
  const t = document.activeElement.tagName;
  if (t === 'INPUT' || t === 'TEXTAREA' || document.activeElement.isContentEditable) return;
  if (!(e.ctrlKey || e.metaKey)) return;
  const key = e.key.toLowerCase();
  if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  else if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
});

/* ============================================================
   HELPERS
   ============================================================ */
function escapeHtml(s){ const d=document.createElement('div'); d.appendChild(document.createTextNode(s||'')); return d.innerHTML; }
function escapeAttr(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ============================================================
   BOOT
   ============================================================ */
function migrateHeader(){
  const h = cvData.parsed.header;
  if (h.contact && !h.email && !h.phone && !h.location) {
    const parts = h.contact.split('|').map(p=>p.trim()).filter(Boolean);
    parts.forEach(p=>{
      if (!h.email    && /@/.test(p))                    h.email    = p;
      else if (!h.phone    && /[\d\s+()-]{7,}/.test(p)) h.phone    = p;
      else if (!h.location && !h.phone && !/@/.test(p)) h.location = p;
    });
  }
}

/* ============================================================
   AUTO-FIT ZOOM — keeps the CV paper fully visible and centered
   regardless of how wide the left panel is dragged. Uses CSS
   `zoom` (affects layout size, not just visual transform) so the
   container's scroll height shrinks proportionally too.

   NOTE: browsers differ on whether `zoom` reflows the element's
   own contribution to its flex parent's layout. To keep centering
   correct either way, we explicitly set the wrap's inline width to
   match its true post-zoom visual footprint — the flex parent's
   justify-content:center then always centers the right amount of
   space, regardless of zoom's reflow behavior in a given browser.
   ============================================================ */
function fitPaperZoom() {
  const wrap  = document.getElementById('cvPaperWrap');
  const right = document.getElementById('editorRight');
  if (!wrap || !right) return;

  wrap.style.zoom  = 1;   // reset first so we measure the true natural width
  wrap.style.width = '';  // fall back to CSS width: min(660px, 100%)
  const availW   = right.clientWidth;   // .editor-right has no horizontal padding
  const naturalW = wrap.scrollWidth || wrap.offsetWidth;

  if (naturalW > availW && availW > 50) {
    const scale = Math.max(0.35, Math.min(1, availW / naturalW));
    wrap.style.zoom  = scale;
    wrap.style.width = Math.round(naturalW * scale) + 'px';
  } else {
    wrap.style.zoom  = 1;
    wrap.style.width = '';
  }
}

let _zoomRaf = null;
function scheduleFitZoom() {
  if (_zoomRaf) cancelAnimationFrame(_zoomRaf);
  _zoomRaf = requestAnimationFrame(fitPaperZoom);
}

window.addEventListener('resize', scheduleFitZoom);

/* ============================================================
   RESIZABLE PANEL DIVIDER
   ============================================================ */
(function initPanelResize() {
  const handle = document.getElementById('panelResizeHandle');
  if (!handle) return;

  const MIN_WIDTH = 300, MAX_WIDTH = 640;
  const saved = parseInt(localStorage.getItem('cas_editor_panel_width'), 10);
  if (saved && saved >= MIN_WIDTH && saved <= MAX_WIDTH) {
    document.documentElement.style.setProperty('--editor-left-width', saved + 'px');
  }

  let dragging = false;

  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    handle.classList.add('resizing');
    document.body.classList.add('panel-resizing');
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const editorLeft = document.querySelector('.editor-left');
    if (!editorLeft) return;
    const rect = editorLeft.getBoundingClientRect();
    let newWidth = e.clientX - rect.left;
    newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
    document.documentElement.style.setProperty('--editor-left-width', newWidth + 'px');
    scheduleFitZoom();
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('resizing');
    document.body.classList.remove('panel-resizing');
    const widthPx = getComputedStyle(document.documentElement).getPropertyValue('--editor-left-width').trim();
    const widthNum = parseInt(widthPx, 10);
    if (widthNum) localStorage.setItem('cas_editor_panel_width', widthNum);
    scheduleFitZoom();
    requestAnimationFrame(updatePageBreaks);
  });
})();

async function initEditor() {
  try {
    const CVStore = await window.cvStoreReady;
    await CVStore.migrateIfNeeded();
    cvData = await CVStore.getById(cvId);
  } catch {
    cvData = null;
  }

  if (!cvData) { window.location.replace('dashboard.html'); return; }

  cvData.columnAssign = cvData.columnAssign || {};
  cvData.hiddenFields = cvData.hiddenFields || {};
  cvData.sectionNames = cvData.sectionNames || {};
  cvData.sectionWidth = cvData.sectionWidth || {};
  cvData.headerFieldOrder = cvData.headerFieldOrder || ['email','phone','location','linkedin'];

  cvSettings = Object.assign({}, DEFAULTS, cvData.settings || {});

  document.title = `CAS CV Builder — ${cvData.name}`;
  cvNameDisplay.textContent = cvData.name;

  migrateHeader();
  smartMigrate(cvData.parsed.sections);

  downloadBtn.disabled = false;
  reimportBtn.disabled = false;

  renderEditPanel();
  renderCustomizePanel();
  renderRightPanel();
  scheduleFitZoom();

  pushHistoryCheckpoint();
}

initEditor();

