#!/usr/bin/env python3
"""Edición del video promo: cortes, zooms, subtítulos palabra a palabra, apariciones y sonidos."""
import json, math, re, subprocess, os, wave
import numpy as np
from PIL import Image, ImageDraw

D = os.path.dirname(os.path.abspath(__file__))
SRC = f"{D}/fuente/proxy.mov"
WAV = f"{D}/fuente/audio.wav"
OUT = f"{D}/salida"
TMP = f"{D}/tmp"
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
REELS = os.path.normpath(f"{D}/../remotion/public")  # reel1/2/3.mp4
W, H, FPS = 1080, 1920, 30
FONT = "Bricolage Grotesque 96pt ExtraBold"

def sh(cmd):
    subprocess.run(cmd, shell=True, check=True)

def silences(th, d):
    r = subprocess.run(f'ffmpeg -i "{WAV}" -af silencedetect=n={th}dB:d={d} -f null -', shell=True,
                       capture_output=True, text=True).stderr
    s = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)]
    e = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
    return list(zip(s, e))

def speech(th, d, total=26.6):
    sil = silences(th, d); out = []; t = 0.0
    for s, e in sil:
        if s > t + 0.05: out.append((t, s))
        t = e
    if total > t + 0.05: out.append((t, total))
    return out

# ---------- 0. Proxy 1080p y audio (si faltan) ----------
ORIG = f"{D}/fuente/video.mov"
if not os.path.exists(SRC):
    sh(f'ffmpeg -v error -y -i "{ORIG}" -vf "scale=1080:1920:flags=lanczos,format=yuv420p" -r 30 -c:v libx264 -preset fast -crf 14 -c:a pcm_s16le "{SRC}"')
if not os.path.exists(WAV):
    sh(f'ffmpeg -v error -y -i "{ORIG}" -vn -ac 1 -ar 16000 "{WAV}"')

# ---------- 1. Cortes (quitar pausas) ----------
coarse = speech(-35, 0.3)
coarse = [(s, e) for s, e in coarse if e - s > 0.08]
keep = []
for s, e in coarse:
    s, e = max(0, s - 0.07), e + 0.10
    if keep and s - keep[-1][1] < 0.22: keep[-1] = (keep[-1][0], e)
    else: keep.append((s, e))
def new_t(t):
    acc = 0.0
    for s, e in keep:
        if t < s: return acc
        if t <= e: return acc + (t - s)
        acc += e - s
    return acc
DUR = sum(e - s for s, e in keep)

# ---------- 2. Palabras con su tiempo ----------
TEXTO = ("Este reel tiene un millón cuatrocientas mil visitas | y no lo hice yo. | Lo hizo una inteligencia artificial | "
         "y yo solo tuve que escribir una sola frase. | Ella investiga, edita, te graba la voz | y no tienes que hacer absolutamente nada. | "
         "Ya llevo más de dos millones de visitas en solo siete días. | Si quieres hacer el tuyo, si quieres aprender, | el link está en mi biografía.")
def syl(w):
    w = re.sub(r"[^a-záéíóúüñ]", "", w.lower())
    return max(1, len(re.findall(r"[aeiouáéíóúü]+", w)))
words = []
for ph_i, ph in enumerate(TEXTO.split("|")):
    for w in ph.split():
        words.append({"w": w, "ph": ph_i, "syl": syl(w)})
fine = speech(-30, 0.12)
fine = [(s, e) for s, e in fine if e - s > 0.06]
tot_speech = sum(e - s for s, e in fine)
tot_syl = sum(x["syl"] for x in words)
def at_speech(x):  # x = segundos de habla acumulados -> tiempo real
    for s, e in fine:
        if x <= e - s: return s + x
        x -= e - s
    return fine[-1][1]
acc = 0.0
for x in words:
    d = x["syl"] / tot_syl * tot_speech
    x["s"], x["e"] = at_speech(acc + 0.001), at_speech(acc + d)
    acc += d
for x in words:
    x["ns"], x["ne"] = new_t(x["s"]), new_t(x["e"])
def find(word, nth=0):
    hits = [x for x in words if re.sub(r"[^\wáéíóúñ]", "", x["w"].lower()) == word]
    return hits[nth]
json.dump(words, open(f"{TMP}/palabras.json", "w"), ensure_ascii=False, indent=1)

