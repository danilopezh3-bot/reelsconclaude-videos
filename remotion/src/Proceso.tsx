import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing, delayRender, continueRender,
} from 'remotion';
import data from './proceso.json';
import {CLAUDE_PATH, CLAUDE_COLOR, ELEVEN_PATH} from './logos';

// Reel "así se hace": voz de ElevenLabs (toma 1), tiempos de palabra de ElevenLabs Scribe.
const FPS = 30;
export const P_DUR = 22.0;
export const P_FRAMES = Math.round(P_DUR * FPS);

const C = {blue: '#2A44F5', deep: '#0A0C14', yellow: '#FFD84D', ink: '#12141B', white: '#FFFFFF', light: '#F2F4F8'};
const FONT = 'Bricolage';
type W = {w: string; s: number; e: number};
const words = data.words as W[];
const rms = data.rms as number[];
const f = (t: number) => Math.round(t * FPS);
const norm = (s: string) => s.toLowerCase().replace(/[^\wáéíóúñü]/g, '');
const at = (w: string, nth = 0) => words.filter((x) => norm(x.w) === w)[nth];

const T = {
  cnt: [0.15, at('tres').s], sin: at('sin').s, editar: at('editar').s, nada: at('nada').s, hookEnd: 5.35,
  paso: 5.42, typeS: 5.62, logo1: at('claude').s, p1End: 8.25,
  list: [8.42, at('comprueba').s, at('escribe').s], listEnd: 12.15,
  eleven: at('elevenlabs').s, elEnd: 14.08,
  claude3: at('claude', 2).s, cards: [at('anima').s, at('cada', 1).s, at('escena').s], animEnd: 18.35,
  tu: at('tú').s, link: at('link').s,
};

// ---------- utilidades ----------
const stroke = (px: number, color = C.ink) => ({
  WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const,
  textShadow: `0 ${px * 0.6}px ${px * 1.6}px rgba(0,0,0,.35)`,
});
const usePop = (s: number, damping = 11) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  return spring({frame: frame - f(s), fps, config: {damping, stiffness: 180, mass: 0.7}});
};
const useOut = (e: number, d = 0.25) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [f(e - d), f(e)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};
const Center: React.FC<{y: number; children: React.ReactNode}> = ({y, children}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)'}}>{children}</div>
);
const Pill: React.FC<{bg: string; color: string; size: number; children: React.ReactNode; style?: React.CSSProperties}> = ({bg, color, size, children, style}) => (
  <div style={{background: bg, color, fontFamily: FONT, fontSize: size, lineHeight: 1, padding: `${size * 0.32}px ${size * 0.5}px`,
    borderRadius: size * 0.28, boxShadow: '0 14px 30px -12px rgba(0,0,0,.45)', whiteSpace: 'nowrap', ...style}}>{children}</div>
);
const fmt = (n: number) => Math.round(n).toLocaleString('es-ES').replace(/,/g, '.');
const ReelCard: React.FC<{src: string; w: number; startFrom: number; radius?: number}> = ({src, w, startFrom, radius = 30}) => (
  <div style={{width: w, height: w * 16 / 9, borderRadius: radius, overflow: 'hidden', background: '#000',
    boxShadow: '0 30px 60px -20px rgba(5,10,40,.6)', border: '6px solid #0E1018'}}>
    <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  </div>
);
const ClaudeMark: React.FC<{size: number}> = ({size}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.28, background: C.white, borderRadius: size * 0.42,
    padding: `${size * 0.26}px ${size * 0.5}px ${size * 0.26}px ${size * 0.32}px`, boxShadow: '0 18px 40px -16px rgba(5,10,40,.55)'}}>
    <svg viewBox="0 0 24 24" width={size} height={size}><path d={CLAUDE_PATH} fill={CLAUDE_COLOR} /></svg>
    <span style={{fontFamily: FONT, fontSize: size * 0.78, color: C.ink, lineHeight: 1}}>Claude</span>
  </div>
);
const ElevenMark: React.FC<{size: number}> = ({size}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.3, background: C.white, borderRadius: size * 0.42,
    padding: `${size * 0.28}px ${size * 0.5}px ${size * 0.28}px ${size * 0.36}px`, boxShadow: '0 18px 40px -16px rgba(5,10,40,.55)'}}>
    <svg viewBox="0 0 24 24" width={size * 0.9} height={size * 0.9}><path d={ELEVEN_PATH} fill="#000" /></svg>
    <span style={{fontFamily: FONT, fontSize: size * 0.72, color: '#000', lineHeight: 1}}>ElevenLabs</span>
  </div>
);

