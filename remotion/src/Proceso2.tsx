import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, interpolateColors, spring, Easing, delayRender, continueRender,
} from 'remotion';
import data from './proceso2.json';
import {CLAUDE_PATH, CLAUDE_COLOR, ELEVEN_PATH} from './logos';

// Reel "así se hace" 2: "¿No sabes editar vídeos?".
// Ideas: textos que salen de una máscara, movimientos encadenados (lo que entra empuja a lo que sale),
// cámara que sigue lo importante, una forma que se transforma de escena en escena, todo sincronizado con la voz.
const FPS = 30;
export const P2_DUR = 22.8;
export const P2_FRAMES = Math.round(P2_DUR * FPS);

const C = {blue: '#2A44F5', deep: '#0A0C14', panel: '#1A1D27', yellow: '#FFD84D', ink: '#12141B', white: '#FFFFFF', light: '#F2F4F8', red: '#FF5A4F', green: '#3DDC97'};
const FONT = 'Montserrat';
type W = {w: string; s: number; e: number};
const words = data.words as W[];
const rms = data.rms as number[];
const f = (t: number) => Math.round(t * FPS);
const norm = (s: string) => s.toLowerCase().replace(/[^\wáéíóúñü]/g, '');
const at = (w: string, nth = 0) => words.filter((x) => norm(x.w) === w)[nth].s;
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// momentos clave, sacados de la voz
const T = {
  editar: at('editar'), yo: at('yo'), reels: at('reels'), suman: at('suman'), millones: at('millones'), vistas: at('vistas'),
  paso: at('paso'), claude1: at('claude'), typeS: at('le'), tema: at('tema'),
  claude2: at('claude', 1), inv: at('investiga'), comp: at('comprueba'), esc: at('escribe'),
  eleven: at('elevenlabs'), voz: at('voz'),
  y: 14.32, claude3: at('claude', 2), cada: at('cada', 1), escena: at('escena'), palabra: at('palabra'),
  quieres: at('quieres'), ense: at('enseño'), pasoapaso: at('paso', 1), link: at('link'),
};
// escenas del "mundo" (se apilan en vertical: la nueva empuja a la anterior hacia arriba)
const SCENES = [0, 2.84, T.paso, T.claude2, T.eleven, T.y, T.quieres];
const H = 1920;

// ---------- curvas ----------
const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
// muelle con un pelín de rebote, normalizado 0→1
const back = (x: number) => { const c = 1.4; const y = x - 1; return 1 + (c + 1) * y * y * y + c * y * y; };

// interpola una lista de claves [tiempo, valor] con transición `d` segundos desde cada clave
function keyed(t: number, keys: [number, number][], d = 0.55, ease = easeIO): number {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [tk, vk] = keys[i];
    const p = Math.min(1, Math.max(0, (t - tk) / d));
    v = v + (vk - v) * ease(p);
  }
  return v;
}

