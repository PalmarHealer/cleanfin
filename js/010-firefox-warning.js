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
    '  #ff-warn-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.85);',
    '    display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#fff}',
    '  #ff-warn-box{max-width:560px;width:90%;background:#1c1c1c;border:1px solid #3a3a3a;',
    '    border-radius:12px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,.6)}',
    '  #ff-warn-box h1{margin:0 0 16px;font-size:22px;font-weight:600;color:#ffb347}',
    '  #ff-warn-box p{margin:0 0 14px;line-height:1.5;font-size:15px;color:#ddd}',
    '  #ff-warn-box ul{margin:0 0 20px 20px;padding:0;color:#ccc;font-size:14px;line-height:1.6}',
    '  #ff-warn-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}',
    '  #ff-warn-actions button{flex:1;min-width:180px;padding:12px 16px;border:0;border-radius:8px;',
    '    cursor:pointer;font-size:14px;font-weight:500;transition:opacity .15s}',
    '  #ff-warn-actions button:hover{opacity:.85}',
    '  #ff-warn-continue{background:#00a4dc;color:#fff}',
    '  #ff-warn-dismiss{background:#444;color:#fff}',
    '</style>',
    '<div id="ff-warn-box" role="dialog" aria-labelledby="ff-warn-title">',
    '  <h1 id="ff-warn-title">Firefox is not recommended</h1>',
    '  <p>You are using <strong>Firefox</strong>. Playback may have issues:</p>',
    '  <ul>',
    '    <li>HEVC/H.265 is not reliably supported</li>',
    '    <li>Videos may stay black or fail to load</li>',
    '    <li>Some codecs and HDR formats do not work</li>',
    '    <li>Scroll animations are not always smooth</li>',
    '    <li>Videos often stall in the first few seconds — a brief seek usually fixes it</li>',
    '  </ul>',
    '  <p>Recommended: <strong>Chrome, Edge, Brave</strong> or <a style="color: unset;" target="_blank" rel="noopener noreferrer" href="https://github.com/prayag17/Blink/releases/tag/v1.0.0-alpha04"><strong>Blink</strong></a>.</p>',
    '  <div id="ff-warn-actions">',
    '    <button id="ff-warn-continue" type="button">Continue</button>',
    '    <button id="ff-warn-dismiss" type="button">Continue and don\'t show again</button>',
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
