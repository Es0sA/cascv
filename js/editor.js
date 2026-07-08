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

// Custom Section field sets for the "Normal" and "Skill" subtypes —
// see getSectionDef(). Mirrors Projects (Normal) and Skills (Skill)
// so structured custom sections get the exact same rich entry-editor
// UI those already have, no new rendering paths needed.
const CUSTOM_NORMAL_FIELDS = [
  { key:'title',     label:'Title',        type:'text', linkable:true },
  { key:'subtitle',  label:'Subtitle',     type:'text' },
  { key:'startDate', label:'Start Date',   type:'text', clearable:true },
  { key:'endDate',   label:'End Date',     type:'text', allowPresent:true, clearable:true },
  { key:'location',  label:'Location',     type:'text' },
  { key:'desc',      label:'Description',  type:'textarea', placeholder:'Details...', allowAlign:true }
];
const CUSTOM_SKILL_FIELDS = [
  { key:'skill', label:'Skill / Category',  type:'text' },
  { key:'info',  label:'Sub-skills / Info', type:'textarea', placeholder:'Specific skills, tools, methods...' },
  { key:'level', label:'Skill Level', type:'select', options: ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] }
];
const CUSTOM_SECTION_ICONS = ['✏️','🎯','🛠️','💡','📌','🔖','📊','🎨','🎵','⚡','🌟','🔧','📱','💻','🎬','🏋️','🌍','🚀','🏆','📚','🏢','👥','🏅','🧠'];

// Single source of truth for "what field set / icon does this section
// actually use right now" — every renderer should call this instead of
// indexing SECTION_TYPES directly, so a Custom Section's subtype
// override (see cvData.customSectionType) is respected everywhere.
// Falls back to the plain freeform-textarea behavior when no override
// is set, which is exactly what every existing CV already has, so
// nothing changes for CVs that never touch this new setting.
// Maps a Custom Section's subtype to the stype string renderEntryHTML
// actually branches on — 'custom-normal' is handled identically to
// 'projects', 'custom-skill' identically to 'skills' (see
// renderEntryHTML). Every other section type is unaffected.
function getEffectiveStype(sec, i) {
  const stype = sec.type || 'custom';
  if (stype === 'custom') {
    const subtype = cvData.customSectionType[i];
    if (subtype === 'normal') return 'custom-normal';
    if (subtype === 'skill')  return 'custom-skill';
  }
  return stype;
}

function getSectionDef(sec, i) {
  const stype = sec.type || 'custom';
  const baseDef = SECTION_TYPES[stype] || SECTION_TYPES.custom;
  if (stype === 'custom') {
    const subtype = cvData.customSectionType[i];
    const icon = cvData.customSectionIcon[i] || baseDef.icon;
    if (subtype === 'normal') return { label: baseDef.label, icon, fields: CUSTOM_NORMAL_FIELDS, useTextarea: false };
    if (subtype === 'skill')  return { label: baseDef.label, icon, fields: CUSTOM_SKILL_FIELDS,  useTextarea: false };
    return { ...baseDef, icon };
  }
  return baseDef;
}

/* ---- DEFAULTS ---- */
const DEFAULTS = {
  template:'classic', columns:1, twoColWidth:32, headerAlign:'left', headerPosition:'top',
  subtitleLine:'next', paperFormat:'A4', bodyFont:'Calibri, Arial, sans-serif',
  nameFont:'inherit', baseFontSize:11, nameFontSize:19, titleFontSize:12,
  headingFontSize:10, entryFontSize:11, lineHeight:1.55, letterSpacing:0,
  sectionSpacing:11, marginLR:13, marginTB:11, headingStyle:'underline',
  headingCase:'upper', subtitleStyle:'normal', dateStyle:'normal', locationStyle:'normal', listStyle:'bullet',
  dateFormat:'Month YYYY', showDuration:false, skillStyle:'text',
  accentColor:'#1a1a1a', colorBg:'#ffffff',
  colorSidebarBg:'#f0f4f8', colorText:'#1a1a1a', accentName:false,
  accentTitle:false, accentHeadings:true, accentLine:true, accentDates:false,
  accentSubtitle:false, showPageNums:false, linkStyle:'underline',
  footerCustom:false, footerLeft:'', footerCenter:'', footerRight:'',
  iconStyle:'none', accentIcons:false, accentLinkIcons:false,
  workTitleOrder:'normal', eduTitleOrder:'normal', summaryInHeader:false,
  photoShape:'circle', photoZoom:1,
};

// Real values get merged in with cvData.settings once initEditor()
// has fetched the CV; DEFAULTS alone is just a safe placeholder for
// the brief window before that.
let cvSettings = Object.assign({}, DEFAULTS);

// Google Fonts (linked in editor.html's <head>) load lazily: the browser
// doesn't fetch the actual font file until something on the page tries
// to paint text in it, and that fetch is async and network-dependent.
// Both the live-preview pagination (measureAndPaginate's hidden probe)
// and the PDF export (html2canvas capture) measure/rasterize text
// height synchronously, with no wait for that fetch to finish. If the
// real font hasn't swapped in yet, they measure/capture using the
// fallback font's metrics instead, which are a different width and
// line-height, silently producing a different page-break point than
// once the real font loads, on a total race depending on network/cache
// timing. This is what caused a CV's page count to change between
// refreshes, and why a PDF downloaded on a slower mobile connection
// could come out in a completely different (fallback) font than the
// on-screen preview showed. Call this and await it before any
// measurement or capture step; it resolves immediately once the fonts
// are already loaded, so it's a no-op cost on repeat calls.
async function ensureFontsReady() {
  if (!(document.fonts && document.fonts.load)) return;
  const stacks = [cvSettings.bodyFont, cvSettings.nameFont].filter(f => f && f !== 'inherit');
  const specs = [];
  stacks.forEach(stack => {
    specs.push(`400 16px ${stack}`, `700 16px ${stack}`, `italic 400 16px ${stack}`);
  });
  try {
    await Promise.all(specs.map(spec => document.fonts.load(spec).catch(() => {})));
    await document.fonts.ready;
  } catch { /* best-effort; fall through and render with whatever's loaded */ }
}

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
const mobilePreviewFab      = document.getElementById('mobilePreviewFab');
const mobilePreviewModal    = document.getElementById('mobilePreviewModal');
const mobilePreviewClose    = document.getElementById('mobilePreviewClose');
const mobilePreviewBody     = document.getElementById('mobilePreviewBody');
const mobilePreviewDownload = document.getElementById('mobilePreviewDownload');

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
   preview can be CSS-zoomed down by fitPaperZoom() to fit a narrow
   panel, and capturing it directly at that shrunk size caused a
   width/page-height mismatch against html2pdf's mm-based page slicing.

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
    // Re-confirm fonts are actually loaded before capturing, not just
    // relying on the preview having already loaded them earlier in the
    // session — a slower connection (mobile data especially) can still
    // be mid-fetch, and capturing then bakes the fallback font into the
    // downloaded file even though the on-screen preview looks fine.
    await ensureFontsReady();
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
      ${renderPhotoField(header)}
      ${hdrField('name',     'Full Name',           header.name,     'text')}
      ${hdrField('jobTitle', 'Job Title / Tagline',  header.jobTitle, 'text')}
      ${renderContactFields(header)}
      ${hdrField('contact',  'Other Contact / Line', header.contact  || '', 'text',
        'Fallback line shown if email/phone/location fields above are empty.')}
    </div>
  </div>`;

  /* Section cards — wrapped in their own container (rather than left
     as direct siblings of the header card and the Add Content button
     inside #sectionsContainer) so the section-reorder Sortable
     instance only ever sees section cards as its items; otherwise
     dragging a section above the header or below Add Content would
     shift those into the same index space and throw off
     reorderSections' index math. */
  html += `<div id="sectionsList">`;
  sections.forEach((section, i) => {
    const name     = cvData.sectionNames[i] !== undefined ? cvData.sectionNames[i] : section.title;
    const assign   = cvData.columnAssign[i] || 'main';
    const showCols = Number(cvSettings.columns) === 2;
    const stype    = section.type || 'custom';
    const def      = getSectionDef(section, i);

    html += `
  <div class="accordion sec-accordion" id="acc-${i}">
    <button class="accordion-header open" onclick="toggleAccordion(${i})" type="button">
      <div class="accordion-title-row">
        <span class="drag-handle" onclick="event.stopPropagation()">⠿</span>
        <span class="accordion-index">${i + 1}</span>
        <input class="accordion-rename" type="text" value="${escapeAttr(name)}"
               onclick="event.stopPropagation()" onkeydown="event.stopPropagation()"
               oninput="event.stopPropagation();renameSectionHandler(${i},this.value)">
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
      ${stype==='custom' ? renderCustomSectionControls(section, i) : ''}
      ${def.useTextarea ? renderTextareaSection(section, i) : renderStructuredSection(section, i, def)}
      <div class="section-actions">
        ${getSectionDateKeys(def) && (section.entries || []).length > 1 ? `
        <button class="sec-action-btn" onclick="sortEntriesByDate(${i})" type="button" title="Reorder entries so the most recent (or current) comes first">📅 Sort by Date</button>` : ''}
        <button class="sec-action-btn sec-action-danger" onclick="deleteSection(${i})" type="button">🗑 Delete</button>
      </div>
    </div>
  </div>`;
  });
  html += `</div>`; // close #sectionsList

  /* Add Content button */
  html += `
  <div class="add-section-wrap">
    <button class="add-section-btn" onclick="openAddContent()" type="button">+ Add Content</button>
  </div>`;

  sectionsContainer.innerHTML = html;
  requestAnimationFrame(() => document.querySelectorAll('.acc-textarea').forEach(autoResize));
  if (scrollEl) scrollEl.scrollTop = savedTop;
  initSectionsSortable();
  initEntrySortables();
}

function renderTextareaSection(section, i) {
  return `<textarea class="acc-textarea" id="section-ta-${i}" data-section="${i}"
      oninput="updateSection(${i},this.value);autoResize(this)"
    >${escapeHtml((section.lines || []).join('\n'))}</textarea>`;
}

// Custom Section-only controls: an icon picker, and a Text/Normal/
// Skill type toggle. Normal reuses the exact Projects-style structured
// entry form (title/subtitle/dates/location/description); Skill reuses
// the Skills form (skill/sub-skills/level) — see getSectionDef().
function renderCustomSectionControls(section, i) {
  const subtype = cvData.customSectionType[i] || 'text';
  const icon = cvData.customSectionIcon[i] || '✏️';
  const iconOptions = CUSTOM_SECTION_ICONS.map(ic =>
    `<button class="icon-pick-btn ${ic===icon?'active':''}" onclick="setCustomSectionIcon(${i},'${ic}')" type="button">${ic}</button>`
  ).join('');
  return `
    <div class="custom-section-controls">
      <div class="acc-label-row"><label class="acc-label">Icon</label></div>
      <div class="icon-picker-grid">${iconOptions}</div>
      <div class="acc-label-row" style="margin-top:10px"><label class="acc-label">Section Type</label></div>
      <div class="toggle-group">
        <button class="toggle-btn ${subtype==='text'?'active':''}"   onclick="setCustomSectionType(${i},'text')"   type="button">Text</button>
        <button class="toggle-btn ${subtype==='normal'?'active':''}" onclick="setCustomSectionType(${i},'normal')" type="button">Normal</button>
        <button class="toggle-btn ${subtype==='skill'?'active':''}"  onclick="setCustomSectionType(${i},'skill')"  type="button">Skill</button>
      </div>
      <p class="acc-hint">Normal gives structured Title/Subtitle/Dates/Description fields (like Projects). Skill gives Skill/Sub-skills/Level fields (like Core Skills).</p>
    </div>`;
}

function setCustomSectionIcon(i, icon) {
  cvData.customSectionIcon[i] = icon;
  renderEditPanel();
  renderRightPanel();
  scheduleSave();
}

function setCustomSectionType(i, subtype) {
  const current = cvData.customSectionType[i] || 'text';
  if (current === subtype) return;
  const section = cvData.parsed.sections[i];
  const hasContent = (section.lines && section.lines.some(l => l.trim())) || (section.entries && section.entries.length);
  if (hasContent && !confirm("Switching this section's type will clear its current content. Continue?")) return;
  cvData.customSectionType[i] = subtype;
  section.entries = [];
  section.lines = [];
  renderEditPanel();
  renderRightPanel();
  scheduleSave();
}

function renderStructuredSection(section, i, def) {
  const entries = section.entries || [];
  if (!entries.length) {
    return `<div class="entry-empty">No entries yet.</div>
    <div class="entry-add-row">
      <button class="entry-add-btn" onclick="addEntry(${i})" type="button">+ Add Entry</button>
    </div>`;
  }
  let html = `<div class="entry-list" data-section-index="${i}">`;
  entries.forEach((entry, ei) => {
    const preview = entryPreviewLabel(entry, def);
    const visible = entry.visible !== false;
    html += `
    <div class="entry-card ${!visible?'entry-hidden':''}">
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

