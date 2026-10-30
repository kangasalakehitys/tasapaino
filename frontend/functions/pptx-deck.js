// PowerPoint export of an article or of a whole page (spec: brand_overview.md,
// "Powerpoint"). The deck is built from what the page shows:
//   title slide     front_bg_red.jpg, action title = the article headline (a
//                   full sentence), main chart in the middle, source in the footer
//   sub-title slide one random head_*_bg.jpg per article (whole page only)
//   content slides  txt_bg_white.jpg: chart (PNG) + summary, analysis + table
//   last slide      one random head_pic_*_bg.jpg
// PptxGenJS is loaded from the CDN on first use.
//
//   await downloadDeck({ articles: [articleElement, …], whole: bool })

import { asset } from './paths.js';
import { svgToRaster } from '../components/chart-export.js';

const LIB = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
const FONT = 'Century Gothic';
const RED = 'DE232F';
const TITLE_RED = 'E01F27';
const INK = '000000';
const MUTED = '595959';
const BRAND = 'Tasapaino – kuntatalouden tasapainotus';

// Slide size LAYOUT_WIDE: 16:9, 13.333 × 7.5 in.

const bg = (name) => ({ path: asset(`brand/photos/powerpoint/${name}.jpg`) });
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const SUBTITLE_BGS = [
  { name: 'head_blue_bg', color: 'FFFFFF' },
  { name: 'head_cyan_bg', color: 'FFFFFF' },
  { name: 'head_grey_bg', color: 'FFFFFF' },
  { name: 'head_orange_bg', color: 'FFFFFF' },
  { name: 'head_yellow_bg', color: INK }
];
const LAST_BGS = [1, 2, 3, 4, 5, 6].map((i) => `head_pic_${i}_bg`);

let libPromise;
function loadLibrary() {
  libPromise ||= new Promise((resolve, reject) => {
    if (window.PptxGenJS) return resolve(window.PptxGenJS);
    const script = document.createElement('script');
    script.src = LIB;
    script.onload = () => resolve(window.PptxGenJS);
    script.onerror = () => {
      libPromise = null;
      reject(new Error('PowerPoint-kirjaston lataus epäonnistui'));
    };
    document.head.appendChild(script);
  });
  return libPromise;
}

const text = (el) => el?.textContent.replace(/\s+/g, ' ').trim() ?? '';