// ---------- fondo ----------
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = (frame * 1.4) % 48;
  const e = rms[frame] ?? 0;
  const gx = 50 + Math.sin(frame / 40) * 18, gy = 34 + Math.cos(frame / 55) * 10;
  return (
    <AbsoluteFill style={{background: C.deep}}>
      <AbsoluteFill style={{background: `radial-gradient(${900 + e * 260}px ${780 + e * 220}px at ${gx}% ${gy}%, rgba(42,68,245,${0.42 + e * 0.25}), transparent 70%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(620px 520px at ${100 - gx}% 88%, rgba(255,216,77,${0.10 + e * 0.08}), transparent 70%)`}} />
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,.09) 2px, transparent 2.6px)', backgroundSize: '48px 48px',
        backgroundPosition: `0 ${drift}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(1300px 1700px at 50% 45%, transparent 55%, rgba(0,0,0,.55))'}} />
    </AbsoluteFill>
  );
};

// entrada con zoom y desenfoque, salida rápida, y un leve empuje de cámara continuo
const Scene: React.FC<{s: number; e: number; children: React.ReactNode; dir?: number}> = ({s, e, children, dir = 1}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const pin = spring({frame: frame - f(s), fps, config: {damping: 16, stiffness: 210, mass: 0.6}});
  const pout = interpolate(frame, [f(e) - 6, f(e)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const push = interpolate(frame, [f(s), f(e)], [1, 1.06], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scale = (1.22 - 0.22 * pin) * push * (1 - 0.12 * pout);
  return (
    <AbsoluteFill style={{transform: `scale(${scale}) translateX(${(1 - pin) * 60 * dir - pout * 140 * dir}px) rotate(${(1 - pin) * 2.5 * dir}deg)`,
      filter: `blur(${(1 - pin) * 14 + pout * 16}px)`, opacity: Math.min(1, pin * 2) * (1 - pout)}}>{children}</AbsoluteFill>
  );
};
// destello y sacudida en cada cambio de escena
const Flash: React.FC<{at: number[]}> = ({at}) => {
  const frame = useCurrentFrame();
  const o = Math.max(0, ...at.map((t) => interpolate(frame, [f(t), f(t) + 5], [0.22, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (frame >= f(t) ? 1 : 0)));
  return <AbsoluteFill style={{background: '#fff', opacity: o, mixBlendMode: 'overlay'}} />;
};

// ---------- 0: gancho ----------
const Hook: React.FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const out = 1;
  const n = interpolate(frame, [f(T.cnt[0]), f(T.cnt[1])], [0, 3000000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const done = frame >= f(T.cnt[1]);
  const bump = done ? spring({frame: frame - f(T.cnt[1]), fps, config: {damping: 8}}) : 0;
  const cards = [{src: 'reel1.mp4', from: 240, x: 230, r: -9}, {src: 'reel3.mp4', from: 300, x: 850, r: 9}, {src: 'reel2.mp4', from: 360, x: 540, r: 0}];
  const pSin = usePop(T.sin); const strike = interpolate(frame, [f(T.editar), f(T.editar) + 7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pNada = usePop(T.nada, 7); const t = frame - f(T.nada);
  const shake = t >= 0 && t < 10 ? Math.sin(t * 2.4) * (10 - t) * 1.6 : 0;
  return (
    <AbsoluteFill style={{opacity: out}}>
      {cards.map((c, j) => {
        const p = spring({frame: frame - j * 4, fps, config: {damping: 13, stiffness: 140}});
        return (
          <div key={c.src} style={{position: 'absolute', left: c.x, top: j === 2 ? 110 : 190, transform: `translateX(-50%) translateY(${(1 - p) * 500}px) rotate(${c.r * p}deg)`,
            zIndex: j === 2 ? 2 : 1, filter: j === 2 ? 'none' : 'brightness(.8)'}}>
            <ReelCard src={c.src} w={j === 2 ? 380 : 320} startFrom={c.from} radius={34} />
          </div>
        );
      })}
      <Center y={980}>
        <div style={{fontFamily: FONT, fontSize: 150, color: C.white, ...stroke(11), transform: `scale(${done ? 1 + 0.14 * Math.sin(Math.min(1, bump) * Math.PI) : 1})`}}>+{fmt(n)}</div>
      </Center>
      <Center y={1100}><Pill bg={C.yellow} color={C.ink} size={46}>VISTAS</Pill></Center>
      <Center y={1270}>
        <div style={{display: 'flex', gap: 26, alignItems: 'center', transform: `scale(${pSin})`}}>
          <span style={{fontFamily: FONT, fontSize: 84, color: C.white, ...stroke(8)}}>SIN</span>
          <span style={{position: 'relative', fontFamily: FONT, fontSize: 84, color: C.white, ...stroke(8)}}>
            EDITAR
            <span style={{position: 'absolute', left: -8, right: -8, top: '52%', height: 14, background: C.yellow, borderRadius: 7,
              transform: `scaleX(${strike}) rotate(-4deg)`, transformOrigin: 'left center', boxShadow: '0 3px 0 rgba(0,0,0,.35)'}} />
          </span>
          <span style={{fontFamily: FONT, fontSize: 112, color: C.yellow, ...stroke(10), transform: `scale(${pNada}) translateX(${shake}px)`, display: 'inline-block'}}>NADA</span>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// ---------- 1: le digo a Claude el tema ----------
const Paso1: React.FC = () => {
  const frame = useCurrentFrame();
  const out = 1;
  const pPaso = usePop(T.paso); const pBox = usePop(T.typeS - 0.15, 13); const pLogo = usePop(T.logo1, 9);
  const text = 'Hazme un vídeo sobre por qué el mar es salado';
  const n = Math.max(0, Math.min(text.length, Math.floor((frame - f(T.typeS)) / (0.04 * FPS)) + 1));
  const caret = Math.floor(frame / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Center y={300}><div style={{transform: `scale(${pPaso}) rotate(${-3 * pPaso}deg)`}}><Pill bg={C.yellow} color={C.ink} size={60}>PASO 1</Pill></div></Center>
      <Center y={560}><div style={{transform: `scale(${pLogo}) rotate(${(1 - pLogo) * -12}deg)`}}><ClaudeMark size={110} /></div></Center>
      <Center y={860}>
        <div style={{transform: `translateY(${(1 - pBox) * 60}px)`, opacity: pBox, width: 900, background: C.white, borderRadius: 34,
          padding: '34px 38px', boxShadow: '0 24px 50px -18px rgba(5,10,40,.55)', display: 'flex', alignItems: 'flex-end', gap: 20}}>
          <div style={{fontFamily: FONT, fontSize: 56, lineHeight: 1.15, color: C.ink, flex: 1, minHeight: 130}}>
            {text.slice(0, n)}<span style={{opacity: caret ? 1 : 0, color: C.blue}}>|</span>
          </div>
          <div style={{width: 76, height: 76, borderRadius: 38, background: CLAUDE_COLOR, display: 'grid', placeItems: 'center', color: C.white, fontFamily: FONT, fontSize: 42}}>↑</div>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// ---------- 2: investiga, comprueba, escribe ----------
const Lista: React.FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const out = 1; const pIn = usePop(T.p1End, 13);
  const labels = ['INVESTIGA', 'COMPRUEBA CADA DATO', 'ESCRIBE EL GUION'];
  const lines = [0.92, 0.78, 0.86, 0.6];
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Center y={210}><div style={{transform: `scale(${pIn})`}}><ClaudeMark size={84} /></div></Center>
      {labels.map((l, i) => {
        const p = spring({frame: frame - f(T.list[i]), fps, config: {damping: 12, stiffness: 170}});
        const tick = spring({frame: frame - f(T.list[i]) - 6, fps, config: {damping: 7}});
        return (
          <Center key={l} y={430 + i * 190}>
            <div style={{transform: `translateX(${(1 - p) * -900}px)`, opacity: p > 0.01 ? 1 : 0, display: 'flex', alignItems: 'center', gap: 24, width: 920,
              background: C.white, borderRadius: 30, padding: '24px 34px 24px 24px', boxShadow: '0 18px 40px -16px rgba(5,10,40,.5)'}}>
              <div style={{width: 70, height: 70, borderRadius: 20, background: C.yellow, display: 'grid', placeItems: 'center',
                fontFamily: FONT, fontSize: 44, color: C.ink, transform: `scale(${tick})`}}>✓</div>
              <div style={{fontFamily: FONT, fontSize: 54, color: C.ink, whiteSpace: 'nowrap'}}>{l}</div>
            </div>
          </Center>
        );
      })}
      {/* el guion se escribe */}
      <Center y={1170}>
        <div style={{width: 920, background: 'rgba(255,255,255,.12)', border: '3px solid rgba(255,255,255,.35)', borderRadius: 28, padding: '28px 32px',
          display: 'grid', gap: 18, opacity: interpolate(frame, [f(T.list[2]) - 3, f(T.list[2]) + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          <div style={{fontFamily: FONT, fontSize: 34, color: C.yellow}}>guion.txt</div>
          {lines.map((w, k) => (
            <div key={k} style={{height: 18, borderRadius: 9, background: 'rgba(255,255,255,.85)',
              width: `${100 * w * interpolate(frame, [f(T.list[2]) + k * 5, f(T.list[2]) + k * 5 + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)})}%`}} />
          ))}
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// ---------- 3: ElevenLabs pone la voz ----------
const Voz: React.FC = () => {
  const frame = useCurrentFrame();
  const out = 1; const p = usePop(T.eleven, 9);
  const bars = 27;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Center y={420}><div style={{transform: `scale(${p}) rotate(${(1 - p) * 10}deg)`}}><ElevenMark size={120} /></div></Center>
      <Center y={820}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, height: 420, opacity: p}}>
          {Array.from({length: bars}).map((_, i) => {
            const lag = Math.abs(i - (bars - 1) / 2);
            const e = rms[Math.max(0, frame - Math.round(lag * 0.8))] ?? 0;
            const shape = 1 - (lag / bars) * 1.1;
            const h = 26 + e * 360 * shape * (0.75 + 0.25 * Math.sin(i * 1.7 + frame * 0.35));
            return <div key={i} style={{width: 20, height: h, borderRadius: 10, background: i % 2 ? C.yellow : C.white}} />;
          })}
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// ---------- 4: Claude anima cada escena (trozos reales) ----------
const Anima: React.FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const out = 1; const pLogo = usePop(T.claude3, 10);
  const cards = [{src: 'reel1.mp4', from: 420, x: 225, r: -7}, {src: 'reel3.mp4', from: 480, x: 855, r: 7}, {src: 'reel2.mp4', from: 150, x: 540, r: 0}];
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Center y={200}><div style={{transform: `scale(${pLogo})`}}><ClaudeMark size={80} /></div></Center>
      {cards.map((c, j) => {
        const s = T.cards[j];
        const p = spring({frame: frame - f(s), fps, config: {damping: 12, stiffness: 150}});
        return (
          <div key={c.src} style={{position: 'absolute', left: c.x, top: j === 2 ? 330 : 400, zIndex: j === 2 ? 2 : 1,
            transform: `translateX(-50%) translateY(${(1 - p) * 140}px) rotate(${c.r * p}deg) scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 1.5)}}>
            <Sequence from={f(s)} layout="none"><ReelCard src={c.src} w={j === 2 ? 400 : 330} startFrom={c.from} radius={34} /></Sequence>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- 5: tú solo lo subes + link ----------
