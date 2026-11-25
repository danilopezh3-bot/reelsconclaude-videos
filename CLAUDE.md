# Reels con Claude: proyecto de vídeos

Contexto para continuar el trabajo en una sesión nueva. Responde siempre en **español**, corto y claro: el usuario no programa.

## Quién y qué
- Creador de reels animados sin cara (cuenta de Instagram **@stickman_report**). Vende una skill de Claude que hace reels explicativos animados.
- Producto: **"Reels con Claude"**, USD **19.00** pago único. Incluye la skill, ayuda para empezar con Claude Code y una asesoría privada 1 a 1.
- Web: **https://reelsconclaude.com** → repo `danilopezh3-bot/reelsconclaude` (rama `main`, Cloudflare Pages publica solo cada push en 1–2 min). El repo es **privado** desde nov. 2026, pero lo que Cloudflare publica en la web lo ve cualquiera: nada privado en sus archivos (ni la descarga de Drive). Los vídeos de trabajo van en este repo (`reelsconclaude-videos`).
- Pago: Stripe Payment Link `https://buy.stripe.com/fZueV718q2pbeUP2G92ZO00` (modo real). La descarga para compradores (Google Drive) va en la página de confirmación de Stripe, **nunca en la web**.
- Contacto: Telegram `https://t.me/danilopezh3`, Discord `https://discord.gg/E2H3KbFjFn`.
- Resultados reales para usar en textos: reels con **1,4 M**, **768 K** y **271 K** reproducciones y **+3 M** en total sumando todos sus vídeos (nov. 2026). Los +3 M no son la suma de esos tres reels: decir "con reels hechos con esta skill", nunca "en estos tres reels". No inventar cifras. La frase "2 millones en 7 días" del vídeo promo está sin confirmar: no repetirla en textos nuevos sin preguntar.

## Marca
- Colores: azul `#2A44F5`, amarillo `#FFD84D`, tinta `#12141B`, fondo claro `#F2F4F8`.
- Fuente: **Bricolage Grotesque ExtraBold** (`promo-ia/fonts/Bricolage-800.ttf`; en libass se llama `Bricolage Grotesque 96pt ExtraBold`).

## Vídeo promo (el usuario hablando a cámara)
Carpeta `promo-ia/`:
- `fuente/video.mov`: original del iPhone (4K vertical, HLG/Dolby Vision; ffmpeg lo rota solo).
- `editar.py`: hace toda la edición con ffmpeg + libass. `python3 promo-ia/editar.py` → `promo-ia/salida/reel-promo.mp4`. Crea el proxy 1080p y el audio si faltan.
  - Quita pausas (silencedetect), zoom alterno 1.0/1.16 en cada corte.
  - Tiempos de cada palabra: repartidos por sílabas sobre los tramos con voz (no hay transcripción automática: huggingface, whisper, etc. están bloqueados en la red). El texto dicho está en `TEXTO` dentro del script.
  - Color: suavizado de piel `bilateral` suave + `selectivecolor` solo en rojos/amarillos para piel más rosada (el usuario lo pidió varias veces "más rosado"). No usar colorbalance global: tiñe la camisa negra y la pared.
  - Subtítulos en y=1530 (el usuario los pidió abajo), palabra activa en amarillo.
  - Apariciones: tarjeta del reel de 1,4 M con contador, "LA HIZO UNA IA", caja "Hazme un vídeo sobre…", ✓ INVESTIGA/EDITA/PONE LA VOZ, "NADA", contador +2.000.000 y "EN 7 DÍAS", los 3 reels con sus vistas en el hueco "si quieres hacer el tuyo…", "LINK EN MI BIO" con flecha ↓ a la altura de las manos (él señala hacia abajo), fundido a negro al final.
  - Sonidos (whoosh, pop, teclas, golpe, ding) sintetizados con numpy; voz con compresor y loudnorm −14 LUFS.
- `salida/reel-promo-ffmpeg.mp4`: versión con animaciones de libass.
- `salida/reel-promo-remotion.mp4`: **versión más reciente**, animaciones hechas con Remotion.

## Remotion
Carpeta `remotion/` (Remotion 4, React 18). Instalar con `cd remotion && npm install`.
- `src/Promo.tsx`: todas las animaciones (muelles, subtítulos que se ajustan al ancho, etc.). Usa `public/base.mp4` (vídeo ya cortado y con color, sin audio) y `src/palabras.json` (tiempos de cada palabra), que salen de `editar.py` (`promo-ia/tmp/base.mov` y `promo-ia/tmp/palabras.json`).
- Render: `npx remotion render src/index.ts Promo out/overlay.mp4 --browser-executable=/opt/pw-browsers/chromium --concurrency=3`
- Audio: se reutiliza el de la versión ffmpeg (mismos tiempos de sonidos): `ffmpeg -i out/overlay.mp4 -i ../promo-ia/salida/reel-promo.mp4 -map 0:v -map 1:a -c:v libx264 -crf 19 -c:a copy -shortest out/reel-promo-remotion.mp4`
- Licencia de Remotion: gratis para personas y empresas de hasta 3 personas.

## Notas del entorno
- Para vídeos grandes: el usuario los sube a Google Drive (compartido con "cualquiera con el enlace"); `drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t` está permitido en la red.
- ElevenLabs está conectado pero no acepta archivos del chat ni enlaces de Drive para transcribir.
- No subir audio/vídeo de trabajo al repo de la web (se publica en la web).
- Commits con `-c user.name="danilopezh3-bot" -c user.email="danilopezh3-bot@users.noreply.github.com"`.
