// Responsive visual QA: node scripts/qa-responsive.mjs http://localhost:8788 --screenshots
// Requires Playwright + a Chromium browser: npm install --no-save playwright
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  console.error('Playwright is required. Install with: npm install --no-save playwright');
  process.exit(2);
}
const base = (process.argv.find(a => /^https?:\/\//.test(a)) || 'http://localhost:8788').replace(/\/$/, '');
const screenshots = process.argv.includes('--screenshots');
const pages = ['index.html', 'discos.html', 'sessions.html', 'eventos.html', 'archivo.html'];
const sizes = [
  { name:'phone-320', width:320, height:700, touch:true },
  { name:'phone-375', width:375, height:812, touch:true },
  { name:'phone-430', width:430, height:932, touch:true },
  { name:'tablet-portrait', width:768, height:1024, touch:true },
  { name:'tablet-landscape', width:1024, height:768, touch:true },
  { name:'laptop-short', width:1280, height:600, touch:false },
  { name:'laptop-compact', width:1366, height:768, touch:false },
  { name:'desktop', width:1440, height:900, touch:false }
];
const output = resolve('qa-results');
await mkdir(output, { recursive:true });
const browser = await chromium.launch({ headless:true });
const results = [];
try {
  for (const size of sizes) {
    const context = await browser.newContext({
      viewport:{ width:size.width, height:size.height },
      isMobile:size.width<=430,
      hasTouch:size.touch,
      deviceScaleFactor:1,
      reducedMotion:'no-preference'
    });
    for (const pathname of pages) {
      const page = await context.newPage();
      const errors = [];
      const missingAssets = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        if (response.status() >= 400 && /\.(?:css|js|svg|webp|png|jpe?g)(?:\?|$)/i.test(response.url()))
          missingAssets.push({ status:response.status(), url:response.url() });
      });
      let status = null, loadError = null;
      try {
        const response = await page.goto(base + '/' + pathname, { waitUntil:'domcontentloaded', timeout:30000 });
        status = response?.status() ?? null;
        await page.waitForTimeout(500);
      } catch (error) { loadError = String(error); }
      const audit = loadError ? null : await page.evaluate(() => {
        const rect = element => {
          const box=element?.getBoundingClientRect();
          return box ? { x:Math.round(box.x), y:Math.round(box.y), width:Math.round(box.width), height:Math.round(box.height), right:Math.round(box.right), bottom:Math.round(box.bottom) } : null;
        };
        const visible = element => {
          if (!element) return false;
          const style=getComputedStyle(element), b=element.getBoundingClientRect();
          return style.display!=='none' && style.visibility!=='hidden' && b.width>0 && b.height>0;
        };
        const header=document.querySelector('.site-header,.editorial-header');
        const footer=document.querySelector('.site-footer,.editorial-footer');
        const emblem=footer?.querySelector('.footer-laser-etch');
        const art=rect(emblem), foot=rect(footer);
        const footerOverflow=visible(footer)&&art&&foot
          ? Math.max(0, foot.x-art.x, foot.y-art.y, art.right-foot.right, art.bottom-foot.bottom) : 0;
        const documents=[...document.querySelectorAll('[id]')], seen=new Set(), duplicateIds=[];
        for(const el of documents){if(seen.has(el.id))duplicateIds.push(el.id);seen.add(el.id);}
        const brokenImages=[...document.images].filter(img=>
          visible(img)&&img.complete&&img.currentSrc&&img.naturalWidth===0
        ).map(img=>img.currentSrc).slice(0,12);
        const headerLinks=[...header?.querySelectorAll('a')||[]].filter(visible).map(el=>({text:el.textContent.trim().slice(0,35),box:rect(el)}));
        const buttons=[...document.querySelectorAll('button,a,[role="button"]')].filter(visible);
        const unnamedButtons=buttons.filter(el=>el.tagName==='BUTTON' &&
          !(el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent.trim()||el.querySelector('img[alt]'))
        ).length;
        const smallTargets=buttons.filter(el=>{
          const b=el.getBoundingClientRect();
          return b.width<40||b.height<40;
        }).length;
        const scrollWidth=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth);
        const footerFit=visible(footer) && innerWidth>720 && header ?
          (foot.height <= innerHeight-header.getBoundingClientRect().height+3) : null;
        return {
          title:document.title,
          viewport:{width:innerWidth,height:innerHeight},
          scrollWidth, horizontalOverflow:Math.max(0,scrollWidth-innerWidth),
          header:rect(header), headerLinks,
          footer:foot, footerArt:art, footerArtOverflow:Math.round(footerOverflow),
          footerFit,
          brokenImages, duplicateIds:[...new Set(duplicateIds)],
          unnamedButtons, smallTargets,
          galleryCount:document.querySelectorAll('.sleeve').length,
          bagCount:document.querySelectorAll('.shared-bag').length
        };
      });
      let touchSelection=null;
      if (audit && size.touch && pathname==='index.html') {
        const surface=page.locator('.footer-touch-surface');
        if (await surface.count() && await surface.isVisible()) {
          try {
            await surface.scrollIntoViewIfNeeded();
            const box=await surface.boundingBox();
            if(box && box.width>10 && box.height>10){
              await page.touchscreen.tap(box.x+box.width/2,box.y+Math.min(60,box.height/2));
              touchSelection=await page.evaluate(()=>window.getSelection()?.toString()||'');
            }
          } catch (error) { touchSelection='QA interaction failed: '+String(error); }
        }
      }
      if(screenshots && audit) {
        try { await page.screenshot({path:resolve(output,size.name+'-'+pathname.replace('.html','')+'.png'),fullPage:true,animations:'disabled'}); }
        catch(error) { errors.push('Screenshot: '+String(error)); }
      }
      const failures = [];
      if(loadError || (status && status>=400))failures.push('page-load-failed');
      if(audit?.horizontalOverflow>3)failures.push('horizontal-overflow');
      if(audit?.duplicateIds.length)failures.push('duplicate-ids');
      if(audit?.brokenImages.length)failures.push('broken-visible-images');
      if(audit?.footerFit===false)failures.push('footer-taller-than-available-viewport');
      if(audit?.footerArtOverflow>5)failures.push('footer-artwork-outside-bounds');
      if(missingAssets.length)failures.push('missing-assets');
      if(errors.length)failures.push('javascript-errors');
      results.push({page:pathname,device:size.name,status,loadError,failures,errors,missingAssets,touchSelection,audit});
      console.log((failures.length?'FAIL':'OK')+' '+size.name+' / '+pathname+(failures.length?' ['+failures.join(', ')+']':''));
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}
const report={
  base, generatedAt:new Date().toISOString(),
  checks:results.length, failures:results.filter(r=>r.failures.length).length,
  results
};
await writeFile(resolve(output,'responsive-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('Saved qa-results/responsive-report.json');
console.log('NOTE: Browser QA is a smoke test, not proof of visual equivalence. Review screenshots manually.');
process.exitCode=report.failures?1:0;