const Final: React.FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const pPhone = spring({frame: frame - f(T.animEnd - 0.05), fps, config: {damping: 13, stiffness: 140}});
  const pTu = usePop(T.tu); const outTu = useOut(T.link, 0.15);
  const pLink = usePop(T.link, 10); const bob = Math.sin((frame - f(T.link)) / 4) * 14;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 540, top: 150, transform: `translateX(-50%) translateY(${(1 - pPhone) * 700}px) rotate(${(1 - pPhone) * 8}deg)`}}>
        <Sequence from={f(T.animEnd - 0.05)} layout="none"><ReelCard src="reel1.mp4" w={430} startFrom={600} radius={46} /></Sequence>
      </div>
      <Center y={1120}><div style={{transform: `scale(${pTu}) rotate(${-3 * pTu}deg)`, opacity: outTu}}><Pill bg={C.yellow} color={C.ink} size={70}>TÚ SOLO LO SUBES</Pill></div></Center>
      <Center y={1060}><div style={{fontFamily: FONT, fontSize: 110, color: C.yellow, ...stroke(9), transform: `translateY(${bob}px) scale(${pLink})`}}>↓</div></Center>
      <Center y={1210}><div style={{transform: `scale(${pLink}) rotate(${-2 * pLink}deg)`}}><Pill bg={C.yellow} color={C.ink} size={78}>LINK EN MI BIO</Pill></div></Center>
    </AbsoluteFill>
  );
};

