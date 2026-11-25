---
name: Reels con Claude
description: Telediario "Stickman Report": la landing da la noticia de tus reels hechos por Claude.
colors:
  blue: "#2A44F5"
  blue-deep: "#1C2FC4"
  on-blue: "#FFFFFF"
  on-blue-2: "#D6DCFF"
  yellow: "#FFD84D"
  on-yellow: "#12141B"
  studio: "#12141B"
  studio-2: "#1A1D27"
  studio-line: "#2A2E3B"
  on-studio: "#F2F4F8"
  on-studio-2: "#A9AEC0"
  paper: "#F2F4F8"
  paper-white: "#FFFFFF"
  ink: "#12141B"
  ink-2: "#4A5063"
  rule: "#D5D9E3"
  live: "#D92020"
  telegram: "#176EA0"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.5rem, 7.4vw, 5.6rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 76"
  headline:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 4.6vw, 3.3rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 78"
  title:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)"
    fontWeight: 800
    lineHeight: 1.05
    fontVariation: "'wdth' 82"
  figure:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.8rem, 4.4vw, 3.2rem)"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 78"
  body:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 800
    letterSpacing: "0.05em"
    fontVariation: "'wdth' 78"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.86rem"
    fontWeight: 500
    fontFeature: "'tnum'"
rounded:
  none: "0px"
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "20px"
  dot: "50%"
spacing:
  gutter: "16px"
  container: "1200px"
  section: "clamp(64px, 10vw, 120px)"
  head-gap: "clamp(32px, 5vw, 52px)"
  wall-gap: "clamp(6px, 1vw, 12px)"
components:
  button-strap:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.on-yellow}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "0.95em 1.2em"
  button-strap-price:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.on-blue}"
    rounded: "{rounded.none}"
    padding: "0.95em 1em"
  chyron-headline:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.on-blue}"
    typography: "{typography.display}"
    rounded: "{rounded.lg}"
    padding: "0.16em 0.3em 0.18em"
  chyron-sub:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.on-yellow}"
    rounded: "{rounded.md}"
    padding: "0.5em 0.75em"
  chyron-lead:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "0.75em 0.95em"
  section-strap:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.on-blue}"
    typography: "{typography.headline}"
    rounded: "{rounded.md}"
    padding: "0.14em 0.32em 0.16em"
  tag-label:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.on-yellow}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  ticker:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "11px 0"
  ticket:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "22px"
---

# Design System: Reels con Claude

## Overview

**Creative North Star: "El Telediario de Última Hora"**

La web es un plató de informativo: fondo oscuro de estudio, rótulos rectangulares que entran barriendo, monitores 9:16 con los reels en bucle, una mosca "EN DIRECTO" con reloj y una cinta de noticias. La noticia es el producto: "tus reels, hechos por Claude". Las secciones de lectura se apoyan en papel de guion claro, como la escaleta que se lee fuera de cámara.

Densidad de informativo: titulares grandes y estrechos (Bricolage con anchura 76-82), bloques de color plano apilados sin separación, cifras tabulares. Todo es rectángulo duro; lo único redondo son los pilotos de señal y el botón de play. La forma la dan las reglas horizontales (2px arriba, 1px entre filas), no las tarjetas.

Rechazado de forma explícita en la dirección: la landing SaaS de titular + móvil + rejilla de tarjetas, los degradados decorativos (las esquinas redondeadas se añadieron después a petición del usuario).

**Key Characteristics:**
- Rótulos de TV como sistema: bloque azul con titular, bloque amarillo, bloque papel, apilados.
- Estudio oscuro (tinta) alternando con papel de guion claro y un cierre en azul pleno.
- Esquinas a 0 en todo salvo pilotos de señal.
- Bricolage ExtraBold estrecha para todo lo que se grita; JetBrains Mono para reloj, tiempos y código.
- Movimiento de rótulo: barrido con clip-path de izquierda a derecha al entrar.

## Colors

Paleta de marca de cuatro colores sobre plató oscuro, con un rojo de señal reservado al "en directo".

### Primary
- **Azul Rótulo** (blue): fondo del titular, de los rótulos de sección, del precio dentro del botón y de toda la sección de compra; también números de escaleta, barras del marcador e iconos de check. Es el color del canal.
- **Azul Rótulo Profundo** (blue-deep): variante oscura definida en tokens para estados presionados; hoy casi sin uso.

### Secondary
- **Amarillo Última Hora** (yellow): botón de compra, subrótulo bajo el titular, cuadro de arranque de cada rótulo de sección, etiquetas, la palabra destacada (`em`) dentro de titulares azules, el total "+3 M", anillo de foco y selección de texto.

### Tertiary
- **Rojo Señal** (live): solo el piloto "EN DIRECTO" de la barra, la etiqueta REEL de los monitores y la cabecera de la cinta. Nunca texto de cuerpo ni botones.
- **Azul Telegram** (telegram): solo enlaces y botón de contacto por Telegram.

