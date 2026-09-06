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
