/* ============================================================
   CAS CV Builder — js/pdf-service.js
   Shared classic script (loaded by both editor.html and
   dashboard.html, same load pattern as parser.js — see this
   project's CLAUDE.md on why these stay classic scripts instead
   of ES modules).

   Calls the cascv-pdf-service Netlify function, which renders a
   CV to a real PDF using headless Chromium's own native print
   pipeline (page.pdf()), instead of the old client-side
   html2canvas+jsPDF screenshot approach. Chromium's print engine
   paginates by reading the CSS fragmentation rules main.css
   already declares (break-inside: avoid on entry titles/bullets/
   etc.) deterministically, the same way on every request — the
   whole reason this service exists is that JS-measured pagination
   in the visitor's own browser proved unreliable across devices
   (see cascv's CHANGELOG for that history).
   ============================================================ */

const CAS_PDF_SERVICE_URL = 'https://cascv-pdf-service.netlify.app/generate-pdf';

// Renders one CV to PDF via the backend. mode 'save' (default)
// triggers a browser download; mode 'blob' resolves with the raw
// Blob instead, for the mobile Preview modal — showing the actual
// generated PDF rather than a separate live approximation of it, so
// the preview can never visually disagree with the download.
async function casGeneratePdf({ outerClassName, styleAttr, innerHTML, paperFormat, filename, marginLR, marginTB, colorBg }, mode) {
  if (!window.casUser) throw new Error('Not signed in.');
  const token = await window.casUser.getIdToken();

  const res = await fetch(CAS_PDF_SERVICE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ outerClassName, styleAttr, innerHTML, paperFormat, filename, marginLR, marginTB, colorBg }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`PDF service error (${res.status})${detail ? ': ' + detail : ''}`);
  }

  const blob = await res.blob();
  if (mode === 'blob') return blob;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || 'CV'}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
