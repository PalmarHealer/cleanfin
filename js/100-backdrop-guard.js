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
