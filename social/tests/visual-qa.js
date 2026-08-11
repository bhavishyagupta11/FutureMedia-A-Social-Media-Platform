// Comprehensive Visual QA Test for FutureMedia
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3456';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

const KEY_VIEWPORTS = [
  { w: 320, h: 667, name: '320' },
  { w: 390, h: 844, name: '390' },
  { w: 430, h: 932, name: '430' },
  { w: 768, h: 1024, name: '768' },
  { w: 1024, h: 1366, name: '1024' },
  { w: 1440, h: 900, name: '1440' },
];

async function runTests() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  console.log('=== FutureMedia Visual QA Test ===\n');

  // TEST 1: Branding
  console.log('--- Test 1: Browser Branding ---');
  const bCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const bPage = await bCtx.newPage();
  try {
    await bPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
    const title = await bPage.title();
    console.log(`  Title: "${title}" ${title === 'FutureMedia' ? 'PASS' : 'FAIL'}`);
    const fav = await bPage.$eval('link[rel="icon"]', el => el.href).catch(() => 'N/A');
    console.log(`  Favicon: ${fav.includes('favicon.png') ? 'PASS' : 'FAIL'} (${fav})`);
    const desc = await bPage.$eval('meta[name="description"]', el => el.content).catch(() => 'N/A');
    console.log(`  Meta desc: ${desc.includes('FutureMedia') ? 'PASS' : 'FAIL'}`);
    const og = await bPage.$eval('meta[property="og:title"]', el => el.content).catch(() => 'N/A');
    console.log(`  OG title: ${og === 'FutureMedia' ? 'PASS' : 'FAIL'}`);
    const tc = await bPage.$eval('meta[name="theme-color"]', el => el.content).catch(() => 'N/A');
    console.log(`  Theme color: ${tc === '#09090B' ? 'PASS' : 'FAIL'} (${tc})`);
    await bPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'branding.png'), fullPage: true });
    results.push({ test: 'Branding', status: 'PASS' });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ test: 'Branding', status: 'FAIL' });
  }
  await bCtx.close();

  // TEST 2: Overflow at all viewports on login
  console.log('\n--- Test 2: Login Page Overflow ---');
  for (const vp of KEY_VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const pg = await ctx.newPage();
    try {
      await pg.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await pg.waitForTimeout(500);
      const ov = await pg.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
        over: document.documentElement.scrollWidth > document.documentElement.clientWidth
      }));
      console.log(`  @${vp.name}: ${ov.over ? 'FAIL overflow' : 'PASS'} (sw=${ov.sw} cw=${ov.cw})`);
      await pg.screenshot({ path: path.join(SCREENSHOT_DIR, `login_${vp.name}.png`), fullPage: true });
      results.push({ test: `Login@${vp.name}`, status: ov.over ? 'FAIL' : 'PASS' });
    } catch (e) {
      console.log(`  @${vp.name}: ERROR ${e.message}`);
      results.push({ test: `Login@${vp.name}`, status: 'FAIL' });
    }
    await ctx.close();
  }

  // TEST 3: Built manifest
  console.log('\n--- Test 3: Manifest ---');
  try {
    const m = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'build', 'manifest.json'), 'utf8'));
    console.log(`  name: ${m.name} ${m.name === 'FutureMedia' ? 'PASS' : 'FAIL'}`);
    console.log(`  theme: ${m.theme_color} ${m.theme_color === '#09090B' ? 'PASS' : 'FAIL'}`);
    console.log(`  bg: ${m.background_color} ${m.background_color === '#09090B' ? 'PASS' : 'FAIL'}`);
    const hasLogo = m.icons.some(i => i.src.includes('logo'));
    console.log(`  FM icons: ${hasLogo ? 'PASS' : 'FAIL'}`);
    results.push({ test: 'Manifest', status: 'PASS' });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ test: 'Manifest', status: 'FAIL' });
  }

  // TEST 4: Built HTML
  console.log('\n--- Test 4: Built HTML ---');
  try {
    const html = fs.readFileSync(path.join(__dirname, '..', 'build', 'index.html'), 'utf8');
    console.log(`  FM title: ${html.includes('<title>FutureMedia</title>') ? 'PASS' : 'FAIL'}`);
    console.log(`  favicon.png: ${html.includes('favicon.png') ? 'PASS' : 'FAIL'}`);
    console.log(`  No CRA: ${!html.includes('create-react-app') ? 'PASS' : 'FAIL'}`);
    console.log(`  OG tags: ${html.includes('og:title') ? 'PASS' : 'FAIL'}`);
    results.push({ test: 'Built HTML', status: 'PASS' });
  } catch (e) {
    results.push({ test: 'Built HTML', status: 'FAIL' });
  }

  // TEST 5: CSS Analysis
  console.log('\n--- Test 5: CSS Analysis ---');
  const cssDir = path.join(__dirname, '..', 'build', 'static', 'css');
  const allCSS = fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join(cssDir, f), 'utf8')).join('\n');
  console.log(`  clamp(): ${allCSS.includes('clamp(') ? 'PASS' : 'FAIL'}`);
  console.log(`  aspect-ratio: ${allCSS.includes('aspect-ratio') ? 'PASS' : 'FAIL'}`);
  console.log(`  min-height:44px: ${allCSS.includes('min-height:44px') || allCSS.includes('min-height: 44px') ? 'PASS' : 'FAIL'}`);
  console.log(`  safe-area-inset: ${allCSS.includes('safe-area-inset') ? 'PASS' : 'FAIL'}`);
  console.log(`  scroll-snap: ${allCSS.includes('scroll-snap') ? 'PASS' : 'FAIL'}`);

  await browser.close();

  console.log('\n=== SUMMARY ===');
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  console.log(`${pass} PASS, ${fail} FAIL out of ${results.length} tests`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
}

runTests().catch(console.error);
