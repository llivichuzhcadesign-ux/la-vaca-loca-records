# La Vaca Loca Records — UI/UX refinement without final content

**Estado: primera iteración de diseño implementada; comprobación visual pendiente.**

El catálogo definitivo de discos, la fotografía, las sesiones y los eventos **todavía no son requisitos** para refinar la interfaz. La fase trabaja con estructura, jerarquía, accesibilidad y layouts editorialmente coherentes sin inventar productos.

## Vista de diseño temporal

Añade `?ui-preview=empty` a cada página para visualizar su composición sin contenido, **sin borrar ni reemplazar datos del administrador**:

- [Inicio](https://la-vaca-loca-records.pages.dev/index.html?ui-preview=empty)
- [Discos](https://la-vaca-loca-records.pages.dev/discos.html?ui-preview=empty)
- [Sessions](https://la-vaca-loca-records.pages.dev/sessions.html?ui-preview=empty)
- [Eventos](https://la-vaca-loca-records.pages.dev/eventos.html?ui-preview=empty)
- [Archivo](https://la-vaca-loca-records.pages.dev/archivo.html?ui-preview=empty)

La vista de diseño solo se habilita con el parámetro explícito. Si la URL no tiene ese parámetro, se presenta la información publicada y el comportamiento habitual. **Es una herramienta de revisión, no un estado de publicación ni una fuente de inventario.**

## Cambios

0. **Inicio / Hero:** en la vista de diseño se reemplazan las fotos por una composición abstracta de color y luz que conserva posiciones del título, contraste y acciones. No se introduce una marca de agua; el carousel publicado no cambia.
1. **Inicio / Nuevos lanzamientos:** cuando no hay discos o se usa la vista de diseño, el bloque conserva su composición y presenta una portada abstracta editorial, texto claro y una acción hacia Biblioteca. No muestra precios ni discos inventados.
2. **Inicio / Sessions:** lista de sesiones ausente en la vista de diseño y en datos vacíos; aparece un detalle informativo breve sin enlaces falsos.
3. **Inicio / Eventos:** gráfica de calendario temporal construida con CSS en la vista de diseño, sin depender de una fotografía inexistente.
4. **Inicio / Memoria Viva:** las filas animadas pueden previsualizarse con piezas abstractas de la misma proporción y ritmo, sin cargar fotografías. Los datos publicados siguen usando las imágenes reales.
5. **Discos:** estado de catálogo vacío que mantiene la sala visual, pero oculta reproductor, controles de búsqueda y filtros que no funcionarían sin inventario. Navegación de retorno al inicio.
6. **Sessions y Archivo:** composición de portada y contenido editorial, mensajes descriptivos y navegación clara cuando aún no existen entradas. Se oculta el índice vacío.
7. **Eventos:** agenda sin eventos diseñada como pieza editorial; el calendario y sus controles siguen funcionando. La ilustración principal también tiene un tratamiento temporal sin foto en la vista de diseño.

## Reglas de diseño a preservar

- La web es **una tienda de discos**, no solo un reproductor ni un portfolio visual.
- Orden de experiencia: **explorar discos → ver ficha → escuchar (si hay preview) → agregar a la bolsa → solicitar pedido**.
- No presentar precio, stock, fecha o grabación que no exista. La interfaz debe comunicar los estados vacíos de forma honesta.
- Mantener el lenguaje visual oscuro / sepia, las texturas de vinilo, el footer eléctrico y los componentes de marca.
- Las adaptaciones de iPhone, Android, iPad y desktop deben respetar el mismo orden narrativo y sus áreas seguras.
- Conservar `prefers-reduced-motion`, foco de teclado, enlaces visibles y tamaños táctiles cómodos.
- Los placeholders de esta fase se implementan con CSS/HTML propios, no con imágenes temporales sujetas a licencias.

## QA

El script `scripts/qa-responsive.mjs` soporta la bandera `--empty`:

```bash
npm install --no-save playwright
npx playwright install chromium
node scripts/qa-responsive.mjs https://la-vaca-loca-records.pages.dev --empty --screenshots
```

Resultado esperado: `qa-results/empty-preview-report.json` y capturas de cada una de las cinco páginas en diez configuraciones de viewport. **La matriz no se ejecutó desde el chat y todavía se requiere validación visual.**

## Siguiente iteración de refinamiento

Después de revisar las capturas: afinar proporciones de portada, espacio del header, legibilidad de títulos, continuidad de los bloques, jerarquía de ficha/precio/bolsa y comportamiento del tocadiscos en iPad landscape. No avanzar a checkout ni contenido hasta que la experiencia de producto esté coherente.