# ---------- 3. Video base con zooms alternos ----------
parts = []
for i, (s, e) in enumerate(keep):
    z = 1.0 if i % 2 == 0 else 1.16
    sw, shh = int(W * z) // 2 * 2, int(H * z) // 2 * 2
    cx, cy = int(sw * 0.60 - W / 2), int(shh * 0.50 - H / 2)
    cx = max(0, min(cx, sw - W)); cy = max(0, min(cy, shh - H))
    parts.append(f"[0:v]trim={s:.3f}:{e:.3f},setpts=PTS-STARTPTS,scale={sw}:{shh}:flags=lanczos,crop={W}:{H}:{cx}:{cy},"
                 f"bilateral=sigmaS=6:sigmaR=0.08,selectivecolor=correction_method=relative:reds='-0.46 0.38 0.04 0':yellows='-0.40 0.44 -0.05 0',eq=contrast=1.07:saturation=1.16:gamma=0.96,setsar=1,fps={FPS}[v{i}];"
                 f"[0:a]atrim={s:.3f}:{e:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={e-s-0.012:.3f}:d=0.012[a{i}];")
n = len(keep)
fc = "".join(parts) + "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[v][a]"
sh(f'ffmpeg -v error -y -i "{SRC}" -filter_complex "{fc}" -map "[v]" -map "[a]" -c:v libx264 -preset fast -crf 16 '
   f'-pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a pcm_s16le {TMP}/base.mov')

# ---------- 4. Tarjeta del reel con esquinas redondeadas ----------
CW, CH = 330, 587
mask = Image.new("L", (CW, CH), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, CW - 1, CH - 1], 34, fill=255)
mask.save(f"{TMP}/mask.png")
m2 = Image.new("L", (290, 516), 0); ImageDraw.Draw(m2).rounded_rectangle([0, 0, 289, 515], 30, fill=255); m2.save(f"{TMP}/mask2.png")