/* ---- Header photo: stored as a resized/compressed data URL directly
   on cvData.parsed.header.photo (small enough to stay well under
   Firestore's 1MB document limit — see resizeImageToDataUrl). ---- */
function renderPhotoField(header) {
  const hidden = cvData.hiddenFields['photo'];
  const hasPhoto = !!header.photo;
  return `
    <div class="acc-field-group ${hidden ? 'field-hidden' : ''}">
      <div class="acc-label-row">
        <label class="acc-label">Photo</label>
        ${hasPhoto ? `<button class="field-visibility-btn" onclick="toggleFieldVisibility('photo')" type="button" title="${hidden?'Show':'Hide'} field">
          ${hidden
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
          }
        </button>` : ''}
      </div>
      <div class="photo-upload-row">
        ${hasPhoto ? `<img class="photo-preview" src="${escapeAttr(header.photo)}" alt="Photo preview">` : ''}
        <label class="photo-upload-btn">
          ${hasPhoto ? 'Change' : '+ Upload Photo'}
          <input type="file" accept="image/*" style="display:none" onchange="handlePhotoUpload(this)">
        </label>
        ${hasPhoto ? `<button class="photo-remove-btn" onclick="removePhoto()" type="button">Remove</button>` : ''}
      </div>
    </div>`;
}

// Downscales + JPEG-compresses an uploaded image client-side before
// storing it as a data URL — keeps CV documents well under Firestore's
// 1MB limit regardless of the original photo's size.
function resizeImageToDataUrl(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; } }
        else { if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; } }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handlePhotoUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  try {
    const dataUrl = await resizeImageToDataUrl(file, 320, 0.82);
    cvData.parsed.header.photo = dataUrl;
    renderEditPanel();
    renderRightPanel();
    renderCustomizePanel();
    scheduleSave();
  } catch {
    alert('Could not process that image. Please try a different file.');
  }
}

