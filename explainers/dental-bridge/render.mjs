import {chromium} from '@playwright/test';
import {writeFileSync,readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('.',import.meta.url));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:790}});page.on('pageerror',e=>console.error(e));
await page.route('https://szlaci3-bookworm.netlify.app/dental-render', route=>route.fulfill({contentType:'text/html',body:readFileSync(dir+'dental-bridge.html','utf8')}));await page.goto('https://szlaci3-bookworm.netlify.app/dental-render');await page.evaluate(()=>window.ready);
for(const t of[3.3,10,19,27.5]){await page.evaluate(t=>seek(t),t);await page.locator('canvas').screenshot({path:dir+`preview-${t}.png`});}
const a=await page.evaluate(async()=>{const a=await SOUND.renderOffline(scoreSound,DURATION,48000,{voiceover:false});let u=new Uint8Array(a.inter.buffer),s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode(...u.subarray(i,i+32768));return{data:btoa(s),peak:a.peak};});writeFileSync('/tmp/dental-audio.f32',Buffer.from(a.data,'base64'));console.log('Audio peak',a.peak);
const wav=spawn('ffmpeg',['-v','error','-y','-f','f32le','-ar','48000','-ac','2','-i','/tmp/dental-audio.f32','-c:a','pcm_s16le',dir+'effects.wav']);await once(wav,'close');
const ff=spawn('ffmpeg',['-y','-f','image2pipe','-vcodec','mjpeg','-r','30','-i','pipe:0','-f','f32le','-ar','48000','-ac','2','-i','/tmp/dental-audio.f32','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-t','30',dir+'dental-bridge.mp4'],{stdio:['pipe','ignore','inherit']});
for(let i=0;i<900;i++){const data=await page.evaluate(t=>{window.seek(t);return document.querySelector('canvas').toDataURL('image/jpeg',.96).split(',')[1];},i/30);if(!ff.stdin.write(Buffer.from(data,'base64')))await once(ff.stdin,'drain');if(i%90===0)console.log('Frame',i);}
ff.stdin.end();await once(ff,'close');await browser.close();
