import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [,, url, outDir, prefix, ...ys] = process.argv;  // node tools/scroll.mjs <url> <outDir> <prefix> <y1> <y2> ...
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new','--remote-debugging-port=9333','--use-angle=swiftshader','--enable-unsafe-swiftshader',
   '--hide-scrollbars','--window-size=1440,900',...(process.env.DPR ? ['--force-device-scale-factor=' + process.env.DPR] : []),`--user-data-dir=${outDir}/prof`,'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9333/json')).json()).find(t => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = {}; const logs = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending[d.id]) { pending[d.id](d.result); delete pending[d.id]; }
  if (d.method === 'Runtime.consoleAPICalled') logs.push(d.params.type + ': ' + d.params.args.map(a => a.value ?? a.description).join(' '));
  if (d.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + d.params.exceptionDetails.exception?.description); };
const send = (method, params = {}) => new Promise(r => { pending[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Page.navigate', { url }); await sleep(6000);
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result.value;
console.log('docHeight', await ev('document.documentElement.scrollHeight'), 'vh', await ev('innerHeight'));
for (const y of ys) {
  await ev(`document.documentElement.style.scrollBehavior='auto'; scrollTo(0, ${y}); scrollY`);
  await sleep(1500);
  console.log('y', y, '->', await ev('scrollY'));
  const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 50 });
  writeFileSync(`${outDir}/${prefix}${y}.jpg`, Buffer.from(data, 'base64'));
}
console.log(logs.join('\n'));
ws.close(); chrome.kill();
