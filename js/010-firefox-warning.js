/**
 * Jellyfin Enhancement: Firefox warning
 * Shows a dismissible notice for Firefox users that playback may not work properly.
 *
 * Language is picked automatically from the UI locale, falling back to English.
 * Override explicitly if you want to force one:
 *
 *   window.cleanFin = {
 *     features:       { firefoxWarning: true },
 *     firefoxWarning: { lang: 'de' }
 *   };
 */
(function () {
  var COOKIE = 'ff_warn_dismissed';
  var isFirefox = /Firefox\//.test(navigator.userAgent);
  if (!isFirefox) return;
  if (document.cookie.split('; ').indexOf(COOKIE + '=1') !== -1) return;
  if (document.getElementById('ff-warn-overlay')) return;

  var STRINGS = {
    en: {
      title: 'Firefox is not recommended',
      intro: 'You are using <strong>Firefox</strong>. Playback may run into problems:',
      items: [
        'HEVC/H.265 is not reliably supported',
        'Videos may stay black or fail to load',
        'Some codecs and HDR formats do not work',
        'Scroll animations are not always smooth',
        'Videos often stall in the first few seconds — seeking ahead briefly usually fixes it'
      ],
      recommend: 'Recommended: <strong>Chrome, Edge, Brave</strong> or ',
      continue: 'Continue',
      dismiss: 'Continue and stop showing this'
    },
    de: {
      title: 'Firefox wird nicht empfohlen',
      intro: 'Du nutzt <strong>Firefox</strong>. Bei der Wiedergabe kann es zu Problemen kommen:',
      items: [
        'HEVC/H.265 wird nicht zuverlässig unterstützt',
        'Videos bleiben eventuell schwarz oder laden nicht',
        'Einige Codecs und HDR-Formate funktionieren nicht',
        'Scroll-Animationen laufen nicht immer flüssig',
        'Videos hängen oft in den ersten Sekunden – kurz vorspulen behebt das meist'
      ],
      recommend: 'Empfehlung: <strong>Chrome, Edge, Brave</strong> oder ',
      continue: 'Fortfahren',
      dismiss: 'Fortfahren und nicht mehr anzeigen'
    }
  };

  function pickLang() {
    var cfg = window.cleanFin && window.cleanFin.firefoxWarning;
    if (cfg && cfg.lang && STRINGS[cfg.lang]) return cfg.lang;

    var tags = [];
    // Jellyfin stores the chosen UI culture on the user's display preferences;
    // the document/browser locale is a good enough proxy and always present.
    if (document.documentElement.lang) tags.push(document.documentElement.lang);
    if (navigator.languages) tags = tags.concat(navigator.languages);
    if (navigator.language) tags.push(navigator.language);

    for (var i = 0; i < tags.length; i++) {
      var base = String(tags[i]).toLowerCase().split('-')[0];
      if (STRINGS[base]) return base;
    }
    return 'en';
  }

  var t = STRINGS[pickLang()];

  var BLINK_URL = 'https://github.com/prayag17/Blink/releases/tag/v1.0.0-alpha04';

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
    '  <h1 id="ff-warn-title">' + t.title + '</h1>',
    '  <p>' + t.intro + '</p>',
    '  <ul>',
    '    <li>' + t.items.join('</li><li>') + '</li>',
    '  </ul>',
    '  <p>' + t.recommend + '<a style="color: unset;" target="_blank" rel="noopener noreferrer" href="' + BLINK_URL + '"><strong>Blink</strong></a>.</p>',
    '  <div id="ff-warn-actions">',
    '    <button id="ff-warn-continue" type="button">' + t.continue + '</button>',
    '    <button id="ff-warn-dismiss" type="button">' + t.dismiss + '</button>',
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