// ---------- subtítulos palabra a palabra ----------
type G = {ws: W[]; s: number; e: number};
const groups: G[] = (() => {
  const gs: W[][] = []; let cur: W[] = [];
  words.forEach((x, i) => {
    cur.push(x); const nx = words[i + 1];
    if (cur.length === 3 || /[.,:]$/.test(x.w.replace(/\.\.\.$/, '.')) || !nx || nx.s - x.e > 0.3) { gs.push(cur); cur = []; }
  });
  return gs.map((g, i) => {
    const nx = gs[i + 1]; let e = g[g.length - 1].e + 0.05; if (nx) e = Math.min(e + 0.25, nx[0].s);
    return {ws: g, s: g[0].s, e};
  });
})();
const Captions: React.FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); const t = frame / fps;
  const g = groups.find((x) => t >= x.s && t < x.e);
  if (!g) return null;
  const p = spring({frame: frame - f(g.s), fps, config: {damping: 14, stiffness: 220}});
  const clean = (w: string) => w.replace(/[.,:]/g, '').toUpperCase();
  const chars = g.ws.reduce((a, w) => a + clean(w.w).length, 0) + g.ws.length - 1;
  const fs = Math.min(86, Math.floor(940 / (chars * 0.7)));
  return (
    <Center y={1560}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 26, maxWidth: 980, transform: `translateY(${(1 - p) * 24}px) scale(${0.9 + 0.1 * p})`, opacity: p}}>
        {g.ws.map((w, k) => {
          const on = t >= w.s && (k + 1 < g.ws.length ? t < g.ws[k + 1].s : true);
          const wp = on ? spring({frame: frame - f(w.s), fps, config: {damping: 10, stiffness: 260}}) : 0;
          return <span key={k} style={{fontFamily: FONT, fontSize: fs, color: on ? C.yellow : C.white, ...stroke(8), display: 'inline-block', transform: `scale(${1 + 0.1 * wp})`}}>{clean(w.w)}</span>;
        })}
      </div>
    </Center>
  );
};

