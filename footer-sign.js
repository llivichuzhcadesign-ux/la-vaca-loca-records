/* Shared public footer. Update this module and footer-sign.css for every public page. */
(function(){
 const footer=document.querySelector('.site-footer, .editorial-footer');
 if(!footer || footer.dataset.lvlFooterReady==='true')return;
 footer.dataset.lvlFooterReady='true';
 footer.classList.add('lvl-footer','illuminated-footer','sign-revealed');
 // One canonical footer: no small logo; the laser artwork is the only large brand mark.
 footer.innerHTML=`
  <nav class="footer-explore" aria-label="Explorar La Vaca Loca">
   <span class="footer-column-label">Explorar</span>
   <a href="index.html">Inicio</a>
   <a href="discos.html">Discos</a>
   <a href="sessions.html">Sessions</a>
   <a href="eventos.html">Eventos</a>
   <a href="archivo.html">Archivo</a>
  </nav>
  <div class="footer-connect" aria-label="Conectar con La Vaca Loca">
   <span class="footer-column-label">Conectar</span>
   <a href="https://www.instagram.com/explore/search/keyword/?q=La%20Vaca%20Loca%20Records" target="_blank" rel="noopener noreferrer" aria-label="Buscar La Vaca Loca Records en Instagram">Instagram <span aria-hidden="true">↗</span></a>
   <a href="https://www.youtube.com/results?search_query=La+Vaca+Loca+Records" target="_blank" rel="noopener noreferrer" aria-label="Buscar La Vaca Loca Records en YouTube">YouTube <span aria-hidden="true">↗</span></a>
   <a href="https://open.spotify.com/search/La%20Vaca%20Loca%20Records" target="_blank" rel="noopener noreferrer" aria-label="Buscar La Vaca Loca Records en Spotify">Spotify <span aria-hidden="true">↗</span></a>
  </div>
  <div class="footer-bottom">
   <span>© ${new Date().getFullYear()} La Vaca Loca Records</span>
   <a class="footer-back-top" href="#top" aria-label="Volver arriba">Volver arriba ↑</a>
   <span class="design-credit"><a href="https://www.instagram.com/semiotice/" target="_blank" rel="noopener noreferrer">Website Design by Sebastian Llivichuzhca</a></span>
  </div>
 `;
 const backdrop=document.createElement('div');
 backdrop.className='footer-laser-backdrop';
 backdrop.setAttribute('aria-hidden','true');
 backdrop.innerHTML="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 273.54 311.51\" class=\"footer-sign-outline\" aria-hidden=\"true\" focusable=\"false\">\n  <g data-name=\"Brand Manual\">\n    <g>\n      <g>\n        <path d=\"M123.83,309.51l-2.6-9.99h1.31l2.27,8.85h1.54l2.27-8.85h1.31l-2.6,9.99h-3.51Z\" pathLength=\"1000\" />\n        <path d=\"M130.44,300.81v-.88l2.28-.76v1.21l-2.28.43ZM130.65,309.51v-7.99h1.28v7.99h-1.28Z\" pathLength=\"1000\" />\n        <path d=\"M133.08,308.23v-3.28l5.71-.14v-2.14h-5.42v-1.14h5.42l1.28,1.28v6.71h-5.71l-1.28-1.28ZM134.36,306.09v2.28h4.42v-2.57l-4.42.29Z\" pathLength=\"1000\" />\n        <path d=\"M144.63,308.37v-7.7l1.14-1.14h5.28v1.17h-5.14v7.65h5.28v1.17h-5.42l-1.14-1.14Z\" pathLength=\"1000\" />\n        <path d=\"M159.19,301.52v7.99h-5.85l-1.28-1.28v-6.71h1.28v6.85h4.57v-6.85h1.28Z\" pathLength=\"1000\" />\n        <path d=\"M160.4,308.23v-5.42l1.28-1.28h5.56v4.42h-5.56v2.42h5.28v1.14h-5.28l-1.28-1.28ZM161.68,304.95l4.34-.14v-2.14h-4.34v2.28Z\" pathLength=\"1000\" />\n        <path d=\"M171.46,305.59v-1.28h3.71v1.28h-3.71Z\" pathLength=\"1000\" />\n        <path d=\"M179.45,308.37v-7.7l1.14-1.14h5.99v1.14h-5.85v7.7h5.05v-3.52h-3.05v-1.11h4.28v5.78h-6.42l-1.14-1.14Z\" pathLength=\"1000\" />\n        <path d=\"M195.43,301.52v7.99h-5.85l-1.28-1.28v-6.71h1.28v6.85h4.57v-6.85h1.28Z\" pathLength=\"1000\" />\n        <path d=\"M196.57,308.23v-3.28l5.71-.14v-2.14h-5.42v-1.14h5.42l1.28,1.28v6.71h-5.71l-1.28-1.28ZM197.85,306.09v2.28h4.42v-2.57l-4.42.29Z\" pathLength=\"1000\" />\n        <path d=\"M204.84,309.51v-9.99h1.28v9.99h-1.28Z\" pathLength=\"1000\" />\n        <path d=\"M207.27,308.23v-3.28l5.71-.14v-2.14h-5.42v-1.14h5.42l1.28,1.28v6.71h-5.71l-1.28-1.28ZM208.55,306.09v2.28h4.42v-2.57l-4.42.29Z\" pathLength=\"1000\" />\n        <path d=\"M215.47,308.23v-5.42l1.28-1.28h5.28v1.14h-5.28v5.71h5.28v1.14h-5.28l-1.28-1.28Z\" pathLength=\"1000\" />\n        <path d=\"M222.82,308.23v-5.42l1.28-1.28h5.56v4.42h-5.56v2.42h5.28v1.14h-5.28l-1.28-1.28ZM224.1,304.95l4.34-.14v-2.14h-4.34v2.28Z\" pathLength=\"1000\" />\n        <path d=\"M230.81,308.23v-5.42l1.28-1.28h4.42l1.28,1.28v5.42l-1.28,1.28h-4.42l-1.28-1.28ZM232.09,308.37h4.42v-5.71h-4.42v5.71Z\" pathLength=\"1000\" />\n        <path d=\"M239.44,309.51v-1.43h1.34v1.43l-1.14,2h-1.03l1.16-2h-.33Z\" pathLength=\"1000\" />\n        <path d=\"M253.14,300.67h-6.42v2.88l6.42.43v4.39l-1.14,1.14h-6.42v-1.14h6.28v-3.39l-6.42-.43v-5.02h7.7v1.14Z\" pathLength=\"1000\" />\n        <path d=\"M260.84,299.52l1.14,1.14v7.7l-1.14,1.14h-5.85v-1.14h5.71v-2.57h-5.28l-1-1v-4.14l1.14-1.14h5.28ZM260.7,300.67h-4.99v3.99h4.99v-3.99Z\" pathLength=\"1000\" />\n        <path d=\"M262.98,306.94l.49-7.42h1.23l-.43,6.28h5.14v-6.28h1.28v9.99h-1.28v-2.57h-6.42Z\" pathLength=\"1000\" />\n        <path d=\"M272.26,309.51v-1.43h1.28v1.43h-1.28Z\" pathLength=\"1000\" />\n      </g>\n      <g>\n        <path d=\"M7.56,300.67v4.28l-.96.96,1.74,3.61h-1.38l-1.61-3.42H1.28v3.42H0v-9.99h6.42l1.14,1.14ZM1.28,304.95h4.99v-4.28H1.28v4.28Z\" pathLength=\"1000\" />\n        <path d=\"M8.77,308.23v-5.42l1.28-1.28h5.56v4.42h-5.56v2.42h5.28v1.14h-5.28l-1.28-1.28ZM10.06,304.95l4.34-.14v-2.14h-4.34v2.28Z\" pathLength=\"1000\" />\n        <path d=\"M16.76,308.23v-5.42l1.28-1.28h5.28v1.14h-5.28v5.71h5.28v1.14h-5.28l-1.28-1.28Z\" pathLength=\"1000\" />\n        <path d=\"M24.11,308.23v-5.42l1.28-1.28h4.42l1.28,1.28v5.42l-1.28,1.28h-4.42l-1.28-1.28ZM25.4,308.37h4.42v-5.71h-4.42v5.71Z\" pathLength=\"1000\" />\n        <path d=\"M32.32,309.52v-6.71l1.28-1.28h4.28v1.14h-4.28v6.85h-1.28Z\" pathLength=\"1000\" />\n        <path d=\"M45.73,299.53v9.99h-5.92l-1.28-1.28v-5.42l1.28-1.28h4.64v-2h1.28ZM39.81,308.37h4.64v-5.71h-4.64v5.71Z\" pathLength=\"1000\" />\n        <path d=\"M50.44,309.52v-1.14h5.99v-3.18l-6.13-.47v-4.05l1.14-1.14h6.13v1.14h-5.99v3.04l6.13.47v4.2l-1.14,1.14h-6.14Z\" pathLength=\"1000\" />\n        <path d=\"M59,300.24l1.28-.71v2.28h3.71v1.14h-3.71v5.42h3.71v1.14h-3.71l-1.28-1.28v-7.99Z\" pathLength=\"1000\" />\n        <path d=\"M64.63,308.23v-5.42l1.28-1.28h4.42l1.28,1.28v5.42l-1.28,1.28h-4.42l-1.28-1.28ZM65.92,308.37h4.42v-5.71h-4.42v5.71Z\" pathLength=\"1000\" />\n        <path d=\"M72.84,309.52v-6.71l1.28-1.28h4.28v1.14h-4.28v6.85h-1.28Z\" pathLength=\"1000\" />\n        <path d=\"M79.04,308.23v-5.42l1.28-1.28h5.56v4.42h-5.56v2.42h5.28v1.14h-5.28l-1.28-1.28ZM80.33,304.95l4.34-.14v-2.14h-4.34v2.28Z\" pathLength=\"1000\" />\n      </g>\n      <g>\n        <path d=\"M2.6,294.2v-41.93h6.73v36.26h11.93v5.67H2.6Z\" pathLength=\"1000\" />\n        <path d=\"M23.21,294.2l8.45-41.93h8.98l8.5,41.93h-6.85l-1.89-10.1h-8.74l-1.83,10.1h-6.62ZM32.6,278.72h6.85l-3.43-19.67-3.43,19.67Z\" pathLength=\"1000\" />\n        <path d=\"M66.09,294.2l-7.97-41.93h6.85l5.73,34.67,5.79-34.67h6.44l-7.97,41.93h-8.86Z\" pathLength=\"1000\" />\n        <path d=\"M82.51,294.2l8.45-41.93h8.98l8.5,41.93h-6.85l-1.89-10.1h-8.74l-1.83,10.1h-6.62ZM91.9,278.72h6.85l-3.43-19.67-3.43,19.67Z\" pathLength=\"1000\" />\n        <path d=\"M122.26,294.91c-2.4,0-4.49-.65-6.26-1.95-1.77-1.3-3.14-3.52-4.1-6.67-.97-3.15-1.45-7.5-1.45-13.05s.48-9.9,1.45-13.05c.96-3.15,2.33-5.37,4.1-6.67,1.77-1.3,3.86-1.95,6.26-1.95,2.09,0,3.94.51,5.55,1.53,1.61,1.02,2.89,2.74,3.84,5.14.94,2.4,1.44,5.69,1.48,9.86l-6.2.24c-.16-4.21-.59-7.15-1.3-8.8-.71-1.65-1.81-2.48-3.31-2.48-1.02,0-1.91.39-2.66,1.18-.75.79-1.33,2.18-1.74,4.16-.41,1.99-.62,4.75-.62,8.3v5.08c0,3.51.21,6.25.62,8.24.41,1.99,1,3.39,1.77,4.19.77.81,1.66,1.21,2.69,1.21,1.5,0,2.59-.83,3.28-2.48.69-1.65,1.11-4.57,1.27-8.74l6.2.18c-.08,4.25-.6,7.58-1.57,9.98-.97,2.4-2.25,4.1-3.87,5.08-1.61.98-3.43,1.48-5.43,1.48Z\" pathLength=\"1000\" />\n        <path d=\"M135.08,294.2l8.45-41.93h8.98l8.5,41.93h-6.85l-1.89-10.1h-8.74l-1.83,10.1h-6.62ZM144.47,278.72h6.85l-3.43-19.67-3.43,19.67Z\" pathLength=\"1000\" />\n        <path d=\"M172.93,294.2v-41.93h6.73v36.26h11.93v5.67h-18.66Z\" pathLength=\"1000\" />\n        <path d=\"M205.36,294.91c-2.56,0-4.74-.67-6.53-2.01-1.79-1.34-3.16-3.59-4.11-6.76-.94-3.17-1.42-7.47-1.42-12.91s.47-9.84,1.42-12.99c.95-3.15,2.31-5.38,4.11-6.71,1.79-1.32,3.97-1.98,6.53-1.98s4.73.66,6.53,1.98c1.79,1.32,3.16,3.55,4.11,6.71.95,3.15,1.42,7.48,1.42,12.99s-.47,9.73-1.42,12.91c-.94,3.17-2.31,5.42-4.11,6.76-1.79,1.34-3.97,2.01-6.53,2.01ZM205.36,289.41c1.1,0,2.03-.4,2.78-1.21.75-.81,1.33-2.21,1.74-4.22.41-2.01.62-4.78.62-8.33v-4.9c0-3.54-.21-6.31-.62-8.3-.41-1.99-.99-3.39-1.74-4.19-.75-.81-1.67-1.21-2.78-1.21s-2.04.4-2.81,1.21c-.77.81-1.35,2.2-1.74,4.19-.39,1.99-.59,4.75-.59,8.3v4.9c0,3.54.2,6.31.59,8.3.39,1.99.97,3.4,1.74,4.22.77.83,1.7,1.24,2.81,1.24Z\" pathLength=\"1000\" />\n        <path d=\"M233.47,294.91c-2.4,0-4.49-.65-6.26-1.95-1.77-1.3-3.14-3.52-4.1-6.67-.97-3.15-1.45-7.5-1.45-13.05s.48-9.9,1.45-13.05c.96-3.15,2.33-5.37,4.1-6.67,1.77-1.3,3.86-1.95,6.26-1.95,2.09,0,3.94.51,5.55,1.53,1.61,1.02,2.89,2.74,3.84,5.14.94,2.4,1.44,5.69,1.48,9.86l-6.2.24c-.16-4.21-.59-7.15-1.3-8.8-.71-1.65-1.81-2.48-3.31-2.48-1.02,0-1.91.39-2.66,1.18-.75.79-1.33,2.18-1.74,4.16-.41,1.99-.62,4.75-.62,8.3v5.08c0,3.51.21,6.25.62,8.24.41,1.99,1,3.39,1.77,4.19.77.81,1.66,1.21,2.69,1.21,1.5,0,2.59-.83,3.28-2.48.69-1.65,1.11-4.57,1.27-8.74l6.2.18c-.08,4.25-.6,7.58-1.57,9.98-.97,2.4-2.25,4.1-3.87,5.08-1.61.98-3.43,1.48-5.43,1.48Z\" pathLength=\"1000\" />\n        <path d=\"M246.29,294.2l8.45-41.93h8.98l8.5,41.93h-6.85l-1.89-10.1h-8.74l-1.83,10.1h-6.62ZM255.68,278.72h6.85l-3.43-19.67-3.43,19.67Z\" pathLength=\"1000\" />\n      </g>\n    </g>\n    <g>\n      <g>\n        <g>\n          <path d=\"M52.1,219.41s64.49-78.7,90.8-71.94c26.3,6.76,29.33,32.4,29.33,32.4,0,0,5.22,42.94-38.85,42.66-.05,0-.11,0-.17,0-22.25-2.33-25.8-14.54-25.8-14.54,0,0,11.66,29.06,46.49,18.43,34.84-10.63,35.51-43.02,35.51-43.02,0,0,.14-25.96-20.28-40.96-.48-.35-2.02-1.18-2.02-1.18,0,0,1.92-.85,2.29-1,6.16-2.48,24.91-6.79,34.49,26.79,6.4,19.42-.4,37.41-6.42,48.2-.75,1.34,1.05,2.64,2.07,1.49,9.45-10.66,22.46-29.9,19.11-52.46-4.28-28.83-29.99-39.73-38.1-43.41-.78-.35-3.07-1.22-3.07-1.22,0,0,1.92-.51,2.64-.91,3.15-1.74,7.52-6.62,6.93-14.45-.03-.35.09-.69.33-.94,2.5-2.58,17.12-15.88,35.48,5,20.2,22.96,10.86,50.51,10.46,51.61-.4,1.1,18.25-23.12,6.78-53.2-10.01-26.25-36.64-27.01-43.26-26.77-.81.03-1.43-.7-1.29-1.5.91-4.9,5.38-20.35,26.78-34.44,1.22-.81.38-2.69-1.03-2.31-10.76,2.9-31.39,11.2-47.55,34.22,0,0,27.16-35.68,30.71-53.43.21-1.04-.89-1.87-1.82-1.37-16.68,8.87-50.16,53.21-50.16,53.21,19.82-19.48,24.95-46.29,26.23-61,.14-1.61-2.12-2.09-2.67-.57-7.96,21.99-20.65,29.8-24.94,31.9-.39.19-1.52.85-1.52.85,0,0-.02-.61-.19-1.63-1.14-6.53-9.49-31.96-37.46-34.57-32.05-2.99-50.39,21.47-49.44,20.79.95-.68,24.99-17.05,52.52-3.74,25.03,12.1,16.14,29.75,14.32,32.85-.18.3-.48.5-.82.57-7.7,1.53-10.84,7.15-12.06,10.54-.17.47-.73,3.62-.73,3.62,0,0-1.22-2.87-1.53-3.32-5.15-7.27-23.02-28.82-51.95-25.22-22.18,2.76-37.08,19.8-44.95,31.74-.91,1.38.92,2.89,2.11,1.75,8.88-8.61,24.15-19.46,44.13-18.52,34.55.24,35.76,19.05,35.07,25.85-.04.35-.25,2.74-.25,2.74,0,0-1.39-1.37-1.96-1.82-19.9-15.49-44.74-8.44-44.74-8.44,0,0-31.02,9.32-31.93,45.74-.91,36.41,30.21,39.86,30.21,39.86,0,0-12.71-.15-20.92-20.97-.02-.05-.04-.11-.05-.16-12.07-42.39,30.69-48.86,30.69-48.86,0,0,25.52-3.95,39.07,19.58,13.56,23.53-46.62,105.51-46.62,105.51Z\" pathLength=\"1000\" />\n          <path d=\"M90.61,83.48c8.12,3.03,15.69,10.65,15.88,19.71-.83-2.06-1.65-4.01-2.76-5.82-3.35-5.5-8.16-9.81-13.12-13.89h0Z\" pathLength=\"1000\" />\n          <path d=\"M174.54,147.11c-7.5-4.39-18.64-13.03-27.54-12.06,8.98-3.7,21.77,5.58,27.54,12.06h0Z\" pathLength=\"1000\" />\n          <path d=\"M186.2,123.39c-7.78-3.72-16.84-4.33-25.09-1.87.98-.49,1.96-1.01,2.99-1.44,3.11-1.24,6.52-1.9,9.88-1.82,4.48.16,8.94,2.15,12.22,5.13h0Z\" pathLength=\"1000\" />\n          <path d=\"M109.51,64.8c7.16,5.3,10.5,15.27,8.56,23.88-.86-8.6-3.53-16.79-8.56-23.88h0Z\" pathLength=\"1000\" />\n          <path d=\"M147.1,38.64c6.11,5.91,2.9,15.1-2.39,20.37,1.73-3.15,3.22-6.51,3.58-10.07.38-3.47.53-7.09-1.19-10.31h0Z\" pathLength=\"1000\" />\n          <path d=\"M204.61,80.25c-9.31.13-18.26,2.29-26.7,6.2,7.04-6.3,17.6-8.81,26.7-6.2h0Z\" pathLength=\"1000\" />\n          <path d=\"M186.54,109.82c-.29-4.36.07-9.57-4.05-12.3,5.89.24,6.77,8.28,4.05,12.3h0Z\" pathLength=\"1000\" />\n          <path d=\"M138.23,64.14c-3.54-3.6-7.81-4.27-12.47-2.71-2.34.81-2.34.76-.42-.85,4.38-3.36,11.3-2.07,12.9,3.56h0Z\" pathLength=\"1000\" />\n        </g>\n        <g>\n          <g>\n            <path d=\"M157.04,175.48c-7.84,1.56-7.84,11.7,0,13.26.4.08.83.08,1.23,0,7.84-1.56,7.84-11.7,0-13.26-.4-.08-.83-.08-1.23,0Z\" pathLength=\"1000\" />\n            <path d=\"M217.59,56.78c-7.84,1.56-7.84,11.7,0,13.26.4.08.83.08,1.23,0,7.84-1.56,7.84-11.7,0-13.26-.4-.08-.83-.08-1.23,0Z\" pathLength=\"1000\" />\n            <path d=\"M197.4,168.47c-6.08,1.11-6.08,8.95,0,10.06.23.04.47.04.69,0,6.08-1.11,6.08-8.95,0-10.06-.23-.04-.47-.04-.69,0Z\" pathLength=\"1000\" />\n            <path d=\"M224.14,125.38c-6.09,1.11-6.09,8.95,0,10.06.23.04.47.04.69,0,6.08-1.11,6.08-8.95,0-10.06-.22-.04-.47-.04-.69,0Z\" pathLength=\"1000\" />\n            <path d=\"M233.21,74.02c-6.08,1.11-6.08,8.95,0,10.06.23.04.47.04.69,0,6.08-1.11,6.08-8.95,0-10.06-.22-.04-.47-.04-.69,0Z\" pathLength=\"1000\" />\n            <path d=\"M239.73,56.75c-6.08,1.11-6.08,8.95,0,10.06.23.04.47.04.69,0,6.08-1.11,6.08-8.95,0-10.06-.23-.04-.47-.04-.69,0Z\" pathLength=\"1000\" />\n            <path d=\"M116.92,165.67c-6.08,1.11-6.08,8.95,0,10.06.23.04.47.04.69,0,6.08-1.11,6.08-8.95,0-10.06-.23-.04-.47-.04-.69,0Z\" pathLength=\"1000\" />\n            <circle cx=\"208.49\" cy=\"117.06\" r=\"9.71\" pathLength=\"1000\" />\n            <path d=\"M218.95,143.36c.56-4.11,5.83-4.11,6.39,0-.56,4.11-5.83,4.11-6.39,0h0Z\" pathLength=\"1000\" />\n            <path d=\"M202.72,38.94c.56-4.11,5.83-4.11,6.39,0h0c-.56,4.11-5.83,4.11-6.39,0h0Z\" pathLength=\"1000\" />\n            <path d=\"M223,156.16c.56-4.11,5.83-4.11,6.39,0h0c-.56,4.11-5.83,4.11-6.39,0Z\" pathLength=\"1000\" />\n            <path d=\"M143.57,196.63c-1.78,8.75-13.08,8.75-14.86,0-.1-.48-.1-.98,0-1.46,1.78-8.75,13.08-8.75,14.86,0,.1.48.1.98,0,1.46Z\" pathLength=\"1000\" />\n          </g>\n          <g>\n            <path d=\"M83.28,127.31c-2.54,2.54-6.65,2.54-9.19,0-2.54-2.54-2.54-6.65,0-9.19,2.54-2.54,6.65-2.54,9.19,0,2.54,2.54,2.54,6.65,0,9.19Z\" pathLength=\"1000\" />\n            <path d=\"M162.25,20.47c-2.54,2.54-6.65,2.54-9.19,0-2.54-2.54-2.54-6.65,0-9.19,2.54-2.54,6.65-2.54,9.19,0,2.54,2.54,2.54,6.65,0,9.19Z\" pathLength=\"1000\" />\n            <path d=\"M82.15,74c-1.92,1.92-5.03,1.92-6.94,0s-1.92-5.03,0-6.94c1.92-1.92,5.03-1.92,6.94,0,1.92,1.92,1.92,5.03,0,6.94Z\" pathLength=\"1000\" />\n            <path d=\"M94.32,37.41c-1.92,1.92-5.03,1.92-6.94,0-1.92-1.92-1.92-5.03,0-6.94s5.03-1.92,6.94,0,1.92,5.03,0,6.94Z\" pathLength=\"1000\" />\n            <path d=\"M72.19,156.55c-1.92,1.92-5.03,1.92-6.94,0-1.92-1.92-1.92-5.03,0-6.94,1.92-1.92,5.03-1.92,6.94,0,1.92,1.92,1.92,5.03,0,6.94Z\" pathLength=\"1000\" />\n            <path d=\"M117.16,48.91c3.79-3.79,3.79-9.94,0-13.74-3.79-3.79-9.94-3.79-13.74,0-3.79,3.79-3.79,9.94,0,13.74,3.79,3.79,9.94,3.79,13.74,0Z\" pathLength=\"1000\" />\n            <path d=\"M77.78,34.51c1.2-1.2,1.2-3.16,0-4.36-1.2-1.2-3.16-1.2-4.36,0-1.2,1.2-1.2,3.16,0,4.36,1.2,1.2,3.16,1.2,4.36,0Z\" pathLength=\"1000\" />\n            <path d=\"M63.61,69.62c1.2-1.2,1.2-3.16,0-4.36-1.2-1.2-3.16-1.2-4.36,0-1.2,1.2-1.2,3.16,0,4.36,1.2,1.2,3.16,1.2,4.36,0Z\" pathLength=\"1000\" />\n            <path d=\"M191.6,24.44c1.2-1.2,1.2-3.16,0-4.36-1.2-1.2-3.16-1.2-4.36,0-1.2,1.2-1.2,3.16,0,4.36,1.2,1.2,3.16,1.2,4.36,0Z\" pathLength=\"1000\" />\n            <path d=\"M137.49,6.23c1.2-1.2,1.2-3.16,0-4.36-1.2-1.2-3.16-1.2-4.36,0-1.2,1.2-1.2,3.16,0,4.36s3.16,1.2,4.36,0Z\" pathLength=\"1000\" />\n            <path d=\"M56.27,119.2c-2.85,2.85-2.85,7.46,0,10.31,2.85,2.85,7.46,2.85,10.31,0,2.85-2.85,2.85-7.46,0-10.31-2.85-2.85-7.46-2.85-10.31,0Z\" pathLength=\"1000\" />\n          </g>\n        </g>\n      </g>\n      <path d=\"M141.83,83.51c4.43-2.1,7.3-6.54,10.27-10.28,0,0,1.63,1.23,1.63,1.23-3.5,3.37-7.17,7.54-11.9,9.05h0Z\" pathLength=\"1000\" />\n      <path d=\"M164.91,92.47c1.81-6.06,4.66-11.88,8.1-17.18,0,0,1.52,1.2,1.52,1.2-3.94,4.86-7.19,10.2-9.61,15.98h0Z\" pathLength=\"1000\" />\n    </g>\n  </g>\n</svg>"+'<span class="footer-sign-face"></span><span class="footer-sign-sweep" aria-hidden="true"></span>';
 const etched=backdrop.querySelector('.footer-sign-outline');
 if(!etched)return;
 etched.classList.replace('footer-sign-outline','footer-laser-etch');
 backdrop.querySelectorAll('.footer-sign-face,.footer-sign-sweep').forEach(el=>el.remove());
 // The original contour is the electrical discharge's physical starting point.
 const cowContour=[...etched.querySelectorAll('path')].find(path=>
  (path.getAttribute('d')||'').startsWith('M52.1,219.41'));
 cowContour?.classList.add('footer-hero-contour');
 const halo=document.createElement('div');
 halo.className='footer-interaction-halo';
 backdrop.insertBefore(halo,backdrop.firstChild);
 const sonicField=document.createElement('div');
 sonicField.className='footer-sonic-field';
 sonicField.setAttribute('aria-hidden','true');
 sonicField.innerHTML='<span class="sonic-groove sonic-groove-outer"></span><span class="sonic-groove sonic-groove-inner"></span>';
 backdrop.insertBefore(sonicField,etched);
 const sonicInk=etched.cloneNode(true);
 sonicInk.classList.remove('footer-laser-etch');
 sonicInk.classList.add('footer-sonic-ink');
 const sonicCow=[...sonicInk.querySelectorAll('path')].find(path=>(path.getAttribute('d')||'').startsWith('M52.1,219.41'));
 sonicInk.querySelectorAll('path,circle').forEach(part=>{if(part!==sonicCow)part.remove()});
 if(sonicCow)backdrop.insertBefore(sonicInk,backdrop.querySelector('.footer-laser-trail'));
 // Independent pixel-coordinate SVG; doesn't change the original brand illustration.
 const ns='http://www.w3.org/2000/svg';
 const electric=document.createElementNS(ns,'svg');
 electric.setAttribute('class','footer-electric-circuit');
 electric.setAttribute('aria-hidden','true');
 electric.setAttribute('focusable','false');
 backdrop.appendChild(electric);
 footer.insertBefore(backdrop,footer.firstChild);
 // On touch devices this transparent surface receives finger drags. It sits
 // below the real navigation, so links and credits remain normally tappable.
 const touchSurface=document.createElement('div');
 touchSurface.className='footer-touch-surface';
 touchSurface.setAttribute('aria-hidden','true');
 footer.insertBefore(touchSurface,backdrop.nextSibling);

 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 // One arrival per page visit: motion is on the artwork, never on the navigation.
 let introComplete=motion.matches,introStarted=false,introTimer=0;
 if(!introComplete)footer.classList.add('footer-intro-pending');
 const introTrace=etched.cloneNode(true);
 introTrace.classList.remove('footer-laser-etch');
 introTrace.classList.add('footer-intro-trace');
 introTrace.querySelectorAll('path,circle').forEach(part=>{
  if((part.getAttribute('d')||'').startsWith('M52.1,219.41')){
   part.classList.add('footer-intro-path');part.setAttribute('pathLength','100');
  }
  else part.remove();
 });
 backdrop.insertBefore(introTrace,electric);
 function finishFooterIntro(){
  clearTimeout(introTimer);
  footer.classList.remove('footer-intro-pending','footer-intro-active');
  footer.classList.add('footer-intro-complete');
  introComplete=true;
 }
 function startFooterIntro(){
  if(introStarted||introComplete||document.hidden)return;
  introStarted=true;
  footer.classList.remove('footer-intro-pending');
  footer.classList.add('footer-intro-active');
  introTimer=window.setTimeout(finishFooterIntro,2950);
 }
 let isVisible=true, energized=false, touchOff=0, glowOff=0;
 const clamp=(n,low,high)=>Math.min(high,Math.max(low,n));
 const pointFromEvent=event=>{
  const rect=footer.getBoundingClientRect();
  if(!rect.width||!rect.height)return null;
  const x=clamp((event.clientX-rect.left)/rect.width*100,0,100);
  const y=clamp((event.clientY-rect.top)/rect.height*100,0,100);
  // The drawing is the interaction surface. Preserve ordinary link hover behavior.
  const mobile=rect.width<=720;
  return {x,y,clientX:event.clientX,clientY:event.clientY,
   inside: mobile ? (y>=5&&y<=79) : (x>=12&&x<=85&&y>=6&&y<=90)};
 };
 // Map the cursor to the nearest real point on the cow's vector contour.
 // Cache path samples so each discharge is cheap, even on touch screens.
 let contourSamples=null,lastDischargeAt=-Infinity,lastBurstAt=-Infinity,lastArcPoint=null;
 function nearestContour(point){
  if(!cowContour||typeof cowContour.getTotalLength!=='function')return null;
  try{
   if(!contourSamples){
    const length=cowContour.getTotalLength();
    contourSamples=Array.from({length:180},(_,i)=>{
     const at=length*i/179;
     const sample=cowContour.getPointAtLength(at);
     return {x:sample.x,y:sample.y,at};
    });
   }
   const matrix=cowContour.getScreenCTM();
   if(!matrix)return null;
   const cursor=etched.createSVGPoint();cursor.x=point.clientX;cursor.y=point.clientY;
   const local=cursor.matrixTransform(matrix.inverse());
   let best=null,bestDistance=Infinity;
   for(const sample of contourSamples){
    const dx=sample.x-local.x,dy=sample.y-local.y;
    const dist=dx*dx+dy*dy;
    if(dist<bestDistance){bestDistance=dist;best=sample;}
   }
   if(!best)return null;
   const at=etched.createSVGPoint();at.x=best.x;at.y=best.y;
   const screen=at.matrixTransform(matrix),box=backdrop.getBoundingClientRect();
   const total=cowContour.getTotalLength();
   // Illuminate a short, genuine segment of the original silhouette.
   const localScale=Math.max(.01,Math.hypot(matrix.a,matrix.b));
   const start=Math.max(0,best.at-58/localScale);
   const finish=Math.min(total,best.at+84/localScale);
   const stepCount=14;
   let contourD='';
   for(let i=0;i<=stepCount;i++){
    const p=cowContour.getPointAtLength(start+(finish-start)*i/stepCount);
    const screenP=etched.createSVGPoint();screenP.x=p.x;screenP.y=p.y;
    const px=screenP.matrixTransform(matrix);
    contourD+=(i?' L ':'M ')+(px.x-box.left).toFixed(1)+' '+(px.y-box.top).toFixed(1);
   }
   return {x:screen.x-box.left,y:screen.y-box.top,
    distance:Math.hypot(screen.x-point.clientX,screen.y-point.clientY),
    contourD};
  }catch{return null;}
 }
 // Controlled angled offsets give a crackling arc without continuous particle loops.
 function jaggedPath(x1,y1,x2,y2,seed){
  const dx=x2-x1,dy=y2-y1,dist=Math.hypot(dx,dy)||1;
  const nx=-dy/dist,ny=dx/dist;
  const count=Math.max(8,Math.min(19,Math.round(dist/17)));
  const phase=seed*.73;
  let d='M '+x1.toFixed(1)+' '+y1.toFixed(1);
  for(let i=1;i<count;i++){
   const t=i/count,envelope=Math.sin(Math.PI*t);
   const jitter=(Math.sin(i*3.8+phase)*.62+Math.sin(i*7.1+phase)*.38)*Math.min(19,dist*.075)*envelope;
   d+=' L '+(x1+dx*t+nx*jitter).toFixed(1)+' '+(y1+dy*t+ny*jitter).toFixed(1);
  }
  return d+' L '+x2.toFixed(1)+' '+y2.toFixed(1);
 }
 // A finite, physically animated canvas replaces identical CSS spark trails.
 // Five distinctly different firework forms share the same cow-to-cursor discharge.
 const random=(min,max)=>min+Math.random()*(max-min);
 const fireworkCanvas=document.createElement('canvas');
 fireworkCanvas.className='footer-firework-canvas';
 fireworkCanvas.setAttribute('aria-hidden','true');
 backdrop.appendChild(fireworkCanvas);
 let fireworksContext=null;
 try{fireworksContext=fireworkCanvas.getContext('2d',{alpha:true});}catch{}
 let fireworkFrame=0,fireworkFrameAt=0,particles=[],particleBudget=440;
 const fireworks=['peony','willow','crackle','fountain','palm'];
 let patternIndex=0,lastFinaleAt=-Infinity;
 const maxParticles=()=>particleBudget;
 function sizeFireworkCanvas(){
  if(!fireworksContext)return;
  const rect=backdrop.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  particleBudget=rect.width<=720?210:260;
  const scale=Math.min(window.devicePixelRatio||1,1.25);
  const w=Math.round(rect.width*scale),h=Math.round(rect.height*scale);
  if(fireworkCanvas.width!==w||fireworkCanvas.height!==h){
   fireworkCanvas.width=w;fireworkCanvas.height=h;
   fireworksContext.setTransform(scale,0,0,scale,0,0);
  }
 }
 if('ResizeObserver' in window){
  const observer=new ResizeObserver(sizeFireworkCanvas);
  observer.observe(backdrop);
 }else window.addEventListener('resize',sizeFireworkCanvas,{passive:true});
 function fireworkParticle(x,y,vx,vy,opts={}){
  if(particles.length>=maxParticles())particles.splice(0,Math.min(12,Math.max(1,particles.length-maxParticles()+1)));
  particles.push({
   x,y,vx,vy,drag:opts.drag??.983,gravity:opts.gravity??.075,
   life:opts.life??66,age:0,radius:opts.radius??1.7,
   color:opts.color??'255,216,184',trail:opts.trail??7,
   points:[{x,y}],twinkle:opts.twinkle??false,split:opts.split??false,
   seed:Math.random()*Math.PI*2
  });
 }
 const palette={
  peony:['255,248,220','246,167,200','255,199,147','255,234,204'],
  willow:['255,226,158','248,179,98','255,241,195'],
  crackle:['255,252,231','252,196,156','247,160,181'],
  fountain:['255,244,216','253,178,178','236,134,183'],
  palm:['255,226,174','255,197,121','255,234,213']
 };
 function flashParticle(x,y,size=24){
  fireworkParticle(x,y,0,0,{life:12,drag:1,gravity:0,radius:size,
   color:'255,245,215',trail:0});
 }
 function launchParticles(x,y,type='peony',strength=1,heading=0){
  if(!fireworksContext||motion.matches||!isVisible||document.hidden)return false;
  sizeFireworkCanvas();
  const mobile=footer.getBoundingClientRect().width<=720;
  const scale=(mobile?.73:1)*strength;
  const budget=mobile?.65:1;
  const choose=(i)=>palette[type][i%palette[type].length];
  let count=0;
  if(type==='peony')count=Math.round(58*budget);
  else if(type==='willow')count=Math.round(36*budget);
  else if(type==='crackle')count=Math.round(37*budget);
  else if(type==='fountain')count=Math.round(43*budget);
  else count=Math.round(23*budget); // Palm creates broader, heavier branching trails.
  for(let i=0;i<count;i++){
   const a=type==='fountain'?-Math.PI/2+random(-.58,.58):
     (Math.PI*2*(i+random(-.36,.36))/count);
   const speed=(type==='fountain'?random(3.8,7.3):
    type==='willow'?random(2.3,3.7):
    type==='palm'?random(4.4,6.4):random(2.6,5.7))*scale;
   // Slightly favor the cow-to-cursor direction without erasing the signature pattern.
   const directional=type==='fountain'?0:(strength>=.95?.17:.06);
   const vx=Math.cos(a)*speed+Math.cos(heading)*directional*speed;
   const vy=Math.sin(a)*speed+Math.sin(heading)*directional*speed;
   fireworkParticle(x,y,vx,vy,{
    color:choose(i),
    life:type==='willow'?random(98,145):
     type==='palm'?random(95,130):type==='fountain'?random(45,72):random(52,87),
    drag:type==='willow'?.992:type==='palm'?.988:.984,
    gravity:type==='fountain'?.27:type==='willow'?.17:type==='palm'?.10:.065,
    trail:type==='willow'?17:type==='palm'?16:type==='fountain'?9:7,
    radius:type==='palm'?random(1.65,2.3):random(.8,1.75),
    twinkle:type==='crackle'||type==='peony',
    split:type==='crackle'&&i%4===0
   });
  }
  flashParticle(x,y,(type==='crackle'?21:30)*scale);
  if(!fireworkFrame)fireworkFrame=requestAnimationFrame(drawFireworks);
  return true;
 }
 function drawFireworks(time){
  fireworkFrame=0;
  if(!fireworksContext||document.hidden||motion.matches||!isVisible){stopFireworks();return;}
  // Limit the expensive particle renderer to ~30 fps on desktop.
  if(particleBudget>210&&fireworkFrameAt&&time-fireworkFrameAt<30){
   fireworkFrame=requestAnimationFrame(drawFireworks);return;
  }
  if(!particles.length){fireworksContext.clearRect(0,0,fireworkCanvas.width,fireworkCanvas.height);return;}
  const dt=Math.min(2.2,Math.max(.55,(time-(fireworkFrameAt||time-16.67))/16.67));
  fireworkFrameAt=time;
  const ctx=fireworksContext;
  ctx.clearRect(0,0,fireworkCanvas.width,fireworkCanvas.height);
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  const newCrackles=[];
  for(let i=particles.length-1;i>=0;i--){
   const p=particles[i];
   p.age+=dt;
   if(p.age>=p.life){particles.splice(i,1);continue;}
   if(p.split&&p.age>p.life*.53){
    p.split=false;newCrackles.push({x:p.x,y:p.y,color:p.color});
   }
   p.vx*=Math.pow(p.drag,dt);
   p.vy=p.vy*Math.pow(p.drag,dt)+p.gravity*dt;
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   p.points.push({x:p.x,y:p.y});
   if(p.points.length>p.trail+1)p.points.shift();
   const remaining=1-p.age/p.life;
   const twinkle=p.twinkle?.73+.27*Math.abs(Math.sin(p.age*.34+p.seed)):1;
   const alpha=Math.min(1,remaining*1.36)*twinkle;
   ctx.strokeStyle='rgba('+p.color+','+(alpha*.6).toFixed(3)+')';
   ctx.fillStyle='rgba('+p.color+','+alpha.toFixed(3)+')';
   ctx.shadowColor='rgba('+p.color+','+(alpha*.45).toFixed(3)+')';
   ctx.shadowBlur=particleBudget>210?2:5;
   if(p.points.length>1){
    ctx.lineWidth=p.radius*.95;
    ctx.beginPath();
    ctx.moveTo(p.points[0].x,p.points[0].y);
    for(let k=1;k<p.points.length;k++)ctx.lineTo(p.points[k].x,p.points[k].y);
    ctx.stroke();
   }
   ctx.beginPath();
   ctx.arc(p.x,p.y,Math.max(.38,p.radius*remaining),0,Math.PI*2);
   ctx.fill();
  }
  ctx.restore();
  for(const puff of newCrackles){
   for(let i=0;i<4;i++){
    const angle=random(0,Math.PI*2),speed=random(.7,2.4);
    fireworkParticle(puff.x,puff.y,Math.cos(angle)*speed,Math.sin(angle)*speed,{
     life:random(18,37),gravity:.14,drag:.95,trail:3,
     radius:random(.55,1.1),color:puff.color,twinkle:true});
   }
  }
  if(particles.length)fireworkFrame=requestAnimationFrame(drawFireworks);
  else fireworkFrameAt=0;
 }
 function stopFireworks(){
  if(fireworkFrame){cancelAnimationFrame(fireworkFrame);fireworkFrame=0;}
  fireworkFrameAt=0;particles=[];
  if(fireworksContext){
   const rect=backdrop.getBoundingClientRect();
   fireworksContext.clearRect(0,0,rect.width,rect.height);
  }
 }
 // Fallback to the existing DOM burst where canvas is unavailable.
 function legacyFirework(point,kind='cursor',heading=0){
  const burst=document.createElement('div');
  burst.className='footer-firework-burst '+(kind==='cow'?'footer-firework-source':'footer-firework-cursor');
  burst.setAttribute('aria-hidden','true');
  burst.style.left=point.x+'%';burst.style.top=point.y+'%';
  const count=kind==='cow'?13:18;
  const size=(footer.getBoundingClientRect().width<720?.72:1)*(kind==='cow'?.92:1);
  for(let i=0;i<count;i++){
   const spark=document.createElement('span');
   spark.className='footer-firework-spark';
   spark.style.setProperty('--spark-angle',(kind==='cow'?heading+random(-85,85):i*137.50776+random(-19,19))+'deg');
   spark.style.setProperty('--spark-distance',random(65,180)*size+'px');
   spark.style.setProperty('--spark-curve',random(-21,21)+'px');
   spark.style.setProperty('--spark-fall',random(3,43)+'px');
   spark.style.setProperty('--spark-delay',Math.round(random(0,115))+'ms');
   burst.appendChild(spark);
  }
  backdrop.appendChild(burst);
  window.setTimeout(()=>burst.remove(),2300);
 }
 function emitFirework(point,kind='cursor',heading=0,type='peony'){
  if(motion.matches||!isVisible||document.hidden)return;
  const rect=backdrop.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const x=rect.width*point.x/100,y=rect.height*point.y/100;
  const strength=kind==='cow'?1:.53;
  if(!fireworksContext){legacyFirework(point,kind,heading);return;}
  launchParticles(x,y,type,strength,heading*Math.PI/180);
 }
 // Several uneven, backlit plumes drift at different speeds and directions.
 // A shared diffuse bloom stays behind the finer, changing lobes.
 function emitAfterglow(point,kind='cursor'){
  if(motion.matches||!isVisible||document.hidden)return;
  // Keep both cow-side and cursor-side smoke on mobile, with fewer blur layers.
  const mobile=footer.getBoundingClientRect().width<=720;
  const cloud=document.createElement('div');
  cloud.className='footer-fog-cloud '+(kind==='cow'?'footer-fog-source':'footer-fog-cursor');
  cloud.style.left=point.x+'%';
  cloud.style.top=point.y+'%';
  cloud.setAttribute('aria-hidden','true');
  for(const cls of ['footer-haze-beam','footer-haze-bloom']){
   const layer=document.createElement('span');
   layer.className=cls;
   cloud.appendChild(layer);
  }
  for(let i=0;i<(kind==='cow'?(mobile?3:5):(mobile?1:3));i++){
   const wisp=document.createElement('i');
   // Uneven translucent lobes with variable turbulence; no seamless particle loop.
   const driftX=random(-122,122)+(i%2?33:-33);
   const driftY=random(-170,-70);
   wisp.style.setProperty('--fog-x',driftX.toFixed(1)+'px');
   wisp.style.setProperty('--fog-y',driftY.toFixed(1)+'px');
   wisp.style.setProperty('--fog-turn',random(-27,27).toFixed(1)+'deg');
   wisp.style.setProperty('--fog-opacity',random(.37,.67).toFixed(2));
   wisp.style.setProperty('--fog-delay',Math.round(random(0,500))+'ms');
   wisp.style.setProperty('--fog-duration',random(3.9,5).toFixed(2)+'s');
   wisp.style.setProperty('--fog-blur',random(11,25).toFixed(1)+'px');
   wisp.style.setProperty('--fog-scale',random(1.4,2.1).toFixed(2));
   cloud.appendChild(wisp);
  }
  // Allow every plume to finish its fade. The 1.55s burst interval naturally
  // keeps at most four clouds alive during the 5.7s smoke lifetime.
  backdrop.appendChild(cloud);
  window.setTimeout(()=>cloud.remove(),5700);
 }
 // Stage 1: a real contour-anchored, multi-branch electric bolt runs toward the pointer.
 function emitDischarge(point,force=false,includeFireworks=true){
  if(!introComplete||motion.matches||!isVisible||document.hidden)return false;
  const now=performance.now();
  const moved=lastArcPoint?Math.hypot(point.clientX-lastArcPoint.clientX,point.clientY-lastArcPoint.clientY):Infinity;
  // Arcs may follow the pointer after 380ms + 22px of travel. Bigger fireworks
  // have their own longer cadence to keep the visual legible and inexpensive.
  if(!force&&(now-lastDischargeAt<380||moved<22))return false;
  if(force&&now-lastDischargeAt<240)return false;
  const origin=nearestContour(point);
  if(!origin)return false;
  const box=backdrop.getBoundingClientRect();
  if(box.width<1||box.height<1)return false;
  const x=point.clientX-box.left,y=point.clientY-box.top;
  electric.setAttribute('viewBox','0 0 '+box.width+' '+box.height);
  const group=document.createElementNS(ns,'g');
  group.setAttribute('class','footer-electric-strike');
  const shape=jaggedPath(origin.x,origin.y,x,y,now/100);
  if(origin.contourD){
   const warmTrack=document.createElementNS(ns,'path');
   warmTrack.setAttribute('class','footer-electric-contour');
   warmTrack.setAttribute('d',origin.contourD);
   warmTrack.setAttribute('pathLength','100');
   group.appendChild(warmTrack);
  }
  for(const layer of ['aura','core']){
   const path=document.createElementNS(ns,'path');
   path.setAttribute('class','footer-electric-'+layer);
   path.setAttribute('d',shape);
   path.setAttribute('pathLength','100');
   group.appendChild(path);
  }
  // Short, staggered forks along the main discharge suggest real high-voltage arcs.
  for(let i=0;i<3;i++){
   const branch=document.createElementNS(ns,'path');
   branch.setAttribute('class','footer-electric-branch');
   const t=.31+i*.2;
   const mx=origin.x+(x-origin.x)*t,my=origin.y+(y-origin.y)*t;
   const a=Math.atan2(y-origin.y,x-origin.x)+(i%2?1:-1)*Math.PI/2;
   const reach=Math.min(116,Math.max(49,origin.distance*.21))*(1-i*.13);
   branch.setAttribute('d',jaggedPath(mx,my,mx+Math.cos(a)*reach,my+Math.sin(a)*reach,now/(82+i*9)));
   branch.setAttribute('pathLength','100');
   branch.style.animationDelay=(i*65)+'ms';
   group.appendChild(branch);
  }
  // Strikes live for 1.19s, with a 380ms trigger interval; natural cleanup
  // means approximately four overlapping arcs at most, without sudden cuts.
  electric.appendChild(group);
  window.setTimeout(()=>group.remove(),1190);
  // The sign flashes once per actual discharge and returns to its resting
  // engraving even if the cursor stays over it.
  footer.classList.remove('is-striking');
  // Restart the pulse on a fresh frame without forcing a layout read.
  requestAnimationFrame(()=>{if(isVisible&&!motion.matches)footer.classList.add('is-striking');});
  clearTimeout(glowOff);
  glowOff=window.setTimeout(()=>footer.classList.remove('is-striking'),980);
  // The silhouette is the source; the previous cursor-facing lightning and
  // fireworks remain as an echo at the other end of the same discharge.
  if(includeFireworks&&now-lastBurstAt>=1550){
   lastBurstAt=now;
   const atCow={x:origin.x/box.width*100,y:origin.y/box.height*100};
   const heading=Math.atan2(y-origin.y,x-origin.x)*180/Math.PI;
   // A new pyrotechnic style is explored with each substantial hover.
   // The existing cursor fireworks remain as a softer spherical echo.
   const style=fireworks[patternIndex++%fireworks.length];
   window.setTimeout(()=>emitFirework(atCow,'cow',heading,style),90);
   window.setTimeout(()=>emitFirework(point,'cursor',heading,'peony'),225);
   window.setTimeout(()=>emitAfterglow(atCow,'cow'),375);
   window.setTimeout(()=>emitAfterglow(point,'cursor'),520);
  }
  lastDischargeAt=now;
  lastArcPoint={clientX:point.clientX,clientY:point.clientY};
  return true;
 }
 // Press/tap is a second interaction: a paired finale on the cow and cursor.
 // It keeps the current electric arc, rather than replacing the hover sequence.
 function finale(point){
  if(!introComplete||motion.matches||!isVisible||document.hidden||!point?.inside)return;
  const now=performance.now();
  if(now-lastFinaleAt<1800)return;
  const origin=nearestContour(point),box=backdrop.getBoundingClientRect();
  if(!origin||box.width<=0||box.height<=0)return;
  lastFinaleAt=now;
  lastBurstAt=now; // Preserve the normal larger-burst cadence after a finale.
  const cow={x:origin.x/box.width*100,y:origin.y/box.height*100};
  const degrees=Math.atan2(point.clientY-(box.top+origin.y),point.clientX-(box.left+origin.x))*180/Math.PI;
  const first=fireworks[patternIndex++%fireworks.length];
  const second=fireworks[patternIndex++%fireworks.length];
  window.setTimeout(()=>emitFirework(cow,'cow',degrees,first),180);
  window.setTimeout(()=>emitFirework(point,'cursor',degrees,second),460);
  window.setTimeout(()=>emitAfterglow(cow,'cow'),560);
 }
 function deactivate(){
  energized=false;
  // Do not cancel an existing strike; its timed glow and smoke finish naturally.
 }
 function activate(point,allowAnotherCloud,includeFireworks=true){
  if(!introComplete||!point||!point.inside||motion.matches||!isVisible)return;
  const targetX=point.x.toFixed(2)+'%',targetY=point.y.toFixed(2)+'%';
  backdrop.style.setProperty('--hover-x',targetX);
  backdrop.style.setProperty('--hover-y',targetY);
  if(!energized){
   energized=true;
   emitDischarge(point,true,includeFireworks);
  }else if(allowAnotherCloud)emitDischarge(point);
 }
 footer.addEventListener('pointerenter',event=>{
  if((event.pointerType==='mouse'||event.pointerType==='pen')&&!event.target.closest('a'))activate(pointFromEvent(event),false);
 },{passive:true});
 let draggingTouchId=null,touchStart=null,touchMoved=false;
 footer.addEventListener('pointermove',event=>{
  const touchDrag=event.pointerType==='touch'&&draggingTouchId===event.pointerId;
  if(!touchDrag&&event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
  if(!touchDrag&&event.target.closest('a')){deactivate();return;}
  const point=pointFromEvent(event);
  if(touchDrag&&touchStart&&!touchMoved){
   if(Math.hypot(event.clientX-touchStart.x,event.clientY-touchStart.y)<12)return;
   touchMoved=true;
   if(point?.inside)activate(point,true);
  }else if(!point||!point.inside)deactivate();
  else activate(point,true);
 },{passive:true});
 footer.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch')deactivate();});
 footer.addEventListener('pointerdown',event=>{
  if(event.target.closest('a')||!event.isPrimary)return;
  const point=pointFromEvent(event);
  if(!point||!point.inside)return;
  if(event.pointerType==='touch'){
   if(event.target!==touchSurface||draggingTouchId!==null)return;
   draggingTouchId=event.pointerId;
   touchStart={x:event.clientX,y:event.clientY,point};
   touchMoved=false;
   try{touchSurface.setPointerCapture(event.pointerId);}catch{}
   clearTimeout(touchOff);
  }else{
   if(!energized)activate(point,false,false);
   else emitDischarge(point,true,false);
   finale(point);
  }
 },{passive:true});
 const stopTouchDrag=event=>{
  if(event.pointerId!==draggingTouchId)return;
  if(event.type==='pointerup'&&!touchMoved&&touchStart){
   activate(touchStart.point,false,false);
   finale(touchStart.point);
  }
  draggingTouchId=null;touchStart=null;touchMoved=false;
  if(event.type!=='lostpointercapture'&&touchSurface.hasPointerCapture?.(event.pointerId)){
   try{touchSurface.releasePointerCapture(event.pointerId);}catch{}
  }
  deactivate();
 };
 for(const eventName of ['pointerup','pointercancel','lostpointercapture'])
  touchSurface.addEventListener(eventName,stopTouchDrag,{passive:true});
 touchSurface.addEventListener('contextmenu',event=>event.preventDefault());
 // Link the footer to actual decoded frequencies from Discos. The record player's audio is never rerouted.
 let spectrum=null, spectrumReference={bass:1,mid:1};
 let liveFrame=0, lastSample=0, lastCaptureAttempt=-Infinity;
 let capturedAudio=null, capturedStream=null, audioContext=null, analyser=null, frequencyData=null;
 let bassLevel=0,midLevel=0;
 const liveAudio=()=>document.getElementById('recordAudio')||document.getElementById('publicAudioPreview');
 const clamp01=n=>Math.min(1,Math.max(0,Number.isFinite(n)?n:0));
 function percentileReference(array){
  if(!array||!array.length)return 1;
  const stride=Math.max(1,Math.floor(array.length/400));
  const values=[];
  for(let i=0;i<array.length;i+=stride)if(Number.isFinite(array[i]))values.push(array[i]);
  values.sort((a,b)=>a-b);
  return Math.max(.006,values[Math.floor((values.length-1)*.95)]||.006);
 }
 window.addEventListener('lvl:record-analysis',event=>{
  const data=event.detail;
  spectrum=data&&data.low&&data.mid&&Number.isFinite(data.duration)?data:null;
  spectrumReference=spectrum?{
   bass:percentileReference(spectrum.low),
   mid:percentileReference(spectrum.mid)
  }:{bass:1,mid:1};
  startSound();
 });
 function audioReady(audio){
  return !!(audio&&!audio.paused&&!audio.ended&&!audio.muted&&audio.volume>0&&audio.readyState>=2);
 }
 function stopSound(){
  if(liveFrame){cancelAnimationFrame(liveFrame);liveFrame=0;}
  bassLevel=0;midLevel=0;
  backdrop.style.setProperty('--sound-bass','0');
  backdrop.style.setProperty('--sound-mid','0');
  footer.classList.remove('has-live-audio');
 }
 function ensureAudioTap(audio){
  if(!audio||!window.AudioContext&&!window.webkitAudioContext)return;
  // captureStream is read-only: unlike createMediaElementSource it cannot mute or reroute playback.
  const capture=audio.captureStream||audio.mozCaptureStream;
  if(!capture)return;
  if(capturedAudio===audio&&analyser&&capturedStream?.getAudioTracks().some(track=>track.readyState==='live'))return;
  if(performance.now()-lastCaptureAttempt<1400)return;
  lastCaptureAttempt=performance.now();
  try{
   const stream=capture.call(audio);
   if(!stream.getAudioTracks().some(track=>track.readyState==='live'))return;
   if(audioContext&&analyser){audioContext.close().catch(()=>{});audioContext=null;}
   const Context=window.AudioContext||window.webkitAudioContext;
   const context=audioContext&&audioContext.state!=='closed'?audioContext:new Context();
   const source=context.createMediaStreamSource(stream);
   const node=context.createAnalyser();
   node.fftSize=2048;
   node.smoothingTimeConstant=.76;
   node.minDecibels=-90;
   node.maxDecibels=-25;
   const silent=context.createGain();
   silent.gain.value=0;
   source.connect(node);
   node.connect(silent);
   silent.connect(context.destination); // Keep analysis graph alive; captured audio is silent here.
   capturedAudio=audio;capturedStream=stream;audioContext=context;analyser=node;
   frequencyData=new Uint8Array(node.frequencyBinCount);
   if(context.state==='suspended')context.resume().catch(()=>{});
  }catch{
   // Unsupported capture / protected media: keep hover and smoke fully functional.
  }
 }
 function readSound(audio){
  if(audio.id==='recordAudio'&&spectrum&&spectrum.duration>0){
   const progress=Math.min(.999999,Math.max(0,audio.currentTime/spectrum.duration));
   const i=Math.min(spectrum.low.length-1,Math.floor(progress*spectrum.low.length));
   return {
    bass:clamp01((spectrum.low[i]||0)/spectrumReference.bass),
    mid:clamp01((spectrum.mid[i]||0)/spectrumReference.mid)
   };
  }
  ensureAudioTap(audio);
  if(!analyser||!audioContext||audioContext.state!=='running'||!frequencyData)return null;
  analyser.getByteFrequencyData(frequencyData);
  const hz=audioContext.sampleRate/analyser.fftSize;
  const avg=(lo,hi)=>{
   const start=Math.max(1,Math.floor(lo/hz)),end=Math.min(frequencyData.length,Math.max(start+1,Math.ceil(hi/hz)));
   let sum=0;for(let i=start;i<end;i++)sum+=frequencyData[i];
   return (sum/Math.max(1,end-start))/255;
  };
  return {bass:clamp01((avg(42,190)-.10)*1.65),mid:clamp01((avg(260,2200)-.12)*1.55)};
 }
 function soundFrame(now){
  liveFrame=0;
  const audio=liveAudio();
  if(!isVisible||motion.matches||document.hidden||!audioReady(audio)){stopSound();return;}
  if(now-lastSample>=33){
   const measured=readSound(audio);
   if(measured){
    const bassTarget=measured.bass*Math.sqrt(audio.volume);
    const midTarget=measured.mid*Math.sqrt(audio.volume);
    bassLevel+=(bassTarget-bassLevel)*(bassTarget>bassLevel?.26:.12);
    midLevel+=(midTarget-midLevel)*(midTarget>midLevel?.22:.11);
    backdrop.style.setProperty('--sound-bass',bassLevel.toFixed(3));
    backdrop.style.setProperty('--sound-mid',midLevel.toFixed(3));
    footer.classList.toggle('has-live-audio',bassLevel>.018||midLevel>.018);
   }else footer.classList.remove('has-live-audio');
   lastSample=now;
  }
  liveFrame=requestAnimationFrame(soundFrame);
 }
 function startSound(){
  const audio=liveAudio();
  if(!isVisible||motion.matches||document.hidden||!audioReady(audio))return;
  if(!liveFrame)liveFrame=requestAnimationFrame(soundFrame);
 }
 // Prime the preview analyser's context inside the user's play gesture, avoiding autoplay suspensions.
 function primePreviewAudio(event){
  if(motion.matches||document.hidden||document.getElementById('recordAudio'))return;
  const isPlayerAction=event.target?.closest?.('#playerToggle, #player, .record-card, .record-modal, [data-record-id]');
  if(!isPlayerAction&&audioContext?.state!=='suspended')return;
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)return;
  try{
   if(!audioContext||audioContext.state==='closed')audioContext=new Context();
   if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  }catch{}
 }
 document.addEventListener('pointerdown',primePreviewAudio,{capture:true,passive:true});
 document.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' ')primePreviewAudio(event);
 },true);
 window.addEventListener('pagehide',()=>{if(audioContext&&audioContext.state!=='closed')audioContext.close().catch(()=>{});});
 // Capture media events, including the homepage audio element created after this script loads.
 for(const event of ['play','playing','pause','ended','volumechange','emptied']){
  document.addEventListener(event,e=>{
   if(e.target?.id!=='recordAudio'&&e.target?.id!=='publicAudioPreview')return;
   if(event==='play'||event==='playing'||event==='volumechange')startSound();
   else stopSound();
  },true);
 }
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){stopSound();stopFireworks();}
  else startSound();
 });
 const clearSparks=()=>{
  stopFireworks();
  clearTimeout(glowOff);
  footer.classList.remove('is-striking');
  electric.replaceChildren();
  backdrop.querySelectorAll('.footer-firework-burst').forEach(burst=>burst.remove());
 };
 const stopMotion=()=>{
  if(motion.matches){
   finishFooterIntro();
   deactivate();stopSound();clearSparks();
   backdrop.querySelectorAll('.footer-fog-cloud').forEach(cloud=>cloud.remove());
  }else startSound();
 };
 if(motion.addEventListener)motion.addEventListener('change',stopMotion);
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   isVisible=entries.some(entry=>entry.isIntersecting);
   footer.classList.toggle('sign-visible',isVisible);
   if(!isVisible){deactivate();stopSound();clearSparks();}
   else {
    startSound();
    if(!introStarted&&!introComplete){
     const rect=footer.getBoundingClientRect();
     if(rect.top<window.innerHeight*.78||entries.some(entry=>entry.intersectionRatio>=.25))startFooterIntro();
    }
   }
  },{rootMargin:'80px 0px 80px 0px',threshold:[0,.25]});
  observer.observe(footer);
 }else {
  footer.classList.add('sign-visible');
  if(!introComplete)startFooterIntro();
 }
})();
