// رندر هر چهار خروجی از روی job.json
// استفاده: node scripts/render.mjs job.json out/
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [jobPath = 'job.json', outDir = 'out'] = process.argv.slice(2);
const props = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
fs.mkdirSync(outDir, {recursive: true});
const browserExecutable = process.env.BROWSER_EXECUTABLE || null;
const only = (process.env.ONLY || 'Post,Story1,Story2,Reel').split(',');

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
for (const id of only) {
  const composition = await selectComposition({serveUrl, id, inputProps: props, browserExecutable});
  if (id === 'Reel') {
    // نقشهٔ ریلز (صحنه‌ها + زمان افکت‌ها) برای scripts/audio.py
    const plan = composition.props.plan;
    fs.writeFileSync(path.join(outDir, 'plan.json'), JSON.stringify(plan, null, 1));
    console.log('plan:', plan.segments.map((s) => `${s.type}(${s.transition})`).join(' → '), `| ${plan.total}f`, `| ${plan.overlay}`);
    await renderMedia({
      composition, serveUrl, codec: 'h264', inputProps: composition.props, browserExecutable,
      outputLocation: path.join(outDir, 'reel_silent.mp4'), crf: 18, x264Preset: 'veryfast', concurrency: process.env.CONCURRENCY ? Number(process.env.CONCURRENCY) : null,
    });
  } else {
    await renderStill({composition, serveUrl, inputProps: props, browserExecutable, output: path.join(outDir, `${id.toLowerCase()}.png`)});
  }
  console.log('rendered', id);
}
