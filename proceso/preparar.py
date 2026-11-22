"""Prepara voz, tiempos de palabras, onda y efectos para el reel 'proceso' (Remotion).
Uso: python3 proceso/preparar.py   (después: render en remotion/ y mezcla, ver README del final)."""
import json, wave, subprocess, numpy as np, os
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(D, "..", "remotion")
SR = 48000; FPS = 30; DUR = 22.0
words = json.load(open(f"{D}/voz/palabras.json"))
# voz a wav
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{D}/voz/toma1.mp3", "-ac", "1", "-ar", str(SR), f"{D}/voz/voz.wav"], check=True)
with wave.open(f"{D}/voz/voz.wav") as w: v = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
# energía por fotograma para la onda
hop = SR // FPS; n = int(DUR * FPS)
rms = [float(np.sqrt(np.mean(v[i*hop:(i+1)*hop] ** 2))) if i*hop < len(v) else 0.0 for i in range(n)]
m = max(rms); rms = [round(min(1, r / m * 1.3), 3) for r in rms]
json.dump({"words": [{"w": x["text"], "s": x["start"], "e": x["end"]} for x in words], "rms": rms},
          open(f"{R}/src/proceso.json", "w"), ensure_ascii=False)
# efectos (mismos sonidos que el promo)
rng = np.random.default_rng(3)
def env(n, a, r): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def lowpass(x, alpha):
    y = np.zeros_like(x); acc = 0.0
    for i, val in enumerate(x): acc += alpha[i] * (val - acc); y[i] = acc
    return y
def snd(k):
    if k == "whoosh":
        n = int(SR * .45); t = np.arange(n) / n; return lowpass(rng.standard_normal(n), .02 + .25 * np.sin(np.pi * t) ** 2) * np.sin(np.pi * t) ** 2 * 2.2
    if k == "pop":
        n = int(SR * .12); t = np.arange(n) / SR; f = 900 * np.exp(-t * 18) + 280; return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, .002, .035) * .9
    if k == "tick":
        n = int(SR * .025); x = rng.standard_normal(n); x = x - lowpass(x, np.full(n, .3)); return x * env(n, .0005, .004) * .5
    if k == "ding":
        n = int(SR * 1.2); t = np.arange(n) / SR; return (np.sin(2*np.pi*1318*t) + .5*np.sin(2*np.pi*2637*t) + .25*np.sin(2*np.pi*3951*t)) * env(n, .003, .35) * .45
    if k == "boom":
        n = int(SR * .6); t = np.arange(n) / SR; f = 120 * np.exp(-t * 6) + 45; return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, .004, .18)
W = {x["text"].strip(".,:").lower() + str(i): x for i, x in enumerate(words)}
def at(word, nth=0): return [x for x in words if x["text"].strip(".,:").lower() == word][nth]["start"]
sfx = [(0, "whoosh")]
sfx += [(0.15 + i * 0.07, "tick") for i in range(28)]                     # contador
sfx += [(at("tres"), "ding"), (at("sin"), "pop"), (at("nada"), "boom")]
sfx += [(5.3, "whoosh"), (5.42, "pop")]
sfx += [(5.62 + i * 0.085, "tick") for i in range(21)]                    # teclas
sfx += [(at("claude"), "pop"), (8.3, "whoosh")]
sfx += [(8.42, "pop"), (at("comprueba"), "pop"), (at("escribe"), "ding")]
sfx += [(12.15, "whoosh"), (at("elevenlabs"), "pop")]
sfx += [(14.1, "whoosh"), (at("claude", 2), "pop"), (at("anima"), "pop"), (at("cada", 1), "pop"), (at("escena"), "pop")]
sfx += [(18.35, "whoosh"), (at("tú"), "pop"), (at("link") - 0.05, "whoosh"), (at("link"), "ding")]
mix = np.zeros(int((DUR + 1) * SR))
for t, k in sfx:
    x = snd(k); i = int(t * SR); mix[i:i + len(x)] += x[:len(mix) - i]
mix = mix / np.abs(mix).max() * .5
with wave.open(f"{D}/voz/sfx.wav", "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("OK", len(words), "palabras,", len(sfx), "efectos")
