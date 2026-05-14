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
