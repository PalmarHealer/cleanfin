/**
 * Jellyfin Enhancement: Quick Connect popup
 * Turns the "Quick Connect" entry in the profile dropdown into an in-page
 * modal instead of navigating to the native #/quickconnect page.
 * Self-contained: independent of the "Inline profile" script. It only hooks
 * the #jf-profile-dropdown row via a capture-phase click listener, so if that
 * dropdown ever changes the native page simply opens as before.
 * Styling uses the cleanfin theme variables so the modal matches the theme
 * (same translucent + blurred surface as .dialog / #jf-profile-dropdown).
 */
(function () {
  'use strict';

  function ensureStyle() {
    if (document.getElementById('jf-qc-style')) return;
    const style = document.createElement('style');
    style.id = 'jf-qc-style';
    style.textContent = [
      '#jf-qc-overlay{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.6);',
      '  display:flex;align-items:center;justify-content:center;font-family:inherit;}',
      '#jf-qc-box{max-width:420px;width:90%;box-sizing:border-box;padding:24px 28px;color:inherit;',
      '  background-color:var(--primary-background-transparent);',
      '  backdrop-filter:blur(var(--blur));-webkit-backdrop-filter:blur(var(--blur));',
      '  border:var(--defaultBorder);border-radius:.75em;box-shadow:0 16px 48px rgba(0,0,0,.5);}',
      '#jf-qc-box h1{margin:0 0 12px;font-size:1.3em;font-weight:600;}',
      '#jf-qc-box p{margin:0 0 18px;font-size:.92em;line-height:1.5;opacity:.7;}',
      '#jf-qc-input{width:100%;box-sizing:border-box;padding:12px 14px;font-size:1.4em;',
      '  letter-spacing:.3em;text-align:center;border-radius:.5em;border:var(--defaultBorder);',
      '  background-color:var(--tertiary-background-transparent);color:inherit;outline:none;}',
      '#jf-qc-input:focus{border-color:var(--primary-accent-color);}',
      '#jf-qc-status{min-height:18px;margin:12px 0 0;font-size:.85em;}',
      '#jf-qc-actions{display:flex;gap:10px;margin-top:20px;}',
      '#jf-qc-actions button{flex:1;padding:11px 16px;border:0;border-radius:.5em;cursor:pointer;',
      '  font-size:.92em;font-weight:500;color:inherit;transition:background-color .15s,opacity .15s;}',
      '#jf-qc-actions button:disabled{opacity:.5;cursor:default;}',
      '#jf-qc-authorize{background-color:var(--primary-accent-color);color:#fff;}',
      '#jf-qc-authorize:hover:not(:disabled){background-color:var(--primary-alt1);}',
      '#jf-qc-cancel{background-color:var(--tertiary-background-transparent);}',
      '#jf-qc-cancel:hover{background-color:rgba(255,255,255,0.12);}'
    ].join('');
    document.head.appendChild(style);
  }

  function openModal() {
    if (document.getElementById('jf-qc-overlay')) return;
    ensureStyle();

    const overlay = document.createElement('div');
    overlay.id = 'jf-qc-overlay';
    overlay.innerHTML = [
      '<div id="jf-qc-box" role="dialog" aria-labelledby="jf-qc-title" aria-modal="true">',
      '  <h1 id="jf-qc-title">Quick Connect</h1>',
      '  <p>Gib den auf deinem Gerät angezeigten Code ein, um die Anmeldung zu autorisieren.</p>',
      '  <input id="jf-qc-input" type="text" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="Code">',
      '  <div id="jf-qc-status"></div>',
      '  <div id="jf-qc-actions">',
      '    <button id="jf-qc-cancel" type="button">Abbrechen</button>',
      '    <button id="jf-qc-authorize" type="button">Autorisieren</button>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    const input  = overlay.querySelector('#jf-qc-input');
    const status = overlay.querySelector('#jf-qc-status');
    const btnOk  = overlay.querySelector('#jf-qc-authorize');
    const btnNo  = overlay.querySelector('#jf-qc-cancel');

    function close() {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
    }
    function setStatus(msg, ok) {
      status.textContent = msg;
      status.style.color = ok ? '#4caf50' : 'var(--primary-accent-color)';
    }
    function authorize() {
      const code = input.value.trim();
      if (!code) { setStatus('Bitte einen Code eingeben.', false); input.focus(); return; }
      const api = window.ApiClient;
      if (!api) { setStatus('Nicht angemeldet.', false); return; }
      btnOk.disabled = true;
      setStatus('Wird autorisiert ...', true);
      api.ajax({
        type: 'POST',
        url: api.getUrl('QuickConnect/Authorize', { code: code }),
        dataType: 'json'
      }).then(function (result) {
        if (result === false) {
          btnOk.disabled = false;
          setStatus('Code ungültig oder abgelaufen.', false);
        } else {
          setStatus('Gerät erfolgreich autorisiert.', true);
          setTimeout(close, 1400);
        }
      }).catch(function () {
        btnOk.disabled = false;
        setStatus('Code ungültig oder abgelaufen.', false);
      });
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
    }

    btnOk.addEventListener('click', authorize);
    btnNo.addEventListener('click', close);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') authorize(); });
    document.addEventListener('keydown', onKey, true);

    setTimeout(function () { input.focus(); }, 40);
  }

  // Capture-phase interception of the Quick Connect row inside #jf-profile-dropdown.
  // Runs before the row's own (bubble-phase) navigation handler, so the native
  // #/quickconnect navigation never happens.
  document.addEventListener('click', function (e) {
    const dd = document.getElementById('jf-profile-dropdown');
    if (!dd || !dd.contains(e.target)) return;

    let row = e.target;
    while (row && row.parentElement && row.parentElement !== dd) row = row.parentElement;
    if (!row || row.parentElement !== dd) return;

    const isQuickConnect =
      !!row.querySelector('.phonelink_lock') ||
      /quick ?connect/i.test(row.textContent || '');
    if (!isQuickConnect) return;

    e.stopImmediatePropagation();
    e.preventDefault();
    dd.style.display = 'none';
    openModal();
  }, true);

})();