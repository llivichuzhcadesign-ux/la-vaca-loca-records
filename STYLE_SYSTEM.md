# La Vaca Loca — Sistema CSS público

## Estado y criterio de seguridad

Refactor estructural (2026-11-01). El diseño público mantiene las mismas reglas y el mismo orden de cascada que antes del refactor. **No se han fusionado ni reordenado selectores con conflictos de especificidad.** Para ello se necesita comparar pantallas y estados reales antes/después.

Todos los módulos viven en la raíz para conservar las rutas relativas de imágenes de CSS. Los cuatro archivos originales (`discos.css`, `site-theme.css`, `footer-sign.css`, `home-flow.css`) son exclusivamente *manifiestos de compatibilidad* con imports en el mismo orden.

Las cinco páginas HTML cargan directamente los módulos mediante `<link rel="stylesheet">`, en orden, para permitir descargas paralelas. No se deben cargar simultáneamente el manifiesto y sus módulos en una misma página.

## Módulos por responsabilidad y orden obligatorio

### Discos
1. `discos.base.css`: estructura inicial, plato, biblioteca y puntos de quiebre de la primera versión
2. `discos.header.css`: integración visual del header con la sala de escucha
3. `discos.deck.css`: enfoque de disco, transferencia, reproducción y acabados del tocadiscos
4. `discos.ios-player.css`: controles y composiciones de la escucha en iOS
5. `discos.library.css`: biblioteca, fichas, detalle y navegación de colecciones
6. `discos.responsive.css`: composición final y ajustes de reproductor/footer de dispositivos

### Sistema visual compartido
1. `site-theme.tokens.css`: paleta global y cabecera base
2. `site-theme.editorial.css`: páginas editoriales, calendario y coherencia visual
3. `site-theme.header.css`: cabecera adaptable, navegación y controles de móvil/iPad

### Footer compartido
1. `footer-sign.effects.css`: SVG, animación, descargas, fuegos, niebla, audio y efectos
2. `footer-sign.layout.css`: navegación, créditos, disposición del artwork y responsividad
3. `footer-sign.viewport.css`: ajuste al viewport real debajo del header
4. `footer-sign.touch.css`: prevención de selección y callouts durante gestos táctiles

### Página de Inicio
1. `home-flow.layout.css`: composición y ritmo base
2. `home-flow.releases.css`: galería de nuevos lanzamientos
3. `home-flow.archive.css`: Memoria Viva, galería y retoques próximos
4. `home-flow.refinements.css`: refinamientos visuales y responsive
5. `home-flow.motion.css`: movimiento, rendimiento y escala de Memoria Viva

Los estilos estables `styles.css`, `editorial.css`, `home-discos.css`, `public-header.css`, `ios-header.css`, `bag.css` y `eventos.css` siguen separados.

## Reglas para futuras modificaciones

- Modificar el módulo apropiado. No añadir un override nuevo al final de otro archivo por conveniencia.
- Respetar la cascada entre módulos y los estilos compartidos del HTML.
- Antes de mover reglas entre módulos, comprobar selectores repetidos, especificidad y media queries: **cambiar el orden cambia resultados aunque el CSS parezca igual**.
- Conservar `prefers-reduced-motion`, `:focus-visible`, manejo táctil del footer, estado del audio, navegación por teclado, y área segura de iOS.
- Si se modifica contenido CSS, aumentar la versión de consulta en los links de las cinco páginas y en el manifiesto compatible correspondiente para evitar cachés viejos.
- Ejecutar `node scripts/check-styles.mjs` después de cada cambio.
- Comparar visualmente con un navegador real antes de eliminar sobrescrituras: ancho 320, 375, 430, 768, 1024, 1280 y 1440px, orientaciones vertical/horizontal, alturas de 500/600px, zoom 200%, teclado, toque y arrastre.
- En especial probar Discos en iPad landscape (ancho CSS >950px y detección JS de dispositivo táctil), la biblioteca/miniplayer y el footer bajo el header.

## Pendientes técnicos deliberados

- Consolidar las declaraciones repetidas con distinta prioridad en `discos.*.css` y `site-theme.header.css` solo después de capturas comparativas.
- Revisar reglas de layout en líneas de base antiguas que siguen siendo sobrescritas más adelante.
- Validar rendimiento y capturas reales: la extracción de módulos conservó CSS byte a byte; la siguiente limpieza retiró únicamente 32 declaraciones idénticas repetidas de Discos (con el mismo selector y condición). No es un rediseño.

## Fase 2 — consolidación de Discos y QA responsive

El CSS modular de Discos ya tiene **32 declaraciones repetidas idénticas** menos. En el footer compartido se eliminaron **18 declaraciones idénticas adicionales**. Total de esta fase: **50 declaraciones redundantes**. Se eligieron solamente coincidencias de selector exacto, propiedad, valor y contexto media/supports, donde una declaración posterior es equivalente. No se modificaron los valores finales ni el código de audio.

### Comprobaciones automáticas

```bash
node scripts/check-styles.mjs
node scripts/check-static-media.mjs
npm install --no-save playwright
npx playwright install chromium
node scripts/qa-responsive.mjs https://la-vaca-loca-records.pages.dev --screenshots
```

La segunda herramienta recorre las cinco páginas en diez configuraciones de viewport y produce `qa-results/responsive-report.json`, además de capturas PNG si se usa `--screenshots`. Comprueba desplazamiento horizontal, imágenes visibles rotas, errores JavaScript, IDs duplicados, footer recortado, controles sin nombre y composición de iPad. Sus advertencias deben verificarse manualmente; algunas disposiciones podrían estar diseñadas para ese comportamiento.

**Límite de pruebas:** Playwright usa Chromium. La emulación de iPad mediante user agent activa la lógica responsive específica, pero **no equivale a Safari de iPadOS**. Antes de eliminar reglas condicionales o anunciar un QA completo hay que repetir las pruebas en Safari y en dispositivos táctiles físicos.

### Riesgos pendientes de validación

1. `discos.js` usa la experiencia de reproducción iOS en iPad, incluso en landscape (>950px), mientras varios layouts desktop cambian en 951px; verificar estado, anchura, scroll, mini player y footer.
2. Alturas desktop cortas de 500 y 600px, sobre todo biblioteca desplazable y controles del plato.
   La elección de modo móvil/desktop de `discos.js` también se evalúa al iniciar la página; verificar el cambio de ancho al redimensionar entre 950px y 951px, especialmente con la biblioteca abierta.
3. Footer SVG táctil: confirmar que el arrastre en la obra no active selección, pero que se pueda seguir bajando a los links.
4. 320px y zoom 200%: confirmar que el header, la búsqueda y el CTA de bolsa siguen siendo utilizables.
5. Tras confirmar capturas, consolidar sobrescrituras de distinta propiedad/valor; no eliminarlas a ciegas.

## Auditoría visual

La auditoría de Fase 1 (hallazgos de código, contenido y riesgos responsive, con estado preciso de lo verificado) está en [QA_PHASE1_REPORT.md](QA_PHASE1_REPORT.md). Las capturas reales y el QA táctil de Safari siguen pendientes y **no deben darse por aprobados** hasta ejecutar la matriz y revisarla.
