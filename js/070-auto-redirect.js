/**
 * Jellyfin Enhancement: Auto redirect
 * Skips the native login page: redirects to an SSO start URL on desktop, and
 * auto-triggers Quick Connect inside the Jellyfin Android app.
 *
 * REQUIRES CONFIGURATION. Set your own SSO start URL before the bundle loads:
 *
 *   window.cleanFin = {
 *     features:     { autoRedirect: true },
 *     autoRedirect: { ssoUrl: 'https://jellyfin.example.com/sso/OID/start/<provider>' }
 *   };
 *
 * Without ssoUrl the desktop redirect stays disabled (the Android Quick Connect
 * path still works, since it needs no URL).
 */
(function () {
  const ssoUrl = (window.cleanFin && window.cleanFin.autoRedirect && window.cleanFin.autoRedirect.ssoUrl) || null;

  const isJellyfinAndroid = () => {
    try {
      if (window.ApiClient?.appName?.() === 'Jellyfin Android') return true;
    } catch (e) {}
    return /Android.* wv\)/.test(navigator.userAgent);
  };

  const shouldAutoAct = () =>
    window.location.hash.startsWith('#/login') &&
    !window.location.href.includes('autoLaunch=0');

  // Only blank the login page if we are actually going to act on it — otherwise
  // an unconfigured install would hide a login form it never replaces.
  const willAct = () => shouldAutoAct() && (isJellyfinAndroid() || !!ssoUrl);

  // Inject CSS to hide login page content when auto-action is active.
  // Kept as a <style> tag we toggle via disabled flag so it also applies
  // before our JS has a chance to query anything.
  const style = document.createElement('style');
  style.id = 'jf-hide-login';
  style.textContent = '#loginPage div { visibility: hidden; }';
  document.head.appendChild(style);

  function updateHideStyle() {
    style.disabled = !willAct();
  }

  // Non-Android: keep existing SSO redirect behavior
  function checkAndRedirect() {
    if (isJellyfinAndroid()) return;
    if (!ssoUrl) return;
    if (shouldAutoAct()) {
      window.location.href = ssoUrl;
    }
  }

  // Android: auto-click Quick Connect button on login page
  let quickConnectClicked = false;
  function autoClickQuickConnect() {
    if (!isJellyfinAndroid()) return;
    if (quickConnectClicked) return;
    if (!shouldAutoAct()) return;

    const loginPage = document.querySelector('#loginPage');
    if (!loginPage) return;

    const btn = loginPage.querySelector('.btnQuick');
    if (btn && btn.offsetParent !== null) {
      quickConnectClicked = true;
      btn.click();
    }
  }

  // Android: hide "Verstanden" button in Quick Connect dialog
  function hideQuickConnectOkButton() {
    if (!isJellyfinAndroid()) return;
    const dialog = document.querySelector('#quickConnectAlert');
    if (!dialog) return;
    const okBtn = dialog.querySelector('.btnOption[data-id="ok"]');
    if (okBtn && !okBtn.dataset.hiddenByScript) {
      okBtn.style.display = 'none';
      okBtn.dataset.hiddenByScript = '1';
    }
  }

  function onNavigate() {
    if (!window.location.hash.startsWith('#/login')) {
      quickConnectClicked = false;
    }
    updateHideStyle();
    checkAndRedirect();
  }

  // Intercept History API (used by Jellyfin's SPA router)
  const _push = history.pushState.bind(history);
  history.pushState = function (...args) {
    _push(...args);
    onNavigate();
  };
  const _replace = history.replaceState.bind(history);
  history.replaceState = function (...args) {
    _replace(...args);
    onNavigate();
  };
  window.addEventListener('popstate', onNavigate);

  // Observe DOM for the login page / quick connect dialog appearing
  const observer = new MutationObserver(() => {
    autoClickQuickConnect();
    hideQuickConnectOkButton();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial run
  onNavigate();
  autoClickQuickConnect();
  hideQuickConnectOkButton();
})();