// ---------- texto que sale de una máscara ----------
const Reveal: React.FC<{s: number; e?: number; children: React.ReactNode; style?: React.CSSProperties; from?: 'down' | 'up'}> = ({s, e, children, style, from = 'down'}) => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const pin = easeOut(Math.min(1, Math.max(0, (t - s) / 0.5)));
  const pout = e === undefined ? 0 : easeIO(Math.min(1, Math.max(0, (t - (e - 0.3)) / 0.3)));
  const dir = from === 'down' ? 1 : -1;
  const y = (1 - pin) * 110 * dir - pout * 110 * dir;
  return (
    <div style={{overflow: 'hidden', display: 'inline-block', padding: '0.06em 0.08em', margin: '-0.06em -0.08em', ...style}}>
      <div style={{transform: `translateY(${y}%) rotate(${(1 - pin) * 4 * dir}deg)`, transformOrigin: 'left bottom'}}>{children}</div>
    </div>
  );
};
const Big: React.FC<{size: number; color?: string; children: React.ReactNode}> = ({size, color = C.ink, children}) => (
  <div style={{fontFamily: FONT, fontSize: size, lineHeight: 0.98, color, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
    textShadow: '0 6px 24px rgba(42,68,245,.12)'}}>{children}</div>
);
const Row: React.FC<{y: number; children: React.ReactNode; x?: number}> = ({y, children, x}) => (
  <div style={{position: 'absolute', top: y, left: x ?? 0, right: x === undefined ? 0 : undefined, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)'}}>{children}</div>
);

// ---------- marcas ----------
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
const Pop: React.FC<{s: number; children: React.ReactNode; rot?: number}> = ({s, children, rot = 0}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const p = spring({frame: frame - f(s), fps, config: {damping: 11, stiffness: 190, mass: 0.7}});
  return <div style={{transform: `scale(${p}) rotate(${(1 - p) * rot}deg)`, opacity: p > 0.02 ? 1 : 0}}>{children}</div>;
};
const ReelCard: React.FC<{src: string; w: number; startFrom: number; radius?: number}> = ({src, w, startFrom, radius = 34}) => (
  <div style={{width: w, height: w * 16 / 9, borderRadius: radius, overflow: 'hidden', background: '#000',
    boxShadow: '0 30px 60px -20px rgba(18,20,60,.4)', border: '6px solid #12141B'}}>
    <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  </div>
);

// ---------- fondo ----------
const Backdrop: React.FC<{cam: number}> = ({cam}) => {
  const frame = useCurrentFrame();
  const e = rms[frame] ?? 0;
  return (
    <AbsoluteFill style={{background: C.light}}>
      <AbsoluteFill style={{background: `radial-gradient(${950 + e * 240}px ${820 + e * 200}px at 50% 40%, rgba(42,68,245,${0.10 + e * 0.08}), transparent 70%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(700px 600px at 85% 90%, rgba(255,216,77,${0.22 + e * 0.1}), transparent 70%)`}} />
      {/* retícula que se desplaza con la cámara: da sensación de recorrido */}
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(18,20,27,.09) 2px, transparent 2.6px)', backgroundSize: '48px 48px',
        backgroundPosition: `0 ${-(cam * 0.35) % 48}px`}} />
    </AbsoluteFill>
  );
};

// ---------- la forma que se transforma ----------
// cada clave: [tiempo, centro x, centro y, ancho, alto, radio, color]
type K = [number, number, number, number, number, number, string];
const MORPH: K[] = [
  [0, 540, 1010, 920, 430, 28, C.panel],         // línea de tiempo de un editor
  [2.84, 540, 1240, 860, 230, 115, C.yellow],    // se convierte en el contador de vistas
  [T.paso, 540, 930, 940, 250, 40, C.white],     // la caja donde se escribe el tema
  [T.claude2, 540, 900, 940, 860, 40, C.white],  // el guion
  [T.eleven, 540, 860, 960, 360, 180, C.blue],   // la onda de la voz
  [T.y, 540, 820, 470, 836, 48, '#000000'],      // la pantalla del reel
  [T.quieres, 540, 660, 960, 330, 48, C.yellow], // la llamada a la acción
];
const MD = 0.5; // duración de cada transformación
function morphAt(t: number) {
  let i = 0; while (i + 1 < MORPH.length && t >= MORPH[i + 1][0]) i++;
  const cur = MORPH[i]; const prev = MORPH[Math.max(0, i - 1)];
  const p = i === 0 ? 1 : Math.min(1, (t - cur[0]) / MD);
  const q = back(easeOut(p) * 0.15 + p * 0.85);
  const lerp = (a: number, b: number) => a + (b - a) * q;
  return {
    i, p, cx: lerp(prev[1], cur[1]), cy: lerp(prev[2], cur[2]), w: lerp(prev[3], cur[3]), h: lerp(prev[4], cur[4]),
    r: lerp(prev[5], cur[5]), color: interpolateColors(Math.min(1, p * 1.4), [0, 1], [prev[6], cur[6]]),
  };
}
// visibilidad del contenido de la etapa i (entra cuando la forma ya llegó, sale justo antes de la siguiente)
const stageVis = (t: number, i: number) => {
  const s = MORPH[i][0] + (i === 0 ? 0 : MD * 0.7); const e = i + 1 < MORPH.length ? MORPH[i + 1][0] : 99;
  return Math.min(1, Math.max(0, (t - s) / 0.18)) * Math.min(1, Math.max(0, (e - t) / 0.12));
};

