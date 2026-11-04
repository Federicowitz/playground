const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
let errors = [], scripts = 0, pages = 0, refs = 0;
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry => {
 if(entry.name.startsWith('.') || entry.name==='node_modules') return [];
 const file = path.join(dir,entry.name);
 return entry.isDirectory() ? walk(file) : [file];
});
function syntax(source,label){
 const result = spawnSync(process.execPath,['--check','--input-type=module'],{input:source,encoding:'utf8'});
 scripts++;
 if(result.status!==0) errors.push(`${label}: ${result.stderr || result.error}`);
}
function localRef(file,ref){
 if(!ref || ref.startsWith('#') || /^(https?:|data:|mailto:|javascript:)/.test(ref) || ref.includes('${')) return;
 const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
 const target = path.resolve(clean.startsWith('/') ? root : path.dirname(file),'.' + (clean.startsWith('/') ? clean : path.sep+clean));
 refs++;
 if(!fs.existsSync(target)) errors.push(`Missing local reference in ${path.relative(root,file)}: ${ref}`);
 else if(fs.statSync(target).isDirectory()&&!fs.existsSync(path.join(target,'index.html'))) errors.push(`Directory without index: ${ref}`);
}
for(const file of walk(root)){
 const ext = path.extname(file);
 if(ext==='.js') syntax(fs.readFileSync(file,'utf8'),path.relative(root,file));
 if(ext!=='.html') continue;
 const html=fs.readFileSync(file,'utf8'); pages++;
 if((html.match(/<title>/g)||[]).length!==1) errors.push(`${file}: expected one title`);
 if(!html.includes('rel="canonical"')) errors.push(`${file}: missing canonical`);
 for(const match of html.matchAll(/<(?:script|link|img|a)\b[^>]*?\b(?:src|href)=["']([^"']*)["'][^>]*>/g)) localRef(file,match[1]);
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  if(/\bsrc=/.test(match[1]) || /type=["'](?:importmap|application\/ld\+json)/.test(match[1])) continue;
  if(match[2].trim()) syntax(match[2],`${path.relative(root,file)} inline`);
 }
 if(file===path.join(root,'index.html')) for(const match of html.matchAll(/\b(?:img|url):'([^']+)'/g)) localRef(file,match[1]);
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`OK: ${pages} HTML pages, ${scripts} JavaScript syntax checks, ${refs} local references.`);
