/* ============================================================
   CAS CV Builder — parser.js
   Parses cleaned CV text into structured sections.
   Built around the CAS CV format output by Claude.
   ============================================================ */

/**
 * Master parse function.
 * Takes raw CV text, returns structured { header, sections } object.
 */
function parseCV(rawText) {

  // 1. Clean markdown links: [text](url) → text
  let text = rawText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 2. Split into lines, trim whitespace, drop empty lines
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 3. Identify section headings
  //    Rules: all letters are uppercase, no digits, no @ . - + symbols
  //    Minimum 4 characters long
  function isSectionHeading(line) {
    if (line.length < 4) return false;
    // Exclude lines with: email (@), phone (+), dates/numbers (\d), initials (.), hyphens (-)
    if (/[@+\d.\-]/.test(line)) return false;
    // Extract only letters and check they're all uppercase
    const lettersOnly = line.replace(/[^A-Za-z]/g, '');
    if (!lettersOnly.length) return false;
    return lettersOnly === lettersOnly.toUpperCase();
  }

  // 4. Walk through lines and group into header + sections
  const headerLines = [];
  const sections = [];
  let currentSection = null;
  let foundFirstHeading = false;

  for (const line of lines) {
    if (isSectionHeading(line)) {
      foundFirstHeading = true;

      // Save the previous section before starting a new one
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = { title: line, lines: [] };

    } else {
      if (!foundFirstHeading) {
        // Everything before the first heading is the header block
        headerLines.push(line);
      } else if (currentSection) {
        currentSection.lines.push(line);
      }
    }
  }

  // Don't forget the last section
  if (currentSection && currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  // 5. Parse the header block into named fields
  const header = parseHeader(headerLines);

  // 6. Return structured result
  return { header, sections };
}

/**
 * Parse header lines into { name, jobTitle, contact }
 * Typical structure:
 *   Line 0: FULL NAME
 *   Line 1: Job Title / Tagline
 *   Line 2+: Contact info (location, email, phone, LinkedIn)
 */
function parseHeader(lines) {
  if (!lines.length) return { name: '', jobTitle: '', contact: '' };

  const name     = lines[0] || '';
  const jobTitle = lines[1] || '';
  const contact  = lines.slice(2).join(' | ');

  return { name, jobTitle, contact };
}

/**
 * Generate a short preview snippet for a section's content.
 * Strips bullet characters, trims, truncates.
 */
function sectionPreview(lines, maxChars = 120) {
  const text = lines
    .map(l => l.replace(/^[•\-\*]\s*/, '').trim())  // strip bullet chars
    .filter(l => l.length > 0)
    .join(' ');

  return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + '…' : text;
}

/**
 * Convert parsed CV back to a flat text format (for reimport reference).
 * Used when saving raw text alongside parsed data.
 */
function cvToText(parsed) {
  const lines = [];

  if (parsed.header) {
    const h = parsed.header;
    if (h.name)     lines.push(h.name);
    if (h.jobTitle) lines.push(h.jobTitle);
    if (h.contact)  lines.push(h.contact);
    lines.push('');
  }

  for (const section of parsed.sections) {
    lines.push(section.title);
    lines.push(...section.lines);
    lines.push('');
  }

  return lines.join('\n').trim();
}

/* ============================================================
   SMART SECTION MIGRATION
   After parsing raw text into sections, detect the type of each
   section and convert section.lines[] → section.entries[]
   ============================================================ */

function detectSectionType(title) {
  const t = title.toLowerCase();
  if (/work experience|employment|professional experience|career history|experience/.test(t) ||
      /additional experience|other experience/.test(t)) return 'work';
  if (/education|academic|qualification|degree|study/.test(t)) return 'education';
  if (/certif|professional development|licence|license|accreditation|credential/.test(t)) return 'certifications';
  if (/skill|competenc|expertise|core skill/.test(t)) return 'skills';
  if (/language/.test(t)) return 'languages';
  if (/project/.test(t) && !/professional/.test(t)) return 'projects';
  if (/award|achievement|honour|honor/.test(t)) return 'awards';
  if (/interest|hobby/.test(t)) return 'interests';
  if (/reference/.test(t)) return 'references';
  if (/publication/.test(t)) return 'publications';
  if (/course|training/.test(t)) return 'courses';
  if (/organisation|organization|volunteer|membership/.test(t)) return 'organisations';
  if (/profile|summary|objective|about me/.test(t)) return 'profile';
  return null;
}

function isMetaLine(line) {
  return line.includes(' | ') && /(Present|\d{4})/i.test(line);
}

function isBulletLine(line) {
  return /^[•–•\-\*]\s/.test(line.trim());
}

function parseMetaLine(line) {
  // Parse: "Company | City | Jan 2020 – Present" or "Jan 2020 – Present | City"
  const parts = line.split('|').map(p => p.trim());
  let startDate = '', endDate = '', location = '', employer = '';

  parts.forEach(p => {
    // Date range: "Jan 2020 – Present", "August 2021 – Present", or "2023 – 2024"
    const range = p.match(/^(\w{3,9}\s+\d{4}|\d{4})\s*[–—-]\s*(\w{3,9}\s+\d{4}|\d{4}|Present)$/i);
    if (range) {
      startDate = range[1].trim();
      endDate   = range[2].trim();
    } else if (!startDate && /(Present|\d{4})/i.test(p)) {
      startDate = p;
    } else if (startDate && !location && !/\d{4}/.test(p)) {
      location = p;
    } else if (!employer && !/(Present|\d{4})/.test(p)) {
      employer = p;
    } else if (employer && !location && !/(Present|\d{4})/.test(p)) {
      location = p;
    }
  });

  return { startDate, endDate, location, employer };
}

function linesToWorkEntries(lines) {
  const entries = [];
  let cur = null;
  let descLines = [];

  function flush() {
    if (!cur) return;
    cur.desc = descLines.join('\n').trim();
    entries.push(cur);
    cur = null;
    descLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line  = lines[i].trim();
    if (!line) continue;

    const nextLine = (lines[i + 1] || '').trim();

    if (isBulletLine(line)) {
      if (!cur) cur = { visible: true };
      descLines.push(line);
    } else if (isMetaLine(line)) {
      // Parse meta into current entry
      if (!cur) cur = { visible: true };
      const meta = parseMetaLine(line);
      if (meta.employer)  cur.employer  = cur.employer  || meta.employer;
      if (meta.startDate) cur.startDate = meta.startDate;
      if (meta.endDate)   cur.endDate   = meta.endDate;
      if (meta.location)  cur.location  = meta.location;
    } else if (isMetaLine(nextLine)) {
      // This line is a job title (next line is meta)
      flush();
      cur = { visible: true, jobTitle: line };
    } else if (cur && !isBulletLine(line)) {
      // Plain line after entry started — check if it's a company/subtitle
      if (!cur.employer && !cur.startDate) {
        cur.employer = line;
      } else if (cur.jobTitle && !cur.employer) {
        cur.employer = line;
      } else {
        // Non-bullet description line
        descLines.push(line);
      }
    } else {
      // Standalone non-bullet, non-meta: start new entry
      flush();
      cur = { visible: true, jobTitle: line };
    }
  }

  flush();
  return entries.filter(e => e.jobTitle || e.employer || e.desc);
}

function linesToEducationEntries(lines) {
  const entries = [];
  let cur = null;
  let descLines = [];

  function flush() {
    if (!cur) return;
    cur.desc = descLines.join('\n').trim();
    entries.push(cur);
    cur = null;
    descLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const nextLine = (lines[i + 1] || '').trim();

    if (isBulletLine(line)) {
      if (!cur) cur = { visible: true };
      descLines.push(line);
    } else if (isMetaLine(line)) {
      if (!cur) cur = { visible: true };
      const meta = parseMetaLine(line);
      if (meta.employer)  cur.school    = cur.school    || meta.employer;
      if (meta.startDate) cur.startDate = meta.startDate;
      if (meta.endDate)   cur.endDate   = meta.endDate;
      if (meta.location)  cur.location  = meta.location;
    } else if (isMetaLine(nextLine)) {
      flush();
      cur = { visible: true, degree: line };
    } else if (cur) {
      if (!cur.school) cur.school = line;
      else descLines.push(line);
    } else {
      flush();
      cur = { visible: true, degree: line };
    }
  }

  flush();
  return entries.filter(e => e.degree || e.school);
}

function linesToCertEntries(lines) {
  return lines.filter(l => l.trim()).map(l => {
    const line = l.trim();
    // Try to extract date at end: "Name — Date: 2024-06" or "Name, Date"
    const dateMatch = line.match(/[—–-]\s*(?:Date:|date:?)\s*([\w\d/-]+)\s*$/i) ||
                      line.match(/,\s*(\w+\s+\d{4}|\d{4}[-/]\d{2})\s*$/);
    if (dateMatch) {
      return {
        visible: true,
        name: line.slice(0, line.lastIndexOf(dateMatch[0])).trim().replace(/[,—–-]+$/, '').trim(),
        date: dateMatch[1]
      };
    }
    return { visible: true, name: line };
  }).filter(e => e.name);
}

function linesToSkillEntries(lines) {
  return lines.filter(l => l.trim()).map(l => {
    const line = l.trim();
    // "Category: skill1 | skill2 | skill3" or "Category — skill1 | ..."
    const split = line.match(/^([^:—–]+)[:\s—–]+(.+)$/);
    if (split) {
      return { visible: true, skill: split[1].trim(), info: split[2].trim() };
    }
    return { visible: true, skill: line };
  }).filter(e => e.skill);
}

function linesToProfileEntry(lines) {
  const text = lines.filter(l => l.trim()).join(' ').trim();
  return text ? [{ visible: true, summary: text }] : [];
}

/**
 * Main migration function.
 * Detect section types and convert lines[] → entries[]
 */
function smartMigrate(sections) {
  sections.forEach(section => {
    // Don't overwrite existing structured entries
    if (section.entries && section.entries.length) return;
    // Don't overwrite manually set types
    if (section.type && section.type !== 'custom') return;

    const type = detectSectionType(section.title);
    if (!type) return;

    section.type = type;

    switch (type) {
      case 'work':
        section.entries = linesToWorkEntries(section.lines || []);
        break;
      case 'education':
        section.entries = linesToEducationEntries(section.lines || []);
        break;
      case 'certifications':
        section.entries = linesToCertEntries(section.lines || []);
        break;
      case 'skills':
        section.entries = linesToSkillEntries(section.lines || []);
        break;
      case 'profile':
        section.entries = linesToProfileEntry(section.lines || []);
        break;
      default:
        // For other typed sections, keep as textarea (lines[])
        section.type = 'custom';
        break;
    }
  });

  return sections;
}