# ---------- 5. Subtítulos y apariciones (ASS) ----------
def ts(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"
Y_CAP = 1530
ass = [f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{FONT},84,&H00FFFFFF,&H00FFFFFF,&H00180E0C,&H90000000,0,0,0,0,100,100,0,0,1,7,3,5,40,40,0,1
Style: Big,{FONT},120,&H00FFFFFF,&H00FFFFFF,&H00180E0C,&H80000000,0,0,0,0,100,100,-1,0,1,9,4,5,40,40,0,1
Style: Pill,{FONT},62,&H001B1412,&H00FFFFFF,&H004DD8FF,&H004DD8FF,0,0,0,0,100,100,0,0,3,18,0,5,40,40,0,1
Style: Blue,{FONT},62,&H00FFFFFF,&H00FFFFFF,&H00F5442A,&H00F5442A,0,0,0,0,100,100,0,0,3,18,0,5,40,40,0,1
Style: Type,{FONT},54,&H001B1412,&H00FFFFFF,&H00FFFFFF,&H00FFFFFF,0,0,0,0,100,100,0,0,3,26,0,4,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"""]
def ev(s, e, style, text, layer=1):
    ass.append(f"Dialogue: {layer},{ts(s)},{ts(e)},{style},,0,0,0,,{text}")
POP = r"\fscx30\fscy30\t(0,110,\fscx112\fscy112)\t(110,190,\fscx100\fscy100)"

# subtítulos: grupos de hasta 3 palabras, la palabra que suena en amarillo
groups, cur = [], []
for x in words:
    cur.append(x)
    if len(cur) == 3 or re.search(r"[.,]$", x["w"]) or (x is words[-1]) or words[words.index(x) + 1]["ph"] != x["ph"]:
        groups.append(cur); cur = []
for g in groups:
    clean = [re.sub(r"[.,]", "", x["w"]).upper() for x in g]
    gs, ge = g[0]["ns"], g[-1]["ne"] + 0.05
    nxt = groups.index(g) + 1
    if nxt < len(groups): ge = min(ge + 0.25, groups[nxt][0]["ns"])
    for k, x in enumerate(g):
        s = x["ns"] if k else gs
        e = g[k + 1]["ns"] if k + 1 < len(g) else ge
        txt = " ".join((r"{\c&H4DD8FF&}" + c + r"{\c&HFFFFFF&}") if j == k else c for j, c in enumerate(clean))
        anim = r"\fscx85\fscy85\t(0,90,\fscx100\fscy100)" if k == 0 else ""
        ev(s, e, "Cap", rf"{{\an5\pos({W//2},{Y_CAP}){anim}}}" + txt)

sfx = []  # (tiempo, tipo)
# a) gancho: tarjeta del reel + contador 1.400.000
hook_end = find("yo", 0)["ne"] + 0.1
card_in = 0.0
sfx.append((0.0, "whoosh"))
cnt_s, cnt_e = 0.15, find("visitas", 0)["ne"]
steps = int((cnt_e - cnt_s) * FPS)
for i in range(steps + 1):
    p = i / max(1, steps); v = int(1400000 * (1 - (1 - p) ** 3))
    s = cnt_s + i / FPS; e = s + 1 / FPS if i < steps else hook_end
    ev(s, e, "Big", rf"{{\an5\pos(540,540)\fs104}}" + f"{v:,}".replace(",", "."), 2)
ev(cnt_s, hook_end, "Pill", r"{\an5\pos(540,625)\fs44}VISITAS", 2)
# b) IA
s = find("inteligencia")["ns"]; e = find("artificial")["ne"] + 0.3
ev(s, e, "Blue", rf"{{\an5\pos(540,420){POP}\fs88}}LA HIZO UNA IA"); sfx.append((s, "pop"))
# c) una sola frase: caja que se escribe sola
s = find("escribir")["ns"]; e = find("frase")["ne"] + 0.35
frase = "Hazme un vídeo sobre…"
ev(s, e, "Pill", r"{\an5\pos(540,300)\fs40}TU ÚNICA FRASE:")
for i in range(1, len(frase) + 1):
    t0 = s + (i - 1) * 0.045; t1 = s + i * 0.045 if i < len(frase) else e
    ev(t0, t1, "Type", rf"{{\an4\pos(130,420)}}{frase[:i]}" + ("|" if i < len(frase) else ""))
    if i % 2: sfx.append((t0, "tick"))
# d) investiga / edita / voz
lista = [("investiga", "INVESTIGA", 360), ("edita", "EDITA", 480), ("voz", "PONE LA VOZ", 600)]
end_l = find("voz")["ne"] + 0.5
for wkey, label, y in lista:
    s = find(wkey)["ns"]
    ev(s, end_l, "Pill", rf"{{\an5\pos(540,{y}){POP}}}✓ {label}"); sfx.append((s, "pop"))
# e) nada
s = find("absolutamente")["ns"]; e = find("nada")["ne"] + 0.35
ev(s, e, "Big", rf"{{\an5\pos(540,520){POP}\fs150}}{{\c&H4DD8FF&}}NADA"); sfx.append((find("nada")["ns"], "boom"))
# f) +2.000.000 en 7 días
s = find("dos")["ns"]; e = find("días")["ne"] + 0.4
steps = int((find("visitas", 1)["ne"] - s) * FPS)
for i in range(steps + 1):
    p = i / max(1, steps); v = int(2000000 * (1 - (1 - p) ** 3))
    t0 = s + i / FPS; t1 = t0 + 1 / FPS if i < steps else e
    ev(t0, t1, "Big", rf"{{\an5\pos(540,420)\fs120}}+" + f"{v:,}".replace(",", "."), 2)
ev(s, e, "Pill", r"{\an5\pos(540,540)\fs44}VISITAS", 2)
s7 = find("siete")["ns"]
ev(s7, e, "Blue", rf"{{\an5\pos(540,650){POP}\fs70}}EN 7 DÍAS"); sfx.append((s7, "ding"))
# g) link en la bio
s = find("link")["ns"]; e = DUR
ev(s, e, "Blue", rf"{{\an5\pos(540,1390){POP}\fs76}}LINK EN MI BIO"); sfx.append((s, "whoosh"))
ev(s + 0.1, e, "Big", r"{\an5\move(540,1230,540,1255,0,300)\fs130\c&H4DD8FF&\t(0,300,\fscy112)\t(300,600,\fscy100)\t(600,900,\fscy112)\t(900,1200,\fscy100)}↓")
# h) hueco "si quieres hacer el tuyo, si quieres aprender": tus 3 reels con sus vistas
G0 = find("días")["ne"] + 0.45
G1 = find("link")["ns"] - 0.02
GW, GH, GY = 290, 516, 120
GAP_CARDS = [("reel1.mp4", 8.0, 1.4, "1,4 M"), ("reel3.mp4", 10.0, 1.0, "768 K"), ("reel2.mp4", 12.0, 1.0, "271 K")]
for j, (_, _, _, lab) in enumerate(GAP_CARDS):
    t0 = G0 + j * 0.28; x = 540 + (j - 1) * (GW + 40)
    ev(t0, G1, "Pill", rf"{{\an5\pos({x},{GY + GH + 50}){POP}\fs46}}{lab}", 2)
    sfx.append((t0, "pop"))
open(f"{TMP}/edicion.ass", "w").write("\n".join(ass) + "\n")

# ---------- 6. Efectos de sonido sintetizados ----------
SR = 48000
def env(n, a, r):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def lowpass(x, alpha):
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += alpha[i] * (v - acc); y[i] = acc
    return y
rng = np.random.default_rng(3)
def snd(kind):
    if kind == "whoosh":
        n = int(SR * 0.45); t = np.arange(n) / n
        a = np.sin(np.pi * t) ** 2
        alpha = 0.02 + 0.25 * np.sin(np.pi * t) ** 2
        return lowpass(rng.standard_normal(n), alpha) * a * 2.2
    if kind == "pop":
        n = int(SR * 0.12); t = np.arange(n) / SR
        f = 900 * np.exp(-t * 18) + 280
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.035) * 0.9
    if kind == "tick":
        n = int(SR * 0.025); x = rng.standard_normal(n)
        x = x - lowpass(x, np.full(n, 0.3))
        return x * env(n, 0.0005, 0.004) * 0.5
    if kind == "ding":
        n = int(SR * 1.2); t = np.arange(n) / SR
        return (np.sin(2*np.pi*1318*t) + 0.5*np.sin(2*np.pi*2637*t) + 0.25*np.sin(2*np.pi*3951*t)) * env(n, 0.003, 0.35) * 0.45
    if kind == "boom":
        n = int(SR * 0.6); t = np.arange(n) / SR
        f = 120 * np.exp(-t * 6) + 45
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.004, 0.18) * 1.0
total = int((DUR + 1) * SR); mix = np.zeros(total)
for t, k in sfx:
    x = snd(k); i = int(t * SR); mix[i:i + len(x)] += x[: total - i]
mix = mix / max(1e-6, np.abs(mix).max()) * 0.5
with wave.open(f"{TMP}/sfx.wav", "w") as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes((mix * 32767).astype(np.int16).tobytes())

# ---------- 7. Montaje final ----------
card = (f"[1:v]trim=0:{hook_end:.3f},setpts=PTS-STARTPTS,scale={CW}:{CH},format=rgba[c0];"
        f"[c0][2:v]alphamerge,fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st={hook_end-0.45:.3f}:d=0.45:alpha=1[card];"
        f"[0:v][card]overlay=x=(W-w)/2:y=30:enable='lt(t,{hook_end:.3f})'[vh];")
gc = "[5:v]split=3[m0][m1][m2];"
for j, (_, off, _, _) in enumerate(GAP_CARDS):
    t0 = G0 + j * 0.28; d = G1 - t0
    gc += (f"[{6+j}:v]trim=start={off}:duration={d:.3f},setpts=PTS-STARTPTS+{t0:.3f}/TB,scale={GW}:{GH},format=rgba[g{j}];"
           f"[g{j}][m{j}]alphamerge,fade=t=in:st={t0:.3f}:d=0.25:alpha=1,fade=t=out:st={G1-0.2:.3f}:d=0.2:alpha=1[gk{j}];")
chain = "[vh]"
for j in range(3):
    x = 540 + (j - 1) * (GW + 40) - GW // 2
    t0 = G0 + j * 0.28
    gc += f"{chain}[gk{j}]overlay=x={x}:y={GY}:eof_action=pass:enable='between(t,{t0:.3f},{G1:.3f})'[vg{j}];"
    chain = f"[vg{j}]"
fc = (card + gc.replace("[vh]", "[vh]") +
      f"{chain}null[vb];"
      f"[vb]ass={TMP}/edicion.ass:fontsdir={D}/fonts,fade=t=out:st={DUR-0.7:.3f}:d=0.7[vout];"
      f"[0:a]aresample=48000,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,volume=1.0[voz];"
      f"[3:a]volume=0.55[fx];[voz][fx]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=9,afade=t=out:st={DUR-0.35:.3f}:d=0.35[aout]")
sh(f'ffmpeg -v error -y -i {TMP}/base.mov -i {REELS}/reel1.mp4 -loop 1 -i {TMP}/mask.png -i {TMP}/sfx.wav -i {REELS}/reel1.mp4 -loop 1 -i {TMP}/mask2.png -i {REELS}/reel1.mp4 -i {REELS}/reel3.mp4 -i {REELS}/reel2.mp4 '
   f'-filter_complex "{fc}" -map "[vout]" -map "[aout]" -t {DUR:.3f} -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p '
   f'-colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -ar 48000 -movflags +faststart {OUT}/reel-promo.mp4')
print(f"OK {DUR:.2f}s, cortes={len(keep)}, sfx={len(sfx)}")
