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
- Validar rendimiento y capturas reales: esta fase preserva CSS byte a byte; no es un rediseño.
