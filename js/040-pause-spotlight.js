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