// ---- contenidos de cada etapa (en coordenadas de la forma) ----
const Timeline: React.FC<{t: number}> = ({t}) => {
  // pistas de un editor: cuanto más avanza, más lío
  const tracks = [C.blue, '#7A5CFF', C.green, C.red];
  const chaos = interpolate(t, [T.editar, T.editar + 0.8], [0, 1], clamp);
  const ph = interpolate(t, [0, T.yo], [0.08, 0.86], clamp);
  return (
    <div style={{position: 'absolute', inset: 26, display: 'grid', gridTemplateRows: '40px repeat(4,1fr)', gap: 12}}>
      <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
        {[C.red, C.yellow, C.green].map((c) => <i key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
        <span style={{marginLeft: 12, fontFamily: 'monospace', fontSize: 26, color: 'rgba(255,255,255,.55)'}}>proyecto_final_v7_DEFINITIVO.prproj</span>
      </div>
      {tracks.map((c, k) => (
        <div key={k} style={{position: 'relative', background: 'rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden'}}>
          {Array.from({length: 3 + Math.round(chaos * 4)}).map((_, j) => {
            const x = ((j * 37 + k * 23) % 90) + Math.sin(t * 3 + j + k) * 2 * chaos; const w = 8 + ((j * 13 + k * 7) % 16);
            return <div key={j} style={{position: 'absolute', top: 6, bottom: 6, left: `${x}%`, width: `${w}%`, borderRadius: 8, background: c, opacity: 0.85}} />;
          })}
        </div>
      ))}
      <div style={{position: 'absolute', top: 52, bottom: 0, left: `${ph * 100}%`, width: 4, background: C.yellow, borderRadius: 2, boxShadow: '0 0 0 2px rgba(0,0,0,.3)'}} />
    </div>
  );
};
const fmt = (n: number) => Math.round(n).toLocaleString('es-ES').replace(/,/g, '.');
const Counter: React.FC<{t: number}> = ({t}) => {
  const n = interpolate(t, [T.suman, T.millones + 0.3], [0, 3000000], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26}}>
      <span style={{fontFamily: FONT, fontSize: 104, color: C.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em'}}>+{fmt(n)}</span>
    </div>
  );
};
const Typing: React.FC<{t: number}> = ({t}) => {
  const text = 'Hazme un vídeo sobre por qué el mar es salado';
  const n = Math.max(0, Math.min(text.length, Math.floor((t - T.typeS) / 0.024)));
  const caret = Math.floor(t * 3.5) % 2 === 0;
  const sent = t > T.tema + 0.25;
  return (
    <div style={{position: 'absolute', inset: '30px 34px', display: 'flex', alignItems: 'flex-end', gap: 22}}>
      <div style={{flex: 1, fontFamily: FONT, fontSize: 50, lineHeight: 1.15, color: C.ink}}>
        {n === 0 ? <span style={{color: '#9AA0B4'}}>Escribe tu tema…</span> : text.slice(0, n)}
        <span style={{opacity: caret && !sent ? 1 : 0, color: C.blue}}>|</span>
      </div>
      <div style={{width: 84, height: 84, borderRadius: 42, background: CLAUDE_COLOR, display: 'grid', placeItems: 'center',
        transform: `scale(${sent ? 1.12 : 1})`}}>
        <svg viewBox="0 0 24 24" width="40" height="40"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
};
const Script: React.FC<{t: number}> = ({t}) => {
  const items: [number, string][] = [[T.inv, 'INVESTIGA'], [T.comp, 'COMPRUEBA CADA DATO'], [T.esc, 'ESCRIBE EL GUION']];
  const lines = [0.94, 0.8, 0.88, 0.62, 0.9, 0.72];
  return (
    <div style={{position: 'absolute', inset: 46, display: 'grid', alignContent: 'start', gap: 30}}>
      <div style={{fontFamily: 'monospace', fontSize: 30, color: '#8C93AD'}}>guion.txt — el mar es salado</div>
      {items.map(([s, l]) => {
        const k = easeOut(Math.min(1, Math.max(0, (t - s - 0.12) / 0.35)));
        return (
          <div key={l} style={{display: 'flex', alignItems: 'center', gap: 24}}>
            <div style={{width: 72, height: 72, borderRadius: 20, background: C.yellow, display: 'grid', placeItems: 'center', transform: `scale(${back(k)})`, opacity: k > 0 ? 1 : 0.15}}>
              <svg viewBox="0 0 24 24" width="40" height="40"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke={C.ink} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - k)} /></svg>
            </div>
            <Reveal s={s}><span style={{fontFamily: FONT, fontSize: 50, color: C.ink}}>{l}</span></Reveal>
          </div>
        );
      })}
      <div style={{display: 'grid', gap: 18, marginTop: 14}}>
        {lines.map((w, j) => (
          <div key={j} style={{height: 18, borderRadius: 9, background: '#DADEE8',
            width: `${100 * w * easeOut(Math.min(1, Math.max(0, (t - T.esc - j * 0.07) / 0.4)))}%`}} />
        ))}
      </div>
    </div>
  );
};
const Wave: React.FC<{frame: number}> = ({frame}) => {
  const bars = 31;
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12}}>
      {Array.from({length: bars}).map((_, i) => {
        const lag = Math.abs(i - (bars - 1) / 2);
        const e = rms[Math.max(0, frame - Math.round(lag * 0.7))] ?? 0;
        const h = 22 + e * 250 * (1 - lag / bars) * (0.75 + 0.25 * Math.sin(i * 1.7 + frame * 0.35));
        return <div key={i} style={{width: 16, height: h, borderRadius: 8, background: i % 2 ? C.yellow : C.white}} />;
      })}
    </div>
  );
};
const Screen: React.FC<{t: number}> = ({t}) => {
  // dentro de la pantalla: el reel, y en "palabra a palabra" los subtítulos que se iluminan
  const ws = ['EL', 'MAR', 'ES', 'SALADO'];
  const k = Math.floor(Math.max(0, t - T.palabra) / 0.28);
  return (
    <AbsoluteFill>
      <Sequence from={f(T.y)} layout="none">
        <OffthreadVideo src={staticFile('reel2.mp4')} muted startFrom={120} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
      </Sequence>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 120, display: 'flex', justifyContent: 'center', gap: 14, opacity: t > T.palabra - 0.05 ? 1 : 0}}>
        {ws.map((w, j) => (
          <span key={w} style={{fontFamily: FONT, fontSize: 52, color: j === k % ws.length ? C.ink : C.white, background: j === k % ws.length ? C.yellow : 'transparent',
            borderRadius: 10, padding: '0 10px', WebkitTextStroke: j === k % ws.length ? undefined : '6px #000', paintOrder: 'stroke fill'}}>{w}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
const Cta: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', inset: 0, display: 'grid', alignContent: 'center', justifyItems: 'center', gap: 4}}>
    <Reveal s={T.quieres}><Big size={78} color={C.ink}>¿QUIERES HACER</Big></Reveal>
    <Reveal s={T.quieres + 0.32}><Big size={104} color={C.blue}>LOS TUYOS?</Big></Reveal>
  </div>
);

const Morph: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const m = morphAt(t);
  const stages = [<Timeline t={t} />, <Counter t={t} />, <Typing t={t} />, <Script t={t} />, <Wave frame={frame} />, <Screen t={t} />, <Cta t={t} />];
  const shadow = '0 40px 80px -30px rgba(18,20,60,.35)';
  return (
    <div style={{position: 'absolute', left: m.cx - m.w / 2, top: m.cy - m.h / 2, width: m.w, height: m.h, borderRadius: m.r, background: m.color,
      overflow: 'hidden', boxShadow: shadow}}>
      {stages.map((el, i) => (el ? <div key={i} style={{position: 'absolute', inset: 0, opacity: stageVis(t, i)}}>{el}</div> : null))}
    </div>
  );
};

// ---------- el mundo: escenas apiladas, la nueva empuja a la anterior ----------
const World: React.FC = () => {
  const y = (i: number) => i * H;
  return (
    <>
      {/* 0: gancho */}
      <div style={{position: 'absolute', left: 0, right: 0, top: y(0), height: H}}>
        <Row y={330}><Reveal s={0}><Big size={96}>¿NO SABES</Big></Reveal></Row>
        <Row y={500}><Reveal s={T.editar}><Big size={100} color={C.blue}>EDITAR VÍDEOS?</Big></Reveal></Row>
        <Row y={700}><Reveal s={T.yo}><Big size={124}>YO TAMPOCO.</Big></Reveal></Row>
      </div>
      {/* 1: reels + contador */}
      <div style={{position: 'absolute', left: 0, right: 0, top: y(1), height: H}}>
        {[{src: 'reel1.mp4', from: 240, x: 220, r: -8, top: 330, w: 300}, {src: 'reel3.mp4', from: 300, x: 860, r: 8, top: 330, w: 300}, {src: 'reel2.mp4', from: 360, x: 540, r: 0, top: 250, w: 350}].map((c, j) => (
          <div key={c.src} style={{position: 'absolute', left: c.x, top: c.top, transform: `translateX(-50%) rotate(${c.r}deg)`, zIndex: j === 2 ? 2 : 1}}>
            <Pop s={T.reels + j * 0.12} rot={c.r * 2}><ReelCard src={c.src} w={c.w} startFrom={c.from} /></Pop>
          </div>
        ))}
        <Row y={1430}><Reveal s={T.vistas}><Big size={76}>VISTAS</Big></Reveal></Row>
      </div>
      {/* 2: paso 1 */}
      <div style={{position: 'absolute', left: 0, right: 0, top: y(2), height: H}}>
        <Row y={360}><Reveal s={T.paso}><Big size={130} color={C.blue}>PASO 1</Big></Reveal></Row>
        <Row y={620}><Pop s={T.claude1} rot={-10}><ClaudeMark size={100} /></Pop></Row>
      </div>
      {/* 3: Claude escribe el guion */}
      <div style={{position: 'absolute', left: 0, right: 0, top: y(3), height: H}}>
        <Row y={330}><Pop s={T.claude2}><ClaudeMark size={84} /></Pop></Row>
      </div>
      {/* 4: la voz */}
      <div style={{position: 'absolute', left: 0, right: 0, top: y(4), height: H}}>
        <Row y={500}><Pop s={T.eleven} rot={8}><ElevenMark size={110} /></Pop></Row>
        <Row y={1180}><Reveal s={T.voz - 0.2}><Big size={92}>PONE LA VOZ</Big></Reveal></Row>
      </div>
      {/* 5: Claude anima */}
      <div style={{position: 'absolute', left: 0, right: 0, top: y(5), height: H}}>
        <Row y={300}><Pop s={T.claude3}><ClaudeMark size={84} /></Pop></Row>
        <div style={{position: 'absolute', left: 150, top: 620, transform: 'translateX(-50%) rotate(-9deg)'}}>
          <Pop s={T.cada} rot={-20}><Sequence from={f(T.cada)} layout="none"><ReelCard src="reel1.mp4" w={250} startFrom={420} radius={28} /></Sequence></Pop>
        </div>
        <div style={{position: 'absolute', left: 930, top: 620, transform: 'translateX(-50%) rotate(9deg)'}}>
          <Pop s={T.escena} rot={20}><Sequence from={f(T.escena)} layout="none"><ReelCard src="reel3.mp4" w={250} startFrom={480} radius={28} /></Sequence></Pop>
        </div>
        <Row y={1340}><Reveal s={T.palabra}><Big size={66} color={C.blue}>PALABRA A PALABRA</Big></Reveal></Row>
      </div>
      {/* 6: llamada a la acción */}
      <div style={{position: 'absolute', left: 0, right: 0, top: y(6), height: H}}>
        <Row y={920}><Reveal s={T.ense}><Big size={86}>TE ENSEÑO</Big></Reveal></Row>
        <Row y={1030}><Reveal s={T.pasoapaso}><Big size={86} color={C.blue}>PASO A PASO</Big></Reveal></Row>
        <Row y={1230}><LinkBio /></Row>
      </div>
    </>
  );
};
const LinkBio: React.FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const p = spring({frame: frame - f(T.link), fps, config: {damping: 10, stiffness: 190}});
  const bob = Math.sin((frame - f(T.link)) / 4) * 12;
  return (
    <div style={{display: 'grid', justifyItems: 'center', gap: 10, transform: `scale(${p})`, opacity: p > 0.02 ? 1 : 0}}>
      <div style={{background: C.blue, color: C.white, fontFamily: FONT, fontSize: 70, lineHeight: 1, padding: '26px 44px', borderRadius: 28,
        boxShadow: '0 24px 50px -18px rgba(42,68,245,.6)'}}>LINK EN MI BIO</div>
      <svg viewBox="0 0 24 24" width="110" height="110" style={{transform: `translateY(${bob}px)`}}><path d="M12 4v15M5 12l7 7 7-7" fill="none" stroke={C.blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  );
};

// ---------- cámara: sigue lo importante ----------
// [tiempo, escala, punto de interés y (en pantalla)]
const CAM_S: [number, number][] = [[0, 1.0], [T.editar, 1.06], [T.yo, 1.0], [T.suman, 1.04], [T.millones, 1.12], [T.paso, 1.0], [T.typeS + 0.2, 1.1],
  [T.claude2, 0.98], [T.inv, 1.04], [T.esc, 1.06], [T.eleven, 1.0], [T.voz - 0.3, 1.08], [T.y, 1.0], [T.cada, 0.94], [T.palabra, 1.14],
  [T.quieres, 1.0], [T.ense, 1.03], [T.link, 1.08]];
const CAM_Y: [number, number][] = [[0, 600], [T.yo, 640], [T.suman, 1000], [T.millones, 1240], [T.paso, 800], [T.typeS + 0.2, 930],
  [T.claude2, 760], [T.inv, 640], [T.comp, 760], [T.esc, 920], [T.eleven, 760], [T.voz - 0.3, 960], [T.y, 860], [T.cada, 860], [T.palabra, 1060],
  [T.quieres, 760], [T.ense, 900], [T.link, 1060]];
const CAM_X: [number, number][] = [[0, 540], [T.cada, 470], [T.escena, 610], [T.palabra, 540]];

export const Proceso2: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const [handle] = useState(() => delayRender('fuente'));
  useEffect(() => {
    const fonts = [new FontFace(FONT, `url(${staticFile('Bricolage-800.ttf')})`, {weight: '800'}),
      new FontFace('Montserrat', `url(${staticFile('Montserrat-800.woff2')})`, {weight: '800'})];
    Promise.all(fonts.map((x) => x.load())).then((xs) => { xs.forEach((x) => document.fonts.add(x)); continueRender(handle); });
  }, [handle]);
  // desplazamiento del mundo: cada escena nueva empuja a la anterior hacia arriba
  const pan = keyed(t, SCENES.map((s, i) => [s, i * H] as [number, number]), 0.6, Easing.bezier(0.7, 0, 0.2, 1));
  const s = keyed(t, CAM_S, 0.7);
  const fy = keyed(t, CAM_Y, 0.7); const fx = keyed(t, CAM_X, 0.7);
  // la cámara se acerca al punto de interés y lo acerca al centro (sin pasarse)
  const dx = (540 - fx) * s * 0.9; const dy = (960 - fy) * s * 0.55;
  const cam = `translate(${dx}px, ${dy}px) scale(${s})`;
  // golpe de cámara en los momentos fuertes
  const hits = [T.yo, T.millones, T.claude1, T.eleven, T.link];
  const k = Math.max(0, ...hits.map((h) => (frame >= f(h) && frame < f(h) + 9 ? (9 - (frame - f(h))) / 9 : 0)));
  const shake = `translate(${Math.sin(frame * 2.7) * 12 * k}px, ${Math.cos(frame * 3.1) * 9 * k}px)`;
  const black = interpolate(frame, [P2_FRAMES - 18, P2_FRAMES - 1], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: C.light, fontWeight: 800}}>
      <Backdrop cam={pan} />
      <AbsoluteFill style={{transform: `${shake} ${cam}`, transformOrigin: '540px 960px'}}>
        <AbsoluteFill style={{transform: `translateY(${-pan}px)`}}><World /></AbsoluteFill>
        <Morph />
      </AbsoluteFill>
      <Captions />
      <AbsoluteFill style={{background: '#000', opacity: black}} />
    </AbsoluteFill>
  );
};

