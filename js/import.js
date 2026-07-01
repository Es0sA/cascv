/* ============================================================
   CAS CV Builder — import.js
   Handles the import page: parse, preview, save.
   ============================================================ */

// Elements
const backBtn     = document.getElementById('backBtn');
const logoutBtn   = document.getElementById('logoutBtn');
const cvNameInp   = document.getElementById('cvName');
const cvTextarea  = document.getElementById('cvText');
const parseBtn    = document.getElementById('parseBtn');
const importError = document.getElementById('importError');
const previewCard = document.getElementById('previewCard');
const sectionCount= document.getElementById('sectionCount');
const sectionList = document.getElementById('sectionList');
const reparseBtn  = document.getElementById('reparseBtn');
const saveBtn     = document.getElementById('saveBtn');

// Store parsed result between parse and save
let parsedResult = null;

/* ---- Navigation ---- */
backBtn.addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});

logoutBtn.addEventListener('click', () => {
  if (typeof window.casSignOut === 'function') {
    window.casSignOut();
  } else {
    // Fallback, shouldn't normally happen since auth-guard.js
    // always runs first and defines this.
    window.location.href = 'index.html';
  }
});

/* ---- Parse ---- */
parseBtn.addEventListener('click', handleParse);

function handleParse() {
  importError.textContent = '';

  const name = cvNameInp.value.trim();
  const text = cvTextarea.value.trim();

  if (!name) {
    importError.textContent = 'Please enter a client name.';
    cvNameInp.focus();
    return;
  }

  if (!text) {
    importError.textContent = 'Please paste the CV text.';
    cvTextarea.focus();
    return;
  }

  if (text.length < 100) {
    importError.textContent = 'The pasted text looks too short. Make sure you copy the full CV.';
    return;
  }

  // Run the parser
  parsedResult = parseCV(text);
  smartMigrate(parsedResult.sections);
  parsedResult._name = name;
  parsedResult._raw  = text;

  // Render preview
  renderPreview(parsedResult);
}

/* ---- Re-parse ---- */
reparseBtn.addEventListener('click', () => {
  previewCard.style.display = 'none';
  parsedResult = null;
  cvTextarea.focus();
});

/* ---- Render preview ---- */
function renderPreview(result) {
  const { header, sections } = result;

  // Update section count badge
  const total = sections.length + (header.name ? 1 : 0);
  sectionCount.textContent = `${total} section${total !== 1 ? 's' : ''} detected`;

  // Build the list
  let html = '';

  // Header section
  if (header.name) {
    html += `
      <div class="section-item section-item--header">
        <div class="section-item-label">Header</div>
        <div class="section-item-body">
          <div class="section-item-name">${escapeHtml(header.name)}</div>
          ${header.jobTitle ? `<div class="section-item-preview">${escapeHtml(header.jobTitle)}</div>` : ''}
          ${header.contact  ? `<div class="section-item-preview section-item-contact">${escapeHtml(header.contact)}</div>` : ''}
        </div>
      </div>
    `;
  }

  // Content sections
  sections.forEach((section, index) => {
    const preview = sectionPreview(section.lines);
    const lineCount = section.lines.length;

    html += `
      <div class="section-item">
        <div class="section-item-label">${index + 1}</div>
        <div class="section-item-body">
          <div class="section-item-name">${escapeHtml(section.title)}</div>
          ${preview ? `<div class="section-item-preview">${escapeHtml(preview)}</div>` : ''}
          <div class="section-item-meta">${lineCount} line${lineCount !== 1 ? 's' : ''}</div>
        </div>
      </div>
    `;
  });

  sectionList.innerHTML = html;
  previewCard.style.display = 'block';

  // Scroll preview into view
  previewCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---- Save ---- */
saveBtn.addEventListener('click', handleSave);

async function handleSave() {
  if (!parsedResult) return;

  const id  = Date.now().toString();
  const now = new Date().toISOString();

  const cvRecord = {
    id,
    name:      parsedResult._name,
    createdAt: now,
    updatedAt: now,
    raw:       parsedResult._raw,
    parsed: {
      header:   parsedResult.header,
      sections: parsedResult.sections
    }
  };

  saveBtn.disabled = true;

  try {
    const CVStore = await window.cvStoreReady;
    await CVStore.save(cvRecord);
    window.location.href = 'dashboard.html';
  } catch {
    importError.textContent = 'Could not save this CV. Please try again.';
    saveBtn.disabled = false;
  }
}

/* ---- Helpers ---- */
function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}
