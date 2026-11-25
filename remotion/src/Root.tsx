import React from 'react';
import {Composition} from 'remotion';
import {Promo, DUR_FRAMES} from './Promo';
import {Proceso, P_FRAMES} from './Proceso';
import {Proceso2, P2_FRAMES} from './Proceso2';

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={DUR_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Proceso" component={Proceso} durationInFrames={P_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Proceso2" component={Proceso2} durationInFrames={P2_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
