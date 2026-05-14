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
})();