// ---------- subtítulos palabra a palabra (igual que el reel anterior) ----------
const stroke = (px: number, color = C.ink) => ({
  WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const, textShadow: `0 ${px * 0.6}px ${px * 1.6}px rgba(0,0,0,.35)`,
});
type G = {ws: W[]; s: number; e: number};
const groups: G[] = (() => {
  const gs: W[][] = []; let cur: W[] = [];
  words.forEach((x, i) => {
    cur.push(x); const nx = words[i + 1];
    if (cur.length === 3 || /[.,:?]$/.test(x.w) || !nx || nx.s - x.e > 0.3) { gs.push(cur); cur = []; }
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
  const clean = (w: string) => w.replace(/[.,:¿?]/g, '').toUpperCase();
  const chars = g.ws.reduce((a, w) => a + clean(w.w).length, 0) + g.ws.length - 1;
  const fs = Math.min(76, Math.floor(940 / (chars * 0.78)));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1640, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)'}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 8, maxWidth: 1000, transform: `translateY(${(1 - p) * 24}px)`, opacity: p}}>
        {g.ws.map((w, k) => {
          const on = t >= w.s && (k + 1 < g.ws.length ? t < g.ws[k + 1].s : true);
          return <span key={k} style={{fontFamily: 'Montserrat', fontSize: fs, color: on ? C.white : C.ink, background: on ? C.blue : 'transparent', borderRadius: 16, padding: '2px 14px', display: 'inline-block', transform: `scale(${on ? 1.06 : 1})`}}>{clean(w.w)}</span>;
        })}
      </div>
    </div>
  );
};
