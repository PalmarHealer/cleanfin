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

/* === 080-overview-expander (toggle: window.cleanFin.features.overviewExpander = false) === */
if (window.cleanFin.features.overviewExpander === true) {
/**
 * Jellyfin Enhancement: Overview expander
 *
 * Two fixes for the "Mehr anzeigen" / "Show more" description toggle:
 *
 *  1. The text start no longer jumps. Jellyfin's collapsed state uses
 *     `display: flow-root` with a 0.25em margin on the inner <p>, and the
 *     expanded state uses `display: block` with a 1em margin. Because
 *     `block` lets that inner margin collapse out to the parent, the
 *     container moved up 6.8px while the text moved down 4.4px. Pinning
 *     both states to `flow-root` with zeroed inner margins keeps the first
 *     line exactly where it was; the intended offset comes from padding,
 *     which never collapses.
 *
 *  2. The height is animated between the two states. The collapsed height
 *     is read from the live element rather than derived from
 *     `-webkit-line-clamp`, because the effective line count varies with
 *     the breakpoint and the clamp does not always apply at all.
 */
(function () {
    'use strict';

    var DURATION = 350;
    var EASING = 'cubic-bezier(.4, 0, .2, 1)';

    var style = document.createElement('style');
    style.id = 'cf-overview-expander';
    style.textContent = [
        /* identical box model in both states, so nothing shifts on toggle */
        '.overview{display:flow-root;margin-top:0!important;padding-top:.35em;overflow:hidden}',
        '.overview>bdi>p{margin-top:0!important;margin-bottom:0!important}',
        '.overview.cf-ov-animating{transition:height ' + (DURATION / 1000) + 's ' + EASING + '}'
    ].join('');
    document.head.appendChild(style);

    function animate(el, from, to) {
        var finished = false;

        function finish() {
            if (finished) return;
            finished = true;
            el.removeEventListener('transitionend', onEnd);
            el.classList.remove('cf-ov-animating');
            el.style.height = '';
        }

        function onEnd(e) {
            if (e.target === el && e.propertyName === 'height') finish();
        }

        el.style.height = from + 'px';
        el.classList.add('cf-ov-animating');
        el.addEventListener('transitionend', onEnd);

        // two frames: the first commits the start height, the second starts the transition
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                el.style.height = to + 'px';
            });
        });

        // safety net for the case where transitionend never fires
        setTimeout(finish, DURATION + 150);
    }

    document.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest && e.target.closest('.overview-expand');
        if (!btn) return;

        var scope = btn.closest('.detailSectionContent') || btn.parentElement;
        var ov = scope && scope.querySelector('.overview');
        if (!ov) return;

        // capture phase: Jellyfin has not toggled the class yet
        var from = ov.getBoundingClientRect().height;

        requestAnimationFrame(function () {
            ov.style.height = '';
            var to = ov.getBoundingClientRect().height;
            if (Math.abs(to - from) < 1) return;   // nothing actually changed
            animate(ov, from, to);
        });
    }, true);
})();
}

