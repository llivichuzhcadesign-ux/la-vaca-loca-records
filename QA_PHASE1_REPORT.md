# Fase 1 — Auditoría visual/responsive de La Vaca Loca Records

**Fecha:** 1 de noviembre de 2026  
**Estado:** revisión estática y de contenido público realizada; ejecución de capturas responsive y revisión manual **pendientes**.  
**Sitio:** https://la-vaca-loca-records.pages.dev/  
**Páginas:** Inicio, Discos, Sessions, Eventos y Archivo.

## Alcance verificado

1. Código actual de GitHub: HTML, CSS modular, renderizado JavaScript, datos de respaldo, navegación, biblioteca y footer.
2. Contexto DOM público abierto en la pestaña del navegador conectado para **Discos**, sin control sobre tamaños ni capturas.
3. Referencias locales de imágenes y archivos de audio contrastadas con la existencia de rutas en GitHub.
4. Preparación de 50 combinaciones de prueba: cinco páginas × diez tamaños, mediante `scripts/qa-responsive.mjs`.
5. **No realizado:** capturas de pantalla en los diez viewports, prueba real de Safari/Android, métricas de Lighthouse ni comparación visual de capturas.

La ausencia de un recurso local en GitHub **no demuestra** que el recurso remoto de Cloudflare R2 publicado también falte: el sitio reemplaza parte del contenido con `/api/content`.

## Hallazgos confirmados

### P1 — Dependencia de recursos locales inexistentes

- En el `data.js` de respaldo hay **8 portadas** (`assets/images/records/lvl001-cover.jpg` a `lvl008-cover.jpg`) y **8 previews** (`assets/audio/previews/lvl001-preview.mp3` a `lvl008-preview.mp3`). Ninguna de esas 16 rutas existe en el repositorio.
- Tampoco están presentes los recursos locales de respaldo para el hero (`lvl-hero-01/02/03.webp`), el póster `calendar-pinup.jpg` y varias imágenes de Sessions/Archivo.
- `discos.js` elimina `img` si falla su carga, y mantiene un fallback tipográfico. Por eso las tarjetas no necesariamente se rompen visualmente: **pierden la portada fotográfica**.
- El DOM público de la pestaña Discos presenta ocho discos y únicamente la portada cargada del primero; las demás tarjetas presentan la composición tipográfica. Requiere verificar si faltan portadas publicadas o si esas fichas son deliberadamente provisionales.
- `home-collage.js` utiliza tres imágenes del hero como fallback para Memoria Viva. Esas rutas no están en el repositorio: si también falla la galería remota, las imágenes del collage podrían no cargarse.

**Acción recomendada:** tratar la galería del catálogo como tarea de contenido de alta prioridad; revisar las URLs `/media/...` y que cada disco visible tenga una portada válida o una indicación editorial explícita de portada provisional.

### P1 — Riesgo de desincronización al cambiar de tamaño en Discos

- En `discos.js`, `iosDiscView` se decide una vez mediante `appleTouch || matchMedia('(max-width:950px)').matches`.
- CSS sigue cambiando según `max-width:950px` / `min-width:951px` durante la sesión.
- En iPad horizontal (>=951px), `appleTouch` mantiene el modo iOS aun cuando las reglas de escritorio están activas. Algunas reglas específicas de `.mobile-disc-view` lo compensan, pero hay riesgo de divergencia en componentes secundarios.
- Al cambiar el viewport de una laptop de más de 950px a menos de 950px (o viceversa), el JS no reconstruye el modo inicial.

**Acción recomendada:** prueba de cambio de tamaño con player/biblioteca activos. No reemplazar la lógica sin una comparación visual; la migración requiere conservar el disco seleccionado, controles de reproducción y scroll.

## Riesgos responsive por página (requieren capturas)

| Página | Teléfonos 320–430 | iPad 768 / 1024 | Laptop corta 500–600px | Desktop 1366–1440 |
| --- | --- | --- | --- | --- |
| **Inicio** | Safe areas, contraste hero, velocidad/visibilidad de Memoria Viva, acciones de compra | Adaptación header + collage | Proporción hero/footer | Ritmo del collage y márgenes |
| **Discos** | Biblioteca, búsqueda/teclado, detalle y mini player | Player iOS, 951px, carrusel, scroll | Controles de plato y biblioteca interna | División tocadiscos/biblioteca y precio |
| **Sessions** | Índice de entradas, multimedia, ancho de tarjetas | Anchura de texto/imagen y menú | Espaciado editorial | Legibilidad y anchura |
| **Eventos** | Calendario y tarjetas de eventos, diálogo accesible | Calendario en orientación horizontal | Contenido bajo header, alto del diálogo | Proporción ilustración/calendario |
| **Archivo** | Imágenes y detalles, navegación por entradas | Disposición de contenido | Flujo de tarjetas | Anchura y lectura |

### Riesgos compartidos

- Header adapta tabs mediante medición dinámica; debe comprobarse **solapamiento real** entre logo, navegación y botones cuando cambia el tamaño y cuando cargan las fuentes.
- Footer tiene SVG con superficies táctiles, prevención de selección y cálculo de altura debajo del header. Revisar arrastre, scroll hacia enlaces sociales y que no se oculte el SVG.
- Textos menores de 11px aparecen en reglas de la sala de Discos; otras reglas posteriores pueden sustituirlos. Validar tamaños **computados**, no inferir legibilidad únicamente desde CSS antiguo.
- A 200% de zoom, revisar navegación, búsqueda, compra y evitar scroll horizontal de la página completa.

## Herramientas preparadas

```bash
node scripts/check-styles.mjs
node scripts/check-static-media.mjs
npm install --no-save playwright
npx playwright install chromium
node scripts/qa-responsive.mjs https://la-vaca-loca-records.pages.dev --screenshots
```

`scripts/qa-responsive.mjs` revisa 10 configuraciones y 5 páginas (50 visitas), comprueba errores JS, fallos 4xx en archivos, scroll horizontal, imágenes, IDs duplicados, objetivos táctiles, colisión del header, altura y SVG del footer, ausencia de portadas en Discos, modo iPad. Genera `qa-results/responsive-report.json` y, con `--screenshots`, 50 imágenes. **El script existe pero todavía no se ha ejecutado contra el sitio publicado.**

`scripts/check-static-media.mjs` genera `qa-results/media-report.json` y lista recursos locales ausentes; es informativo por defecto. `--strict` devuelve error si faltan recursos.

## Puerta de salida de la Fase 1

La auditoría visual se considerará completa cuando se disponga de:
- 50 capturas en viewports definidos y una evaluación visual antes/después.
- Pruebas manuales de scroll/touch en iOS y Android.
- Verificación de Discos a través del breakpoint 950/951px y durante cambios de orientación.
- Revisión del reporte de errores/fallos y resolución o registro explícito de todos los P1.

**No se han realizado cambios de diseño en esta fase.** No conviene aprobar cambios de tamaño o posición del reproductor y footer basándose solamente en una revisión de CSS.
