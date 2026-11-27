# Public website — release verification

Phase 6 preserves the original laser artwork, footer signature, interactive turntable and collage. The intro can be skipped immediately and has a 12-second fail-open deadline. Motion controls remain independent of content editing.

## Automated checks

From the repository root with Node.js 22 or newer:

```sh
node --test tests/*.test.js
```

The tests cover source contracts and simulated interactions; they do not replace rendering in a real browser.

## Browser acceptance checklist

- Test the homepage, Discos, Sessions, Archivo and Visítanos at 320, 390, 768, 1024, 1440 and 1920 CSS pixels, including landscape and 200% zoom.
- On a slow connection, skip the intro and confirm the header is usable; check repeat visits, reduced motion and the 12-second escape.
- Verify both horns animate together when the intro completes normally.
- Verify hero previous/next/pause, Memoria Viva pause/resume, footer interactions and offscreen/hidden-tab behavior.
- Play real audio, switch across the 1024px breakpoint, rotate a tablet, and confirm playback, seek, controls and browsing remain available.
- Verify record detail, favorites, search, shopping bag focus return, stock limits and WhatsApp checkout with configured test data.
- Verify Sessions and Archivo with empty and populated content, unavailable images, and genuine video/audio.
- Verify directions use a configured exact address, and the visit form uses Ecuador time. Do not use production customer data during tests.
- Record browser console errors and mobile/desktop Lighthouse results on the deployed URL before declaring the release validated.

Production deployment and real-device testing are separate from a source-code commit.