// ---------- composición ----------
export const Proceso: React.FC = () => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender('fuente'));
  useEffect(() => {
    const ff = new FontFace(FONT, `url(${staticFile('Bricolage-800.ttf')})`, {weight: '800'});
    ff.load().then((x) => { document.fonts.add(x); continueRender(handle); });
  }, [handle]);
  const hits = [T.cnt[1], T.nada, T.logo1, T.eleven, T.link];
  const k = Math.max(0, ...hits.map((t) => (frame >= f(t) && frame < f(t) + 9 ? (9 - (frame - f(t))) / 9 : 0)));
  const shakeX = Math.sin(frame * 2.7) * 14 * k, shakeY = Math.cos(frame * 3.1) * 10 * k;
  const black = interpolate(frame, [P_FRAMES - 21, P_FRAMES - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const seq = (s: number, e: number, el: React.ReactNode) => (frame >= f(s) - 1 && frame <= f(e) + 1 ? el : null);
  return (
    <AbsoluteFill style={{background: C.deep, fontWeight: 800}}>
      <Backdrop />
      <AbsoluteFill style={{transform: `translate(${shakeX}px, ${shakeY}px)`}}>
        {seq(0, T.hookEnd, <Scene s={0} e={T.hookEnd}><Hook /></Scene>)}
        {seq(T.hookEnd, T.p1End, <Scene s={T.hookEnd} e={T.p1End} dir={-1}><Paso1 /></Scene>)}
        {seq(T.p1End, T.listEnd, <Scene s={T.p1End} e={T.listEnd}><Lista /></Scene>)}
        {seq(T.listEnd, T.elEnd, <Scene s={T.listEnd} e={T.elEnd} dir={-1}><Voz /></Scene>)}
        {seq(T.elEnd, T.animEnd, <Scene s={T.elEnd} e={T.animEnd}><Anima /></Scene>)}
        {seq(T.animEnd, P_DUR, <Scene s={T.animEnd} e={P_DUR + 1} dir={-1}><Final /></Scene>)}
      </AbsoluteFill>
      <Flash at={[T.hookEnd, T.p1End, T.listEnd, T.elEnd, T.animEnd, T.nada, T.link]} />
      <Captions />
      <AbsoluteFill style={{background: '#000', opacity: black}} />
    </AbsoluteFill>
  );
};
