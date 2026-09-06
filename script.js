/* cleanFin script bundle — toggle individual modules via:
   window.cleanFin = { features: { firefoxWarning: false } };
   (set this BEFORE this script loads) */
window.cleanFin = window.cleanFin || {};
window.cleanFin.features = window.cleanFin.features || {};


/* === 001-suppress-browser-logs (toggle: window.cleanFin.features.suppressBrowserLogs = false) === */
if (window.cleanFin.features.suppressBrowserLogs === true) {
/**
 * Jellyfin Enhancement: Suppress browser logs
 * Silences console.log/warn/error/info/debug so the browser console stays clean.
 */
(function () {
  console.log = function () {};
  console.warn = function () {};
  console.error = function () {};
  console.info = function () {};
  console.debug = function () {};
})();}

/* === 010-firefox-warning (toggle: window.cleanFin.features.firefoxWarning = false) === */
if (window.cleanFin.features.firefoxWarning === true) {
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
}

/* === 020-inline-search (toggle: window.cleanFin.features.inlineSearch = false) === */
if (window.cleanFin.features.inlineSearch === true) {
/**
 * Jellyfin Enhancement: Netflix-style Inline Search
 * Expanding search input in the navbar; navigates to the native #/search page.
 */
(function () {
    "use strict";

    let searchInput = null;
    let searchDebounce = null;
    let searchActive = false;
    let searchPrevHash = ""; // page to return to when search is dismissed
    let searchPlaceholder = ""; // localized, read from native input when available
    let searchClearNav = false; // true while we navigate back due to empty input

    function waitForApiClient(cb) {
        if (window.ApiClient && window.ApiClient.getCurrentUserId && window.ApiClient.getCurrentUserId()) {
            cb();
        } else {
            setTimeout(() => waitForApiClient(cb), 300);
        }
    }

    function getSearchQuery() {
        const m = window.location.hash.match(/[?&]query=([^&]*)/);
        return m ? decodeURIComponent(m[1]) : "";
    }

    function activateSearch() {
        if (searchActive) return;
        searchActive = true;
        // Remember where we came from, but never remember the search page itself
        if (!window.location.hash.startsWith("#/search")) {
            searchPrevHash = window.location.hash;
        }
        if (searchInput) {
            searchInput.classList.add("active");
            setTimeout(() => searchInput.focus(), 40);
        }
    }

    function deactivateSearch() {
        if (!searchActive) return;
        searchActive = false;
        clearTimeout(searchDebounce);
        if (searchInput) {
            searchInput.classList.remove("active");
            searchInput.value = "";
        }
        if (window.location.hash.startsWith("#/search")) {
            window.location.hash = searchPrevHash || "/home";
        }
    }

    function injectSearchInput() {
        document.getElementById("jf-search-input")?.remove();
        searchInput = null;

        const btn = document.querySelector(".headerSearchButton");
        if (!btn) return;

        // Pick up the localized placeholder from the native search input whenever it's in the DOM
        const native = document.querySelector("#searchTextInput");
        if (native?.placeholder) searchPlaceholder = native.placeholder;

        const input = document.createElement("input");
        input.id = "jf-search-input";
        input.type = "text";
        input.placeholder = searchPlaceholder || "Suche";
        btn.parentNode.insertBefore(input, btn);
        searchInput = input;

        // Restore state after SPA re-render (e.g. search page updates results)
        if (searchActive) {
            input.classList.add("active");
            const q = getSearchQuery();
            if (q) input.value = q;
            setTimeout(() => input.focus(), 40);
        }

        input.addEventListener("input", () => {
            const q = input.value.trim();
            clearTimeout(searchDebounce);
            if (!q) {
                // Navigate back to previous page but keep the bar open and focused
                if (window.location.hash.startsWith("#/search")) {
                    searchClearNav = true;
                    window.location.hash = searchPrevHash || "/home";
                }
                return;
            }
            searchDebounce = setTimeout(() => {
                const newHash = `/search?query=${encodeURIComponent(q)}`;
                if (window.location.hash !== "#" + newHash) {
                    window.location.hash = newHash;
                }
            }, 300);
        });

        input.addEventListener("blur", () => {
            // Ignore blur caused by the element being removed from the DOM
            // (happens when injectSearchInput re-injects after SPA navigation)
            if (!document.contains(input)) return;
            // Ignore blur caused by our own back-navigation (hash change steals focus
            // while the input is still in the DOM with an empty value)
            if (searchClearNav) return;
            if (!input.value.trim()) deactivateSearch();
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Escape") deactivateSearch();
        });
    }

    function bindSearchButton() {
        const btn = document.querySelector(".headerSearchButton");
        if (!btn || btn._jfSearch) return;
        btn._jfSearch = true;
        if (!document.getElementById("jf-search-input")) injectSearchInput();

        // Prevent mousedown from stealing focus away from the input before click fires.
        // Without this, blur fires first (empty value → deactivateSearch), then click
        // sees searchActive=false and re-opens instead of closing.
        btn.addEventListener(
            "mousedown",
            (e) => {
                if (searchActive) e.preventDefault();
            },
            true
        );

        btn.addEventListener(
            "click",
            (e) => {
                e.stopImmediatePropagation();
                e.preventDefault();
                searchActive ? deactivateSearch() : activateSearch();
            },
            true
        );
    }

    // Sync input state when user navigates via hash (back button, clicking a result, etc.)
    window.addEventListener("hashchange", () => {
        const wasClearNav = searchClearNav;
        if (searchClearNav) searchClearNav = false;

        const onSearch = window.location.hash.startsWith("#/search");
        const onVideo = window.location.hash.startsWith("#/video");

        // Close search bar immediately when video playback starts
        if (onVideo && searchActive) {
            searchActive = false;
            clearTimeout(searchDebounce);
            if (searchInput) {
                searchInput.classList.remove("active");
                searchInput.value = "";
            }
            return;
        }

        if (onSearch && !searchActive) {
            // Arrived at search page (e.g. direct link) — activate navbar input
            activateSearch();
            if (searchInput) {
                const q = getSearchQuery();
                if (q) searchInput.value = q;
            }
        } else if (!onSearch && searchActive) {
            if (wasClearNav) {
                // We navigated back because the input was cleared — keep the bar open
                // and restore focus so the user can keep typing
                setTimeout(() => {
                    if (searchInput) searchInput.focus();
                }, 40);
            } else {
                // Left the search page (clicked a result, back button) — collapse input
                searchActive = false;
                clearTimeout(searchDebounce);
                if (searchInput) {
                    searchInput.classList.remove("active");
                    searchInput.value = "";
                }
            }
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") deactivateSearch();
    });

    waitForApiClient(() => {
        injectSearchInput();
        bindSearchButton();
        if (window.location.hash.startsWith("#/search")) {
            activateSearch();
            if (searchInput) {
                const q = getSearchQuery();
                if (q) searchInput.value = q;
            }
        }
        new MutationObserver(() => {
            const sb = document.querySelector(".headerSearchButton");
            if (sb && !sb._jfSearch) bindSearchButton();
            if (sb && !document.getElementById("jf-search-input")) injectSearchInput();
        }).observe(document.body, { childList: true, subtree: true });
    });
})();
}

/* === 030-inline-profile (toggle: window.cleanFin.features.inlineProfile = false) === */
if (window.cleanFin.features.inlineProfile === true) {
/**
 * Jellyfin Enhancement: Profile Dropdown
 * Dynamic quick-action menu scraped from #/mypreferencesmenu via hidden iframe.
 */
(function () {
  'use strict';

  let profileDropdown    = null;
  let profileMenuPromise = null; // kicked off at bootstrap, shared by all callers

  function waitForApiClient(cb) {
    if (window.ApiClient && window.ApiClient.getCurrentUserId && window.ApiClient.getCurrentUserId()) {
      cb();
    } else {
      setTimeout(() => waitForApiClient(cb), 300);
    }
  }

  /**
   * Load menu sections from #/mypreferencesmenu via a hidden iframe.
   * Returns a Promise<{ heading, links[] }[] | null>.
   * Calling this multiple times always returns the same Promise.
   */
  function loadProfileMenuItems() {
    if (profileMenuPromise) return profileMenuPromise;

    profileMenuPromise = new Promise(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;opacity:0;pointer-events:none;border:none;';
      iframe.src = `${window.location.origin}/web/#/mypreferencesmenu`;
      document.body.appendChild(iframe);

      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          // h2.headerUsername only exists once the preferences page has rendered
          if (doc.querySelectorAll('h2.headerUsername').length >= 1) {
            const sections = [];
            doc.querySelectorAll('.verticalSection').forEach(sec => {
              const h2 = sec.querySelector('h2.headerUsername');
              if (!h2) return;
              const links = Array.from(sec.querySelectorAll('a.emby-button[href]')).map(a => ({
                label:        a.querySelector('.listItemBodyText')?.textContent.trim() || a.textContent.trim().substring(0, 60),
                href:         a.getAttribute('href'),
                listItemHTML: a.querySelector('.listItem')?.outerHTML || '',
                isLogout:     a.classList.contains('btnLogout')
              })).filter(x => x.label);

              if (links.length) sections.push({ heading: h2.textContent.trim(), links });
            });
            clearInterval(timer);
            try { document.body.removeChild(iframe); } catch {}
            resolve(sections);
          }
        } catch { /* iframe not ready */ }

        if (attempts >= 40) {        // ~8 s timeout → fall back to static
          clearInterval(timer);
          try { document.body.removeChild(iframe); } catch {}
          resolve(null);
        }
      }, 200);
    });

    return profileMenuPromise;
  }

  function ensureProfileDropdown() {
    if (!document.getElementById('jf-profile-dropdown')) {
      const dd = document.createElement('div');
      dd.id = 'jf-profile-dropdown';
      document.body.appendChild(dd);
    }
    profileDropdown = document.getElementById('jf-profile-dropdown');
  }

  function renderProfileDropdown(sections) {
    if (!profileDropdown) return;
    profileDropdown.innerHTML = '';

    // Static fallback if iframe timed out
    if (!sections) {
      sections = [{
        heading: null,
        links: [
          { label: 'Einstellungen', href: '#/usersettings', listItemHTML: '<div class="listItem"><span class="material-icons listItemIcon listItemIcon-transparent settings" aria-hidden="true"></span><div class="listItemBody"><div class="listItemBodyText">Einstellungen</div></div></div>', isLogout: false },
          { label: 'Abmelden',      href: '#',              listItemHTML: '<div class="listItem"><span class="material-icons listItemIcon listItemIcon-transparent exit_to_app" aria-hidden="true"></span><div class="listItemBody"><div class="listItemBodyText">Abmelden</div></div></div>',      isLogout: true  }
        ]
      }];
    }

    sections.forEach((section, si) => {
      if (si > 0) {
        const hr = document.createElement('div');
        hr.style.cssText = 'height:1px;background:rgba(255,255,255,0.07);margin:6px 0;';
        profileDropdown.appendChild(hr);
      }

      if (section.heading) {
        const cap = document.createElement('div');
        cap.textContent = section.heading;
        cap.style.cssText = 'padding:6px 16px 4px;color:rgba(255,255,255,0.38);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;';
        profileDropdown.appendChild(cap);
      }

      section.links.forEach(item => {
        const row = document.createElement('div');
        row.style.cssText = 'cursor:pointer;transition:background 0.15s;white-space:nowrap;';
        row.innerHTML = item.listItemHTML;
        row.addEventListener('mouseenter', () => row.style.background = 'rgba(255,255,255,0.08)');
        row.addEventListener('mouseleave', () => row.style.background = '');
        row.addEventListener('click', () => {
          hideProfile();
          if (item.isLogout) {
            window.ApiClient.logout().then(() => window.location.reload());
          } else {
            window.location.hash = item.href.replace(/^#/, '');
          }
        });
        profileDropdown.appendChild(row);
      });
    });
  }

  function hideProfile() {
    if (profileDropdown) profileDropdown.style.display = 'none';
  }

  function bindProfileButton() {
    const btn = document.querySelector('.headerUserButton');
    if (!btn || btn._jfProfile) return;
    btn._jfProfile = true;

    btn.addEventListener('click', async e => {
      e.stopImmediatePropagation();
      e.preventDefault();

      ensureProfileDropdown();

      if (profileDropdown.style.display !== 'none') {
        hideProfile();
        return;
      }

      // Position just below the button
      const rect = btn.getBoundingClientRect();
      profileDropdown.style.top   = (rect.bottom + 6) + 'px';
      profileDropdown.style.right = (window.innerWidth - rect.right) + 'px';
      profileDropdown.style.left  = 'auto';
      profileDropdown.style.display = 'block';

      const sections = await loadProfileMenuItems();
      renderProfileDropdown(sections);
    }, true);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideProfile();
  });

  document.addEventListener('mousedown', e => {
    if (profileDropdown?.style.display !== 'none') {
      const btn = document.querySelector('.headerUserButton');
      if (!profileDropdown.contains(e.target) && !btn?.contains(e.target)) {
        hideProfile();
      }
    }
  });

  waitForApiClient(() => {
    loadProfileMenuItems(); // preload in background — ready before first click
    ensureProfileDropdown();
    bindProfileButton();
    new MutationObserver(() => {
      const pb = document.querySelector('.headerUserButton');
      if (pb && !pb._jfProfile) bindProfileButton();
    }).observe(document.body, { childList: true, subtree: true });
  });

})();
}

