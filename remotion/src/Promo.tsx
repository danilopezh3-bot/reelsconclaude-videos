import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing, delayRender, continueRender,
} from 'remotion';
import palabras from './palabras.json';

const FPS = 30;
export const DUR = 18.29;
export const DUR_FRAMES = Math.round(DUR * FPS);

const C = {blue: '#2A44F5', yellow: '#FFD84D', ink: '#12141B', white: '#FFFFFF'};
const FONT = 'Bricolage';

type W = {w: string; ph: number; ns: number; ne: number};
const words = palabras as unknown as W[];
const norm = (s: string) => s.toLowerCase().replace(/[^\wáéíóúñü]/g, '');
const find = (w: string, nth = 0) => words.filter((x) => norm(x.w) === w)[nth];
const f = (t: number) => Math.round(t * FPS);

// ---- tiempos (los mismos que los sonidos ya mezclados) ----
const T = {
  hookEnd: find('yo').ne + 0.1,
  cntS: 0.15,
  cntE: find('visitas').ne,
  iaS: find('inteligencia').ns, iaE: find('artificial').ne + 0.3,
  typeS: find('escribir').ns, typeE: find('frase').ne + 0.35,
  list: [find('investiga').ns, find('edita').ns, find('voz').ns], listE: find('voz').ne + 0.5,
  nadaS: find('absolutamente').ns, nadaHit: find('nada').ns, nadaE: find('nada').ne + 0.35,
  c2S: find('dos').ns, c2E: find('visitas', 1).ne, c2End: find('días').ne + 0.4, sieteS: find('siete').ns,
  g0: find('días').ne + 0.45, g1: find('link').ns - 0.02,
  linkS: find('link').ns,
};

// ---------- piezas ----------
const stroke = (px: number, color = C.ink) => ({
  WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const,
  textShadow: `0 ${px * 0.6}px ${px * 1.6}px rgba(0,0,0,.35)`,
});

const Pill: React.FC<{bg: string; color: string; size: number; children: React.ReactNode; style?: React.CSSProperties}> =
  ({bg, color, size, children, style}) => (
    <div style={{background: bg, color, fontFamily: FONT, fontSize: size, lineHeight: 1, padding: `${size * 0.32}px ${size * 0.5}px`,
      borderRadius: size * 0.28, boxShadow: '0 14px 30px -12px rgba(0,0,0,.45)', whiteSpace: 'nowrap', ...style}}>{children}</div>
  );

// pop con muelle a partir de un segundo dado
const usePop = (startSec: number, damping = 11) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  return spring({frame: frame - f(startSec), fps, config: {damping, stiffness: 180, mass: 0.7}});
};
const useOut = (endSec: number, durSec = 0.25) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [f(endSec - durSec), f(endSec)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};
const Center: React.FC<{y: number; children: React.ReactNode}> = ({y, children}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', alignItems: 'center',
    transform: 'translateY(-50%)'}}>{children}</div>
);
const fmt = (n: number) => Math.round(n).toLocaleString('es-ES').replace(/,/g, '.');
const useCount = (from: number, to: number, s: number, e: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [f(s), f(e)], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
};

const ReelCard: React.FC<{src: string; w: number; startFrom: number; radius?: number}> = ({src, w, startFrom, radius = 30}) => (
  <div style={{width: w, height: w * 16 / 9, borderRadius: radius, overflow: 'hidden', background: '#000',
    boxShadow: '0 30px 60px -20px rgba(10,15,50,.55)', border: '5px solid #0E1018'}}>
    <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  </div>
);

// ---------- escenas ----------
const Hook: React.FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const inS = spring({frame, fps, config: {damping: 14, stiffness: 160}});
  const out = useOut(T.hookEnd, 0.4);
  const n = useCount(0, 1400000, T.cntS, T.cntE);
  const done = frame >= f(T.cntE);
  const bump = done ? spring({frame: frame - f(T.cntE), fps, config: {damping: 8}}) : 0;
  return (
    <AbsoluteFill style={{opacity: Math.min(interpolate(frame, [0, 9], [0, 1]), out)}}>
      <div style={{position: 'absolute', left: '50%', top: 40, transform: `translateX(-50%) scale(${0.82 + 0.18 * inS}) rotate(${(1 - inS) * -6}deg)`}}>
        <ReelCard src="reel1.mp4" w={330} startFrom={0} radius={34} />
      </div>
      <Center y={560}>
        <div style={{fontFamily: FONT, fontSize: 104, color: C.white, ...stroke(9), transform: `scale(${done ? 1 + 0.12 * Math.sin(Math.min(1, bump) * Math.PI) : 1})`}}>
          {fmt(n)}
        </div>
      </Center>
      <Center y={645}><Pill bg={C.yellow} color={C.ink} size={40}>VISITAS</Pill></Center>
    </AbsoluteFill>
  );
};

