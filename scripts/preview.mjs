// پیش‌نمایش سریع: برای چند seed، از وسط هر صحنه یک فریم می‌گیرد (برای تست، نه برای GitHub)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const [jobPath, outDir, ...seeds] = process.argv.slice(2);
const job = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
fs.mkdirSync(outDir, {recursive: true});
const browserExecutable = process.env.BROWSER_EXECUTABLE || null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
for (const seed of seeds) {
  const comp = await selectComposition({serveUrl, id: 'Reel', inputProps: {...job, seed: Number(seed)}, browserExecutable});
  const plan = comp.props.plan;
  console.log(seed, plan.segments.map((s) => `${s.type}(${s.transition})`).join(' → '), plan.total, plan.overlay, 'pulse', plan.pulse);
  for (const [i, s] of plan.segments.entries()) {
    for (const off of [5, Math.floor(s.dur * 0.55)]) {
      await renderStill({composition: comp, serveUrl, inputProps: comp.props, browserExecutable, frame: s.from + off, output: path.join(outDir, `s${seed}_${i}_${off}.jpeg`), imageFormat: 'jpeg', scale: 0.25});
    }
  }
}