### Neutral
- **Plató** (studio): fondo del cuerpo, barra del canal y pie. Igual que la tinta de marca.
- **Plató Elevado** (studio-2): pista vacía de las barras del marcador.
- **Línea de Plató** (studio-line): reglas de 1px y bordes sobre fondo oscuro.
- **Blanco de Cámara** (on-studio) y **Gris de Plató** (on-studio-2): texto principal y secundario sobre oscuro.
- **Papel de Guion** (paper): secciones de lectura, cinta de noticias, subrótulo claro, ticket de compra, barra fija del móvil.
- **Papel Blanco** (paper-white): caja de "lo que escribes" y regla de la línea de tiempo.
- **Tinta** (ink) e **Tinta Suave** (ink-2): texto sobre papel.
- **Regla** (rule): divisores de 1px sobre papel.
- **Azul Claro** (on-blue-2): texto secundario sobre la sección azul.

### Named Rules
**The Rótulo Rule.** El color va en bloques planos y rectangulares con texto encima, nunca como tinte ni degradado. Los únicos degradados permitidos son funcionales: el velo superior de los monitores para leer la etiqueta y la máscara de los bordes de la cinta.

**The Señal Roja Rule.** El rojo significa "en directo" y nada más. Si no es un piloto o una cabecera de señal, no es rojo.

## Typography

**Display Font:** Bricolage Grotesque (variable, opsz/wdth/wght; fallback system-ui)
**Body Font:** Bricolage Grotesque
**Label/Mono Font:** JetBrains Mono (reloj, regla de tiempos, prompt de ejemplo, listado de archivos)

**Character:** Una grotesca con carácter, ExtraBold y comprimida para rótulos de informativo; a peso normal y anchura completa para leer. La mono aporta el aire de sala de control.

### Hierarchy
- **Display** (800, clamp(2.5rem, 7.4vw, 5.6rem), 0.92, anchura 76): solo el titular de portada dentro del rótulo azul; 2.3rem por debajo de 380px.
- **Headline** (800, clamp(1.9rem, 4.6vw, 3.3rem), 0.98, anchura 78): rótulo de cada sección. El cierre de compra usa la escala display (hasta 5rem) sin rótulo.
- **Title** (800, clamp(1.4rem, 2.6vw, 1.9rem), 1.05, anchura 80-84): pasos de la escaleta, bloques de acompañamiento, pilares.
- **Figure** (800, hasta 3.2rem, 1, anchura 78, cifras tabulares): vistas del marcador y de los monitores, precio (3.4rem).
- **Body** (400, 17px / 16px en móvil, 1.55): párrafos; 46-70ch según bloque.
- **Label** (800, 0.7-0.8rem, +0.05em, anchura 78, a menudo en mayúsculas): etiquetas de monitor, marcador, ticket, cabecera de cinta.

### Named Rules
**The Estrecho Grita Rule.** Todo lo que se grita va en 800 con anchura 76-84; lo que se lee, a anchura normal. Nunca un titular a anchura 100.

**The Cifra Tabular Rule.** Toda cifra (vistas, precio, reloj, pasos) usa números tabulares.

## Layout

Contenedor de 1200px con margen lateral de 16px (respeta safe-area). Las secciones respiran clamp(64px, 10vw, 120px) arriba y abajo y alternan plató oscuro / papel / plató, con cierre en azul. La portada es un muro de 3 monitores 9:16 (máx. 800px, hueco 6-12px) y el rótulo se superpone a su borde inferior con margen negativo (hasta -190px; -56px en móvil); debajo, la cinta de noticias a todo el ancho.

El contenido se ordena en listas con regla: borde superior de 2px y filas separadas por 1px (marcador, escaleta, entregables, preguntas, acompañamiento). Rejillas de 2 o 3 columnas que pasan a una columna a 900px / 700px. En móvil (≤700px) los estilos se vuelven carrusel horizontal con snap y aparece la barra de compra fija abajo. Puntos de corte observados: 380, 480, 700, 900, 1100px.

## Elevation & Depth

Plano por defecto: la profundidad viene del contraste plató/papel y de apilar rótulos. Las sombras son caídas suaves y largas, solo bajo piezas que "flotan sobre el plató": el titular, el botón, el ticket, el listado de archivos y la barra fija.

### Shadow Vocabulary
- **Caída de rótulo** (`0 24px 50px -24px rgba(0,0,0,.8)`): titular de portada sobre los monitores.
- **Caída de botón** (`0 10px 24px -14px rgba(0,0,0,.7)`; hover `0 16px 30px -16px rgba(0,0,0,.8)`): botón rótulo.
- **Caída de ticket** (`0 30px 60px -30px rgba(0,0,30,.6)`): ticket sobre la sección azul.
- **Caída de pantalla** (`0 26px 50px -30px rgba(18,20,27,.6)`): listado de archivos sobre papel.
- **Barra inferior** (`0 -10px 30px -12px rgba(0,0,0,.6)`): barra de compra fija del móvil.

