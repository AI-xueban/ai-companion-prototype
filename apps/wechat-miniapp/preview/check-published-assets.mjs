import {execFileSync} from 'node:child_process';
import {access} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=fileURLToPath(new URL('../../../',import.meta.url));
const output=process.argv[2];
if(!output)throw new Error('Pass the assembled miniapp website directory.');
const destination=resolve(output),prefix='apps/wechat-miniapp/';
const files=execFileSync('git',['ls-files','-z','--',prefix+'miniprogram/assets',prefix+'preview/assets'],{cwd:repo,encoding:'utf8'}).split('\0').filter(Boolean);
if(!files.length)throw new Error('No committed miniapp assets found.');
const missing=[];
await Promise.all(files.map(async file=>{
  const path=file.startsWith(prefix+'preview/')?file.slice((prefix+'preview/').length):file.slice(prefix.length);
  try{await access(resolve(destination,path));}catch{missing.push(path);}
}));
if(missing.length)throw new Error(`${missing.length} committed miniapp assets missing from ${relative(repo,destination)}: ${missing.slice(0,8).join(', ')}`);
console.log(`PASS published miniapp assets: ${files.length} committed pictures, documents and media present.`);
