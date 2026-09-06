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