/* === 040-pause-spotlight (toggle: window.cleanFin.features.pauseSpotlight = false) === */
if (window.cleanFin.features.pauseSpotlight === true) {
/**
 * Jellyfin Enhancement: Pause Spotlight
 * Shows a cinematic overlay (logo, metadata, overview) when playback is paused
 * and the user has been idle for 10 seconds.
 */
(() => {
    if (window.__pauseInfoInstalled) return;
    window.__pauseInfoInstalled = true;

    const IDLE_MS = 10000;

    const style = document.createElement("style");
    style.id = "pauseInfoStyle";
    style.textContent = `
      #pauseInfoOverlay {
        position: fixed; inset: 0; z-index: 9998;
        pointer-events: none; color: #fff; font-family: inherit;
        background: linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 90%);
        display: flex; align-items: center;
        opacity: 0; visibility: hidden;
        transition: opacity .45s ease, visibility 0s linear .45s;
      }
      #pauseInfoOverlay.show {
        opacity: 1; visibility: visible;
        transition: opacity .45s ease, visibility 0s;
      }
      #pauseInfoOverlay .pi-card {
        margin-left: 5vw; max-width: 55vw;
        display: flex; flex-direction: column; align-items: flex-start;
        gap: 16px; text-align: left;
        transform-origin: left center;
        transform: scale(1.18);
        transition: transform .45s cubic-bezier(.2,.7,.2,1);
      }
      #pauseInfoOverlay.show .pi-card    { transform: scale(1); }
      #pauseInfoOverlay.leaving .pi-card { transform: scale(1.18); }
      #pauseInfoOverlay .pi-logo {
        max-height: 28vh; max-width: 50vw;
        object-fit: contain; object-position: left center;
        filter: drop-shadow(0 6px 24px rgba(0,0,0,0.6));
      }
      #pauseInfoOverlay .pi-title-fallback {
        font-size: 4rem; font-weight: 700; line-height: 1; margin: 0;
        text-shadow: 0 4px 24px rgba(0,0,0,0.7);
      }
      #pauseInfoOverlay .pi-series {
        font-size: 1.05rem;
        opacity: .85;
        letter-spacing: .8px; text-transform: uppercase;
      }
      #pauseInfoOverlay .pi-subtitle {
        font-size: 1.7rem;
        font-weight: 500;
        margin: 0;
      }
      #pauseInfoOverlay .pi-row {
        display: flex;
        gap: 14px;
        font-size: .95rem;
        opacity: .85;
        flex-wrap: wrap;
      }
      #pauseInfoOverlay .pi-rating {
        background: rgba(255,255,255,0.14);
        padding: 2px 8px;
        border-radius: 4px;
      }
      #pauseInfoOverlay .pi-overview {
        font-size: 1.05rem;
        line-height: 1.45;
        max-width: 50vw; opacity: .92;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.id = "pauseInfoOverlay";
    overlay.innerHTML = `
      <div class="pi-card">
        <img class="pi-logo" alt="" style="display:none">
        <h1 class="pi-title-fallback" style="display:none"></h1>
        <div class="pi-series"></div>
        <h2 class="pi-subtitle" style="display:none"></h2>
        <div class="pi-row"></div>
        <div class="pi-overview"></div>
      </div>`;
    document.body.appendChild(overlay);

    const $ = (s) => overlay.querySelector(s);
    const fmtTime = (t) => {
        const m = Math.round(t / 600000000);
        return m < 60 ? m + "m" : Math.floor(m / 60) + "h " + (m % 60) + "m";
    };

    const state = { paused: false, lastActivity: performance.now(), timer: null, currentItem: null };
    let wasShown = false;

    function setShown(s) {
        if (s === wasShown) return;
        if (s) {
            overlay.classList.remove("leaving");
            overlay.classList.add("show");
        } else {
            overlay.classList.remove("show");
            overlay.classList.add("leaving");
            setTimeout(() => overlay.classList.remove("leaving"), 460);
        }
        wasShown = s;
    }

    function evaluate() {
        clearTimeout(state.timer);
        state.timer = null;
        if (!state.paused) {
            setShown(false);
            return;
        }
        const since = performance.now() - state.lastActivity;
        if (since >= IDLE_MS) setShown(true);
        else {
            setShown(false);
            state.timer = setTimeout(evaluate, IDLE_MS - since + 20);
        }
    }
    const bumpActivity = () => {
        state.lastActivity = performance.now();
        evaluate();
    };

    async function fetchNowPlaying() {
        try {
            const myDeviceId = ApiClient.deviceId();
            const sessions = await ApiClient.getSessions();
            return sessions.find((x) => x.DeviceId === myDeviceId && x.NowPlayingItem)?.NowPlayingItem || null;
        } catch {
            return null;
        }
    }
    const logoSourceId = (item) => (item.Type === "Episode" && item.SeriesId ? item.SeriesId : item.Id);

    function render(item) {
        state.currentItem = item;
        if (!item) return;
        const isEp = item.Type === "Episode";
        $(".pi-series").textContent = isEp
            ? `${item.SeriesName || ""}  ·  S${item.ParentIndexNumber}E${item.IndexNumber}`
            : "";
        $(".pi-series").style.display = isEp ? "" : "none";

        const logoEl = $(".pi-logo"),
            titleFb = $(".pi-title-fallback"),
            subtitle = $(".pi-subtitle");
        logoEl.style.display = "none";
        titleFb.style.display = "none";
        subtitle.style.display = "none";
        const logoUrl = ApiClient.getImageUrl(logoSourceId(item), { type: "Logo", quality: 90 });
        const probe = new Image();
        probe.onload = () => {
            logoEl.src = logoUrl;
            logoEl.style.display = "";
            if (isEp) {
                subtitle.textContent = item.Name || "";
                subtitle.style.display = "";
            }
        };
        probe.onerror = () => {
            titleFb.textContent = isEp ? item.SeriesName || "" : item.Name || "";
            titleFb.style.display = "";
            if (isEp) {
                subtitle.textContent = item.Name || "";
                subtitle.style.display = "";
            }
        };
        probe.src = logoUrl;

        const row = [];
        if (item.ProductionYear) row.push(`<span>${item.ProductionYear}</span>`);
        if (item.OfficialRating) row.push(`<span class="pi-rating">${item.OfficialRating}</span>`);
        if (item.CommunityRating) row.push(`<span>★ ${item.CommunityRating.toFixed(1)}</span>`);
        if (item.RunTimeTicks) row.push(`<span>${fmtTime(item.RunTimeTicks)}</span>`);
        if (item.Genres?.length) row.push(`<span>${item.Genres.slice(0, 3).join(" · ")}</span>`);
        $(".pi-row").innerHTML = row.join("");
        $(".pi-overview").textContent = item.Overview || "";
    }

    async function onPause(video) {
        if (video.ended || video.currentTime < 0.1) return;
        state.paused = true;
        state.lastActivity = performance.now();
        const np = await fetchNowPlaying();
        if (np) render(np);
        evaluate();
    }
    function onPlay() {
        state.paused = false;
        evaluate();
    }

    function attach(video) {
        if (video.__pauseInfoAttached) return;
        video.__pauseInfoAttached = true;
        video.addEventListener("pause", () => onPause(video));
        ["play", "playing", "ended", "emptied"].forEach((ev) => video.addEventListener(ev, onPlay));
        if (video.paused && video.currentTime > 0.1) onPause(video);
    }

    const onMove = () => bumpActivity();
    const onDocLeave = (e) => {
        if (!e.relatedTarget) evaluate();
    };
    const onDocEnter = () => bumpActivity();
    const onBlur = () => evaluate();

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("mouseleave", onDocLeave);
    document.addEventListener("mouseenter", onDocEnter);
    window.addEventListener("blur", onBlur);

    document.querySelectorAll("video").forEach(attach);
    new MutationObserver((muts) => {
        for (const m of muts)
            for (const n of m.addedNodes) {
                if (n.nodeType !== 1) continue;
                if (n.tagName === "VIDEO") attach(n);
                else n.querySelectorAll?.("video").forEach(attach);
            }
    }).observe(document.body, { childList: true, subtree: true });
})();
}

/* === 050-quick-connect-popup (toggle: window.cleanFin.features.quickConnectPopup = false) === */
if (window.cleanFin.features.quickConnectPopup === true) {
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

})();}

/* === 060-search-grid (toggle: window.cleanFin.features.searchGrid = false) === */
if (window.cleanFin.features.searchGrid === true) {
/**
 * Flat Search Grid
 *
 * The search page groups hits by type (Movies / Series / Episodes / ...) into horizontal
 * sliders. This script turns that into a single relevance-sorted wrapping grid and drops
 * hits that only exist because of Meilisearch typo tolerance.
 *
 * Approach: let Jellyfin render, then MOVE the real cards into our own .itemsContainer
 * instead of rebuilding markup. That keeps overlay buttons, favourites, context menu and
 * played-state working untouched.
 *
 * Relevance tiers (higher sorts first):
 *   4  title starts with the query
 *   3  a title word starts with the query
 *   2  a title word is within Levenshtein distance 1 of a query word -> real typos ("hary")
 *   1  match only in studio / genre / tag / tagline / overview -> intentionally kept
 *      ("Amblin" -> Ready Player One, "Neytiri" -> Avatar)
 *   0  none of the above -> dropped
 *
 * Two rules remove the remaining noise:
 *  - If exact title hits exist (tier >= 3), fuzzy hits (tier 2) are discarded. Someone who
 *    spells "dune" correctly does not want "Duke" and "Done". Fuzzy only kicks in when no
 *    exact title hit exists at all ("hary").
 *  - Episodes are collapsed: if only the series name matched, the episodes are dropped
 *    (otherwise "The Rookie" alone floods the grid with 145 tiles).
 *
 * The trigger is an interval rather than a MutationObserver: Jellyfin builds the search page
 * asynchronously and replaces .searchResults, which would leave an observer on a detached
 * node. Cards are tagged with data-nrq-seen so only new ones get processed.
 *
 * While a query is active the native sections are hidden by CSS from the very first paint,
 * so the grouped layout is never visible - otherwise it would flash before we move the cards.
 */
(function () {
    "use strict";

    var GRID = "nrqGrid";
    var ACTIVE = "nrq-active";
    var MIN_TYPO_LEN = 4;      // matches typoTolerance.minWordSizeForTypos.oneTypo = 4
    var meta = {};
    var lastQuery = null;
    var running = false;
    var strongSeries = {};   // per query: series that match well themselves (across batches)
    var sawExact = false;    // per query: was there a real title hit anywhere?

    /**
     * Hide the native grouped sections as soon as a query is active. Injected once and
     * toggled via a body class so the empty-query state still shows Jellyfin suggestions.
     */
    function installStyle() {
        if (document.getElementById("nrq-grid-style")) return;
        var st = document.createElement("style");
        st.id = "nrq-grid-style";
        st.textContent =
            "body." + ACTIVE + " #searchPage .searchResults > .verticalSection:not(." + GRID + ")" +
            "{display:none !important}";
        (document.head || document.documentElement).appendChild(st);
    }

    function setActive(on) {
        if (document.body) document.body.classList.toggle(ACTIVE, !!on);
    }

    function norm(s) {
        return (s || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9äöüß ]+/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    /** true when the Levenshtein distance is <= 1 (early exit). */
    function within1(a, b) {
        if (a === b) return true;
        var la = a.length, lb = b.length;
        if (Math.abs(la - lb) > 1) return false;
        var i = 0, j = 0, d = 0;
        while (i < la && j < lb) {
            if (a[i] === b[j]) { i++; j++; continue; }
            if (++d > 1) return false;
            if (la === lb) { i++; j++; } else if (la > lb) { i++; } else { j++; }
        }
        if (i < la || j < lb) d++;
        return d <= 1;
    }

    function getQuery() {
        var m = location.hash.match(/[?&]query=([^&]*)/);
        if (!m) return "";
        try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
    }

    function server() {
        try {
            var c = JSON.parse(localStorage.getItem("jellyfin_credentials") || "{}");
            var s = (c.Servers || [])[0];
            if (s && s.AccessToken && s.UserId) return s;
        } catch (e) { /* ignore */ }
        return null;
    }

    function cardTitle(card) {
        var a = card.querySelector(".cardText-first a, .cardText-first bdi");
        return (a && (a.getAttribute("title") || a.textContent)) || "";
    }

    /** Studios/overview are not in the DOM - fetch them for the tier-1 check. */
    function loadMeta(ids) {
        var srv = server();
        var missing = ids.filter(function (id) { return !(id in meta); });
        if (!srv || !missing.length) return Promise.resolve();
        var chunks = [];
        for (var i = 0; i < missing.length; i += 150) chunks.push(missing.slice(i, i + 150));
        return Promise.all(chunks.map(function (ch) {
            return fetch("/Items?userId=" + srv.UserId + "&ids=" + ch.join(",") +
                    "&fields=Overview,Studios,Genres,Tags,Taglines,OriginalTitle" +
                    "&enableImages=true&imageTypeLimit=1&enableUserData=false&enableTotalRecordCount=false",
                    { headers: { "X-Emby-Token": srv.AccessToken } })
                .then(function (r) { return r.json(); })
                .then(function (j) { (j.Items || []).forEach(function (it) { meta[it.Id] = it; }); })
                .catch(function () { /* without metadata score() falls back to the DOM title */ });
        })).then(function () {
            // /Items does not return people - remember them as empty so we stop refetching
            missing.forEach(function (id) { if (!(id in meta)) meta[id] = null; });
        });
    }

    function titleOf(card) {
        var m = meta[card.getAttribute("data-id")];
        var parts = [(m && m.Name) || cardTitle(card)];
        if (m && m.OriginalTitle) parts.push(m.OriginalTitle);
        return norm(parts.join(" "));
    }

    /**
     * Match on word boundaries only: the query has to start a word. Otherwise "hary" would
     * match inside "Zachary" and short queries match inside unrelated words.
     */
    function wordHit(haystack, q) {
        return (" " + haystack).indexOf(" " + q) !== -1;
    }

    function score(card, qn, qw) {
        var t = titleOf(card);
        if (t.indexOf(qn) === 0) return 4;
        if (wordHit(t, qn)) return 3;
        var tw = t.split(" ");
        var fuzzy = qw.length > 0 && qw.every(function (w) {
            return w.length >= MIN_TYPO_LEN && tw.some(function (x) { return within1(w, x); });
        });
        if (fuzzy) return 2;
        var m = meta[card.getAttribute("data-id")];
        if (m) {
            var other = norm([
                (m.Studios || []).map(function (s) { return s.Name; }).join(" "),
                (m.Genres || []).join(" "),
                (m.Tags || []).join(" "),
                (m.Taglines || []).join(" "),
                m.Overview || ""
            ].join(" "));
            if (wordHit(other, qn)) return 1;
        }
        return 0;
    }

    /** Switch overflow cards (horizontal sliders) to their wrapping variants. */
    function unwrap(card) {
        ["Portrait", "Backdrop", "Square", "Banner"].forEach(function (shape) {
            var lower = shape.charAt(0).toLowerCase() + shape.slice(1);
            if (card.classList.contains("overflow" + shape + "Card")) {
                card.classList.remove("overflow" + shape + "Card");
                card.classList.add(lower + "Card");
            }
            var p = card.querySelector(".cardPadder-overflow" + shape);
            if (p) {
                p.classList.remove("cardPadder-overflow" + shape);
                p.classList.add("cardPadder-" + lower);
            }
        });
    }

    /**
     * Moved cards lose Jellyfin's lazy loader: the poster would never load and the blurhash
     * canvas would never be removed. Do both ourselves - the image URL can be derived from
     * the item id, and a missing image just 404s, leaving the native placeholder icon.
     */
    function fixCardImages(root) {
        [].slice.call(root.querySelectorAll(".card[data-id]")).forEach(function (c) {
            var img = c.querySelector(".cardImageContainer");
            if (!img) return;
            if (!img.style.backgroundImage) {
                var m = meta[c.getAttribute("data-id")];
                var tag = m && m.ImageTags && m.ImageTags.Primary;
                img.style.backgroundImage = "url(\"/Items/" + c.getAttribute("data-id") +
                    "/Images/Primary?fillHeight=330&fillWidth=220&quality=96" +
                    (tag ? "&tag=" + tag : "") + "\")";
            }
            var cv = c.querySelector(".blurhash-canvas");
            if (cv) cv.parentNode.removeChild(cv);
        });
    }

    function ensureGrid(results) {
        var grid = results.querySelector("." + GRID);
        if (!grid) {
            grid = document.createElement("div");
            grid.className = "verticalSection " + GRID;
            var inner = document.createElement("div");
            // no "centered": partial rows start on the left instead of being centred
            inner.className = "itemsContainer vertical-wrap padded-left padded-right";
            grid.appendChild(inner);
            results.insertBefore(grid, results.firstChild);
        }
        return grid.querySelector(".itemsContainer");
    }

    function nativeSections(results) {
        return [].slice.call(results.querySelectorAll(".verticalSection")).filter(function (s) {
            return !s.classList.contains(GRID);
        });
    }

    function process(results, q) {
        var sections = nativeSections(results);
        var fresh = [];
        sections.forEach(function (sec) {
            [].slice.call(sec.querySelectorAll(".card[data-id]")).forEach(function (c) {
                if (!c.dataset.nrqSeen) fresh.push(c);
            });
        });
        if (!fresh.length) return Promise.resolve();

        var ids = [];
        fresh.forEach(function (c) {
            var id = c.getAttribute("data-id");
            if (id && ids.indexOf(id) === -1) ids.push(id);
        });

        return loadMeta(ids).then(function () {
            var qn = norm(q), qw = qn ? qn.split(" ") : [];
            var inner = ensureGrid(results);
            var already = {};
            [].slice.call(inner.children).forEach(function (c) {
                already[c.getAttribute("data-id")] = true;
            });

            var scored = [];
            fresh.forEach(function (c, i) {
                c.dataset.nrqSeen = "1";
                var id = c.getAttribute("data-id");
                if (already[id]) return;
                already[id] = true;
                scored.push({ card: c, id: id, idx: i, type: c.getAttribute("data-type"),
                              tier: score(c, qn, qw) });
            });

            // Remember exact hits and strong series across all batches of this query.
            // People do NOT count as an exact hit: otherwise a single "Mirna Haryati"
            // suppresses the fuzzy hits and searching "hary" would not find Harry Potter.
            scored.forEach(function (e) {
                if (e.tier >= 3 && e.type !== "Person") sawExact = true;
                if (e.type === "Series" && e.tier >= 2) strongSeries[titleOf(e.card)] = true;
            });

            var keep = scored.filter(function (e) {
                if (e.tier === 0) return false;
                // Spelled correctly? Then typo candidates are just noise.
                if (e.tier === 2 && sawExact) return false;
                if (e.type === "Episode" && !wordHit(titleOf(e.card), qn)) {
                    // Episode whose own title does not match. It only rides along on its
                    // series (name, overview, tags). Nobody wants that as 145 separate tiles,
                    // regardless of whether SeriesName came back in the API response.
                    var m = meta[e.id];
                    var series = norm((m && m.SeriesName) || "");
                    if (e.tier <= 1 || (series && strongSeries[series])) return false;
                }
                return true;
            });

            keep.sort(function (a, b) { return b.tier - a.tier || a.idx - b.idx; });
            keep.forEach(function (e) {
                e.card.dataset.nrqTier = String(e.tier);
                unwrap(e.card);
                inner.appendChild(e.card);
            });
        });
    }

    function restoreNative(results) {
        var grid = results.querySelector("." + GRID);
        if (grid) grid.parentNode.removeChild(grid);
    }

    function tick() {
        var results = document.querySelector("#searchPage .searchResults");
        var q = getQuery();
        setActive(!!q && !!document.querySelector("#searchPage"));

        if (!results) { lastQuery = null; return; }

        if (!q) {                       // empty query -> show Jellyfin suggestions again
            if (lastQuery !== null) { restoreNative(results); lastQuery = null; }
            return;
        }
        if (q !== lastQuery) {          // new query -> drop old grid and per-query state
            var old = results.querySelector("." + GRID);
            if (old) old.parentNode.removeChild(old);
            strongSeries = {};
            sawExact = false;
            lastQuery = q;
        }

        var existing = results.querySelector("." + GRID);
        if (existing) fixCardImages(existing);   // images arrive late, so re-check every tick

        if (running) return;
        running = true;
        process(results, q)
            .catch(function () { /* never take the search page down with us */ })
            .then(function () {
                var g = results.querySelector("." + GRID);
                if (g) fixCardImages(g);
                running = false;
            });
    }

    installStyle();
    // Update the body class synchronously on navigation so the native layout never paints.
    window.addEventListener("hashchange", function () { setActive(!!getQuery()); });
    setInterval(tick, 150);
    tick();
})();
}

/* === 070-auto-redirect (toggle: window.cleanFin.features.autoRedirect = false) === */
if (window.cleanFin.features.autoRedirect === true) {
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
})();}
