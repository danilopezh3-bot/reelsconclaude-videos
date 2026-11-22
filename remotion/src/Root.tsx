import React from 'react';
import {Composition} from 'remotion';
import {Promo, DUR_FRAMES} from './Promo';
import {Proceso, P_FRAMES} from './Proceso';

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={DUR_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Proceso" component={Proceso} durationInFrames={P_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