### Named Rules
**The Sombra Blanda Rule.** Las sombras son difusas y con spread negativo; nunca desplazadas y duras.

## Shapes

Esquinas redondeadas (petición del usuario, nov. 2026): monitores y rótulo de portada 16px, botones, rótulos de sección, subrótulos, caja de prompt y carpeta 10–16px, ticket 20px, etiquetas 6px. En pilas de rótulos, la esquina que toca al rótulo vecino queda recta. La cinta de noticias sigue recta de lado a lado. Solo son círculos los pilotos de señal (6-8px) y el botón de play del monitor. El rótulo de sección arranca con un cuadro amarillo de 0.42em pegado al bloque azul. Los separadores de la cinta son cuadrados azules de 8px.

## Components

### Buttons
Rótulo de TV convertido en botón: confiado, de bloque.
- **Shape:** esquinas redondeadas (6–20px); la cinta de noticias recta.
- **Primary (botón rótulo):** segmento amarillo con texto tinta ("Comprar la skill" + flecha) seguido de un segmento azul con el precio en blanco; padding 0.95em 1.2em / 0.95em 1em; variante pequeña 0.7em 0.95em en la barra. Ocupa todo el ancho en móvil y en el ticket.
- **Hover / Focus:** sube 2px y crece la sombra (.2s, ease-out expo), la flecha avanza 3px; al pulsar escala 0.98. Foco: contorno amarillo de 3px a 3px.
- **Secundario:** enlaces del pie con borde de 1px de línea de plató, padding 8px 14px; hover aclara el borde.

### Rótulo (chyron)
Firma del sistema. Pila sin huecos: titular blanco sobre azul (display), subrótulo tinta sobre amarillo, entradilla sobre papel (máx. 56ch). La palabra clave del titular va en amarillo. Entra con barrido clip-path de .8s y retardos de 0 / .18s / .32s.

### Rótulo de sección
Cuadro amarillo + bloque azul con el titular de sección (headline). Sustituye a cualquier encabezado suelto; entra con barrido.

### Monitor
Botón 9:16 sobre negro con el reel en bucle, velo superior, etiqueta roja REEL, cifra en bloque azul y "reproducciones" en papel, play circular que pasa a amarillo en hover. Al tocarlo queda "en directo": vídeo completo con sonido y sin rótulos encima.

### Cinta de noticias
Banda papel a todo el ancho con cabecera roja, frases en 700 anchura 85 y cifras en azul, separadas por cuadrados azules. Desfila a 46s lineal y se pausa en hover.

### Marcador
Filas con etiqueta, barra azul que crece (1.3s) y cifra grande tabular; la fila del total va en amarillo.

### Cards / Containers
No hay tarjetas. El único contenedor es el **ticket** de compra: papel, cabecera tinta con etiquetas (la última en amarillo), precio, lista con checks azules y botón rótulo a todo el ancho.

### Navigation
Barra del canal fija arriba (60px; 54px en móvil): plató al 92% con desenfoque, regla inferior de 1px. Logo + nombre a la izquierda; a la derecha mosca EN DIRECTO con piloto rojo que late y reloj mono, enlace a Telegram y botón rótulo pequeño. En móvil se ocultan textos y queda lo esencial; abajo aparece la barra de compra fija (papel, precio, Telegram, Comprar en amarillo).

### Preguntas
Acordeón sobre papel: filas con regla, marcador "P" azul y "R" gris en la columna izquierda, cruz azul que gira 45° al abrir.

## Do's and Don'ts

### Do:
- **Do** construir cada titular como rótulo: bloque azul plano, texto blanco en 800 estrecho, palabra clave en amarillo.
- **Do** alternar plató oscuro y papel de guion, y cerrar con la sección azul.
- **Do** ordenar listas con regla superior de 2px y divisores de 1px en lugar de tarjetas.
- **Do** mostrar cifras reales en números tabulares, con la cifra en bloque azul sobre los monitores.
- **Do** animar la entrada de rótulos con barrido clip-path (.8s, cubic-bezier(.16,1,.3,1)) y respetar prefers-reduced-motion.

### Don't:
- **Don't** redondear esquinas de rótulos, botones, monitores o contenedores; solo pilotos y play son círculos.
- **Don't** usar rejillas de tarjetas ni la composición SaaS de titular + móvil + tarjetas.
- **Don't** usar degradados decorativos; solo el velo de legibilidad del monitor y la máscara de la cinta.
- **Don't** usar el rojo fuera de la señal "en directo".
- **Don't** poner sombras duras desplazadas; las caídas son suaves y difusas.
