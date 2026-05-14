/* goodFin script bundle — toggle individual modules via:
   window.goodFin = { features: { firefoxWarning: false } };
   (set this BEFORE this script loads) */
window.goodFin = window.goodFin || {};
window.goodFin.features = window.goodFin.features || {};


/* === 001-suppress-browser-logs (toggle: window.goodFin.features.suppressBrowserLogs = false) === */
if (window.goodFin.features.suppressBrowserLogs === true) {
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

/* === 010-firefox-warning (toggle: window.goodFin.features.firefoxWarning = false) === */
if (window.goodFin.features.firefoxWarning === true) {
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
}

/* === 020-inline-search (toggle: window.goodFin.features.inlineSearch = false) === */
if (window.goodFin.features.inlineSearch === true) {
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

/* === 030-inline-profile (toggle: window.goodFin.features.inlineProfile = false) === */
if (window.goodFin.features.inlineProfile === true) {
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

/* === 040-pause-spotlight (toggle: window.goodFin.features.pauseSpotlight = false) === */
if (window.goodFin.features.pauseSpotlight === true) {
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
            const sessions = await ApiClient.getSessions({ ControllableByUserId: ApiClient.getCurrentUserId() });
            return sessions.find((x) => x.NowPlayingItem)?.NowPlayingItem || null;
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
