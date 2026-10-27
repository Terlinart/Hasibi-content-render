// ریلز: از روی «نقشه» (src/plan.ts) ساخته می‌شود؛ هر seed یک هوک، ترکیب صحنه، ترنزیشن، پالت و بافت متفاوت.
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {ACCENTS, ContentProps} from './brand';
import {useFonts} from './components';
import {FPS, makePlan, Plan, SceneType} from './plan';
import {HookDrop, HookGlitch, HookSlam, HookZoomType} from './scenes/hooks';
import {Checklist, Counter, Glass, Grid, Karaoke, Neon, Notify, Orbit, Poster} from './scenes/mids';
import {OutroCard, OutroMinimal, OutroStudio} from './scenes/outros';
import {Enter, Overlay, SceneProps} from './scenes/shared';

export const REEL_FPS = FPS;
export type ReelProps = ContentProps & {plan?: Plan};

const SCENES: Record<SceneType, React.FC<SceneProps>> = {
  slam: HookSlam,
  zoomType: HookZoomType,
  drop: HookDrop,
  glitch: HookGlitch,
  glass: Glass,
  neon: Neon,
  poster: Poster,
  notify: Notify,
  karaoke: Karaoke,
  orbit: Orbit,
  grid: Grid,
  checklist: Checklist,
  counter: Counter,
  studio: OutroStudio,
  minimal: OutroMinimal,
  card: OutroCard,
};

const OVERLAP = 10; // صحنهٔ قبلی چند فریم زیر ترنزیشن بعدی ادامه دارد

// ضرب‌آهنگ: روی هر بیت موزیک، کل تصویر کمی «تپش» دارد
const Pulse: React.FC<{plan: Plan; children: React.ReactNode}> = ({plan, children}) => {
  const f = useCurrentFrame();
  if (!plan.pulse) return <>{children}</>;
  const fpb = (FPS * 60) / plan.bpm;
  const k = Math.exp(-(f % fpb) / 3);
  return <AbsoluteFill style={{transform: `scale(${1 + 0.012 * k})`}}>{children}</AbsoluteFill>;
};

export const Reel: React.FC<ReelProps> = (props) => {
  useFonts();
  const plan = props.plan ?? makePlan(props);
  const ac = ACCENTS[plan.palette % ACCENTS.length];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Pulse plan={plan}>
        {plan.segments.map((s, i) => {
          const S = SCENES[s.type];
          const last = i === plan.segments.length - 1;
          return (
            <Sequence key={i} from={s.from} durationInFrames={s.dur + (last ? 0 : OVERLAP)}>
              <Enter t={s.transition}>
                <S p={props} ac={ac} dur={s.dur} v={s.v} />
              </Enter>
            </Sequence>
          );
        })}
      </Pulse>
      <Overlay kind={plan.overlay} ac={ac} />
    </AbsoluteFill>
  );
};