/* === 090-media-specs (toggle: window.cleanFin.features.mediaSpecs = false) === */
if (window.cleanFin.features.mediaSpecs === true) {
/**
 * Jellyfin Enhancement: Media specs
 *
 * Rewrites the Video / Audio / Subtitle track dropdowns on detail pages into
 * one consistent, readable form:
 *
 *   6 Mbps AVC MPEG-4 - 1080p - H264 - SDR              ->  Full HD (1080p)
 *   tvp-sherlock-s01e01-br-1080p - H264 - SDR           ->  Full HD (1080p)
 *   5.1 AC3 @ 640 kbps - German - Dolby Digital - Std.  ->  Deutsch · Dolby Digital 5.1
 *   German - Dolby Digital Plus + Dolby Atmos - 5.1     ->  Deutsch · Dolby Atmos 5.1
 *   Commentary - German - DVDSUB                        ->  Deutsch · Commentary · Bild
 *   German Forced - Standard - Erzwungen - SUBRIP       ->  Deutsch · Forced
 *
 * Labels are built from the structured MediaStreams the API already returned,
 * not by parsing the rendered text: `option.value` carries the stream index,
 * which maps straight onto a stream. Regex is used for one job only — deciding
 * whether an embedded stream Title carries meaning ("Commentary", "Forced",
 * "SDH") or is release-group noise to be dropped.
 */
(function () {
    'use strict';

    var SEP = ' · ';

    /* ---------- language ---------- */

    var LANGUAGES = {
        deu: 'Deutsch', ger: 'Deutsch', de: 'Deutsch',
        eng: 'Englisch', en: 'Englisch',
        fra: 'Französisch', fre: 'Französisch', fr: 'Französisch',
        spa: 'Spanisch', es: 'Spanisch',
        ita: 'Italienisch', it: 'Italienisch',
        nld: 'Niederländisch', dut: 'Niederländisch', nl: 'Niederländisch',
        por: 'Portugiesisch', pt: 'Portugiesisch',
        pol: 'Polnisch', pl: 'Polnisch',
        rus: 'Russisch', ru: 'Russisch',
        tur: 'Türkisch', tr: 'Türkisch',
        jpn: 'Japanisch', ja: 'Japanisch',
        kor: 'Koreanisch', ko: 'Koreanisch',
        zho: 'Chinesisch', chi: 'Chinesisch', zh: 'Chinesisch',
        ara: 'Arabisch', ar: 'Arabisch',
        ces: 'Tschechisch', cze: 'Tschechisch',
        dan: 'Dänisch', fin: 'Finnisch', swe: 'Schwedisch',
        nor: 'Norwegisch', nob: 'Norwegisch',
        hun: 'Ungarisch', ell: 'Griechisch', gre: 'Griechisch',
        heb: 'Hebräisch', hin: 'Hindi', tha: 'Thai',
        ukr: 'Ukrainisch', ron: 'Rumänisch', rum: 'Rumänisch',
        bul: 'Bulgarisch', hrv: 'Kroatisch', srp: 'Serbisch',
        slk: 'Slowakisch', slo: 'Slowakisch', slv: 'Slowenisch',
        vie: 'Vietnamesisch', ind: 'Indonesisch', msa: 'Malaiisch',
        mul: 'Mehrsprachig', und: ''
    };

    function languageName(code) {
        if (!code) return '';
        var key = String(code).toLowerCase();
        if (Object.prototype.hasOwnProperty.call(LANGUAGES, key)) return LANGUAGES[key];
        try {
            var dn = new Intl.DisplayNames(['de'], { type: 'language' });
            var name = dn.of(key);
            if (name && name.toLowerCase() !== key) return name;
        } catch (e) { /* Intl may not know the code */ }
        return key.toUpperCase();
    }

    /* ---------- video ---------- */

    // Mapped on width, not height: letterboxed scope prints are shorter than
    // their class suggests (1920x816 is still 1080p, not 576p).
    function resolutionName(stream) {
        var w = stream.Width || 0;
        var h = stream.Height || 0;
        if (!w && !h) return '';
        if (!w) w = Math.round(h * 16 / 9);

        if (w >= 7000) return 'UHD 8K (4320p)';
        if (w >= 3400) return 'UHD 4K (2160p)';
        if (w >= 2400) return 'QHD (1440p)';
        if (w >= 1700) return 'Full HD (1080p)';
        if (w >= 1200) return 'HD (720p)';
        if (w >= 900)  return 'SD (576p)';
        return 'SD (480p)';
    }

    /* ---------- audio ---------- */

    function audioFormat(stream) {
        var codec = String(stream.Codec || '').toLowerCase();
        var profile = String(stream.Profile || '');

        if (/atmos/i.test(profile)) return 'Dolby Atmos';
        if (/dts[-\s]?x/i.test(profile)) return 'DTS:X';

        switch (codec) {
            case 'truehd': return 'Dolby TrueHD';
            case 'eac3':   return 'Dolby Digital Plus';
            case 'ac3':    return 'Dolby Digital';
            case 'dts':
                if (/ma\b|master/i.test(profile)) return 'DTS-HD MA';
                if (/hra|high.?res/i.test(profile)) return 'DTS-HD HR';
                return 'DTS';
            case 'aac':    return 'AAC';
            case 'flac':   return 'FLAC';
            case 'opus':   return 'Opus';
            case 'vorbis': return 'Vorbis';
            case 'mp3':    return 'MP3';
            case 'mp2':    return 'MP2';
            case 'pcm':
            case 'pcm_s16le':
            case 'pcm_s24le': return 'PCM';
            default: return codec ? codec.toUpperCase() : '';
        }
    }

    function channelName(stream) {
        var layout = String(stream.ChannelLayout || '').toLowerCase();
        if (layout === 'mono') return '1.0';
        if (layout === 'stereo') return '2.0';
        if (/^\d(\.\d)?$/.test(layout)) return layout;

        var n = stream.Channels || 0;
        if (n === 1) return '1.0';
        if (n === 2) return '2.0';
        if (n === 6) return '5.1';
        if (n === 8) return '7.1';
        return n ? n + 'ch' : '';
    }

    /* ---------- subtitles ---------- */

    // Bitmap subtitles are pre-rendered images: they cannot follow the user's
    // subtitle styling and may force the server to transcode, so they are the
    // one format worth surfacing. Text formats stay unlabelled.
    var BITMAP_CODECS = /^(dvdsub|dvd_subtitle|vobsub|pgssub|pgs|hdmv_pgs_subtitle|dvbsub|dvb_subtitle|xsub)$/i;

    function isBitmapSubtitle(stream) {
        return BITMAP_CODECS.test(String(stream.Codec || ''));
    }

    /* ---------- stream title: meaning vs. noise ---------- */

    var MARKERS = [
        { re: /\b(commentary|kommentar(e|spur)?|audiokommentar)\b/i, label: 'Commentary' },
        { re: /\b(forced|erzwungen|forcé)\b/i,                  label: 'Forced' },
        { re: /\b(sdh|cc|hearing[\s-]?impaired|hörgeschädigt|gehörlose)\b/i, label: 'SDH' },
        { re: /\b(karaoke|songs?|lyrics|signs?)\b/i,                 label: 'Signs & Songs' }
    ];

    // Titles that only say "this is the normal track". A track without a
    // Forced marker already is the full one, so the word adds nothing —
    // and left in, it reads as a stray lowercase label ("Deutsch · komplett").
    var REDUNDANT = /^(komplett|kompletto?|complete|full|voll|vollständig|standard|default|normal|main|haupt|regular|dialogue|dialog)$/i;

    // Titles that only restate technical data, or are a release/file name.
    var NOISE = [
        /^\s*\d+(\.\d+)?\s*(k|m)?bps\b/i,        // "6 Mbps ..."
        /\b(avc|hevc|h\.?26[45]|mpeg-?[24]|xvid|divx|vp9|av1)\b/i,
        /\b(ac3|eac3|dts|aac|flac|truehd|opus|mp3)\b/i,
        /\b\d\.\d\b/,                             // "5.1"
        /\b(4k|2160p|1080[pi]|720p|576[pi]|480[pi])\b/i,
        /\b(bluray|blu-ray|bdrip|brrip|web-?dl|webrip|hdtv|dvdrip|remux)\b/i,
        /-(?:[a-z0-9]+)$/i,                       // trailing release group
        /^[a-z0-9]+(?:[.\-_][a-z0-9]+){3,}$/i     // dotted/dashed file name
    ];

    function markersFrom(stream) {
        var out = [];
        var title = stream.Title || '';

        // Only meaningful for subtitles. Jellyfin also reports IsForced on
        // default audio tracks, where it means "default", not "forced".
        if (stream.IsForced && stream.Type === 'Subtitle') out.push('Forced');

        for (var i = 0; i < MARKERS.length; i++) {
            if (MARKERS[i].re.test(title) && out.indexOf(MARKERS[i].label) === -1) {
                out.push(MARKERS[i].label);
            }
        }
        return out;
    }

    /* ---------- regional variants ---------- */

    // English names of the languages we translate, so a title that merely
    // repeats the language can be recognised as redundant.
    var ENGLISH_NAMES = {
        deu: 'german', ger: 'german', eng: 'english', fra: 'french', fre: 'french',
        spa: 'spanish', ita: 'italian', nld: 'dutch', dut: 'dutch', por: 'portuguese',
        pol: 'polish', rus: 'russian', tur: 'turkish', jpn: 'japanese', kor: 'korean',
        zho: 'chinese', chi: 'chinese', ara: 'arabic', ces: 'czech', cze: 'czech',
        dan: 'danish', fin: 'finnish', swe: 'swedish', nor: 'norwegian', nob: 'norwegian',
        hun: 'hungarian', ell: 'greek', gre: 'greek', heb: 'hebrew', hin: 'hindi',
        tha: 'thai', ukr: 'ukrainian', ron: 'romanian', rum: 'romanian', bul: 'bulgarian',
        hrv: 'croatian', srp: 'serbian', slk: 'slovak', slo: 'slovak', slv: 'slovenian',
        vie: 'vietnamese', ind: 'indonesian', msa: 'malay', cat: 'catalan'
    };

    var QUALIFIERS = {
        'european': 'Europa',
        'brazilian': 'Brasilien',
        'latin american': 'Lateinamerika',
        'latin': 'Lateinamerika',
        'castilian': 'Kastilisch',
        'canadian': 'Kanada',
        'mexican': 'Mexiko',
        'simplified': 'vereinfacht',
        'traditional': 'traditionell',
        'mandarin': 'Mandarin',
        'cantonese': 'Kantonesisch'
    };

    function englishName(code) {
        var key = String(code || '').toLowerCase();
        if (ENGLISH_NAMES[key]) return ENGLISH_NAMES[key];
        try {
            var n = new Intl.DisplayNames(['en'], { type: 'language' }).of(key);
            if (n && n.toLowerCase() !== key) return n.toLowerCase();
        } catch (e) { /* unknown code */ }
        return '';
    }

    // "European Spanish" -> "Europa", "Dutch" -> "" (pure repetition),
    // "Brazilian Portuguese" -> "Brasilien".
    function regionalQualifier(stream) {
        var title = String(stream.Title || '').trim().toLowerCase();
        var name = englishName(stream.Language);
        if (!title || !name || title.indexOf(name) === -1) return null;

        var rest = title.replace(name, '').replace(/[()\-,]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!rest) return '';                       // title was just the language

        // Whatever is left may be a marker ("German Forced", "German SDH")
        // rather than a region; those belong to markersFrom(), not here.
        for (var i = 0; i < MARKERS.length; i++) {
            if (MARKERS[i].re.test(rest)) return '';
        }

        if (QUALIFIERS[rest]) return QUALIFIERS[rest];
        return rest.charAt(0).toUpperCase() + rest.slice(1);
    }

    // A title is kept as free text only when it says something the structured
    // fields do not, and does not look like a release name.
    function meaningfulTitle(stream) {
        var title = String(stream.Title || '').trim();
        if (!title || title.length > 40) return '';

        if (REDUNDANT.test(title)) return '';
        for (var i = 0; i < MARKERS.length; i++) if (MARKERS[i].re.test(title)) return '';
        for (var j = 0; j < NOISE.length; j++) if (NOISE[j].test(title)) return '';

        // A title that just repeats the language adds nothing; one that narrows
        // it ("European Spanish") is kept as a parenthesised qualifier, because
        // dropping it would merge genuinely different tracks during dedupe.
        // Handled by languagePart(), which folds it into the language name.
        if (regionalQualifier(stream) !== null) return '';

        var lang = languageName(stream.Language);
        if (lang && title.toLowerCase() === lang.toLowerCase()) return '';

        // Embedded titles are often all-lowercase; match the rest of the label.
        return title.charAt(0).toUpperCase() + title.slice(1);
    }

    // "Spanisch (Europa)" rather than "Spanisch · Europa".
    function languagePart(stream) {
        var name = languageName(stream.Language);
        var qualifier = regionalQualifier(stream);
        if (!name) return qualifier || '';
        return qualifier ? name + ' (' + qualifier + ')' : name;
    }

    /* ---------- label builders ---------- */

    function join(parts) {
        return parts.filter(function (p) { return p; }).join(SEP);
    }

    function videoLabel(stream) {
        return join([resolutionName(stream)]) || 'Video';
    }

    function audioLabel(stream) {
        var format = audioFormat(stream);
        var channels = channelName(stream);
        var spec = format && channels ? format + ' ' + channels : (format || channels);
        return join([languagePart(stream), meaningfulTitle(stream)]
            .concat(markersFrom(stream))
            .concat([spec])) || 'Audio';
    }

    function subtitleLabel(stream) {
        return join([languagePart(stream), meaningfulTitle(stream)]
            .concat(markersFrom(stream))
            .concat([isBitmapSubtitle(stream) ? 'Bild' : ''])) || 'Untertitel';
    }

    /* ---------- applying it to the page ---------- */

    var LABEL_FOR = {
        Video:    videoLabel,
        Audio:    audioLabel,
        Subtitle: subtitleLabel
    };

    var KIND = [
        { cls: 'selectVideo',     type: 'Video' },
        { cls: 'selectAudio',     type: 'Audio' },
        { cls: 'selectSubtitles', type: 'Subtitle' }
    ];

    function streamMap(streams) {
        var map = {};
        (streams || []).forEach(function (s) { map[s.Index] = s; });
        return map;
    }

    function applyToSelect(select, kind, map) {
        var seen = {};
        var drop = [];

        Array.prototype.forEach.call(select.options, function (opt) {
            var stream = map[parseInt(opt.value, 10)];
            if (!stream || stream.Type !== kind.type) return;   // e.g. the "Aus" entry

            var label = LABEL_FOR[kind.type](stream);
            if (opt.textContent !== label) opt.textContent = label;

            // Collapse tracks that end up identical (KPop Demon Hunters ships 53
            // subtitle streams, many of them the same language and format).
            if (seen[label] && !opt.selected) drop.push(opt);
            else seen[label] = true;
        });

        drop.forEach(function (o) { o.remove(); });
        return drop.length;
    }

    function decorate(page, item) {
        (item.MediaSources || []).forEach(function (source) {
            var map = streamMap(source.MediaStreams);
            KIND.forEach(function (kind) {
                Array.prototype.forEach.call(page.querySelectorAll('select.' + kind.cls), function (select) {
                    if (select.dataset.cfSpecs === source.Id) return;
                    var before = select.options.length;
                    applyToSelect(select, kind, map);
                    // only claim the select once it actually matched this source
                    if (select.options.length !== before || before > 0) select.dataset.cfSpecs = source.Id;
                });
            });
        });
    }

    function currentItemId() {
        var m = window.location.hash.match(/[?&]id=([a-f0-9]{32})/i);
        return m ? m[1] : null;
    }

    var lastRun = '';

    function run() {
        var api = window.ApiClient;
        if (!api || !api.getCurrentUserId || !api.getCurrentUserId()) return;

        var id = currentItemId();
        if (!id) return;

        var page = document.querySelector('.itemDetailPage:not(.hide)');
        if (!page) return;

        var pending = page.querySelector('select.selectAudio, select.selectVideo, select.selectSubtitles');
        if (!pending) return;

        var key = id + ':' + page.querySelectorAll('select.detailTrackSelect').length;
        if (key === lastRun) return;
        lastRun = key;

        api.getItem(api.getCurrentUserId(), id).then(function (item) {
            decorate(page, item);
        }, function () { lastRun = ''; });
    }

    /* ---------- applying it in the video player ---------- */

    // The player's Audio / Untertitel menus are actionsheets whose entries carry
    // the stream index in data-id, so the same labels apply. Only sheets opened
    // from those two buttons are touched, never every actionsheet: the playback
    // speed menu uses bare integers as data-id too ("1", "2", "3", "4"), and a
    // structural guess would happily rename "2x" into an audio track.

    var ARM_MS     = 3000;      // how long a track button's click keeps watching
    var MAP_TTL_MS = 5000;      // refetch window, so a new episode is picked up

    var osdMap = null;          // { map: <index -> stream>, at: <ms> }
    var osdFetching = false;

    // NowPlayingItem carries MediaStreams for the source actually playing, so
    // this is one request rather than a session lookup plus an item lookup.
    function refreshOsdMap() {
        var api = window.ApiClient;
        if (osdFetching || !api || !api.deviceId || !api.getJSON) return;

        osdFetching = true;
        api.getJSON(api.getUrl('Sessions', { DeviceId: api.deviceId() })).then(function (sessions) {
            osdFetching = false;
            for (var i = 0; i < (sessions || []).length; i++) {
                var playing = sessions[i].NowPlayingItem;
                if (playing && playing.MediaStreams) {
                    osdMap = { map: streamMap(playing.MediaStreams), at: Date.now() };
                    return;
                }
            }
        }, function () { osdFetching = false; });
    }

    function isChecked(item) {
        var icon = item.querySelector('.actionsheetMenuItemIcon');
        return !!icon && icon.style.visibility !== 'hidden';
    }

    function applyToSheet(sheet, type, map) {
        var seen = {};
        var drop = [];

        Array.prototype.forEach.call(sheet.querySelectorAll('.actionSheetMenuItem'), function (item) {
            var id = item.getAttribute('data-id');
            if (!/^\d+$/.test(id)) return;              // "Aus" (-1), "secondarysubtitle"

            var stream = map[parseInt(id, 10)];
            if (!stream || stream.Type !== type) return;

            var text = item.querySelector('.actionSheetItemText');
            if (!text) return;

            var label = LABEL_FOR[type](stream);
            if (text.textContent !== label) text.textContent = label;

            if (seen[label] && !isChecked(item)) drop.push(item);
            else seen[label] = true;
        });

        drop.forEach(function (i) { i.remove(); });
    }

    function decorateSheet(sheet, type) {
        if (!osdMap) return false;                   // session lookup still in flight
        applyToSheet(sheet, type, osdMap.map);
        return true;
    }

    // Sheets are appended into a .dialogContainer rather than straight onto the
    // body, so the subtree has to be watched — but only while a click is armed,
    // instead of keeping an observer on the whole document for the session.
    function watchForSheet(type) {
        var done = false;
        var observer = new MutationObserver(function (records) {
            records.forEach(function (record) {
                Array.prototype.forEach.call(record.addedNodes, function (node) {
                    if (done || node.nodeType !== 1) return;

                    var sheet = node.classList.contains('actionSheet')
                        ? node
                        : node.querySelector && node.querySelector('.actionSheet');
                    if (!sheet) return;

                    if (decorateSheet(sheet, type)) {
                        done = true;
                        observer.disconnect();
                        return;
                    }

                    // The map has not landed yet; keep trying while it is armed.
                    var retry = setInterval(function () {
                        if (done || !document.contains(sheet)) { clearInterval(retry); return; }
                        if (decorateSheet(sheet, type)) { done = true; clearInterval(retry); }
                    }, 50);
                    setTimeout(function () { clearInterval(retry); }, ARM_MS);
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(function () { observer.disconnect(); }, ARM_MS);
    }

    document.addEventListener('click', function (e) {
        var target = e.target;
        if (!target || !target.closest) return;

        var btn = target.closest('.btnSubtitles, .btnAudio');
        if (!btn) return;

        if (!osdMap || Date.now() - osdMap.at > MAP_TTL_MS) refreshOsdMap();
        watchForSheet(btn.classList.contains('btnAudio') ? 'Audio' : 'Subtitle');
    }, true);

    // Jellyfin rebuilds the selects asynchronously and reuses detail pages, so
    // poll rather than trying to catch a single render event.
    setInterval(function () {
        run();

        // Keep the player's stream map warm, so opening a track menu relabels it
        // in the same frame instead of flashing the raw Jellyfin text first.
        if (!document.querySelector('video')) osdMap = null;
        else if (!osdMap || Date.now() - osdMap.at > MAP_TTL_MS) refreshOsdMap();
    }, 300);
    window.addEventListener('hashchange', function () { lastRun = ''; });
})();
}

/* === 100-backdrop-guard (toggle: window.cleanFin.features.backdropGuard = false) === */
if (window.cleanFin.features.backdropGuard === true) {
/**
 * Jellyfin Enhancement: Backdrop guard
 *
 * The Media Bar plugin paints a full-page backdrop for its home-screen
 * slideshow (`.backdropImage.slideshow-page-backdrop`, sitting in Jellyfin's
 * global `.backdropContainer`, outside any page element). On navigation it
 * normally removes that element again — but the removal races with the
 * transition, and on a slow connection it consistently loses: the previous
 * slide's image stays up on the new page until something else repaints.
 *
 * The result is a detail page showing an unrelated title's artwork. Jellyfin's
 * own detail backdrop (`#itemBackdrop`) is empty at that moment, so the stale
 * slideshow image is what the viewer sees.
 *
 * This hides that element whenever the home screen is not the active page, so
 * the gap shows nothing instead of the wrong artwork. It is deliberately not
 * `display: none` — the plugin keeps managing the element, we only stop it
 * from being visible where it does not belong.
 */
(function () {
    'use strict';

    var CLASS = 'cf-hide-slideshow-backdrop';

    var style = document.createElement('style');
    style.id = 'cf-backdrop-guard';
    style.textContent =
        'html.' + CLASS + ' .slideshow-page-backdrop{' +
        'opacity:0!important;transition:none!important}';
    document.head.appendChild(style);

    function onHome() {
        // Route first: it flips before the DOM settles, which is the whole point.
        if (/^#\/(home|index\.html)?(\?|$)/.test(window.location.hash)) return true;
        if (/^#\/home/.test(window.location.hash)) return true;
        return !!document.querySelector('#indexPage:not(.hide)');
    }

    function update() {
        var hide = !onHome();
        var root = document.documentElement;
        if (root.classList.contains(CLASS) !== hide) root.classList.toggle(CLASS, hide);
    }

    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);

    // Jellyfin swaps pages asynchronously and the plugin can insert its backdrop
    // at any point during the transition, so re-check rather than trusting a
    // single event to be the last word.
    setInterval(update, 200);
    update();
})();
}