function removePhoto() {
  delete cvData.parsed.header.photo;
  renderEditPanel();
  renderRightPanel();
  renderCustomizePanel();
  scheduleSave();
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
  email:          { label: 'Email',            type: 'email', icon: '✉' },
  phone:          { label: 'Phone',             type: 'text',  icon: '☎' },
  location:       { label: 'Location',          type: 'text',  icon: '📍' },
  linkedin:       { label: 'LinkedIn URL',      type: 'text',  icon: 'in' },
  website:        { label: 'Website',           type: 'text',  icon: '🌐' },
  portfolio:      { label: 'Portfolio URL',     type: 'text',  icon: '🎨' },
  github:         { label: 'GitHub',            type: 'text',  icon: '⌥' },
  twitter:        { label: 'Twitter / X',       type: 'text',  icon: '𝕏' },
  nationality:    { label: 'Nationality',       type: 'text',  icon: '🌍' },
  dob:            { label: 'Date of Birth',     type: 'text',  icon: '🎂' },
  visaStatus:     { label: 'Visa Status',       type: 'text',  icon: '🛂' },
  availability:   { label: 'Availability',      type: 'text',  icon: '📅' },
  drivingLicense: { label: 'Driving License',   type: 'text',  icon: '🚗' },
  maritalStatus:  { label: 'Marital Status',    type: 'text',  icon: '💍' },
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

// Builds the .cvp-contact inner HTML: plain pipe-joined text when
// Icon Style is "none" (the long-standing default, so existing CVs
// don't change appearance unless the user opts in), or an icon+text
// span per field otherwise. Shared by buildCVHTML (fallback layout)
// and buildLayoutUnits (real-pagination layout) so both stay in sync.
// Finds the Professional Summary section's text, for "Summary as part
// of header" — returns '' if there's no profile-type section or it's
// empty, so callers can just check truthiness.
function getSummaryHtml(sections) {
  const profileSec = sections.find(s => (s.type || 'custom') === 'profile');
  const text = profileSec?.entries?.[0]?.summary || '';
  return text ? `<div class="cvp-header-summary">${mdLine(text)}</div>` : '';
}

// Photo frame shape (circle/rounded/square) is a CSS class on the frame;
// zoom is a CSS custom property read by the img inside it, so it applies
// identically whether the photo lives on #cvPaper (fallback layout) or
// gets copied per .cv-page (real pagination) — see applyStyleProps.
function buildPhotoHtml(header) {
  if (!header.photo || cvData.hiddenFields['photo']) return '';
  const shape = cvSettings.photoShape || 'circle';
  return `<div class="cvp-photo-frame cvp-photo-${shape}"><img class="cvp-photo" src="${escapeAttr(header.photo)}" alt=""></div>`;
}

function buildContactHtml(header) {
  const order = cvData.headerFieldOrder.filter(key => !cvData.hiddenFields[key] && header[key]);
  if (!order.length) {
    if (header.contact && !cvData.hiddenFields['contact']) return mdLine(header.contact);
    return '';
  }
  if (cvSettings.iconStyle === 'none') {
    return mdLine(order.map(key => header[key]).join(' | '));
  }
  return order.map(key => {
    const meta = CONTACT_FIELD_META[key];
    const icon = (meta && meta.icon) || '•';
    return `<span class="cvp-contact-item"><span class="cvp-contact-icon">${escapeHtml(icon)}</span><span class="cvp-contact-text">${mdLine(header[key])}</span></span>`;
  }).join('');
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

// Wraps a single line's text with before/after markers, keeping any
// leading bullet marker (added by rteBullet) outside the wrap. The
// preview renderer detects bullet lines with /^[•–-]\s/ on the raw
// line (see renderEntryDescriptionHtml below); if a marker like ** sat
// in front of the bullet character, that regex would fail to match and
// the whole line would silently fall back to plain-paragraph
// rendering instead of a bullet.
function wrapLinePreservingBullet(line, before, after) {
  if (!line.trim()) return line;
  const bulletMatch = line.match(/^([•–-]\s+)(.*)$/);
  if (bulletMatch) {
    return bulletMatch[1] + before + bulletMatch[2] + after;
  }
  return before + line + after;
}

function rteWrap(taId, before, after) {
  const ta = document.getElementById(taId);
  if (!ta) return;
  const start = ta.selectionStart, end = ta.selectionEnd;
  const sel = ta.value.slice(start, end) || 'text';

  // Wrap each line of the selection individually rather than putting
  // a single before/after pair around the whole block: the CV preview
  // renders each description line as its own paragraph and converts
  // markdown per line, so a marker pair spanning multiple lines would
  // never match on any single line and would render as literal
  // asterisks instead of bold/italic/underline.
  const wrapped = sel.split('\n').map(line => wrapLinePreservingBullet(line, before, after)).join('\n');

  const newVal = ta.value.slice(0, start) + wrapped + ta.value.slice(end);
  ta.value = newVal;
  const fieldKey = taId.replace('entry-ta-', '');
  _editEntryData[fieldKey] = newVal;
  ta.focus();
  ta.setSelectionRange(start, start + wrapped.length);
  autoResize(ta);
}

function rteBullet(taId) {
  const ta = document.getElementById(taId);
  if (!ta) return;
  const start = ta.selectionStart, end = ta.selectionEnd;
  const value = ta.value;

  // Expand to cover every full line touched by the selection (not
  // just the line the cursor happens to sit on), so bulleting a
  // multi-line/multi-paragraph selection bullets every line in it.
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = value.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = value.length;

  const block = value.slice(lineStart, lineEnd);
  const bulleted = block.split('\n').map(line => {
    if (!line.trim()) return line;
    if (/^[•–-]\s/.test(line)) return line; // already bulleted
    return '• ' + line;
  }).join('\n');

  const newVal = value.slice(0, lineStart) + bulleted + value.slice(lineEnd);
  ta.value = newVal;
  const fieldKey = taId.replace('entry-ta-', '');
  _editEntryData[fieldKey] = newVal;
  ta.focus();
  ta.setSelectionRange(lineStart, lineStart + bulleted.length);
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
  const def     = getSectionDef(section, sectionIdx);
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
  const def     = getSectionDef(section, sectionIdx);
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

/* Entry drag — see initEntrySortables() for the SortableJS wiring
   (one instance per rendered .entry-list) that calls this. */
function reorderEntries(si, fromIdx, toIdx) {
  const entries = cvData.parsed.sections[si].entries || [];
  const [moved] = entries.splice(fromIdx, 1);
  entries.splice(toIdx, 0, moved);
  renderEditPanel(); renderRightPanel(); scheduleSave();
}

let _entrySortables = [];
function initEntrySortables() {
  _entrySortables.forEach(s => s.destroy());
  _entrySortables = [];
  if (typeof Sortable === 'undefined') return;
  document.querySelectorAll('.entry-list[data-section-index]').forEach(list => {
    const si = parseInt(list.dataset.sectionIndex, 10);
    _entrySortables.push(new Sortable(list, {
      handle: '.entry-drag-handle',
      animation: 150,
      onEnd(evt) {
        if (evt.oldIndex === evt.newIndex) return;
        reorderEntries(si, evt.oldIndex, evt.newIndex);
      },
    }));
  });
}

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
  { value:'framed-border',   label:'Framed Border',   accent:'#1a1a1a' },
  { value:'left-rule',       label:'Left Rule',       accent:'#1a4d8f' },
  { value:'icon-bullets',    label:'Icon Bullets',    accent:'#1B3A6B' },
  { value:'photo-card',      label:'Photo Card',      accent:'#2d5a4a' },
];

// Templates whose CSS already renders a permanent colored side panel
// (see the "Shared sidebar base" rule in main.css). These are inherently
// two-column, so picking one should switch Columns to "2" automatically
// instead of leaving the user with a mismatched single-column layout.
const SIDEBAR_TEMPLATES = ['atlantic-blue', 'corporate-panel', 'cobalt-edge', 'obsidian-edge', 'neutral-gray'];

// Each template's signature section-heading decoration, expressed as a
// Heading Style value. Template CSS used to hardcode its own heading
// borders with higher specificity than the hs-* classes, which is
// exactly why the Customize > Heading Style picker silently did
// nothing on most templates. Now the hs-* classes are the only source
// of heading decoration; picking a template applies its signature
// style through this map (same pattern as the template's accent
// color), and the user's own pick afterwards actually sticks.
// Templates not listed default to 'underline' (the original base look).
const TEMPLATE_HEADING_DEFAULTS = {
  'condensed-rule': 'line',
  'split-rule': 'frame',
  'editorial-rule': 'bar',
  'sage-line': 'bar',
  'blue-steel': 'line',
  'clear-banner': 'underline',
  'hunter-green': 'line',
  'saffron-line': 'underline',
  'atlantic-blue': 'line',
  'corporate-panel': 'line',
  'cobalt-edge': 'line',
  'obsidian-edge': 'bar',
  'neutral-gray': 'line',
  'framed-border': 'line',
};
function templateHeadingDefault(template) {
  return TEMPLATE_HEADING_DEFAULTS[template] || 'underline';
}

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
  // Thumbnails preview each template's own signature heading style,
  // not the currently-active one — the card should show what you GET
  // by clicking it (which also applies that heading default, see
  // setSetting), not a blend of this template with another's styling.
  const hs = templateHeadingDefault(tpl.value);
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
  const isSidebarTemplateNow = isTwoCol && SIDEBAR_TEMPLATES.includes(cvSettings.template);

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
    (isTwoCol && !isSidebarTemplateNow ? custRow('Header Position', toggleGroup([{label:'Top',value:'top'},{label:'Left',value:'left'},{label:'Right',value:'right'}],'headerPosition')) : '') +
    custRow('Header',       toggleGroup([{label:'← Left',value:'left'},{label:'↔ Center',value:'center'}],'headerAlign')) +
    custRow('Icon Style',   toggleGroup([{label:'None',value:'none'},{label:'Plain',value:'plain'},{label:'● Filled',value:'circle-filled'},{label:'○ Outline',value:'circle-outline'}],'iconStyle')) +
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

  // Each option's mini preview reproduces the actual decoration its
  // hs-* class draws (see the HEADING STYLES block in main.css), so
  // what the button shows is what the CV gets — on every template.
  const headingStyles = [
    {value:'underline', label:'Underline', deco:'border-bottom:1px solid #888;padding-bottom:2px;display:block'},
    {value:'line',      label:'Line',      deco:'border-bottom:2px solid #888;padding-bottom:2px;display:block'},
    {value:'short',     label:'Short',     deco:'border-bottom:2.5px solid #888;padding-bottom:2px;width:fit-content'},
    {value:'dash',      label:'Dash',      deco:'background-image:linear-gradient(#888,#888);background-size:14px 2.5px;background-repeat:no-repeat;background-position:left bottom;padding-bottom:5px;display:block'},
    {value:'frame',     label:'Frame',     deco:'border-top:1px solid #888;border-bottom:1px solid #888;padding:2px 0;display:block'},
    {value:'boxed',     label:'Boxed',     deco:'background:#d9d9de;padding:2px 5px;border-radius:2px;display:block'},
    {value:'bar',       label:'Bar',       deco:'border-left:2.5px solid #888;padding-left:5px;display:block'},
    {value:'wavy',      label:'Wavy',      deco:`background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='4' viewBox='0 0 12 4'%3E%3Cpath d='M0 3 Q 3 0.5 6 3 T 12 3' fill='none' stroke='%23888' stroke-width='1.2'/%3E%3C/svg%3E&quot;);background-repeat:repeat-x;background-position:left bottom;padding-bottom:5px;width:fit-content`},
    {value:'none',      label:'Plain',     deco:'display:block'},
  ];
  let hsHtml = `<div class="hs-grid">`;
  headingStyles.forEach(hs => {
    const active = cvSettings.headingStyle===hs.value?'active':'';
    const inner = `<div class="hs-preview"><div class="hs-preview-label" style="${hs.deco}">SECTION</div><div class="hs-preview-lines"><div class="hs-preview-line"></div><div class="hs-preview-line"></div></div></div>`;
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
    custRow('Skill Display',  toggleGroup([{label:'Text',value:'text'},{label:'Bars',value:'bars'},{label:'Dots',value:'dots'}],'skillStyle'));

  let colorGrid=`<div class="color-grid">`;
  ACCENT_COLORS.forEach(c=>{
    const active=cvSettings.accentColor===c.value?'active':'';
    colorGrid+=`<div class="color-item ${active}" onclick="setSetting('accentColor','${c.value}')" title="${c.label}"><div class="color-dot" style="background:${c.value}"></div><span class="color-dot-label">${c.label}</span></div>`;
  });
  colorGrid+=`</div><div class="color-custom-row"><span class="color-custom-label">Custom</span><input type="color" class="color-custom-swatch" id="colorPickerSwatch" value="${ac}" oninput="onColorPickerInput(this.value)"><input type="text" class="color-custom-input" id="colorHexInput" value="${ac}" maxlength="7" placeholder="#1a1a1a" oninput="onColorHexInput(this.value)"></div>`;

  const accentTargets=[{key:'accentName',label:'Name'},{key:'accentTitle',label:'Job Title'},{key:'accentHeadings',label:'Section Headings'},{key:'accentLine',label:'Heading Line'},{key:'accentDates',label:'Dates'},{key:'accentSubtitle',label:'Entry Subtitle'},{key:'accentIcons',label:'Header Icons'},{key:'accentLinkIcons',label:'Link Icons'}];
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

  const hasWork    = cvData.parsed.sections.some(s => (s.type||'custom')==='work');
  const hasEdu     = cvData.parsed.sections.some(s => (s.type||'custom')==='education');
  const hasProfile = cvData.parsed.sections.some(s => (s.type||'custom')==='profile');
  const sectionsHtml =
    (hasWork ? custRow('Work Experience', toggleGroup([{label:'Title, Employer',value:'normal'},{label:'Employer, Title',value:'swapped'}],'workTitleOrder')) : '') +
    (hasEdu  ? custRow('Education',       toggleGroup([{label:'Degree, School',value:'normal'},{label:'School, Degree',value:'swapped'}],'eduTitleOrder')) : '') +
    (hasProfile ? custRow('Summary',`<label class="cust-toggle-row"><input type="checkbox" ${cvSettings.summaryInHeader?'checked':''} onchange="toggleBool('summaryInHeader',this.checked)"><span class="cust-toggle-slider"></span><span class="cust-toggle-label">Display summary as part of header</span></label>`) : '') +
    (!hasWork && !hasEdu && !hasProfile ? '<p class="footer-zone-hint">Add a Work Experience, Education, or Professional Summary section to see options here.</p>' : '');

  const photoHtml = cvData.parsed.header.photo
    ? custRow('Shape', toggleGroup([{label:'○ Circle',value:'circle'},{label:'▢ Rounded',value:'rounded'},{label:'☐ Square',value:'square'}],'photoShape')) +
      custRow('Zoom', slider('photoZoom',1,2,0.05,'x'))
    : '<p class="footer-zone-hint">Upload a photo in the Header section of the Edit tab to see design options here.</p>';

  customizePanel.innerHTML =
    section('Design Templates', templateHtml) + section('Layout', layoutHtml) +
    section('Font', fontHtml) + section('Font Size', fontSizeHtml) +
    section('Spacing', spacingHtml) + section('Style', styleHtml) +
    section('Colours', colorHtml) + section('Photo', photoHtml) +
    section('Sections', sectionsHtml) + section('Footer & Links', footerHtml);

  if (scrollEl) scrollEl.scrollTop = savedTop;
  const newTplScrollEl = document.querySelector('.template-grid-2col');
  if (newTplScrollEl) newTplScrollEl.scrollLeft = savedTplLeft;
  initLayoutSortable();
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
    const def  = getSectionDef(sections[i], i);
    const width = cvData.sectionWidth[i] || 'full';
    return `<div class="layout-chip" data-section-idx="${i}">
      <span class="layout-chip-handle">⠿</span>
      <span class="layout-chip-icon">${def.icon || '📄'}</span>
      <input class="layout-chip-label" type="text" value="${escapeAttr(name)}"
             onclick="event.stopPropagation()" onkeydown="event.stopPropagation()"
             oninput="event.stopPropagation();renameSectionHandler(${i},this.value)">
      ${colMode==='mix' ? `<button class="layout-width-btn" type="button" onclick="event.stopPropagation();toggleSectionWidth(${i})" title="Toggle full/half width">${width==='half'?'◧ Half':'▭ Full'}</button>` : ''}
    </div>`;
  }

  // The inner `.layout-zone-list`/`.layout-1col-list` is the actual
  // SortableJS-managed container — it holds ONLY chip elements. The
  // zone label and the empty-state hint used to sit alongside the
  // chips as plain sibling divs, which SortableJS would otherwise try
  // to treat as draggable list items too; keeping them in the outer
  // wrapper instead avoids that. The empty-state text itself is a pure
  // CSS `:empty::after` on the list (see main.css) rather than a real
  // DOM node, for the same reason.
  if (colMode === '2') {
    const mainIdx    = sections.map((_,i)=>i).filter(i => (cvData.columnAssign[i]||'main') === 'main');
    const sidebarIdx = sections.map((_,i)=>i).filter(i => cvData.columnAssign[i] === 'sidebar');
    return `<div class="layout-2col-panel">
      <div class="layout-zone">
        <div class="layout-zone-label">Sidebar</div>
        <div class="layout-zone-list" data-zone="sidebar">${sidebarIdx.map(chip).join('')}</div>
      </div>
      <div class="layout-zone">
        <div class="layout-zone-label">Main</div>
        <div class="layout-zone-list" data-zone="main">${mainIdx.map(chip).join('')}</div>
      </div>
    </div>`;
  }

  // One column or Mix: single reorderable list
  return `<div class="layout-1col-panel">
    <div class="layout-zone-list" data-zone="single">${sections.map((_,i)=>chip(i)).join('')}</div>
    ${colMode==='mix' ? '<p class="layout-hint">Half-width sections pair up side by side, in the order shown.</p>' : ''}
  </div>`;
}

// Rather than tracking a dragged chip's old/new position as deltas
// (awkward here since a chip can move between the sidebar and main
// zones, not just within one list), this reads the FULL final chip
// order straight out of the DOM after any drag SortableJS just
// performed, across whichever zone(s) exist for the current column
// mode, and rebuilds cvData.parsed.sections (plus the column/name/
// width maps, all keyed by section index) from that. Simpler and more
// robust than reconstructing what moved from an index pair.
function commitLayoutOrderFromDOM() {
  const oldSections = cvData.parsed.sections;
  const chipIdxsIn = (list) => list ? [...list.querySelectorAll('.layout-chip')].map(el => parseInt(el.dataset.sectionIdx, 10)) : [];

  const singleList = document.querySelector('.layout-zone-list[data-zone="single"]');
  let newOrderOldIdx, newColumnAssignByOldIdx = null;

  if (singleList) {
    newOrderOldIdx = chipIdxsIn(singleList);
  } else {
    const sidebarOldIdx = chipIdxsIn(document.querySelector('.layout-zone-list[data-zone="sidebar"]'));
    const mainOldIdx    = chipIdxsIn(document.querySelector('.layout-zone-list[data-zone="main"]'));
    newOrderOldIdx = [...sidebarOldIdx, ...mainOldIdx];
    newColumnAssignByOldIdx = {};
    sidebarOldIdx.forEach(oi => { newColumnAssignByOldIdx[oi] = 'sidebar'; });
    mainOldIdx.forEach(oi => { newColumnAssignByOldIdx[oi] = 'main'; });
  }
  if (newOrderOldIdx.length !== oldSections.length) return; // safety net, shouldn't happen

  const remapByOldIdx = (obj) => {
    const out = {};
    newOrderOldIdx.forEach((oldI, newI) => { if (obj[oldI] !== undefined) out[newI] = obj[oldI]; });
    return out;
  };

  cvData.parsed.sections = newOrderOldIdx.map(oldI => oldSections[oldI]);
  cvData.sectionNames = remapByOldIdx(cvData.sectionNames);
  cvData.sectionWidth  = remapByOldIdx(cvData.sectionWidth);
  cvData.columnAssign  = remapByOldIdx(newColumnAssignByOldIdx || cvData.columnAssign);

  renderEditPanel(); renderCustomizePanel(); renderRightPanel(); scheduleSave();
}

let _layoutSortables = [];
function initLayoutSortable() {
  _layoutSortables.forEach(s => s.destroy());
  _layoutSortables = [];
  if (typeof Sortable === 'undefined') return;
  document.querySelectorAll('.layout-zone-list').forEach(list => {
    _layoutSortables.push(new Sortable(list, {
      group: 'section-layout', // lets a chip cross from the sidebar list into the main list (and back)
      handle: '.layout-chip-handle',
      animation: 150,
      onEnd: commitLayoutOrderFromDOM,
    }));
  });
}

function reorderSections(fromIdx, toIdx, targetCol) {
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
  // moved section now lives at toIdx — match whatever column the drop target belonged to
  if (targetCol !== undefined) cvData.columnAssign[toIdx] = targetCol;
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
    // Apply the template's signature heading decoration (see
    // TEMPLATE_HEADING_DEFAULTS) the same way its accent color is
    // applied: the template is a style preset, and the user can then
    // override the heading style independently afterwards.
    cvSettings.headingStyle = templateHeadingDefault(value);
    // These templates already have a permanent colored side panel baked
    // into their CSS, so force the matching column mode automatically
    // rather than leaving the layout mismatched until the user notices.
    if (SIDEBAR_TEMPLATES.includes(value)) cvSettings.columns = '2';
    else if (SIDEBAR_TEMPLATES.includes(prevTemplate)) cvSettings.columns = '1';
  }
  renderCustomizePanel();
  if (key==='listStyle'||key==='columns'||key==='dateFormat'||key==='template'||key==='headerPosition'||key==='iconStyle'||key==='workTitleOrder'||key==='eduTitleOrder'||key==='photoShape') { renderEditPanel(); renderRightPanel(); } else applySettings();
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
  if (key==='showDuration') { renderRightPanel(); }
  else if (key==='summaryInHeader') { renderEditPanel(); renderRightPanel(); renderCustomizePanel(); }
  else applySettings();
  scheduleSave();
}
function onFontChange(key,value){ cvSettings[key]=value; applySettings(); scheduleSave(); renderCustomizePanel(); }
function onColorPickerInput(hex){ cvSettings.accentColor=hex; const h=document.getElementById('colorHexInput'); if(h)h.value=hex; applySettings(); scheduleSave(); renderCustomizePanel(); }
function onColorHexInput(val){ const c=val.trim(); if(/^#[0-9a-fA-F]{6}$/.test(c)){cvSettings.accentColor=c; const s=document.getElementById('colorPickerSwatch'); if(s)s.value=c; applySettings(); scheduleSave(); renderCustomizePanel();} }
function onPerColorInput(key,hex){ cvSettings[key]=hex; applySettings(); scheduleSave(); }
function onFooterZoneInput(key,value){ cvSettings[key]=value; renderRightPanel(); scheduleSave(); }

function applySettings() {
  const paginated = isPaginatedLayout();
  if (paginated) {
    // #cvPaper is a plain stacking wrapper here; each .cv-page carries
    // the real theme/style class string instead (see computeCvPaperClassString).
    cvPaper.className = 'cv-pages-holder';
    const classString = computeCvPaperClassString(true);
    cvPaper.querySelectorAll('.cv-page').forEach(p => { p.className = 'cv-page ' + classString; });
  } else {
    cvPaper.className = computeCvPaperClassString(false);
  }

  const isLetter = cvSettings.paperFormat==='Letter';
  // --cv-paper-w is read by .cv-paper-wrap's own CSS width (main.css) so
  // the ON-SCREEN preview box is sized at the same true physical mm
  // width as the PDF export clone, not a smaller fixed editing-friendly
  // px box. #cvPaperWrap is an ANCESTOR of #cvPaper, and CSS custom
  // properties don't propagate upward, so it needs setting here
  // directly rather than only on #cvPaper below. Without this, text set
  // at a fixed px size would wrap inside a narrower on-screen box than
  // the true-width PDF box, making it look proportionally bigger on
  // screen than in the actual downloaded PDF. fitPaperZoom() already
  // shrinks this true-size box back down via CSS zoom when the
  // available panel is too narrow to fit it, so this doesn't cause
  // overflow — it just makes the shrink starting point accurate.
  const cvPaperWrapEl = document.getElementById('cvPaperWrap');
  if (cvPaperWrapEl) cvPaperWrapEl.style.setProperty('--cv-paper-w', isLetter?'215.9mm':'210mm');

  // Custom properties AND direct style props (fontFamily/lineHeight/
  // color/background), keyed so they can be applied identically to
  // #cvPaper and, under real pagination, to every .cv-page too — see
  // the note below on why that second part is required.
  const styleProps = {
    '--cv-paper-w':       isLetter?'215.9mm':'210mm',
    '--cv-paper-h':       isLetter?'279.4mm':'297mm',
    '--cv-accent':        cvSettings.accentColor,
    '--cv-base':          cvSettings.baseFontSize    +'px',
    '--cv-name-size':     cvSettings.nameFontSize    +'px',
    '--cv-name-font':     cvSettings.nameFont,
    '--cv-title-size':    cvSettings.titleFontSize   +'px',
    '--cv-heading-size':  cvSettings.headingFontSize +'px',
    '--cv-entry-size':    cvSettings.entryFontSize   +'px',
    '--cv-section-gap':   cvSettings.sectionSpacing  +'px',
    '--cv-margin-lr':     cvSettings.marginLR        +'mm',
    '--cv-margin-tb':     cvSettings.marginTB        +'mm',
    '--cv-letter-spacing':cvSettings.letterSpacing   +'em',
    '--cv-col-width':     cvSettings.twoColWidth     +'%',
    '--cv-bg':            cvSettings.colorBg,
    '--cv-sidebar-bg':    cvSettings.colorSidebarBg,
    '--cv-text':          cvSettings.colorText,
    '--cv-photo-zoom':    cvSettings.photoZoom,
  };
  const applyStyleProps = (el) => {
    Object.entries(styleProps).forEach(([prop, val]) => el.style.setProperty(prop, val));
    el.style.fontFamily    = cvSettings.bodyFont;
    el.style.lineHeight    = cvSettings.lineHeight;
    el.style.letterSpacing = cvSettings.letterSpacing+'em';
    el.style.color         = cvSettings.colorText;
    el.style.background    = cvSettings.colorBg;
  };
  applyStyleProps(cvPaper);
  if (paginated) {
    // .cv-page carries the literal class `cv-paper` (see above), which
    // has its OWN base rule declaring hardcoded defaults for these same
    // custom properties (`.cv-paper { --cv-accent:#1a1a1a; ... }`, used
    // as a fallback for contexts like template thumbnails that never
    // set them via JS). A property declared directly on an element
    // always wins over one inherited from an ancestor, so without this,
    // every .cv-page would silently ignore whatever #cvPaper says and
    // fall back to those hardcoded defaults — font size, margins, and
    // accent color would all quietly stop working. Setting them again,
    // directly, on each .cv-page closes that gap.
    cvPaper.querySelectorAll('.cv-page').forEach(applyStyleProps);
  }

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
  // Replacing cvPaper's innerHTML destroys and recreates every child node,
  // which can reset the scroll position of the ancestor scrollable panel
  // (#editorRight) — same class of bug as the one already worked around
  // in renderEditPanel for the left panel. Save/restore here too, so
  // saving an entry, renaming a section, etc. doesn't jump the preview
  // back to page 1.
  const rightScrollEl = document.getElementById('editorRight');
  const rightSavedTop = rightScrollEl ? rightScrollEl.scrollTop : 0;

  const mode = getPaginationMode();
  if (mode === 'single' || mode === 'twocol' || mode === 'sidebar') {
    const { pageHtmls, multiPageSections } =
      mode === 'single' ? paginateSingleColumn(cvData.parsed) :
      mode === 'twocol' ? paginateTwoColumn(cvData.parsed) :
      paginateSidebarTemplate(cvData.parsed);
    _paginationMultiPageSections = multiPageSections;
    cvPaper.innerHTML = pageHtmls.map(h => `<div class="cv-page">${h}</div>`).join('');
  } else {
    _paginationMultiPageSections = new Set();
    cvPaper.innerHTML = buildCVHTML(cvData.parsed);
  }
  applySettings();

  if (rightScrollEl) {
    rightScrollEl.scrollTop = rightSavedTop;
    // applySettings() schedules zoom/page-break recalculation a frame
    // later (scheduleFitZoom/updatePageBreaks), which can itself shift
    // this scroll position again (e.g. fitPaperZoom briefly resets zoom
    // to measure natural size) — restore once more after that settles.
    requestAnimationFrame(() => { rightScrollEl.scrollTop = rightSavedTop; });
  }
}

function buildCVHTML(parsed) {
  const { header, sections } = parsed;
  const colMode  = String(cvSettings.columns);
  const isTwoCol = colMode === '2';
  const isMix    = colMode === 'mix';
  const isSidebarTemplate = isTwoCol && SIDEBAR_TEMPLATES.includes(cvSettings.template);

  const hf = header;
  const contactHtml = buildContactHtml(hf);

  let headerTextInner = '';
  if (!cvData.hiddenFields['name'])     headerTextInner += `<div class="cvp-name">${mdLine(hf.name||'')}</div>`;
  if (!cvData.hiddenFields['jobTitle'] && hf.jobTitle) headerTextInner += `<div class="cvp-jobtitle">${mdLine(hf.jobTitle)}</div>`;
  if (contactHtml) headerTextInner += `<div class="cvp-contact">${contactHtml}</div>`;
  if (cvSettings.summaryInHeader) headerTextInner += getSummaryHtml(sections);
  const photoHtml = buildPhotoHtml(hf);
  const headerInner = photoHtml
    ? `<div class="cvp-header-row">${photoHtml}<div class="cvp-header-text">${headerTextInner}</div></div>`
    : headerTextInner;

  // Header Position (Left/Right) only applies to the generic two-column
  // layout: sidebar templates already dedicate the header to their own
  // permanent colored panel, and that's a different, established design
  // this shouldn't interfere with.
  const headerPos = cvSettings.headerPosition || 'top';
  const headerInColumn = isTwoCol && !isSidebarTemplate && (headerPos === 'left' || headerPos === 'right');

  let html = '';
  if (!headerInColumn) {
    html += '<div class="cvp-header">' + headerInner;
    if (isSidebarTemplate) {
      // These templates' header IS the colored side panel (see main.css
      // "Shared sidebar base"), so sections assigned to the sidebar render
      // inside it directly and inherit its color, instead of spawning a
      // separate flat-colored box elsewhere in the layout.
      const sidebar = sections.map((s,i)=>({s,i})).filter(({i})=>cvData.columnAssign[i]==='sidebar');
      html += '<div class="cvp-header-sections">' + sidebar.map(({s,i})=>renderSectionPreview(s,i)).join('') + '</div>';
    }
    html += '</div><hr class="cvp-divider">';
  }

  if (isSidebarTemplate) {
    const main = sections.map((s,i)=>({s,i})).filter(({i})=>(cvData.columnAssign[i]||'main')==='main');
    html += main.map(({s,i})=>renderSectionPreview(s,i)).join('');
  } else if (isTwoCol) {
    const main    = sections.map((s,i)=>({s,i})).filter(({i})=>(cvData.columnAssign[i]||'main')==='main');
    const sidebar = sections.map((s,i)=>({s,i})).filter(({i})=>cvData.columnAssign[i]==='sidebar');
    const headerBlock = headerInColumn ? `<div class="cvp-header cvp-header-incolumn">${headerInner}</div>` : '';
    html += '<div class="cv-two-col-wrap">';
    html += '<div class="cv-sidebar-col">' + (headerPos==='left'?headerBlock:'') + sidebar.map(({s,i})=>renderSectionPreview(s,i)).join('') + '</div>';
    html += '<div class="cv-main-col">'    + (headerPos==='right'?headerBlock:'') + main.map(({s,i})=>renderSectionPreview(s,i)).join('')    + '</div>';
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
// Mix stays flowing (row-based flex pairing, not persistent columns —
// a different shape entirely, out of scope for real pagination).
function getPaginationMode() {
  if (SIDEBAR_TEMPLATES.includes(cvSettings.template)) return 'sidebar';
  const colMode = String(cvSettings.columns);
  if (colMode === '1') return 'single';
  if (colMode === '2') return 'twocol';
  return 'flowing';
}

function isPaginatedLayout() {
  return getPaginationMode() !== 'flowing';
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
    cvSettings.accentIcons    ?'ac-icons':'', cvSettings.accentLinkIcons?'ac-linkicons':'',
    (cvSettings.showPageNums && !excludePageNum) ?'show-pagenum':'', colClass,
  ].filter(Boolean).join(' ');
  return ['cv-paper',`t-${cvSettings.template}`,`hs-${cvSettings.headingStyle}`,
    `hc-${cvSettings.headingCase}`,`ss-${cvSettings.subtitleStyle}`,`ds-${cvSettings.dateStyle}`,
    `lc-${cvSettings.locationStyle}`,`sl-${cvSettings.subtitleLine}`,`ic-${cvSettings.iconStyle}`,
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

// Builds the header unit alone (name/jobTitle/contact/photo, plus the
// inline summary if summaryInHeader is on). Extracted out of
// buildLayoutUnits so future multi-column pagination call sites can
// reuse it without duplicating this markup (e.g. a sidebar-template's
// colored panel prepending this same unit on its first page).
// variant 'incolumn' matches buildCVHTML's headerInColumn markup (used
// when Header Position is Left/Right in the two-column layout); 'bare'
// returns just the inner name/jobTitle/contact/photo markup with no
// wrapping div at all (used by the sidebar-template panel, which wraps
// it in its own .cvp-header alongside .cvp-header-sections); default
// matches the plain top-of-page header + divider used everywhere else.
function buildHeaderUnit(header, sections, variant) {
  const contactHtml = buildContactHtml(header);

  let headerTextInner = '';
  if (!cvData.hiddenFields['name'])     headerTextInner += `<div class="cvp-name">${mdLine(header.name||'')}</div>`;
  if (!cvData.hiddenFields['jobTitle'] && header.jobTitle) headerTextInner += `<div class="cvp-jobtitle">${mdLine(header.jobTitle)}</div>`;
  if (contactHtml) headerTextInner += `<div class="cvp-contact">${contactHtml}</div>`;
  if (cvSettings.summaryInHeader) headerTextInner += getSummaryHtml(sections);
  const photoHtmlUnits = buildPhotoHtml(header);
  const headerInnerUnits = photoHtmlUnits
    ? `<div class="cvp-header-row">${photoHtmlUnits}<div class="cvp-header-text">${headerTextInner}</div></div>`
    : headerTextInner;

  const headerHtml = variant === 'incolumn'
    ? `<div class="cvp-header cvp-header-incolumn">${headerInnerUnits}</div>`
    : variant === 'bare'
    ? headerInnerUnits
    : '<div class="cvp-header">' + headerInnerUnits + '</div><hr class="cvp-divider">';
  return { html: headerHtml, sectionIndex: null, isHeading: false, isHeader: true };
}

// Builds one section's heading + body units and pushes them onto
// `units` (mutates `sectionMeta[i]` too). Extracted out of
// buildLayoutUnits so future multi-column pagination call sites can
// build a units array for an arbitrary subset of sections (e.g. only
// the sections assigned to a sidebar column) without duplicating this
// per-section-type flattening logic.
function buildSectionUnits(sec, i, units, sectionMeta) {
  const name = cvData.sectionNames[i] !== undefined ? cvData.sectionNames[i] : sec.title;
  sectionMeta[i] = { name };
  units.push({ html: `<div class="cvp-sec-heading">${escapeHtml(name)}</div>`, sectionIndex: i, isHeading: true });

  const def   = getSectionDef(sec, i);
  const renderStype = getEffectiveStype(sec, i);
  if (def && !def.useTextarea && sec.entries && sec.entries.length) {
    // Process per-entry (not the whole section's HTML flattened
    // together) so a job title's row1 and its company/location row2
    // can be paired into ONE atomic unit — splitting them across a
    // page boundary would show a title with no company on one page
    // and a company with no title on the next, which is worse than
    // just keeping the pair together. Bullets/lines still flow
    // independently, same as before.
    sec.entries.filter(e=>e.visible!==false).forEach(entry => {
      const nodes = htmlToTopLevelNodes(renderEntryHTML(entry, renderStype));
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

  units.push(buildHeaderUnit(header, sections));

  sections.forEach((sec, i) => {
    if ((sec.type || 'custom') === 'profile' && cvSettings.summaryInHeader) return;
    buildSectionUnits(sec, i, units, sectionMeta);
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
// units (i.e. it started on an earlier page) just continues headerless,
// no repeated heading. IDs are only kept unique-and-meaningful on a
// section's FIRST page — later pages suffix the id, since
// updateSection()/renameSectionHandler()'s fast-path deliberately avoids
// targeting multi-page sections at all (see those functions) and
// duplicate ids would be invalid HTML.
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
    // A section chunk with no heading unit is a continuation of a section
    // that started on an earlier page; just flow the content, no repeated
    // heading. Still needs a page-specific id suffix so continuation pages
    // don't collide with the section's original DOM id.
    const isContinuation = !headingHtml;
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

// Same greedy measure-and-split approach as measureAndPaginate, but for
// one column of a two-column layout: renders each candidate page inside
// a real `.cv-two-col-wrap > .cv-sidebar-col + .cv-main-col` probe (the
// same markup buildCVHTML/the composited output use) and measures the
// TARGET column's own rendered height, not the whole probe. The other
// column is left empty in the probe — CSS grid's `grid-template-columns`
// fixes both tracks' widths from the wrap's total width regardless of
// either side's content, so the target column's width (and therefore
// its text wrapping/height) is identical to how it'll actually render
// once both columns' real per-page content is composited in.
function measureColumnAndPaginate(units, pw, ph, marginTB, classString, sectionMeta, column) {
  const probe = document.createElement('div');
  probe.className = classString;
  probe.style.cssText = 'position:fixed;top:0;left:-99999px;visibility:hidden;box-shadow:none;';
  probe.style.width = probe.style.maxWidth = `${pw}mm`;
  probe.style.minWidth = probe.style.minHeight = '0';
  probe.style.height = 'auto';
  Array.from(cvPaper.style).forEach(prop => {
    if (prop.startsWith('--')) probe.style.setProperty(prop, cvPaper.style.getPropertyValue(prop));
  });
  probe.style.fontFamily    = cvPaper.style.fontFamily;
  probe.style.lineHeight    = cvPaper.style.lineHeight;
  probe.style.letterSpacing = cvPaper.style.letterSpacing;
  document.body.appendChild(probe);

  const pxPerMm = probe.clientWidth / pw;
  const usablePageHeightPx = (ph - marginTB * 2) * pxPerMm;
  const colClass      = column === 'sidebar' ? 'cv-sidebar-col' : 'cv-main-col';
  const otherColClass = column === 'sidebar' ? 'cv-main-col'    : 'cv-sidebar-col';

  const pages = [[]];
  units.forEach(u => {
    const pageIdx = pages.length - 1;
    const candidate = pages[pageIdx].concat([u]);
    probe.innerHTML = `<div class="cv-two-col-wrap"><div class="${colClass}">${unitsToPageHTML(candidate, sectionMeta, pageIdx)}</div><div class="${otherColClass}"></div></div>`;
    const h = probe.querySelector('.' + colClass).getBoundingClientRect().height;
    if (h > usablePageHeightPx && pages[pageIdx].length > 0) {
      pages.push([u]);
    } else {
      pages[pageIdx] = candidate;
    }
  });
  document.body.removeChild(probe);
  return pages;
}

// Two-column analog of paginateSingleColumn: the sidebar-assigned and
// main-assigned sections are two independent content streams that can
// each overflow (or run out) on their own, so each is paginated
// separately via measureColumnAndPaginate, then composited per physical
// page into the same .cv-two-col-wrap markup buildCVHTML already builds
// for a single flowing page. Header Position (Left/Right) prepends the
// header as an ordinary unit to whichever stream owns it, so it's
// measured like any other content; Top position renders it once, full
// width, above the columns on page 1 only (matches the existing
// flowing-layout behavior).
function paginateTwoColumn(parsed) {
  const { header, sections } = parsed;
  const isLetter = cvSettings.paperFormat === 'Letter';
  const [pw, ph] = isLetter ? [215.9, 279.4] : [210, 297];
  const classString = computeCvPaperClassString(true);

  const headerPos = cvSettings.headerPosition || 'top';
  const headerInColumn = headerPos === 'left' || headerPos === 'right';

  const sidebarUnits = [];
  const mainUnits = [];
  const sectionMeta = [];
  if (headerInColumn) {
    const headerUnit = buildHeaderUnit(header, sections, 'incolumn');
    (headerPos === 'left' ? sidebarUnits : mainUnits).push(headerUnit);
  }
  sections.forEach((sec, i) => {
    if ((sec.type || 'custom') === 'profile' && cvSettings.summaryInHeader) return;
    const target = cvData.columnAssign[i] === 'sidebar' ? sidebarUnits : mainUnits;
    buildSectionUnits(sec, i, target, sectionMeta);
  });

  const sidebarPages = measureColumnAndPaginate(sidebarUnits, pw, ph, cvSettings.marginTB, classString, sectionMeta, 'sidebar');
  const mainPages    = measureColumnAndPaginate(mainUnits,    pw, ph, cvSettings.marginTB, classString, sectionMeta, 'main');

  const sectionPageCount = {};
  [...sidebarPages, ...mainPages].forEach(pageUnits => {
    const seen = new Set(pageUnits.map(u => u.sectionIndex).filter(idx => idx !== null));
    seen.forEach(idx => { sectionPageCount[idx] = (sectionPageCount[idx] || 0) + 1; });
  });
  const multiPageSections = new Set(Object.keys(sectionPageCount).filter(k => sectionPageCount[k] > 1).map(Number));

  const topHeaderHtml = headerInColumn ? '' : buildHeaderUnit(header, sections).html;
  const pageCount = Math.max(sidebarPages.length, mainPages.length, 1);
  const pageHtmls = [];
  for (let k = 0; k < pageCount; k++) {
    const sidebarHtml = sidebarPages[k] ? unitsToPageHTML(sidebarPages[k], sectionMeta, k) : '';
    const mainHtml    = mainPages[k]    ? unitsToPageHTML(mainPages[k],    sectionMeta, k) : '';
    let html = (k === 0 && topHeaderHtml) ? topHeaderHtml : '';
    html += `<div class="cv-two-col-wrap"><div class="cv-sidebar-col">${sidebarHtml}</div><div class="cv-main-col">${mainHtml}</div></div>`;
    pageHtmls.push(html);
  }

  return { pageHtmls, classString, multiPageSections };
}

// The 5 sidebar templates don't use .cv-two-col-wrap at all — their
// colored panel IS `.cvp-header` itself (grid-column:1, grid-row:1/200
// per css/main.css's "SIDEBAR TEMPLATES" block), with sections assigned
// to the sidebar nested inside it via .cvp-header-sections, and "main"
// sections placed directly as .cv-page's own children (grid-column:2 by
// CSS). Reassembles one page's panel units into that same structure: the
// header-identity unit (name/jobTitle/contact/photo) only appears on the
// page it actually landed on (always page 1, since it's the very first
// unit in the stream) — later pages showing only continued sidebar
// section content get a small persistent name strip instead, so a
// printed page 2+ isn't a bare color block with no CV owner attached.
function sidebarPanelPageHTML(pageUnits, sectionMeta, pageIdx, header) {
  const hasHeaderUnit = pageUnits[0] && pageUnits[0].isHeader;
  const headerHtml = hasHeaderUnit ? pageUnits[0].html : '';
  const bodyUnits  = hasHeaderUnit ? pageUnits.slice(1) : pageUnits;
  const sectionsHtml = unitsToPageHTML(bodyUnits, sectionMeta, pageIdx);
  const continuationStrip = (!hasHeaderUnit && !cvData.hiddenFields['name'])
    ? `<div class="cvp-name cvp-header-continuation">${mdLine(header.name || '')}</div>` : '';
  return `<div class="cvp-header">${headerHtml}${continuationStrip}<div class="cvp-header-sections">${sectionsHtml}</div></div>`;
}

// Same greedy measure-and-split approach as measureAndPaginate, but for
// the sidebar template's colored panel: sidebar templates set
// `padding: 0 !important` on .cv-paper itself (all spacing lives on
// .cvp-header/.cvp-section instead), so the FULL page height is usable
// here — unlike measureAndPaginate/measureColumnAndPaginate, which
// subtract marginTB because those layouts do use page-level padding.
// No empty sibling column is needed in the probe: grid-template-columns
// fixes both tracks' widths from the container's declared percentages
// regardless of whether the other column has any content.
function measureSidebarPanelAndPaginate(units, pw, ph, classString, sectionMeta, header) {
  const probe = document.createElement('div');
  probe.className = classString;
  probe.style.cssText = 'position:fixed;top:0;left:-99999px;visibility:hidden;box-shadow:none;';
  probe.style.width = probe.style.maxWidth = `${pw}mm`;
  probe.style.minWidth = probe.style.minHeight = '0';
  probe.style.height = 'auto';
  Array.from(cvPaper.style).forEach(prop => {
    if (prop.startsWith('--')) probe.style.setProperty(prop, cvPaper.style.getPropertyValue(prop));
  });
  probe.style.fontFamily    = cvPaper.style.fontFamily;
  probe.style.lineHeight    = cvPaper.style.lineHeight;
  probe.style.letterSpacing = cvPaper.style.letterSpacing;
  document.body.appendChild(probe);

  const pxPerMm = probe.clientWidth / pw;
  const usablePageHeightPx = ph * pxPerMm;

  const pages = [[]];
  units.forEach(u => {
    const pageIdx = pages.length - 1;
    const candidate = pages[pageIdx].concat([u]);
    probe.innerHTML = sidebarPanelPageHTML(candidate, sectionMeta, pageIdx, header);
    const h = probe.querySelector('.cvp-header').getBoundingClientRect().height;
    if (h > usablePageHeightPx && pages[pageIdx].length > 0) {
      pages.push([u]);
    } else {
      pages[pageIdx] = candidate;
    }
  });
  document.body.removeChild(probe);
  return pages;
}

// Same idea for the sidebar template's main (non-sidebar) column: its
// sections are direct children of .cv-paper (grid-column:2 per CSS), so
// the probe's own rendered height already reflects just that column's
// content — column 1 stays empty and contributes no height, same as a
// real page where the panel and main column heights are independent.
function measureSidebarMainAndPaginate(units, pw, ph, classString, sectionMeta) {
  const probe = document.createElement('div');
  probe.className = classString;
  probe.style.cssText = 'position:fixed;top:0;left:-99999px;visibility:hidden;box-shadow:none;';
  probe.style.width = probe.style.maxWidth = `${pw}mm`;
  probe.style.minWidth = probe.style.minHeight = '0';
  probe.style.height = 'auto';
  Array.from(cvPaper.style).forEach(prop => {
    if (prop.startsWith('--')) probe.style.setProperty(prop, cvPaper.style.getPropertyValue(prop));
  });
  probe.style.fontFamily    = cvPaper.style.fontFamily;
  probe.style.lineHeight    = cvPaper.style.lineHeight;
  probe.style.letterSpacing = cvPaper.style.letterSpacing;
  document.body.appendChild(probe);

  const pxPerMm = probe.clientWidth / pw;
  const usablePageHeightPx = ph * pxPerMm;

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

// Sidebar-template analog of paginateSingleColumn/paginateTwoColumn: the
// colored panel (header identity + sidebar-assigned sections) and the
// main column are two independent streams, each paginated separately,
// then composited per physical page as siblings (matching buildCVHTML's
// existing isSidebarTemplate structure: .cvp-header followed directly by
// .cvp-section elements, no wrapping div).
function paginateSidebarTemplate(parsed) {
  const { header, sections } = parsed;
  const isLetter = cvSettings.paperFormat === 'Letter';
  const [pw, ph] = isLetter ? [215.9, 279.4] : [210, 297];
  const classString = computeCvPaperClassString(true);

  const panelUnits = [buildHeaderUnit(header, sections, 'bare')];
  const mainUnits = [];
  const sectionMeta = [];
  sections.forEach((sec, i) => {
    if ((sec.type || 'custom') === 'profile' && cvSettings.summaryInHeader) return;
    const target = cvData.columnAssign[i] === 'sidebar' ? panelUnits : mainUnits;
    buildSectionUnits(sec, i, target, sectionMeta);
  });

  const panelPages = measureSidebarPanelAndPaginate(panelUnits, pw, ph, classString, sectionMeta, header);
  const mainPages  = measureSidebarMainAndPaginate(mainUnits, pw, ph, classString, sectionMeta);

  const sectionPageCount = {};
  [...panelPages, ...mainPages].forEach(pageUnits => {
    const seen = new Set(pageUnits.map(u => u.sectionIndex).filter(idx => idx !== null));
    seen.forEach(idx => { sectionPageCount[idx] = (sectionPageCount[idx] || 0) + 1; });
  });
  const multiPageSections = new Set(Object.keys(sectionPageCount).filter(k => sectionPageCount[k] > 1).map(Number));

  const pageCount = Math.max(panelPages.length, mainPages.length, 1);
  const pageHtmls = [];
  for (let k = 0; k < pageCount; k++) {
    const panelHtml = sidebarPanelPageHTML(panelPages[k] || [], sectionMeta, k, header);
    const mainHtml  = mainPages[k] ? unitsToPageHTML(mainPages[k], sectionMeta, k) : '';
    pageHtmls.push(panelHtml + mainHtml);
  }

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
  // "Summary as part of header" moves the Professional Summary's text
  // into the header block (see buildContactHtml call sites) instead of
  // its own section — skip rendering it a second time here.
  if ((sec.type || 'custom') === 'profile' && cvSettings.summaryInHeader) return '';
  const name  = cvData.sectionNames[i] !== undefined ? cvData.sectionNames[i] : sec.title;
  const stype = sec.type || 'custom';
  const def   = getSectionDef(sec, i);
  const renderStype = getEffectiveStype(sec, i);
  let body = '';

  if (def && !def.useTextarea && sec.entries && sec.entries.length) {
    body = sec.entries.filter(e=>e.visible!==false).map(e=>renderEntryHTML(e, renderStype)).join('');
  } else {
    body = formatLines(sec.lines || []);
  }

  return `<div class="cvp-section" id="preview-sec-${i}">
    <div class="cvp-sec-heading">${escapeHtml(name)}</div>
    <div class="cvp-sec-content" id="preview-content-${i}">${body}</div>
  </div>`;
}

// "Icon Bullets" template swaps the plain bullet/hyphen character for
// a checkmark glyph — the character is baked directly into rendered
// text (not a CSS list-style), so this is the one place both callers
// (structured entries and freeform textarea lines) need to check.
function getBulletChar() {
  if (cvSettings.template === 'icon-bullets') return '✓';
  return cvSettings.listStyle==='hyphen'?'–':'•';
}

function renderEntryHTML(entry, stype) {
  const bullet = getBulletChar();
  let html = '';

  if (stype==='profile') {
    const align = entry.summaryAlign && entry.summaryAlign!=='left' ? ` style="text-align:${entry.summaryAlign}"` : '';
    html += `<p class="cvp-line"${align}>${mdLine(entry.summary||'')}</p>`;
    return html;
  }

  if (stype==='work'||stype==='education'||stype==='projects'||stype==='courses'||stype==='organisations'||stype==='custom-normal') {
    const title   = entry.jobTitle||entry.degree||entry.title||entry.course||entry.name||'';
    const sub     = entry.employer||entry.school||entry.role||entry.provider||entry.organisation||entry.subtitle||'';
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
    // Title/Subtitle Order: which field (job title vs employer/school)
    // leads in row 1. The CSS class stays tied to the field's MEANING
    // (title keeps .cvp-entry-title, subtitle keeps .cvp-entry-employer)
    // regardless of which row it's placed in, so Subtitle Style / accent
    // color targeting keeps working correctly either way.
    const titleOrder = stype==='work' ? cvSettings.workTitleOrder : stype==='education' ? cvSettings.eduTitleOrder : 'normal';
    const swapped = titleOrder === 'swapped';
    // Row 1: job title left, date range right. Row 2: employer left, location right.
    // Keeps company/date/location as distinct fields all the way to markup,
    // instead of collapsing them into one pipe-joined flowing paragraph.
    // "Subtitle: Same Line" folds employer into row 1 next to the title
    // (its pre-existing meaning), leaving row 2 for location only.
    if (cvSettings.subtitleLine === 'same') {
      const titleHtml = [
        title ? `<span class="cvp-entry-title">${mdLine(title)}</span>` : '',
        sub   ? `<span class="cvp-entry-employer cvp-entry-employer-inline">${subHtml}</span>` : ''
      ].filter(Boolean).join('');
      if (titleHtml||dateStr) html += `<div class="cvp-entry-row1">
        <span>${titleHtml}</span>
        ${dateStr ? `<span class="cvp-entry-date">${escapeHtml(dateStr)}</span>` : ''}
      </div>`;
      if (loc) html += `<div class="cvp-entry-row2"><span></span><span class="cvp-entry-location">${escapeHtml(loc)}</span></div>`;
    } else if (swapped) {
      if (sub||dateStr) html += `<div class="cvp-entry-row1">
        ${sub ? `<span class="cvp-entry-employer">${subHtml}</span>` : '<span></span>'}
        ${dateStr ? `<span class="cvp-entry-date">${escapeHtml(dateStr)}</span>` : ''}
      </div>`;
      if (title||loc) html += `<div class="cvp-entry-row2">
        ${title ? `<span class="cvp-entry-title">${mdLine(title)}</span>` : '<span></span>'}
        ${loc ? `<span class="cvp-entry-location">${escapeHtml(loc)}</span>` : ''}
      </div>`;
    } else {
      if (title||dateStr) html += `<div class="cvp-entry-row1">
        ${title ? `<span class="cvp-entry-title">${mdLine(title)}</span>` : '<span></span>'}
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
          html += `<p class="cvp-bullet"${descAlign} style="break-inside:avoid">${bullet} ${mdLine(t.replace(/^[•–-]\s+/,''))}</p>`;
        } else {
          html += `<p class="cvp-line"${descAlign}>${mdLine(t)}</p>`;
        }
      });
    }
    return html;
  }

  if (stype==='skills'||stype==='custom-skill') {
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
    const titleHtml = titleLink ? `<a href="${escapeAttr(titleLink)}" target="_blank" rel="noopener">${mdLine(title)}</a>` : mdLine(title);
    const sub   = [entry.issuer||entry.publisher, entry.date ? formatDate(entry.date) : ''].filter(Boolean).join(' — ');
    const desc  = entry.desc||'';
    const descAlign = entry.descAlign && entry.descAlign!=='left' ? ` style="text-align:${entry.descAlign}"` : '';
    if (title) html += `<p class="cvp-entry-title">${titleHtml}</p>`;
    if (sub)   html += `<p class="cvp-entry-meta">${escapeHtml(sub)}</p>`;
    if (desc)  html += `<p class="cvp-line"${descAlign}>${mdLine(desc)}</p>`;
    return html;
  }

  if (stype==='declaration') {
    const statement = entry.statement||'';
    const sigName   = entry.signatureName||'';
    const date      = formatDate(entry.date||'');
    if (statement) html += `<p class="cvp-line">${mdLine(statement)}</p>`;
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
  const bullet = getBulletChar();
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

function mdLine(text) {
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

// Which of an entry's own fields represent its date range, if any — used
// by the "Sort by Date" button to know both whether to show it at all
// (sections like Skills/Languages/References have no date field) and
// which keys to read per entry. Different section types name theirs
// differently (startDate/endDate for Work/Education/Projects/Courses,
// start/end for Organisations, a single date for Certifications/Awards/
// Publications/Declaration), so this checks by key rather than by
// section type.
function getSectionDateKeys(def) {
  if (!def || !def.fields) return null;
  const keys = def.fields.map(f => f.key);
  if (keys.includes('startDate') && keys.includes('endDate')) return { start:'startDate', end:'endDate' };
  if (keys.includes('start')     && keys.includes('end'))     return { start:'start',     end:'end' };
  if (keys.includes('date')) return { start:'date', end:'date' };
  return null;
}

// Reorders a section's entries most-recent/current-first (reverse
// chronological), matching the convention every CV reader expects and
// what FlowCV's own "sort by date" button does. Ranks by end date
// first (an entry with no end date is treated as ongoing/"Present" —
// parseDateToMs already resolves a blank or "Present" string to right
// now, which is exactly "still current" and belongs at the top), then
// by start date to break ties between entries that ended the same way.
function sortEntriesByDate(index) {
  const section = cvData.parsed.sections[index];
  const def = getSectionDef(section, index);
  const dateKeys = getSectionDateKeys(def);
  if (!dateKeys || !section.entries || section.entries.length < 2) return;

  section.entries = section.entries
    .map((entry, originalIndex) => ({ entry, originalIndex }))
    .sort((a, b) => {
      const bEnd = parseDateToMs(b.entry[dateKeys.end]   || b.entry[dateKeys.start] || '');
      const aEnd = parseDateToMs(a.entry[dateKeys.end]   || a.entry[dateKeys.start] || '');
      if (bEnd !== aEnd) return bEnd - aEnd;
      const bStart = parseDateToMs(b.entry[dateKeys.start] || '');
      const aStart = parseDateToMs(a.entry[dateKeys.start] || '');
      if (bStart !== aStart) return bStart - aStart;
      return a.originalIndex - b.originalIndex; // stable tie-break
    })
    .map(w => w.entry);

  renderEditPanel();
  renderRightPanel();
  scheduleSave();
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
let _sectionSortable = null;
function initSectionsSortable() {
  if (_sectionSortable) { _sectionSortable.destroy(); _sectionSortable = null; }
  const list = document.getElementById('sectionsList');
  if (typeof Sortable === 'undefined' || !list) return;
  _sectionSortable = new Sortable(list, {
    handle: '.drag-handle',
    animation: 150,
    onEnd(evt) {
      if (evt.oldIndex === evt.newIndex) return;
      reorderSections(evt.oldIndex, evt.newIndex);
    },
  });
}

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
  // Read the actual current parent rather than hardcoding #editorRight —
  // the mobile Preview modal (see openMobilePreview) moves this same
  // live #cvPaperWrap node into its own full-screen container instead of
  // cloning it, so the zoom calculation needs to size against WHICHEVER
  // container it's currently sitting in, not always the desktop/mobile
  // split-panel one.
  const right = wrap ? wrap.parentElement : null;
  if (!wrap || !right) return;

  // .cv-paper-wrap's own CSS rule is `width: min(var(--cv-paper-w, 210mm),
  // 100%)` — that 100% cap exists so the wrap never overflows before this
  // function has run, but it means clearing the inline width back to ''
  // does NOT fall back to the true physical page width on a narrow panel
  // (mobile, or a dragged-narrow desktop panel): 100% of the container
  // is narrower than 210mm there, so min() picks the 100% branch. That
  // silently caps naturalW at the container's own width below, so it can
  // never exceed availW, zoom never engages, and the paper's own content
  // (width:100% of the wrap) reflows its text to fit that narrow box
  // instead of being measured/rendered at true size and then uniformly
  // scaled down — a fundamentally different, narrower layout than
  // desktop, not just a smaller rendering of the same one. Setting the
  // true physical width explicitly here (bypassing the 100% cap) makes
  // the measurement, and therefore the on-screen layout, match the
  // desktop/PDF layout at every panel width; only the zoom scale changes.
  wrap.style.zoom  = 1;   // reset first so we measure the true natural width
  wrap.style.width = 'var(--cv-paper-w, 210mm)';
  const availW   = right.clientWidth;   // .editor-right has no horizontal padding
  const naturalW = wrap.scrollWidth || wrap.offsetWidth;

  // `zoom` alone already shrinks the wrap's rendered/visual footprint
  // (the size the parent flex container lays out around) by `scale` —
  // it's not just a paint-time effect, ancestors see the post-zoom size.
  // width must stay at the true physical value in both branches; also
  // setting it to the already-scaled pixel value here (as this used to)
  // gets shrunk by zoom a second time, rendering at roughly scale^2 of
  // the intended size instead of scale. This is what made the mobile
  // preview render far smaller than the desktop layout instead of a
  // clean proportional miniature of it.
  wrap.style.zoom = (naturalW > availW && availW > 50)
    ? Math.max(0.35, Math.min(1, availW / naturalW))
    : 1;
}

let _zoomRaf = null;
function scheduleFitZoom() {
  if (_zoomRaf) cancelAnimationFrame(_zoomRaf);
  _zoomRaf = requestAnimationFrame(fitPaperZoom);
}

window.addEventListener('resize', scheduleFitZoom);

/* ============================================================
   MOBILE PREVIEW MODAL

   On a phone, the edit form and the live preview stack vertically
   (see the @media(max-width:800px) rules in main.css), so reaching the
   preview means scrolling past the whole form. Opening this modal
   MOVES the actual #cvPaperWrap node in (rather than cloning it), so
   there's exactly one live preview element, updated by the exact same
   render calls either way — nothing to keep in sync, and closing the
   modal just moves it straight back to its normal spot in #editorRight.
   fitPaperZoom() reads wrap.parentElement rather than a hardcoded
   #editorRight reference specifically so this resizes correctly in
   both places.
   ============================================================ */
function openMobilePreview() {
  const wrap = document.getElementById('cvPaperWrap');
  if (!wrap || !mobilePreviewBody) return;
  mobilePreviewBody.appendChild(wrap);
  mobilePreviewModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  scheduleFitZoom();
}

function closeMobilePreview() {
  const wrap = document.getElementById('cvPaperWrap');
  const editorRight = document.getElementById('editorRight');
  if (wrap && editorRight) editorRight.appendChild(wrap);
  mobilePreviewModal.classList.remove('open');
  document.body.style.overflow = '';
  scheduleFitZoom();
}

if (mobilePreviewFab) mobilePreviewFab.addEventListener('click', openMobilePreview);
if (mobilePreviewClose) mobilePreviewClose.addEventListener('click', closeMobilePreview);
if (mobilePreviewDownload) mobilePreviewDownload.addEventListener('click', () => downloadBtn.click());

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
  // Per-instance overrides for Custom Section subtype ('text' — the
  // original freeform behavior — is the implicit default whenever a
  // section has no entry here, so every existing custom section on
  // every existing CV keeps working exactly as before).
  cvData.customSectionType = cvData.customSectionType || {};
  cvData.customSectionIcon = cvData.customSectionIcon || {};

  cvSettings = Object.assign({}, DEFAULTS, cvData.settings || {});

  // One-time visual-compatibility mapping for CVs saved before heading
  // decoration moved from template CSS into the hs-* classes: every CV
  // back then stored headingStyle 'underline' (the untouched default),
  // but what actually SHOWED on decorated templates was the template's
  // own hardcoded border (the picker was being overridden — that was
  // the bug). Mapping the stored default to the template's signature
  // style preserves exactly what those CVs looked like. Guarded by a
  // persisted flag so it runs once per CV — after that, a stored
  // 'underline' is a deliberate pick and must survive reloads.
  if (!cvSettings.headingStyleMigrated) {
    if (cvSettings.headingStyle === 'underline') {
      cvSettings.headingStyle = templateHeadingDefault(cvSettings.template);
    }
    cvSettings.headingStyleMigrated = true;
  }

  document.title = `CAS CV Builder — ${cvData.name}`;
  cvNameDisplay.textContent = cvData.name;

  migrateHeader();
  smartMigrate(cvData.parsed.sections);

  downloadBtn.disabled = false;
  reimportBtn.disabled = false;

  renderEditPanel();
  renderCustomizePanel();
  // Wait for this CV's actual fonts to finish loading before the first
  // pagination pass runs, so the very first render doesn't race the
  // font fetch and measure with fallback-font metrics (see
  // ensureFontsReady's comment). Render once immediately anyway so the
  // page isn't blank while fonts load, then re-render once they're
  // confirmed ready; the re-render is a no-op if they already were.
  renderRightPanel();
  scheduleFitZoom();
  ensureFontsReady().then(() => { renderRightPanel(); scheduleFitZoom(); });

  pushHistoryCheckpoint();
}

initEditor();

