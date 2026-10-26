import React from 'react';
import {Composition, Still} from 'remotion';
import {defaultProps} from './brand';
import {Post, Story1, Story2} from './Stills';
import {Reel, REEL_FPS, REEL_FRAMES} from './Reel';

export const Root: React.FC = () => (
  <>
    <Still id="Post" component={Post as any} width={1080} height={1350} defaultProps={defaultProps} />
    <Still id="Story1" component={Story1 as any} width={1080} height={1920} defaultProps={defaultProps} />
    <Still id="Story2" component={Story2 as any} width={1080} height={1920} defaultProps={defaultProps} />
    <Composition id="Reel" component={Reel as any} width={1080} height={1920} fps={REEL_FPS} durationInFrames={REEL_FRAMES} defaultProps={defaultProps} />
  </>
);