// Visible inside the article: not in a hidden element or in <details> (model
// comparisons). The article itself may be a hidden tab.
function isShown(el, article) {
  for (let n = el; n && n !== article; n = n.parentElement) {
    if (n.hidden || n.tagName === 'DETAILS') return false;
  }
  return true;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function chartImage(chart) {
  const { width, height } = chart.exportSize();
  const png = await svgToRaster(chart.exportSVG(), 'image/png');
  return { data: (await blobToDataUrl(png)).replace(/^data:/, ''), ratio: width / height };
}

// Everything a theme (article) needs for its slides.
async function collectTheme(article) {
  const byEnd = (suffix) => article.querySelector(`[id$="-${suffix}"]`);
  const charts = [];
  for (const el of article.querySelectorAll('.chart')) {
    if (!el.data || typeof el.exportSVG !== 'function' || el.compact || !isShown(el, article)) continue;
    const figure = el.closest('.figure');
    charts.push({
      title: text(figure?.querySelector('.figure__title')),
      subtitle: text(figure?.querySelector('.figure__subtitle')),
      source: text(figure?.querySelector('.figure__source')),
      image: await chartImage(el)
    });
  }
  const analysisEl = byEnd('analysis');
  const analysis = analysisEl
    ? [...analysisEl.querySelectorAll('p, li')].map(text).filter(Boolean)
    : [];
  if (analysisEl && !analysis.length && text(analysisEl)) analysis.push(text(analysisEl));
  const tables = [...article.querySelectorAll('data-table')]
    .filter((t) => t.data && isShown(t, article))
    .map((t) => ({ ...t.data, rows: t.sortedRows() }));
  return {
    tab: article.dataset.tab || '',
    kicker: text(byEnd('kicker')),
    title: text(article.querySelector('h1')),
    standfirst: text(byEnd('standfirst')),
    meta: text(byEnd('meta')),
    charts,
    analysis,
    summary: [...article.querySelectorAll('.summary-box p')].map(text).filter(Boolean).join(' '),
    tables
  };
}

// Fit an image of aspect `ratio` into a box, centred.
function fit(ratio, x, y, w, h) {
  const width = Math.min(w, h * ratio);
  const height = width / ratio;
  return { x: x + (w - width) / 2, y: y + (h - height) / 2, w: width, h: height };
}

// Split paragraphs into slide-sized groups of at most `budget` characters.
function chunk(paragraphs, budget) {
  const pieces = paragraphs.flatMap((p) => {
    if (p.length <= budget) return [p];
    const out = [];
    let cur = '';
    for (const s of p.match(/[^.!?]+[.!?]*\s*/g) ?? [p]) {
      if (cur && (cur + s).length > budget) { out.push(cur.trim()); cur = ''; }
      cur += s;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  });
  const groups = [];
  let cur = [];
  let len = 0;
  for (const p of pieces) {
    if (cur.length && len + p.length > budget) { groups.push(cur); cur = []; len = 0; }
    cur.push(p);
    len += p.length + 40; // paragraph spacing
  }
  if (cur.length) groups.push(cur);
  return groups;
}

const paragraphRuns = (list, options = {}) => list.map((p, i) => ({
  text: p, options: { breakLine: i < list.length - 1, paraSpaceAfter: 8, ...options }
}));

// Footer left of the logo in the bottom right corner of the backgrounds.
function footer(slide, source, color = MUTED, x = 0.6) {
  slide.addText(`${source ? `${source} · ` : ''}${BRAND}`, {
    x, y: 6.85, w: 10.6 - x, h: 0.5, fontFace: FONT, fontSize: 10, color, valign: 'middle'
  });
}

// Rough line count of a text box: Century Gothic averages about 0.52 em per character.
const lines = (str, width, size) => Math.max(1, Math.ceil(str.length / (width / ((size / 72) * 0.52))));

// Short slide title from a table caption: first sentence (not cut at "25-v."),
// without parentheses, at most about two lines at 36 pt.
function shortTitle(str, max = 80) {
  let t = (str || '').split(/\.\s+(?=[A-ZÄÖÅ])/)[0].replace(/\s*\([^)]*\)/g, '').trim();
  if (t.length > max) t = `${t.slice(0, t.lastIndexOf(' ', max))} …`;
  return t;
}

// Title slide: action title (top), chart as evidence (middle), source (footer).
// The background has the logo at the top and the brand curve on the left edge,
// so the text starts below the logo and right of the curve.
function titleSlide(pptx, { label, theme }) {
  const slide = pptx.addSlide();
  slide.background = bg('front_bg_red');
  const x = 2.4;
  const w = 10.5;
  slide.addText(label, { x, y: 1.45, w, h: 0.4, fontFace: FONT, fontSize: 16, color: 'FFFFFF' });
  // 48 pt lines are about 0.78 in; the chart panel takes the space left below.
  const titleH = Math.min(3.2, lines(theme.title, w, 48) * 0.78 + 0.1);
  slide.addText(theme.title, {
    x, y: 1.85, w, h: titleH, fontFace: FONT, fontSize: 48, color: 'FFFFFF', valign: 'top', margin: 0
  });
  const top = 1.85 + titleH + 0.2;
  const height = 6.8 - top;
  const chart = theme.charts[0];
  if (chart && height >= 1.5) {
    slide.addShape(pptx.ShapeType.rect, { x, y: top, w, h: height, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF' } });
    slide.addImage({ data: chart.image.data, ...fit(chart.image.ratio, x + 0.1, top + 0.1, w - 0.2, height - 0.2) });
  } else if (theme.standfirst && height >= 1) {
    slide.addText(theme.standfirst, { x, y: top, w, h: height, fontFace: FONT, fontSize: 20, color: 'FFFFFF', valign: 'top' });
  }
  // One line under the chart panel: the first sentence of the source.
  footer(slide, (chart?.source || theme.meta).split(/\.\s+(?=[A-ZÄÖÅ])/)[0], 'FFFFFF', x);
}

function subtitleSlide(pptx, theme) {
  const { name, color } = pick(SUBTITLE_BGS);
  const slide = pptx.addSlide();
  slide.background = bg(name);
  slide.addText(theme.tab || theme.kicker, {
    x: 0.8, y: 1.6, w: 8.2, h: 2.2, fontFace: FONT, fontSize: 40, color, valign: 'bottom', fit: 'shrink'
  });
  slide.addText(theme.title, {
    x: 0.8, y: 4.0, w: 8.2, h: 1.8, fontFace: FONT, fontSize: 20, color, valign: 'top', fit: 'shrink'
  });
}

function contentSlide(pptx, title) {
  const slide = pptx.addSlide();
  slide.background = bg('txt_bg_white');
  slide.addText(title, {
    x: 0.6, y: 0.35, w: 11.4, h: 1.45, fontFace: FONT, fontSize: 36, color: TITLE_RED, valign: 'top', fit: 'shrink'
  });
  return slide;
}

const BODY = { fontFace: FONT, fontSize: 16, color: INK, valign: 'top' };

// Chart slide: chart on the left, summary (first chart) or subtitle on the right.
function chartSlide(pptx, theme, chart, i) {
  const slide = contentSlide(pptx, i === 0 ? theme.title : chart.title || theme.title);
  const side = i === 0 && theme.summary
    ? [{ text: 'Yhteenveto', options: { bold: true, breakLine: true, paraSpaceAfter: 6 } }, { text: theme.summary }]
    : [{ text: chart.title, options: { bold: true, breakLine: true, paraSpaceAfter: 6 } }, { text: chart.subtitle }];
  slide.addImage({ data: chart.image.data, ...fit(chart.image.ratio, 0.6, 1.95, 8.0, 4.85) });
  slide.addText(side, { x: 8.9, y: 1.95, w: 3.9, h: 4.85, ...BODY });
  footer(slide, chart.source || theme.meta);
}

// Rows per table slide; a longer table (e.g. a monthly series) is split over
// two slides at most and the rest is left on the web page.
const MAX_ROWS = 13;
const MAX_TABLE_SLIDES = 2;

function tableRows(table, rows) {
  const header = table.columns.map((c, i) => ({
    text: c.label,
    options: { bold: true, fill: { color: 'F3F3F3' }, align: i === 0 ? 'left' : 'center' }
  }));
  const body = rows.map((row) => {
    const strong = table.highlight?.(row);
    return table.columns.map((c, i) => {
      const value = row[c.key];
      const color = c.signColor && typeof value === 'number' ? (value > 0 ? '009651' : value < 0 ? RED : INK) : INK;
      return {
        text: String(c.format ? c.format(value, row) : value ?? ''),
        options: { color, bold: Boolean(strong), align: i === 0 ? 'left' : 'center', ...(strong && { fill: { color: 'F3F3F3' } }) }
      };
    });
  });
  return [header, ...body];
}

// Text columns get twice the width of number columns, so labels wrap less.
function columnWidths(table, width) {
  const weights = table.columns.map((c) => (c.numeric ? 1 : 2));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((v) => (v / total) * width);
}

function addTable(slide, table, rows, box) {
  slide.addTable(tableRows(table, rows), {
    ...box, colW: columnWidths(table, box.w), fontFace: FONT, fontSize: 11, color: INK, rowH: 0.3, margin: 0.04,
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, autoPage: false
  });
}

// Analysis and tables: a small table fits beside the analysis, otherwise
// tables get their own slides of at most MAX_ROWS rows.
function analysisSlides(pptx, theme) {
  const tables = [...theme.tables];
  const first = tables[0];
  const besideFirst = first && first.rows.length <= MAX_ROWS && first.columns.length <= 5;
  const groups = chunk(theme.analysis, besideFirst ? 800 : 1400);
  const heading = `${theme.tab || theme.kicker}: analyysi`;
  groups.forEach((group, i) => {
    const slide = contentSlide(pptx, i === 0 ? heading : `${heading} (jatkuu)`);
    const beside = i === 0 && besideFirst;
    slide.addText(paragraphRuns(group), { x: 0.6, y: 1.95, w: beside ? 6.0 : 11.6, h: 4.9, ...BODY });
    if (beside) {
      addTable(slide, first, first.rows, { x: 6.9, y: 1.95, w: 5.6 });
      tables.shift();
    }
    footer(slide, theme.meta);
  });
  for (const table of tables) {
    const title = shortTitle(table.caption) || theme.title;
    const shown = Math.min(table.rows.length, MAX_ROWS * MAX_TABLE_SLIDES);
    for (let start = 0; start < shown; start += MAX_ROWS) {
      const slide = contentSlide(pptx, start ? `${title} (jatkuu)` : title);
      addTable(slide, table, table.rows.slice(start, Math.min(start + MAX_ROWS, shown)), { x: 0.6, y: 1.95, w: 11.6 });
      const rest = start + MAX_ROWS >= shown && shown < table.rows.length
        ? `Taulukosta näytetään ${shown} riviä ${table.rows.length}:stä, koko taulukko verkkosivulla.` : '';
      footer(slide, [rest, theme.meta].filter(Boolean).join(' '));
    }
  }
}

function lastSlide(pptx, label) {
  const slide = pptx.addSlide();
  slide.background = bg(pick(LAST_BGS));
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 6.4, h: 7.5, fill: { color: INK, transparency: 45 }, line: { color: INK, transparency: 100 } });
  slide.addText('Kiitos!', { x: 0.6, y: 2.2, w: 5.6, h: 1.2, fontFace: FONT, fontSize: 48, color: 'FFFFFF' });
  slide.addText(`${BRAND}\n${label}`, { x: 0.6, y: 3.5, w: 5.6, h: 1.2, fontFace: FONT, fontSize: 18, color: 'FFFFFF', valign: 'top' });
}

const slug = (s) => s.toLowerCase().replace(/[äå]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function downloadDeck({ articles, whole = false }) {
  const PptxGenJS = await loadLibrary();
  const [pageName, place = ''] = document.title.split(' – ');
  const label = [place, pageName].filter(Boolean).join(' · ');
  const themes = [];
  for (const article of articles) themes.push(await collectTheme(article));

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = BRAND;
  pptx.title = whole ? label : `${label}: ${themes[0].tab}`;
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };

  titleSlide(pptx, { label: whole ? label : `${label} · ${themes[0].tab}`, theme: themes[0] });
  for (const theme of themes) {
    if (whole) subtitleSlide(pptx, theme);
    theme.charts.forEach((chart, i) => chartSlide(pptx, theme, chart, i));
    if (!theme.charts.length && theme.summary) {
      const slide = contentSlide(pptx, theme.title);
      slide.addText([{ text: 'Yhteenveto', options: { bold: true, breakLine: true } }, { text: theme.summary }], { x: 0.6, y: 1.95, w: 11.6, h: 4.85, ...BODY });
      footer(slide, theme.meta);
    }
    analysisSlides(pptx, theme);
  }
  lastSlide(pptx, label);

  const name = [pageName, place, whole ? '' : themes[0].tab].filter(Boolean).map(slug).join('-');
  await pptx.writeFile({ fileName: `${name}.pptx` });
}

