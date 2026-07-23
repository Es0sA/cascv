/* ============================================================
   CAS CV Builder — parser.js
   Parses CV text into structured sections. Originally built around
   the all-caps cleaned CV format output by Claude; also handles raw,
   uncleaned resume text (title case headings, dates split across
   several lines, no bullet markers) without needing that cleanup
   step first.
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

  // 3. Identify section headings.
  //    Two ways a line counts as a heading:
  //    a) All-caps, no digits/@/+ (the original cleaned-by-Claude format).
  //    b) The line, taken as a whole, matches one of a known set of
  //       exact section-title phrases (Work Experience, Education,
  //       Skills, etc, in whatever case). This lets raw, uncleaned
  //       resume text (title case, sentence case) be recognized
  //       without needing an all-caps pass through Claude first.
  //       This deliberately uses a whole-phrase match rather than
  //       detectSectionType's substring match below: substring
  //       matching is fine once a line is already confirmed to be a
  //       heading (to classify which type it is), but it is too loose
  //       for deciding heading-ness in the first place. e.g. detecting
  //       "project" anywhere in a line would wrongly flag a job title
  //       like "Project Manager" as a new section.
  function isKnownHeadingPhrase(line) {
    const t = line.trim().toLowerCase().replace(/[:.,]+$/, '');
    const knownHeadingPhrases = [
      /^(work|professional|career)?\s*experience$/,
      /^employment( history)?$/,
      /^career history$/,
      /^additional experience$/,
      /^other experience$/,
      /^education( and training)?$/,
      /^academic (background|qualifications?)$/,
      /^qualifications?$/,
      /^certifications?( and professional development)?$/,
      /^licenses?( and certifications?)?$/,
      /^accreditations?$/,
      /^(core |key )?skills$/,
      /^competenc(y|ies)$/,
      /^expertise$/,
      /^languages?$/,
      /^projects?$/,
      /^awards?( and honou?rs?)?$/,
      /^honou?rs?$/,
      /^achievements?$/,
      /^interests?$/,
      /^hobbies$/,
      /^references?$/,
      /^publications?$/,
      /^courses?( and training)?$/,
      /^training$/,
      /^organi[sz]ations?$/,
      /^volunteer(ing| experience| work)?$/,
      /^memberships?$/,
      /^(professional )?(profile|summary|objective)$/,
      /^about me$/,
    ];
    return knownHeadingPhrases.some(re => re.test(t));
  }

  function isSectionHeading(line) {
    if (line.length < 3 || line.length > 50) return false;

    const lettersOnly = line.replace(/[^A-Za-z]/g, '');
    if (!lettersOnly.length) return false;

    const isAllCaps = lettersOnly.length >= 4 &&
      !/[@+\d]/.test(line) &&
      lettersOnly === lettersOnly.toUpperCase();
    if (isAllCaps) return true;

    return isKnownHeadingPhrase(line);
  }

  // 4. Walk through lines and group into header + sections
  const headerLines = [];
  const sections = [];
  let currentSection = null;
  let foundFirstHeading = false;

  for (const [index, line] of lines.entries()) {
    // The very first line of a resume is always the name, never a
    // section heading, even if it happens to be written in all caps.
    if (index > 0 && isSectionHeading(line)) {
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
 * Parse header lines into { name, jobTitle, contact }.
 * Rather than assuming a fixed line 0 / line 1 / line 2+ layout (which
 * only holds for the cleaned-by-Claude format), classify each line: a
 * line with an email, phone number, URL or linkedin/github handle is
 * contact info regardless of position. The first non-contact line is
 * the name, the second is the job title/tagline. This handles raw
 * resume text where contact details may be split across several lines
 * or appear before the tagline.
 */