const PopLabel: React.FC<{s: number; e: number; y: number; children: React.ReactNode; tilt?: number}> = ({s, e, y, children, tilt = -3}) => {
  const p = usePop(s); const out = useOut(e);
  return (
    <Center y={y}>
      <div style={{transform: `scale(${p}) rotate(${(1 - p) * tilt * 3 + tilt * p * 0.3}deg)`, opacity: out}}>{children}</div>
    </Center>
  );
};

const Typing: React.FC = () => {
  const frame = useCurrentFrame();
  const text = 'Hazme un vídeo sobre…';
  const n = Math.max(0, Math.min(text.length, Math.floor((frame - f(T.typeS)) / (0.045 * FPS)) + 1));
  const p = usePop(T.typeS, 13); const out = useOut(T.typeE);
  const caret = Math.floor(frame / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Center y={300}><div style={{transform: `scale(${p})`}}><Pill bg={C.yellow} color={C.ink} size={38}>TU ÚNICA FRASE</Pill></div></Center>
      <Center y={420}>
        <div style={{transform: `translateY(${(1 - p) * 40}px)`, opacity: p, width: 820, background: C.white, borderRadius: 28,
          padding: '30px 36px', boxShadow: '0 24px 50px -18px rgba(10,15,50,.45)', display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{fontFamily: FONT, fontSize: 52, color: C.ink, flex: 1}}>
            {text.slice(0, n)}<span style={{opacity: caret ? 1 : 0, color: C.blue}}>|</span>
          </div>
          <div style={{width: 64, height: 64, borderRadius: 32, background: C.blue, display: 'grid', placeItems: 'center',
            color: C.white, fontFamily: FONT, fontSize: 34}}>↑</div>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

const Checklist: React.FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const labels = ['INVESTIGA', 'EDITA', 'PONE LA VOZ'];
  const out = useOut(T.listE);
  return (
    <AbsoluteFill style={{opacity: out}}>
      {labels.map((l, i) => {
        const p = spring({frame: frame - f(T.list[i]), fps, config: {damping: 12, stiffness: 170}});
        return (
          <Center key={l} y={330 + i * 125}>
            <div style={{transform: `translateX(${(1 - p) * -700}px)`, display: 'flex', alignItems: 'center', gap: 18,
              background: C.white, borderRadius: 26, padding: '18px 30px 18px 18px', boxShadow: '0 18px 40px -16px rgba(10,15,50,.45)'}}>
              <div style={{width: 64, height: 64, borderRadius: 18, background: C.yellow, display: 'grid', placeItems: 'center',
                fontFamily: FONT, fontSize: 40, color: C.ink, transform: `scale(${spring({frame: frame - f(T.list[i]) - 6, fps, config: {damping: 7}})})`}}>✓</div>
              <div style={{fontFamily: FONT, fontSize: 58, color: C.ink}}>{l}</div>
            </div>
          </Center>
        );
      })}
    </AbsoluteFill>
  );
};

const Nada: React.FC = () => {
  const frame = useCurrentFrame();
  const p = usePop(T.nadaHit, 7); const out = useOut(T.nadaE);
  const t = frame - f(T.nadaHit);
  const shake = t >= 0 && t < 10 ? Math.sin(t * 2.4) * (10 - t) * 1.6 : 0;
  return (
    <Center y={520}>
      <div style={{fontFamily: FONT, fontSize: 190, color: C.yellow, ...stroke(12), opacity: out,
        transform: `scale(${p}) translateX(${shake}px) rotate(${shake * 0.15}deg)`}}>NADA</div>
    </Center>
  );
};

const Count2: React.FC = () => {
  const n = useCount(0, 2000000, T.c2S, T.c2E);
  const p = usePop(T.c2S, 13); const out = useOut(T.c2End);
  const p7 = usePop(T.sieteS, 9);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Center y={420}><div style={{fontFamily: FONT, fontSize: 128, color: C.white, ...stroke(10), transform: `scale(${p})`}}>+{fmt(n)}</div></Center>
      <Center y={530}><div style={{transform: `scale(${p})`}}><Pill bg={C.yellow} color={C.ink} size={40}>VISITAS</Pill></div></Center>
      <Center y={660}><div style={{transform: `scale(${p7}) rotate(${-3 * p7}deg)`}}><Pill bg={C.blue} color={C.white} size={70}>EN 7 DÍAS</Pill></div></Center>
    </AbsoluteFill>
  );
};

const Trio: React.FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const cards = [{src: 'reel1.mp4', from: 240, lab: '1,4 M'}, {src: 'reel3.mp4', from: 300, lab: '768 K'}, {src: 'reel2.mp4', from: 360, lab: '271 K'}];
  const out = useOut(T.g1, 0.2);
  return (
    <AbsoluteFill style={{opacity: out}}>
      {cards.map((c, j) => {
        const s = T.g0 + j * 0.28;
        const p = spring({frame: frame - f(s), fps, config: {damping: 12, stiffness: 150}});
        const rot = (j - 1) * 5;
        const x = 540 + (j - 1) * 320;
        return (
          <div key={c.src} style={{position: 'absolute', left: x, top: 120, transform: `translateX(-50%) translateY(${(1 - p) * 120}px) rotate(${rot * p}deg) scale(${0.6 + 0.4 * p})`,
            opacity: Math.min(1, p * 1.5), transformOrigin: 'bottom center', display: 'grid', justifyItems: 'center', gap: 22}}>
            <Sequence from={f(s)} layout="none"><ReelCard src={c.src} w={280} startFrom={c.from} /></Sequence>
            <Pill bg={C.yellow} color={C.ink} size={44}>{c.lab}</Pill>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Link: React.FC = () => {
  const frame = useCurrentFrame();
  const p = usePop(T.linkS, 10);
  const bob = Math.sin((frame - f(T.linkS)) / 4) * 14;
  return (
    <AbsoluteFill>
      <Center y={1240}><div style={{fontFamily: FONT, fontSize: 120, color: C.yellow, ...stroke(9), transform: `translateY(${bob}px) scale(${p})`}}>↓</div></Center>
      <Center y={1390}><div style={{transform: `scale(${p}) rotate(${-2 * p}deg)`}}><Pill bg={C.blue} color={C.white} size={74}>LINK EN MI BIO</Pill></div></Center>
    </AbsoluteFill>
  );
};

// ---------- subtítulos palabra a palabra ----------
type G = {ws: W[]; s: number; e: number};
const groups: G[] = (() => {
  const gs: W[][] = []; let cur: W[] = [];
  words.forEach((x, i) => {
    cur.push(x);
    const nx = words[i + 1];
    if (cur.length === 3 || /[.,]$/.test(x.w) || !nx || nx.ph !== x.ph) { gs.push(cur); cur = []; }
  });
  return gs.map((g, i) => {
    const nx = gs[i + 1];
    let e = g[g.length - 1].ne + 0.05; if (nx) e = Math.min(e + 0.25, nx[0].ns);
    return {ws: g, s: g[0].ns, e};
  });
})();

const Captions: React.FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const t = frame / fps;
  const g = groups.find((x) => t >= x.s && t < x.e);
  if (!g) return null;
  const p = spring({frame: frame - f(g.s), fps, config: {damping: 14, stiffness: 220}});
  const chars = g.ws.reduce((a, w) => a + w.w.replace(/[.,]/g, '').length, 0) + g.ws.length - 1;
  const fs = Math.min(84, Math.floor(960 / (chars * 0.6)));
  return (
    <Center y={1530}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 26, rowGap: 0, maxWidth: 980, transform: `translateY(${(1 - p) * 24}px) scale(${0.9 + 0.1 * p})`, opacity: p}}>
        {g.ws.map((w, k) => {
          const on = t >= w.ns && (k + 1 < g.ws.length ? t < g.ws[k + 1].ns : true);
          const wp = on ? spring({frame: frame - f(w.ns), fps, config: {damping: 10, stiffness: 260}}) : 0;
          return (
            <span key={k} style={{fontFamily: FONT, fontSize: fs, color: on ? C.yellow : C.white, ...stroke(8), transformOrigin: 'center',
              display: 'inline-block', transform: `scale(${1 + 0.1 * wp})`}}>{w.w.replace(/[.,]/g, '').toUpperCase()}</span>
          );
        })}
      </div>
    </Center>
  );
};

// ---------- composición ----------
export const Promo: React.FC = () => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender('fuente'));
  useEffect(() => {
    const ff = new FontFace(FONT, `url(${staticFile('Bricolage-800.ttf')})`, {weight: '800'});
    ff.load().then((x) => { document.fonts.add(x); continueRender(handle); });
  }, [handle]);
  const black = interpolate(frame, [DUR_FRAMES - 21, DUR_FRAMES - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const seq = (s: number, e: number, el: React.ReactNode) => (frame >= f(s) - 1 && frame <= f(e) + 1 ? el : null);
  return (
    <AbsoluteFill style={{background: '#000', fontWeight: 800}}>
      <OffthreadVideo src={staticFile('base.mp4')} muted />
      {seq(0, T.hookEnd, <Hook />)}
      {seq(T.iaS, T.iaE, <PopLabel s={T.iaS} e={T.iaE} y={420}><Pill bg={C.blue} color={C.white} size={88}>LA HIZO UNA IA</Pill></PopLabel>)}
      {seq(T.typeS, T.typeE, <Typing />)}
      {seq(T.list[0], T.listE, <Checklist />)}
      {seq(T.nadaS, T.nadaE, <Nada />)}
      {seq(T.c2S, T.c2End, <Count2 />)}
      {seq(T.g0, T.g1, <Trio />)}
      {seq(T.linkS, DUR, <Link />)}
      <Captions />
      <AbsoluteFill style={{background: '#000', opacity: black}} />
    </AbsoluteFill>
  );
};
