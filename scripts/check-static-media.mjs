// Phase 1 media-integrity audit: node scripts/check-static-media.mjs [--strict]
// Lists local fallback media URLs that are referenced in code but absent in the
// repository. Published R2 media can supply images separately; missing local
// files should never be interpreted as proof of broken published content.
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sources=[
  'index.html','discos.html','sessions.html','eventos.html','archivo.html','data.js',
  'home-collage.js','discos.js','app.js','editorial.js','calendar-content.js',
  'home-flow.layout.css','home-flow.releases.css','home-flow.archive.css',
  'home-flow.refinements.css','home-flow.motion.css'
];
const references=new Map();
for(const source of sources){
  const p=resolve(root,source);
  if(!existsSync(p))continue;
  const text=readFileSync(p,'utf8');
  for(const match of text.matchAll(/assets\/(?:images|audio|brand)\/[\w./-]+\.(?:webp|png|jpe?g|svg|mp3|wav|ogg|m4a)/gi)){
    const path=match[0];
    if(!references.has(path))references.set(path,new Set());
    references.get(path).add(source);
  }
}
const entries=[...references].map(([path,seenIn])=>({
  path,exists:existsSync(resolve(root,path)),sources:[...seenIn]
})).sort((a,b)=>a.path.localeCompare(b.path));
const missing=entries.filter(row=>!row.exists);
const report={
  generatedAt:new Date().toISOString(), scannedSources:sources.length,
  referencedPaths:entries.length, localMissing:missing.length,
  note:'Static repository check only; Cloudflare R2 may supply published imagery independently.',
  entries
};
const output=resolve(root,'qa-results');
mkdirSync(output,{recursive:true});
writeFileSync(resolve(output,'media-report.json'),JSON.stringify(report,null,2)+'\n');
for(const item of missing)console.warn('MISSING LOCAL FALLBACK:',item.path,'(referenced in '+item.sources.join(', ')+')');
console.log('Found',entries.length,'local asset references;',missing.length,'missing in repository.');
console.log('Saved qa-results/media-report.json');
if(missing.length&&process.argv.includes('--strict'))process.exitCode=1;