function parseHeader(lines) {
  if (!lines.length) return { name: '', jobTitle: '', contact: '' };

  const contactPattern = /@|linkedin\.com|github\.com|https?:\/\/|(?:^|\s)\+?\(?\d{2,4}\)?[\d\s().-]{5,}$/i;

  let name = '', jobTitle = '';
  const contactLines = [];

  for (const line of lines) {
    if (contactPattern.test(line)) {
      contactLines.push(line);
    } else if (!name) {
      name = line;
    } else if (!jobTitle) {
      jobTitle = line;
    } else {
      contactLines.push(line);
    }
  }

  return { name, jobTitle, contact: contactLines.join(' | ') };
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

// A single date token: "Jan 2020", "January 2020", or a bare year "2020".
const DATE_TOKEN = '(?:[A-Za-z]{3,9}\\.?\\s+\\d{4}|\\d{4})';
// An end-of-range token also allows the usual "still going" words.
const END_TOKEN = `(?:${DATE_TOKEN}|Present|Current|Now|Date|Till Date|To Date)`;
// Two date tokens joined by a dash (of any style) or the word "to".
const DATE_RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:[\\u2013\\u2014-]|\\bto\\b)\\s*(${END_TOKEN})`, 'i'
);

function isMetaLine(line) {
  return DATE_RANGE_RE.test(line);
}

function isBulletLine(line) {
  return /^[••–▪‣○\-\*]\s/.test(line.trim());
}

function parseMetaLine(line) {
  // Find the date range wherever it sits in the line (works for
  // "Company | City | Jan 2020 - Present", "Jan 2020 - Present | City",
  // and unpunctuated raw text like "Company, City  September 2025 to
  // June 2026"). Text that appears BEFORE the date range is treated as
  // employer/location; text AFTER it (e.g. a single-line entry like
  // "Role, Company | Aug 2011 to Jul 2013. Did the thing.") is kept
  // separately as trailing description text rather than mixed in with
  // employer/location.
  let startDate = '', endDate = '', location = '', employer = '', trailing = '';

  const rangeMatch = line.match(DATE_RANGE_RE);
  let before = line, after = '';
  if (rangeMatch) {
    startDate = rangeMatch[1].trim();
    endDate   = rangeMatch[2].trim();
    before = line.slice(0, rangeMatch.index);
    after  = line.slice(rangeMatch.index + rangeMatch[0].length);
  }

  // Strip leftover separator punctuation from where the date used to sit.
  before = before.replace(/^[\s|,–—-]+|[\s|,–—-]+$/g, '');
  after  = after.replace(/^[\s|,.:;–—-]+/, '').trim();

  if (before) {
    // Prefer pipe-separated parts ("Company | City, State").
    let parts = before.split(/\s*\|\s*/).filter(Boolean);
    if (parts.length === 1) {
      // Fall back to comma-separated ("Company, City, State").
      parts = before.split(/\s*,\s*/).filter(Boolean);
    }

    if (parts.length >= 2) {
      employer = parts[0];
      location = parts.slice(1).join(', ');
    } else if (parts.length === 1) {
      employer = parts[0];
    }
  }

  if (after) trailing = after;

  return { startDate, endDate, location, employer, trailing };
}

// How many plain (non-bullet, non-meta) lines ahead to check for a
// meta (date) line when deciding whether a plain line starts a new
// entry header block. The cleaned-by-Claude format puts title
// immediately above a combined meta line (lookahead of 1); raw resume
// text can split title, employer, and location onto three separate
// lines before the date line, so the scan needs to reach 4 lines
// ahead (title, employer, location, then meta) to still find it.
const HEADER_LOOKAHEAD = 4;

// True if a meta (date) line appears within the next `count` lines,
// with nothing but plain (non-bullet) lines in between. Used to detect
// "this plain line is the start of a new entry's header block" even
// when the header spans more than 2 lines.
function metaWithinLookahead(lines, fromIndex, count) {
  for (let j = fromIndex; j < Math.min(lines.length, fromIndex + count); j++) {
    const l = (lines[j] || '').trim();
    if (!l) continue;
    if (isBulletLine(l)) return false;
    if (isMetaLine(l)) return true;
  }
  return false;
}

function linesToWorkEntries(lines) {
  const entries = [];
  let cur = null;
  let descLines = [];
  let headerFieldsSet = 0; // how many plain lines have filled {jobTitle, employer/location} for cur
  let headerDone = false;  // true once a meta (date) line has been consumed for cur

  function flush() {
    if (!cur) return;
    cur.desc = descLines.join('\n').trim();
    entries.push(cur);
    cur = null;
    descLines = [];
    headerFieldsSet = 0;
    headerDone = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (isBulletLine(line)) {
      if (!cur) cur = { visible: true };
      descLines.push(line);
      continue;
    }

    if (isMetaLine(line)) {
      // A second meta line for the same entry (no title line in
      // between) means each meta line is actually its own single-line
      // entry (e.g. "Role, Company | Aug 2011 to Jul 2013. Did the
      // thing." repeated one per line, with no separate title line).
      if (cur && headerDone) flush();

      if (!cur) cur = { visible: true };
      const meta = parseMetaLine(line);
      if (meta.employer)  cur.employer  = cur.employer  || meta.employer;
      if (meta.startDate) cur.startDate = meta.startDate;
      if (meta.endDate)   cur.endDate   = meta.endDate;
      if (meta.location)  cur.location  = cur.location  || meta.location;
      if (meta.trailing)  descLines.push(meta.trailing);
      headerDone = true;
      continue;
    }

    // Plain line: still inside the current entry's header block
    // (title / employer / location) if no meta line and no
    // description text has been seen yet for this entry.
    const stillInHeader = cur && !headerDone && descLines.length === 0 && headerFieldsSet < 3;

    if (!cur) {
      cur = { visible: true, jobTitle: line };
      headerFieldsSet = 1;
    } else if (stillInHeader) {
      if (!cur.jobTitle) {
        cur.jobTitle = line;
      } else if (!cur.employer) {
        cur.employer = line;
      } else {
        cur.location = cur.location || line;
      }
      headerFieldsSet++;
    } else if (metaWithinLookahead(lines, i, HEADER_LOOKAHEAD)) {
      // A date line is coming up within the next couple of lines with
      // no bullets in between: this plain line starts a new entry.
      flush();
      cur = { visible: true, jobTitle: line };
      headerFieldsSet = 1;
    } else {
      // Plain description line (bullet markers weren't used).
      descLines.push(line);
    }
  }

  flush();
  return entries.filter(e => e.jobTitle || e.employer || e.desc);
}

function linesToEducationEntries(lines) {
  const entries = [];
  let cur = null;
  let descLines = [];
  let headerFieldsSet = 0;
  let headerDone = false;

  function flush() {
    if (!cur) return;
    cur.desc = descLines.join('\n').trim();
    entries.push(cur);
    cur = null;
    descLines = [];
    headerFieldsSet = 0;
    headerDone = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (isBulletLine(line)) {
      if (!cur) cur = { visible: true };
      descLines.push(line);
      continue;
    }

    if (isMetaLine(line)) {
      if (cur && headerDone) flush();

      if (!cur) cur = { visible: true };
      const meta = parseMetaLine(line);
      if (meta.employer)  cur.school    = cur.school    || meta.employer;
      if (meta.startDate) cur.startDate = meta.startDate;
      if (meta.endDate)   cur.endDate   = meta.endDate;
      if (meta.location)  cur.location  = cur.location  || meta.location;
      if (meta.trailing)  descLines.push(meta.trailing);
      headerDone = true;
      continue;
    }

    const stillInHeader = cur && !headerDone && descLines.length === 0 && headerFieldsSet < 3;

    if (!cur) {
      cur = { visible: true, degree: line };
      headerFieldsSet = 1;
    } else if (stillInHeader) {
      if (!cur.degree) {
        cur.degree = line;
      } else if (!cur.school) {
        cur.school = line;
      } else {
        cur.location = cur.location || line;
      }
      headerFieldsSet++;
    } else if (metaWithinLookahead(lines, i, HEADER_LOOKAHEAD)) {
      flush();
      cur = { visible: true, degree: line };
      headerFieldsSet = 1;
    } else {
      descLines.push(line);
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
  const entries = [];
  let pendingCategory = null; // a plain category-label line awaiting its list on the next line

  function flushPending() {
    if (pendingCategory) entries.push({ visible: true, skill: pendingCategory });
    pendingCategory = null;
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // "Category: skill1 | skill2 | skill3" or "Category — skill1 | ..."
    // Requires an actual colon or dash separator, not just any space,
    // so a plain category label with no punctuation isn't chopped in
    // half at its last word.
    const split = line.match(/^([^:—–|]+)[:—–]\s*(.+)$/);
    if (split) {
      flushPending();
      entries.push({ visible: true, skill: split[1].trim(), info: split[2].trim() });
      continue;
    }

    if (pendingCategory) {
      // A pipe-separated list right after a bare category label is
      // that category's skill list (raw resumes often split "Category"
      // and "skill1 | skill2 | ..." onto two separate lines).
      if (line.includes('|')) {
        entries.push({ visible: true, skill: pendingCategory, info: line });
        pendingCategory = null;
        continue;
      }
      // Otherwise the previous line was a standalone skill, not a
      // category label; flush it and start considering this line.
      flushPending();
    }

    if (line.includes('|')) {
      // Bare pipe-separated list with no preceding category label.
      entries.push({ visible: true, skill: line });
    } else {
      // Hold this line: it might be a standalone skill, or a category
      // label whose list follows on the next line.
      pendingCategory = line;
    }
  }

  flushPending();
  return entries.filter(e => e.skill);
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

/* ============================================================
   PDF EXPORT — shared header-bleed fix

   Several templates (the dark "banner" headers: Silver Banner,
   Corporate, Blue Steel, Clear Banner, Hunter Green, Atlantic Blue,
   Corporate Panel, Cobalt Edge, Obsidian Edge, Neutral Gray, Photo
   Card) make their .cvp-header bleed to the true edge of the page
   using a negative top/left/right margin that exactly cancels out
   the page's own padding (see the `.cv-paper.t-*  .cvp-header` rules
   in main.css). That works perfectly in a real browser, but
   html2canvas (used by both editor.js's PDF export and dashboard.js's
   downloadCV()) does not reliably replicate negative-margin layout:
   it renders the header's vertical padding compressed, so the name
   ends up sitting much closer to the top of the banner than it does
   in the live preview or than the CSS asks for. Reported by Cas:
   the name looked almost cut off at the top in a downloaded PDF that
   used Hunter Green, even though the live editor preview looked fine.

   Confirmed via a live A/B capture (same DOM, same fonts, only the
   negative margin removed) that the compression is specific to the
   negative-margin technique, not a font-loading race or a scale
   issue. The fix: on the DETACHED CLONE used for PDF capture only
   (never on the live, on-screen DOM), convert the negative-margin
   bleed into a zero-margin layout before html2canvas ever sees it,
   by removing the header's negative top margin and clearing the
   page's own top padding to match (the header keeps its own
   template-defined padding-top, which still insets the name from
   the true page edge). Call this on every pageClone/wrap element
   right after it's attached to the document, before html2canvas
   captures it.
   ============================================================ */
function neutralizeHeaderBleed(pageEl) {
  const header = pageEl.querySelector(':scope > .cvp-header');
  if (!header) return;
  const bleedTop = parseFloat(getComputedStyle(header).marginTop);
  if (!(bleedTop < 0)) return; // only templates using the bleed trick have a negative margin here
  // Left/right bleed is untouched: it measured correctly in html2canvas's
  // capture (only the vertical padding was compressed), and zeroing it
  // here would double-pad the header horizontally against the page's own
  // still-intact left/right padding.
  header.style.marginTop = '0px';
  pageEl.style.paddingTop = '0px';
}
