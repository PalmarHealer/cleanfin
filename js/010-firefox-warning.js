/**
 * Jellyfin Enhancement: Firefox warning
 * Shows a warning popup for Firefox users that it unfortunatly doesn't work properly
 */
(function () {
  var COOKIE = 'ff_warn_dismissed';
  var isFirefox = /Firefox\//.test(navigator.userAgent);
  if (!isFirefox) return;
  if (document.cookie.split('; ').indexOf(COOKIE + '=1') !== -1) return;
  if (document.getElementById('ff-warn-overlay')) return;

  var overlay = document.createElement('div');
  overlay.id = 'ff-warn-overlay';
  overlay.innerHTML = [
    '<style>',
    '#ff-warn-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);',
    'display:flex;align-items:center;justify-content:center;font-family:inherit;color:inherit}',
    '#ff-warn-box{max-width:560px;width:90%;box-sizing:border-box;padding:32px;',
    'background-color:var(--primary-background-transparent);',
    'backdrop-filter:blur(var(--blur));-webkit-backdrop-filter:blur(var(--blur));',
    'border:var(--defaultBorder);border-radius:.75em;box-shadow:0 16px 48px rgba(0,0,0,.5)}',
    '#ff-warn-box h1{margin:0 0 16px;font-size:1.4em;font-weight:600;color:var(--primary-accent-color)}',
    '#ff-warn-box p{margin:0 0 14px;line-height:1.5;font-size:.95em;opacity:.85}',
    '#ff-warn-box ul{margin:0 0 20px 20px;padding:0;font-size:.9em;line-height:1.6;opacity:.7}',
    '#ff-warn-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}',
    '#ff-warn-actions button{flex:1;min-width:180px;padding:12px 16px;border:0;border-radius:.5em;',
    'cursor:pointer;font-size:.9em;font-weight:500;color:inherit;transition:background-color .15s}',
    '#ff-warn-continue{background-color:var(--primary-accent-color);color:#fff}',
    '#ff-warn-continue:hover{background-color:var(--primary-alt1)}',
    '#ff-warn-dismiss{background-color:var(--tertiary-background-transparent)}',
    '#ff-warn-dismiss:hover{background-color:rgba(255,255,255,0.12)}',
    '</style>',
    '<div id="ff-warn-box" role="dialog" aria-labelledby="ff-warn-title">',
    '  <h1 id="ff-warn-title">Firefox wird nicht empfohlen</h1>',
    '  <p>Du nutzt <strong>Firefox</strong>. Bei der Wiedergabe kann es zu Problemen kommen:</p>',
    '  <ul>',
    '    <li>HEVC/H.265 wird nicht zuverlässig unterstützt</li>',
    '    <li>Videos bleiben eventuell schwarz oder laden nicht</li>',
    '    <li>Einige Codecs und HDR-Formate funktionieren nicht</li>',
    '    <li>Scroll-Animationen laufen nicht immer flüssig</li>',
    '    <li>Videos hängen oft in den ersten Sekunden – kurz vorspulen behebt das meist</li>',
    '  </ul>',
    '  <p>Empfehlung: <strong>Chrome, Edge, Brave</strong> oder <a style="color: unset;" target="_blank" rel="noopener noreferrer" href="https://github.com/prayag17/Blink/releases/tag/v1.0.0-alpha04"><strong>Blink</strong></a>.</p>',
    '  <div id="ff-warn-actions">',
    '    <button id="ff-warn-continue" type="button">Fortfahren</button>',
    '    <button id="ff-warn-dismiss" type="button">Fortfahren und nicht mehr anzeigen</button>',
    '  </div>',
    '</div>'
  ].join('');

  function close() {
    overlay.remove();
  }
  function dismissForever() {
    var d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    document.cookie = COOKIE + '=1; expires=' + d.toUTCString() + '; path=/; SameSite=Lax';
    close();
  }

  document.body.appendChild(overlay);
  overlay.querySelector('#ff-warn-continue').addEventListener('click', close);
  overlay.querySelector('#ff-warn-dismiss').addEventListener('click', dismissForever);
})();
